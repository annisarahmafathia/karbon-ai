"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { ShoppingBag, Info, Plus, Minus } from "lucide-react";
import { PLASTIC_EMISSION_FACTORS } from "@/lib/constants/emission-factors";

export function StepPlasticBags() {
  const { input, updateKantongPlastik, result } = useCalculator();
  const count = input.kantongPlastik;
  const factor = PLASTIC_EMISSION_FACTORS.kantong_plastik.value;
  const categoryResult = result.categories.kantong_plastik;

  const quickOptions = [0, 2, 5, 8, 12, 20];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint mb-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Kategori 1 dari 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-charcoal">
          Kantong Plastik Sekali Pakai
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Jumlah kantong plastik belanja (kresek) sekali pakai baru yang kamu gunakan selama satu minggu dari pasar tradisional, minimarket, warung, atau toko.
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
            <strong>Hitung hanya barang baru:</strong> Masukkan hanya jumlah kantong kresek baru yang kamu terima atau gunakan selama 1 minggu terakhir.
          </li>
          <li>
            <strong>Penggunaan ulang tidak menambah hitungan:</strong> Satu kantong yang sama digunakan lima kali dalam seminggu tetap dihitung sebagai <strong>1 kantong</strong>.
          </li>
          <li>
            <strong>Barang dari minggu lalu tidak dihitung:</strong> Kantong yang sudah digunakan pada minggu sebelumnya tidak dihitung kembali sebagai barang baru hanya karena masih digunakan.
          </li>
        </ul>
      </div>

      {/* Input Counter & Quick Select */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sage/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="kantong-plastik-input" className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              Jumlah Kantong Plastik Baru
            </label>
            <span className="text-xs text-muted">Satuan: buah / minggu</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateKantongPlastik(Math.max(0, count - 1))}
              disabled={count <= 0}
              aria-label="Kurangi kantong plastik"
              className="w-10 h-10 rounded-xl border border-sage/40 flex items-center justify-center text-charcoal hover:bg-mint/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                id="kantong-plastik-input"
                type="number"
                min="0"
                step="1"
                value={count}
                onChange={(e) => updateKantongPlastik(parseInt(e.target.value) || 0)}
                className="w-24 text-center font-black text-2xl py-2 px-2 rounded-xl border border-sage/40 focus:ring-2 focus:ring-forest focus:outline-none bg-cream/30 text-forest"
              />
            </div>

            <button
              type="button"
              onClick={() => updateKantongPlastik(count + 1)}
              aria-label="Tambah kantong plastik"
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
                onClick={() => updateKantongPlastik(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  count === opt
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-cream text-charcoal hover:bg-mint/60 border border-sage/30"
                }`}
              >
                {opt === 0 ? "0 (Bebas Kresek)" : `${opt} buah`}
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
