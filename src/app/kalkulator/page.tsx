"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCalculator } from "@/context/CalculatorContext";
import { CalculatorArchetypes } from "@/components/calculator/CalculatorArchetypes";
import { StepTransport } from "@/components/calculator/StepTransport";
import { StepEnergy } from "@/components/calculator/StepEnergy";
import { StepFood } from "@/components/calculator/StepFood";
import { StepConsumption } from "@/components/calculator/StepConsumption";
import { StepWaste } from "@/components/calculator/StepWaste";
import {
  Bike,
  Zap,
  Utensils,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function CalculatorPage() {
  const router = useRouter();
  const { result, resetToDefault } = useCalculator();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    { id: 1, label: "Transportasi", icon: Bike },
    { id: 2, label: "Energi", icon: Zap },
    { id: 3, label: "Pangan", icon: Utensils },
    { id: 4, label: "Belanja", icon: ShoppingBag },
    { id: 5, label: "Sampah", icon: Trash2 },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
            <span>Kalkulator 5 Kategori</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
            Formulir Jejak Karbon Mahasiswa Aceh
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Isi estimasi kebiasaan harianmu. Data tersimpan aman di browsermu dan dihitung secara langsung secara real-time.
          </p>
        </div>

        {/* Quick Presets */}
        <CalculatorArchetypes />

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
          {currentStep === 1 && <StepTransport />}
          {currentStep === 2 && <StepEnergy />}
          {currentStep === 3 && <StepFood />}
          {currentStep === 4 && <StepConsumption />}
          {currentStep === 5 && <StepWaste />}

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
                title="Kembalikan semua nilai ke awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Nilai</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-forest hover:bg-forest-dark text-cream font-bold text-sm shadow-md transition-all active:scale-95"
              >
                {currentStep === 5 ? (
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
            <div className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center font-bold text-sm shrink-0">
              CO₂
            </div>
            <div>
              <div className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Estimasi Emisi Berjalan:
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-forest">
                  {result.totalMonthlyKgCO2e}
                </span>
                <span className="text-xs font-bold text-muted">kg CO₂e / bln</span>
                <span className="hidden sm:inline text-xs text-muted">
                  (~{Math.round(result.totalYearlyKgCO2e)} kg / thn)
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/hasil"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs sm:text-sm font-bold shadow transition-all shrink-0 active:scale-95"
          >
            <span>Lihat Hasil Lengkap</span>
            <ArrowRight className="w-4 h-4 text-sage" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
