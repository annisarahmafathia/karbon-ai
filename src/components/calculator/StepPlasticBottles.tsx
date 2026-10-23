"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { GlassWater, Info, Plus, Minus } from "lucide-react";
import { PLASTIC_EMISSION_FACTORS } from "@/lib/constants/emission-factors";

export function StepPlasticBottles() {
  const { input, updateBotolMinum, result } = useCalculator();
  const count = input.botolMinum;
  const factor = PLASTIC_EMISSION_FACTORS.botol_minum.value;
  const categoryResult = result.categories.botol_minum;

  const quickOptions = [0, 3, 7, 10, 14, 21];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint mb-2">
          <GlassWater className="w-3.5 h-3.5" />
          <span>Kategori 3 dari 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-charcoal">
          Botol Minum Plastik Sekali Pakai
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Jumlah botol minuman plastik sekali pakai baru yang kamu gunakan selama satu minggu (seperti botol air mineral PET ukuran 500–600 ml, minuman isotonik, kopi kemasan botol, atau teh botol plastik).
        </p>
      </div>

      {/* Petunjuk Penggunaan Ulang */}
      <div className="bg-mint/40 rounded-2xl p-4 sm:p-5 border border-sage/30 text-xs text-charcoal/90 space-y-2">
        <div className="flex items-center gap-2 font-bold text-forest">
          <Info className="w-4 h-4 text-forest shrink-0" />
          <span>Aturan Penghitungan Barang Baru & Penggunaan Ulang</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-charcoal/80 text-[11px] sm:text-xs leading-relaxed">
          <li>
            <strong>Satu botol diisi ulang tetap 1 botol:</strong> Satu botol yang sama digunakan lima kali dalam seminggu tetap dihitung sebagai <strong>satu botol</strong>.
          </li>
          <li>
            <strong>Lima botol baru dihitung 5 botol:</strong> Lima botol baru yang berbeda yang kamu beli/gunakan selama satu minggu dihitung sebagai <strong>lima botol</strong>.
          </li>
          <li>
            <strong>Botol dari minggu sebelumnya tidak dihitung:</strong> Botol yang sudah digunakan pada minggu sebelumnya tidak dihitung kembali sebagai botol baru hanya karena masih digunakan.
          </li>
          <li>
            <strong>Penggunaan ulang tidak menambah hitungan:</strong> Penggunaan ulang barang yang sama tidak boleh meningkatkan jumlah barang baru.
          </li>
        </ul>
      </div>

      {/* Input Counter & Quick Select */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sage/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="botol-minum-input" className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              Jumlah Botol Minum Plastik Baru
            </label>
            <span className="text-xs text-muted">Satuan: buah / minggu</span>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  count === opt
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
        <div className="bg-cream/60 rounded-2xl p-4 border border-sage/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase font-bold text-muted tracking-wider block">
              Subtotal Emisi Kategori:
            </span>
            <div className="text-xs text-charcoal/80">
              {count} buah × {factor} kg CO₂e/buah
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-forest">
              {categoryResult.weeklyKgCO2e}
            </span>
            <span className="text-xs font-bold text-charcoal ml-1.5">kg CO₂e/minggu</span>
            <span className="text-[11px] text-muted block">
              (~{Math.round(categoryResult.yearlyKgCO2e)} kg CO₂e/tahun)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
