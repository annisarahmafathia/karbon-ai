import { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  ReminderScheduleInfo,
  ProcessRemindersReport,
  SendReminderResult,
} from "@/types/notifications";
import {
  generateReminderEmailHtml,
  generateReminderEmailPlainText,
} from "./email-template";

export const REMINDER_INTERVAL_DAYS = 7;
export const REMINDER_INTERVAL_MS = REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Format tanggal dan waktu dalam zona waktu Asia/Jakarta (WIB)
 */
export function formatWIB(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return String(dateInput);

  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " WIB"
  );
}

/**
 * Menghitung tanggal jadwal pengingat berikutnya (tepat 7 hari setelah kalkulasi disimpan)
 */
export function calculateNextReminderDate(lastCalculationDate: Date | string): Date {
  const d = typeof lastCalculationDate === "string" ? new Date(lastCalculationDate) : lastCalculationDate;
  return new Date(d.getTime() + REMINDER_INTERVAL_MS);
}

/**
 * Memeriksa apakah waktu sekarang sudah mencapai atau melewati jadwal 7 hari
 */
export function isReminderDue(lastCalculationDate: Date | string, now = new Date()): boolean {
  const targetDate = calculateNextReminderDate(lastCalculationDate);
  return now.getTime() >= targetDate.getTime();
}

/**
 * Menghitung status dan jadwal pengingat untuk ditampilkan pada UI Profil / Pengaturan Akun
 */
export function getReminderScheduleInfo(
  profile: {
    email?: string | null;
    email_notifications_enabled?: boolean | null;
    last_notified_calculation_id?: string | null;
  } | null,
  latestCalculation: {
    id: string;
    created_at: string;
  } | null,
  now = new Date()
): ReminderScheduleInfo {
  const isEnabled = Boolean(profile?.email_notifications_enabled);
  const userEmail = profile?.email ?? null;

  if (!latestCalculation) {
    return {
      isEnabled,
      userEmail,
      hasCalculation: false,
      lastCalculationId: null,
      lastCalculationDate: null,
      lastCalculationFormattedWIB: null,
      targetReminderDate: null,
      targetReminderFormattedWIB: null,
      isDue: false,
      isAlreadySentForThisCycle: false,
      statusLabel: isEnabled
        ? "Belum ada kalkulasi tersimpan. Jadwal 7 hari akan dimulai setelah kamu menekan 'Simpan Hasil' pertama kali."
        : "Notifikasi dinonaktifkan.",
    };
  }

  const targetDate = calculateNextReminderDate(latestCalculation.created_at);
  const isDue = now.getTime() >= targetDate.getTime();
  const isAlreadySentForThisCycle = profile?.last_notified_calculation_id === latestCalculation.id;

  let statusLabel = "";
  if (!isEnabled) {
    statusLabel = "Notifikasi dinonaktifkan.";
  } else if (isAlreadySentForThisCycle) {
    statusLabel = "Pengingat untuk siklus ini sudah terkirim. Menunggu kalkulasi baru untuk memulai siklus berikutnya.";
  } else if (isDue) {
    statusLabel = "Jadwal 7 hari telah tiba. Email pengingat siap dikirimkan oleh sistem.";
  } else {
    statusLabel = `Pengingat berikutnya dijadwalkan pada ${formatWIB(targetDate)}.`;
  }

  return {
    isEnabled,
    userEmail,
    hasCalculation: true,
    lastCalculationId: latestCalculation.id,
    lastCalculationDate: latestCalculation.created_at,
    lastCalculationFormattedWIB: formatWIB(latestCalculation.created_at),
    targetReminderDate: targetDate.toISOString(),
    targetReminderFormattedWIB: formatWIB(targetDate),
    isDue,
    isAlreadySentForThisCycle,
    statusLabel,
  };
}

/**
 * Mengirim email pengingat menggunakan Resend
 */
