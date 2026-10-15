import { CategoryResult, TransportData } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export function calculateTransportEmissions(data: TransportData): CategoryResult {
  const primaryFactorMeta = EMISSION_FACTORS[data.primaryVehicle] || EMISSION_FACTORS.motor_matic_bebek;
  const weekendFactorMeta = EMISSION_FACTORS[data.weekendTripVehicle] || EMISSION_FACTORS.motor_matic_bebek;

  // Jarak pulang pergi ke kampus (km/minggu) = Jarak 1 arah * 2 * hari per minggu
  const campusKmPerWeek = Math.max(0, data.campusDistanceKm) * 2 * Math.min(7, Math.max(0, data.daysPerWeekToCampus));
  
  // Aktivitas harian lain (nongkrong, belanja, organisasi, kos) (km/minggu) = km/hari * 7
  const otherKmPerWeek = Math.max(0, data.otherDailyKm) * 7;
  
  // Total jarak reguler per bulan (rata-rata 4.33 minggu per bulan kalender: 52 minggu / 12 bulan)
  const monthlyRegularKm = (campusKmPerWeek + otherKmPerWeek) * 4.33;
  const monthlyRegularEmissions = monthlyRegularKm * primaryFactorMeta.value;

  // Perjalanan akhir pekan / pulang kampung (km/bulan)
  const monthlyWeekendKm = Math.max(0, data.weekendTripKmPerMonth);
  const monthlyWeekendEmissions = monthlyWeekendKm * weekendFactorMeta.value;

  const totalMonthlyKgCO2e = Math.round((monthlyRegularEmissions + monthlyWeekendEmissions) * 100) / 100;
  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  const details = [
    {
      item: `Perjalanan Kampus & Aktivitas Harian (${primaryFactorMeta.name})`,
      activityValue: `${Math.round(monthlyRegularKm)} km / bulan (${data.daysPerWeekToCampus} hari kuliah PP/mgg + aktivitas lain)`,
      factorUsed: `${primaryFactorMeta.value} ${primaryFactorMeta.unit}`,
      subtotalKgCO2e: Math.round(monthlyRegularEmissions * 100) / 100,
      source: primaryFactorMeta.source,
      uncertainty: primaryFactorMeta.uncertainty,
      verificationStatus: primaryFactorMeta.verificationStatus,
    },
  ];

  if (monthlyWeekendKm > 0) {
    details.push({
      item: `Perjalanan Luar Kota / Pulang Kampung (${weekendFactorMeta.name})`,
      activityValue: `${monthlyWeekendKm} km / bulan`,
      factorUsed: `${weekendFactorMeta.value} ${weekendFactorMeta.unit}`,
      subtotalKgCO2e: Math.round(monthlyWeekendEmissions * 100) / 100,
      source: weekendFactorMeta.source,
      uncertainty: weekendFactorMeta.uncertainty,
      verificationStatus: weekendFactorMeta.verificationStatus,
    });
  }

  return {
    category: "transportasi",
    label: "Transportasi & Mobilitas",
    monthlyKgCO2e: totalMonthlyKgCO2e,
    yearlyKgCO2e: totalYearlyKgCO2e,
    percentage: 0,
    details,
    explanation:
      data.primaryVehicle === "trans_koetaradja" || data.primaryVehicle === "jalan_sepeda"
        ? "Pilihan transportasi harian Anda ramah lingkungan dan menekan emisi gas buang langsung di kawasan perkotaan Banda Aceh."
        : `Dihitung dari total jarak tempuh (${Math.round(monthlyRegularKm + monthlyWeekendKm)} km/bln) dikalikan faktor emisi kendaraan berbahan bakar fosil (${primaryFactorMeta.name}).`,
  };
}
