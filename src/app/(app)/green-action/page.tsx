
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCalculator } from "@/context/CalculatorContext";
import {
  getPersonalizedGreenActions,
  EvaluatedGreenAction,
} from "@/lib/recommendations";
import {
  Sparkles,
  Filter,
  ArrowRight,
  TrendingDown,
  Coins,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function GreenActionPage() {
  const { input, result } = useCalculator();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedImpact, setSelectedImpact] = useState<string>("all");

  // Menghasilkan rekomendasi berdasarkan data aktivitas dan hasil kalkulasi pengguna.
  const allActions: EvaluatedGreenAction[] = useMemo(() => {
    return getPersonalizedGreenActions(input, result);
  }, [input, result]);

  // Filter rekomendasi berdasarkan kategori dan tingkat dampak.
  const filteredActions = useMemo(() => {
    return allActions.filter((act) => {
      if (
        selectedCategory !== "all" &&
        act.category !== selectedCategory
      ) {
        return false;
      }

      if (
        selectedImpact !== "all" &&
        act.impactLevel !== selectedImpact
      ) {
        return false;
      }

      return true;
    });
  }, [allActions, selectedCategory, selectedImpact]);

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto min-w-0 pb-2 sm:pb-1 scrollbar-thin scrollbar-thumb-sage scrollbar-track-cream">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rekomendasi Aksi Iklim</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
            Green Action: Langkah Nyata Pengurangan Emisi
          </h1>

          <p className="text-xs sm:text-sm text-muted">
            Rekomendasi aksi pengurangan emisi yang dipersonalisasi berdasarkan
            sektor emisi terbesarmu (
            <strong className="text-forest font-bold">
              {result.highestCategory.label}
            </strong>
            ) dan dihitung dari data input aktivitasmu.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-forest shrink-0" />

            <span className="text-xs font-bold text-charcoal shrink-0 mr-1">
              Kategori:
            </span>

            {[
              { id: "all", label: "Semua Sektor" },
              { id: "transportasi", label: "Transportasi" },
              { id: "energi", label: "Energi" },
              { id: "pangan", label: "Pangan" },
              { id: "konsumsi", label: "Belanja" },
              { id: "sampah", label: "Sampah" },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setSelectedCategory(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === f.id
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-cream text-charcoal hover:bg-mint/60"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-[10px] text-muted whitespace-nowrap sm:hidden">
            Geser →
          </span>
          </div>

          {/* Impact Level Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-charcoal shrink-0">
              Dampak:
            </span>

            {[
              { id: "all", label: "Semua" },
              { id: "Tinggi", label: "Tinggi" },
              { id: "Sedang", label: "Sedang" },
              { id: "Rendah", label: "Ringan" },
            ].map((imp) => (
              <button
                type="button"
                key={imp.id}
                onClick={() => setSelectedImpact(imp.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedImpact === imp.id
                    ? "bg-charcoal text-white"
                    : "bg-cream text-muted hover:text-charcoal"
                }`}
              >
                {imp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className="rounded-3xl p-6 sm:p-7 border border-sage/30 bg-white shadow-sm hover:border-sage hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category and Impact Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cream text-forest border border-sage/30">
                    {action.categoryLabel}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        action.impactLevel === "Tinggi"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : action.impactLevel === "Sedang"
                          ? "bg-amber-50 text-amber-800 border border-amber-300"
                          : "bg-blue-50 text-blue-800 border border-blue-300"
                      }`}
                    >
                      Dampak {action.impactLevel}
                    </span>

                    <span className="text-[11px] text-muted">
                      • {action.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-charcoal leading-snug">
                    {action.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Calculation Explanation */}
                <div className="bg-mint/40 rounded-2xl p-3 border border-sage/30 text-xs text-charcoal/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-forest">
                    <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                    <span>Dasar Perhitungan Penghematan</span>
                  </div>

                  <p className="text-[11px] text-forest-dark leading-relaxed">
                    {action.calculationExplanation}
                  </p>
                </div>

                {/* Local Aceh Context */}
                <div className="bg-cream/60 rounded-2xl p-3.5 border border-sage/20 text-xs text-charcoal/80 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-forest shrink-0 mt-0.5" />

                  <div>
                    <strong className="text-forest font-semibold">
                      Konteks Aceh:{" "}
                    </strong>

                    <span>{action.localContextAceh}</span>
                  </div>
                </div>

                {/* Savings Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-mint/50 rounded-xl p-3 border border-sage/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest block">
                      <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                      Potensi Hemat
                    </span>

                    <span className="text-sm font-black text-forest-dark">
                      {action.potentialMonthlySavingKgCO2e > 0
                        ? `~${action.potentialMonthlySavingKgCO2e} kg CO₂e / bln`
                        : "Optimal / Bebas Emisi"}
                    </span>
                  </div>

                  <div className="bg-cream rounded-xl p-3 border border-sage/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                      <Coins className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                      Manfaat Finansial
                    </span>

                    <span className="text-[11px] font-bold text-charcoal leading-tight block mt-0.5">
                      {action.financialBenefit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredActions.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-sage/30 text-center">
            <p className="text-sm font-semibold text-charcoal">
              Belum ada rekomendasi untuk filter ini.
            </p>

            <p className="text-xs text-muted mt-2">
              Coba pilih kategori atau tingkat dampak yang berbeda.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedImpact("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-forest text-cream text-xs font-bold hover:bg-forest-dark transition-all"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/hasil"
            className="text-xs sm:text-sm font-bold text-forest hover:underline flex items-center gap-1"
          >
            <span>← Kembali ke Hasil Analisis</span>
          </Link>

          <Link
            href="/edukasi"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs sm:text-sm font-bold shadow transition-all"
          >
            <span>Pelajari Metodologi & Sumber Data Ilmiah</span>
            <ArrowRight className="w-4 h-4 text-sage" />
          </Link>
        </div>
      </div>
    </div>
  );
}
