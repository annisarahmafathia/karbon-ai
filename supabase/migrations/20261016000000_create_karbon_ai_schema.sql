-- ==============================================================================
-- KARBONAI - Database Schema Migration (Audited & Hardened)
-- Target: Supabase PostgreSQL
-- Version: 20261016000000_create_karbon_ai_schema.sql
-- Description:
--   1. Profil Mahasiswa (public.profiles) terhubung dengan auth.users
--   2. Riwayat Perhitungan Jejak Karbon (public.carbon_calculations)
--   3. Komitmen Aksi Hijau (public.green_action_commitments)
--   4. Row Level Security (RLS) aktif dan diverifikasi pada seluruh tabel pengguna
--   5. Trigger registrasi dengan search_path aman (cegah privilege escalation)
--   6. Penanganan aman berbagai metode auth (email nullable/fallback)
--   7. Deduplikasi kalkulasi bulanan (cegah multiple counting pada bulan yang sama)
--   8. Pemisahan potensi penghematan (active) vs penghematan terealisasi (completed)
--   9. Privacy threshold (k-anonymity >= 3) pada statistik agregat komunitas
--  10. View analitik komunitas dengan security_invoker = true dan fungsi agregat terisolasi
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & SCHEMA HARDENING
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cabut hak CREATE pada schema public dari PUBLIC untuk mencegah pembuatan objek berbahaya
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Fungsi otomatis untuk memperbarui kolom updated_at.
-- SECURITY DEFINER dilepas karena fungsi ini cukup berjalan dengan hak pemanggil (SECURITY INVOKER)
-- dan search_path dikosongkan untuk mencegah search_path hijacking.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- Cabut hak eksekusi publik dari fungsi trigger (prinsip least privilege),
-- lalu beri izin eksplisit kepada authenticated agar dapat memicu trigger saat UPDATE.
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;

-- ------------------------------------------------------------------------------
-- 1. TABEL PROFIL MAHASISWA (public.profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- email dibuat opsional (nullable) untuk mendukung metode login tanpa email (telepon/anonim/OAuth)
  email TEXT,
  full_name TEXT,
  university TEXT DEFAULT 'Universitas Syiah Kuala',
  faculty TEXT,
  entry_year INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jaminan kompatibilitas skema jika tabel sudah ada sebelumnya (idempotent non-destruktif)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'Universitas Syiah Kuala';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS entry_year INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Jaminan foreign key jika tabel profiles lama belum memiliki relasi ke auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey' 
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index profil
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty ON public.profiles(faculty);

-- Trigger updated_at profil
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) - PROFIL
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke default privileges dari public untuk prinsip least privilege
REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Pengguna dapat membaca profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat membaca profil sendiri"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Pengguna dapat membuat profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat membuat profil sendiri"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat memperbarui profil sendiri"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Pengguna dapat menghapus profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat menghapus profil sendiri"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. TRIGGER REGISTRASI PENGGUNA BARU (auth.users -> public.profiles)
-- Diproteksi dengan SECURITY DEFINER dan search_path kosong (cegah privilege escalation).
-- Menggunakan fungsi SQL bawaan standar (COALESCE, NULLIF) tanpa prefix schema.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Ekstraksi email secara aman: mendukung email auth standar, OAuth metadata, atau fallback kosong
  v_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    ''
  );

  -- Ekstraksi nama lengkap dan avatar secara aman
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  -- Percobaan utama: Menyimpan profil lengkap beserta metadata pengguna
  BEGIN
    INSERT INTO public.profiles AS p (
      id,
      email,
      full_name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NULLIF(v_email, ''),
      NULLIF(v_full_name, ''),
      NULLIF(v_avatar_url, ''),
      pg_catalog.now(),
      pg_catalog.now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = CASE 
        WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email <> '' THEN EXCLUDED.email 
        ELSE p.email 
      END,
      full_name = COALESCE(EXCLUDED.full_name, p.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, p.avatar_url),
      updated_at = pg_catalog.now();

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Catat peringatan kegagalan ekstraksi metadata lengkap ke log server
      RAISE LOG 'handle_new_user: metadata insert error for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;

      -- Percobaan cadangan (resilient fallback): Buat baris profil minimal hanya dengan ID & email.
      -- Ini mencegah kegagalan pendaftaran hanya karena format metadata nama/avatar bermasalah.
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NULLIF(v_email, ''),
          pg_catalog.now(),
          pg_catalog.now()
        )
        ON CONFLICT (id) DO NOTHING;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- KEAMANAN TRANSAKSI INTEGRITAS:
          -- Jika bahkan pembuatan baris profil minimal gagal (misal disk penuh / koneksi database rusak),
          -- kita WAJIB melempar EXCEPTION agar transaksi pendaftaran auth.users dibatalkan (rollback).
          -- Jika dibiarkan sukses tanpa baris di public.profiles, akun tersebut akan menjadi "orphan"
          -- dan akan selalu gagal saat menyimpan kalkulasi karbon karena foreign key constraint.
          RAISE LOG 'handle_new_user fatal error: unable to create profile for user %: %', NEW.id, SQLERRM;
          RAISE EXCEPTION 'Registrasi gagal: sistem tidak dapat menginisialisasi profil akun (Error: %)', SQLERRM;
      END;
  END;
