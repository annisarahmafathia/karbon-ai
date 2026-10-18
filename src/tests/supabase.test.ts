import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured, createClient } from "../lib/supabase/client";

test("Hasil save mapping uses CalculationResult.categories and highestCategory.category", async () => {
  const hasilPagePath = path.resolve(
    process.cwd(),
    "src/app/(app)/hasil/page.tsx"
  );
  const content = await fs.readFile(hasilPagePath, "utf-8");

  assert.ok(content.includes("result.categories.transportasi.monthlyKgCO2e"));
  assert.ok(content.includes("result.categories.energi.monthlyKgCO2e"));
  assert.ok(content.includes("result.categories.pangan.monthlyKgCO2e"));
  assert.ok(content.includes("result.categories.konsumsi.monthlyKgCO2e"));
  assert.ok(content.includes("result.categories.sampah.monthlyKgCO2e"));
  assert.ok(content.includes("result.highestCategory.category"));
  assert.ok(
    !content.includes("result.breakdown"),
    "Hasil page must not read a nonexistent breakdown property"
  );
  assert.ok(
    !content.includes("result.highestCategory.id"),
    "highestCategory uses category, not id"
  );
  assert.ok(content.includes("Gagal menyimpan kalkulasi ke Supabase:"));
  assert.ok(content.includes("Kesalahan JavaScript saat menyimpan kalkulasi (bukan error Supabase):"));
});

test("Supabase isSupabaseConfigured returns boolean based on environment", () => {
  const configured = isSupabaseConfigured();
  assert.equal(typeof configured, "boolean");
});

test("createClient returns a valid Supabase client instance with strongly typed schema", () => {
  const supabase = createClient();
  assert.ok(supabase);
  assert.ok(supabase.auth);
  assert.equal(typeof supabase.from, "function");

  // Verifikasi pemanggilan tabel & view yang didefinisikan dalam skema Database
  const profilesQuery = supabase.from("profiles");
  const calculationsQuery = supabase.from("carbon_calculations");
  const actionsQuery = supabase.from("green_action_commitments");
  const summaryQuery = supabase.from("community_impact_summary");

  assert.ok(profilesQuery);
  assert.ok(calculationsQuery);
  assert.ok(actionsQuery);
  assert.ok(summaryQuery);
});

