"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCalculator } from "@/context/CalculatorContext";
import { StepPlasticBags } from "@/components/calculator/StepPlasticBags";
import { StepFoodContainers } from "@/components/calculator/StepFoodContainers";
import { StepPlasticBottles } from "@/components/calculator/StepPlasticBottles";
import { StepStyrofoam } from "@/components/calculator/StepStyrofoam";
import {
  ShoppingBag,
  Package,
  GlassWater,
  Box,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

export default function CalculatorPage() {
  const router = useRouter();
  const { result, resetToDefault } = useCalculator();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    { id: 1, label: "Kantong Plastik", icon: ShoppingBag },
    { id: 2, label: "Wadah Makanan", icon: Package },
    { id: 3, label: "Botol Minum", icon: GlassWater },
    { id: 4, label: "Wadah Styrofoam", icon: Box },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } else {
      router.push("/hasil");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kalkulator 4 Kategori Plastik Sekali Pakai</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
            Hitung Jejak Karbon Plastikmu
          </h1>
          <p className="text-muted text-xs sm:text-base leading-relaxed">
            Perhitungan didasarkan pada jumlah <strong>barang plastik baru</strong> yang kamu gunakan selama <strong>satu minggu</strong> (satuan: buah/minggu). Penggunaan ulang barang yang sama tidak menambah hitungan barang baru.
          </p>
        </div>

        {/* Global Reuse Guideline Alert */}
        <div className="mb-8 bg-white/90 rounded-2xl p-4 sm:p-5 border border-sage/40 shadow-sm flex items-start gap-3 text-xs">
          <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
          <div className="space-y-1 text-charcoal/80">
            <p className="font-bold text-forest-dark">
              Aturan Penghitungan: Jumlah Barang Baru vs Penggunaan Ulang
            </p>
            <p className="leading-relaxed">
              Kalkulator ini menghitung jumlah barang plastik baru, bukan berapa kali barang dipakai.
              Contoh: satu botol yang diisi ulang 5 kali dalam seminggu tetap dihitung <strong>1 botol</strong>.
              Barang dari minggu lalu yang kamu gunakan kembali tidak dihitung lagi.
            </p>
          </div>
        </div>

        {/* Step Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 sm:p-3 border border-sage/30 shadow-sm mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {steps.map((st) => {
              const Icon = st.icon;
              const isActive = currentStep === st.id;
              const isPast = currentStep > st.id;
              return (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setCurrentStep(st.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex-1 justify-center ${
                    isActive
                      ? "bg-forest text-cream shadow-sm"
                      : isPast
                      ? "text-forest-dark bg-mint/50 hover:bg-mint"
                      : "text-muted hover:text-charcoal hover:bg-cream"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{st.label}</span>
                  {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-cream-card rounded-3xl p-6 sm:p-10 border border-sage/30 shadow-sm">
          {currentStep === 1 && <StepPlasticBags />}
          {currentStep === 2 && <StepFoodContainers />}
          {currentStep === 3 && <StepPlasticBottles />}
          {currentStep === 4 && <StepStyrofoam />}

          {/* Stepper Navigation Buttons */}
          <div className="mt-10 pt-6 border-t border-sage/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-sage/40 bg-white hover:bg-mint/40 text-charcoal font-bold text-sm transition-all w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 text-forest" />
                  <span>Kembali</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetToDefault}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-muted hover:text-red-700 transition-colors"
                title="Kembalikan semua nilai ke 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke 0</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-forest hover:bg-forest-dark text-cream font-bold text-sm shadow-md transition-all active:scale-95"
              >
                {currentStep === 4 ? (
                  <>
                    <span>Lihat Hasil Analisis Lengkap</span>
                    <BarChart3 className="w-4 h-4 text-sage" />
                  </>
                ) : (
                  <>
                    <span>Lanjut: {steps[currentStep].label}</span>
                    <ArrowRight className="w-4 h-4 text-sage" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Live Bar */}
      <aside aria-label="Ringkasan Emisi Real-time" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sage/30 py-3 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center font-bold text-xs shrink-0">
              CO₂e
            </div>
            <div>
              <div className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Total Emisi Mingguan:
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-forest">
                  {result.totalWeeklyKgCO2e}
                </span>
                <span className="text-xs font-bold text-muted">kg CO₂e / minggu</span>
                <span className="hidden sm:inline text-xs text-muted">
                  ({result.totalItemsPerWeek} barang baru/minggu · ~{Math.round(result.totalYearlyKgCO2e)} kg/tahun)
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/hasil"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs sm:text-sm font-bold shadow transition-all shrink-0 active:scale-95"
          >
            <span>Lihat Hasil</span>
            <ArrowRight className="w-4 h-4 text-sage" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
