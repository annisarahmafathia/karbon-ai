import Link from "next/link";
import { Calculator, ChevronRight, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  formatCalculationDate,
  parseResultSnapshot,
  isPlasticCalculationResult,
} from "@/lib/history/snapshot";

export default async function RiwayatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: calculations, error } = user
    ? await supabase
        .from("carbon_calculations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (error) {
    console.error("Gagal memuat riwayat kalkulasi dari Supabase:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  const items = calculations ?? [];

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
              Riwayat Jejak Karbon
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Daftar seluruh riwayat perhitungan emisi yang pernah kamu simpan
            </p>
          </div>
          <Link
            href="/kalkulator"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs font-bold shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hitung Baru</span>
          </Link>
        </div>

        {error ? (
          <div className="bg-white rounded-3xl p-6 border border-red-200 text-sm text-red-700">
            Gagal memuat riwayat perhitungan. Silakan muat ulang halaman.
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-sage/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-mint text-forest flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">Belum Ada Riwayat Tersimpan</p>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Mulai hitung jumlah barang plastik sekali pakai barumu selama seminggu untuk memantau jejak karbon pribadi.
              </p>
            </div>
            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-sm font-bold shadow"
            >
              <Calculator className="w-4 h-4 text-sage" />
              <span>Hitung Emisi Plastik</span>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const snapshot = parseResultSnapshot(item.result_snapshot);
              const isWeeklyPlastic =
                item.methodology_version === "v2_plastik_mingguan" ||
                (item.total_weekly_kg != null && item.total_weekly_kg > 0) ||
                (snapshot != null && isPlasticCalculationResult(snapshot));

              const emissionDisplay = isWeeklyPlastic
                ? item.total_weekly_kg ??
                  (snapshot && isPlasticCalculationResult(snapshot)
                    ? snapshot.totalWeeklyKgCO2e
                    : item.total_monthly_kg)
                : item.total_monthly_kg;

              const unitDisplay = isWeeklyPlastic ? "kg CO₂e/minggu" : "kg CO₂e/bln";

              const categoryLabel =
                snapshot && isPlasticCalculationResult(snapshot)
                  ? snapshot.highestCategory.label
                  : CATEGORY_LABELS[item.highest_category] ?? item.highest_category;

              return (
                <li key={item.id}>
                  <Link
                    href={`/riwayat/${item.id}`}
                    className="flex items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-sage/30 shadow-sm hover:border-forest/40 hover:bg-mint/20 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted">
                          {formatCalculationDate(item.created_at || item.calculation_date)}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isWeeklyPlastic
                              ? "bg-mint text-forest border border-forest/20"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {isWeeklyPlastic ? "Plastik Mingguan" : "Historis Bulanan"}
                        </span>
                      </div>
                      <p className="text-lg font-black text-forest">
                        {emissionDisplay}{" "}
                        <span className="text-xs font-bold text-charcoal">
                          {unitDisplay}
                        </span>
                      </p>
                      <p className="text-xs font-semibold text-charcoal">
                        Hotspot: {categoryLabel}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
