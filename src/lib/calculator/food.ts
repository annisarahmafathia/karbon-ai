import { CategoryResult, FoodData } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export function calculateFoodEmissions(data: FoodData): CategoryResult {
  const weeksPerMonth = 4.33;
  const beefFactor = EMISSION_FACTORS.beef_mutton_portion;
  const chickenFactor = EMISSION_FACTORS.chicken_portion;
  const fishFactor = EMISSION_FACTORS.fish_portion;
  const plantFactor = EMISSION_FACTORS.plant_portion;
  const cupFactor = EMISSION_FACTORS.single_use_cup;
  const pkgFactor = EMISSION_FACTORS.takeaway_packaging;

  const beefMeals = Math.max(0, data.beefMuttonMealsPerWeek) * weeksPerMonth;
  const chickenMeals = Math.max(0, data.chickenMealsPerWeek) * weeksPerMonth;
  const fishMeals = Math.max(0, data.fishMealsPerWeek) * weeksPerMonth;

  // Asumsi model standar konsumsi: rata-rata 3 waktu makan per hari (3 * 30.4 = 91 waktu makan / bulan)
  const totalMealsInMonth = 91;
  const meatFishMeals = beefMeals + chickenMeals + fishMeals;
  const plantMeals = Math.max(0, totalMealsInMonth - meatFishMeals);

  const beefEmissions = beefMeals * beefFactor.value;
  const chickenEmissions = chickenMeals * chickenFactor.value;
  const fishEmissions = fishMeals * fishFactor.value;
  const plantEmissions = plantMeals * plantFactor.value;

  // Minuman kemasan sekali pakai
  // Jika pengguna membawa tumbler atau minum pakai cangkir keramik warkop, emisi per sajian berkurang (hanya emisi pembersihan tumbler ~0.005 kg CO2e)
  const monthlyCups = Math.max(0, data.singleUseCoffeeCupsPerWeek) * weeksPerMonth;
  const effectiveCupFactor = data.usesReusableTumbler ? 0.005 : cupFactor.value;
  const cupEmissions = monthlyCups * effectiveCupFactor;

  // Kemasan makanan bungkus / takeaway (styrofoam / kertas minyak)
  const monthlyTakeaway = Math.max(0, data.takeawayFoodPackagingPerWeek) * weeksPerMonth;
  const packagingEmissions = monthlyTakeaway * pkgFactor.value;

  const totalMonthlyKgCO2e =
    Math.round(
      (beefEmissions +
        chickenEmissions +
        fishEmissions +
        plantEmissions +
        cupEmissions +
        packagingEmissions) *
        100
    ) / 100;

  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  const details = [];

  if (beefMeals > 0) {
    details.push({
      item: "Daging Sapi / Kambing (Sie Reuboh, Kuah Beulangong)",
      activityValue: `${Math.round(beefMeals)} porsi / bulan (${data.beefMuttonMealsPerWeek} porsi/mgg)`,
      factorUsed: `${beefFactor.value} ${beefFactor.unit}`,
      subtotalKgCO2e: Math.round(beefEmissions * 100) / 100,
      source: beefFactor.source,
      uncertainty: beefFactor.uncertainty,
      verificationStatus: beefFactor.verificationStatus,
      activityUnit: beefFactor.activityUnit,
      limitations: beefFactor.limitations,
    });
  }

  if (chickenMeals > 0) {
    details.push({
      item: "Daging Ayam / Unggas",
      activityValue: `${Math.round(chickenMeals)} porsi / bulan (${data.chickenMealsPerWeek} porsi/mgg)`,
      factorUsed: `${chickenFactor.value} ${chickenFactor.unit}`,
      subtotalKgCO2e: Math.round(chickenEmissions * 100) / 100,
      source: chickenFactor.source,
      uncertainty: chickenFactor.uncertainty,
      verificationStatus: chickenFactor.verificationStatus,
      activityUnit: chickenFactor.activityUnit,
      limitations: chickenFactor.limitations,
    });
  }

  if (fishMeals > 0) {
    details.push({
      item: "Ikan Laut Pesisir Aceh",
      activityValue: `${Math.round(fishMeals)} porsi / bulan (${data.fishMealsPerWeek} porsi/mgg)`,
      factorUsed: `${fishFactor.value} ${fishFactor.unit}`,
      subtotalKgCO2e: Math.round(fishEmissions * 100) / 100,
      source: fishFactor.source,
      uncertainty: fishFactor.uncertainty,
      verificationStatus: fishFactor.verificationStatus,
      activityUnit: fishFactor.activityUnit,
      limitations: fishFactor.limitations,
    });
  }

  if (plantMeals > 0) {
    details.push({
      item: "Pangan Nabati Pokok (Tahu, Tempe, Sayuran, Nasi)",
      activityValue: `${Math.round(plantMeals)} porsi / bulan (porsi waktu makan seimbang)`,
      factorUsed: `${plantFactor.value} ${plantFactor.unit}`,
      subtotalKgCO2e: Math.round(plantEmissions * 100) / 100,
      source: plantFactor.source,
      uncertainty: plantFactor.uncertainty,
      verificationStatus: plantFactor.verificationStatus,
      activityUnit: plantFactor.activityUnit,
      limitations: plantFactor.limitations,
    });
  }

  if (monthlyCups > 0) {
    if (data.usesReusableTumbler) {
      details.push({
        item: "Penggunaan Tumbler / Cangkir Keramik Warkop (Pengganti Cup Sekali Pakai)",
        activityValue: `${Math.round(monthlyCups)} porsi minuman / bulan (Menggunakan Tumbler)`,
        factorUsed: `0.005 kg CO₂e / cuci`,
        subtotalKgCO2e: Math.round(cupEmissions * 100) / 100,
        source: "UNEP LCA Guidelines on Reusable Cups",
        uncertainty: "Sedang (10-30%)",
        verificationStatus: "Estimasi Literatur Ilmiah" as const,
        activityUnit: "porsi minuman / bulan",
        limitations: "Memperhitungkan jejak daur hidup air dan sabun pembersihan",
      });
    } else {
      details.push({
        item: "Gelas Minuman Plastik Sekali Pakai (Es Kopi / Teh Poci)",
        activityValue: `${Math.round(monthlyCups)} cup / bulan`,
        factorUsed: `${cupFactor.value} ${cupFactor.unit}`,
        subtotalKgCO2e: Math.round(cupEmissions * 100) / 100,
        source: cupFactor.source,
        uncertainty: cupFactor.uncertainty,
        verificationStatus: cupFactor.verificationStatus,
        activityUnit: cupFactor.activityUnit,
        limitations: cupFactor.limitations,
      });
    }
  } else if (data.usesReusableTumbler) {
    details.push({
      item: "Praktik Minum Kopi Cangkir Keramik Warkop / Tumbler",
      activityValue: "Zero-waste cup plastik (100% reusable)",
      factorUsed: "0.00 kg CO₂e / cup sekali pakai",
      subtotalKgCO2e: 0,
      source: "Budaya Warkop Aceh Zero Waste",
      uncertainty: "Rendah (<10%)",
      verificationStatus: "Estimasi Literatur Ilmiah" as const,
      activityUnit: "kebiasaan",
      limitations: "Menghindari timbulan limbah plastik warkop",
    });
  }

  if (monthlyTakeaway > 0) {
    details.push({
      item: "Kemasan Makanan Bungkus / Pesan Antar",
      activityValue: `${Math.round(monthlyTakeaway)} bungkus / bulan`,
      factorUsed: `${pkgFactor.value} ${pkgFactor.unit}`,
      subtotalKgCO2e: Math.round(packagingEmissions * 100) / 100,
      source: pkgFactor.source,
      uncertainty: pkgFactor.uncertainty,
      verificationStatus: pkgFactor.verificationStatus,
    });
  }

  return {
    category: "pangan",
    label: "Konsumsi Pangan & Minuman",
    monthlyKgCO2e: totalMonthlyKgCO2e,
    yearlyKgCO2e: totalYearlyKgCO2e,
    percentage: 0,
    details,
    explanation:
      "Dihitung berdasarkan intensitas emisi daur hidup protein pangan (LCA Poore & Nemecek 2018) dan jejak kemasan plastik sekali pakai.",
  };
}
