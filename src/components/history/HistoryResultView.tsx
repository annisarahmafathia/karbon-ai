"use client";

import React from "react";
import { Bike, ShoppingBag, Trash2, Utensils, Zap } from "lucide-react";
import { EmissionsCharts } from "@/components/results/EmissionsCharts";
import { CalculationResult } from "@/types/carbon";
import { CarbonCalculation } from "@/types/database";
import { CATEGORY_LABELS } from "@/lib/history/snapshot";

const categoryIcons = {
  transportasi: Bike,
  energi: Zap,
  pangan: Utensils,
  konsumsi: ShoppingBag,
  sampah: Trash2,
};

interface HistoryResultViewProps {
  calculation: CarbonCalculation;
  snapshot: CalculationResult | null;
}

export function HistoryResultView({
  calculation,
  snapshot,
}: HistoryResultViewProps) {
  const fallbackCategories = [
    {
      key: "transportasi" as const,
      monthlyKgCO2e: calculation.transport_monthly_kg,
    },
    { key: "energi" as const, monthlyKgCO2e: calculation.energy_monthly_kg },
    { key: "pangan" as const, monthlyKgCO2e: calculation.food_monthly_kg },
    {
      key: "konsumsi" as const,
      monthlyKgCO2e: calculation.consumption_monthly_kg,
    },
    { key: "sampah" as const, monthlyKgCO2e: calculation.waste_monthly_kg },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Total
        </p>
        <p className="text-4xl font-black text-forest tracking-tight">
          {snapshot?.totalMonthlyKgCO2e ?? calculation.total_monthly_kg}
          <span className="ml-2 text-sm font-bold text-charcoal">
            kg CO₂e / bln
          </span>
        </p>
        <p className="text-sm text-muted">
          {Math.round(snapshot?.totalYearlyKgCO2e ?? calculation.total_yearly_kg)}{" "}
          kg / tahun · {CATEGORY_LABELS[calculation.highest_category]}
        </p>
      </div>

      {snapshot ? <EmissionsCharts result={snapshot} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(snapshot
          ? (Object.keys(snapshot.categories) as Array<
              keyof typeof snapshot.categories
            >).map((key) => ({
              key,
              label: snapshot.categories[key].label,
              monthlyKgCO2e: snapshot.categories[key].monthlyKgCO2e,
              percentage: snapshot.categories[key].percentage,
            }))
          : fallbackCategories.map((item) => ({
              key: item.key,
              label: CATEGORY_LABELS[item.key],
              monthlyKgCO2e: item.monthlyKgCO2e,
              percentage: null as number | null,
            }))
        ).map((cat) => {
          const Icon = categoryIcons[cat.key];
          return (
            <div
              key={cat.key}
              className="bg-white rounded-2xl p-5 border border-sage/30 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-charcoal">{cat.label}</h2>
                <p className="text-xl font-black text-forest">
                  {cat.monthlyKgCO2e}{" "}
                  <span className="text-xs font-bold text-muted">kg</span>
                </p>
                {cat.percentage != null ? (
                  <p className="text-xs text-muted">{cat.percentage}%</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
