"use client";

import React from "react";
import { useCalculator } from "@/context/CalculatorContext";
import {
  DEFAULT_CALCULATOR_INPUT,
  ARCHETYPE_KOS_AC,
  ARCHETYPE_ASRAMA_HIJAU,
} from "@/lib/validation";
import { UserCheck, Sparkles, Home, Building2 } from "lucide-react";

export function CalculatorArchetypes() {
  const { loadArchetype } = useCalculator();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage/30 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-forest" />
          <h3 className="text-sm font-bold text-charcoal">
            Muat Profil Cepat Mahasiswa Aceh (Preset):
          </h3>
        </div>
        <span className="text-xs text-muted">
          Pilih salah satu profil untuk simulasi instan
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => loadArchetype(DEFAULT_CALCULATOR_INPUT)}
          className="flex items-center gap-3 p-3 rounded-xl border border-sage/40 bg-cream/50 hover:bg-mint hover:border-forest text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold text-xs group-hover:bg-forest group-hover:text-cream transition-colors">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-charcoal group-hover:text-forest">
              Kos Darussalam (Kipas)
            </div>
            <div className="text-[11px] text-muted">
              Motor matic, kipas angin, warkop
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => loadArchetype(ARCHETYPE_KOS_AC)}
          className="flex items-center gap-3 p-3 rounded-xl border border-sage/40 bg-cream/50 hover:bg-mint hover:border-forest text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-charcoal group-hover:text-forest">
              Kos Kamar Ber-AC
            </div>
            <div className="text-[11px] text-muted">
              AC harian, kulkas, pesan antar
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => loadArchetype(ARCHETYPE_ASRAMA_HIJAU)}
          className="flex items-center gap-3 p-3 rounded-xl border border-sage/40 bg-cream/50 hover:bg-mint hover:border-forest text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-charcoal group-hover:text-forest">
              Asrama Ramah Lingkungan
            </div>
            <div className="text-[11px] text-muted">
              Trans Koetaradja, pilah sampah
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
