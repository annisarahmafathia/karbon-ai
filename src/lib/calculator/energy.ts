
import { CategoryResult, EnergyData } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export function calculateEnergyEmissions(data: EnergyData): CategoryResult {
  const gridFactor = EMISSION_FACTORS.grid_sumatera;
  const daysInMonth = 30.4;
  let totalKwh = 0;
  const details = [];

  // Pembagian beban peralatan bersama jika kamar digunakan bersama
  const roomSharingDivisor =
    data.housingType === "kos_berbagi" ||
    data.housingType === "asrama_kampus"
      ? 2
      : 1;

  if (data.calculationMethod === "token_kwh") {
    // Metode token: gunakan konsumsi kWh bulanan saja.
    // Peralatan individual tidak ditambahkan lagi agar tidak dihitung ganda.
    const housemates = Math.max(1, data.housematesCount || 1);
    const allocatedKwh = Math.max(0, data.monthlyKwh) / housemates;
    totalKwh = allocatedKwh;

    details.push({
      item: `Konsumsi Listrik Token/Meteran (${
        housemates > 1
          ? `Dibagi ${housemates} orang penghuni`
          : "Meteran Kamar Mandiri"
      })`,
      activityValue: `${Math.round(allocatedKwh * 10) / 10} kWh / bulan`,
      factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
      subtotalKgCO2e:
        Math.round(allocatedKwh * gridFactor.value * 100) / 100,
      source: gridFactor.source,
      uncertainty: gridFactor.uncertainty,
      verificationStatus: gridFactor.verificationStatus,
    });
  } else {
    // Estimasi konsumsi listrik berdasarkan peralatan
    // 1. AC
    if (data.hasAirConditioner && data.acDailyHours > 0) {
      const factor = EMISSION_FACTORS.ac_power;
      const kwh =
        (Math.max(0, data.acDailyHours) * factor.value * daysInMonth) /
        roomSharingDivisor;
      totalKwh += kwh;

      details.push({
        item: `Pendingin Ruangan (AC Kos 0.5 PK)${
          roomSharingDivisor > 1
            ? ` - Alokasi 1/${roomSharingDivisor} Kamar`
            : ""
        }`,
        activityValue: `${data.acDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 2. Kipas angin
    if (data.fanDailyHours > 0) {
      const factor = EMISSION_FACTORS.fan_power;
      const kwh =
        (Math.max(0, data.fanDailyHours) * factor.value * daysInMonth) /
        roomSharingDivisor;
      totalKwh += kwh;

      details.push({
        item: "Kipas Angin Kamar Kos",
        activityValue: `${data.fanDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 3. Laptop dan gadget
    if (data.laptopDailyHours > 0) {
      const factor = EMISSION_FACTORS.laptop_power;
      const kwh =
        Math.max(0, data.laptopDailyHours) * factor.value * daysInMonth;
      totalKwh += kwh;

      details.push({
        item: "Laptop & Pengisian Daya Gadget Kuliah",
        activityValue: `${data.laptopDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 4. Kulkas mini
    if (data.hasMiniFridge) {
      const factor = EMISSION_FACTORS.mini_fridge_power;
      const kwh = (factor.value * daysInMonth) / roomSharingDivisor;
      totalKwh += kwh;

      details.push({
        item: `Kulkas Kamar Kos${
          roomSharingDivisor > 1
            ? ` - Alokasi 1/${roomSharingDivisor} Kamar`
            : ""
        }`,
        activityValue: `24 jam (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 5. Lampu LED
    if (data.lightDailyHours > 0) {
      const factor = EMISSION_FACTORS.led_light_power;
      const kwh =
        (Math.max(0, data.lightDailyHours) * factor.value * daysInMonth) /
        roomSharingDivisor;
      totalKwh += kwh;

      details.push({
        item: `Lampu Penerangan LED${
          roomSharingDivisor > 1
            ? ` - Alokasi 1/${roomSharingDivisor} Kamar`
            : ""
        }`,
        activityValue: `${data.lightDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 6. Magicom / rice cooker
    if (data.riceCookerDailyHours > 0) {
      const factor = EMISSION_FACTORS.rice_cooker_power;
      const kwh =
        Math.max(0, data.riceCookerDailyHours) *
        factor.value *
        daysInMonth;
      totalKwh += kwh;

      details.push({
        item: "Magicom / Rice Cooker",
        activityValue: `${data.riceCookerDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 7. Kompor listrik
    if (data.electricStoveDailyHours > 0) {
      const factor = EMISSION_FACTORS.electric_stove_power;
      const kwh =
        Math.max(0, data.electricStoveDailyHours) *
        factor.value *
        daysInMonth;
      totalKwh += kwh;

      details.push({
        item: "Kompor Listrik",
        activityValue: `${data.electricStoveDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 8. Termos listrik
    if (data.electricThermosDailyHours > 0) {
      const factor = EMISSION_FACTORS.electric_thermos_power;
      const kwh =
        Math.max(0, data.electricThermosDailyHours) *
        factor.value *
        daysInMonth;
      totalKwh += kwh;

      details.push({
        item: "Termos Listrik",
        activityValue: `${data.electricThermosDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }

    // 9. Setrika listrik
    if (data.clothesIronDailyHours > 0) {
      const factor = EMISSION_FACTORS.clothes_iron_power;
      const kwh =
        Math.max(0, data.clothesIronDailyHours) *
        factor.value *
        daysInMonth;
      totalKwh += kwh;

      details.push({
        item: "Setrika Listrik",
        activityValue: `${data.clothesIronDailyHours} jam/hari (~${Math.round(kwh)} kWh/bln)`,
        factorUsed: `${gridFactor.value} ${gridFactor.unit}`,
        subtotalKgCO2e: Math.round(kwh * gridFactor.value * 100) / 100,
        source: `${gridFactor.source} & ${factor.source}`,
        uncertainty: factor.uncertainty,
        verificationStatus: factor.verificationStatus,
      });
    }
  }

  const totalMonthlyKgCO2e =
    Math.round(totalKwh * gridFactor.value * 100) / 100;
  const totalYearlyKgCO2e =
    Math.round(totalMonthlyKgCO2e * 12 * 100) / 100;

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
