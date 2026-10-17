# Panduan Database Migration - Karbon AI (CarbonAceh)

Dokumen ini menjelaskan arsitektur skema database, Row Level Security (RLS), dan mekanisme keamanan yang diterapkan pada proyek Supabase Karbon AI.

---

## 1. Lokasi File Migrasi

File migrasi database SQL berada di:
`supabase/migrations/20261016000000_create_karbon_ai_schema.sql`

> [!NOTE]
> File ini berstatus **lokal** dan belum dieksekusi di server Supabase remote Anda. Silakan ikuti petunjuk di Bagian 3 untuk menjalankannya.

---

## 2. Pembaruan & Fitur Keamanan Skema (Audit & Hardening)

Skema telah diaudit dan diperkuat dengan standar keamanan berikut:

### A. Tabel `public.profiles`
* **Relasi:** Terhubung langsung ke `auth.users(id)` dengan `ON DELETE CASCADE`.
* **Penanganan Email Aman:** Kolom `email` tidak dipaksa `NOT NULL` untuk mencegah kegagalan pembuatan akun jika pengguna mendaftar melalui metode autentikasi alternatif (misalnya nomor telepon, Google OAuth tanpa izin email, atau sesi anonim).
* **RLS:** Aktif. `REVOKE ALL FROM PUBLIC`, akses `SELECT`, `INSERT`, `UPDATE`, `DELETE` hanya diberikan kepada pengguna terotentikasi untuk baris miliknya sendiri (`auth.uid() = id`).
* **Trigger `handle_new_user()`:** Menggunakan `SECURITY DEFINER` dengan konfigurasi aman `SET search_path = ''` untuk mencegah eksploitasi *search path hijacking* (privilege escalation). Menggunakan ekspresi SQL standar `COALESCE` dan `NULLIF` serta alias tabel `AS p` pada klausa `ON CONFLICT DO UPDATE SET` untuk mencegah error nama kolom 3-bagian di PostgreSQL. Dilengkapi penanganan error dua tingkat (fallback profil minimal dan rollback transaksi via `RAISE EXCEPTION`) guna menjamin tidak pernah tercipta *orphan user* di `auth.users` tanpa profil di `public.profiles`.
* **Trigger `handle_updated_at()`:** Berjalan sebagai `SECURITY INVOKER` dengan `SET search_path = ''`. Izin `EXECUTE` diberikan secara eksplisit kepada role `authenticated` sehingga seluruh operasi pembaruan data pengguna berjalan tanpa hambatan izin eksekusi.

### B. Tabel `public.carbon_calculations`
* **Relasi:** Terhubung ke `public.profiles(id)` dengan `ON DELETE CASCADE`. Dilengkapi pengecekan constraint idempotensi `carbon_calculations_user_id_fkey`.
* **Struktur Data:** Menyimpan metrik numerik terindeks per sektor (`transport`, `energy`, `food`, `consumption`, `waste`) serta snapshot data input dan hasil kalkulasi ilmiah (`input_snapshot` dan `result_snapshot` JSONB).
* **RLS:** Aktif. `REVOKE ALL FROM PUBLIC`, hak `SELECT`, `INSERT`, `UPDATE`, `DELETE` hanya diberikan kepada pemilik data (`auth.uid() = user_id`). Pengguna anonim maupun pengguna lain tidak dapat membaca data ini.

### C. Tabel `public.green_action_commitments`
* **Pemisahan Potensi vs Realisasi:**
  * `potential_saving_kg`: Estimasi penurunan emisi bulanan jika aksi dijalankan.
  * `realized_saving_kg`: Penghematan emisi aktual yang sudah tercapai dan terverifikasi (hanya dihitung ketika `status = 'completed'`).
* **Status yang Didukung:** `'active'`, `'completed'`, `'paused'`, `'abandoned'`.
* **Constraint Unik:** `unique_user_action` mencegah satu pengguna mengambil komitmen yang sama secara duplikat (dilengkapi guard pengecekan constraint jika tabel sudah ada).
* **Migrasi Data Warisan:** Secara otomatis menyalin nilai dari kolom lama `saving_kg` ke `potential_saving_kg` jika skema lama ditemukan, tanpa menghapus data.
* **RLS:** Aktif. Dibatasi penuh untuk pemilik komitmen (`auth.uid() = user_id`).

