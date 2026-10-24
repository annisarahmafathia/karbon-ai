"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LogOut,
  Loader2,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Bell,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getReminderScheduleInfo } from "@/lib/notifications/scheduler";

export default function ProfilPage() {
  const router = useRouter();

  const {
    user,
    profile,
    isLoading: isAuthLoading,
    signOut,
    refreshProfile,
  } = useAuth();

  const [latestCalc, setLatestCalc] = useState<{ id: string; created_at: string } | null>(null);
  const [isLoadingCalc, setIsLoadingCalc] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login?redirect=/profil");
    }
  }, [user, isAuthLoading, router]);

  // Ambil kalkulasi terakhir yang berhasil disimpan oleh pengguna untuk menghitung jadwal pengingat 7 hari
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadLatestCalculation() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("carbon_calculations")
          .select("id, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && isMounted) {
          setLatestCalc(data[0]);
        }
      } catch (err) {
        console.error("Gagal memuat kalkulasi terakhir:", err);
      } finally {
        if (isMounted) setIsLoadingCalc(false);
      }
    }

    void loadLatestCalculation();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal keluar dari akun:", error);
    }
  };

  // Toggle preferensi notifikasi email mingguan
  const isNotificationsEnabled = Boolean(
    profile?.email_notifications_enabled ??
    user?.user_metadata?.email_notifications_enabled ??
    false
  );

  const handleToggleNotifications = () => {
    if (!user) return;
    const nextState = !isNotificationsEnabled;

    startTransition(async () => {
      setFeedbackMessage(null);
      try {
        const supabase = createClient();

        // 1. Simpan preferensi ke tabel profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ email_notifications_enabled: nextState })
          .eq("id", user.id);

        if (profileError) {
          console.warn("Update profiles table warning:", profileError.message);
        }

        // 2. Simpan juga ke user metadata auth sebagai fallback resilient
        await supabase.auth.updateUser({
          data: { email_notifications_enabled: nextState },
        });

        await refreshProfile();

        setFeedbackMessage({
          type: "success",
          text: nextState
            ? "Notifikasi email mingguan berhasil diaktifkan!"
            : "Notifikasi email mingguan dinonaktifkan.",
        });

        setTimeout(() => setFeedbackMessage(null), 4000);
      } catch (err) {
        console.error("Gagal memperbarui preferensi notifikasi:", err);
        setFeedbackMessage({
          type: "error",
          text: "Gagal menyimpan preferensi. Silakan coba kembali.",
        });
      }
    });
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

  const scheduleInfo = getReminderScheduleInfo(
    {
      email: user.email,
      email_notifications_enabled: isNotificationsEnabled,
      last_notified_calculation_id: profile?.last_notified_calculation_id ?? null,
    },
    latestCalc
  );

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
            Kelola akses akun, preferensi notifikasi, dan lihat riwayat aktivitasmu di KarbonAI.
          </p>
        </div>

        {/* Profile Card */}
        <section className="rounded-3xl border border-sage/30 bg-white p-5 shadow-sm sm:p-8">
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

        {/* Pengaturan Notifikasi Email Mingguan */}
        <section className="rounded-3xl border border-sage/30 bg-white p-5 shadow-sm sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-mint text-forest flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-charcoal">
                    Notifikasi Email Mingguan
                  </h3>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isNotificationsEnabled
                        ? "bg-mint text-forest border border-sage/40"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {isNotificationsEnabled ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted">
                  Kirimkan pengingat otomatis ke email setiap <strong>7 hari</strong> setelah kamu terakhir kali menekan tombol <em>Simpan Hasil</em> di kalkulator.
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <div className="flex items-center sm:self-center shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={isNotificationsEnabled}
                disabled={isPending}
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-60 ${
                  isNotificationsEnabled ? "bg-forest" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Toggle notifikasi email mingguan</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isNotificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div
              className={`flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                feedbackMessage.type === "success"
                  ? "bg-mint/50 text-forest border border-forest/20"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedbackMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Schedule Info Box */}
          <div className="rounded-2xl border border-sage/20 bg-cream/70 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
              <CalendarClock className="h-4 w-4" />
              <span>Status & Jadwal Pengingat (WIB / Asia-Jakarta)</span>
            </div>

            {isLoadingCalc ? (
              <div className="flex items-center gap-2 text-xs text-muted py-2">
                <Loader2 className="h-4 w-4 animate-spin text-forest" />
                <span>Memuat jadwal pengingat terakhir...</span>
              </div>
            ) : isNotificationsEnabled ? (
              <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
                <div className="bg-white rounded-xl p-3.5 border border-sage/30 space-y-1">
                  <p className="text-muted font-medium text-xs">Penyimpanan Terakhir:</p>
                  <p className="font-bold text-charcoal">
                    {scheduleInfo.hasCalculation
                      ? scheduleInfo.lastCalculationFormattedWIB
                      : "Belum pernah menyimpan kalkulasi"}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-sage/30 space-y-1">
                  <p className="text-muted font-medium text-xs">Jadwal Pengingat 7 Hari:</p>
                  <p className="font-bold text-forest">
                    {scheduleInfo.hasCalculation
                      ? scheduleInfo.targetReminderFormattedWIB
                      : "-"}
                  </p>
                </div>

                <div className="sm:col-span-2 pt-1 text-xs text-muted flex items-start gap-1.5">
                  <span className="font-semibold text-forest">Keterangan:</span>
                  <span>{scheduleInfo.statusLabel}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted leading-relaxed">
                Notifikasi email saat ini nonaktif. Aktifkan toggle di atas jika kamu ingin menerima pengingat rutin 7 hari setelah kalkulasi jejak karbon mingguanmu.
              </p>
            )}

            <div className="pt-2 border-t border-sage/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <span>Alamat penerima: <strong>{user.email}</strong></span>
              <Link
                href="/kalkulator"
                className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
              >
                <Sparkles className="h-3 w-3" />
                <span>Buka Kalkulator untuk Menghitung Baru</span>
              </Link>
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
                  Beranda 
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
                  Riwayat
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
                Kamu perlu login kembali untuk mengakses KarbonAI
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
