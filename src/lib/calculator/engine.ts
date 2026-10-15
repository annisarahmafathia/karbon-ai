import { CalculationResult, UserCalculatorInput } from "../../types/carbon";
import { calculateTransportEmissions } from "./transport";
import { calculateEnergyEmissions } from "./energy";
import { calculateFoodEmissions } from "./food";
import { calculateConsumptionEmissions } from "./consumption";
import { calculateWasteEmissions } from "./waste";

export function calculateCarbonFootprint(input: UserCalculatorInput): CalculationResult {
  const transportasi = calculateTransportEmissions(input.transport);
  const energi = calculateEnergyEmissions(input.energy);
  const pangan = calculateFoodEmissions(input.food);
  const konsumsi = calculateConsumptionEmissions(input.consumption);
  const sampah = calculateWasteEmissions(input.waste);

  const rawMonthlyTotal =
    transportasi.monthlyKgCO2e +
    energi.monthlyKgCO2e +
    pangan.monthlyKgCO2e +
    konsumsi.monthlyKgCO2e +
    sampah.monthlyKgCO2e;

  const totalMonthlyKgCO2e = Math.round(rawMonthlyTotal * 100) / 100;
  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  // Hitung persentase kontribusi setiap kategori
  const safeTotal = totalMonthlyKgCO2e > 0 ? totalMonthlyKgCO2e : 1;
  transportasi.percentage = Math.round((transportasi.monthlyKgCO2e / safeTotal) * 1000) / 10;
  energi.percentage = Math.round((energi.monthlyKgCO2e / safeTotal) * 1000) / 10;
  pangan.percentage = Math.round((pangan.monthlyKgCO2e / safeTotal) * 1000) / 10;
  konsumsi.percentage = Math.round((konsumsi.monthlyKgCO2e / safeTotal) * 1000) / 10;
  sampah.percentage = Math.round((sampah.monthlyKgCO2e / safeTotal) * 1000) / 10;

  // Tentukan kategori dengan emisi tertinggi
  const categoryList = [
    { cat: "transportasi" as const, res: transportasi },
    { cat: "energi" as const, res: energi },
    { cat: "pangan" as const, res: pangan },
    { cat: "konsumsi" as const, res: konsumsi },
    { cat: "sampah" as const, res: sampah },
  ];

  categoryList.sort((a, b) => b.res.monthlyKgCO2e - a.res.monthlyKgCO2e);
  const highest = categoryList[0];

  const highestCategory = {
    category: highest.cat,
    label: highest.res.label,
    percentage: highest.res.percentage,
    monthlyKgCO2e: highest.res.monthlyKgCO2e,
  };

  // Benchmark per kapita:
  // 1. Rata-rata emisi per kapita Indonesia: ~2.140 kg CO2e / thn (~178 kg/bln)
  //    Sumber: Our World in Data / Global Carbon Project (2022) & KLHK Third Biennial Update Report (BUR 3).
  // 2. Batas target iklim Perjanjian Paris 2030 (Skenario 1.5°C per kapita global): ~2.000 kg CO2e / thn (~167 kg/bln)
  //    Sumber: IPCC 6th Assessment Report (AR6 WG3 Chapter 3).
  const indonesiaAvgYearlyKg = 2140;
  const indonesiaAvgMonthlyKg = 178;
  const parisAgreementTargetYearlyKg = 2000;

  const differenceFromNationalPercent =
    Math.round(((totalYearlyKgCO2e - indonesiaAvgYearlyKg) / indonesiaAvgYearlyKg) * 1000) / 10;

  const differenceFromParisTargetPercent =
    Math.round(((totalYearlyKgCO2e - parisAgreementTargetYearlyKg) / parisAgreementTargetYearlyKg) * 1000) / 10;

  let status: "rendah" | "sedang" | "tinggi" = "sedang";
  if (totalYearlyKgCO2e < 1500) {
    status = "rendah";
  } else if (totalYearlyKgCO2e > 2300) {
    status = "tinggi";
  }

  // Ekuivalensi lingkungan nyata:
  // 1 pohon peneduh kota/mangrove dewasa menyerap ~22 kg CO2e / tahun (USDA Forest Service & IPCC Guidelines)
  const treesNeededYearly = Math.max(1, Math.ceil(totalYearlyKgCO2e / 22));
  
  // Setara km perjalanan motor matic (0.043 kg CO2e/km, efisiensi ~45 km/L Pertalite)
  const motorKilometersEquivalent = Math.round(totalYearlyKgCO2e / 0.043);
  
  // Perjalanan PP Banda Aceh - Medan (~1.200 km PP via Lintas Sumatera, emisi motor ~51.6 kg CO2e per PP)
  const roundTripBandaAcehMedan = Math.round((totalYearlyKgCO2e / 51.6) * 10) / 10;

  // Analisis kualitas data faktor emisi yang aktif
  const allDetails = [
    ...transportasi.details,
    ...energi.details,
    ...pangan.details,
    ...konsumsi.details,
    ...sampah.details,
  ];

  const verifiedFactorsCount = allDetails.filter((d) => d.verificationStatus === "Terverifikasi Resmi").length;
  const literatureFactorsCount = allDetails.filter((d) => d.verificationStatus === "Estimasi Literatur Ilmiah").length;
  const provisionalFactorsCount = allDetails.filter((d) => d.verificationStatus === "Provisional (Perlu Riset Lokal)").length;

  const totalFactorsUsed = allDetails.length || 1;
  const confidenceScore = Math.round(
    ((verifiedFactorsCount * 1.0 + literatureFactorsCount * 0.85 + provisionalFactorsCount * 0.6) /
      totalFactorsUsed) *
      100
  );

  return {
    totalMonthlyKgCO2e,
    totalYearlyKgCO2e,
    categories: {
      transportasi,
      energi,
      pangan,
      konsumsi,
      sampah,
    },
    highestCategory,
    benchmark: {
      indonesiaAvgYearlyKg,
      indonesiaAvgMonthlyKg,
      parisAgreementTargetYearlyKg,
      differenceFromNationalPercent,
      differenceFromParisTargetPercent,
      status,
    },
    equivalencies: {
      treesNeededYearly,
      motorKilometersEquivalent,
      roundTripBandaAcehMedan,
    },
    dataQuality: {
      verifiedFactorsCount,
      literatureFactorsCount,
      provisionalFactorsCount,
      confidenceScore,
    },
  };
}