### D. Analitik Komunitas, Privacy Threshold & Deduplikasi Emisi
* **Fungsi Agregat `get_community_impact_summary()`:**
  * Berjalan dengan `SECURITY DEFINER` dan `SET search_path = ''` dengan nama objek yang *fully-qualified* (`pg_catalog.*`, `public.*`) serta fungsi SQL standar `COALESCE`.
  * **Privacy Threshold Lengkap ($k \ge 3$ k-anonymity):** Jika jumlah mahasiswa aktif belum mencapai 3 orang, SELURUH metrik statistik (termasuk `total_active_students`) dimasking menjadi `0` untuk mencegah kebocoran *membership disclosure* maupun *differencing attack* pada kelompok kecil.
  * **Deduplikasi Bulanan (`DISTINCT ON`):** Jika seorang mahasiswa menghitung ulang jejak karbonnya beberapa kali dalam bulan yang sama (misalnya mencoba berbagai skenario di kalkulator), fungsi hanya menghitung **kalkulasi terakhir** untuk bulan tersebut, mencegah inflasi/penggandaan data jejak karbon komunitas.
  * **Pemisahan Penghematan:** Menghitung `total_potential_savings_kg` dari aksi aktif secara terpisah dari `total_realized_savings_kg` dari aksi yang telah selesai.
  * **Jaminan Satu Baris:** Menggunakan subquery skalar dan `COALESCE` sehingga dijamin selalu mengembalikan tepat 1 baris objek bahkan saat database belum memiliki data kalkulasi sama sekali.
* **View `public.community_impact_summary`:**
  * Dikonfigurasi dengan `WITH (security_invoker = true)` sesuai rekomendasi keamanan PostgreSQL 15+.
  * Didahului oleh `DROP VIEW IF EXISTS` dan `DROP FUNCTION IF EXISTS` non-destruktif untuk mencegah error inkompatibilitas kolom atau perubahan tipe kembalian fungsi (*cannot change return type of existing function*) pada database yang pernah memiliki versi sebelumnya.
  * Hanya mengembalikan satu baris statistik agregat angka murni tanpa pernah mengekspos ID pengguna, email, nama, maupun rincian pribadi mahasiswa.

### E. Idempotensi Non-Destruktif & Schema Hardening
* **Pencabutan Izin Pembuatan Objek:** Menjalankan `REVOKE CREATE ON SCHEMA public FROM PUBLIC;` untuk mencegah eskalasi privilege dan injection dari role tidak terpercaya.
* **Kompatibilitas Tabel yang Sudah Ada:** Menggunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` untuk setiap kolom, serta blok `DO $$` untuk foreign keys dan unique constraints sehingga aman dieksekusi tanpa menghapus tabel lama atau data pengguna (`DROP TABLE` tidak pernah digunakan).

---

## 3. Cara Menjalankan Migrasi ke Supabase

### Melalui Supabase Web Dashboard (Disarankan)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyek Anda.
2. Di bilah menu sebelah kiri, klik menu **SQL Editor**.
3. Klik tombol **New query**.
4. Buka file `supabase/migrations/20261016000000_create_karbon_ai_schema.sql`, salin seluruh kodenya, lalu tempelkan ke SQL Editor.
5. Klik tombol **Run** (atau tekan `Ctrl+Enter` / `Cmd+Enter`).
6. Pastikan muncul pesan sukses: `Success. No rows returned`.

---

## 4. Keterbatasan Pengujian Lokal (Test Limitations)

Unit test otomatis di `src/tests/supabase.test.ts` memverifikasi:
* Integritas aturan DDL SQL (keberadaan RLS, search_path protection, least privilege grants).
* Kontrak tipe TypeScript pada skema `Database`.
* Simulasi logika deduplikasi bulanan dan pemisahan penghematan aksi hijau.

**Keterbatasan:**
Karena pengujian lokal berjalan di Node.js tanpa instance daemon PostgreSQL aktif, penegakan isolasi baris oleh mesin kernel PostgreSQL (Row Level Security runtime) hanya dapat diuji secara aktual setelah skema di atas dieksekusi di database Supabase Anda.
