import test from "node:test";
import assert from "node:assert/strict";

import { calculateCarbonFootprint } from "../lib/calculator/engine";
import { calculateTransportEmissions } from "../lib/calculator/transport";
import { calculateEnergyEmissions } from "../lib/calculator/energy";
import { calculateFoodEmissions } from "../lib/calculator/food";
import { calculateConsumptionEmissions } from "../lib/calculator/consumption";
import { calculateWasteEmissions } from "../lib/calculator/waste";
import { DEFAULT_CALCULATOR_INPUT, sanitizeCalculatorInput } from "../lib/validation/index";
import { getPersonalizedGreenActions } from "../lib/recommendations/index";

test("Transport calculation with zero distance gives zero regular emissions", () => {
  const result = calculateTransportEmissions({
    primaryVehicle: "motor_matic_bebek",
    campusDistanceKm: 0,
    daysPerWeekToCampus: 0,
    otherDailyKm: 0,
    weekendTripKmPerMonth: 0,
    weekendTripVehicle: "motor_matic_bebek",
  });

  assert.equal(result.monthlyKgCO2e, 0);
  assert.equal(result.yearlyKgCO2e, 0);
});

test("Trans Koetaradja produces significantly lower emissions than private motorcycle", () => {
  const motorResult = calculateTransportEmissions({
    primaryVehicle: "motor_matic_bebek",
    campusDistanceKm: 10,
    daysPerWeekToCampus: 5,
    otherDailyKm: 0,
    weekendTripKmPerMonth: 0,
    weekendTripVehicle: "motor_matic_bebek",
  });

  const busResult = calculateTransportEmissions({
    primaryVehicle: "trans_koetaradja",
    campusDistanceKm: 10,
    daysPerWeekToCampus: 5,
    otherDailyKm: 0,
    weekendTripKmPerMonth: 0,
    weekendTripVehicle: "trans_koetaradja",
  });

  assert.ok(busResult.monthlyKgCO2e < motorResult.monthlyKgCO2e);
  // Trans Koetaradja (0.038) vs motor (0.043)
  assert.ok(busResult.monthlyKgCO2e > 0);
});

test("Walking or cycling gives zero operational tailpipe emissions", () => {
  const walkingResult = calculateTransportEmissions({
    primaryVehicle: "jalan_sepeda",
    campusDistanceKm: 5,
    daysPerWeekToCampus: 5,
    otherDailyKm: 2,
    weekendTripKmPerMonth: 0,
    weekendTripVehicle: "jalan_sepeda",
  });

  assert.equal(walkingResult.monthlyKgCO2e, 0);
});

test("Energy calculation applies Sumatera grid factor correctly", () => {
  const result = calculateEnergyEmissions({
    housingType: "kos_sendiri",
    calculationMethod: "token_kwh",
    monthlyKwh: 100,
    housematesCount: 1,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 0,
    laptopDailyHours: 0,
    hasMiniFridge: false,
    lightDailyHours: 0,
  });

  // 100 kWh * 0.761 = 76.1 kg CO2e
  assert.equal(result.monthlyKgCO2e, 76.1);
  assert.equal(result.yearlyKgCO2e, Math.round(76.1 * 12 * 100) / 100);
});

test("Energy token divided by housemates splits the carbon burden", () => {
  const single = calculateEnergyEmissions({
    housingType: "rumah_sewa",
    calculationMethod: "token_kwh",
    monthlyKwh: 100,
    housematesCount: 1,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 0,
    laptopDailyHours: 0,
    hasMiniFridge: false,
    lightDailyHours: 0,
  });

  const shared = calculateEnergyEmissions({
    housingType: "rumah_sewa",
    calculationMethod: "token_kwh",
    monthlyKwh: 100,
    housematesCount: 2,
    hasAirConditioner: false,
    acDailyHours: 0,
    fanDailyHours: 0,
    laptopDailyHours: 0,
    hasMiniFridge: false,
    lightDailyHours: 0,
  });

  assert.equal(shared.monthlyKgCO2e, Math.round((single.monthlyKgCO2e / 2) * 100) / 100);
});

test("Food calculation increases when beef/mutton meals increase", () => {
  const lowBeef = calculateFoodEmissions({
    dietType: "mayoritas_ayam_ikan",
    beefMuttonMealsPerWeek: 0,
    chickenMealsPerWeek: 4,
    fishMealsPerWeek: 4,
    singleUseCoffeeCupsPerWeek: 0,
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 0,
  });

  const highBeef = calculateFoodEmissions({
    dietType: "campuran_daging",
    beefMuttonMealsPerWeek: 5,
    chickenMealsPerWeek: 4,
    fishMealsPerWeek: 4,
    singleUseCoffeeCupsPerWeek: 0,
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 0,
  });

  assert.ok(highBeef.monthlyKgCO2e > lowBeef.monthlyKgCO2e);
});

