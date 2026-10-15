export type VehicleType =
  | "motor_matic_bebek"
  | "motor_sport"
  | "mobil_bensin"
  | "mobil_diesel"
  | "labi_labi"
  | "trans_koetaradja"
  | "jalan_sepeda";

export interface TransportData {
  primaryVehicle: VehicleType;
  campusDistanceKm: number; // Jarak satu arah ke kampus (km)
  daysPerWeekToCampus: number; // Hari ke kampus per minggu (1 - 7)
  otherDailyKm: number; // Jarak aktivitas lain harian (km/hari)
  weekendTripKmPerMonth: number; // Perjalanan akhir pekan / pulang kampung (km/bulan)
  weekendTripVehicle: VehicleType;
}

export type HousingType =
  | "kos_sendiri"
  | "kos_berbagi"
  | "rumah_sewa"
  | "asrama_kampus"
  | "rumah_keluarga";

export interface EnergyData {
  housingType: HousingType;
  calculationMethod: "token_kwh" | "peralatan";
  // Jika metode token listrik:
  monthlyKwh: number; // Total kWh bulanan yang dialokasikan untuk pengguna
  housematesCount: number; // Jumlah penghuni (untuk membagi beban bersama jika kos/rumah sewa)
  // Jika metode estimasi peralatan:
  hasAirConditioner: boolean;
  acDailyHours: number; // Jam penggunaan AC per hari
  fanDailyHours: number; // Jam penggunaan kipas angin per hari
  laptopDailyHours: number; // Jam penggunaan laptop per hari
  hasMiniFridge: boolean; // Kulkas di kamar/kos
  lightDailyHours: number; // Jam lampu menyala
}

export type DietType =
  | "campuran_daging" // Sering makan daging sapi/kambing
  | "mayoritas_ayam_ikan" // Daging ayam atau ikan laut Aceh
  | "pescetarian" // Ikan dan nabati saja
  | "vegetarian_vegan"; // Nabati, tahu, tempe, sayur

export interface FoodData {
  dietType: DietType;
  beefMuttonMealsPerWeek: number; // Frekuensi porsi daging sapi/kambing per minggu
  chickenMealsPerWeek: number; // Frekuensi porsi ayam per minggu
  fishMealsPerWeek: number; // Frekuensi porsi ikan per minggu
  singleUseCoffeeCupsPerWeek: number; // Gelas plastik es kopi / minuman kemasan take-away per minggu
  usesReusableTumbler: boolean; // Kebiasaan membawa tumbler / cangkir keramik warkop
  takeawayFoodPackagingPerWeek: number; // Porsi makanan bungkus styrofoam/plastik per minggu
}

export interface ConsumptionData {
  newClothesPerMonth: number; // Pembelian pakaian baru (baju, celana, jilbab) per bulan
  onlinePackagesPerMonth: number; // Paket kiriman belanja online (kargo udara/darat Jawa-Aceh) per bulan
  photocopySheetsPerMonth: number; // Lembar fotokopi modul & kertas tugas per bulan
  purchasedSmartphoneThisYear: boolean; // Membeli HP baru dalam 12 bulan terakhir
  purchasedLaptopThisYear: boolean; // Membeli laptop baru dalam 12 bulan terakhir
}

export type WasteSortingHabit = "selalu_pilah" | "kadang_pilah" | "tidak_pernah_campur";
export type OpenBurningHabit = "tidak_pernah" | "kadang_pekarangan_kos" | "sering";

export interface WasteData {
  sortingHabit: WasteSortingHabit;
  singleUsePlasticBagsPerWeek: number; // Kantong kresek belanja per minggu
  openBurningHabit: OpenBurningHabit; // Praktik bakar sampah terbuka di pekarangan
}

export interface UserCalculatorInput {
  transport: TransportData;
  energy: EnergyData;
  food: FoodData;
  consumption: ConsumptionData;
  waste: WasteData;
}

export type VerificationTier =
  | "Terverifikasi Resmi"
  | "Estimasi Literatur Ilmiah"
  | "Provisional (Perlu Riset Lokal)";

export interface EmissionFactorMeta {
  id: string;
  name: string;
  category: "transportasi" | "energi" | "pangan" | "konsumsi" | "sampah";
  value: number; // Nilai numerik
  unit: string; // Satuan faktor emisi (contoh: kg CO2e / km)
  activityUnit: string; // Satuan input aktivitas (contoh: km, kWh, porsi, helai)
  source: string; // Sumber rujukan otoritatif
  year: number;
  scope: "Sumatera / Aceh" | "Nasional (Indonesia)" | "Global LCA";
  uncertainty: "Rendah (<10%)" | "Sedang (10-30%)" | "Tinggi (>30%)";
  verificationStatus: VerificationTier;
  limitations: string; // Batasan model dan asumsi
  notes: string;
  isAvailable: boolean; // Transparansi jika data belum terverifikasi
}

export interface CategoryResult {
  category: "transportasi" | "energi" | "pangan" | "konsumsi" | "sampah";
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

export interface CalculationResult {
  totalMonthlyKgCO2e: number;
  totalYearlyKgCO2e: number;
  categories: {
    transportasi: CategoryResult;
    energi: CategoryResult;
    pangan: CategoryResult;
    konsumsi: CategoryResult;
    sampah: CategoryResult;
  };
  highestCategory: {
    category: "transportasi" | "energi" | "pangan" | "konsumsi" | "sampah";
    label: string;
    percentage: number;
    monthlyKgCO2e: number;
  };
  benchmark: {
    indonesiaAvgYearlyKg: number; // ~2.140 kg CO2e/thn (Our World in Data & KLHK BUR 3)
    indonesiaAvgMonthlyKg: number; // ~178 kg CO2e/bln
    parisAgreementTargetYearlyKg: number; // ~2.000 kg CO2e/thn (IPCC 1.5°C 2030 per kapita)
    differenceFromNationalPercent: number; // Persentase terhadap rata-rata nasional
    differenceFromParisTargetPercent: number; // Persentase terhadap target Perjanjian Paris
    status: "rendah" | "sedang" | "tinggi";
  };
  equivalencies: {
    treesNeededYearly: number; // Jumlah pohon peneduh/mangrove (daya serap ~22 kg CO2e/thn, USDA/IPCC)
    motorKilometersEquivalent: number; // Setara km perjalanan motor matic (0.043 kg CO2e/km)
    roundTripBandaAcehMedan: number; // Setara perjalanan PP Banda Aceh - Medan (~1.200 km, ~51.6 kg CO2e/PP)
  };
  dataQuality: {
    verifiedFactorsCount: number;
    literatureFactorsCount: number;
    provisionalFactorsCount: number;
    confidenceScore: number; // 0 - 100%
  };
}
