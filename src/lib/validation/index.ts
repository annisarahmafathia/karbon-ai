
import { UserCalculatorInput } from "../../types/carbon";

export const DEFAULT_CALCULATOR_INPUT: UserCalculatorInput = {
  transport: {
    primaryVehicle: "motor_matic_bebek",
    campusDistanceKm: 3.5,
    daysPerWeekToCampus: 5,
    otherDailyKm: 4,
    weekendTripKmPerMonth: 25,
    weekendTripVehicle: "motor_matic_bebek",
  },
  energy: {
    housingType: "kos_sendiri",
    calculationMethod: "token_kwh",
    monthlyKwh: 45,
    housematesCount: 1,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 8,
    laptopDailyHours: 5,
    hasMiniFridge: false,
    lightDailyHours: 6,
    riceCookerDailyHours: 0,
    electricStoveDailyHours: 0,
    electricThermosDailyHours: 0,
    clothesIronDailyHours: 0,
  },
  food: {
    dietType: "mayoritas_ayam_ikan",
    beefMuttonMealsPerWeek: 1,
    chickenMealsPerWeek: 5,
    fishMealsPerWeek: 4,
    singleUseCoffeeCupsPerWeek: 3,
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 4,
  },
  consumption: {
    newClothesPerMonth: 1,
    onlinePackagesPerMonth: 2,
    photocopySheetsPerMonth: 30,
    purchasedSmartphoneThisYear: false,
    purchasedLaptopThisYear: false,
  },
  waste: {
    sortingHabit: "kadang_pilah",
    singleUsePlasticBagsPerWeek: 5,
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
    calculationMethod: "token_kwh",
    monthlyKwh: 120,
    housematesCount: 1,
    hasAirConditioner: true,
    acDailyHours: 7,
    fanDailyHours: 4,
    laptopDailyHours: 6,
    hasMiniFridge: true,
    lightDailyHours: 7,
    riceCookerDailyHours: 0,
    electricStoveDailyHours: 0,
    electricThermosDailyHours: 0,
    clothesIronDailyHours: 0,
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
    calculationMethod: "token_kwh",
    monthlyKwh: 30,
    housematesCount: 2,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 6,
    laptopDailyHours: 4,
    hasMiniFridge: false,
    lightDailyHours: 5,
    riceCookerDailyHours: 0,
    electricStoveDailyHours: 0,
    electricThermosDailyHours: 0,
    clothesIronDailyHours: 0,
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

function clampNumber(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(max, parsed));
}

export function sanitizeCalculatorInput(
  input: Partial<UserCalculatorInput>
): UserCalculatorInput {
  return {
    transport: {
      primaryVehicle:
        input.transport?.primaryVehicle || "motor_matic_bebek",
      campusDistanceKm: clampNumber(
        input.transport?.campusDistanceKm,
        3.5,
        100
      ),
      daysPerWeekToCampus: clampNumber(
        input.transport?.daysPerWeekToCampus,
        5,
        7
      ),
      otherDailyKm: clampNumber(input.transport?.otherDailyKm, 4, 100),
      weekendTripKmPerMonth: clampNumber(
        input.transport?.weekendTripKmPerMonth,
        25,
        1000
      ),
      weekendTripVehicle:
        input.transport?.weekendTripVehicle || "motor_matic_bebek",
    },

    energy: {
      housingType: input.energy?.housingType || "kos_sendiri",
      calculationMethod: "token_kwh",
      monthlyKwh: clampNumber(input.energy?.monthlyKwh, 45, 1500),
      housematesCount: Math.max(
        1,
        Math.min(20, Number(input.energy?.housematesCount ?? 1))
      ),
      hasAirConditioner: Boolean(input.energy?.hasAirConditioner),
      acDailyHours: clampNumber(input.energy?.acDailyHours, 0, 24),
      fanDailyHours: clampNumber(input.energy?.fanDailyHours, 8, 24),
      laptopDailyHours: clampNumber(input.energy?.laptopDailyHours, 5, 24),
      hasMiniFridge: Boolean(input.energy?.hasMiniFridge),
      lightDailyHours: clampNumber(input.energy?.lightDailyHours, 6, 24),

      riceCookerDailyHours: clampNumber(
        input.energy?.riceCookerDailyHours,
        0,
        24
      ),
      electricStoveDailyHours: clampNumber(
        input.energy?.electricStoveDailyHours,
        0,
        24
      ),
      electricThermosDailyHours: clampNumber(
        input.energy?.electricThermosDailyHours,
        0,
        24
      ),
      clothesIronDailyHours: clampNumber(
        input.energy?.clothesIronDailyHours,
        0,
        24
      ),
    },

    food: {
      dietType: input.food?.dietType || "mayoritas_ayam_ikan",
      beefMuttonMealsPerWeek: clampNumber(
        input.food?.beefMuttonMealsPerWeek,
        1,
        21
      ),
      chickenMealsPerWeek: clampNumber(
        input.food?.chickenMealsPerWeek,
        5,
        21
      ),
      fishMealsPerWeek: clampNumber(
        input.food?.fishMealsPerWeek,
        4,
        21
      ),
      singleUseCoffeeCupsPerWeek: clampNumber(
        input.food?.singleUseCoffeeCupsPerWeek,
        3,
        30
      ),
      usesReusableTumbler: Boolean(input.food?.usesReusableTumbler),
      takeawayFoodPackagingPerWeek: clampNumber(
        input.food?.takeawayFoodPackagingPerWeek,
        4,
        30
      ),
    },

    consumption: {
      newClothesPerMonth: clampNumber(
        input.consumption?.newClothesPerMonth,
        1,
        50
      ),
      onlinePackagesPerMonth: clampNumber(
        input.consumption?.onlinePackagesPerMonth,
        2,
        50
      ),
      photocopySheetsPerMonth: clampNumber(
        input.consumption?.photocopySheetsPerMonth,
        30,
        1000
      ),
      purchasedSmartphoneThisYear: Boolean(
        input.consumption?.purchasedSmartphoneThisYear
      ),
      purchasedLaptopThisYear: Boolean(
        input.consumption?.purchasedLaptopThisYear
      ),
    },

    waste: {
      sortingHabit: input.waste?.sortingHabit || "kadang_pilah",
      singleUsePlasticBagsPerWeek: clampNumber(
        input.waste?.singleUsePlasticBagsPerWeek,
        5,
        50
      ),
      openBurningHabit: input.waste?.openBurningHabit || "tidak_pernah",
    },
  };
}