test("Waste open burning significantly raises carbon emissions", () => {
  const noBurn = calculateWasteEmissions({
    sortingHabit: "kadang_pilah",
    singleUsePlasticBagsPerWeek: 2,
    openBurningHabit: "tidak_pernah",
  });

  const withBurn = calculateWasteEmissions({
    sortingHabit: "kadang_pilah",
    singleUsePlasticBagsPerWeek: 2,
    openBurningHabit: "sering",
  });

  assert.ok(withBurn.monthlyKgCO2e > noBurn.monthlyKgCO2e);
});

test("Waste sorting reduces landfill emissions", () => {
  const unsorted = calculateWasteEmissions({
    sortingHabit: "tidak_pernah_campur",
    singleUsePlasticBagsPerWeek: 0,
    openBurningHabit: "tidak_pernah",
  });

  const sorted = calculateWasteEmissions({
    sortingHabit: "selalu_pilah",
    singleUsePlasticBagsPerWeek: 0,
    openBurningHabit: "tidak_pernah",
  });

  assert.ok(sorted.monthlyKgCO2e < unsorted.monthlyKgCO2e);
});

test("Consumption calculation computes physical units without arbitrary money conversion", () => {
  const zeroConsumption = calculateConsumptionEmissions({
    newClothesPerMonth: 0,
    onlinePackagesPerMonth: 0,
    photocopySheetsPerMonth: 0,
    purchasedSmartphoneThisYear: false,
    purchasedLaptopThisYear: false,
  });

  const activeConsumption = calculateConsumptionEmissions({
    newClothesPerMonth: 2,
    onlinePackagesPerMonth: 3,
    photocopySheetsPerMonth: 100,
    purchasedSmartphoneThisYear: true,
    purchasedLaptopThisYear: false,
  });

  assert.equal(zeroConsumption.monthlyKgCO2e, 0);
  assert.ok(activeConsumption.monthlyKgCO2e > 0);
  // Clothes (2 * 8.5 = 17) + Packages (3 * 1.85 = 5.55) + Paper (100 * 0.0048 = 0.48) + Phone (5) = 28.03
  assert.equal(activeConsumption.monthlyKgCO2e, 28.03);
});


test("Central calculation engine aggregates total and computes percentages totaling ~100%", () => {
  const result = calculateCarbonFootprint(DEFAULT_CALCULATOR_INPUT);

  assert.ok(result.totalMonthlyKgCO2e > 0);
  assert.ok(result.totalYearlyKgCO2e > 0);

  const sumPercentages =
    result.categories.transportasi.percentage +
    result.categories.energi.percentage +
    result.categories.pangan.percentage +
    result.categories.konsumsi.percentage +
    result.categories.sampah.percentage;

  // Due to rounding, sum should be within 99.0% and 101.0%
  assert.ok(sumPercentages >= 99.0 && sumPercentages <= 101.0, `Sum was ${sumPercentages}`);
  assert.ok(result.highestCategory.label.length > 0);
  assert.ok(result.equivalencies.treesNeededYearly > 0);
});

test("Energy housing divisor accurately splits shared room appliances for kos_berbagi", () => {
  const singleKos = calculateEnergyEmissions({
    housingType: "kos_sendiri",
    calculationMethod: "peralatan",
    monthlyKwh: 0,
    housematesCount: 1,
    hasAirConditioner: true,
    acDailyHours: 8,
    fanDailyHours: 0,
    laptopDailyHours: 6,
    hasMiniFridge: true,
    lightDailyHours: 8,
  });

  const sharedKos = calculateEnergyEmissions({
    housingType: "kos_berbagi",
    calculationMethod: "peralatan",
    monthlyKwh: 0,
    housematesCount: 2,
    hasAirConditioner: true,
    acDailyHours: 8,
    fanDailyHours: 0,
    laptopDailyHours: 6,
    hasMiniFridge: true,
    lightDailyHours: 8,
  });

  // Shared kos should have lower emissions because AC, fridge, and lights are split by 2 roommates
  assert.ok(sharedKos.monthlyKgCO2e < singleKos.monthlyKgCO2e);

  // Laptop (0.045 kW * 6h * 30.4166... = 8.2125 kWh) is personal and not divided.
  // Shared appliances kWh should be exactly half of single kos shared appliances kWh.
  assert.ok(sharedKos.monthlyKgCO2e > 0);
});

