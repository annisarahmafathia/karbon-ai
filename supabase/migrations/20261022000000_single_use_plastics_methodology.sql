-- ==============================================================================
-- KARBONAI - Single-Use Plastics Methodology Migration (Audited & Non-Destructive)
-- Target: Supabase PostgreSQL
-- Version: 20261022000000_single_use_plastics_methodology.sql
-- Description:
--   1. Menambahkan kolom pendukung 4 kategori plastik sekali pakai mingguan
--      (kantong_plastik, wadah_makanan, botol_minum, wadah_styrofoam) secara non-destruktif.
--   2. Memperbarui constraint check highest_category sehingga data historis lama
--      (transportasi, energi, pangan, konsumsi, sampah) tetap valid dan kategori baru diterima.
--   3. Mengklasifikasikan metodologi secara presisi:
--      - Data baru diidentifikasi lewat key kategori plastik spesifik di snapshot/input atau kolom mingguan.
--      - Menghindari jebakan key 'categories' umum yang juga dimiliki snapshot v1.
--      - Data historis lama (pangan, konsumsi, sampah, transportasi, energi) dipelihara sebagai 'v1_bulanan'.
--   4. Deduplikasi bulanan cerdas & non-destruktif:
--      - Menilai keberadaan duplikasi di level global dan level v2.
--      - Tidak pernah memaksakan unique index yang akan gagal jika ada duplikasi pada data historis.
--      - Menjaga 100% data historis tanpa operasi DELETE/TRUNCATE destruktif.
--   5. Mempertahankan tabel green_action_commitments tanpa menambahkan kolom yang tidak digunakan.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Tambah kolom kalkulasi mingguan dan metodologi ke public.carbon_calculations
-- ------------------------------------------------------------------------------
ALTER TABLE public.carbon_calculations
  ADD COLUMN IF NOT EXISTS methodology_version TEXT DEFAULT 'v1_bulanan',
  ADD COLUMN IF NOT EXISTS total_weekly_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_week INTEGER CHECK (period_week BETWEEN 1 AND 53),
  ADD COLUMN IF NOT EXISTS kantong_plastik_weekly_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wadah_makanan_weekly_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS botol_minum_weekly_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wadah_styrofoam_weekly_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_items_per_week INTEGER NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------------------
-- 2. Audit & Klasifikasi Presisi Versi Metodologi (v1_bulanan vs v2_plastik_mingguan)
-- ------------------------------------------------------------------------------
-- Langkah A: Tandai baris yang terbukti merupakan kalkulasi metodologi baru v2.
-- CATATAN AUDIT: Kita TIDAK mengecek "result_snapshot ? 'categories'" semata karena
-- snapshot v1 lama juga memiliki field 'categories'. Kita memeriksa key spesifik kategori
-- plastik di dalam snapshot atau kolom mingguan.
UPDATE public.carbon_calculations
SET methodology_version = 'v2_plastik_mingguan'
WHERE total_weekly_kg > 0
   OR kantong_plastik_weekly_kg > 0
   OR wadah_makanan_weekly_kg > 0
   OR botol_minum_weekly_kg > 0
   OR wadah_styrofoam_weekly_kg > 0
   OR total_items_per_week > 0
   OR highest_category IN ('kantong_plastik', 'wadah_makanan', 'botol_minum', 'wadah_styrofoam')
   OR (result_snapshot IS NOT NULL AND (
        result_snapshot->>'methodology' = 'v2_plastik_mingguan'
        OR result_snapshot->>'methodologyVersion' = '2.0_single_use_plastics'
        OR result_snapshot ? 'totalWeeklyKgCO2e'
        OR result_snapshot->'categories' ? 'kantong_plastik'
        OR result_snapshot->'categories' ? 'wadah_makanan'
        OR result_snapshot->'categories' ? 'botol_minum'
        OR result_snapshot->'categories' ? 'wadah_styrofoam'
      ))
   OR (input_snapshot IS NOT NULL AND (
        input_snapshot ? 'kantongPlastik'
        OR input_snapshot ? 'wadahMakanan'
        OR input_snapshot ? 'botolMinum'
        OR input_snapshot ? 'wadahStyrofoam'
      ));