export async function sendReminderEmail(params: {
  recipientEmail: string;
  recipientName?: string | null;
  appUrl: string;
  lastCalculationDateFormattedWIB?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string; isSimulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "KarbonAI <pengingat@karbon.app>";

  // Jika API Key tidak ada di environment (misal di local development / testing awal),
  // lakukan simulasi pengiriman yang aman tanpa melempar crash unhandled
  if (!apiKey || apiKey === "your-resend-api-key-here") {
    console.warn(
      `[Reminder Email Simulation] RESEND_API_KEY belum dikonfigurasi. Simulasi kirim ke ${params.recipientEmail}`
    );
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      isSimulated: true,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const subject = "Saatnya Cek Jejak Karbon Mingguanmu! 🌱";
    const html = generateReminderEmailHtml(params);
    const text = generateReminderEmailPlainText(params);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [params.recipientEmail],
      subject,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Eksekutor Scheduler Server-Side:
 * Memproses seluruh pengguna yang memenuhi syarat menerima email pengingat 7 hari.
 */
export async function processWeeklyReminders(
  supabase: SupabaseClient,
  options: {
    forceUserId?: string;
    dryRun?: boolean;
    appUrl?: string;
  } = {}
): Promise<ProcessRemindersReport> {
  const now = new Date();
  const appUrl = options.appUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // 1. Ambil seluruh profil pengguna yang mengaktifkan notifikasi
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, email_notifications_enabled, last_notified_calculation_id")
    .eq("email_notifications_enabled", true);

  if (options.forceUserId) {
    query = query.eq("id", options.forceUserId);
  }

  const { data: eligibleProfiles, error: profilesError } = await query;

  if (profilesError) {
    throw new Error(`Gagal mengambil data profil pengguna: ${profilesError.message}`);
  }

  const profiles = eligibleProfiles ?? [];
  const results: SendReminderResult[] = [];
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const userProfile of profiles) {
    const recipientEmail = userProfile.email;

    // Verifikasi alamat email valid
    if (!recipientEmail || !recipientEmail.includes("@")) {
      results.push({
        userId: userProfile.id,
        recipientEmail: recipientEmail || "unknown",
        calculationId: "none",
        status: "skipped",
        reason: "Alamat email tidak valid atau kosong",
      });
      skippedCount++;
      continue;
    }

    // 2. Ambil kalkulasi terakhir yang berhasil disimpan oleh pengguna ini
    const { data: latestCalcs, error: calcError } = await supabase
      .from("carbon_calculations")
      .select("id, created_at")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (calcError || !latestCalcs || latestCalcs.length === 0) {
      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: "none",
        status: "skipped",
        reason: "Belum ada kalkulasi tersimpan",
      });
      skippedCount++;
      continue;
    }

    const latestCalc = latestCalcs[0];

    // 3. Evaluasi apakah sudah 7 hari sejak kalkulasi terakhir
    const isDue = isReminderDue(latestCalc.created_at, now);
    const forceMode = Boolean(options.forceUserId);

    if (!isDue && !forceMode) {
      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: latestCalc.id,
        status: "skipped",
        reason: `Belum 7 hari (jadwal: ${formatWIB(calculateNextReminderDate(latestCalc.created_at))})`,
      });
      skippedCount++;
      continue;
    }

    // 4. Cegah email ganda: Periksa apakah siklus kalkulasi ini sudah pernah dikirimi pengingat
    if (userProfile.last_notified_calculation_id === latestCalc.id && !forceMode) {
      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: latestCalc.id,
        status: "skipped",
        reason: "Pengingat untuk siklus kalkulasi ini sudah pernah terkirim sebelumnya",
      });
      skippedCount++;
      continue;
    }

    // Jika dry-run (simulasi), jangan kirim email sungguhan dan jangan update database
    if (options.dryRun) {
      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: latestCalc.id,
        status: "skipped",
        reason: "Dry-run mode (simulasi tanpa eksekusi)",
      });
      skippedCount++;
      continue;
    }

    // 5. Kirim email pengingat
    const sendRes = await sendReminderEmail({
      recipientEmail,
      recipientName: userProfile.full_name,
      appUrl,
      lastCalculationDateFormattedWIB: formatWIB(latestCalc.created_at),
    });

    if (sendRes.success) {
      // 6. Catat audit pengiriman ke notification_logs
      await supabase.from("notification_logs").insert({
        user_id: userProfile.id,
        calculation_id: latestCalc.id,
        recipient_email: recipientEmail,
        notification_type: "weekly_reminder",
        status: sendRes.isSimulated ? "simulated" : "sent",
        provider_id: sendRes.messageId ?? null,
        sent_at: now.toISOString(),
      });

      // 7. Tandai ID kalkulasi terakhir pada profil untuk mencegah email ganda pada scheduler berikutnya
      await supabase
        .from("profiles")
        .update({
          last_notified_calculation_id: latestCalc.id,
          last_notification_sent_at: now.toISOString(),
        })
        .eq("id", userProfile.id);

      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: latestCalc.id,
        status: "sent",
        messageId: sendRes.messageId,
      });
      sentCount++;
    } else {
      // 8. Jika pengiriman gagal: catat log gagal dan JANGAN update last_notified_calculation_id
      // agar siklus berikutnya dapat mencoba kembali (safe retry)
      await supabase.from("notification_logs").insert({
        user_id: userProfile.id,
        calculation_id: latestCalc.id,
        recipient_email: recipientEmail,
        notification_type: "weekly_reminder",
        status: "failed",
        provider_id: sendRes.messageId ?? null,
        error_message: sendRes.error,
        sent_at: now.toISOString(),
      });

      results.push({
        userId: userProfile.id,
        recipientEmail,
        calculationId: latestCalc.id,
        status: "failed",
        reason: sendRes.error,
      });
      failedCount++;
    }
  }

  return {
    timestamp: now.toISOString(),
    totalEligibleUsers: profiles.length,
    sentCount,
    skippedCount,
    failedCount,
    details: results,
  };
}
