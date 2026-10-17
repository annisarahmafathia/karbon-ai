import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HistoryResultView } from "@/components/history/HistoryResultView";
import { formatCalculationDate, parseResultSnapshot } from "@/lib/history/snapshot";

export default async function RiwayatDetailPage({
  params,
}: PageProps<"/riwayat/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: calculation, error } = await supabase
    .from("carbon_calculations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat detail riwayat dari Supabase:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  if (!calculation) {
    notFound();
  }

  const snapshot = parseResultSnapshot(calculation.result_snapshot);

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-3">
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Riwayat</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
              Detail Emisi
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {formatCalculationDate(
                calculation.created_at || calculation.calculation_date
              )}
            </p>
          </div>
        </div>

        <HistoryResultView calculation={calculation} snapshot={snapshot} />
      </div>
    </div>
  );
}