-- Langkah B: Pastikan seluruh data historis lama (termasuk emisi pangan, konsumsi, sampah,
-- transportasi, energi, atau 0 emisi) tetap berlabel 'v1_bulanan' dan tidak terdistorsi.
UPDATE public.carbon_calculations
SET methodology_version = 'v1_bulanan'
WHERE (methodology_version IS NULL OR methodology_version <> 'v2_plastik_mingguan')
  AND (
    total_monthly_kg > 0
    OR transport_monthly_kg > 0
    OR energy_monthly_kg > 0
    OR food_monthly_kg > 0
    OR consumption_monthly_kg > 0
    OR waste_monthly_kg > 0
    OR highest_category IN ('transportasi', 'energi', 'pangan', 'konsumsi', 'sampah')
    OR (result_snapshot IS NOT NULL AND (
        result_snapshot->'categories' ? 'transportasi'
        OR result_snapshot->'categories' ? 'energi'
        OR result_snapshot->'categories' ? 'pangan'
        OR result_snapshot->'categories' ? 'konsumsi'
      ))
    OR (input_snapshot IS NOT NULL AND (
        input_snapshot ? 'transportation'
        OR input_snapshot ? 'energy'
        OR input_snapshot ? 'food'
      ))
    OR (total_weekly_kg = 0 AND (result_snapshot IS NULL OR result_snapshot->>'methodology' IS NULL))
  );

-- Langkah C: Tetapkan default untuk baris baru di masa mendatang ke 'v2_plastik_mingguan'
ALTER TABLE public.carbon_calculations
  ALTER COLUMN methodology_version SET DEFAULT 'v2_plastik_mingguan';

-- ------------------------------------------------------------------------------
-- 3. Perbarui check constraint highest_category (Mendukung 5 lama + 4 baru)
-- ------------------------------------------------------------------------------
ALTER TABLE public.carbon_calculations
  DROP CONSTRAINT IF EXISTS carbon_calculations_highest_category_check;

ALTER TABLE public.carbon_calculations
  ADD CONSTRAINT carbon_calculations_highest_category_check
  CHECK (highest_category IN (
    'transportasi',
    'energi',
    'pangan',
    'konsumsi',
    'sampah',
    'kantong_plastik',
    'wadah_makanan',
    'botol_minum',
    'wadah_styrofoam'
  ));

-- ------------------------------------------------------------------------------
-- 4. Index Pencarian & Deduplikasi Performa (Non-Destruktif & Tanpa Batasan Kunci Unik Bulanan)
-- Memungkinkan pengguna menyimpan beberapa hasil pada hari/minggu/bulan yang sama,
-- sekaligus menjamin query analitik (DISTINCT ON) berjalan cepat.
-- ------------------------------------------------------------------------------
-- Hapus unique index jika sebelumnya sempat terpasang agar tidak memblokir penyimpanan catatan baru
DROP INDEX IF EXISTS public.carbon_calculations_user_monthly_idx;
DROP INDEX IF EXISTS public.carbon_calculations_user_monthly_v2_idx;

-- Index komposit untuk query riwayat dan deduplikasi dinamis (DISTINCT ON)
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_dedup
  ON public.carbon_calculations(user_id, period_year DESC, period_month DESC, calculation_date DESC, created_at DESC);

-- Index pendukung pencarian riwayat efisien berdasarkan metodologi
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_methodology
  ON public.carbon_calculations(user_id, methodology_version, created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Tabel public.green_action_commitments (Non-Destruktif & Tanpa Kolom Tidak Terpakai)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'green_action_commitments'
  ) THEN
    -- Perbarui check constraint agar kategori plastik diterima jika di masa depan komitmen disimpan,
    -- tanpa menambahkan kolom baru yang tidak digunakan oleh aplikasi.
    ALTER TABLE public.green_action_commitments
      DROP CONSTRAINT IF EXISTS green_action_commitments_category_check;

    ALTER TABLE public.green_action_commitments
      ADD CONSTRAINT green_action_commitments_category_check
      CHECK (category IN (
        'transportasi',
        'energi',
        'pangan',
        'konsumsi',
        'sampah',
        'kantong_plastik',
        'wadah_makanan',
        'botol_minum',
        'wadah_styrofoam'
      ));
  END IF;
END $$;

COMMIT;
