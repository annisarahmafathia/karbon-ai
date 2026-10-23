"use client";

import React, { useSyncExternalStore } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CalculationResult, LegacyCalculationResult } from "@/types/carbon";
import { isPlasticCalculationResult } from "@/lib/history/snapshot";
import { CheckCircle2 } from "lucide-react";

interface EmissionsChartsProps {
  result: CalculationResult | LegacyCalculationResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  // 4 Kategori Baru (Plastik Sekali Pakai)
  kantong_plastik: "#234B38", // Forest green
  wadah_makanan: "#2563EB", // Blue
  botol_minum: "#0284C7", // Cyan / Sky
  wadah_styrofoam: "#D97706", // Amber
  // Legacy Categories
  transportasi: "#234B38",
  energi: "#D97706",
  pangan: "#E11D48",
  konsumsi: "#2563EB",
  sampah: "#0D9488",
};

const emptySubscribe = () => () => {};

export function EmissionsCharts({ result }: EmissionsChartsProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-xs">
        Memuat visualisasi data...
      </div>
    );
  }

  const isPlastic = isPlasticCalculationResult(result);

  let pieData: {
    name: string;
    value: number;
    percentage: number;
    color: string;
    unit: string;
  }[] = [];

  let isZeroEmission = false;

  if (isPlastic) {
    const plasticResult = result as CalculationResult;
    isZeroEmission = plasticResult.totalWeeklyKgCO2e === 0;

    pieData = [
      {
        name: "Kantong Plastik",
        value: plasticResult.categories.kantong_plastik.weeklyKgCO2e,
        percentage: plasticResult.categories.kantong_plastik.percentage,
        color: CATEGORY_COLORS.kantong_plastik,
        unit: "kg CO₂e/minggu",
      },
      {
        name: "Wadah Makanan Plastik",
        value: plasticResult.categories.wadah_makanan.weeklyKgCO2e,
        percentage: plasticResult.categories.wadah_makanan.percentage,
        color: CATEGORY_COLORS.wadah_makanan,
        unit: "kg CO₂e/minggu",
      },
      {
        name: "Botol Minum Plastik",
        value: plasticResult.categories.botol_minum.weeklyKgCO2e,
        percentage: plasticResult.categories.botol_minum.percentage,
        color: CATEGORY_COLORS.botol_minum,
        unit: "kg CO₂e/minggu",
      },
      {
        name: "Wadah Styrofoam",
        value: plasticResult.categories.wadah_styrofoam.weeklyKgCO2e,
        percentage: plasticResult.categories.wadah_styrofoam.percentage,
        color: CATEGORY_COLORS.wadah_styrofoam,
        unit: "kg CO₂e/minggu",
      },
    ].filter((item) => item.value > 0);
  } else {
    const legacyResult = result as LegacyCalculationResult;
    pieData = [
      {
        name: "Transportasi",
        value: legacyResult.categories.transportasi.monthlyKgCO2e,
        percentage: legacyResult.categories.transportasi.percentage,
        color: CATEGORY_COLORS.transportasi,
        unit: "kg CO₂e/bulan",
      },
      {
        name: "Energi Hunian",
        value: legacyResult.categories.energi.monthlyKgCO2e,
        percentage: legacyResult.categories.energi.percentage,
        color: CATEGORY_COLORS.energi,
        unit: "kg CO₂e/bulan",
      },
      {
        name: "Pangan",
        value: legacyResult.categories.pangan.monthlyKgCO2e,
        percentage: legacyResult.categories.pangan.percentage,
        color: CATEGORY_COLORS.pangan,
        unit: "kg CO₂e/bulan",
      },
      {
        name: "Belanja",
        value: legacyResult.categories.konsumsi.monthlyKgCO2e,
        percentage: legacyResult.categories.konsumsi.percentage,
        color: CATEGORY_COLORS.konsumsi,
        unit: "kg CO₂e/bulan",
      },
      {
        name: "Sampah",
        value: legacyResult.categories.sampah.monthlyKgCO2e,
        percentage: legacyResult.categories.sampah.percentage,
        color: CATEGORY_COLORS.sampah,
        unit: "kg CO₂e/bulan",
      },
    ].filter((item) => item.value > 0);
  }

  const primaryUnit = isPlastic ? "kg CO₂e / minggu" : "kg CO₂e / bulan";

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sage/30 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-charcoal">
              Distribusi Emisi per Kategori
            </h3>
            <span className="text-xs font-semibold text-muted">{primaryUnit}</span>
          </div>

          <p className="text-xs text-muted mt-1">
            {isPlastic
              ? "Proporsi kontribusi empat kategori plastik sekali pakai terhadap total emisi mingguan"
              : "Proporsi emisi bulanan berdasarkan metodologi historis"}
          </p>
        </div>

        {isZeroEmission || pieData.length === 0 ? (
          <div className="h-64 my-4 flex flex-col items-center justify-center text-center p-6 bg-mint/20 rounded-2xl border border-sage/30 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-mint text-forest flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-forest">
              Luar Biasa! Emisi Plastik Sekali Pakaimu 0 {primaryUnit}
            </p>
            <p className="text-xs text-muted max-w-sm">
              Kamu tidak menggunakan barang plastik sekali pakai baru minggu ini. Pertahankan gaya hidup bebas plastik dan gunakan terus perlengkapan guna ulang!
            </p>
          </div>
        ) : (
          <>
            <div className="h-64 my-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(val, name, props) => {
                      const entry = props.payload as (typeof pieData)[0];
                      return [`${val} ${entry.unit} (${entry.percentage}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 border-t border-sage/20 text-xs">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-charcoal font-medium">
                    {d.name}: <strong>{d.percentage}%</strong> ({d.value} {d.unit})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}