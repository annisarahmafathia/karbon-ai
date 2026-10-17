import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, normalizeSupabaseUrl } from "./client";
import { Database } from "@/types/database";

/**
 * Klien Supabase untuk Server Components, Server Actions, dan Route Handlers.
 * Mengakses cookies secara asinkron sesuai standar Next.js App Router terbaru.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    return createServerClient<Database>(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseAnonKey || "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Panggilan setAll dari Server Component akan diabaikan karena cookies
          // bersifat read-only di Server Component. Pembaruan sesi ditangani oleh middleware/proxy.
        }
      },
    },
  });
}
