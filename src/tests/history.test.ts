import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import { DEFAULT_CALCULATOR_INPUT } from "../lib/validation";
import { parseResultSnapshot } from "../lib/history/snapshot";

test("parseResultSnapshot accepts engine CalculationResult.categories without recalculating", () => {
  const result = calculateCarbonFootprint(DEFAULT_CALCULATOR_INPUT);
  const parsed = parseResultSnapshot(result);

  assert.ok(parsed);
  assert.equal(parsed.totalMonthlyKgCO2e, result.totalMonthlyKgCO2e);
  assert.equal(
    parsed.categories.transportasi.monthlyKgCO2e,
    result.categories.transportasi.monthlyKgCO2e
  );
  assert.equal(parsed.categories.energi.monthlyKgCO2e, result.categories.energi.monthlyKgCO2e);
  assert.equal(parsed.categories.pangan.monthlyKgCO2e, result.categories.pangan.monthlyKgCO2e);
  assert.equal(
    parsed.categories.konsumsi.monthlyKgCO2e,
    result.categories.konsumsi.monthlyKgCO2e
  );
  assert.equal(parsed.categories.sampah.monthlyKgCO2e, result.categories.sampah.monthlyKgCO2e);
});

test("parseResultSnapshot rejects a nonexistent breakdown shape", () => {
  assert.equal(
    parseResultSnapshot({
      totalMonthlyKgCO2e: 10,
      breakdown: { transportasi: { monthlyKgCO2e: 10 } },
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
  assert.ok(!content.includes("period_month"));
  assert.ok(!content.includes("group"));
  assert.ok(content.includes("href={`/riwayat/${item.id}`}"));
  assert.ok(content.includes("Hitung emisi"));
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
