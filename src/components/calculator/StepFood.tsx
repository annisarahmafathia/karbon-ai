"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { DietType } from "@/types/carbon";
import { Coffee, Package, Info } from "lucide-react";

export function StepFood() {
  const { input, updateFood } = useCalculator();
  const food = input.food;

  const dietOptions: { value: DietType; label: string; desc: string }[] = [
    {
      value: "mayoritas_ayam_ikan",
      label: "Ayam & Ikan Laut",
      desc: "Sering mengonsumsi ayam dan ikan laut, seperti ayam geprek, ikan tongkol, atau dencis",
    },
    {
      value: "campuran_daging",
      label: "Daging Merah (Sapi / Kambing)",
      desc: "Rutin mengonsumsi daging sapi atau kambing, seperti Sie Reuboh, Kuah Beulangong, atau gulai kambing",
    },
    {
      value: "pescetarian",
      label: "Nabati + Ikan",
      desc: "Mengonsumsi ikan laut dan protein nabati, tanpa ayam, sapi, atau kambing",
    },
    {
      value: "vegetarian_vegan",
      label: "Vegetarian",
      desc: "Mengutamakan protein nabati seperti tahu dan tempe, serta sayuran; konsumsi telur dan susu diperbolehkan",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-xl font-bold text-charcoal">
          3. Konsumsi Pangan & Kebiasaan Ngopi
        </h2>
        <p className="text-sm text-muted mt-1">
          Dihitung berdasarkan intensitas karbon siklus hidup pangan (LCA) dan jejak kemasan plastik sekali pakai.
        </p>
      </div>

      {/* Diet Profile */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
          Pola Konsumsi Protein Dominan
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dietOptions.map((opt) => {
            const isSelected = food.dietType === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => updateFood({ dietType: opt.value })}
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

      {/* Weekly Portion Sliders */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-6">
        <h3 className="text-sm font-bold text-charcoal border-b border-sage/20 pb-3">
          Frekuensi Porsi Makan per Minggu
        </h3>

        {/* Beef/Mutton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">
              Daging Sapi / Kambing
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {food.beefMuttonMealsPerWeek} porsi / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="14"
            value={food.beefMuttonMealsPerWeek}
            onChange={(e) =>
              updateFood({ beefMuttonMealsPerWeek: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            Daging sapi/kambing memiliki jejak emisi tertinggi (~3.2 kg CO₂e/porsi) karena fermentasi enterik metana ternak.
          </span>
        </div>

        {/* Chicken */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">
              Daging Ayam / Unggas
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {food.chickenMealsPerWeek} porsi / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="14"
            value={food.chickenMealsPerWeek}
            onChange={(e) =>
              updateFood({ chickenMealsPerWeek: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
        </div>

        {/* Fish */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">
              Ikan Laut
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {food.fishMealsPerWeek} porsi / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="14"
            value={food.fishMealsPerWeek}
            onChange={(e) =>
              updateFood({ fishMealsPerWeek: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            Ikan laut tangkapan nelayan memiliki jejak emisi 4x lebih rendah dibandingkan daging sapi.
          </span>
        </div>
      </div>

      {/* Coffee culture and Packaging */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-6">
        <h3 className="text-sm font-bold text-charcoal border-b border-sage/20 pb-3 flex items-center gap-2">
          <Coffee className="w-4 h-4 text-forest" />
          <span>Budaya Ngopi Aceh & Kemasan Sekali Pakai</span>
        </h3>

        {/* Coffee cups slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">
              Cup Plastik Sekali Pakai
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {food.singleUseCoffeeCupsPerWeek} cup / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="21"
            value={food.singleUseCoffeeCupsPerWeek}
            onChange={(e) =>
              updateFood({ singleUseCoffeeCupsPerWeek: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            Cup plastik PET, sedotan plastik, dan penutup untuk es teh poci atau es kopi take-away.
          </span>
        </div>

        {/* Reusable tumbler toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-sage/20 bg-cream/40">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-charcoal block">
              Bawa Tumbler Sendiri
            </span>
            <span className="text-[11px] text-muted block">
              Menghindari penumpukan limbah plastik sekali pakai
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={food.usesReusableTumbler}
              onChange={(e) =>
                updateFood({ usesReusableTumbler: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
          </label>
        </div>

        {/* Takeaway Food Packaging */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal flex items-center gap-1.5">
              <Package className="w-4 h-4 text-forest" />
              Beli Makanan Bungkus / Pesan Antar
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {food.takeawayFoodPackagingPerWeek} kali / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="21"
            value={food.takeawayFoodPackagingPerWeek}
            onChange={(e) =>
              updateFood({ takeawayFoodPackagingPerWeek: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            Mencakup kertas minyak berlapis plastik, kotak styrofoam, kantong kresek, dan sendok plastik sekali pakai.
          </span>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-mint/60 rounded-2xl p-4 border border-sage/30 flex items-start gap-3 text-xs text-charcoal/80">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <strong className="text-forest-dark font-bold">Kearifan Warkop Aceh:</strong> Warung kopi tradisional di Aceh yang menyajikan kopi saring di cangkir keramik porselen yang dicuci berulang adalah praktik ramah lingkungan yang patut kita banggakan!
        </div>
      </div>
    </div>
  );
}
