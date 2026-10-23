import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./client";
import { Database } from "@/types/database";

/**
 * Klien Supabase untuk tugas latar belakang / Cron Scheduler server-side.
 * Menggunakan SUPABASE_SERVICE_ROLE_KEY jika tersedia agar dapat membaca pengguna
 * yang berhak menerima email pengingat tanpa context sesi cookie pengguna.
 * Kunci ini HANYA berada di server dan TIDAK PERNAH terekspos ke browser pengguna.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi di environment variable."
    );
  }

  // SUPABASE_SERVICE_ROLE_KEY adalah variabel rahasia khusus server (tanpa NEXT_PUBLIC_)
  // sehingga tidak pernah diekspos ke browser pengguna.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey && process.env.NODE_ENV === "production") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi di environment server untuk menjalankan operasi admin / cron scheduler."
    );
  }

  // Gunakan serviceRoleKey untuk cron server, atau fallback ke anon key saat development lokal
  const serviceKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceKey) {
    throw new Error(
      "Kunci autentikasi Supabase (SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY) belum dikonfigurasi."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
