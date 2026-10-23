import { PlasticCalculatorInput } from "../../types/carbon";
import { sanitizeItemCount } from "../calculator/plastic";

/**
 * Nilai default formulir kalkulator jejak karbon plastik sekali pakai.
 * Seluruh kategori bernilai awal 0 buah/minggu sesuai instruksi.
 */
export const DEFAULT_CALCULATOR_INPUT: PlasticCalculatorInput = {
  kantongPlastik: 0,
  wadahMakanan: 0,
  botolMinum: 0,
  wadahStyrofoam: 0,
};

// Profil Contoh 1: Mahasiswa Ramah Lingkungan (Zero Single-Use Plastic)
export const ARCHETYPE_ZERO_WASTE: PlasticCalculatorInput = {
  kantongPlastik: 0,
  wadahMakanan: 0,
  botolMinum: 0,
  wadahStyrofoam: 0,
};

// Profil Contoh 2: Mahasiswa Penggunaan Rata-rata Mingguan
export const ARCHETYPE_MODERAT: PlasticCalculatorInput = {
  kantongPlastik: 5,
  wadahMakanan: 4,
  botolMinum: 5,
  wadahStyrofoam: 2,
};

// Profil Contoh 3: Mahasiswa Ketergantungan Plastik Tinggi
export const ARCHETYPE_TINGGI: PlasticCalculatorInput = {
  kantongPlastik: 14,
  wadahMakanan: 10,
  botolMinum: 12,
  wadahStyrofoam: 6,
};

/**
 * Sanitasi dan validasi input pengguna untuk memastikan integritas data:
 * - Hanya menerima angka bulat nonnegatif (non-negative integer).
 * - Menangani input kosong, null, undefined, string, NaN, dan bilangan negatif.
 * - Membatasi nilai maksimum ke 1000 buah/minggu untuk mencegah overflow.
 */
export function sanitizeCalculatorInput(
  input: Partial<PlasticCalculatorInput> | null | undefined
): PlasticCalculatorInput {
  const clampInt = (value: unknown): number => {
    const sanitized = sanitizeItemCount(value);
    return Math.min(1000, sanitized);
  };

  return {
    kantongPlastik: clampInt(input?.kantongPlastik),
    wadahMakanan: clampInt(input?.wadahMakanan),
    botolMinum: clampInt(input?.botolMinum),
    wadahStyrofoam: clampInt(input?.wadahStyrofoam),
  };
}