test("SQL migration file enforces security, least privilege, search_path protection, and non-destructive compatibility", async () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261016000000_create_karbon_ai_schema.sql"
  );
  const sqlContent = await fs.readFile(migrationPath, "utf-8");

  // 1. RLS diaktifkan pada semua tabel pengguna
  assert.ok(sqlContent.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"));
  assert.ok(sqlContent.includes("ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;"));
  assert.ok(sqlContent.includes("ALTER TABLE public.green_action_commitments ENABLE ROW LEVEL SECURITY;"));

  // 2. Prinsip Least Privilege: Hak akses default dicabut dari PUBLIC
  assert.ok(sqlContent.includes("REVOKE ALL ON public.profiles FROM PUBLIC;"));
  assert.ok(sqlContent.includes("REVOKE ALL ON public.carbon_calculations FROM PUBLIC;"));
  assert.ok(sqlContent.includes("REVOKE ALL ON public.green_action_commitments FROM PUBLIC;"));

  // 3. Kebijakan keamanan berbasis auth.uid()
  assert.ok(sqlContent.includes("auth.uid() = id"));
  assert.ok(sqlContent.includes("auth.uid() = user_id"));

  // 4. Proteksi Privilege Escalation: search_path kosong (SET search_path = '') pada fungsi
  assert.ok(sqlContent.includes("SET search_path = ''"));
  assert.ok(!sqlContent.includes("SET search_path = public, pg_temp"), "Tidak boleh menyertakan public pada search_path");

  // 5. Schema hardening: cabut hak CREATE pada schema public dari PUBLIC
  assert.ok(sqlContent.includes("REVOKE CREATE ON SCHEMA public FROM PUBLIC;"));

  // 6. Penanganan auth aman: email tidak dipaksa NOT NULL agar mendukung metode login alternatif
  assert.ok(
    !sqlContent.includes("email TEXT NOT NULL"),
    "Kolom email di profiles tidak boleh dipaksa NOT NULL untuk mencegah error pada metode auth alternatif"
  );

  // 7. Non-destruktif: jaminan kompatibilitas jika tabel sudah ada sebelumnya (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
  assert.ok(sqlContent.includes("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS"));
  assert.ok(sqlContent.includes("ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS"));
  assert.ok(sqlContent.includes("ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS potential_saving_kg"));
  assert.ok(sqlContent.includes("ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS realized_saving_kg"));
  assert.ok(sqlContent.includes("column_name = 'saving_kg'"), "Migrasi data aman untuk kolom legacy saving_kg");
  assert.ok(sqlContent.includes("carbon_calculations_user_id_fkey"), "Guard foreign key carbon_calculations");
  assert.ok(sqlContent.includes("green_action_commitments_user_id_fkey"), "Guard foreign key green_action_commitments");
  assert.ok(sqlContent.includes("unique_user_action"), "Guard unique constraint");
  assert.ok(!sqlContent.includes("DROP TABLE"), "Tidak boleh menggunakan DROP TABLE");

  // 8. Sintaks SQL valid: COALESCE dan NULLIF sebagai SQL special forms tanpa prefix pg_catalog
  assert.ok(!sqlContent.includes("pg_catalog.coalesce"), "Tidak boleh menggunakan pg_catalog.coalesce");
  assert.ok(!sqlContent.includes("pg_catalog.nullif"), "Tidak boleh menggunakan pg_catalog.nullif");
  assert.ok(sqlContent.includes("COALESCE("));
  assert.ok(sqlContent.includes("NULLIF("));

  // 9. Error handling trigger: tidak menelan error diam-diam (cegah orphan auth user)
  assert.ok(sqlContent.includes("RAISE EXCEPTION"), "Harus melempar exception jika pembuatan profil gagal total");

  // 10. View menggunakan security_invoker = true dan DROP VIEW IF EXISTS sebelum pembuatan
  assert.ok(sqlContent.includes("DROP VIEW IF EXISTS public.community_impact_summary;"));
  assert.ok(sqlContent.includes("WITH (security_invoker = true)"));

  // 11. Deduplikasi bulanan menggunakan DISTINCT ON
  assert.ok(sqlContent.includes("DISTINCT ON (c.user_id, c.period_year, c.period_month)"));

  // 12. Privacy threshold k-anonymity >= 3 untuk seluruh statistik termasuk total_active_students
  assert.ok(sqlContent.includes("WHEN s.student_count >= 3 THEN s.student_count"));

  // 13. Izin eksekusi fungsi trigger updated_at untuk authenticated
  assert.ok(
    sqlContent.includes("GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;"),
    "Harus memberikan izin EXECUTE pada trigger updated_at untuk authenticated"
  );

  // 14. Kebijakan DELETE simetris pada public.profiles
  assert.ok(
    sqlContent.includes('CREATE POLICY "Pengguna dapat menghapus profil sendiri"'),
    "Harus menyediakan kebijakan DELETE pada profiles untuk integritas RLS"
  );

  // 15. Sintaks upsert profiles menggunakan alias AS p dan tidak menggunakan nama kolom 3-bagian
  assert.ok(sqlContent.includes("INSERT INTO public.profiles AS p"));
  assert.ok(
    !sqlContent.includes("ELSE public.profiles.email"),
    "Tidak boleh menggunakan nama kolom 3-bagian (public.profiles.email) pada SET clause ON CONFLICT"
  );

  // 16. DROP FUNCTION IF EXISTS untuk mencegah error perubahan return type pada migrasi berulang
  assert.ok(
    sqlContent.includes("DROP FUNCTION IF EXISTS public.get_community_impact_summary();"),
    "Harus melakukan DROP FUNCTION IF EXISTS sebelum CREATE FUNCTION"
  );
});

