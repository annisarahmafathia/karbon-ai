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
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { CarbonCalculation } from "@/types/database";
import {
  CATEGORY_LABELS,
  parseResultSnapshot,
  isPlasticCalculationResult,
} from "@/lib/history/snapshot";

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

function formatEmission(value: number | null | undefined, unit = "kg CO₂e / minggu") {
  return `${Number(value ?? 0).toLocaleString("id-ID", {
    maximumFractionDigits: 3,
  })} ${unit}`;
}

function formatPeriod(calculation: CarbonCalculation | undefined) {
  if (!calculation) return "Belum ada periode";

  if (calculation.period_week) {
    return `Minggu ke-${calculation.period_week}, ${calculation.period_year ?? new Date().getFullYear()}`;
  }

  if (calculation.period_month && calculation.period_year) {
    return `${MONTHS[calculation.period_month - 1] ?? "Periode"} ${calculation.period_year}`;
  }

  return "Periode mingguan";
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
  const latestSnapshot = latestCalculation
    ? parseResultSnapshot(latestCalculation.result_snapshot)
    : null;

  const isWeeklyPlastic =
    latestCalculation?.methodology_version === "v2_plastik_mingguan" ||
    (latestCalculation?.total_weekly_kg != null && latestCalculation.total_weekly_kg > 0) ||
    (latestSnapshot != null && isPlasticCalculationResult(latestSnapshot));

  const latestEmissionValue = isWeeklyPlastic
    ? latestCalculation?.total_weekly_kg ??
      (latestSnapshot && isPlasticCalculationResult(latestSnapshot)
        ? latestSnapshot.totalWeeklyKgCO2e
        : latestCalculation?.total_monthly_kg)
    : latestCalculation?.total_monthly_kg;

  const latestHotspot =
    latestSnapshot && isPlasticCalculationResult(latestSnapshot)
      ? latestSnapshot.highestCategory.label
      : latestCalculation?.highest_category
      ? CATEGORY_LABELS[latestCalculation.highest_category] ?? latestCalculation.highest_category
      : "Belum ada";

  // Rekap hingga 6 minggu perhitungan terbaru untuk grafik tren mingguan
  const chartData = useMemo(() => {
    // Kelompokkan perhitungan mingguan yang sudah tersimpan di database.
    // Karena calculations diurutkan created_at DESC, catatan pertama yang ditemukan untuk tiap minggu adalah hasil simpan terakhir.
    const weeklyMap = new Map<string, CarbonCalculation>();
    for (const calc of calculations) {
      const year = calc.period_year ?? new Date(calc.created_at).getFullYear();
      const weekKey = calc.period_week
        ? `Y${year}-W${calc.period_week}`
        : `Y${year}-M${calc.period_month ?? new Date(calc.created_at).getMonth() + 1}`;
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, calc);
      }
    }

    // Ambil maksimal 6 minggu terbaru, urutkan dari terlama ke terbaru (kiri ke kanan)
    const recent = Array.from(weeklyMap.values()).slice(0, 6).reverse();

    if (recent.length === 0) {
      return [
        { label: "Mgg 1", total: 0 },
        { label: "Mgg 2", total: 0 },
        { label: "Mgg 3", total: 0 },
        { label: "Mgg 4", total: 0 },
        { label: "Mgg 5", total: 0 },
        { label: "Terbaru", total: 0 },
      ];
    }

    return recent.map((item, idx) => {
      const snap = parseResultSnapshot(item.result_snapshot);
      const isPlastic =
        item.methodology_version === "v2_plastik_mingguan" ||
        (item.total_weekly_kg != null && item.total_weekly_kg > 0) ||
        (snap != null && isPlasticCalculationResult(snap));

      const val = isPlastic
        ? Number(
            item.total_weekly_kg ??
              (snap && isPlasticCalculationResult(snap)
                ? snap.totalWeeklyKgCO2e
                : item.total_monthly_kg ?? 0)
          )
        : Number(item.total_monthly_kg ?? 0);

      const label = item.period_week
        ? `W${item.period_week}`
        : item.period_month
        ? `${MONTHS[item.period_month - 1]?.slice(0, 3)}`
        : `#${idx + 1}`;

      return {
        label,
        total: val,
        isPlastic,
      };
    });
  }, [calculations]);

  const maxEmission = Math.max(...chartData.map((item) => item.total), 0.5);

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
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dashboard KarbonAI · Plastik Sekali Pakai</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
              Halo, {displayName}!
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Pantau penggunaan plastik sekali pakai harianmu dan temukan langkah sederhana untuk mengurangi timbulan sampah plastik dari kehidupan sehari-hari.
            </p>
          </div>

          <Link
            href="/kalkulator"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-dark shadow-sm"
          >
            <Calculator size={18} />
            Hitung Jejak Plastik
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
                  Riwayat perhitungan tersimpan
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
                      ? formatEmission(
                          latestEmissionValue,
                          isWeeklyPlastic ? "kg CO₂e/minggu" : "kg CO₂e/bln"
                        )
                      : "Belum ada"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {latestCalculation
                    ? formatPeriod(latestCalculation)
                    : "Mulai hitung jejak plastikmu"}
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
                  Hotspot Emisi Plastik
                </p>
                <p className="mt-2 truncate text-xl font-bold text-charcoal">
                  {isLoadingData
                    ? "—"
                    : latestHotspot}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {latestCalculation ? "Kategori penyumbang emisi tertinggi" : "Belum ada data"}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <ShoppingBag size={24} />
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
                  Tren Emisi Plastik Sekali Pakai
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Perkembangan emisi mingguan dari catatan perhitungan terbarumu
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
                        key={index}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="max-w-full truncate text-center text-[10px] text-gray-500 sm:text-xs font-semibold">
                          {emission.toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <div className="flex h-[65%] w-full items-end justify-center">
                          <div
                            title={`${item.label}: ${emission} kg CO₂e`}
                            className={`w-full max-w-12 rounded-t-lg transition-all ${
                              index === chartData.length - 1
                                ? "bg-forest"
                                : "bg-sage"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>

                        <span className="max-w-full truncate text-center text-[10px] text-gray-500 sm:text-xs">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Satuan: kg CO₂e per minggu (metodologi plastik sekali pakai baru). Nilai 0 menunjukkan minggu tanpa penggunaan plastik baru.
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
                  Perhitungan Terakhir
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
                  {formatPeriod(latestCalculation)}
                </p>

                <p className="mt-2 text-2xl font-bold text-charcoal">
                  {isWeeklyPlastic
                    ? formatEmission(latestCalculation.total_weekly_kg, "kg CO₂e/minggu")
                    : formatEmission(latestCalculation.total_monthly_kg, "kg CO₂e/bln")}
                </p>

                <div className="mt-4 rounded-xl bg-mint p-3">
                  <p className="text-xs text-forest">
                    Kategori emisi tertinggi
                  </p>
                  <p className="mt-1 font-semibold text-emerald-950">
                    {CATEGORY_LABELS[latestCalculation.highest_category] ?? latestCalculation.highest_category}
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
                  Kamu belum menyimpan hasil perhitungan. Hitung penggunaan kantong plastik, wadah makanan, botol minum, dan styrofoam untuk melihat jejak karbonmu.
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
                  Aksi Nyata Kurangi Plastik
                </span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Kurangi plastik sekali pakai, mulai dari hari ini!
              </h2>

              <p className="mt-3 text-sm leading-6 text-cream sm:text-base">
                Bawa tas kain sendiri, pilih botol tumbler isi ulang, bawa wadah makanan sendiri saat membeli makanan bungkus, dan tolak kemasan styrofoam.
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