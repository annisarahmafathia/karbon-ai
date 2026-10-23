import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import {
  parseResultSnapshot,
  isPlasticCalculationResult,
  isLegacyCalculationResult,
} from "../lib/history/snapshot";

test("parseResultSnapshot accepts new CalculationResult with 4 plastic categories without recalculating", () => {
  const result = calculateCarbonFootprint({
    kantongPlastik: 4,
    wadahMakanan: 2,
    botolMinum: 3,
    wadahStyrofoam: 1,
  });
  const parsed = parseResultSnapshot(result);

  assert.ok(parsed);
  assert.ok(isPlasticCalculationResult(parsed));
  assert.equal(parsed.totalWeeklyKgCO2e, result.totalWeeklyKgCO2e);
  assert.equal(
    parsed.categories.kantong_plastik.weeklyKgCO2e,
    result.categories.kantong_plastik.weeklyKgCO2e
  );
  assert.equal(
    parsed.categories.wadah_makanan.weeklyKgCO2e,
    result.categories.wadah_makanan.weeklyKgCO2e
  );
  assert.equal(
    parsed.categories.botol_minum.weeklyKgCO2e,
    result.categories.botol_minum.weeklyKgCO2e
  );
  assert.equal(
    parsed.categories.wadah_styrofoam.weeklyKgCO2e,
    result.categories.wadah_styrofoam.weeklyKgCO2e
  );
});

test("parseResultSnapshot accepts legacy v1 snapshot and distinguishes it from new methodology", () => {
  const legacySnapshot = {
    totalMonthlyKgCO2e: 120,
    totalYearlyKgCO2e: 1440,
    categories: {
      transportasi: { label: "Transportasi", monthlyKgCO2e: 40, yearlyKgCO2e: 480, percentage: 33.3, details: [], explanation: "" },
      energi: { label: "Energi", monthlyKgCO2e: 50, yearlyKgCO2e: 600, percentage: 41.7, details: [], explanation: "" },
      pangan: { label: "Pangan", monthlyKgCO2e: 20, yearlyKgCO2e: 240, percentage: 16.7, details: [], explanation: "" },
      konsumsi: { label: "Konsumsi", monthlyKgCO2e: 5, yearlyKgCO2e: 60, percentage: 4.2, details: [], explanation: "" },
      sampah: { label: "Sampah", monthlyKgCO2e: 5, yearlyKgCO2e: 60, percentage: 4.2, details: [], explanation: "" },
    },
    highestCategory: { category: "energi", label: "Energi", percentage: 41.7, monthlyKgCO2e: 50 },
    benchmark: { indonesiaAvgYearlyKg: 2140, indonesiaAvgMonthlyKg: 178, parisAgreementTargetYearlyKg: 2000, differenceFromNationalPercent: -32.7, differenceFromParisTargetPercent: -28, status: "rendah" },
    equivalencies: { treesNeededYearly: 65, motorKilometersEquivalent: 33488 },
    dataQuality: { verifiedFactorsCount: 5, literatureFactorsCount: 8, provisionalFactorsCount: 2, confidenceScore: 88 },
  };

  const parsed = parseResultSnapshot(legacySnapshot);
  assert.ok(parsed);
  assert.equal(isPlasticCalculationResult(parsed), false);
  assert.equal(isLegacyCalculationResult(parsed), true);
  assert.equal(parsed.totalMonthlyKgCO2e, 120);
});

test("parseResultSnapshot rejects an invalid snapshot shape", () => {
  assert.equal(
    parseResultSnapshot({
      totalWeeklyKgCO2e: 10,
      breakdown: { kantong: { weeklyKgCO2e: 10 } },
    }),
    null
  );
});

test("Riwayat list loads each carbon_calculations row newest-first without monthly grouping", async () => {
  const pagePath = path.resolve(
    process.cwd(),
    "src/app/(app)/riwayat/page.tsx"
  );
  const content = await fs.readFile(pagePath, "utf-8");

  assert.ok(content.includes('.from("carbon_calculations")'));
  assert.ok(content.includes('.order("created_at", { ascending: false })'));
  assert.ok(content.includes(".eq(\"user_id\", user.id)"));
  assert.ok(!content.includes("group"));
  assert.ok(content.includes("href={`/riwayat/${item.id}`}"));
});

test("Riwayat detail renders saved result_snapshot and does not recalculate", async () => {
  const pagePath = path.resolve(
    process.cwd(),
    "src/app/(app)/riwayat/[id]/page.tsx"
  );
  const content = await fs.readFile(pagePath, "utf-8");

  assert.ok(content.includes("parseResultSnapshot(calculation.result_snapshot)"));
  assert.ok(!content.includes("calculateCarbonFootprint"));
  assert.ok(content.includes('.eq("user_id", user.id)'));
});
