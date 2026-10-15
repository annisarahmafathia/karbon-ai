import { UserCalculatorInput } from "../../types/carbon";

export const DEFAULT_CALCULATOR_INPUT: UserCalculatorInput = {
  transport: {
    primaryVehicle: "motor_matic_bebek",
    campusDistanceKm: 3.5, // Rata-rata jarak kos di Syiah Kuala/Darussalam ke kampus
    daysPerWeekToCampus: 5,
    otherDailyKm: 4, // Nongkrong warkop, cari makan, belanja
    weekendTripKmPerMonth: 25, // Jalan-jalan akhir pekan sekitar Banda Aceh / Aceh Besar
    weekendTripVehicle: "motor_matic_bebek",
  },
  energy: {
    housingType: "kos_sendiri",
    calculationMethod: "peralatan",
    monthlyKwh: 45,
    housematesCount: 1,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 8,
    laptopDailyHours: 5,
    hasMiniFridge: false,
    lightDailyHours: 6,
  },
  food: {
    dietType: "mayoritas_ayam_ikan",
    beefMuttonMealsPerWeek: 1, // Kari kambing / sie reuboh sekali seminggu
    chickenMealsPerWeek: 5, // Ayam geprek/penyet favorit mahasiswa
    fishMealsPerWeek: 4, // Ikan tongkol/dencis pesisir
    singleUseCoffeeCupsPerWeek: 3, // Es kopi cup plastik
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 4, // Nasi bungkus / bungkus makanan
  },
  consumption: {
    newClothesPerMonth: 1, // Beli 1 baju baru per bulan
    onlinePackagesPerMonth: 2, // 2 paket Shopee/Tokopedia dikirim dari Jakarta
    photocopySheetsPerMonth: 30, // Lembar fotokopi materi & tugas kuliah
    purchasedSmartphoneThisYear: false,
    purchasedLaptopThisYear: false,
  },
  waste: {
    sortingHabit: "kadang_pilah",
    singleUsePlasticBagsPerWeek: 5, // Kantong kresek belanjaan
    openBurningHabit: "tidak_pernah",
  },
};

// Profil Mahasiswa 1: Mahasiswa Kos Darussalam (Kamar AC)
export const ARCHETYPE_KOS_AC: UserCalculatorInput = {
  transport: {
    primaryVehicle: "motor_matic_bebek",
    campusDistanceKm: 4,
    daysPerWeekToCampus: 5,
    otherDailyKm: 5,
    weekendTripKmPerMonth: 40,
    weekendTripVehicle: "motor_matic_bebek",
  },
  energy: {
    housingType: "kos_sendiri",
    calculationMethod: "peralatan",
    monthlyKwh: 120,
    housematesCount: 1,
    hasAirConditioner: true,
    acDailyHours: 7, // AC menyala saat tidur malam & siang hari
    fanDailyHours: 4,
    laptopDailyHours: 6,
    hasMiniFridge: true,
    lightDailyHours: 7,
  },
  food: {
    dietType: "campuran_daging",
    beefMuttonMealsPerWeek: 3,
    chickenMealsPerWeek: 6,
    fishMealsPerWeek: 3,
    singleUseCoffeeCupsPerWeek: 6,
    usesReusableTumbler: false,
    takeawayFoodPackagingPerWeek: 7,
  },
  consumption: {
    newClothesPerMonth: 3,
    onlinePackagesPerMonth: 4,
    photocopySheetsPerMonth: 50,
    purchasedSmartphoneThisYear: true,
    purchasedLaptopThisYear: false,
  },
  waste: {
    sortingHabit: "tidak_pernah_campur",
    singleUsePlasticBagsPerWeek: 8,
    openBurningHabit: "kadang_pekarangan_kos",
  },
};

// Profil Mahasiswa 2: Mahasiswa Asrama Ramah Lingkungan (Eco-Champion)
export const ARCHETYPE_ASRAMA_HIJAU: UserCalculatorInput = {
  transport: {
    primaryVehicle: "trans_koetaradja",
    campusDistanceKm: 2,
    daysPerWeekToCampus: 5,
    otherDailyKm: 1,
    weekendTripKmPerMonth: 10,
    weekendTripVehicle: "jalan_sepeda",
  },
  energy: {
    housingType: "asrama_kampus",
    calculationMethod: "peralatan",
    monthlyKwh: 30,
    housematesCount: 2,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 6,
    laptopDailyHours: 4,
    hasMiniFridge: false,
    lightDailyHours: 5,
  },
  food: {
    dietType: "pescetarian",
    beefMuttonMealsPerWeek: 0,
    chickenMealsPerWeek: 0,
    fishMealsPerWeek: 5,
    singleUseCoffeeCupsPerWeek: 0,
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 1,
  },
  consumption: {
    newClothesPerMonth: 0,
    onlinePackagesPerMonth: 1,
    photocopySheetsPerMonth: 5,
    purchasedSmartphoneThisYear: false,
    purchasedLaptopThisYear: false,
  },
  waste: {
    sortingHabit: "selalu_pilah",
    singleUsePlasticBagsPerWeek: 1,
    openBurningHabit: "tidak_pernah",
  },
};

