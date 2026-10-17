"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  ArrowRight,
  Leaf,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const errorCode = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
  errorCode === "auth-code-error"
    ? "Tautan konfirmasi tidak valid atau telah kedaluwarsa. Silakan masuk kembali."
    : null
);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Format alamat email tidak valid.");
      return;
    }

    if (!password) {
      setErrorMessage("Silakan masukkan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_grant")
        ) {
          setErrorMessage(
            "Alamat email atau kata sandi tidak cocok. Silakan periksa kembali."
          );
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "Alamat email belum dikonfirmasi. Silakan periksa kotak masuk (inbox/spam) email Anda untuk melakukan verifikasi."
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.user && data.session) {
        const safeDestination =
          redirectTarget.startsWith("/") &&
          !redirectTarget.startsWith("//") &&
          redirectTarget !== "/" &&
          redirectTarget !== "/login" &&
          redirectTarget !== "/register"
            ? redirectTarget
            : "/dashboard";
        router.push(safeDestination);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Kesalahan proses masuk:", err);
      setErrorMessage("Terjadi gangguan jaringan atau server. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest text-cream shadow-sm hover:scale-105 transition-transform"
        >
          <Leaf className="w-6 h-6 text-sage" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
          Masuk ke Karbon AI
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Akses akun mahasiswa Anda untuk melihat riwayat jejak karbon dan komitmen aksi hijau.
        </p>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-md space-y-6">
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {redirectTarget && redirectTarget !== "/dashboard" && !errorMessage && (
          <div className="p-3.5 rounded-2xl bg-mint/60 border border-sage/30 text-forest text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-forest" />
            <span>Silakan masuk untuk melanjutkan ke halaman yang Anda tuju.</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="login_email"
              className="block text-xs font-bold uppercase tracking-wider text-charcoal"
            >
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login_email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mhs.usk.ac.id"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-sage/40 bg-cream/40 focus:bg-white text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login_password"
                className="block text-xs font-bold uppercase tracking-wider text-charcoal"
              >
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login_password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-sage/40 bg-cream/40 focus:bg-white text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-charcoal focus:outline-none"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-forest hover:bg-forest-dark text-cream font-bold text-sm shadow transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sage" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 text-sage" />
              </>
            )}
          </button>
        </form>

        {/* Footer link to Register */}
        <div className="pt-2 text-center border-t border-sage/20 text-xs text-muted">
          Belum memiliki akun mahasiswa?{" "}
          <Link
            href="/register"
            className="font-bold text-forest hover:underline"
          >
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] bg-cream py-10 sm:py-16 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-sage/30 flex items-center justify-center gap-3 text-muted">
            <Loader2 className="w-5 h-5 animate-spin text-forest" />
            <span className="text-sm font-medium">Memuat halaman masuk...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
