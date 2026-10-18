
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeSupabaseUrl } from "../lib/supabase/client";

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
  const registerPagePath = path.resolve(
    process.cwd(),
    "src/app/register/page.tsx"
  );
  const content = await fs.readFile(registerPagePath, "utf-8");

  assert.ok(content.includes("supabase.auth.signUp("));
  assert.ok(content.includes("full_name: trimmedName"));
  assert.ok(
    !content.includes('.from("profiles").insert('),
    "Halaman registrasi client tidak boleh memasukkan data ke profiles secara manual"
  );
  assert.ok(content.includes("trimmedName.length < 3"));
  assert.ok(content.includes("password.length < 6"));
  assert.ok(content.includes("password !== confirmPassword"));
});

test("Login page uses signInWithPassword and supports safe redirect parameter", async () => {
  const loginPagePath = path.resolve(
    process.cwd(),
    "src/app/login/page.tsx"
  );
  const content = await fs.readFile(loginPagePath, "utf-8");

  assert.ok(content.includes("supabase.auth.signInWithPassword("));
  assert.ok(
    content.includes('redirectTarget.startsWith("/")') ||
      content.includes("redirectTarget.startsWith('/')")
  );
  assert.ok(content.includes("Alamat email atau kata sandi tidak cocok"));
  assert.ok(content.includes("Alamat email belum dikonfirmasi"));
});

test("Middleware / Proxy enforces protected route and auth redirects correctly", async () => {
  const middlewarePath = path.resolve(
    process.cwd(),
    "src/lib/supabase/middleware.ts"
  );
  const content = await fs.readFile(middlewarePath, "utf-8");

  assert.ok(content.includes('["/dashboard", "/profil", "/riwayat"]'));
  assert.ok(content.includes('redirectUrl.pathname = "/login"'));
  assert.ok(content.includes('["/login", "/register"]'));
  assert.ok(content.includes('pathname === "/"'));
  assert.ok(content.includes('user ? "/dashboard" : "/login"'));
  assert.ok(content.includes("to.cookies.set(cookie.name, cookie.value, cookie)"));
});

test("Auth callback route handles exchangeCodeForSession properly", async () => {
  const callbackPath = path.resolve(
    process.cwd(),
    "src/app/auth/callback/route.ts"
  );
  const content = await fs.readFile(callbackPath, "utf-8");

  assert.ok(content.includes("supabase.auth.exchangeCodeForSession(code)"));
  assert.ok(content.includes('searchParams.get("next") ?? "/dashboard"'));
});

test("Home page renders the public landing page", async () => {
  const homePagePath = path.resolve(
    process.cwd(),
    "src/app/(app)/page.tsx"
  );
  const content = await fs.readFile(homePagePath, "utf-8");

  assert.ok(content.includes("export default function HomePage"));
  assert.ok(content.includes("/kalkulator"));
  assert.ok(content.includes("/green-action"));
  assert.ok(content.includes("/edukasi"));
});

test("Dashboard layout enforces server-side authentication", async () => {
  const layoutPath = path.resolve(
    process.cwd(),
    "src/app/(app)/dashboard/layout.tsx"
  );
  const content = await fs.readFile(layoutPath, "utf-8");

  assert.ok(content.includes("supabase.auth.getUser()"));
  assert.ok(content.includes('redirect("/login?redirect=/dashboard")'));
});

test("Navbar provides reactive login state and logout trigger", async () => {
  const navbarPath = path.resolve(
    process.cwd(),
    "src/components/layout/Navbar.tsx"
  );
  const content = await fs.readFile(navbarPath, "utf-8");

  assert.ok(content.includes("useAuth()"));
  assert.ok(content.includes('href="/login"'));
  assert.ok(content.includes('href="/register"'));
  assert.ok(content.includes("href={link.href}"));
  assert.ok(content.includes('href: "/dashboard"'));
  assert.ok(content.includes('href: "/riwayat"'));
  assert.ok(content.includes("handleLogout"));
  assert.ok(content.includes('router.replace("/login")'));
});
