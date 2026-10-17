
-- Menghapus index dan kolom informasi kampus yang tidak lagi digunakan.

BEGIN;

DROP INDEX IF EXISTS public.idx_profiles_university;
DROP INDEX IF EXISTS public.idx_profiles_faculty;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS university,
  DROP COLUMN IF EXISTS faculty,
  DROP COLUMN IF EXISTS entry_year;

COMMIT;
