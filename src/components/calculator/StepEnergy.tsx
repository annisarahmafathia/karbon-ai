"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { HousingType } from "@/types/carbon";
import { Zap, Wind, Monitor, Refrigerator, Lightbulb, Info } from "lucide-react";

export function StepEnergy() {
  const { input, updateEnergy } = useCalculator();
  const energy = input.energy;

  const housingTypes: { value: HousingType; label: string; desc: string }[] = [
    {
      value: "kos_sendiri",
      label: "Kamar Kos Sendiri",
      desc: "Kamar pribadi dengan meteran sendiri atau listrik inklusif kos",
    },
    {
      value: "kos_berbagi",
      label: "Kamar Kos Berdua / Bertiga",
      desc: "Satu kamar kos ditempati 2-3 orang",
    },
    {
      value: "rumah_sewa",
      label: "Rumah Sewa",
      desc: "Menyewa satu rumah untuk ditempati",
    },
    {
      value: "asrama_kampus",
      label: "Asrama",
      desc: "Asrama USK, Asrama UIN, dll",
    },
    {
      value: "rumah_keluarga",
      label: "Rumah Keluarga",
      desc: "Tinggal bersama keluarga (tidak menyewa)",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-xl font-bold text-charcoal">
          2. Energi & Tempat Tinggal
        </h2>
        <p className="text-sm text-muted mt-1">
          Konsumsi listrik dihitung menggunakan faktor emisi Sistem Interkoneksi Sumatera-Aceh resmi Kementerian ESDM (0.761 kg CO₂e/kWh).
        </p>
      </div>

      {/* Housing Type Selection */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
          Tipe Tempat Tinggal Selama Kuliah
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {housingTypes.map((ht) => {
            const isSelected = energy.housingType === ht.value;
            return (
              <button
                type="button"
                key={ht.value}
                onClick={() => updateEnergy({ housingType: ht.value })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-mint border-forest text-forest-dark ring-1 ring-forest shadow-sm"
                    : "bg-white border-sage/30 hover:border-sage hover:bg-cream/40 text-charcoal"
                }`}
              >
                <div className="text-sm font-bold">{ht.label}</div>
                <div className="text-xs text-muted mt-1 leading-snug">{ht.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculation Method Toggle */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-6">
        <div className="flex items-center justify-between border-b border-sage/20 pb-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal">
              Metode Perhitungan Listrik
            </h3>
            <p className="text-xs text-muted">
              Pilih cara paling mudah untuk mengestimasi pemakaian listrikmu
            </p>
          </div>
          <div className="flex rounded-xl bg-cream p-1 border border-sage/30">
            <button
              type="button"
              onClick={() => updateEnergy({ calculationMethod: "peralatan" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                energy.calculationMethod === "peralatan"
                  ? "bg-forest text-cream shadow-sm"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              Peralatan Kamar
            </button>
            <button
              type="button"
              onClick={() => updateEnergy({ calculationMethod: "token_kwh" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                energy.calculationMethod === "token_kwh"
                  ? "bg-forest text-cream shadow-sm"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              Token PLN (kWh)
            </button>
          </div>
        </div>

        {/* Mode 1: Bottom-up Peralatan */}
        {energy.calculationMethod === "peralatan" ? (
          <div className="space-y-6">
            {/* AC Toggle & Slider */}
            <div className="p-4 rounded-xl border border-sage/20 bg-cream/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center text-forest">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-charcoal block">
                      Pendingin Ruangan (AC Kos 0.5 PK)
                    </span>
                    <span className="text-xs text-muted">
                      Apakah kamar kosmu dilengkapi AC?
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={energy.hasAirConditioner}
                    onChange={(e) =>
                      updateEnergy({
                        hasAirConditioner: e.target.checked,
                        acDailyHours: e.target.checked ? (energy.acDailyHours || 6) : 0,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
                </label>
              </div>

              {energy.hasAirConditioner && (
                <div className="pt-2 pl-12 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-charcoal">
                      Lama Penggunaan AC per Hari:
                    </span>
                    <span className="font-bold text-forest bg-mint px-2 py-0.5 rounded">
                      {energy.acDailyHours} jam / hari
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={energy.acDailyHours}
                    onChange={(e) =>
                      updateEnergy({ acDailyHours: parseInt(e.target.value) || 0 })
                    }
                    className="w-full accent-forest cursor-pointer"
                  />
                  <span className="text-[11px] text-muted block">
                    Di Aceh yang panas, AC 6 jam/hari menghabiskan ~68 kWh/bln (~52 kg CO₂e).
                  </span>
                </div>
              )}
            </div>

            {/* Fan Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-charcoal flex items-center gap-2">
                  <Wind className="w-4 h-4 text-forest" />
                  Kipas Angin Kamar (jam / hari)
                </span>
                <span className="font-bold text-forest bg-mint px-2 py-0.5 rounded">
                  {energy.fanDailyHours} jam / hari
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={energy.fanDailyHours}
                onChange={(e) =>
                  updateEnergy({ fanDailyHours: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            {/* Laptop Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-charcoal flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-forest" />
                  Laptop & Gadget Menyala / Dicas (jam / hari)
                </span>
                <span className="font-bold text-forest bg-mint px-2 py-0.5 rounded">
                  {energy.laptopDailyHours} jam / hari
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={energy.laptopDailyHours}
                onChange={(e) =>
                  updateEnergy({ laptopDailyHours: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            {/* Mini Fridge & Light */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-sage/20 bg-cream/40">
                <div className="flex items-center gap-2.5">
                  <Refrigerator className="w-4 h-4 text-forest" />
                  <span className="text-xs font-bold text-charcoal">
                    Kulkas 1 Pintu di Kos
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={energy.hasMiniFridge}
                    onChange={(e) =>
                      updateEnergy({ hasMiniFridge: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-sage/20 bg-cream/40">
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-forest" />
                  <span className="text-xs font-bold text-charcoal">
                    Lampu Kamar (jam/hari)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={energy.lightDailyHours}
                  onChange={(e) =>
                    updateEnergy({ lightDailyHours: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 px-2 py-1 text-xs font-bold border border-sage/40 rounded-lg text-center"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Mode 2: Direct Token Input */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-charcoal block">
                Total Token Listrik Bulanan (kWh)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={energy.monthlyKwh}
                  onChange={(e) =>
                    updateEnergy({ monthlyKwh: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 px-3 py-2 text-sm font-bold border border-sage/40 rounded-xl"
                />
                <span className="text-sm font-bold text-forest">kWh / bulan</span>
              </div>
              <span className="text-xs text-muted block">
                Sebagai panduan: Token PLN Rp 50.000 ~ 36 kWh; Token Rp 100.000 ~ 72 kWh (tarif R1/900VA-1300VA).
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-charcoal block">
                Jumlah Penghuni yang Berbagi Token
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={energy.housematesCount}
                  onChange={(e) =>
                    updateEnergy({ housematesCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-24 px-3 py-2 text-sm font-bold border border-sage/40 rounded-xl"
                />
                <span className="text-sm text-charcoal font-medium">orang</span>
              </div>
              <span className="text-xs text-muted block">
                Jika kamu tinggal sendiri di kamar kos mandiri, isi 1 orang.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-mint/60 rounded-2xl p-4 border border-sage/30 flex items-start gap-3 text-xs text-charcoal/80">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <strong className="text-forest-dark font-bold">Catatan Jaringan Sumatera:</strong> Setiap 1 kWh listrik yang kamu gunakan di kos menghasilkan sekitar 0.761 kg CO₂e karena pembangkitan listrik di Sumatera masih banyak mengandalkan PLTU batubara dan gas alam.
        </div>
      </div>
    </div>
  );
}
