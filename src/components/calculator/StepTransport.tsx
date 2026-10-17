"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { VehicleType } from "@/types/carbon";
import { Bike, Car, Bus, Footprints, Info } from "lucide-react";

export function StepTransport() {
  const { input, updateTransport } = useCalculator();
  const transport = input.transport;

  const vehicleOptions: {
    value: VehicleType;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      value: "motor_matic_bebek",
      label: "Motor Matic / Manual",
      sublabel: "Beat, Vario, Scoopy, Supra dll",
      icon: Bike,
    },
    {
      value: "trans_koetaradja",
      label: "Bus Trans Koetaradja",
      sublabel: "Bus BRT gratis koridor kampus Darussalam",
      icon: Bus,
    },
    {
      value: "jalan_sepeda",
      label: "Jalan Kaki / Sepeda",
      sublabel: "Nol emisi gas buang operasional",
      icon: Footprints,
    },
    {
      value: "labi_labi",
      label: "Labi-Labi (Angkot Aceh)",
      sublabel: "Mikrolet khas Aceh 10-12 penumpang",
      icon: Bus,
    },
    {
      value: "motor_sport",
      label: "Motor Sport (>150cc)",
      sublabel: "CBR, R15, KLX, NMAX/PCX kapasitas besar",
      icon: Bike,
    },
    {
      value: "mobil_bensin",
      label: "Mobil Pribadi",
      sublabel: "Agya, Brio, Avanza, dsb.",
      icon: Car,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-xl font-bold text-charcoal">
          1. Transportasi & Mobilitas Harian
        </h2>
        <p className="text-sm text-muted mt-1">
          Pilih transportasi utama yang biasa kamu gunakan untuk pergi ke kampus dan mobilitas di Aceh.
        </p>
      </div>

      {/* Vehicle Grid Selection */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
          Transportasi Utama ke Kampus
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehicleOptions.map((opt) => {
            const isSelected = transport.primaryVehicle === opt.value;
            const Icon = opt.icon;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => updateTransport({ primaryVehicle: opt.value })}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? "bg-mint border-forest text-forest-dark shadow-sm ring-1 ring-forest"
                    : "bg-white border-sage/30 hover:border-sage hover:bg-cream/40 text-charcoal"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-forest text-cream"
                      : "bg-cream text-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className="text-xs text-muted mt-0.5 leading-snug">
                    {opt.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance and Frequency inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-sage/30">
        {/* Campus Distance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-charcoal">
              Jarak Satu Arah ke Kampus (km)
            </label>
            <span className="text-sm font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {transport.campusDistanceKm} km
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={transport.campusDistanceKm}
            onChange={(e) =>
              updateTransport({ campusDistanceKm: parseFloat(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted">
            <span>0 km (Asrama/Depan Kampus)</span>
            <span>15 km (Pusat Kota)</span>
            <span>30 km (Aceh Besar)</span>
          </div>
          <p className="text-xs text-muted italic">
            Contoh: Kos di Darussalam/Rukoh ~1.5 - 3 km; Ulee Kareng ~5 km; Peunayong ~9 km.
          </p>
        </div>

        {/* Days per week */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-charcoal">
              Frekuensi ke Kampus per Minggu
            </label>
            <span className="text-sm font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {transport.daysPerWeekToCampus} hari / minggu
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="7"
            step="1"
            value={transport.daysPerWeekToCampus}
            onChange={(e) =>
              updateTransport({ daysPerWeekToCampus: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted">
            <span>0 hari (Online)</span>
            <span>3 - 4 hari (Kuliah sebagian)</span>
            <span>5 - 7 hari (Aktif/Organisasi)</span>
          </div>
        </div>

        {/* Other Daily Km */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-charcoal">
              Mobilitas Harian Lain (km / hari)
            </label>
            <span className="text-sm font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {transport.otherDailyKm} km / hari
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={transport.otherDailyKm}
            onChange={(e) =>
              updateTransport({ otherDailyKm: parseFloat(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-xs text-muted block">
            Jarak nongkrong di warkop, fotokopi, cari makan siang/malam, belanja minimarket.
          </span>
        </div>

        {/* Weekend / Pulang Kampung Trip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-charcoal">
              Perjalanan Luar Kota / Pulang Kampung (km/bulan)
            </label>
            <span className="text-sm font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {transport.weekendTripKmPerMonth} km / bln
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={transport.weekendTripKmPerMonth}
            onChange={(e) =>
              updateTransport({ weekendTripKmPerMonth: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-xs text-muted block">
            Contoh: Jalan ke Lampuuk/Lhoknga ~30-40 km PP; pulang kampung ke Sigli ~180 km PP; atau 0 jika tetap di kos.
          </span>

          {transport.weekendTripKmPerMonth > 0 && (
            <div className="pt-2 space-y-1.5">
              <label className="text-xs font-semibold text-charcoal block">
                Transportasi yang digunakan untuk perjalanan luar kota:
              </label>
              <select
                value={transport.weekendTripVehicle}
                onChange={(e) =>
                  updateTransport({ weekendTripVehicle: e.target.value as VehicleType })
                }
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-sage/40 bg-cream/30 text-charcoal"
              >
                <option value="motor_matic_bebek">Sepeda Motor Matic / Manual</option>
                <option value="trans_koetaradja">Bus Antarkota / Bus Umum</option>
                <option value="labi_labi">Minibus L300 / HiAce / Labi-Labi</option>
                <option value="mobil_bensin">Mobil Pribadi / Rental</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Aceh Context Tip Box */}
      <div className="bg-mint/60 rounded-2xl p-4 border border-sage/30 flex items-start gap-3 text-xs text-charcoal/80">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <strong className="text-forest-dark font-bold">Tips:</strong> Jika jarak kosmu ke kampus berada di jalur rute Trans Koetaradja (Koridor 1 Darussalam - Masjid Raya), kamu bisa menghemat hingga 100% biaya bensin dan memangkas jejak karbon harian secara signifikan!
        </div>
      </div>
    </div>
  );
}
