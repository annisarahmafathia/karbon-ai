"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { GlassWater, Plus, Minus } from "lucide-react";

export function StepPlasticBottles() {
  const { input, updateBotolMinum, result } = useCalculator();
  const count = input.botolMinum;
  const categoryResult = result.categories.botol_minum;

  const quickOptions = [0, 3, 7, 10, 14, 21];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint mb-2">
          <GlassWater className="w-3.5 h-3.5" />
          <span>Kategori 3 dari 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-charcoal">
          Botol Minum Plastik Sekali Pakai
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Botol air mineral, cup plastik, atau wadah minuman sekali pakai lainnya per minggu.
        </p>
      </div>

      {/* Input Counter & Quick Select */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sage/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="botol-minum-input" className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              Jumlah Botol Minum Plastik Baru
            </label>
            <span className="text-xs text-muted block mt-0.5">Satuan: buah / minggu</span>
            <p className="text-[11px] text-gray-400 mt-1">
              Botol yang diisi ulang berkali-kali tetap dihitung 1 botol baru.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateBotolMinum(Math.max(0, count - 1))}
              disabled={count <= 0}
              aria-label="Kurangi botol minum"
              className="w-10 h-10 rounded-xl border border-sage/40 flex items-center justify-center text-charcoal hover:bg-mint/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                id="botol-minum-input"
                type="number"
                min="0"
                step="1"
                value={count}
                onChange={(e) => updateBotolMinum(parseInt(e.target.value) || 0)}
                className="w-24 text-center font-black text-2xl py-2 px-2 rounded-xl border border-sage/40 focus:ring-2 focus:ring-forest focus:outline-none bg-cream/30 text-forest"
              />
            </div>

            <button
              type="button"
              onClick={() => updateBotolMinum(count + 1)}
              aria-label="Tambah botol minum"
              className="w-10 h-10 rounded-xl bg-forest text-cream flex items-center justify-center hover:bg-forest-dark shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Pick Pills */}
        <div className="pt-2 border-t border-sage/20">
          <span className="text-[11px] font-semibold text-muted block mb-2">
            Pilihan cepat (buah/minggu):
          </span>
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => updateBotolMinum(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${count === opt
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-cream text-charcoal hover:bg-mint/60 border border-sage/30"
                  }`}
              >
                {opt === 0 ? "0 (Bebas Botol Plastik)" : `${opt} buah`}
              </button>
            ))}
          </div>
        </div>

        {/* Subtotal Emisi Kategori */}
        <div className="bg-cream/60 rounded-2xl p-4 border border-sage/20 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-charcoal block">
              Subtotal Emisi Kategori
            </span>
            <span className="text-[11px] text-muted">
              ~{Math.round(categoryResult.yearlyKgCO2e)} kg CO₂e/tahun
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-forest">
              {categoryResult.weeklyKgCO2e}
            </span>
            <span className="text-xs font-bold text-charcoal ml-1.5">kg CO₂e/minggu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