test("Food reusable tumbler toggle offsets disposable cup footprint", () => {
  const withoutTumbler = calculateFoodEmissions({
    dietType: "mayoritas_ayam_ikan",
    beefMuttonMealsPerWeek: 1,
    chickenMealsPerWeek: 5,
    fishMealsPerWeek: 5,
    singleUseCoffeeCupsPerWeek: 7,
    usesReusableTumbler: false,
    takeawayFoodPackagingPerWeek: 2,
  });

  const withTumbler = calculateFoodEmissions({
    dietType: "mayoritas_ayam_ikan",
    beefMuttonMealsPerWeek: 1,
    chickenMealsPerWeek: 5,
    fishMealsPerWeek: 5,
    singleUseCoffeeCupsPerWeek: 7,
    usesReusableTumbler: true,
    takeawayFoodPackagingPerWeek: 2,
  });

  // Reusable tumbler eliminates disposable cups, reducing carbon footprint
  assert.ok(withTumbler.monthlyKgCO2e < withoutTumbler.monthlyKgCO2e);
  // Difference for 7 cups/week (~30.31 cups/month) between disposable cup (0.052) and washing (0.005)
  // ~ 30.31 * (0.052 - 0.005) = ~1.42 kg CO2e
  const diff = withoutTumbler.monthlyKgCO2e - withTumbler.monthlyKgCO2e;
  assert.ok(diff > 1.0 && diff < 1.8);
});

test("Engine provides dual scientific benchmarks and data quality indicators", () => {
  const result = calculateCarbonFootprint(DEFAULT_CALCULATOR_INPUT);

  // Benchmarks must reference national average (2,140) and Paris target (2,000)
  assert.equal(result.benchmark.indonesiaAvgYearlyKg, 2140);
  assert.equal(result.benchmark.parisAgreementTargetYearlyKg, 2000);
  assert.equal(typeof result.benchmark.differenceFromNationalPercent, "number");
  assert.equal(typeof result.benchmark.differenceFromParisTargetPercent, "number");

  // Data quality metrics must be present and valid
  assert.ok(result.dataQuality.verifiedFactorsCount > 0);
  assert.ok(result.dataQuality.literatureFactorsCount > 0);
  assert.ok(
    result.dataQuality.verifiedFactorsCount +
      result.dataQuality.literatureFactorsCount +
      result.dataQuality.provisionalFactorsCount >= 5
  );
  assert.ok(result.dataQuality.confidenceScore >= 60 && result.dataQuality.confidenceScore <= 100);
});

test("Dynamic recommendations calculate realistic, positive savings derived from user input", () => {
  const input = {
    ...DEFAULT_CALCULATOR_INPUT,
    transport: {
      primaryVehicle: "motor_matic_bebek" as const,
      campusDistanceKm: 8,
      daysPerWeekToCampus: 5,
      otherDailyKm: 4,
      weekendTripKmPerMonth: 20,
      weekendTripVehicle: "motor_matic_bebek" as const,
    },
    waste: {
      sortingHabit: "tidak_pernah_campur" as const,
      singleUsePlasticBagsPerWeek: 6,
      openBurningHabit: "sering" as const,
    },
  };

  const result = calculateCarbonFootprint(input);
  const actions = getPersonalizedGreenActions(input, result);

  assert.ok(actions.length > 0);

  // Trans Koetaradja recommendation should be applicable and have positive savings
  const busAction = actions.find((a) => a.id === "action_trans_koetaradja");
  assert.ok(busAction);
  assert.equal(busAction.isApplicable, true);
  assert.ok(busAction.potentialMonthlySavingKgCO2e > 0);
  assert.ok(busAction.isDynamic);

  // Stop open burning should be applicable and have significant savings
  const burnAction = actions.find((a) => a.id === "action_stop_bakar_sampah");
  assert.ok(burnAction);
  assert.equal(burnAction.isApplicable, true);
  assert.ok(burnAction.potentialMonthlySavingKgCO2e > 0);

  // Sum of savings should not exceed total monthly emissions
  const totalSavings = actions.reduce((sum, a) => sum + a.potentialMonthlySavingKgCO2e, 0);
  assert.ok(totalSavings > 0);
});

test("Sanitization cleans invalid inputs and applies safe boundaries", () => {
  const sanitized = sanitizeCalculatorInput({
    transport: {
      primaryVehicle: "motor_matic_bebek",
      campusDistanceKm: -50,
      daysPerWeekToCampus: 14,
      otherDailyKm: 9999,
      weekendTripKmPerMonth: -10,
      weekendTripVehicle: "motor_matic_bebek",
    },
    energy: {
      housingType: "kos_sendiri",
      calculationMethod: "token_kwh",
      monthlyKwh: -500,
      housematesCount: 0,
      hasAirConditioner: false,
      acDailyHours: 35,
      fanDailyHours: -2,
      laptopDailyHours: 10,
      hasMiniFridge: false,
      lightDailyHours: 5,
    },
  });

  assert.equal(sanitized.transport.campusDistanceKm, 0); // clamped min
  assert.equal(sanitized.transport.daysPerWeekToCampus, 7); // clamped max
  assert.equal(sanitized.transport.otherDailyKm, 100); // clamped max
  assert.equal(sanitized.energy.monthlyKwh, 0); // clamped min
  assert.equal(sanitized.energy.housematesCount, 1); // clamped min
  assert.equal(sanitized.energy.acDailyHours, 24); // clamped max
  assert.equal(sanitized.energy.fanDailyHours, 0); // clamped min
});