END;
$$;

-- Cabut hak eksekusi publik dari fungsi registrasi pengguna
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. TABEL RIWAYAT PERHITUNGAN KARBON (public.carbon_calculations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2024),

  -- Kolom numerik agregat untuk query analitik cepat & visualisasi grafik
  total_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (total_monthly_kg >= 0),
  total_yearly_kg NUMERIC(10, 2) NOT NULL CHECK (total_yearly_kg >= 0),
  transport_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (transport_monthly_kg >= 0),
  energy_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (energy_monthly_kg >= 0),
  food_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (food_monthly_kg >= 0),
  consumption_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (consumption_monthly_kg >= 0),
  waste_monthly_kg NUMERIC(10, 2) NOT NULL CHECK (waste_monthly_kg >= 0),
  highest_category TEXT NOT NULL CHECK (highest_category IN ('transportasi', 'energi', 'pangan', 'konsumsi', 'sampah')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),

  -- Snapshot terperinci data input & hasil untuk auditabilitas sains penuh
  input_snapshot JSONB NOT NULL,
  result_snapshot JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jaminan kompatibilitas skema jika tabel sudah ada sebelumnya (non-destruktif)
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS calculation_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS period_month INTEGER NOT NULL DEFAULT 10;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS period_year INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS total_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS total_yearly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS transport_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS energy_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS food_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS consumption_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS waste_monthly_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS highest_category TEXT NOT NULL DEFAULT 'transportasi';
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS confidence_score INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS result_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.carbon_calculations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Jaminan foreign key jika tabel carbon_calculations lama belum memiliki relasi ke profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'carbon_calculations_user_id_fkey' 
      AND conrelid = 'public.carbon_calculations'::regclass
  ) THEN
    ALTER TABLE public.carbon_calculations
      ADD CONSTRAINT carbon_calculations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index untuk pencarian riwayat efisien & deduplikasi cepat
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_user_id ON public.carbon_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_date ON public.carbon_calculations(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_dedup ON public.carbon_calculations(user_id, period_year DESC, period_month DESC, calculation_date DESC, created_at DESC);

-- Trigger updated_at kalkulasi
DROP TRIGGER IF EXISTS set_carbon_calculations_updated_at ON public.carbon_calculations;
CREATE TRIGGER set_carbon_calculations_updated_at
  BEFORE UPDATE ON public.carbon_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) - PERHITUNGAN KARBON
-- ------------------------------------------------------------------------------
ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.carbon_calculations FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carbon_calculations TO authenticated;

DROP POLICY IF EXISTS "Pengguna dapat membaca kalkulasi sendiri" ON public.carbon_calculations;
CREATE POLICY "Pengguna dapat membaca kalkulasi sendiri"
  ON public.carbon_calculations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat menyimpan kalkulasi sendiri" ON public.carbon_calculations;
CREATE POLICY "Pengguna dapat menyimpan kalkulasi sendiri"
  ON public.carbon_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat memperbarui kalkulasi sendiri" ON public.carbon_calculations;
CREATE POLICY "Pengguna dapat memperbarui kalkulasi sendiri"
  ON public.carbon_calculations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat menghapus kalkulasi sendiri" ON public.carbon_calculations;
CREATE POLICY "Pengguna dapat menghapus kalkulasi sendiri"
  ON public.carbon_calculations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. TABEL KOMITMEN AKSI HIJAU (public.green_action_commitments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.green_action_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transportasi', 'energi', 'pangan', 'konsumsi', 'sampah')),
  title TEXT NOT NULL,

  -- Potensi penghematan bulanan (jika aksi diterapkan)
  potential_saving_kg NUMERIC(10, 2) NOT NULL CHECK (potential_saving_kg >= 0),

  -- Penghematan aktual yang terealisasi (hanya dihitung ketika status 'completed')
  realized_saving_kg NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (realized_saving_kg >= 0),

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Mencegah duplikasi aksi yang sama pada satu pengguna
  CONSTRAINT unique_user_action UNIQUE (user_id, action_id)
);

