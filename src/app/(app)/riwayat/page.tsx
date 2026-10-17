import Link from "next/link";
import { Calculator, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, formatCalculationDate } from "@/lib/history/snapshot";

export default async function RiwayatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: calculations, error } = user
    ? await supabase
        .from("carbon_calculations")
        .select(
          "id, calculation_date, created_at, total_monthly_kg, highest_category"
        )
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
            Riwayat Emisi
          </h1>
        </div>

        {error ? (
          <div className="bg-white rounded-3xl p-6 border border-red-200 text-sm text-red-700">
            Gagal memuat riwayat.
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-sage/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-mint text-forest flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-charcoal">Belum ada riwayat</p>
            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-sm font-bold shadow"
            >
              <Calculator className="w-4 h-4 text-sage" />
              <span>Hitung emisi</span>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/riwayat/${item.id}`}
                  className="flex items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-sage/30 shadow-sm hover:border-forest/40 hover:bg-mint/20 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted">
                      {formatCalculationDate(item.created_at || item.calculation_date)}
                    </p>
                    <p className="text-lg font-black text-forest">
                      {item.total_monthly_kg}{" "}
                      <span className="text-xs font-bold text-charcoal">
                        kg CO₂e
                      </span>
                    </p>
                    <p className="text-xs font-semibold text-charcoal">
                      {CATEGORY_LABELS[item.highest_category]}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
