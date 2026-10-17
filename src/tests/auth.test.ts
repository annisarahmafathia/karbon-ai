import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeSupabaseUrl, isSupabaseConfigured } from "../lib/supabase/client";

test("normalizeSupabaseUrl strips trailing slashes and /rest/v1 safely", () => {
  assert.equal(
    normalizeSupabaseUrl("https://eipomjliwonnereqbzwy.supabase.co/rest/v1/"),
    "https://eipomjliwonnereqbzwy.supabase.co"
  );
  assert.equal(
    normalizeSupabaseUrl("https://eipomjliwonnereqbzwy.supabase.co/rest/v1"),
    "https://eipomjliwonnereqbzwy.supabase.co"
  );
  assert.equal(
    normalizeSupabaseUrl("https://eipomjliwonnereqbzwy.supabase.co/"),
    "https://eipomjliwonnereqbzwy.supabase.co"
  );
  assert.equal(
    normalizeSupabaseUrl("https://eipomjliwonnereqbzwy.supabase.co"),
    "https://eipomjliwonnereqbzwy.supabase.co"
  );
  assert.equal(normalizeSupabaseUrl(""), "");
  assert.equal(normalizeSupabaseUrl(undefined), "");
});

test("Register page sends full_name in options.data and does NOT insert profiles directly", async () => {
  const registerPagePath = path.resolve(process.cwd(), "src/app/register/page.tsx");
  const content = await fs.readFile(registerPagePath, "utf-8");

  // 1. Menggunakan signUp()
  assert.ok(content.includes("supabase.auth.signUp("));

  // 2. Mengirimkan full_name melalui options.data.full_name
  assert.ok(content.includes("full_name: trimmedName"));

  // 3. TIDAK melakukan insert manual ke tabel profiles dari client (diserahkan ke trigger)
  assert.ok(
    !content.includes('.from("profiles").insert('),
    "Halaman registrasi client tidak boleh memasukkan data ke profiles secara manual"
  );

  // 4. Memiliki validasi nama, email, dan password minimal 6 karakter
  assert.ok(content.includes("trimmedName.length < 3"));
  assert.ok(content.includes("password.length < 6"));
  assert.ok(content.includes("password !== confirmPassword"));
});

test("Login page uses signInWithPassword and supports safe redirect parameter", async () => {
  const loginPagePath = path.resolve(process.cwd(), "src/app/login/page.tsx");
  const content = await fs.readFile(loginPagePath, "utf-8");

  // 1. Menggunakan signInWithPassword()
  assert.ok(content.includes("supabase.auth.signInWithPassword("));

  // 2. Menangani redirect aman
  assert.ok(
    content.includes('redirectTarget.startsWith("/")') ||
      content.includes("redirectTarget.startsWith('/')")
  );

  // 3. Menangani terjemahan pesan error Supabase ke bahasa Indonesia
  assert.ok(content.includes("Alamat email atau kata sandi tidak cocok"));
  assert.ok(content.includes("Alamat email belum dikonfirmasi"));
});

test("Middleware / Proxy enforces protected route and auth redirects correctly", async () => {
  const middlewarePath = path.resolve(process.cwd(), "src/lib/supabase/middleware.ts");
  const content = await fs.readFile(middlewarePath, "utf-8");

  // 1. Memeriksa rute terproteksi
  assert.ok(content.includes('["/dashboard", "/profil", "/riwayat"]'));
  assert.ok(content.includes('redirectUrl.pathname = "/login"'));

  // 2. Memeriksa rute auth (redirect jika sudah login)
  assert.ok(content.includes('["/login", "/register"]'));

  // 3. Root URL: tamu ke Login, sesi valid ke Dashboard
  assert.ok(content.includes('pathname === "/"'));
  assert.ok(content.includes('user ? "/dashboard" : "/login"'));

  // 4. Preservasi cookies pada saat redirect
  assert.ok(content.includes("to.cookies.set(cookie.name, cookie.value, cookie)"));
});

test("Auth callback route handles exchangeCodeForSession properly", async () => {
  const callbackPath = path.resolve(process.cwd(), "src/app/auth/callback/route.ts");
  const content = await fs.readFile(callbackPath, "utf-8");

  // 1. Memanggil exchangeCodeForSession
  assert.ok(content.includes("supabase.auth.exchangeCodeForSession(code)"));

  // 2. Redirect ke target next atau default dashboard
  assert.ok(content.includes('searchParams.get("next") ?? "/dashboard"'));
});

test("Home page server-redirects guests to login and authenticated users to dashboard", async () => {
  const homePagePath = path.resolve(process.cwd(), "src/app/page.tsx");
  const content = await fs.readFile(homePagePath, "utf-8");

  assert.ok(content.includes("supabase.auth.getUser()"));
  assert.ok(content.includes('redirect("/login")'));
  assert.ok(content.includes('redirect("/dashboard")'));
});

test("Dashboard layout enforces server-side authentication", async () => {
  const layoutPath = path.resolve(process.cwd(), "src/app/dashboard/layout.tsx");
  const content = await fs.readFile(layoutPath, "utf-8");

  assert.ok(content.includes("supabase.auth.getUser()"));
  assert.ok(content.includes('redirect("/login?redirect=/dashboard")'));
});

test("Navbar provides reactive login state and logout trigger", async () => {
  const navbarPath = path.resolve(process.cwd(), "src/components/layout/Navbar.tsx");
  const content = await fs.readFile(navbarPath, "utf-8");

  // 1. Menggunakan useAuth
  assert.ok(content.includes("useAuth()"));

  // 2. Memiliki tombol Masuk dan Daftar untuk tamu
  assert.ok(content.includes('href="/login"'));
  assert.ok(content.includes('href="/register"'));

  // 3. Memiliki link Dashboard dan aksi Logout untuk user login
  assert.ok(content.includes('href="/dashboard"'));
  assert.ok(content.includes('href: "/riwayat"'));
  assert.ok(content.includes("handleLogout"));
  assert.ok(content.includes('router.push("/login")'));
});
