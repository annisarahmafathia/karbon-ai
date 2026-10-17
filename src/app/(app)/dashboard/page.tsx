"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CalendarDays,
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

  // Selalu tampilkan enam bulan kalender terakhir.
  // Data diambil dari hasil terbaru untuk setiap bulan.
  const chartData = useMemo(() => {
    const monthlyData = new Map<
      string,
      {
        month: number;
        year: number;
        total: number;
      }
    >();

    // Query Supabase mengurutkan hasil dari terbaru ke terlama.
    // Karena itu, data pertama untuk setiap bulan adalah hasil terbaru.
    for (const calculation of calculations) {
      const month = calculation.period_month;
      const year = calculation.period_year;

      if (
        month == null ||
        year == null ||
        month < 1 ||
        month > 12
      ) {
        continue;
      }

      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (monthlyData.has(key)) continue;

      monthlyData.set(key, {
        month,
        year,
        total: Number(calculation.total_monthly_kg ?? 0),
      });
    }

    const now = new Date();
    const lastSixMonths: {
      month: number;
      year: number;
      total: number;
    }[] = [];

    // Mulai dari lima bulan sebelum bulan ini sampai bulan ini.
    // Urutan hasil otomatis dari kiri ke kanan.
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${String(month).padStart(2, "0")}`;

      lastSixMonths.push(
        monthlyData.get(key) ?? {
          month,
          year,
          total: 0,
        }
      );
    }

    return lastSixMonths;
  }, [calculations]);

  const highestEmission = useMemo(() => {
    return calculations.reduce((highest, calculation) => {
      return Number(calculation.total_monthly_kg ?? 0) >
        Number(highest?.total_monthly_kg ?? 0)
        ? calculation
        : highest;
    }, calculations[0]);
  }, [calculations]);

  const maxEmission = Math.max(
    ...chartData.map((item) => item.total),
    1
  );

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-forest">
              Dashboard KarbonAI
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
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest"
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
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm">
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
              <div className="rounded-xl bg-mint p-3 text-forest">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm">
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

          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
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
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  Tren Jejak Karbon
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Rekap emisi bulanan selama 6 bulan terakhir
                </p>
              </div>
              <div className="rounded-xl bg-mint p-2 text-forest">
                <TrendingUp size={20} />
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-forest" />
              </div>
            ) : (
              <div>
                <div className="flex h-48 items-end gap-3 border-b border-gray-100 pb-2 sm:gap-5">
                  {chartData.map((item, index) => {
                    const emission = item.total;
                    const height = Math.max(
                      (emission / maxEmission) * 100,
                      4
                    );

                    return (
                      <div
                        key={`${item.year}-${item.month}`}
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
                                ? "bg-forest"
                                : "bg-sage"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>

                        <span className="max-w-full truncate text-center text-[10px] text-gray-500 sm:text-xs">
                          {`${MONTHS[item.month - 1]?.slice(0, 3) ?? ""} ${String(item.year).slice(-2)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Satuan: kg CO₂e per bulan. Data merangkum hasil perhitungan
                  yang tersimpan pada setiap bulan. Bulan tanpa data
                  ditampilkan dengan nilai 0.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-mint p-3 text-forest">
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
                <Loader2 className="h-6 w-6 animate-spin text-forest" />
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

                <div className="mt-4 rounded-xl bg-mint p-3">
                  <p className="text-xs text-forest">
                    Kategori emisi tertinggi
                  </p>
                  <p className="mt-1 font-semibold text-emerald-950">
                    {latestCalculation.highest_category || "Belum tersedia"}
                  </p>
                </div>

                <Link
                  href="/riwayat"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
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
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
                >
                  Mulai menghitung <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Green Action banner */}
        <section className="overflow-hidden rounded-2xl bg-forest p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sage">
                <Sparkles size={20} />
                <span className="text-sm font-semibold">
                  Langkah Kecil, Dampak Berarti
                </span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Yuk, mulai kebiasaan yang lebih ramah lingkungan!
              </h2>

              <p className="mt-3 text-sm leading-6 text-cream sm:text-base">
                Coba pilih aksi sederhana yang bisa kamu lakukan, mulai dari
                mengurangi plastik sekali pakai, menghemat listrik, hingga
                memilih transportasi yang lebih efisien.
              </p>
            </div>

            <Link
              href="/green-action"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-mint"
            >
              Lihat Green Action
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}