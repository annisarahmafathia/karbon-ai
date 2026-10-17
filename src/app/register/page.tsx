
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessConfirmationNeeded, setIsSuccessConfirmationNeeded] =
    useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage("Nama lengkap minimal 3 karakter.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage("Format alamat email tidak valid.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const siteUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo: siteUrl
            ? `${siteUrl}/auth/callback`
            : undefined,
        },
      });

      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          setErrorMessage(
            "Email ini sudah terdaftar. Silakan masuk menggunakan akunmu."
          );
        } else if (error.message.toLowerCase().includes("weak")) {
          setErrorMessage(
            "Kata sandi terlalu lemah. Gunakan kata sandi yang lebih kuat."
          );
        } else {
          setErrorMessage(error.message);
        }

        return;
      }

      if (data.user && !data.session) {
        setIsSuccessConfirmationNeeded(true);
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setIsSuccessConfirmationNeeded(true);
      }
    } catch (err: unknown) {
      console.error("Kesalahan registrasi:", err);
      setErrorMessage(
        "Terjadi kesalahan jaringan atau server. Silakan coba kembali."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] w-full items-center justify-center bg-cream px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-cream shadow-sm transition-transform hover:scale-105"
            aria-label="Kembali ke Beranda"
          >
            <Leaf className="h-6 w-6 text-sage" />
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
            Daftar Akun KarbonAI
          </h1>

          <p className="text-xs text-muted sm:text-sm">
            Buat akun untuk menyimpan riwayat jejak karbon dan memantau
            progres aksi ramah lingkunganmu.
          </p>
        </div>

        {/* Email Confirmation */}
        {isSuccessConfirmationNeeded ? (
          <div className="animate-in fade-in space-y-6 rounded-3xl border border-sage/30 bg-white p-6 text-center shadow-md duration-300 sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-forest">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-charcoal">
                Registrasi Berhasil!
              </h2>

              <p className="text-xs leading-relaxed text-muted sm:text-sm">
                Jika konfirmasi email diperlukan, tautan aktivasi akan
                dikirimkan ke{" "}
                <strong className="text-forest">{email}</strong>. Periksa
                kotak masuk atau folder spam, lalu ikuti petunjuk dalam email.
              </p>
            </div>

            <div className="space-y-1 rounded-2xl border border-sage/20 bg-mint/50 p-4 text-left text-xs text-forest">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Akun Terlindungi</span>
              </div>

              <p className="leading-relaxed text-muted">
                Informasi akun dikelola dengan aman. Kamu bisa menggunakan
                KarbonAI tanpa perlu memasukkan informasi universitas.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3.5 text-sm font-bold text-cream shadow transition-all hover:bg-forest-dark"
              >
                <span>Menuju Halaman Masuk</span>
                <ArrowRight className="h-4 w-4 text-sage" />
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="space-y-6 rounded-3xl border border-sage/30 bg-white p-6 shadow-md sm:p-8">
            {errorMessage && (
              <div
                role="alert"
                className="animate-in fade-in flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 sm:text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="full_name"
                  className="block text-xs font-bold uppercase tracking-wider text-charcoal"
                >
                  Nama Lengkap
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                    <User className="h-4 w-4" />
                  </div>

                  <input
                    id="full_name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={3}
                    maxLength={100}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-xl border border-sage/40 bg-cream/40 py-3 pl-10 pr-4 text-sm text-charcoal placeholder:text-muted/60 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-charcoal"
                >
                  Alamat Email
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                    <Mail className="h-4 w-4" />
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-sage/40 bg-cream/40 py-3 pl-10 pr-4 text-sm text-charcoal placeholder:text-muted/60 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-charcoal"
                >
                  Kata Sandi
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-sage/40 bg-cream/40 py-3 pl-10 pr-11 text-sm text-charcoal placeholder:text-muted/60 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-charcoal focus:outline-none"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Lihat kata sandi"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm_password"
                  className="block text-xs font-bold uppercase tracking-wider text-charcoal"
                >
                  Konfirmasi Kata Sandi
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    id="confirm_password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    className="w-full rounded-xl border border-sage/40 bg-cream/40 py-3 pl-10 pr-4 text-sm text-charcoal placeholder:text-muted/60 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-forest py-3.5 text-sm font-bold text-cream shadow transition-all duration-200 hover:bg-forest-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-sage" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="h-4 w-4 text-sage" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="border-t border-sage/20 pt-4 text-center text-xs text-muted">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-bold text-forest hover:underline"
              >
                Masuk di sini
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
