import { CategoryResult, PlasticCategory } from "../../types/carbon";
import { PLASTIC_EMISSION_FACTORS } from "../constants/emission-factors";

/**
 * Validasi dan sanitasi input jumlah barang baru:
 * Memastikan nilai berupa bilangan bulat (integer) nonnegatif.
 * Nilai negatif, kosong, NaN, atau float dikonversi secara aman.
 */
export function sanitizeItemCount(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num) || num < 0) return 0;
  return Math.floor(num);
}

/**
 * Hitung emisi untuk satu kategori plastik sekali pakai:
 * Emisi (kg CO₂e/minggu) = jumlah barang baru per minggu × faktor emisi per barang.
 *
 * Catatan penting:
 * - Yang dihitung HANYA jumlah barang plastik baru yang masuk/digunakan dalam minggu tersebut.
 * - Penggunaan ulang barang yang sama tidak menambah barang baru.
 */
export function calculateCategoryEmission(
  category: PlasticCategory,
  rawCount: unknown
): CategoryResult {
  const meta = PLASTIC_EMISSION_FACTORS[category];
  const itemCount = sanitizeItemCount(rawCount);

  // Rumus dasar: jumlah barang baru × faktor emisi per barang
  const rawWeeklyKg = itemCount * meta.value;
  // Dibulatkan ke 3 desimal untuk presisi yang realistis pada skala mingguan
  const weeklyKgCO2e = Math.round(rawWeeklyKg * 1000) / 1000;

  // Konversi periode lain dengan asumsi konsisten:
  // - 1 tahun = 52 minggu
  // - 1 bulan = 52 / 12 minggu (~4.333 minggu)
  const yearlyKgCO2e = Math.round(weeklyKgCO2e * 52 * 100) / 100;
  const monthlyKgCO2e = Math.round((yearlyKgCO2e / 12) * 100) / 100;

  let explanation = "";
  switch (category) {
    case "kantong_plastik":
      explanation =
        itemCount === 0
          ? "Kamu tidak menggunakan kantong kresek baru minggu ini. Kebiasaan membawa tas belanja reusable sangat efektif mencegah timbulan sampah plastik."
          : `Penggunaan ${itemCount} kantong kresek baru menghasilkan ~${weeklyKgCO2e} kg CO₂e/minggu. Menggunakan kantong kain berulang kali dapat meniadakan emisi ini.`;
      break;
    case "wadah_makanan":
      explanation =
        itemCount === 0
          ? "Bebas wadah makanan plastik sekali pakai minggu ini. Pilihan makan di tempat atau membawa wadah sendiri menjaga lingkungan dari sampah thinwall/mika."
          : `Penggunaan ${itemCount} kotak makanan plastik sekali pakai menghasilkan ~${weeklyKgCO2e} kg CO₂e/minggu. Wadah plastik kaku memiliki massa resin lebih besar sehingga emisinya cukup signifikan.`;
      break;
    case "botol_minum":
      explanation =
        itemCount === 0
          ? "Nol botol minuman plastik sekali pakai baru minggu ini. Menggunakan tumbler atau botol isi ulang adalah langkah paling efektif memangkas limbah PET."
          : `Penggunaan ${itemCount} botol air mineral/minuman sekali pakai menghasilkan ~${weeklyKgCO2e} kg CO₂e/minggu. Botol yang sama jika diisi ulang tidak dihitung sebagai botol baru tambahan.`;
      break;
    case "wadah_styrofoam":
      explanation =
        itemCount === 0
          ? "Hebat! Kamu tidak menggunakan wadah styrofoam minggu ini. Menghindari styrofoam melindungi ekosistem dari material yang tidak dapat terurai secara alami."
          : `Penggunaan ${itemCount} wadah styrofoam menghasilkan ~${weeklyKgCO2e} kg CO₂e/minggu. Styrofoam sangat ringan namun sulit didaur ulang dan memicu emisi saat dibakar atau ditimbun di TPA.`;
      break;
  }

  return {
    category,
    label: meta.name,
    itemCountPerWeek: itemCount,
    emissionFactor: meta.value,
    weeklyKgCO2e,
    monthlyKgCO2e,
    yearlyKgCO2e,
    percentage: 0, // Akan dihitung oleh engine saat agregasi total
    details: [
      {
        item: meta.name,
        activityValue: `${itemCount} buah / minggu`,
        factorUsed: `${meta.value} kg CO₂e / buah`,
        subtotalKgCO2e: weeklyKgCO2e,
        source: meta.source,
        uncertainty: meta.uncertainty,
        verificationStatus: meta.verificationStatus,
        activityUnit: meta.activityUnit,
        materialMassGrams: meta.materialMassGrams,
        systemBoundary: meta.systemBoundary,
        limitations: meta.limitations,
      },
    ],
    explanation,
  };
}