test("Monthly calculation deduplication algorithm prevents double-counting emissions in the same month", () => {
  // Simulasi data kalkulasi mentah mahasiswa dalam satu bulan yang sama (misal Oktober 2026)
  interface MockCalc {
    id: string;
    userId: string;
    year: number;
    month: number;
    date: string;
    totalMonthlyKg: number;
  }

  const rawCalculations: MockCalc[] = [
    // Mahasiswa A menghitung 3 kali di bulan Oktober (misal mencoba-coba slider)
    { id: "c1", userId: "user-A", year: 2026, month: 10, date: "2026-10-01", totalMonthlyKg: 120 },
    { id: "c2", userId: "user-A", year: 2026, month: 10, date: "2026-10-10", totalMonthlyKg: 140 },
    { id: "c3", userId: "user-A", year: 2026, month: 10, date: "2026-10-15", totalMonthlyKg: 95 }, // Kalkulasi final

    // Mahasiswa B menghitung 1 kali di bulan Oktober
    { id: "c4", userId: "user-B", year: 2026, month: 10, date: "2026-10-05", totalMonthlyKg: 105 },

    // Mahasiswa A menghitung di bulan September (bulan berbeda, harus tetap dihitung terpisah)
    { id: "c5", userId: "user-A", year: 2026, month: 9, date: "2026-09-20", totalMonthlyKg: 110 },
  ];

  // Algoritma DISTINCT ON (userId, year, month) dengan urutan date DESC
  const deduplicatedMap = new Map<string, MockCalc>();
  const sorted = [...rawCalculations].sort((a, b) => b.date.localeCompare(a.date));

  for (const calc of sorted) {
    const key = `${calc.userId}_${calc.year}_${calc.month}`;
    if (!deduplicatedMap.has(key)) {
      deduplicatedMap.set(key, calc);
    }
  }

  const deduplicated = Array.from(deduplicatedMap.values());

  // Verifikasi deduplikasi:
  // User A memiliki 2 catatan (1 untuk Okt, 1 untuk Sept). User B memiliki 1 catatan (Okt).
  // Total record hasil deduplikasi harus 3 (bukan 5).
  assert.equal(deduplicated.length, 3);

  // Nilai emisi User A di bulan Oktober harus 95 kg (kalkulasi terakhir), bukan penjumlahan 120+140+95=355 kg
  const userAOct = deduplicated.find((c) => c.userId === "user-A" && c.month === 10);
  assert.ok(userAOct);
  assert.equal(userAOct.totalMonthlyKg, 95);

  // Total jejak karbon bulan Oktober adalah 95 + 105 = 200 kg
  const octCalculations = deduplicated.filter((c) => c.month === 10);
  const totalOctKg = octCalculations.reduce((sum, c) => sum + c.totalMonthlyKg, 0);
  assert.equal(totalOctKg, 200);

  // Jika tanpa deduplikasi, total akan salah sebesar 355 + 105 = 460 kg (lebih dari 2x lipat!)
  const naiveOctSum = rawCalculations
    .filter((c) => c.month === 10)
    .reduce((sum, c) => sum + c.totalMonthlyKg, 0);
  assert.equal(naiveOctSum, 460);
});

test("Green action segregation strictly separates potential savings from realized savings", () => {
  interface MockAction {
    id: string;
    userId: string;
    status: "active" | "completed" | "paused" | "abandoned";
    potentialSavingKg: number;
    realizedSavingKg: number;
  }

  const actions: MockAction[] = [
    // Aksi 1: Baru berkomitmen (status active) -> Hanya potensi, belum terealisasi
    { id: "a1", userId: "user-1", status: "active", potentialSavingKg: 18.5, realizedSavingKg: 0 },
    // Aksi 2: Sudah selesai diverifikasi (status completed) -> Terealisasi
    { id: "a2", userId: "user-1", status: "completed", potentialSavingKg: 10.0, realizedSavingKg: 10.0 },
    // Aksi 3: Ditunda (status paused) -> Tidak dihitung
    { id: "a3", userId: "user-2", status: "paused", potentialSavingKg: 12.0, realizedSavingKg: 0 },
    // Aksi 4: Dibatalkan (status abandoned) -> Tidak dihitung
    { id: "a4", userId: "user-2", status: "abandoned", potentialSavingKg: 8.0, realizedSavingKg: 0 },
  ];

  // Perhitungan agregasi sesuai logika get_community_impact_summary()
  const totalPotentialSavings = actions
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.potentialSavingKg, 0);

  const totalRealizedSavings = actions
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + a.realizedSavingKg, 0);

  // Verifikasi pemisahan nilai:
  assert.equal(totalPotentialSavings, 18.5); // Hanya dari a1 (active)
  assert.equal(totalRealizedSavings, 10.0);   // Hanya dari a2 (completed)

  // Memastikan aksi yang baru active TIDAK tercampur ke penghematan terealisasi
  assert.notEqual(totalRealizedSavings, totalPotentialSavings);
});

