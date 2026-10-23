"use client";

import React from "react";
import {
  ShoppingBag,
  Package,
  GlassWater,
  Box,
  Bike,
  Zap,
  Utensils,
  Trash2,
  Info,
} from "lucide-react";
import { EmissionsCharts } from "@/components/results/EmissionsCharts";
import {
  CalculationResult,
  LegacyCalculationResult,
  CarbonCategoryType,
} from "@/types/carbon";
import { CarbonCalculation } from "@/types/database";
import {
  CATEGORY_LABELS,
  isPlasticCalculationResult,
} from "@/lib/history/snapshot";

const categoryIcons: Record<CarbonCategoryType, React.ElementType> = {
  // 4 Kategori Baru
  kantong_plastik: ShoppingBag,
  wadah_makanan: Package,
  botol_minum: GlassWater,
  wadah_styrofoam: Box,
  // 5 Kategori Historis
  transportasi: Bike,
  energi: Zap,
  pangan: Utensils,
  konsumsi: ShoppingBag,
  sampah: Trash2,
};

interface HistoryResultViewProps {
  calculation: CarbonCalculation;
  snapshot: CalculationResult | LegacyCalculationResult | null;
}

export function HistoryResultView({
  calculation,
  snapshot,
}: HistoryResultViewProps) {
  const isPlastic = isPlasticCalculationResult(snapshot);
  const isLegacy = !isPlastic;

  return (
    <div className="space-y-6">
      {/* Methodology Banner */}
      {isLegacy && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Data Historis (Metodologi Versi Lama)</span>
            <p className="text-amber-800/90 leading-relaxed">
              Catatan ini dihitung menggunakan metodologi lama (5 kategori gaya hidup bulanan).
              Data historis dipertahankan dan tidak dicampur dengan perhitungan mingguan plastik sekali pakai yang baru.
            </p>
          </div>
        </div>
      )}

      {/* Main Score Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {isPlastic ? "Total Emisi Plastik Sekali Pakai" : "Total Emisi Historis"}
          </p>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              isPlastic
                ? "bg-mint text-forest border border-forest/30"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            {isPlastic ? "Metodologi Mingguan (Plastik)" : "Metodologi Bulanan (Legacy)"}
          </span>
        </div>

        <p className="text-4xl font-black text-forest tracking-tight">
          {isPlastic
            ? (snapshot as CalculationResult)?.totalWeeklyKgCO2e ??
              calculation.total_weekly_kg ??
              0
            : (snapshot as LegacyCalculationResult)?.totalMonthlyKgCO2e ??
              calculation.total_monthly_kg}
          <span className="ml-2 text-sm font-bold text-charcoal">
            {isPlastic ? "kg CO₂e / minggu" : "kg CO₂e / bln"}
          </span>
        </p>

        <p className="text-sm text-muted">
          {isPlastic
            ? `Proyeksi: ~${(snapshot as CalculationResult)?.totalMonthlyKgCO2e ?? calculation.total_monthly_kg} kg/bulan · ~${Math.round((snapshot as CalculationResult)?.totalYearlyKgCO2e ?? calculation.total_yearly_kg)} kg/tahun`
            : `Proyeksi: ~${Math.round((snapshot as LegacyCalculationResult)?.totalYearlyKgCO2e ?? calculation.total_yearly_kg)} kg/tahun`}{" "}
          · Hotspot: <strong>{CATEGORY_LABELS[calculation.highest_category] ?? calculation.highest_category}</strong>
        </p>
      </div>

      {/* Visual Chart */}
      {snapshot ? <EmissionsCharts result={snapshot} /> : null}

      {/* Breakdown per category */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-charcoal">
          Rincian per Kategori
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isPlastic && snapshot ? (
            (
              Object.keys(
                (snapshot as CalculationResult).categories
              ) as Array<keyof (CalculationResult)["categories"]>
            ).map((key) => {
              const cat = (snapshot as CalculationResult).categories[key];
              const Icon = categoryIcons[key] || ShoppingBag;

              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl p-5 border border-sage/30 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream text-charcoal border border-sage/30">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-charcoal">{cat.label}</h3>
                    <p className="text-xl font-black text-forest">
                      {cat.weeklyKgCO2e}{" "}
                      <span className="text-xs font-bold text-muted">kg CO₂e/minggu</span>
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {cat.itemCountPerWeek} barang baru / minggu
                    </p>
                  </div>
                </div>
              );
            })
          ) : isLegacy && snapshot ? (
            (
              Object.keys(
                (snapshot as LegacyCalculationResult).categories
              ) as Array<keyof (LegacyCalculationResult)["categories"]>
            ).map((key) => {
              const cat = (snapshot as LegacyCalculationResult).categories[key];
              const Icon = categoryIcons[key] || Bike;

              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl p-5 border border-sage/30 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream text-charcoal border border-sage/30">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-charcoal">{cat.label}</h3>
                    <p className="text-xl font-black text-forest">
                      {cat.monthlyKgCO2e}{" "}
                      <span className="text-xs font-bold text-muted">kg CO₂e/bln</span>
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback jika snapshot tidak terbaca
            <div className="col-span-2 bg-white rounded-2xl p-5 border border-sage/30 text-xs text-muted">
              Rincian snapshot kategori tidak tersedia untuk catatan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
