import {
  CalculationResult,
  CategoryResult,
  LegacyCalculationResult,
  LegacyCategoryResult,
  CarbonCategoryType,
} from "@/types/carbon";

export const CATEGORY_LABELS: Record<CarbonCategoryType, string> = {
  // Empat Kategori Baru (Plastik Sekali Pakai)
  kantong_plastik: "Kantong Plastik",
  wadah_makanan: "Wadah Makanan Plastik",
  botol_minum: "Botol Minum Plastik",
  wadah_styrofoam: "Wadah Styrofoam",
  // Kategori Historis Lama (v1_bulanan)
  transportasi: "Transportasi",
  energi: "Energi",
  pangan: "Pangan",
  konsumsi: "Konsumsi",
  sampah: "Sampah",
};

export function formatCalculationDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isPlasticCategoryResult(value: unknown): value is CategoryResult {
  if (!value || typeof value !== "object") return false;
  const category = value as CategoryResult;
  return (
    typeof category.weeklyKgCO2e === "number" &&
    typeof category.label === "string" &&
    typeof category.itemCountPerWeek === "number"
  );
}

function isLegacyCategoryResult(value: unknown): value is LegacyCategoryResult {
  if (!value || typeof value !== "object") return false;
  const category = value as LegacyCategoryResult;
  return (
    typeof category.monthlyKgCO2e === "number" &&
    typeof category.label === "string"
  );
}

export function isPlasticCalculationResult(
  result: unknown
): result is CalculationResult {
  if (!result || typeof result !== "object") return false;
  const res = result as CalculationResult;
  return (
    (res.methodology === "v2_plastik_mingguan" || typeof res.totalWeeklyKgCO2e === "number") &&
    Boolean(res.categories) &&
    isPlasticCategoryResult(res.categories?.kantong_plastik) &&
    isPlasticCategoryResult(res.categories?.wadah_makanan) &&
    isPlasticCategoryResult(res.categories?.botol_minum) &&
    isPlasticCategoryResult(res.categories?.wadah_styrofoam)
  );
}

export function isLegacyCalculationResult(
  result: unknown
): result is LegacyCalculationResult {
  if (!result || typeof result !== "object") return false;
  const res = result as LegacyCalculationResult;
  return (
    typeof res.totalMonthlyKgCO2e === "number" &&
    Boolean(res.categories) &&
    isLegacyCategoryResult(res.categories?.transportasi) &&
    isLegacyCategoryResult(res.categories?.energi) &&
    isLegacyCategoryResult(res.categories?.pangan) &&
    isLegacyCategoryResult(res.categories?.konsumsi) &&
    isLegacyCategoryResult(res.categories?.sampah)
  );
}

/**
 * Membaca snapshot hasil kalkulasi secara aman:
 * Mendukung format baru (v2_plastik_mingguan) maupun format historis lama (v1_bulanan).
 */
export function parseResultSnapshot(
  value: unknown
): CalculationResult | LegacyCalculationResult | null {
  if (!value || typeof value !== "object") return null;

  if (isPlasticCalculationResult(value)) {
    return value;
  }

  if (isLegacyCalculationResult(value)) {
    return value;
  }

  return null;
}
