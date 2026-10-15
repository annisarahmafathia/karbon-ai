"use client";

import React, { useSyncExternalStore } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CalculationResult } from "@/types/carbon";

interface EmissionsChartsProps {
  result: CalculationResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  transportasi: "#234B38", // Forest green
  energi: "#D97706", // Amber
  pangan: "#E11D48", // Rose
  konsumsi: "#2563EB", // Blue
  sampah: "#0D9488", // Teal
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


  // Data for Category Donut Chart
  const pieData = [
    {
      name: "Transportasi",
      value: result.categories.transportasi.monthlyKgCO2e,
      percentage: result.categories.transportasi.percentage,
      color: CATEGORY_COLORS.transportasi,
    },
    {
      name: "Energi Hunian",
      value: result.categories.energi.monthlyKgCO2e,
      percentage: result.categories.energi.percentage,
      color: CATEGORY_COLORS.energi,
    },
    {
      name: "Pangan",
      value: result.categories.pangan.monthlyKgCO2e,
      percentage: result.categories.pangan.percentage,
      color: CATEGORY_COLORS.pangan,
    },
    {
      name: "Belanja",
      value: result.categories.konsumsi.monthlyKgCO2e,
      percentage: result.categories.konsumsi.percentage,
      color: CATEGORY_COLORS.konsumsi,
    },
    {
      name: "Sampah",
      value: result.categories.sampah.monthlyKgCO2e,
      percentage: result.categories.sampah.percentage,
      color: CATEGORY_COLORS.sampah,
    },
  ].filter((item) => item.value > 0);

  // Data for Benchmark Comparison Bar Chart
  const barData = [
    {
      name: "Kamu (Estimasi)",
      emisiTahunan: Math.round(result.totalYearlyKgCO2e),
      fill: "#234B38",
    },
    {
      name: "Target Paris 2030",
      emisiTahunan: result.benchmark.parisAgreementTargetYearlyKg,
      fill: "#8FAF91",
    },
    {
      name: "Rata-rata Nasional",
      emisiTahunan: result.benchmark.indonesiaAvgYearlyKg,
      fill: "#94A3B8",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Category Pie Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sage/30 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-charcoal">
              Distribusi Emisi per Kategori
            </h3>
            <span className="text-xs text-muted">kg CO₂e / bulan</span>
          </div>
          <p className="text-xs text-muted mt-1">
            Persentase kontribusi aktivitas harian terhadap total jejak karbonmu
          </p>
        </div>

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
                  return [`${val} kg CO₂e (${entry.percentage}%)`, name];
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
              ></span>
              <span className="text-charcoal font-medium">
                {d.name}: <strong>{d.percentage}%</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Benchmark Comparison Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sage/30 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-charcoal">
              Perbandingan Tolok Ukur Tahunan
            </h3>
            <span className="text-xs text-muted">kg CO₂e / tahun</span>
          </div>
          <p className="text-xs text-muted mt-1">
            Perbandingan emisi tahunanmu vs rata-rata per kapita penduduk Indonesia
          </p>
        </div>

        <div className="h-64 my-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kg" />
              <Tooltip
                formatter={(val) => [`${val} kg CO₂e / tahun`, "Emisi Tahunan"]}
              />
              <Bar dataKey="emisiTahunan" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-sage/20 text-xs text-muted flex items-center justify-between">
          <span>Target Paris 2030: ~2.000 kg</span>
          <span>Rata-rata Nasional: ~2.100 kg</span>
        </div>
      </div>
    </div>
  );
}