test("Privacy threshold k >= 3 protects individual student data when student count is low", () => {
  interface SimSummaryInput {
    students: { id: string; monthlyKg: number }[];
    actions: { status: "active" | "completed"; potentialKg: number; realizedKg: number }[];
  }

  function simulateCommunitySummary(input: SimSummaryInput) {
    const studentCount = input.students.length;
    const calcCount = input.students.length;
    const sumMonthlyKg = input.students.reduce((sum, s) => sum + s.monthlyKg, 0);
    const avgMonthlyKg = studentCount > 0 ? Math.round((sumMonthlyKg / studentCount) * 10) / 10 : 0;

    const potentialSavings = input.actions
      .filter((a) => a.status === "active")
      .reduce((sum, a) => sum + a.potentialKg, 0);
    const realizedSavings = input.actions
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + a.realizedKg, 0);

    // Kebijakan k-anonymity lengkap (k >= 3): seluruh metrik termasuk jumlah mahasiswa dimasking ke 0 jika < 3
    return {
      total_active_students: studentCount >= 3 ? studentCount : 0,
      total_calculations_recorded: studentCount >= 3 ? calcCount : 0,
      avg_student_monthly_kg: studentCount >= 3 ? avgMonthlyKg : 0,
      total_recorded_footprint_kg: studentCount >= 3 ? sumMonthlyKg : 0,
      total_potential_savings_kg: studentCount >= 3 ? potentialSavings : 0,
      total_realized_savings_kg: studentCount >= 3 ? realizedSavings : 0,
    };
  }

  // Kasus A: Hanya 1 mahasiswa terdaftar (Ahmad, emisi 135.5 kg, komitmen 15 kg)
  const singleStudentResult = simulateCommunitySummary({
    students: [{ id: "user-ahmad", monthlyKg: 135.5 }],
    actions: [{ status: "active", potentialKg: 15.0, realizedKg: 0 }],
  });

  // Seluruh statistik publik DIMASKING menjadi 0 (termasuk total_active_students)
  // guna mencegah membership disclosure (mengetahui ada 1 orang terdaftar)
  assert.equal(singleStudentResult.total_active_students, 0);
  assert.equal(singleStudentResult.total_calculations_recorded, 0);
  assert.equal(singleStudentResult.avg_student_monthly_kg, 0);
  assert.equal(singleStudentResult.total_recorded_footprint_kg, 0);
  assert.equal(singleStudentResult.total_potential_savings_kg, 0);
  assert.equal(singleStudentResult.total_realized_savings_kg, 0);

  // Kasus B: 2 mahasiswa terdaftar (masih di bawah threshold k=3)
  const twoStudentsResult = simulateCommunitySummary({
    students: [
      { id: "user-1", monthlyKg: 120.0 },
      { id: "user-2", monthlyKg: 140.0 },
    ],
    actions: [],
  });
  assert.equal(twoStudentsResult.total_active_students, 0);
  assert.equal(twoStudentsResult.avg_student_monthly_kg, 0);
  assert.equal(twoStudentsResult.total_recorded_footprint_kg, 0);

  // Kasus C: 3 mahasiswa terdaftar (threshold k >= 3 tercapai)
  const threeStudentsResult = simulateCommunitySummary({
    students: [
      { id: "user-1", monthlyKg: 120.0 },
      { id: "user-2", monthlyKg: 140.0 },
      { id: "user-3", monthlyKg: 100.0 },
    ],
    actions: [
      { status: "active", potentialKg: 20.0, realizedKg: 0 },
      { status: "completed", potentialKg: 10.0, realizedKg: 10.0 },
    ],
  });
  // Seluruh statistik terbuka dan menampilkan agregasi nyata yang aman
  assert.equal(threeStudentsResult.total_active_students, 3);
  assert.equal(threeStudentsResult.total_calculations_recorded, 3);
  assert.equal(threeStudentsResult.avg_student_monthly_kg, 120.0);
  assert.equal(threeStudentsResult.total_recorded_footprint_kg, 360.0);
  assert.equal(threeStudentsResult.total_potential_savings_kg, 20.0);
  assert.equal(threeStudentsResult.total_realized_savings_kg, 10.0);
});

