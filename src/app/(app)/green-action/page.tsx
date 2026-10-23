"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useCalculator } from "@/context/CalculatorContext";
import {
  GreenActionApiResponse,
  GreenActionAnalysisResult,
  PersonalizedAction,
} from "@/types/green-action";
import {
  generateRuleBasedGreenActions,
} from "@/lib/ai/green-action";
import {
  Sparkles,
  Filter,
  ArrowRight,
  TrendingDown,
  Coins,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Flame,
  Info,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function GreenActionPage() {
  const { input, result } = useCalculator();

  const [apiResponse, setApiResponse] = useState<GreenActionApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const isZeroPlastic = result.totalItemsPerWeek === 0 || result.totalWeeklyKgCO2e === 0;

  // Panggil analisis setiap kali hasil perhitungan berubah
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await fetch("/api/green-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input, result }),
        });

        if (!res.ok) {
          throw new Error(`HTTP_${res.status}`);
        }

        const data: GreenActionApiResponse = await res.json();
        if (!ignore) {
          setApiResponse(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("[GreenAction] Gagal memuat rekomendasi via API, menggunakan fallback lokal:", err);
        if (!ignore) {
          const fallbackData = generateRuleBasedGreenActions(input, result);
          setApiResponse({
            success: true,
            isAiGenerated: false,
            source: "rule_based_fallback",
            data: fallbackData,
            message:
              "Koneksi ke server AI terputus. Rekomendasi dihitung langsung secara presisi menggunakan metodologi ilmiah KarbonAI.",
          });
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [input, result]);

  // Tombol refresh manual yang dipicu interaksi pengguna
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/green-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, result }),
      });

      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }

      const data: GreenActionApiResponse = await res.json();
      setApiResponse(data);
    } catch (err) {
      console.warn("[GreenAction] Gagal memuat rekomendasi via API, menggunakan fallback lokal:", err);
      const fallbackData = generateRuleBasedGreenActions(input, result);
      setApiResponse({
        success: true,
        isAiGenerated: false,
        source: "rule_based_fallback",
        data: fallbackData,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [input, result]);

  const analysisData: GreenActionAnalysisResult | null = apiResponse?.data ?? null;

  // Filter rekomendasi berdasarkan kategori dan tingkat prioritas
  const filteredActions: PersonalizedAction[] = useMemo(() => {
    if (!analysisData?.recommendations) return [];

    return analysisData.recommendations.filter((act) => {
      if (selectedCategory !== "all" && act.category !== selectedCategory) {
        return false;
      }
      if (selectedPriority !== "all" && act.priority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [analysisData, selectedCategory, selectedPriority]);

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Green Action Berbasis AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Rekomendasi Aksi Nyata Pengurangan Sampah Plastik
          </h1>

          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            AI menganalisis hasil kalkulasi jejak karbon mingguanmu, mengidentifikasi hotspot emisi
            terbesar, dan menyusun langkah praktis yang relevan serta dapat langsung kamu terapkan
            dalam kehidupan sehari-hari.
          </p>

          {/* AI vs Fallback Status Indicator */}
          {apiResponse && (
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {apiResponse.isAiGenerated ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>Dianalisis oleh AI KarbonAI (Personal)</span>
                  {apiResponse.modelName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono">
                      {apiResponse.modelName}
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium shadow-xs">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Rekomendasi Berbasis Metodologi Ilmiah (Fallback)</span>
                  <span className="text-[11px] text-amber-800/80 hidden sm:inline">
                    • API AI belum dikonfigurasi / offline
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-mint/40 border border-sage/40 text-xs font-bold text-forest transition-all shadow-xs disabled:opacity-50"
                title="Muat ulang rekomendasi AI"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-forest" : ""}`}
                />
                <span>{isRefreshing ? "Menganalisis..." : "Analisis Ulang"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-sage/30 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-mint flex items-center justify-center text-forest animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-charcoal">
              AI KarbonAI sedang menganalisis kebiasaan plastikmu...
            </h2>
            <p className="text-xs text-muted max-w-md mx-auto">
              Memeriksa emisi dari {result.totalItemsPerWeek} barang plastik mingguan dan menghitung
              langkah pengurangan yang paling berdampak besar.
            </p>
          </div>
        )}

        {!isLoading && analysisData && (
          <>
            {/* Zero Plastic Hero Banner */}
            {isZeroPlastic && (
              <div className="bg-gradient-to-br from-mint/70 via-mint/40 to-cream rounded-3xl p-6 sm:p-8 border border-sage/40 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-forest text-cream flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-9 h-9 text-mint" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-2.5 py-0.5 rounded-full bg-white/80 border border-sage/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                    <span>Pahlawan Bebas Plastik Sekali Pakai</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-charcoal">
                    Kamu Sudah Bebas Plastik Sekali Pakai Minggu Ini!
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed max-w-2xl">
                    {analysisData.habitAnalysis}
                  </p>
                </div>
              </div>
            )}

            {/* Non-Zero Habit Analysis & Hotspot Overview */}
            {!isZeroPlastic && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Habit Analysis Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-forest" />
                      <span>Analisis Kebiasaan Pengguna oleh AI</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-charcoal leading-snug">
                      Gambaran Pola Konsumsi Plastik Mingguanmu
                    </h2>

                    <p className="text-xs sm:text-sm text-charcoal/90 leading-relaxed bg-cream/50 p-4 rounded-2xl border border-sage/20">
                      {analysisData.habitAnalysis}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-sage/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-forest" />
                      <span>
                        Total Barang: <strong>{result.totalItemsPerWeek} barang / minggu</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-forest" />
                      <span>
                        Total Emisi: <strong>~{result.totalWeeklyKgCO2e} kg CO₂e / minggu</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Primary Priority Hotspot Card */}
                <div className="bg-forest text-cream rounded-3xl p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-forest text-[11px] font-black uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      <span>Prioritas Reduksi Utama</span>
                    </div>

                    <div>
                      <span className="text-xs text-mint/90 block">Kategori Emisi Tertinggi</span>
                      <h3 className="text-xl sm:text-2xl font-black text-cream">
                        {analysisData.primaryPriority.categoryLabel}
                      </h3>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-3.5 border border-white/15 space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-mint font-semibold">Emisi Mingguan</span>
                        <span className="text-base font-extrabold text-cream">
                          ~{analysisData.primaryPriority.weeklyKgCO2e} kg CO₂e
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-cream/80">
                        <span>Kontribusi Total</span>
                        <span className="font-bold text-mint">
                          {analysisData.primaryPriority.percentage}% dari seluruh emisi
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-cream/85 leading-relaxed">
                      {analysisData.primaryPriority.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-mint/90 relative z-10">
                    <span>{analysisData.primaryPriority.itemCountPerWeek} barang / minggu</span>
                    <span className="font-semibold flex items-center gap-1">
                      Fokus Utama AI <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Decorative Background Blob */}
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-mint/20 rounded-full blur-2xl pointer-events-none" />
                </div>
              </div>
            )}

            {/* Filter Controls Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <Filter className="w-4 h-4 text-forest shrink-0" />
                <span className="text-xs font-bold text-charcoal shrink-0 mr-1">Kategori:</span>

                {[
                  { id: "all", label: "Semua Kategori" },
                  { id: "kantong_plastik", label: "Kantong Plastik" },
                  { id: "wadah_makanan", label: "Wadah Makanan" },
                  { id: "botol_minum", label: "Botol Minum" },
                  { id: "wadah_styrofoam", label: "Wadah Styrofoam" },
                ].map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => setSelectedCategory(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === f.id
                        ? "bg-forest text-cream shadow-xs"
                        : "bg-cream text-charcoal hover:bg-mint/60"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-charcoal shrink-0">Prioritas:</span>
                {[
                  { id: "all", label: "Semua" },
                  { id: "Utama", label: "Prioritas Utama" },
                  { id: "Tambahan", label: "Tambahan" },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPriority(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedPriority === p.id
                        ? "bg-charcoal text-white"
                        : "bg-cream text-muted hover:text-charcoal"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-charcoal flex items-center gap-2">
                  <span>Daftar Tindakan Personal untuk Profilmu</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-mint text-forest font-bold">
                    {filteredActions.length} Rekomendasi
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredActions.map((action) => {
                  const isPrimary = action.priority === "Utama";

                  return (
                    <div
                      key={action.id}
                      className={`rounded-3xl p-6 sm:p-7 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between border ${
                        isPrimary
                          ? "border-forest/40 ring-1 ring-forest/20"
                          : "border-sage/30 hover:border-sage"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Badges Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                isPrimary
                                  ? "bg-forest text-cream shadow-xs"
                                  : "bg-cream text-charcoal border border-sage/30"
                              }`}
                            >
                              {isPrimary ? "★ Prioritas Utama" : "Rekomendasi Tambahan"}
                            </span>

                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-mint/50 text-forest border border-sage/20">
                              {action.categoryLabel}
                            </span>
                          </div>

                          <span className="text-[11px] font-semibold text-muted">
                            {action.difficulty}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-base sm:text-lg font-extrabold text-charcoal leading-snug">
                          {action.title}
                        </h4>

                        {/* Alasan Rekomendasi (Why this action fits user's habit) */}
                        <div className="bg-cream/60 rounded-2xl p-3.5 border border-sage/20 text-xs text-charcoal/90 space-y-1">
                          <div className="font-bold text-forest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-forest shrink-0" />
                            <span>Alasan Rekomendasi Personal</span>
                          </div>
                          <p className="text-[11px] text-charcoal/80 leading-relaxed">
                            {action.reason}
                          </p>
                        </div>

                        {/* Practical Steps Checklist */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                            Langkah Praktis Sehari-Hari:
                          </span>
                          <ul className="space-y-1.5">
                            {action.practicalSteps.map((step, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-charcoal/85 flex items-start gap-2 bg-white p-2 rounded-xl border border-sage/20 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Potential Impact Box (Scientifically Verified) */}
                        <div className="bg-mint/40 rounded-2xl p-3.5 border border-sage/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-forest">
                              <ShieldCheck className="w-4 h-4 text-forest" />
                              <span>Dampak Potensial Pengurangan Emisi</span>
                            </div>
                            <span className="text-xs font-black text-forest-dark">
                              {action.potentialImpact.formattedSaving}
                            </span>
                          </div>

                          <p className="text-[11px] text-forest-dark leading-relaxed">
                            {action.potentialImpact.qualitativeBenefit}
                          </p>
                        </div>

                        {/* Local Context / Tips Mahasiswa */}
                        {action.localContext && (
                          <div className="bg-cream/70 rounded-2xl p-3 border border-sage/20 text-xs text-charcoal/80 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-forest font-semibold">Tips Praktis: </strong>
                              <span>{action.localContext}</span>
                            </div>
                          </div>
                        )}

                        {/* Financial Benefit */}
                        {action.financialBenefit && (
                          <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                            <Coins className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-amber-800 font-semibold">
                                Manfaat Finansial:{" "}
                              </strong>
                              <span>{action.financialBenefit}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filter Empty State */}
              {filteredActions.length === 0 && (
                <div className="bg-white rounded-3xl p-8 border border-sage/30 text-center space-y-3">
                  <p className="text-sm font-semibold text-charcoal">
                    Tidak ada rekomendasi untuk filter yang dipilih.
                  </p>
                  <p className="text-xs text-muted">
                    Coba ganti pilihan kategori atau prioritas untuk melihat rekomendasi lainnya.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedPriority("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-forest text-cream text-xs font-bold hover:bg-forest-dark transition-all"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-sage/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/hasil"
            className="text-xs sm:text-sm font-bold text-forest hover:underline flex items-center gap-1.5"
          >
            <span>← Kembali ke Hasil Kalkulasi</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/kalkulator"
              className="px-4 py-2.5 rounded-xl border border-sage/40 bg-white hover:bg-mint/30 text-charcoal text-xs sm:text-sm font-bold transition-all"
            >
              Ubah Data Kalkulator
            </Link>

            <Link
              href="/edukasi"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs sm:text-sm font-bold shadow-xs transition-all"
            >
              <span>Pelajari Metodologi Ilmiah</span>
              <ArrowRight className="w-4 h-4 text-mint" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
