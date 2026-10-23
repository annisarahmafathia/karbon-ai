import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processWeeklyReminders } from "@/lib/notifications/scheduler";

/**
 * Route Handler untuk Vercel Cron / Scheduler Server-Side Pengingat Mingguan.
 * Dilindungi dengan verifikasi CRON_SECRET agar tidak dapat dipanggil sembarangan oleh anonim.
 */
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // Jika di local development dan CRON_SECRET belum diset, izinkan untuk pengujian lokal
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }

  if (!cronSecret) {
    console.error("[Cron Auth] CRON_SECRET belum dikonfigurasi di environment variable.");
    return false;
  }

  // Cek Authorization header: Bearer <CRON_SECRET> (standar Vercel Cron)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Cek custom header x-cron-secret
  const customHeader = request.headers.get("x-cron-secret");
  if (customHeader && customHeader === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Secret authorization token diperlukan." },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const forceUserId = searchParams.get("force_user_id") || undefined;
    const dryRun = searchParams.get("dry_run") === "true";

    const supabase = createAdminClient();
    const report = await processWeeklyReminders(supabase, {
      forceUserId,
      dryRun,
      appUrl: request.nextUrl.origin,
    });

    return NextResponse.json({
      success: true,
      message: "Proses pengingat mingguan selesai.",
      report,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Cron Error] Gagal memproses pengingat mingguan:", errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Dukung metode POST dengan logika yang sama
  return GET(request);
}
