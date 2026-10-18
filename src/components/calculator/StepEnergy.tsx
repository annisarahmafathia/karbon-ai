
"use client";

import { useCalculator } from "@/context/CalculatorContext";
import { HousingType } from "@/types/carbon";
import { Info } from "lucide-react";

export function StepEnergy() {
  const { input, updateEnergy } = useCalculator();
  const energy = input.energy;

  const housingTypes: {
    value: HousingType;
    label: string;
    desc: string;
  }[] = [
    {
      value: "kos_sendiri",
      label: "Kamar Kos Sendiri",
      desc: "Kamar pribadi dengan meteran sendiri atau listrik inklusif kos",
    },
    {
      value: "kos_berbagi",
      label: "Kamar Kos Berdua / Bertiga",
      desc: "Satu kamar kos ditempati 2–3 orang",
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
          Konsumsi listrik dihitung menggunakan faktor emisi
          Sistem Interkoneksi Sumatera-Aceh sebesar 0.761 kg
          CO₂e/kWh.
        </p>
      </div>

      {/* Pilihan tipe tempat tinggal */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
          Tempat Tinggal Selama Kuliah
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
                <div className="text-xs text-muted mt-1 leading-snug">
                  {ht.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input konsumsi listrik bulanan */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-charcoal">
            Konsumsi Listrik Bulanan
          </h3>
          <p className="text-xs text-muted mt-1">
            Masukkan konsumsi listrik bulanan berdasarkan meteran
            atau informasi pemakaian listrik yang tersedia.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="monthlyKwh"
            className="text-xs font-semibold text-charcoal block"
          >
            Total Konsumsi Listrik Bulanan (kWh)
          </label>

          <div className="flex items-center gap-3">
            <input
              id="monthlyKwh"
              type="number"
              min="0"
              max="1500"
              step="any"
              value={energy.monthlyKwh}
              onChange={(e) =>
                updateEnergy({
                  calculationMethod: "token_kwh",
                  monthlyKwh:
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value),
                })
              }
              className="w-full max-w-xs px-3 py-2 text-sm font-bold border border-sage/40 rounded-xl"
            />
            <span className="text-sm font-bold text-forest whitespace-nowrap">
              kWh/bulan
            </span>
          </div>

          <p className="text-xs text-muted">
            Perkiraan token 1.300 VA: Rp50.000 ≈ 32 kWh, 
            Rp100.000 ≈ 64 kWh, Rp200.000 ≈ 128 kWh. 
            Jumlah aktual dapat berbeda karena pajak dan biaya admin.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <label
            htmlFor="housematesCount"
            className="text-xs font-semibold text-charcoal block"
          >
            Jumlah Penghuni
          </label>

          <div className="flex items-center gap-3">
            <input
              id="housematesCount"
              type="number"
              min="1"
              max="20"
              step="1"
              value={energy.housematesCount}
              onChange={(e) => {
                const value = e.target.value;
                const count =
                  value === ""
                    ? 1
                    : Number.parseInt(value, 10);

                updateEnergy({
                  housematesCount: Number.isFinite(count)
                    ? Math.max(1, Math.min(20, count))
                    : 1,
                });
              }}
              className="w-24 px-3 py-2 text-sm font-bold border border-sage/40 rounded-xl"
            />
            <span className="text-sm text-charcoal">orang</span>
          </div>

          <p className="text-xs text-muted">
            Jika angka kWh khusus untukmu, isi 1 orang.
          </p>
        </div>
      </div>

      {/* Informasi faktor emisi */}
      <div className="bg-mint/60 rounded-2xl p-4 border border-sage/30 flex items-start gap-3 text-xs text-charcoal/80">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div>
          <strong className="text-forest-dark font-bold">
            Catatan Jaringan Sumatera:
          </strong>{" "}
          Setiap 1 kWh listrik yang digunakan menghasilkan estimasi
          emisi sekitar 0.761 kg CO₂e berdasarkan faktor emisi
          jaringan Sumatera-Aceh yang digunakan aplikasi.
        </div>
      </div>
    </div>
  );
}
