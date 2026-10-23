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

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Menghitung batas awal (Senin) dan akhir (Minggu) dari suatu tanggal kalender.
 */
export function getWeekBounds(dateInput: Date | string): {
  start: Date;
  end: Date;
  key: string;
} {
  const d = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput.getTime());

  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return getWeekBounds(now);
  }

  // Normalisasi waktu ke awal hari
  d.setHours(0, 0, 0, 0);

  // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const day = d.getDay();
  // Selisih hari menuju Senin (awal minggu)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const dateNum = String(monday.getDate()).padStart(2, "0");
  const key = `${y}-${m}-${dateNum}`;

  return { start: monday, end: sunday, key };
}

/**
 * Format rentang tanggal mingguan ke format ringkas bahasa Indonesia (contoh: "5–11 Okt", "19–25 Okt").
 */
export function formatWeekRangeLabel(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = SHORT_MONTHS[startDate.getMonth()];
  const endMonth = SHORT_MONTHS[endDate.getMonth()];

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export interface YAxisScaleResult {
  yAxisMax: number;
  yAxisMid: number;
}

/**
 * Menghitung skala sumbu Y secara otomatis berdasarkan nilai emisi tertinggi
 * dengan ruang yang cukup (headroom sekitar 20%-25%) agar batang tertinggi
 * dan label nilai emisi di atasnya tidak terpotong atau keluar dari area grafik.
 * Menghasilkan angka skala yang rapi (clean round step) untuk kemudahan pembacaan.
 */
export function calculateYAxisScale(peakEmission: number): YAxisScaleResult {
  const safePeak =
    typeof peakEmission === "number" && Number.isFinite(peakEmission)
      ? Math.max(0, peakEmission)
      : 0;

  // Jika emisi 0 atau belum ada data: skala default yang bersih
  if (safePeak <= 0) {
    return { yAxisMax: 1.0, yAxisMid: 0.5 };
  }

  // Berikan ruang sekitar 25% di atas nilai tertinggi agar batang dan label tidak terpotong
  const targetMax = safePeak * 1.25;

  // Tentukan kelipatan step yang rapi berdasarkan magnitude
  let step: number;
  if (targetMax <= 1.0) {
    step = 0.2;
  } else if (targetMax <= 2.5) {
    step = 0.5;
  } else if (targetMax <= 5.0) {
    step = 1.0;
  } else if (targetMax <= 10.0) {
    step = 2.0;
  } else if (targetMax <= 25.0) {
    step = 5.0;
  } else if (targetMax <= 50.0) {
    step = 10.0;
  } else {
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetMax)));
    step = Math.ceil(targetMax / (magnitude * 5)) * (magnitude / 2);
    if (step <= 0) step = 10;
  }

  const rawMax = Math.ceil(targetMax / step) * step;
  const safeMax = Math.max(rawMax, safePeak + 0.1);
  const yAxisMax = Number(safeMax.toFixed(2));
  const yAxisMid = Number((yAxisMax / 2).toFixed(2));

  return { yAxisMax, yAxisMid };
}

export interface BarHeightResult {
  emission: number;
  isZero: boolean;
  heightPercent: number;
  minHeightPx?: number;
}

/**
 * Menghitung tinggi batang diagram mingguan secara proporsional.
 * - Jika emisi 0: isZero bernilai true, heightPercent 0 (tidak membuat emisi palsu).
 * - Jika emisi positif kecil: diberikan batas tinggi minimum wajar (6% dan min 8px) agar tetap terlihat jelas.
 * - Jika emisi normal: proporsional terhadap maxEmission (hingga 100%).
 */
export function calculateBarHeight(
  emission: number,
  maxEmission: number
): BarHeightResult {
  const safeEmission =
    typeof emission === "number" && Number.isFinite(emission)
      ? Math.max(0, emission)
      : 0;
  const safeMax =
    typeof maxEmission === "number" && Number.isFinite(maxEmission) && maxEmission > 0
      ? maxEmission
      : 1.0;

  if (safeEmission === 0) {
    return {
      emission: 0,
      isZero: true,
      heightPercent: 0,
    };
  }

  // Hitung persentase proporsional terhadap nilai maksimum grafik
  const proportional = (safeEmission / safeMax) * 100;

  // Nilai positif kecil tetap diberikan tinggi minimum (6%) agar terlihat jelas
  const heightPercent = Math.min(100, Math.max(proportional, 6));

  return {
    emission: safeEmission,
    isZero: false,
    heightPercent,
    minHeightPx: 8,
  };
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
