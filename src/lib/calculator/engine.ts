import {
  CalculationResult,
  PlasticCalculatorInput,
  PlasticCategory,
} from "../../types/carbon";
import { calculateCategoryEmission } from "./plastic";
import { NATIONAL_AVG_PLASTIC_WEEKLY_KG } from "../constants/emission-factors";

/**
 * Mesin Kalkulasi Utama Jejak Karbon Plastik Sekali Pakai KarbonAI
 *
 * Mengagregasi 4 kategori utama:
 * 1. Kantong plastik (buah/minggu)
 * 2. Wadah makanan plastik (buah/minggu)
 * 3. Botol minum plastik (buah/minggu)
 * 4. Wadah styrofoam (buah/minggu)
 *
 * Rumus dasar:
 * Emisi kategori (kg CO₂e/minggu) = jumlah barang baru per minggu × faktor emisi per barang.
 * Total emisi mingguan = penjumlahan emisi dari keempat kategori.
 */
export function calculateCarbonFootprint(
  input: Partial<PlasticCalculatorInput> | null | undefined
): CalculationResult {
  const safeInput: PlasticCalculatorInput = {
    kantongPlastik: input?.kantongPlastik ?? 0,
    wadahMakanan: input?.wadahMakanan ?? 0,
    botolMinum: input?.botolMinum ?? 0,
    wadahStyrofoam: input?.wadahStyrofoam ?? 0,
  };

  const kantong_plastik = calculateCategoryEmission(
    "kantong_plastik",
    safeInput.kantongPlastik
  );
  const wadah_makanan = calculateCategoryEmission(
    "wadah_makanan",
    safeInput.wadahMakanan
  );
  const botol_minum = calculateCategoryEmission(
    "botol_minum",
    safeInput.botolMinum
  );
  const wadah_styrofoam = calculateCategoryEmission(
    "wadah_styrofoam",
    safeInput.wadahStyrofoam
  );

  const rawWeeklyTotal =
    kantong_plastik.weeklyKgCO2e +
    wadah_makanan.weeklyKgCO2e +
    botol_minum.weeklyKgCO2e +
    wadah_styrofoam.weeklyKgCO2e;

  // Dibulatkan ke 3 desimal untuk skala mingguan
  const totalWeeklyKgCO2e = Math.round(rawWeeklyTotal * 1000) / 1000;

  // Konversi periode dengan asumsi standar:
  // - 1 tahun = 52 minggu
  // - 1 bulan = 52 / 12 minggu (~4.333 minggu)
  const totalYearlyKgCO2e = Math.round(totalWeeklyKgCO2e * 52 * 100) / 100;
  const totalMonthlyKgCO2e = Math.round((totalYearlyKgCO2e / 12) * 100) / 100;

  const totalItemsPerWeek =
    kantong_plastik.itemCountPerWeek +
    wadah_makanan.itemCountPerWeek +
    botol_minum.itemCountPerWeek +
    wadah_styrofoam.itemCountPerWeek;

  // Hitung persentase kontribusi setiap kategori secara konsisten
  if (totalWeeklyKgCO2e > 0) {
    kantong_plastik.percentage =
      Math.round((kantong_plastik.weeklyKgCO2e / totalWeeklyKgCO2e) * 1000) / 10;
    wadah_makanan.percentage =
      Math.round((wadah_makanan.weeklyKgCO2e / totalWeeklyKgCO2e) * 1000) / 10;
    botol_minum.percentage =
      Math.round((botol_minum.weeklyKgCO2e / totalWeeklyKgCO2e) * 1000) / 10;
    wadah_styrofoam.percentage =
      Math.round((wadah_styrofoam.weeklyKgCO2e / totalWeeklyKgCO2e) * 1000) / 10;
  } else {
    kantong_plastik.percentage = 0;
    wadah_makanan.percentage = 0;
    botol_minum.percentage = 0;
    wadah_styrofoam.percentage = 0;
  }

  // Tentukan kategori dengan emisi tertinggi
  const categoryList: {
    cat: PlasticCategory;
    res: typeof kantong_plastik;
  }[] = [
    { cat: "kantong_plastik", res: kantong_plastik },
    { cat: "wadah_makanan", res: wadah_makanan },
    { cat: "botol_minum", res: botol_minum },
    { cat: "wadah_styrofoam", res: wadah_styrofoam },
  ];

  // Urutkan berdasarkan emisi tertinggi, jika seri urutkan berdasarkan jumlah barang
  categoryList.sort((a, b) => {
    if (b.res.weeklyKgCO2e !== a.res.weeklyKgCO2e) {
      return b.res.weeklyKgCO2e - a.res.weeklyKgCO2e;
    }
    return b.res.itemCountPerWeek - a.res.itemCountPerWeek;
  });

  const highest = categoryList[0];
  const highestCategory = {
    category: highest.cat,
    label: highest.res.label,
    percentage: highest.res.percentage,
    weeklyKgCO2e: highest.res.weeklyKgCO2e,
    itemCountPerWeek: highest.res.itemCountPerWeek,
  };

  // Benchmark komparatif: Rata-rata emisi plastik sekali pakai mingguan per kapita di Indonesia
  const nationalAvgWeeklyKg = NATIONAL_AVG_PLASTIC_WEEKLY_KG; // 0.85 kg CO2e / minggu
  const differenceFromBenchmarkPercent =
    nationalAvgWeeklyKg > 0
      ? Math.round(
          ((totalWeeklyKgCO2e - nationalAvgWeeklyKg) / nationalAvgWeeklyKg) * 1000
        ) / 10
      : 0;

  let status: "rendah" | "sedang" | "tinggi" = "sedang";
  if (totalWeeklyKgCO2e === 0 || totalWeeklyKgCO2e < 0.4) {
    status = "rendah";
  } else if (totalWeeklyKgCO2e > 1.2) {
    status = "tinggi";
  }

  // Ekuivalensi lingkungan nyata
  // 1. Proyeksi akumulasi barang plastik per tahun
  const plasticItemsYearly = totalItemsPerWeek * 52;
  // 2. Pohon peneduh dewasa menyerap ~22 kg CO2e / tahun (IPCC/USDA Forest Service)
  const treesNeededYearly =
    totalYearlyKgCO2e > 0 ? Math.max(1, Math.ceil(totalYearlyKgCO2e / 22)) : 0;
  // 3. Ekuivalen km perjalanan motor matic (faktor 0.043 kg CO2e/km, konsumsi bensin ~45 km/L)
  const motorKilometersEquivalent = Math.round(totalYearlyKgCO2e / 0.043);

  // Analisis kualitas data faktor emisi
  const allDetails = [
    ...kantong_plastik.details,
    ...wadah_makanan.details,
    ...botol_minum.details,
    ...wadah_styrofoam.details,
  ];

  const verifiedFactorsCount = allDetails.filter(
    (d) => d.verificationStatus === "Terverifikasi Resmi"
  ).length;
  const literatureFactorsCount = allDetails.filter(
    (d) => d.verificationStatus === "Estimasi Literatur Ilmiah"
  ).length;
  const provisionalFactorsCount = allDetails.filter(
    (d) => d.verificationStatus === "Provisional (Perlu Riset Lokal)"
  ).length;

  const totalFactorsUsed = allDetails.length || 1;
  const confidenceScore = Math.round(
    ((verifiedFactorsCount * 1.0 +
      literatureFactorsCount * 0.85 +
      provisionalFactorsCount * 0.6) /
      totalFactorsUsed) *
      100
  );

  return {
    methodology: "v2_plastik_mingguan",
    unit: "kg CO₂e/minggu",
    totalWeeklyKgCO2e,
    totalMonthlyKgCO2e,
    totalYearlyKgCO2e,
    totalItemsPerWeek,
    categories: {
      kantong_plastik,
      wadah_makanan,
      botol_minum,
      wadah_styrofoam,
    },
    highestCategory,
    benchmark: {
      nationalAvgWeeklyKg,
      differenceFromBenchmarkPercent,
      status,
    },
    equivalencies: {
      plasticItemsYearly,
      treesNeededYearly,
      motorKilometersEquivalent,
    },
    dataQuality: {
      verifiedFactorsCount,
      literatureFactorsCount,
      provisionalFactorsCount,
      confidenceScore,
    },
  };
}