-- Jaminan kompatibilitas skema jika tabel sudah ada dengan skema lama (non-destruktif)
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS potential_saving_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS realized_saving_kg NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.green_action_commitments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Jaminan foreign key jika tabel green_action_commitments lama belum memiliki relasi ke profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'green_action_commitments_user_id_fkey' 
      AND conrelid = 'public.green_action_commitments'::regclass
  ) THEN
    ALTER TABLE public.green_action_commitments
      ADD CONSTRAINT green_action_commitments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Jaminan unique constraint (user_id, action_id) jika belum ada di skema lama
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_action' 
      AND conrelid = 'public.green_action_commitments'::regclass
  ) THEN
    ALTER TABLE public.green_action_commitments 
      ADD CONSTRAINT unique_user_action UNIQUE (user_id, action_id);
  END IF;
END $$;

-- Migrasi data aman: Jika kolom lama 'saving_kg' ada dari versi awal,
-- salin nilainya ke 'potential_saving_kg' tanpa menghapus kolom lama atau membuang data yang ada.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'green_action_commitments' 
      AND column_name = 'saving_kg'
  ) THEN
    UPDATE public.green_action_commitments
    SET potential_saving_kg = saving_kg
    WHERE (potential_saving_kg IS NULL OR potential_saving_kg = 0)
      AND saving_kg IS NOT NULL 
      AND saving_kg > 0;
  END IF;
END $$;

-- Index komitmen aksi hijau
CREATE INDEX IF NOT EXISTS idx_green_actions_user_id ON public.green_action_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_green_actions_status ON public.green_action_commitments(status);
CREATE INDEX IF NOT EXISTS idx_green_actions_category ON public.green_action_commitments(category);

-- Trigger updated_at komitmen
DROP TRIGGER IF EXISTS set_green_action_commitments_updated_at ON public.green_action_commitments;
CREATE TRIGGER set_green_action_commitments_updated_at
  BEFORE UPDATE ON public.green_action_commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) - KOMITMEN AKSI HIJAU
-- ------------------------------------------------------------------------------
ALTER TABLE public.green_action_commitments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.green_action_commitments FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.green_action_commitments TO authenticated;

DROP POLICY IF EXISTS "Pengguna dapat membaca komitmen aksi sendiri" ON public.green_action_commitments;
CREATE POLICY "Pengguna dapat membaca komitmen aksi sendiri"
  ON public.green_action_commitments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat menambah komitmen aksi sendiri" ON public.green_action_commitments;
CREATE POLICY "Pengguna dapat menambah komitmen aksi sendiri"
  ON public.green_action_commitments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat memperbarui status komitmen aksi sendiri" ON public.green_action_commitments;
CREATE POLICY "Pengguna dapat memperbarui status komitmen aksi sendiri"
  ON public.green_action_commitments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat menghapus komitmen aksi sendiri" ON public.green_action_commitments;
CREATE POLICY "Pengguna dapat menghapus komitmen aksi sendiri"
  ON public.green_action_commitments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. FUNGSI AGREGAT ANALITIK KOMUNITAS DENGAN PRIVACY THRESHOLD & PEMISAHAN REALISASI
-- ------------------------------------------------------------------------------
-- Hapus view dan fungsi lama secara berurutan dan non-destruktif jika pernah ada versi sebelumnya.
-- Ini mencegah error PostgreSQL: "cannot change return type of existing function" atau dependensi view.
DROP VIEW IF EXISTS public.community_impact_summary;
DROP FUNCTION IF EXISTS public.get_community_impact_summary();

