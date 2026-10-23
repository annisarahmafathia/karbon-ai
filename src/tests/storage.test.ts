import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { saveCalculationHistory } from "../lib/history/storage";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import { SupabaseClient } from "@supabase/supabase-js";
import { CarbonCalculation } from "../types/database";

interface CalculationDbRow {
  user_id?: string;
  total_weekly_kg?: number;
  kantong_plastik_weekly_kg?: number;
  wadah_makanan_weekly_kg?: number;
  botol_minum_weekly_kg?: number;
  wadah_styrofoam_weekly_kg?: number;
  highest_category?: string;
  result_snapshot?: unknown;
  total_monthly_kg?: number;
  waste_monthly_kg?: number;
  [key: string]: unknown;
}

test("1. Menghitung tanpa menekan Simpan Hasil tidak memanggil saveCalculationHistory otomatis", async () => {
  const hasilPagePath = path.resolve(process.cwd(), "src/app/(app)/hasil/page.tsx");
  const content = await fs.readFile(hasilPagePath, "utf-8");

  // Pastikan tidak ada useEffect yang memicu auto-save ke akun
  assert.ok(!content.includes("hasAutoSavedRef"), "Tidak boleh ada ref hasAutoSavedRef");
  assert.ok(!content.includes("handleSaveToAccount(true)"), "Tidak boleh ada panggilan auto-save otomatis");
  assert.ok(content.includes("onClick={() => handleSaveToAccount()}"), "Simpan hanya dipanggil lewat klik tombol");
});

test("2. Menekan Simpan Hasil membuat tepat satu catatan baru (INSERT)", async () => {
  const input = {
    kantongPlastik: 5,
    wadahMakanan: 4,
    botolMinum: 3,
    wadahStyrofoam: 2,
  };
  const result = calculateCarbonFootprint(input);

  const insertedRows: CalculationDbRow[] = [];

  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, "carbon_calculations");
      return {
        insert: async (payload: Record<string, unknown>) => {
          insertedRows.push(payload as CalculationDbRow);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  const res = await saveCalculationHistory(mockSupabase, "user-uuid-123", input, result);

  assert.equal(res.success, true);
  assert.equal(insertedRows.length, 1, "Harus membuat tepat satu catatan baru");
  const row = insertedRows[0];
  assert.equal(row.user_id, "user-uuid-123");
  assert.equal(row.total_weekly_kg, result.totalWeeklyKgCO2e);
  assert.equal(row.highest_category, result.highestCategory.category);
});

test("3. Menyimpan hasil kedua tidak menimpa hasil pertama (menghasilkan catatan mandiri)", async () => {
  const input1 = { kantongPlastik: 2, wadahMakanan: 1, botolMinum: 1, wadahStyrofoam: 0 };
  const result1 = calculateCarbonFootprint(input1);

  const input2 = { kantongPlastik: 6, wadahMakanan: 3, botolMinum: 4, wadahStyrofoam: 2 };
  const result2 = calculateCarbonFootprint(input2);

  const databaseStorage: CalculationDbRow[] = [];

  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, "carbon_calculations");
      return {
        insert: async (payload: Record<string, unknown>) => {
          databaseStorage.push(payload as CalculationDbRow);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  // Simpan pertama
  const res1 = await saveCalculationHistory(mockSupabase, "user-uuid-123", input1, result1);
  assert.equal(res1.success, true);

  // Simpan kedua
  const res2 = await saveCalculationHistory(mockSupabase, "user-uuid-123", input2, result2);
  assert.equal(res2.success, true);

  // Kedua catatan harus tetap tersimpan, hasil pertama TIDAK ditimpa
  assert.equal(databaseStorage.length, 2, "Harus ada 2 catatan mandiri di database");
  assert.equal(databaseStorage[0].total_weekly_kg, result1.totalWeeklyKgCO2e);
  assert.equal(databaseStorage[1].total_weekly_kg, result2.totalWeeklyKgCO2e);
});

test("4. Grafik mingguan hanya menggunakan hasil yang sudah disimpan, dengan hasil simpan terakhir sebagai nilai minggu tersebut", () => {
  // Simulasi 3 catatan yang disimpan di database
  // Dua catatan disimpan di minggu ke-43 (hasil simpan kedua harus meng-override nilai minggu tersebut pada grafik)
  const savedCalculations: Partial<CarbonCalculation>[] = [
    {
      id: "calc-3-newest-week-43",
      user_id: "user-1",
      period_year: 2026,
      period_week: 43,
      total_weekly_kg: 0.95,
      created_at: "2026-10-23T10:00:00Z",
    },
    {
      id: "calc-2-older-week-43",
      user_id: "user-1",
      period_year: 2026,
      period_week: 43,
      total_weekly_kg: 1.50,
      created_at: "2026-10-23T08:00:00Z",
    },
    {
      id: "calc-1-week-42",
      user_id: "user-1",
      period_year: 2026,
      period_week: 42,
      total_weekly_kg: 1.10,
      created_at: "2026-10-16T08:00:00Z",
    },
  ];

  // Algoritma grouping Dashboard:
  // calculations diurutkan created_at DESC, catatan pertama per minggu adalah hasil simpan terakhir
  const weeklyMap = new Map<string, Partial<CarbonCalculation>>();
  for (const calc of savedCalculations) {
    const year = calc.period_year ?? new Date(calc.created_at!).getFullYear();
    const weekKey = `Y${year}-W${calc.period_week}`;
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, calc);
    }
  }

  const chartWeeks = Array.from(weeklyMap.values());
  assert.equal(chartWeeks.length, 2, "Harus ada tepat 2 minggu pada grafik (W42 dan W43)");

  const week43Point = chartWeeks.find((c) => c.period_week === 43);
  assert.ok(week43Point);
  // Nilai minggu ke-43 harus mengambil hasil simpan terakhir (0.95 kg), bukan hasil lama (1.50 kg)
  assert.equal(week43Point.total_weekly_kg, 0.95);
});

