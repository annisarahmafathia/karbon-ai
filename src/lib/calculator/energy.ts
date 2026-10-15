import { CategoryResult, EnergyData } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export function calculateEnergyEmissions(data: EnergyData): CategoryResult {
  const gridFactor = EMISSION_FACTORS.grid_sumatera;
  const daysInMonth = 30.4;
  let totalKwh = 0;
  const details = [];

  // Divisor pembagian beban peralatan bersama jika kamar kos ditempati bersama teman
  const roomSharingDivisor =
    data.housingType === "kos_berbagi" ? 2 : data.housingType === "asrama_kampus" ? 2 : 1;

  if (data.calculationMethod === "token_kwh") {
    const housemates = Math.max(1, data.housematesCount || 1);
    const allocatedKwh = Math.max(0, data.monthlyKwh) / housemates;
    totalKwh = allocatedKwh;

    details.push({
      item: `Konsumsi Listrik Token/Meteran (${housemates > 1 ? `Dibagi ${housemates} orang penghuni` : "Meteran Kamar Mandiri"})`,
      activityValue: `${Math.round(allocatedKwh * 10) / 10} kWh / bulan`,
      factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
      subtotalKgCO2e: Math.round(allocatedKwh * gridFactor.value * 100) / 100,
      source: gridFactor.source,
      uncertainty: gridFactor.uncertainty,
      verificationStatus: gridFactor.verificationStatus,
    });
  } else {
    // Estimasi peralatan bottom-up
    // 1. AC Kos (dibagi jumlah penghuni kamar jika kos berbagi)
    if (data.hasAirConditioner && data.acDailyHours > 0) {
      const acFactor = EMISSION_FACTORS.ac_power;
      const acKwhRoom = Math.max(0, data.acDailyHours) * acFactor.value * daysInMonth;
      const acKwh = acKwhRoom / roomSharingDivisor;
      totalKwh += acKwh;
      details.push({
        item: `Pendingin Ruangan (AC Kos 0.5 PK)${roomSharingDivisor > 1 ? ` - Alokasi 1/${roomSharingDivisor} Kamar` : ""}`,
        activityValue: `${data.acDailyHours} jam/hari (~${Math.round(acKwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(acKwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${acFactor.source}`,
        uncertainty: acFactor.uncertainty,
        verificationStatus: acFactor.verificationStatus,
      });
    }

    // 2. Kipas Angin
    if (data.fanDailyHours > 0) {
      const fanFactor = EMISSION_FACTORS.fan_power;
      const fanKwh = Math.max(0, data.fanDailyHours) * fanFactor.value * daysInMonth;
      totalKwh += fanKwh;
      details.push({
        item: "Kipas Angin Kamar Kos",
        activityValue: `${data.fanDailyHours} jam/hari (~${Math.round(fanKwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(fanKwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${fanFactor.source}`,
        uncertainty: fanFactor.uncertainty,
        verificationStatus: fanFactor.verificationStatus,
      });
    }

    // 3. Laptop & Gadget (Pribadi)
    if (data.laptopDailyHours > 0) {
      const laptopFactor = EMISSION_FACTORS.laptop_power;
      const laptopKwh = Math.max(0, data.laptopDailyHours) * laptopFactor.value * daysInMonth;
      totalKwh += laptopKwh;
      details.push({
        item: "Laptop & Pengisian Daya Gadget Kuliah",
        activityValue: `${data.laptopDailyHours} jam/hari (~${Math.round(laptopKwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(laptopKwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${laptopFactor.source}`,
        uncertainty: laptopFactor.uncertainty,
        verificationStatus: laptopFactor.verificationStatus,
      });
    }

    // 4. Kulkas (dibagi roomSharingDivisor jika kamar bersama)
    if (data.hasMiniFridge) {
      const fridgeFactor = EMISSION_FACTORS.mini_fridge_power;
      const fridgeKwh = (fridgeFactor.value * daysInMonth) / roomSharingDivisor;
      totalKwh += fridgeKwh;
      details.push({
        item: `Kulkas Kamar Kos${roomSharingDivisor > 1 ? ` - Alokasi 1/${roomSharingDivisor} Kamar` : ""}`,
        activityValue: `24 jam (~${Math.round(fridgeKwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(fridgeKwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${fridgeFactor.source}`,
        uncertainty: fridgeFactor.uncertainty,
        verificationStatus: fridgeFactor.verificationStatus,
      });
    }

    // 5. Lampu Penerangan
    if (data.lightDailyHours > 0) {
      const lightFactor = EMISSION_FACTORS.led_light_power;
      const lightKwh = (Math.max(0, data.lightDailyHours) * lightFactor.value * daysInMonth) / roomSharingDivisor;
      totalKwh += lightKwh;
      details.push({
        item: `Lampu Penerangan LED${roomSharingDivisor > 1 ? ` - Alokasi 1/${roomSharingDivisor} Kamar` : ""}`,
        activityValue: `${data.lightDailyHours} jam/hari (~${Math.round(lightKwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(lightKwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${lightFactor.source}`,
        uncertainty: lightFactor.uncertainty,
        verificationStatus: lightFactor.verificationStatus,
      });
    }
  }

  const totalMonthlyKgCO2e = Math.round(totalKwh * gridFactor.value * 100) / 100;
  const totalYearlyKgCO2e = Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

  return {
    category: "energi",
    label: "Energi Tempat Tinggal",
    monthlyKgCO2e: totalMonthlyKgCO2e,
    yearlyKgCO2e: totalYearlyKgCO2e,
    percentage: 0,
    details,
    explanation: `Total konsumsi listrik diestimasi ~${Math.round(totalKwh * 10) / 10} kWh/bulan yang disuplai dari Sistem Interkoneksi Sumatera-Aceh (${gridFactor.value} kg CO₂e/kWh).`,
  };
}
