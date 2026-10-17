import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, normalizeSupabaseUrl } from "./client";

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/dashboard", "/profil", "/riwayat"];

function copySessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
  return to;
}

function fromSession(supabaseResponse: NextResponse, redirectUrl: URL) {
  const redirectResponse = NextResponse.redirect(redirectUrl);
  return copySessionCookies(supabaseResponse, redirectResponse);
}

function isSafePostAuthPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path === "/" || AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))) {
    return false;
  }
  return true;
}

/**
 * Memperbarui sesi autentikasi Supabase melalui cookie request dan response.
 * Dipanggil oleh Next.js proxy/middleware di src/proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Jika Supabase belum dikonfigurasi, tetap arahkan root ke Login agar alur awal konsisten
  if (!isSupabaseConfigured()) {
    if (pathname === "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Menyegarkan token sesi jika diperlukan
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Root URL: Login untuk tamu, Dashboard untuk sesi yang masih valid
  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/dashboard" : "/login";
    redirectUrl.search = "";
    return fromSession(supabaseResponse, redirectUrl);
  }

  // 2. Rute yang memerlukan autentikasi wajib
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("redirect", pathname);
    return fromSession(supabaseResponse, redirectUrl);
  }

  // 3. Rute login/register: jika pengguna sudah login, arahkan ke tujuan aman (default Dashboard)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  if (isAuthRoute && user) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const targetPath = isSafePostAuthPath(redirectParam) ? redirectParam : "/dashboard";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.search = "";
    return fromSession(supabaseResponse, redirectUrl);
  }

  return supabaseResponse;
}
