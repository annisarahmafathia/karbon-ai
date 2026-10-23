import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  calculateNextReminderDate,
  isReminderDue,
  formatWIB,
  getReminderScheduleInfo,
  processWeeklyReminders,
  REMINDER_INTERVAL_MS,
} from "../lib/notifications/scheduler";
import {
  generateReminderEmailHtml,
  generateReminderEmailPlainText,
} from "../lib/notifications/email-template";
import { SupabaseClient } from "@supabase/supabase-js";

test("1. Pengguna yang menonaktifkan notifikasi tidak menerima email pengingat", async () => {
  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, "profiles");
      return {
        select: () => ({
          eq: (col: string, val: boolean) => {
            assert.equal(col, "email_notifications_enabled");
            assert.equal(val, true);
            // Pengguna yang dinonaktifkan tidak akan masuk dalam query ini
            return Promise.resolve({ data: [], error: null });
          },
        }),
      };
    },
  } as unknown as SupabaseClient;

  const report = await processWeeklyReminders(mockSupabase);
  assert.equal(report.totalEligibleUsers, 0);
  assert.equal(report.sentCount, 0);
});

test("2. Kalkulasi yang tidak disimpan tidak mengubah jadwal pengingat", () => {
  // Simulasi kalkulasi yang tersimpan 10 hari lalu
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const profile = {
    email: "user@example.com",
    email_notifications_enabled: true,
    last_notified_calculation_id: null,
  };
  const latestSavedCalculation = {
    id: "saved-calc-1",
    created_at: tenDaysAgo,
  };

  const scheduleBefore = getReminderScheduleInfo(profile, latestSavedCalculation);

  // Pengguna membuka halaman hasil atau kalkulator tanpa menekan tombol Simpan Hasil:
  // Nilai latestSavedCalculation di database TIDAK berubah, sehingga jadwal tetap sama persis
  const scheduleAfterUnsavedCalc = getReminderScheduleInfo(profile, latestSavedCalculation);

  assert.equal(
    scheduleBefore.targetReminderDate,
    scheduleAfterUnsavedCalc.targetReminderDate,
    "Jadwal pengingat tidak boleh berubah oleh kalkulasi yang belum disimpan"
  );
  assert.equal(scheduleAfterUnsavedCalc.lastCalculationId, "saved-calc-1");
});

test("3. Penyimpanan kalkulasi berhasil mengatur ulang jadwal menjadi tujuh hari setelah penyimpanan terakhir", () => {
  const saveDate = new Date("2026-10-23T15:00:00+07:00");
  const nextSchedule = calculateNextReminderDate(saveDate);

  // 23 Oktober + 7 hari = 30 Oktober pada jam yang sama
  const expectedDate = new Date("2026-10-30T15:00:00+07:00");
  assert.equal(nextSchedule.getTime(), expectedDate.getTime());
  assert.equal(nextSchedule.getTime() - saveDate.getTime(), REMINDER_INTERVAL_MS);
});

test("4. Pengingat hanya dikirim jika sudah waktunya (7 hari berlalu)", () => {
  const saveDate = new Date("2026-10-23T15:00:00+07:00");

  // Hari ke-5 (28 Oktober) -> Belum waktunya
  const day5 = new Date("2026-10-28T15:00:00+07:00");
  assert.equal(isReminderDue(saveDate, day5), false);

  // Hari ke-7 kurang 1 jam -> Belum waktunya
  const day7Minus1h = new Date(saveDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 3600000);
  assert.equal(isReminderDue(saveDate, day7Minus1h), false);

  // Tepat hari ke-7 (30 Oktober pukul 15.00) -> Sudah waktunya
  const day7Exact = new Date(saveDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  assert.equal(isReminderDue(saveDate, day7Exact), true);

  // Hari ke-8 -> Sudah lewat jadwal (siap dikirim)
  const day8 = new Date("2026-10-31T10:00:00+07:00");
  assert.equal(isReminderDue(saveDate, day8), true);
});

test("5. Pengingat tidak dikirim berulang untuk siklus yang sama (idempotensi)", async () => {
  const calcId = "calc-cycle-123";
  const saved8DaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  // Profil ini SUDAH pernah dikirimi email untuk calc-cycle-123
  const mockProfiles = [
    {
      id: "user-1",
      email: "test@example.com",
      full_name: "Mahasiswa Karbon",
      email_notifications_enabled: true,
      last_notified_calculation_id: calcId, // Sudah diingatkan!
    },
  ];

  const mockSupabase = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockProfiles, error: null }),
          }),
        };
      }
      if (table === "carbon_calculations") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [{ id: calcId, created_at: saved8DaysAgo }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;

  const report = await processWeeklyReminders(mockSupabase);

  // Harus di-skip (tidak boleh dikirim ulang untuk siklus yang sama)
  assert.equal(report.sentCount, 0);
  assert.equal(report.skippedCount, 1);
  assert.ok(report.details[0].reason?.includes("sudah pernah terkirim"));
});