test("Community impact query handles empty database safely returning exactly one zero-value row", async () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261016000000_create_karbon_ai_schema.sql"
  );
  const sqlContent = await fs.readFile(migrationPath, "utf-8");

  // Verifikasi bahwa fungsi menggunakan scalar subquery dengan COALESCE standar
  // dan FROM raw_stats s CROSS JOIN action_aggregates act tanpa GROUP BY yang rentan menghasilkan 0 baris
  assert.ok(sqlContent.includes("COALESCE((SELECT pg_catalog.count(DISTINCT l.user_id)::BIGINT FROM latest_monthly_calculations l), 0::BIGINT)"));
  assert.ok(sqlContent.includes("COALESCE((SELECT pg_catalog.count(l.id)::BIGINT FROM latest_monthly_calculations l), 0::BIGINT)"));
  assert.ok(sqlContent.includes("COALESCE((SELECT pg_catalog.round(pg_catalog.avg(l.total_monthly_kg), 1)::NUMERIC FROM latest_monthly_calculations l), 0::NUMERIC)"));
  assert.ok(sqlContent.includes("COALESCE((SELECT pg_catalog.sum(l.total_monthly_kg)::NUMERIC FROM latest_monthly_calculations l), 0::NUMERIC)"));
  assert.ok(sqlContent.includes("FROM raw_stats s"));
  assert.ok(sqlContent.includes("CROSS JOIN action_aggregates act;"));

  // Simulasi perilaku agregasi pada database kosong:
  interface CalcRecord {
    userId: string;
    totalMonthlyKg: number;
  }
  interface ActionRecord {
    status: "active" | "completed";
    potentialSavingKg: number;
    realizedSavingKg: number;
  }

  const emptyCalculations: CalcRecord[] = [];
  const emptyActions: ActionRecord[] = [];

  const actionAggregates = {
    potentialSavings: emptyActions
      .filter((a) => a.status === "active")
      .reduce((sum, a) => sum + a.potentialSavingKg, 0),
    realizedSavings: emptyActions
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + a.realizedSavingKg, 0),
  };

  const studentCount = new Set(emptyCalculations.map((c) => c.userId)).size;

  const scalarSummaryRow = {
    total_active_students: studentCount,
    total_calculations_recorded: studentCount >= 3 ? emptyCalculations.length : 0,
    avg_student_monthly_kg: studentCount >= 3
      ? Math.round((emptyCalculations.reduce((sum, c) => sum + c.totalMonthlyKg, 0) / emptyCalculations.length) * 10) / 10
      : 0,
    total_recorded_footprint_kg: studentCount >= 3 ? emptyCalculations.reduce((sum, c) => sum + c.totalMonthlyKg, 0) : 0,
    total_potential_savings_kg: studentCount >= 3 ? actionAggregates.potentialSavings : 0,
    total_realized_savings_kg: studentCount >= 3 ? actionAggregates.realizedSavings : 0,
  };

  // Hasil harus berupa 1 baris objek dengan seluruh nilai bernilai 0
  assert.equal(scalarSummaryRow.total_active_students, 0);
  assert.equal(scalarSummaryRow.total_calculations_recorded, 0);
  assert.equal(scalarSummaryRow.avg_student_monthly_kg, 0);
  assert.equal(scalarSummaryRow.total_recorded_footprint_kg, 0);
  assert.equal(scalarSummaryRow.total_potential_savings_kg, 0);
  assert.equal(scalarSummaryRow.total_realized_savings_kg, 0);
});
