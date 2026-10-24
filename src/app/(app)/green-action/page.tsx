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
  sortRecommendationsByFootprint,
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
  Info,
  Award,
  Layers,
  Star,
} from "lucide-react";

/**
 * Komponen utilitas aman untuk merender teks dengan format bold (**teks**)
 */
function FormattedText({
  text,
  className,
  isLightText = false,
}: {
  text: string;
  className?: string;
  isLightText?: boolean;
}) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={index}
              className={`font-black ${isLightText ? "text-white underline decoration-mint" : "text-charcoal"}`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}

export default function GreenActionPage() {
  const { input, result } = useCalculator();

  const [apiResponse, setApiResponse] = useState<GreenActionApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  // Filter rekomendasi berdasarkan kategori yang dipilih pengguna
  // Urutan rekomendasi ditentukan secara otomatis berdasarkan hasil perhitungan emisi mingguan pengguna
  const filteredActions: PersonalizedAction[] = useMemo(() => {
    if (!analysisData?.recommendations) return [];

    const actions = analysisData.recommendations.filter((act) => {
      if (selectedCategory !== "all" && act.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    return sortRecommendationsByFootprint(actions, result);
  }, [analysisData, selectedCategory, result]);

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
            AI menganalisis hasil kalkulasi jejak karbon mingguanmu, mengidentifikasi faktor penyumbang
            emisi terbesar, dan menyusun langkah praktis yang relevan serta dapat langsung kamu terapkan
            dalam kehidupan sehari-hari.
          </p>

          {/* AI vs Fallback Status Indicator */}
          {apiResponse && (
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {apiResponse.isAiGenerated ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                  <span>Dianalisis oleh AI KarbonAI (Personal)</span>
                  {apiResponse.modelName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold">
                      {apiResponse.modelName}
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium shadow-xs">
                  <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span>Rekomendasi Berbasis Metodologi Ilmiah (Fallback)</span>
                  <span className="text-[11px] text-amber-900 hidden sm:inline">
                    • Menggunakan faktor emisi riil terverifikasi
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-mint border border-sage text-xs font-bold text-forest transition-all shadow-xs disabled:opacity-50"
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
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-sage-light shadow-sm text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-mint flex items-center justify-center text-forest animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-charcoal">
              AI KarbonAI sedang menganalisis kebiasaan plastikmu...
            </h2>
            <p className="text-xs text-muted max-w-md mx-auto">
              Memeriksa emisi dari {result.totalItemsPerWeek} barang plastik mingguan dan mengidentifikasi
              faktor penyumbang emisi terbesar untuk langkah pengurangan yang paling berdampak.
            </p>
          </div>
        )}

        {!isLoading && analysisData && (
          <>
            {/* Zero Plastic Hero Banner */}
            {isZeroPlastic && (
              <div className="bg-mint rounded-3xl p-6 sm:p-8 border border-sage shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-forest text-cream flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-9 h-9 text-mint" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-2.5 py-0.5 rounded-full bg-white border border-sage">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                    <span>Pahlawan Bebas Plastik Sekali Pakai</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-charcoal">
                    Kamu Sudah Bebas Plastik Sekali Pakai Minggu Ini!
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal leading-relaxed max-w-2xl font-normal">
                    {analysisData.habitAnalysis}
                  </p>
                  <p className="text-xs text-muted pt-1">
                    *Seluruh penggunaan bernilai 0. Belum ada emisi yang dihasilkan sehingga tidak ada faktor yang ditetapkan sebagai penyumbang emisi terbesar.
                  </p>
                </div>
              </div>
            )}

            {/* Non-Zero Habit Analysis & Hotspot Overview (Layout Asli 3-Kolom) */}
            {!isZeroPlastic && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Habit Analysis Card (lg:col-span-2) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-8 border border-sage-light shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-forest" />
                      <span>Analisis Kebiasaan Pengguna oleh AI</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-charcoal leading-snug">
                      Gambaran Pola Konsumsi Plastik Mingguanmu
                    </h2>

                    <div className="text-xs sm:text-sm text-charcoal leading-relaxed bg-cream p-4 rounded-2xl border border-sage-light">
                      <FormattedText text={analysisData.habitAnalysis} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sage-light flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal">
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

                {/* 2. Primary Priority / Faktor Penyumbang Emisi Terbesar Card (lg:col-span-1) */}
                <div className="bg-forest text-cream rounded-3xl p-5 sm:p-7 shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-forest border border-sage text-xs font-black uppercase tracking-wider">
                      <Star className="w-3.5 h-3.5 fill-forest text-forest" />
                      <span>Prioritas Reduksi Utama</span>
                    </div>

                    <div>
                      {/* Informasi Faktor Penyumbang Emisi Terbesar */}
                      <span className="text-xs font-bold text-mint block mb-1">
                        Faktor Penyumbang Emisi Terbesar
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {analysisData.primaryPriority.categoryLabel}
                      </h3>
                      {analysisData.primaryPriority.isTied && (
                        <span className="text-xs text-mint font-medium block mt-1">
                          *Terdapat {analysisData.primaryPriority.allTopContributors?.length || 2} faktor dengan emisi tertinggi yang setara
                        </span>
                      )}
                    </div>

                    <div className="bg-forest-dark rounded-2xl p-3.5 border border-forest-light space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-mint font-semibold">Emisi Mingguan</span>
                        <span className="text-base font-extrabold text-white">
                          ~{analysisData.primaryPriority.weeklyKgCO2e} kg CO₂e
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-cream">
                        <span>Kontribusi Total</span>
                        <span className="font-bold text-mint">
                          {analysisData.primaryPriority.percentage}% dari seluruh emisi
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-mint uppercase tracking-wider block">
                        Tindakan yang Disarankan:
                      </span>
                      <div className="text-xs text-cream leading-relaxed font-normal">
                        <FormattedText text={analysisData.primaryPriority.explanation} isLightText={true} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-forest-light flex items-center justify-between text-xs text-cream">
                    <span className="font-medium">{analysisData.primaryPriority.itemCountPerWeek} barang / minggu</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Controls Bar */}
            <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-sage-light shadow-xs">
              {/* Category Filter */}
              <div className="w-full flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 shrink-0 mr-1">
                  <Filter className="w-4 h-4 text-forest shrink-0" />
                  <span className="text-xs font-bold text-charcoal shrink-0">Kategori:</span>
                </div>

                <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-2.5">
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
                      className={`flex-1 min-w-fit text-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === f.id
                          ? "bg-forest text-cream shadow-xs"
                          : "bg-cream text-charcoal border border-sage-light hover:bg-mint"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-charcoal flex items-center gap-2">
                  <span>
                    {isZeroPlastic
                      ? "Daftar Rekomendasi Umum Ramah Lingkungan"
                      : "Daftar Tindakan Personal untuk Profilmu"}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-mint text-forest font-bold border border-sage">
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
                      className={`rounded-3xl p-5 sm:p-7 bg-white transition-all flex flex-col justify-between border ${
                        !isZeroPlastic && isPrimary
                          ? "border-2 border-forest shadow-sm"
                          : "border border-sage-light shadow-2xs hover:border-sage hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Badges Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {isZeroPlastic ? (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cream text-charcoal border border-sage">
                                Rekomendasi Umum
                              </span>
                            ) : isPrimary ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-forest text-cream shadow-xs border border-forest-dark">
                                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                                <span>Prioritas Utama</span>
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cream text-charcoal border border-sage">
                                Rekomendasi Tambahan
                              </span>
                            )}

                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-mint text-forest border border-sage">
                              {action.categoryLabel}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-charcoal bg-cream px-2 py-0.5 rounded-md border border-sage-light">
                            {action.difficulty}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-base sm:text-lg font-black text-charcoal leading-snug">
                          {action.title}
                        </h4>

                        {/* Alasan Rekomendasi (Why this action fits user's habit) */}
                        <div className="bg-cream rounded-2xl p-3.5 border border-sage-light text-xs text-charcoal space-y-1">
                          <div className="font-bold text-forest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-forest shrink-0" />
                            <span>
                              {isZeroPlastic
                                ? "Panduan Praktis"
                                : "Alasan Rekomendasi Personal"}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal leading-relaxed font-normal">
                            <FormattedText text={action.reason} />
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
                                className="text-xs text-charcoal flex items-start gap-2.5 bg-cream p-2.5 rounded-xl border border-sage-light"
                              >
                                <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                                <span className="leading-relaxed font-medium">
                                  <FormattedText text={step} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Potential Impact Box (Scientifically Verified) */}
                        <div className="bg-mint rounded-2xl p-3.5 border border-sage space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-forest">
                              <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                              <span>Dampak Potensial Pengurangan Emisi</span>
                            </div>
                            <span className="text-xs font-black text-cream bg-forest px-2.5 py-1 rounded-lg">
                              {action.potentialImpact.formattedSaving}
                            </span>
                          </div>

                          <p className="text-xs text-forest-dark font-medium leading-relaxed">
                            {action.potentialImpact.qualitativeBenefit}
                          </p>
                        </div>

                        {/* Local Context / Tips Mahasiswa */}
                        {action.localContext && (
                          <div className="bg-cream rounded-2xl p-3 border border-sage-light text-xs text-charcoal flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-forest font-bold">Tips Praktis: </strong>
                              <span className="font-medium text-charcoal">{action.localContext}</span>
                            </div>
                          </div>
                        )}

                        {/* Financial Benefit */}
                        {action.financialBenefit && (
                          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                            <Coins className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-amber-900 font-bold">
                                Manfaat Finansial:{" "}
                              </strong>
                              <span className="font-medium text-amber-950">{action.financialBenefit}</span>
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
                <div className="bg-white rounded-3xl p-8 border border-sage-light text-center space-y-3">
                  <p className="text-sm font-semibold text-charcoal">
                    Tidak ada rekomendasi untuk kategori yang dipilih.
                  </p>
                  <p className="text-xs text-muted">
                    Coba pilih kategori lain untuk melihat rekomendasi yang tersedia.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
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
        <div className="pt-6 border-t border-sage-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/hasil"
            className="text-xs sm:text-sm font-bold text-forest hover:underline flex items-center gap-1.5"
          >
            <span>← Kembali ke Hasil Kalkulasi</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/kalkulator"
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-sage bg-white hover:bg-mint text-charcoal text-xs sm:text-sm font-bold transition-all"
            >
              Ubah Data Kalkulator
            </Link>

            <Link
              href="/edukasi"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs sm:text-sm font-bold shadow-xs transition-all"
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
