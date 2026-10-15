import { CategoryResult, WasteData } from "../../types/carbon";
import { EMISSION_FACTORS, STUDENT_DAILY_WASTE_KG } from "../constants/emission-factors";

export function calculateWasteEmissions(data: WasteData): CategoryResult {
  const daysInMonth = 30.4;
  const weeksPerMonth = 4.33;
  const totalMonthlyWasteKg = STUDENT_DAILY_WASTE_KG * daysInMonth; // ~13.68 kg/bln (DLHK3 Banda Aceh)

  const landfillFactor = EMISSION_FACTORS.landfill_waste;
  const burningFactor = EMISSION_FACTORS.open_burning;
  const bagFactor = EMISSION_FACTORS.single_use_plastic_bag;

  // Proporsi sampah yang dibakar di pekarangan (jika ada)
  let burnedProportion = 0;
  if (data.openBurningHabit === "sering") {
    burnedProportion = 0.35; // 35% sampah dibakar di pekarangan kos
  } else if (data.openBurningHabit === "kadang_pekarangan_kos") {
    burnedProportion = 0.15; // 15% sampah dibakar
  }

  const burnedKg = totalMonthlyWasteKg * burnedProportion;
  const burnedEmissions = burnedKg * burningFactor.value;

  // Sisa sampah padat yang diangkut ke sistem TPA kota
  const remainingWasteKg = totalMonthlyWasteKg - burnedKg;

  // Efek pemilahan sampah ke Bank Sampah / Kompos
  let landfillRatio = 1.0;
  let sortingNote = "100% residu campur ke TPA";
  if (data.sortingHabit === "selalu_pilah") {
    landfillRatio = 0.35; // 65% berhasil dikompos atau didaur ulang ke Bank Sampah
    sortingNote = "Pilah aktif (65% didaur ulang/kompos, hanya 35% residu ke TPA)";
  } else if (data.sortingHabit === "kadang_pilah") {
    landfillRatio = 0.75; // 25% terpilah
    sortingNote = "Pilah sebagian (25% terpilah, 75% ke TPA)";
  }

  const landfillKg = remainingWasteKg * landfillRatio;
  const landfillEmissions = landfillKg * landfillFactor.value;

  // Kantong plastik kresek belanja (dihitung sebagai emisi manufaktur embodied carbon)
  const monthlyBags = Math.max(0, data.singleUsePlasticBagsPerWeek) * weeksPerMonth;
  const bagEmissions = monthlyBags * bagFactor.value;

  const totalMonthlyKgCO2e =
    Math.round((landfillEmissions + burnedEmissions + bagEmissions) * 100) / 100;
  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  const details = [
    {
      item: `Pembuangan Residu ke TPA Kota (${sortingNote})`,
      activityValue: `${Math.round(landfillKg * 10) / 10} kg sampah / bulan`,
      factorUsed: `${landfillFactor.value} ${landfillFactor.unit}`,
      subtotalKgCO2e: Math.round(landfillEmissions * 100) / 100,
      source: landfillFactor.source,
      uncertainty: landfillFactor.uncertainty,
      verificationStatus: landfillFactor.verificationStatus,
    },
  ];

  if (burnedKg > 0) {
    details.push({
      item: "Pembakaran Sampah Terbuka di Pekarangan Kos",
      activityValue: `${Math.round(burnedKg * 10) / 10} kg sampah terbakar / bulan`,
      factorUsed: `${burningFactor.value} ${burningFactor.unit}`,
      subtotalKgCO2e: Math.round(burnedEmissions * 100) / 100,
      source: burningFactor.source,
      uncertainty: burningFactor.uncertainty,
      verificationStatus: burningFactor.verificationStatus,
    });
  }

  if (monthlyBags > 0) {
    details.push({
      item: "Manufaktur Kantong Kresek Belanja (Embodied Carbon)",
      activityValue: `${Math.round(monthlyBags)} kantong / bulan`,
      factorUsed: `${bagFactor.value} ${bagFactor.unit}`,
      subtotalKgCO2e: Math.round(bagEmissions * 100) / 100,
      source: bagFactor.source,
      uncertainty: bagFactor.uncertainty,
      verificationStatus: bagFactor.verificationStatus,
    });
  }

  return {
    category: "sampah",
    label: "Pengelolaan Sampah Padat",
    monthlyKgCO2e: totalMonthlyKgCO2e,
    yearlyKgCO2e: totalYearlyKgCO2e,
    percentage: 0,
    details,
    explanation:
      "Dihitung dari timbulan rata-rata sampah mahasiswa Kota Banda Aceh (0.45 kg/hari), rasio pembusukan anaerobik di TPA, serta faktor emisi pembakaran terbuka IPCC.",
  };
}
