import { CategoryResult, ConsumptionData } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export function calculateConsumptionEmissions(data: ConsumptionData): CategoryResult {
  const clothesFactor = EMISSION_FACTORS.new_clothing;
  const packageFactor = EMISSION_FACTORS.online_package_delivery;
  const paperFactor = EMISSION_FACTORS.photocopy_sheet;
  const smartphoneFactor = EMISSION_FACTORS.smartphone_amortized;
  const laptopFactor = EMISSION_FACTORS.laptop_amortized;

  const clothesEmissions = Math.max(0, data.newClothesPerMonth) * clothesFactor.value;
  const packageEmissions = Math.max(0, data.onlinePackagesPerMonth) * packageFactor.value;
  const paperEmissions = Math.max(0, data.photocopySheetsPerMonth) * paperFactor.value;
  const smartphoneEmissions = data.purchasedSmartphoneThisYear ? smartphoneFactor.value : 0;
  const laptopEmissions = data.purchasedLaptopThisYear ? laptopFactor.value : 0;

  const totalMonthlyKgCO2e =
    Math.round(
      (clothesEmissions + packageEmissions + paperEmissions + smartphoneEmissions + laptopEmissions) *
        100
    ) / 100;

  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  const details: CategoryResult["details"] = [];

  if (data.newClothesPerMonth > 0) {
    details.push({
      item: "Pakaian Baru (Fast Fashion)",
      activityValue: `${data.newClothesPerMonth} helai / bulan`,
      factorUsed: `${clothesFactor.value} ${clothesFactor.unit}`,
      subtotalKgCO2e: Math.round(clothesEmissions * 100) / 100,
      source: clothesFactor.source,
      uncertainty: clothesFactor.uncertainty,
      verificationStatus: clothesFactor.verificationStatus,
      activityUnit: clothesFactor.activityUnit,
      limitations: clothesFactor.limitations,
    });
  }

  if (data.onlinePackagesPerMonth > 0) {
    details.push({
      item: "Paket Ekspedisi Belanja Online (Jawa ke Aceh)",
      activityValue: `${data.onlinePackagesPerMonth} paket / bulan (~2.500 km logistik)`,
      factorUsed: `${packageFactor.value} ${packageFactor.unit}`,
      subtotalKgCO2e: Math.round(packageEmissions * 100) / 100,
      source: packageFactor.source,
      uncertainty: packageFactor.uncertainty,
      verificationStatus: packageFactor.verificationStatus,
      activityUnit: packageFactor.activityUnit,
      limitations: packageFactor.limitations,
    });
  }

  if (data.photocopySheetsPerMonth > 0) {
    details.push({
      item: "Kertas Tugas Kuliah & Fotokopi Modul",
      activityValue: `${data.photocopySheetsPerMonth} lembar / bulan`,
      factorUsed: `${paperFactor.value} ${paperFactor.unit}`,
      subtotalKgCO2e: Math.round(paperEmissions * 100) / 100,
      source: paperFactor.source,
      uncertainty: paperFactor.uncertainty,
      verificationStatus: paperFactor.verificationStatus,
      activityUnit: paperFactor.activityUnit,
      limitations: paperFactor.limitations,
    });
  }

  if (data.purchasedSmartphoneThisYear) {
    details.push({
      item: "Smartphone Baru (Amortisasi Tahun Pertama)",
      activityValue: "1 unit / tahun (dibagi rata 12 bulan)",
      factorUsed: `${smartphoneFactor.value} ${smartphoneFactor.unit}`,
      subtotalKgCO2e: Math.round(smartphoneEmissions * 100) / 100,
      source: smartphoneFactor.source,
      uncertainty: smartphoneFactor.uncertainty,
      verificationStatus: smartphoneFactor.verificationStatus,
      activityUnit: smartphoneFactor.activityUnit,
      limitations: smartphoneFactor.limitations,
    });
  }

  if (data.purchasedLaptopThisYear) {
    details.push({
      item: "Laptop Kuliah Baru (Amortisasi Tahun Pertama)",
      activityValue: "1 unit / tahun (dibagi rata 12 bulan)",
      factorUsed: `${laptopFactor.value} ${laptopFactor.unit}`,
      subtotalKgCO2e: Math.round(laptopEmissions * 100) / 100,
      source: laptopFactor.source,
      uncertainty: laptopFactor.uncertainty,
      verificationStatus: laptopFactor.verificationStatus,
      activityUnit: laptopFactor.activityUnit,
      limitations: laptopFactor.limitations,
    });
  }

  if (details.length === 0) {
    details.push({
      item: "Konsumsi Barang & Belanja Baru",
      activityValue: "Minimal (tidak ada pembelian signifikan bulan ini)",
      factorUsed: "0.00 kg CO₂e",
      subtotalKgCO2e: 0,
      source: "Gaya hidup sirkular / hemat",
      uncertainty: "Rendah (<10%)",
      verificationStatus: "Estimasi Literatur Ilmiah",
      activityUnit: "pembelian / bulan",
      limitations: "Tidak ada pengadaan perangkat atau pakaian baru dalam periode berjalan",
    });
  }

  return {
    category: "konsumsi",
    label: "Konsumsi & Belanja Barang",
    monthlyKgCO2e: totalMonthlyKgCO2e,
    yearlyKgCO2e: totalYearlyKgCO2e,
    percentage: 0,
    details,
    explanation:
      "Perhitungan berbasis satuan unit fisik barang yang terukur (helai pakaian, paket logistik antar-pulau, rim kertas), menghindari estimasi moneter/uang yang tidak transparan.",
  };
}