export function sanitizeCalculatorInput(input: Partial<UserCalculatorInput>): UserCalculatorInput {
  return {
    transport: {
      primaryVehicle: input.transport?.primaryVehicle || "motor_matic_bebek",
      campusDistanceKm: Math.max(0, Math.min(100, Number(input.transport?.campusDistanceKm ?? 3.5))),
      daysPerWeekToCampus: Math.max(0, Math.min(7, Number(input.transport?.daysPerWeekToCampus ?? 5))),
      otherDailyKm: Math.max(0, Math.min(100, Number(input.transport?.otherDailyKm ?? 4))),
      weekendTripKmPerMonth: Math.max(0, Math.min(1000, Number(input.transport?.weekendTripKmPerMonth ?? 25))),
      weekendTripVehicle: input.transport?.weekendTripVehicle || "motor_matic_bebek",
    },
    energy: {
      housingType: input.energy?.housingType || "kos_sendiri",
      calculationMethod: input.energy?.calculationMethod || "peralatan",
      monthlyKwh: Math.max(0, Math.min(1500, Number(input.energy?.monthlyKwh ?? 45))),
      housematesCount: Math.max(1, Math.min(20, Number(input.energy?.housematesCount ?? 1))),
      hasAirConditioner: Boolean(input.energy?.hasAirConditioner),
      acDailyHours: Math.max(0, Math.min(24, Number(input.energy?.acDailyHours ?? 0))),
      fanDailyHours: Math.max(0, Math.min(24, Number(input.energy?.fanDailyHours ?? 8))),
      laptopDailyHours: Math.max(0, Math.min(24, Number(input.energy?.laptopDailyHours ?? 5))),
      hasMiniFridge: Boolean(input.energy?.hasMiniFridge),
      lightDailyHours: Math.max(0, Math.min(24, Number(input.energy?.lightDailyHours ?? 6))),
    },
    food: {
      dietType: input.food?.dietType || "mayoritas_ayam_ikan",
      beefMuttonMealsPerWeek: Math.max(0, Math.min(21, Number(input.food?.beefMuttonMealsPerWeek ?? 1))),
      chickenMealsPerWeek: Math.max(0, Math.min(21, Number(input.food?.chickenMealsPerWeek ?? 5))),
      fishMealsPerWeek: Math.max(0, Math.min(21, Number(input.food?.fishMealsPerWeek ?? 4))),
      singleUseCoffeeCupsPerWeek: Math.max(0, Math.min(30, Number(input.food?.singleUseCoffeeCupsPerWeek ?? 3))),
      usesReusableTumbler: Boolean(input.food?.usesReusableTumbler),
      takeawayFoodPackagingPerWeek: Math.max(0, Math.min(30, Number(input.food?.takeawayFoodPackagingPerWeek ?? 4))),
    },
    consumption: {
      newClothesPerMonth: Math.max(0, Math.min(50, Number(input.consumption?.newClothesPerMonth ?? 1))),
      onlinePackagesPerMonth: Math.max(0, Math.min(50, Number(input.consumption?.onlinePackagesPerMonth ?? 2))),
      photocopySheetsPerMonth: Math.max(0, Math.min(1000, Number(input.consumption?.photocopySheetsPerMonth ?? 30))),
      purchasedSmartphoneThisYear: Boolean(input.consumption?.purchasedSmartphoneThisYear),
      purchasedLaptopThisYear: Boolean(input.consumption?.purchasedLaptopThisYear),
    },
    waste: {
      sortingHabit: input.waste?.sortingHabit || "kadang_pilah",
      singleUsePlasticBagsPerWeek: Math.max(0, Math.min(50, Number(input.waste?.singleUsePlasticBagsPerWeek ?? 5))),
      openBurningHabit: input.waste?.openBurningHabit || "tidak_pernah",
    },
  };
}
