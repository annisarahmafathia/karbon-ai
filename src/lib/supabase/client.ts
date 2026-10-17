import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

/**
 * Menormalkan URL Supabase untuk memastikan basis URL bersih dari path tambahan atau trailing slash.
 */
export function normalizeSupabaseUrl(url: string | undefined): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Memeriksa apakah variabel lingkungan Supabase sudah dikonfigurasi dengan benar.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
    key &&
    !url.includes("your-project-id") &&
    key !== "your-anon-key-here"
  );
}

/**
 * Klien Supabase untuk Browser (Client Components).
 * Menggunakan @supabase/ssr createBrowserClient dengan penyimpanan cookie otomatis.
 */
export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    // Memberikan fallback aman saat tahap build atau sebelum user memasukkan kredensial .env.local
    // agar aplikasi tidak crash dan tetap dapat berjalan dalam mode tamu (offline/guest mode).
    return createBrowserClient<Database>(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseAnonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey!);
}
