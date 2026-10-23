import { SupabaseClient } from "@supabase/supabase-js";
import { PlasticCalculatorInput, CalculationResult } from "@/types/carbon";

export interface SaveCalculationResult {
  success: boolean;
  isUpdated?: boolean;
  error?: string;
  isFallbackUsed?: boolean;
}

/**
 * Menyimpan riwayat kalkulasi karbon ke Supabase:
 * 1. Penyimpanan Manual: Dipanggil hanya ketika pengguna sengaja menekan "Simpan Hasil".
 * 2. Catatan Mandiri: Setiap penyimpanan menghasilkan satu baris catatan baru dan
 *    mempertahankan semua catatan sebelumnya tanpa menimpa hasil sebelumnya.
 * 3. Keamanan RLS: Hanya menyimpan dengan user_id pengguna aktif.
 * 4. Ketahanan Skema: Mendukung skema migrasi baru (v2_plastik_mingguan) serta
 *    fallback adaptif non-destruktif jika kolom baru belum ada di database online Supabase.
 */
export async function saveCalculationHistory(
  supabase: SupabaseClient,
  userId: string,
  input: PlasticCalculatorInput,
  result: CalculationResult
): Promise<SaveCalculationResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Hitung minggu ke berapa dalam tahun ini (1-53)
  const startOfYear = new Date(year, 0, 1);
  const pastDays = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.max(1, Math.ceil((pastDays + startOfYear.getDay() + 1) / 7));

  // Payload Utama (Metodologi Baru 4 Kategori Plastik Sekali Pakai Mingguan)
  const primaryPayload = {
    user_id: userId,
    methodology_version: "v2_plastik_mingguan",
    period_week: currentWeek,
    period_month: month,
    period_year: year,
    total_weekly_kg: result.totalWeeklyKgCO2e,
    kantong_plastik_weekly_kg: result.categories.kantong_plastik.weeklyKgCO2e,
    wadah_makanan_weekly_kg: result.categories.wadah_makanan.weeklyKgCO2e,
    botol_minum_weekly_kg: result.categories.botol_minum.weeklyKgCO2e,
    wadah_styrofoam_weekly_kg: result.categories.wadah_styrofoam.weeklyKgCO2e,
    total_items_per_week: result.totalItemsPerWeek,
    total_monthly_kg: result.totalMonthlyKgCO2e,
    total_yearly_kg: result.totalYearlyKgCO2e,
    highest_category: result.highestCategory.category,
    confidence_score: result.dataQuality.confidenceScore,
    input_snapshot: input,
    result_snapshot: result,
  };

  // Simpan satu catatan baru ke tabel carbon_calculations
  const { error: insertError } = await supabase
    .from("carbon_calculations")
    .insert(primaryPayload);

  let saveError = insertError;
  let isFallbackUsed = false;

  // Fallback Adaptif jika database remote belum menjalankan migrasi 20261022000000_single_use_plastics_methodology.sql
  // (PGRST204: kolom tidak ada di schema cache PostgREST, 42703: kolom tidak ada di postgres, 23514: check constraint highest_category)
  const isSchemaMismatched = Boolean(
    saveError &&
      (saveError.code === "PGRST204" ||
        saveError.code === "42703" ||
        saveError.code === "23514" ||
        saveError.message?.toLowerCase().includes("schema cache") ||
        saveError.message?.toLowerCase().includes("column") ||
        saveError.message?.toLowerCase().includes("constraint") ||
        saveError.message?.toLowerCase().includes("highest_category"))
  );

  if (isSchemaMismatched && saveError) {
    console.warn(
      "[Storage] Kolom/constraint baru belum terpasang di database online Supabase (Error:",
      saveError.message,
      "). Menggunakan penyimpanan adaptif non-destruktif."
    );

    const fallbackPayload = {
      user_id: userId,
      period_month: month,
      period_year: year,
      total_monthly_kg: result.totalMonthlyKgCO2e,
      total_yearly_kg: result.totalYearlyKgCO2e,
      highest_category: "sampah", // Menggunakan nilai yang diizinkan oleh check constraint skema awal
      confidence_score: result.dataQuality.confidenceScore,
      transport_monthly_kg: 0,
      energy_monthly_kg: 0,
      food_monthly_kg: 0,
      consumption_monthly_kg: 0,
      waste_monthly_kg: result.totalMonthlyKgCO2e,
      input_snapshot: input,
      result_snapshot: result,
    };

    const { error: fbErr } = await supabase
      .from("carbon_calculations")
      .insert(fallbackPayload);

    saveError = fbErr;
    if (!saveError) {
      isFallbackUsed = true;
    }
  }

  if (saveError) {
    return {
      success: false,
      isUpdated: false,
      error: saveError.message,
    };
  }

  return {
    success: true,
    isUpdated: false,
    isFallbackUsed,
  };
}
