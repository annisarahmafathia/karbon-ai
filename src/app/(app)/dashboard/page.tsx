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
  isLegacyCalculationResult,
  getWeekBounds,
  formatWeekRangeLabel,
  calculateBarHeight,
  calculateYAxisScale,
} from "@/lib/history/snapshot";

/**
 * Format emisi karbon secara aman tanpa mendefaultkan nilai null/undefined menjadi 0.
 */
function formatEmission(value: number | null | undefined, unit = "kg CO₂e/minggu") {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return `${Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${unit}`;
}

function formatPeriod(calculation: CarbonCalculation | undefined | null) {
  if (!calculation) return "Belum ada periode";

  const dateInput = calculation.created_at || calculation.calculation_date;
  if (dateInput) {
    const { start, end } = getWeekBounds(dateInput);
    return `Minggu ${formatWeekRangeLabel(start, end)}`;
  }

  if (calculation.period_week) {
    return `Minggu ke-${calculation.period_week}, ${calculation.period_year ?? new Date().getFullYear()}`;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const handleReload = () => {
    setIsLoadingData(true);
    setLoadError(false);
    setErrorMessage(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    let isMounted = true;

    async function fetchCalculations() {
      try {
        const { data, error } = await supabase
          .from("carbon_calculations")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Gagal mengambil riwayat karbon:", error);
          if (isMounted) {
            setLoadError(true);
            setErrorMessage(error.message);
          }
          return;
        }

        if (isMounted) {
          setCalculations((data ?? []) as CarbonCalculation[]);
        }
      } catch (error) {
        console.error("Terjadi kesalahan saat mengambil data:", error);
        if (isMounted) {
          setLoadError(true);
          setErrorMessage(
            error instanceof Error ? error.message : "Terjadi kesalahan koneksi"
          );
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void fetchCalculations();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, router, supabase, reloadKey]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Mahasiswa Aceh";

  const latestCalculation = calculations.length > 0 ? calculations[0] : null;
  const latestSnapshot = latestCalculation
    ? parseResultSnapshot(latestCalculation.result_snapshot)
    : null;

  const isWeeklyPlastic =
    latestCalculation?.methodology_version === "v2_plastik_mingguan" ||
    (latestCalculation?.total_weekly_kg != null && Number(latestCalculation.total_weekly_kg) >= 0) ||
    (latestSnapshot != null && isPlasticCalculationResult(latestSnapshot));

  // Resolusi nilai emisi yang tangguh:
  // 1. Kolom total_weekly_kg jika terisi angka valid
  // 2. Snapshot totalWeeklyKgCO2e jika kolom belum termigrasi di remote Supabase
  // 3. Kolom total_monthly_kg untuk data historis
  // 4. Null jika data belum tersedia (jangan gunakan 0 sebagai fallback)
  const latestEmissionValue: number | null = useMemo(() => {
    if (!latestCalculation) return null;

    if (isWeeklyPlastic) {
      if (latestCalculation.total_weekly_kg != null) {
        const val = Number(latestCalculation.total_weekly_kg);
        if (!Number.isNaN(val)) return val;
      }
      if (latestSnapshot && isPlasticCalculationResult(latestSnapshot)) {
        const val = Number(latestSnapshot.totalWeeklyKgCO2e);
        if (!Number.isNaN(val)) return val;
      }
      if (latestCalculation.total_monthly_kg != null) {
        const val = Number(latestCalculation.total_monthly_kg);
        if (!Number.isNaN(val)) return val;
      }
      return null;
    }

    if (latestCalculation.total_monthly_kg != null) {
      const val = Number(latestCalculation.total_monthly_kg);
      if (!Number.isNaN(val)) return val;
    }
    if (latestSnapshot && isLegacyCalculationResult(latestSnapshot)) {
      const val = Number(latestSnapshot.totalMonthlyKgCO2e);
      if (!Number.isNaN(val)) return val;
    }
    return null;
  }, [latestCalculation, isWeeklyPlastic, latestSnapshot]);

  const latestHotspot = useMemo(() => {
    if (!latestCalculation) return "Belum ada";

    if (latestSnapshot && isPlasticCalculationResult(latestSnapshot)) {
      return latestSnapshot.highestCategory.label;
    }

    if (latestCalculation.highest_category) {
      return (
        CATEGORY_LABELS[latestCalculation.highest_category] ??
        latestCalculation.highest_category
      );
    }

    return "Belum ada";
  }, [latestCalculation, latestSnapshot]);

  // Data tren emisi mingguan (kronologis dari terlama di kiri ke terbaru di kanan)
  const chartData = useMemo(() => {
    // Kelompokkan perhitungan mingguan yang tersimpan di Supabase berdasarkan rentang minggu (Senin - Minggu)
    // Karena calculations diurutkan created_at DESC, catatan pertama yang ditemukan per minggu adalah hasil simpan terakhir
    const weeklyMap = new Map<
      string,
      {
        key: string;
        label: string;
        fullDateRange: string;
        total: number;
        isPlastic: boolean;
        startDate: Date;
        endDate: Date;
      }
    >();

    for (const calc of calculations) {
      const dateInput = calc.created_at || calc.calculation_date;
      if (!dateInput) continue;

      const { start, end, key } = getWeekBounds(dateInput);

      if (!weeklyMap.has(key)) {
        const snap = parseResultSnapshot(calc.result_snapshot);
        const isPlastic =
          calc.methodology_version === "v2_plastik_mingguan" ||
          (calc.total_weekly_kg != null && Number(calc.total_weekly_kg) >= 0) ||
          (snap != null && isPlasticCalculationResult(snap));

        let val: number = 0;
        if (isPlastic) {
          if (calc.total_weekly_kg != null && !Number.isNaN(Number(calc.total_weekly_kg))) {
            val = Number(calc.total_weekly_kg);
          } else if (snap && isPlasticCalculationResult(snap)) {
            const snapVal = Number(snap.totalWeeklyKgCO2e);
            if (!Number.isNaN(snapVal)) val = snapVal;
          } else if (calc.total_monthly_kg != null && !Number.isNaN(Number(calc.total_monthly_kg))) {
            val = Number(calc.total_monthly_kg) / 4;
          }
        } else {
          if (calc.total_monthly_kg != null && !Number.isNaN(Number(calc.total_monthly_kg))) {
            val = Number(calc.total_monthly_kg) / 4;
          } else if (snap && isLegacyCalculationResult(snap)) {
            const legacyVal = Number(snap.totalMonthlyKgCO2e);
            if (!Number.isNaN(legacyVal)) val = legacyVal / 4;
          }
        }

        // Sanitasi angka agar tidak pernah NaN, undefined, null, atau bernilai negatif
        if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val) || val < 0) {
          val = 0;
        }

        const label = formatWeekRangeLabel(start, end);
        const fullDateRange = `${start.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} – ${end.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`;

        weeklyMap.set(key, {
          key,
          label,
          fullDateRange,
          total: val,
          isPlastic,
          startDate: start,
          endDate: end,
        });
      }
    }

    if (weeklyMap.size === 0) {
      return [];
    }

    // Urutkan minggu secara kronologis (dari terlama di kiri ke terbaru di kanan)
    const sortedPoints = Array.from(weeklyMap.values()).sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    // Ambil maksimal 8 minggu data terbaru untuk tampilan grafik
    return sortedPoints.slice(-8);
  }, [calculations]);

  const { yAxisMax, yAxisMid } = useMemo(() => {
    if (chartData.length === 0) return { yAxisMax: 1.0, yAxisMid: 0.5 };
    const values = chartData.map((item) => (Number.isFinite(item.total) ? item.total : 0));
    const peak = Math.max(...values, 0);
    return calculateYAxisScale(peak);
  }, [chartData]);

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

        {/* Error Banner */}
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">Riwayat perhitungan belum bisa dimuat</p>
              <p className="text-xs text-red-600 mt-0.5">
                {errorMessage || "Terjadi kendala saat mengambil data kalkulasi dari database."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 text-xs font-semibold transition"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* Summary cards: 2 kartu (Total Perhitungan & Hotspot) */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Card 1: Total Perhitungan */}
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Perhitungan
                </p>
                <p className="mt-2 text-3xl font-bold text-charcoal">
                  {isLoadingData ? "—" : loadError ? "—" : calculations.length}
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

          {/* Card 2: Hotspot Emisi Plastik */}
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Hotspot Emisi Plastik
                </p>
                <p className="mt-2 truncate text-xl font-bold text-charcoal">
                  {isLoadingData ? "—" : loadError ? "—" : latestHotspot}
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

        {/* Chart and Perhitungan Terakhir */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column: Tren Emisi Mingguan */}
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  Tren Emisi Mingguan
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Perkembangan emisi plastik sekali pakai per minggu (kg CO₂e/minggu)
                </p>
              </div>
              <div className="rounded-xl bg-mint p-2 text-forest">
                <TrendingUp size={20} />
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-forest" />
              </div>
            ) : loadError ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-gray-500">
                  Grafik tren belum dapat ditampilkan karena riwayat gagal dimuat.
                </p>
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-white px-3 py-1.5 text-xs font-semibold text-forest hover:bg-mint"
                >
                  Muat Ulang Data
                </button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-gray-500">
                <BarChart3 className="h-8 w-8 text-sage" />
                <p className="text-sm font-medium">Belum ada data grafik</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Grafik tren mingguan akan muncul otomatis setelah kamu menyimpan hasil kalkulasi jejak plastik pertamamu.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-stretch gap-2 sm:gap-3">
                  {/* Sumbu Y (kg CO₂e) - Tetap di sebelah kiri tidak ikut tergeser */}
                  <div
                    style={{ height: "192px" }}
                    className="flex w-12 sm:w-16 flex-shrink-0 flex-col justify-between text-right text-[10px] sm:text-xs text-gray-400 font-medium select-none"
                  >
                    <span>
                      {yAxisMax.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                      })}{" "}
                      kg
                    </span>
                    <span>
                      {yAxisMid.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                      })}{" "}
                      kg
                    </span>
                    <span>0 kg</span>
                  </div>

                  {/* Area Batang Grafik & Sumbu X (Rata Kiri, Scrollable jika melebihi lebar layar) */}
                  <div className="relative flex-1 min-w-0 flex flex-col">
                    <div className="overflow-x-auto pb-1">
                      <div className="min-w-full w-max flex flex-col">
                        {/* Plot Area dengan batas tinggi pasti dan gridlines membentang penuh */}
                        <div
                          style={{ height: "192px" }}
                          className="relative min-w-full border-b border-gray-300"
                        >
                          {/* Garis bantu horizontal (Grid lines) */}
                          <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100 pointer-events-none" />
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-100 pointer-events-none" />

                          {/* Kontainer Batang Vertikal - Rata Kiri (justify-start) & items-stretch */}
                          <div
                            style={{ height: "192px" }}
                            className="h-full flex items-stretch justify-start gap-3 sm:gap-5 px-2"
                          >
                            {chartData.map((item, index) => {
                              const barInfo = calculateBarHeight(item.total, yAxisMax);
                              const isLatest = index === chartData.length - 1;
                              const isZero = barInfo.isZero;

                              const formattedEmission = isZero
                                ? "0"
                                : item.total.toLocaleString("id-ID", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  });

                              // Deteksi jika tinggi batang berdekatan dengan tetangga (< 8%)
                              const prevItem = index > 0 ? chartData[index - 1] : null;
                              const prevHeight = prevItem
                                ? calculateBarHeight(prevItem.total, yAxisMax).heightPercent
                                : null;
                              const nextItem =
                                index < chartData.length - 1 ? chartData[index + 1] : null;
                              const nextHeight = nextItem
                                ? calculateBarHeight(nextItem.total, yAxisMax).heightPercent
                                : null;

                              const isCloseToNeighbor =
                                !isZero &&
                                ((prevHeight !== null &&
                                  Math.abs(barInfo.heightPercent - prevHeight) < 8) ||
                                 (nextHeight !== null &&
                                  Math.abs(barInfo.heightPercent - nextHeight) < 8));

                              // Jarak vertikal yang jelas (7px di atas ujung batang).
                              // Jika ada tetangga dengan tinggi hampir sama, lakukan stagger vertikal (+14px pada index ganjil)
                              // agar kedua label tetap terbaca tanpa saling bertabrakan atau menggeser batang.
                              const verticalOffsetPx = isCloseToNeighbor && index % 2 === 1 ? 14 : 7;

                              // Hitung tinggi batang aktual dalam pixel (plot area = 192px)
                              const barHeightPx = Math.max(
                                barInfo.minHeightPx ?? 8,
                                (barInfo.heightPercent / 100) * 192
                              );

                              // Posisi bottom untuk label angka:
                              // - Untuk emisi 0: indikator berbentuk kapsul (tinggi 6px + pb-1 4px = 10px dari baseline).
                              //   Jarak 7px di atasnya -> bottom: 17px.
                              // - Untuk emisi positif: diposisikan 7-14px tepat di atas ujung batang (barHeightPx + verticalOffsetPx),
                              //   dibatasi maksimal 168px agar tidak terpotong oleh batas atas plot area (192px).
                              const labelBottomPx = isZero
                                ? 17
                                : Math.min(Math.round(barHeightPx + verticalOffsetPx), 168);

                              return (
                                <div
                                  key={item.key}
                                  className="relative h-full w-16 sm:w-20 flex-shrink-0 group"
                                >
                                  {isZero ? (
                                    /* Indikator Emisi 0 (Zero-Waste) yang jelas pada baseline */
                                    <div
                                      title={`Minggu ${item.label}: 0 kg CO₂e (Bebas emisi plastik baru)`}
                                      style={{ maxWidth: "40px" }}
                                      className="absolute bottom-0 inset-x-0 mx-auto flex flex-col items-center justify-end pb-1 z-0"
                                    >
                                      <div className="flex items-center justify-center">
                                        <span
                                          className="h-1.5 w-6 sm:w-8 rounded-full shadow-xs ring-2 ring-mint transition-transform duration-200 group-hover:scale-110"
                                          style={{ backgroundColor: "#10B981" }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    /* Batang Emisi Positif */
                                    <div
                                      title={`Minggu ${item.label}: ${formattedEmission} kg CO₂e/minggu`}
                                      style={{
                                        height: `${barInfo.heightPercent}%`,
                                        minHeight: `${barInfo.minHeightPx}px`,
                                        maxWidth: "40px",
                                        backgroundColor: isLatest ? "#234B38" : "#8FAF91",
                                      }}
                                      className={`absolute bottom-0 inset-x-0 mx-auto w-full rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-sm z-0 ${
                                        isLatest ? "bg-forest" : "bg-sage hover:bg-forest/70"
                                      }`}
                                    />
                                  )}

                                  {/* Label Angka Emisi Tepat di Atas Batang/Indikator (Stabil di Safari & Chrome) */}
                                  <div
                                    style={{
                                      bottom: `${labelBottomPx}px`,
                                    }}
                                    className="absolute inset-x-0 flex items-center justify-center pointer-events-none z-10 select-none"
                                  >
                                    <span
                                      className={`inline-block px-1 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                                        isLatest
                                          ? "text-forest font-bold group-hover:text-forest-dark"
                                          : "text-charcoal/80 group-hover:text-forest"
                                      }`}
                                    >
                                      {formattedEmission}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sumbu X: Label Rentang Tanggal di bawah garis dasar - Rata Kiri sejajar batang */}
                        <div className="flex items-start justify-start gap-3 sm:gap-5 px-2 pt-2">
                          {chartData.map((item, index) => {
                            const isLatest = index === chartData.length - 1;
                            return (
                              <div
                                key={`label-${item.key}`}
                                className="w-16 sm:w-20 flex-shrink-0 text-center"
                              >
                                <span
                                  title={item.fullDateRange}
                                  className={`block truncate text-[10px] sm:text-xs transition-colors ${
                                    isLatest ? "font-bold text-forest" : "text-gray-600 font-medium"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-gray-500">
                  <p>
                    <span className="font-semibold text-charcoal">Sumbu Y:</span> Emisi karbon (kg CO₂e/minggu) ·{" "}
                    <span className="font-semibold text-charcoal">Sumbu X:</span> Rentang tanggal per minggu
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Batang hijau tua adalah minggu kalkulasi terbaru.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Perhitungan Terakhir (Satu-satunya komponen hasil perhitungan pengguna) */}
          <div className="rounded-2xl border border-sage/30 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
            <div>
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
                <div className="flex h-36 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-forest" />
                  <p className="text-xs text-gray-400">Memuat ringkasan...</p>
                </div>
              ) : loadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">Gagal memuat perhitungan</p>
                  <p className="mt-1 text-xs text-red-600">
                    {errorMessage || "Data perhitungan terakhir belum dapat ditampilkan."}
                  </p>
                  <button
                    type="button"
                    onClick={handleReload}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 underline hover:text-red-950"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : latestCalculation ? (
                <>
                  <p className="text-sm text-gray-500">
                    {formatPeriod(latestCalculation)}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-charcoal">
                    {latestEmissionValue != null
                      ? formatEmission(
                          latestEmissionValue,
                          isWeeklyPlastic ? "kg CO₂e/minggu" : "kg CO₂e/bln"
                        )
                      : "Data tidak tersedia"}
                  </p>

                  {latestEmissionValue === 0 && (
                    <p className="mt-1 text-xs font-semibold text-forest flex items-center gap-1">
                      <Leaf size={14} /> Zero-Waste Hero! (0 emisi plastik baru)
                    </p>
                  )}

                  <div className="mt-4 rounded-xl bg-mint/50 border border-mint/60 p-3">
                    <p className="text-xs font-medium text-forest">
                      Kategori emisi tertinggi
                    </p>
                    <p className="mt-1 font-semibold text-emerald-950">
                      {latestHotspot}
                    </p>
                  </div>
                </>
              ) : (
                /* Empty state informatif jika belum ada kalkulasi */
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-mint text-forest mb-3">
                    <Leaf size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-charcoal">
                    Belum ada perhitungan karbon
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    Yuk, mulai hitung jejak karbon dari penggunaan plastik sekali pakaimu!
                  </p>
                  <Link
                    href="/kalkulator"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-dark shadow-sm"
                  >
                    Mulai Menghitung <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* Tautan ke Riwayat Lengkap (hanya jika ada riwayat) */}
            {!isLoadingData && !loadError && latestCalculation && (
              <div className="mt-5 pt-3 border-t border-gray-100">
                <Link
                  href="/riwayat"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
                >
                  Lihat seluruh riwayat
                  <ArrowRight size={16} />
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