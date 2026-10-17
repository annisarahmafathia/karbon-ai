"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { ShoppingBag, Truck, FileText, Smartphone, Laptop, ShieldCheck } from "lucide-react";

export function StepConsumption() {
  const { input, updateConsumption } = useCalculator();
  const consumption = input.consumption;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-xl font-bold text-charcoal">
          4. Belanja Barang & Konsumsi Kampus
        </h2>
        <p className="text-sm text-muted mt-1">
          Dihitung berbasis <strong>satuan fisik barang</strong> (helai pakaian, paket logistik antar-pulau, rim kertas), bukan dari jumlah rupiah belanja.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-6">
        {/* Fast Fashion / New Clothes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-forest" />
              Pembelian Pakaian Baru (Baju, Kaos, Celana, Jilbab)
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {consumption.newClothesPerMonth} helai / bulan
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={consumption.newClothesPerMonth}
            onChange={(e) =>
              updateConsumption({ newClothesPerMonth: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            1 helai pakaian baru berjejak rata-rata 8.5 kg CO₂e (penanaman kapas, pewarnaan tekstil kimia, dan pengiriman).
          </span>
        </div>

        {/* Online Package Delivery from Java */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal flex items-center gap-2">
              <Truck className="w-4 h-4 text-forest" />
              Paket Belanja Online dari Marketplace (Jawa ke Aceh)
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {consumption.onlinePackagesPerMonth} paket / bulan
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={consumption.onlinePackagesPerMonth}
            onChange={(e) =>
              updateConsumption({ onlinePackagesPerMonth: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            Pengiriman kargo jarak jauh ~2.500 km dari pusat distribusi Jakarta ke Aceh via udara & darat (~1.85 kg CO₂e/paket).
          </span>
        </div>

        {/* Photocopy Sheets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest" />
              Fotokopi Diktat, Modul, & Kertas Tugas Kuliah
            </span>
            <span className="font-bold text-forest bg-mint px-2.5 py-0.5 rounded-full">
              {consumption.photocopySheetsPerMonth} lembar / bulan
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="250"
            step="5"
            value={consumption.photocopySheetsPerMonth}
            onChange={(e) =>
              updateConsumption({ photocopySheetsPerMonth: parseInt(e.target.value) || 0 })
            }
            className="w-full accent-forest cursor-pointer"
          />
          <span className="text-[11px] text-muted block">
            500 lembar kertas HVS A4 (1 rim) menghasilkan ~2.4 kg CO₂e emisi deforestasi bubur kertas dan energi pabrik.
          </span>
        </div>
      </div>

      {/* Gadget Purchases */}
      <div className="bg-white p-6 rounded-2xl border border-sage/30 space-y-4">
        <h3 className="text-sm font-bold text-charcoal border-b border-sage/20 pb-3">
          Pembelian Gadget Baru
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-sage/20 bg-cream/40">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-charcoal flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-forest" />
                Beli HP Baru Tahun Ini
              </span>
              <span className="text-[11px] text-muted block">
                Emisi pabrikasi chip (~5 kg CO₂e/bln)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consumption.purchasedSmartphoneThisYear}
                onChange={(e) =>
                  updateConsumption({ purchasedSmartphoneThisYear: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-sage/20 bg-cream/40">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-charcoal flex items-center gap-2">
                <Laptop className="w-4 h-4 text-forest" />
                Beli Laptop Baru Tahun Ini
              </span>
              <span className="text-[11px] text-muted block">
                Emisi manufaktur laptop (~16.7 kg CO₂e/bln)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consumption.purchasedLaptopThisYear}
                onChange={(e) =>
                  updateConsumption({ purchasedLaptopThisYear: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
