import { CalculationResult, CategoryResult } from "@/types/carbon";
import { CarbonCategoryType } from "@/types/database";

export const CATEGORY_LABELS: Record<CarbonCategoryType, string> = {
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

function isCategoryResult(value: unknown): value is CategoryResult {
  if (!value || typeof value !== "object") return false;
  const category = value as CategoryResult;
  return typeof category.monthlyKgCO2e === "number" && typeof category.label === "string";
}

export function parseResultSnapshot(value: unknown): CalculationResult | null {
  if (!value || typeof value !== "object") return null;

  const result = value as CalculationResult;
  if (
    typeof result.totalMonthlyKgCO2e !== "number" ||
    !result.categories ||
    !isCategoryResult(result.categories.transportasi) ||
    !isCategoryResult(result.categories.energi) ||
    !isCategoryResult(result.categories.pangan) ||
    !isCategoryResult(result.categories.konsumsi) ||
    !isCategoryResult(result.categories.sampah)
  ) {
    return null;
  }

  return result;
}