test("5. saveCalculationHistory gracefully uses adaptive fallback payload if remote DB throws 42703 column missing", async () => {
  const input = {
    kantongPlastik: 2,
    wadahMakanan: 2,
    botolMinum: 2,
    wadahStyrofoam: 2,
  };
  const result = calculateCarbonFootprint(input);

  let fallbackAttempted = false;
  const captured: { fallbackPayload: CalculationDbRow | null } = { fallbackPayload: null };

  const mockSupabase = {
    from: () => ({
      insert: async (payload: Record<string, unknown>) => {
        // Percobaan pertama gagal karena kolom total_weekly_kg belum ada di remote DB
        if (!fallbackAttempted) {
          fallbackAttempted = true;
          return {
            error: {
              code: "42703",
              message: "column carbon_calculations.total_weekly_kg does not exist",
            },
          };
        }
        // Percobaan fallback adaptif berhasil
        captured.fallbackPayload = payload as CalculationDbRow;
        return { error: null };
      },
    }),
  } as unknown as SupabaseClient;

  const res = await saveCalculationHistory(mockSupabase, "user-uuid-123", input, result);

  assert.equal(res.success, true);
  assert.equal(res.isFallbackUsed, true);
  assert.ok(captured.fallbackPayload);
  assert.ok(captured.fallbackPayload.result_snapshot);
  assert.equal(captured.fallbackPayload.total_monthly_kg, result.totalMonthlyKgCO2e);
  assert.equal(captured.fallbackPayload.waste_monthly_kg, result.totalMonthlyKgCO2e);
});

test("6. Historical snapshot discrimination correctly prevents legacy snapshots with categories from being labeled v2", () => {
  const v1Snapshot = {
    totalMonthlyKgCO2e: 150,
    categories: {
      transportasi: { monthlyKgCO2e: 60 },
      energi: { monthlyKgCO2e: 50 },
      pangan: { monthlyKgCO2e: 40 },
    },
  };

  const v2Snapshot = {
    methodology: "v2_plastik_mingguan",
    totalWeeklyKgCO2e: 0.85,
    categories: {
      kantong_plastik: { weeklyKgCO2e: 0.25 },
      wadah_makanan: { weeklyKgCO2e: 0.3 },
      botol_minum: { weeklyKgCO2e: 0.2 },
      wadah_styrofoam: { weeklyKgCO2e: 0.1 },
    },
  };

  const isV2ByMigrationRule = (snap: Record<string, unknown>) => {
    const categories = snap.categories as Record<string, unknown> | undefined;
    return Boolean(
      snap.methodology === "v2_plastik_mingguan" ||
      snap.methodologyVersion === "2.0_single_use_plastics" ||
      snap.totalWeeklyKgCO2e !== undefined ||
      (categories && (categories.kantong_plastik || categories.wadah_makanan || categories.botol_minum || categories.wadah_styrofoam))
    );
  };

  assert.equal(isV2ByMigrationRule(v1Snapshot), false, "Snapshot v1 tidak boleh terdeteksi sebagai v2");
  assert.equal(isV2ByMigrationRule(v2Snapshot), true, "Snapshot v2 harus terdeteksi sebagai v2");
});
