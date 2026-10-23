"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { Box, Plus, Minus } from "lucide-react";

export function StepStyrofoam() {
  const { input, updateWadahStyrofoam, result } = useCalculator();
  const count = input.wadahStyrofoam;
  const categoryResult = result.categories.wadah_styrofoam;

  const quickOptions = [0, 1, 3, 5, 7, 10];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint mb-2">
          <Box className="w-3.5 h-3.5" />
          <span>Kategori 4 dari 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-charcoal">
          Wadah Styrofoam Sekali Pakai
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Boks makanan styrofoam putih, wadah burger foam, atau mangkuk foam takeaway per minggu.
        </p>
      </div>

      {/* Input Counter & Quick Select */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sage/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="wadah-styrofoam-input" className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              Jumlah Wadah Styrofoam Baru
            </label>
            <span className="text-xs text-muted block mt-0.5">Satuan: buah / minggu</span>
            <p className="text-[11px] text-gray-400 mt-1">
              Wadah styrofoam lama yang masih dipakai tidak dihitung kembali.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateWadahStyrofoam(Math.max(0, count - 1))}
              disabled={count <= 0}
              aria-label="Kurangi wadah styrofoam"
              className="w-10 h-10 rounded-xl border border-sage/40 flex items-center justify-center text-charcoal hover:bg-mint/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                id="wadah-styrofoam-input"
                type="number"
                min="0"
                step="1"
                value={count}
                onChange={(e) => updateWadahStyrofoam(parseInt(e.target.value) || 0)}
                className="w-24 text-center font-black text-2xl py-2 px-2 rounded-xl border border-sage/40 focus:ring-2 focus:ring-forest focus:outline-none bg-cream/30 text-forest"
              />
            </div>

            <button
              type="button"
              onClick={() => updateWadahStyrofoam(count + 1)}
              aria-label="Tambah wadah styrofoam"
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
                onClick={() => updateWadahStyrofoam(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  count === opt
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-cream text-charcoal hover:bg-mint/60 border border-sage/30"
                }`}
              >
                {opt === 0 ? "0 (Bebas Styrofoam)" : `${opt} buah`}
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