-- Fungsi ini berjalan dengan SECURITY DEFINER dan search_path kosong untuk mengagregasikan
-- data tanpa pernah membocorkan baris mentah (raw user records/PII) ke publik.
CREATE OR REPLACE FUNCTION public.get_community_impact_summary()
RETURNS TABLE (
  total_active_students BIGINT,
  total_calculations_recorded BIGINT,
  avg_student_monthly_kg NUMERIC,
  total_recorded_footprint_kg NUMERIC,
  total_potential_savings_kg NUMERIC,
  total_realized_savings_kg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH latest_monthly_calculations AS (
    -- DEDUPLIKASI: Mengambil kalkulasi terakhir per mahasiswa per bulan/tahun
    -- untuk mencegah penghitungan berulang jika mahasiswa menghitung beberapa kali dalam sebulan.
    SELECT DISTINCT ON (c.user_id, c.period_year, c.period_month)
      c.id,
      c.user_id,
      c.period_month,
      c.period_year,
      c.total_monthly_kg
    FROM public.carbon_calculations c
    ORDER BY c.user_id, c.period_year DESC, c.period_month DESC, c.calculation_date DESC, c.created_at DESC
  ),
  raw_stats AS (
    SELECT
      COALESCE((SELECT pg_catalog.count(DISTINCT l.user_id)::BIGINT FROM latest_monthly_calculations l), 0::BIGINT) AS student_count,
      COALESCE((SELECT pg_catalog.count(l.id)::BIGINT FROM latest_monthly_calculations l), 0::BIGINT) AS calc_count,
      COALESCE((SELECT pg_catalog.round(pg_catalog.avg(l.total_monthly_kg), 1)::NUMERIC FROM latest_monthly_calculations l), 0::NUMERIC) AS avg_monthly_kg,
      COALESCE((SELECT pg_catalog.sum(l.total_monthly_kg)::NUMERIC FROM latest_monthly_calculations l), 0::NUMERIC) AS sum_monthly_kg
  ),
  action_aggregates AS (
    -- PEMISAHAN ILMIAH:
    -- 1. potential_savings: Potensi penurunan emisi dari komitmen aktif (belum terealisasi penuh)
    -- 2. realized_savings: Penghematan emisi aktual dari aksi yang telah diselesaikan (completed)
    SELECT
      COALESCE(pg_catalog.sum(CASE WHEN a.status = 'active' THEN a.potential_saving_kg ELSE 0 END), 0) AS potential_savings,
      COALESCE(pg_catalog.sum(CASE WHEN a.status = 'completed' THEN a.realized_saving_kg ELSE 0 END), 0) AS realized_savings
    FROM public.green_action_commitments a
  )
  -- PRIVACY THRESHOLD LENGKAP (k-anonymity >= 3):
  -- Jika jumlah mahasiswa aktif belum mencapai 3 (0, 1, atau 2), SELURUH nilai statistik agregat
  -- termasuk total_active_students dimasking menjadi 0.
  -- Ini sepenuhnya mencegah membership disclosure (mengetahui ada 1 atau 2 orang yang bergabung)
  -- serta differencing attack untuk merekonstruksi data individu pada kelompok kecil.
  SELECT
    CASE 
      WHEN s.student_count >= 3 THEN s.student_count 
      ELSE 0::BIGINT 
    END AS total_active_students,
    CASE 
      WHEN s.student_count >= 3 THEN s.calc_count 
      ELSE 0::BIGINT 
    END AS total_calculations_recorded,
    CASE 
      WHEN s.student_count >= 3 THEN s.avg_monthly_kg 
      ELSE 0::NUMERIC 
    END AS avg_student_monthly_kg,
    CASE 
      WHEN s.student_count >= 3 THEN s.sum_monthly_kg 
      ELSE 0::NUMERIC 
    END AS total_recorded_footprint_kg,
    CASE 
      WHEN s.student_count >= 3 THEN act.potential_savings::NUMERIC 
      ELSE 0::NUMERIC 
    END AS total_potential_savings_kg,
    CASE 
      WHEN s.student_count >= 3 THEN act.realized_savings::NUMERIC 
      ELSE 0::NUMERIC 
    END AS total_realized_savings_kg
  FROM raw_stats s
  CROSS JOIN action_aggregates act;
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. VIEW ANALITIK DAMPAK KOMUNITAS (SECURITY INVOKER)
-- ------------------------------------------------------------------------------
-- View menggunakan klausa WITH (security_invoker = true) untuk mematuhi standar PostgreSQL 15+
-- dan memanggil fungsi get_community_impact_summary() yang mengembalikan satu baris agregat anonim.
CREATE VIEW public.community_impact_summary
WITH (security_invoker = true)
AS
SELECT * FROM public.get_community_impact_summary();

-- Izin akses view dan fungsi agregat untuk peran anon dan authenticated
REVOKE ALL ON FUNCTION public.get_community_impact_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_community_impact_summary() TO anon, authenticated;

REVOKE ALL ON public.community_impact_summary FROM PUBLIC;
GRANT SELECT ON public.community_impact_summary TO anon, authenticated;