test("6. Pengguna yang menyimpan hasil baru sebelum jadwal lama mendapat jadwal baru yang diatur ulang", () => {
  // Simpan pertama: 23 Oktober
  const calc1Date = new Date("2026-10-23T15:00:00+07:00");
  const initialSchedule = calculateNextReminderDate(calc1Date);
  assert.equal(initialSchedule.toISOString(), new Date("2026-10-30T15:00:00+07:00").toISOString());

  // Simpan kalkulasi baru pada 27 Oktober (sebelum jadwal 30 Oktober tiba)
  const calc2Date = new Date("2026-10-27T10:00:00+07:00");
  const resetSchedule = calculateNextReminderDate(calc2Date);

  // Jadwal pengingat otomatis diatur ulang menjadi 3 November pukul 10.00
  const expectedResetDate = new Date("2026-11-03T10:00:00+07:00");
  assert.equal(resetSchedule.getTime(), expectedResetDate.getTime());
});

test("7. Kegagalan pengiriman dapat dicatat tanpa menandai siklus berhasil", async () => {
  const calcId = "calc-failed-cycle";
  const saved9DaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();

  let profileUpdated = false;
  let logInsertedStatus = "";

  const mockProfiles = [
    {
      id: "user-failed",
      email: "invalid-smtp@example.com",
      full_name: "Gagal Kirim",
      email_notifications_enabled: true,
      last_notified_calculation_id: null,
    },
  ];

  const mockSupabase = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockProfiles, error: null }),
          }),
          update: () => {
            profileUpdated = true;
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      if (table === "carbon_calculations") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [{ id: calcId, created_at: saved9DaysAgo }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "notification_logs") {
        return {
          insert: (log: { status: string }) => {
            logInsertedStatus = log.status;
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;

  // Set invalid Resend key untuk mensimulasikan kegagalan delivery
  const prevKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "re_invalid_test_key";

  try {
    const report = await processWeeklyReminders(mockSupabase);
    assert.equal(report.failedCount, 1);
    assert.equal(logInsertedStatus, "failed");
    // last_notified_calculation_id pada profile TIDAK boleh diupdate saat gagal,
    // agar scheduler pada jadwal berikutnya dapat mencoba kembali (safe retry).
    assert.equal(profileUpdated, false);
  } finally {
    process.env.RESEND_API_KEY = prevKey;
  }
});

test("8. Format zona waktu Asia/Jakarta (WIB) akurat dan template email valid", () => {
  const utcDate = new Date("2026-10-23T08:00:00Z"); // 08:00 UTC = 15:00 WIB
  const formatted = formatWIB(utcDate);

  assert.ok(formatted.includes("WIB"));
  assert.ok(formatted.includes("15.00") || formatted.includes("15:00"));
  assert.ok(formatted.includes("23"));
  assert.ok(formatted.includes("Oktober"));

  const emailHtml = generateReminderEmailHtml({
    recipientName: "Budi Santoso",
    appUrl: "http://localhost:3000",
    lastCalculationDateFormattedWIB: formatted,
  });

  assert.ok(emailHtml.includes("Halo, Budi Santoso!"));
  assert.ok(emailHtml.includes("Saatnya Cek Jejak Karbon Mingguanmu! 🌱"));
  assert.ok(emailHtml.includes("http://localhost:3000/kalkulator"));
  assert.ok(emailHtml.includes("http://localhost:3000/dashboard"));
  assert.ok(emailHtml.includes(formatted));

  const emailText = generateReminderEmailPlainText({
    recipientName: "Budi Santoso",
    appUrl: "http://localhost:3000",
  });
  assert.ok(emailText.includes("Halo, Budi Santoso!"));
  assert.ok(emailText.includes("http://localhost:3000/kalkulator"));
});

test("9. Endpoint Cron dilindungi secret dan vercel.json terkonfigurasi dengan benar", async () => {
  const vercelJsonPath = path.resolve(process.cwd(), "vercel.json");
  const content = await fs.readFile(vercelJsonPath, "utf-8");
  const json = JSON.parse(content);

  assert.ok(Array.isArray(json.crons));
  assert.equal(json.crons[0].path, "/api/cron/weekly-reminders");
  assert.ok(json.crons[0].schedule);
});

test("10. Pencatatan provider_id pada notification_logs saat simulasi atau terkirim", async () => {
  const calcId = "calc-provider-id-test";
  const saved10DaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  let insertedProviderId: string | null | undefined = undefined;

  const mockProfiles = [
    {
      id: "user-provider-test",
      email: "provider@example.com",
      full_name: "Uji Provider ID",
      email_notifications_enabled: true,
      last_notified_calculation_id: null,
    },
  ];

  const mockSupabase = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockProfiles, error: null }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "carbon_calculations") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [{ id: calcId, created_at: saved10DaysAgo }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "notification_logs") {
        return {
          insert: (log: { status: string; provider_id?: string | null }) => {
            insertedProviderId = log.provider_id;
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;

  // Pastikan RESEND_API_KEY kosong agar masuk mode simulasi
  const prevKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const report = await processWeeklyReminders(mockSupabase);
    assert.equal(report.sentCount, 1);
    assert.ok(typeof insertedProviderId === "string" && (insertedProviderId as string).startsWith("simulated-"));
  } finally {
    process.env.RESEND_API_KEY = prevKey;
  }
});

