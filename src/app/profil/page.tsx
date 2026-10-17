
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LogOut,
  Loader2,
  ArrowRight,
  Leaf,
  Clock,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function ProfilPage() {
  const router = useRouter();

  const {
    user,
    profile,
    isLoading: isAuthLoading,
    signOut,
  } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login?redirect=/profil");
    }
  }, [user, isAuthLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal keluar dari akun:", error);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-cream">
        <div className="flex items-center gap-3 text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-forest" />
          <span className="text-sm font-semibold">
            Memuat informasi akun...
          </span>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Pengguna KarbonAI";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-cream py-10 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <div>
          <p className="mb-2 text-sm font-semibold text-forest">
            Pengaturan Akun
          </p>

          <h1 className="text-3xl font-black text-charcoal sm:text-4xl">
            Profil Saya
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Kelola akses akun dan lihat informasi akunmu di KarbonAI.
          </p>
        </div>

        {/* Profile Card */}
        <section className="rounded-3xl border border-sage/30 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-forest text-3xl font-black text-cream">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-bold text-charcoal sm:text-2xl">
                  {displayName}
                </h2>

                <span className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-mint px-2.5 py-1 text-xs font-semibold text-forest">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Akun aktif
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-muted">
                {user.email || "Email tidak tersedia"}
              </p>
            </div>
          </div>

          <div className="my-7 border-t border-sage/30" />

          <h3 className="mb-4 text-base font-bold text-charcoal">
            Informasi Akun
          </h3>

          <div className="space-y-4">
            {/* Nama */}
            <div className="flex items-start gap-4 rounded-2xl bg-cream p-4">
              <div className="rounded-xl bg-mint p-3 text-forest">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">
                  Nama lengkap
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-charcoal">
                  {displayName}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 rounded-2xl bg-cream p-4">
              <div className="rounded-xl bg-mint p-3 text-forest">
                <Mail className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-charcoal">
                  {user.email || "Email tidak tersedia"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Shortcuts */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-sage/30 bg-white p-5 shadow-sm transition hover:border-forest/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-mint p-3 text-forest">
                <LayoutDashboard className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold text-charcoal">
                  Dashboard
                </p>

              </div>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0 text-forest transition group-hover:translate-x-1" />
          </Link>

          <Link
            href="/riwayat"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-sage/30 bg-white p-5 shadow-sm transition hover:border-forest/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-mint p-3 text-forest">
                <Clock className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold text-charcoal">
                  Riwayat Perhitungan
                </p>

              </div>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0 text-forest transition group-hover:translate-x-1" />
          </Link>
        </section>

        {/* Logout */}
        <section className="rounded-2xl border border-red-100 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-charcoal">
                Keluar dari akun?
              </h3>

              <p className="mt-1 text-sm text-muted">
                Kamu perlu login kembali untuk mengakses Karbon AI
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Keluar Akun
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
