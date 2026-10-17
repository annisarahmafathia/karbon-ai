"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { WasteSortingHabit, OpenBurningHabit } from "@/types/carbon";
import { Flame, ShoppingBag, Info } from "lucide-react";

export function StepWaste() {
  const { input, updateWaste } = useCalculator();
  const waste = input.waste;

  const sortingOptions: { value: WasteSortingHabit; label: string; desc: string }[] = [
    {
      value: "kadang_pilah",
      label: "Kadang-kadang Memilah",
      desc: "Memisahkan kardus paket atau botol minuman saat sempat",
    },
    {
      value: "selalu_pilah",
      label: "Selalu Memilah Sampah",
      desc: "Menyetor botol/kardus ke Bank Sampah / pengepul & organik dikompos",
    },
    {
      value: "tidak_pernah_campur",
      label: "Tidak Pernah (Sampah Campur)",
      desc: "Semua sisa makanan, plastik, dan tisu disatukan dalam satu kresek",
    },
  ];

  const burningOptions: { value: OpenBurningHabit; label: string; desc: string }[] = [
    {
      value: "tidak_pernah",
      label: "Tidak Pernah",
      desc: "Dibuang ke tong resmi gampong atau diangkut oleh truk sampah",
    },
    {
      value: "kadang_pekarangan_kos",
      label: "Kadang Dibakar di Pekarangan Kos",
      desc: "Membakar daun kering atau tumpukan sampah sesekali di pekarangan",
    },
    {
      value: "sering",
      label: "Sering Dibakar Terbuka",
      desc: "Rutin membakar sampah di pekarangan",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-xl font-bold text-charcoal">
          5. Pengelolaan Sampah
        </h2>
        <p className="text-sm text-muted mt-1">
          Dihitung dari rata-rata sampah mahasiswa Banda Aceh (0.45 kg/hari), dekomposisi metana di TPA, dan faktor emisi pembakaran terbuka IPCC.
        </p>
      </div>

      {/* Sorting Habit */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
          Kebiasaan Memilah Sampah di Tempat Tinggal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sortingOptions.map((opt) => {
            const isSelected = waste.sortingHabit === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => updateWaste({ sortingHabit: opt.value })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-mint border-forest text-forest-dark ring-1 ring-forest shadow-sm"
                    : "bg-white border-sage/30 hover:border-sage hover:bg-cream/40 text-charcoal"
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="text-xs text-muted mt-1 leading-snug">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Open Burning Habit */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-charcoal">
            Praktik Pembakaran Sampah Terbuka (Open Burning)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {burningOptions.map((opt) => {
            const isSelected = waste.openBurningHabit === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => updateWaste({ openBurningHabit: opt.value })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500 shadow-sm"
                    : "bg-white border-sage/30 hover:border-sage hover:bg-cream/40 text-charcoal"
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plastic bags slider */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-charcoal flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-forest" />
            Penggunaan Kantong Kresek Belanja (Pasar / Minimarket)
          </span>
          <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
            {waste.singleUsePlasticBagsPerWeek} kantong / minggu
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          value={waste.singleUsePlasticBagsPerWeek}
          onChange={(e) =>
            updateWaste({ singleUsePlasticBagsPerWeek: parseInt(e.target.value) || 0 })
          }
          className="w-full accent-forest cursor-pointer"
        />
        <span className="text-[11px] text-muted block">
          Gunakan tas kain / tote bag kuliah saat berbelanja ke pasar atau swalayan
        </span>
      </div>

      {/* Notice on Local Qanun */}
      <div className="bg-mint/60 rounded-2xl p-4 border border-sage/30 flex items-start gap-3 text-xs text-charcoal/80">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <strong className="text-forest-dark font-bold">Inisiatif Kampus Hijau:</strong> Universitas Syiah Kuala (USK) memiliki unit pengolahan kompos dan Bank Sampah di kawasan Fakultas Pertanian & Gedung AAC Dayan Dawood. Memilah botol plastik dan kertas bernilai ekonomi sekaligus menjaga kelestarian kampus.
        </div>
      </div>
    </div>
  );
}
