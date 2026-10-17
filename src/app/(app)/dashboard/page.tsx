
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CalendarDays,
  Clock,
  Leaf,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { CarbonCalculation } from "@/types/database";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatEmission(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })} kg CO₂e`;
}

function formatPeriod(month: number | null, year: number | null) {
  if (month && year) {
    return `${MONTHS[month - 1] ?? "Periode"} ${year}`;
  }

  return "Periode tidak tersedia";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuth();

  const supabase = useMemo(() => createClient(), []);

  const [calculations, setCalculations] = useState<CarbonCalculation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    let isMounted = true;

    async function loadCalculations() {
      setIsLoadingData(true);
      setLoadError(false);

      try {
        const { data, error } = await supabase
          .from("carbon_calculations")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Gagal mengambil riwayat karbon:", error);
          if (isMounted) setLoadError(true);
          return;
        }

        if (isMounted) {
          setCalculations((data ?? []) as CarbonCalculation[]);
        }
      } catch (error) {
        console.error("Terjadi kesalahan saat mengambil data:", error);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void loadCalculations();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, router, supabase]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Mahasiswa Aceh";

  const latestCalculation = calculations[0];

  const chartData = useMemo(
    () => [...calculations].slice(0, 6).reverse(),
    [calculations]
  );

  const highestEmission = useMemo(() => {
    return calculations.reduce((highest, calculation) => {
      return Number(calculation.total_monthly_kg ?? 0) >
        Number(highest?.total_monthly_kg ?? 0)
        ? calculation
        : highest;
    }, calculations[0]);
  }, [calculations]);

  const maxEmission = Math.max(
    ...chartData.map((item) => Number(item.total_monthly_kg ?? 0)),
    1
  );

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-700">
              Dashboard CarbonAceh
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
              Halo, {displayName}!
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Pantau jejak karbonmu dan temukan langkah sederhana untuk
              menjaga lingkungan, mulai dari kebiasaan sehari-hari.
            </p>
          </div>

          <Link
            href="/kalkulator"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <Calculator size={18} />
            Hitung Jejak Karbon
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* Error */}
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Riwayat perhitungan belum bisa dimuat. Coba muat ulang halaman.
            <button
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Muat ulang
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Perhitungan
                </p>
                <p className="mt-2 text-3xl font-bold text-charcoal">
                  {isLoadingData ? "—" : calculations.length}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Seluruh riwayat tersimpan
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Emisi Perhitungan Terbaru
                </p>
                <p className="mt-2 text-2xl font-bold text-charcoal">
                  {isLoadingData
                    ? "—"
                    : latestCalculation
                      ? formatEmission(latestCalculation.total_monthly_kg)
                      : "Belum ada"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {latestCalculation
                    ? formatPeriod(
                        latestCalculation.period_month,
                        latestCalculation.period_year
                      )
                    : "Mulai hitung jejak karbonmu"}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Leaf size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Emisi Tertinggi Tersimpan
                </p>
                <p className="mt-2 truncate text-xl font-bold text-charcoal">
                  {isLoadingData
                    ? "—"
                    : highestEmission
                      ? formatEmission(highestEmission.total_monthly_kg)
                      : "Belum ada"}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {highestEmission?.highest_category || "Belum ada kategori"}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </section>

        {/* Chart and latest calculation */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  Tren Jejak Karbon
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enam perhitungan terbaru yang tersimpan
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <TrendingUp size={20} />
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-gray-50 px-4 text-center">
                <BarChart3 className="mb-3 h-8 w-8 text-gray-400" />
                <p className="font-medium text-charcoal">
                  Belum ada data untuk ditampilkan
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Lakukan perhitungan pertama untuk melihat tren emisi.
                </p>
                <Link
                  href="/kalkulator"
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Mulai menghitung <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex h-48 items-end gap-3 border-b border-gray-100 pb-2 sm:gap-5">
                  {chartData.map((item, index) => {
                    const emission = Number(item.total_monthly_kg ?? 0);
                    const height = Math.max(
                      (emission / maxEmission) * 100,
                      4
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="max-w-full truncate text-center text-[10px] text-gray-500 sm:text-xs">
                          {emission.toLocaleString("id-ID", {
                            maximumFractionDigits: 1,
                          })}
                        </span>

                        <div className="flex h-[65%] w-full items-end justify-center">
                          <div
                            title={formatEmission(emission)}
                            className={`w-full max-w-12 rounded-t-lg transition-all ${
                              index === chartData.length - 1
                                ? "bg-emerald-700"
                                : "bg-emerald-300"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>

                        <span className="max-w-full truncate text-center text-[10px] text-gray-500 sm:text-xs">
                          {item.period_month && item.period_year
                            ? `${MONTHS[item.period_month - 1]?.slice(0, 3) ?? ""} ${String(item.period_year).slice(-2)}`
                            : `Data ${index + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Satuan: kg CO₂e. Grafik membandingkan hasil perhitungan
                  tersimpan, bukan perubahan emisi yang sudah dipastikan
                  terjadi.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CalendarDays size={22} />
              </div>
              <div>
                <h2 className="font-bold text-charcoal">
                  Perhitungan Terbaru
                </h2>
                <p className="text-sm text-gray-500">
                  Ringkasan hasilmu
                </p>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : latestCalculation ? (
              <>
                <p className="text-sm text-gray-500">
                  {formatPeriod(
                    latestCalculation.period_month,
                    latestCalculation.period_year
                  )}
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal">
                  {formatEmission(latestCalculation.total_monthly_kg)}
                </p>

                <div className="mt-4 rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-800">
                    Kategori emisi tertinggi
                  </p>
                  <p className="mt-1 font-semibold text-emerald-950">
                    {latestCalculation.highest_category || "Belum tersedia"}
                  </p>
                </div>

                <Link
                  href="/riwayat"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Lihat seluruh riwayat
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Kamu belum menyimpan hasil perhitungan. Mulai dari
                  aktivitas sehari-harimu untuk mengetahui perkiraan jejak
                  karbon.
                </p>
                <Link
                  href="/kalkulator"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Mulai menghitung <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Green Action banner */}
        <section className="overflow-hidden rounded-2xl bg-emerald-900 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-emerald-200">
                <Sparkles size={20} />
                <span className="text-sm font-semibold">
                  Langkah Kecil, Dampak Berarti
                </span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Yuk, mulai kebiasaan yang lebih ramah lingkungan!
              </h2>

              <p className="mt-3 text-sm leading-6 text-emerald-100 sm:text-base">
                Coba pilih aksi sederhana yang bisa kamu lakukan sebagai
                mahasiswa, mulai dari mengurangi plastik sekali pakai,
                menghemat listrik di kos, hingga memilih transportasi yang
                lebih efisien.
              </p>
            </div>

            <Link
              href="/green-action"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Lihat Green Action
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Footer note */}
        <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-gray-500">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Ringkasan ini menggunakan data perhitungan yang tersimpan di
            akunmu. Angka emisi merupakan estimasi berdasarkan faktor emisi
            yang digunakan CarbonAceh.
          </p>
        </div>
      </div>
    </div>
  );
}
