-- ==============================================================================
-- KARBONAI - Weekly Email Reminders Migration (Audited & Non-Destructive)
-- Target: Supabase PostgreSQL
-- Version: 20261023000000_weekly_email_reminders.sql
-- Description:
--   1. Menambahkan kolom preferensi notifikasi email mingguan pada public.profiles.
--   2. Menyimpan waktu pengiriman terakhir dan ID kalkulasi yang sudah diingatkan
--      untuk menjamin idempotensi (siklus 7 hari setelah kalkulasi terakhir disimpan).
--   3. Membuat tabel notification_logs untuk mencatat riwayat pengiriman email.
--   4. Mengaktifkan Row Level Security (RLS) pada notification_logs.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Tambah kolom pengaturan notifikasi ke public.profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_notified_calculation_id UUID REFERENCES public.carbon_calculations(id) ON DELETE SET NULL;

-- Index untuk filter cepat pengguna dengan notifikasi aktif
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications
  ON public.profiles(email_notifications_enabled)
  WHERE (email_notifications_enabled = true);

-- ------------------------------------------------------------------------------
-- 2. Buat tabel notification_logs untuk mencatat audit pengiriman email
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES public.carbon_calculations(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'weekly_reminder',
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
  provider_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jaminan kompatibilitas skema jika tabel notification_logs sudah dibuat sebelumnya tanpa kolom provider_id
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Index untuk pencarian log berdasarkan pengguna dan kalkulasi
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id
  ON public.notification_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_calc_id
  ON public.notification_logs(calculation_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
  ON public.notification_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_provider_id
  ON public.notification_logs(provider_id);

-- ------------------------------------------------------------------------------
-- 3. Row Level Security (RLS) untuk notification_logs
-- ------------------------------------------------------------------------------
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notification_logs FROM PUBLIC;
GRANT SELECT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

DROP POLICY IF EXISTS "Pengguna dapat membaca log notifikasi sendiri" ON public.notification_logs;
CREATE POLICY "Pengguna dapat membaca log notifikasi sendiri"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
