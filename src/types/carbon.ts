export type PlasticCategory =
  | "kantong_plastik"
  | "wadah_makanan"
  | "botol_minum"
  | "wadah_styrofoam";

export type LegacyCategory =
  | "transportasi"
  | "energi"
  | "pangan"
  | "konsumsi"
  | "sampah";

export type CarbonCategoryType = PlasticCategory | LegacyCategory;

export interface PlasticCalculatorInput {
  kantongPlastik: number; // buah kantong plastik sekali pakai baru per minggu
  wadahMakanan: number; // buah wadah makanan plastik sekali pakai baru per minggu
  botolMinum: number; // buah botol minuman plastik sekali pakai baru per minggu
  wadahStyrofoam: number; // buah wadah styrofoam sekali pakai baru per minggu
}

// UserCalculatorInput sekarang menggunakan PlasticCalculatorInput untuk metodologi baru
export type UserCalculatorInput = PlasticCalculatorInput;

export type VerificationTier =
  | "Terverifikasi Resmi"
  | "Estimasi Literatur Ilmiah"
  | "Provisional (Perlu Riset Lokal)";

export interface EmissionFactorMeta {
  id: string;
  name: string;
  category: CarbonCategoryType;
  value: number; // Nilai numerik faktor emisi (kg CO₂e / unit)
  unit: string; // Satuan faktor emisi (e.g. "kg CO₂e / buah")
  activityUnit: string; // Satuan aktivitas (e.g. "buah / minggu")
  materialMassGrams?: number; // Asumsi massa per unit barang (gram)
  systemBoundary: string; // Batas sistem perhitungan (e.g. Cradle-to-grave)
  source: string; // Sumber rujukan ilmiah / resmi
  year: number; // Tahun publikasi
  scope: string; // Cakupan geografis / standar
  uncertainty: "Rendah (<10%)" | "Sedang (10-30%)" | "Tinggi (>30%)";
  verificationStatus: VerificationTier;
  limitations: string; // Batasan model dan asumsi
  notes: string; // Keterangan metodologis
  isAvailable: boolean;
}

export interface CategoryResult {
  category: PlasticCategory;
  label: string;
  itemCountPerWeek: number; // buah / minggu (barang baru)
  emissionFactor: number; // kg CO₂e / buah
  weeklyKgCO2e: number; // kg CO₂e / minggu (satuan utama)
  monthlyKgCO2e: number; // kg CO₂e / bulan (proyeksi konversi: weekly * 52 / 12)
  yearlyKgCO2e: number; // kg CO₂e / tahun (proyeksi konversi: weekly * 52)
  percentage: number; // % kontribusi terhadap total emisi mingguan
  details: {
    item: string;
    activityValue: string;
    factorUsed: string;
    subtotalKgCO2e: number; // kg CO₂e / minggu
    source: string;
    uncertainty: string;
    verificationStatus: VerificationTier;
    activityUnit?: string;
    materialMassGrams?: number;
    systemBoundary?: string;
    limitations?: string;
  }[];
  explanation: string;
}

export interface CalculationResult {
  methodology: "v2_plastik_mingguan";
  unit: "kg CO₂e/minggu";
  totalWeeklyKgCO2e: number; // Satuan utama hasil perhitungan
  totalMonthlyKgCO2e: number; // Proyeksi bulanan (~4.33 minggu/bulan)
  totalYearlyKgCO2e: number; // Proyeksi tahunan (52 minggu/tahun)
  totalItemsPerWeek: number; // Total jumlah barang plastik baru per minggu
  categories: {
    kantong_plastik: CategoryResult;
    wadah_makanan: CategoryResult;
    botol_minum: CategoryResult;
    wadah_styrofoam: CategoryResult;
  };
  highestCategory: {
    category: PlasticCategory;
    label: string;
    percentage: number;
    weeklyKgCO2e: number;
    itemCountPerWeek: number;
  };
  benchmark: {
    nationalAvgWeeklyKg: number; // Tolok ukur rata-rata emisi plastik sekali pakai per kapita mingguan
    differenceFromBenchmarkPercent: number;
    status: "rendah" | "sedang" | "tinggi";
  };
  equivalencies: {
    plasticItemsYearly: number; // Proyeksi akumulasi barang plastik sekali pakai per tahun
    treesNeededYearly: number; // Estimasi pohon dewasa yang dibutuhkan untuk menyerap emisi
    motorKilometersEquivalent: number; // Ekuivalen km perjalanan motor matic
  };
  dataQuality: {
    verifiedFactorsCount: number;
    literatureFactorsCount: number;
    provisionalFactorsCount: number;
    confidenceScore: number; // 0 - 100%
  };
}

// Tipe pendukung untuk membaca data historis snapshot versi lama (v1_bulanan)
export interface LegacyCategoryResult {
  category: LegacyCategory;
  label: string;
  monthlyKgCO2e: number;
  yearlyKgCO2e: number;
  percentage: number;
  details: {
    item: string;
    activityValue: string;
    factorUsed: string;
    subtotalKgCO2e: number;
    source: string;
    uncertainty: string;
    verificationStatus: VerificationTier;
    activityUnit?: string;
    limitations?: string;
  }[];
  explanation: string;
}

export interface LegacyCalculationResult {
  totalMonthlyKgCO2e: number;
  totalYearlyKgCO2e: number;
  categories: {
    transportasi: LegacyCategoryResult;
    energi: LegacyCategoryResult;
    pangan: LegacyCategoryResult;
    konsumsi: LegacyCategoryResult;
    sampah: LegacyCategoryResult;
  };
  highestCategory: {
    category: LegacyCategory;
    label: string;
    percentage: number;
    monthlyKgCO2e: number;
  };
  benchmark: {
    indonesiaAvgYearlyKg: number;
    indonesiaAvgMonthlyKg: number;
    parisAgreementTargetYearlyKg: number;
    differenceFromNationalPercent: number;
    differenceFromParisTargetPercent: number;
    status: "rendah" | "sedang" | "tinggi";
  };
  equivalencies: {
    treesNeededYearly: number;
    motorKilometersEquivalent: number;
    roundTripBandaAcehMedan?: number;
  };
  dataQuality: {
    verifiedFactorsCount: number;
    literatureFactorsCount: number;
    provisionalFactorsCount: number;
    confidenceScore: number;
  };
}
