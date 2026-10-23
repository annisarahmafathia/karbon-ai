import test from "node:test";
import assert from "node:assert/strict";

import { calculateCarbonFootprint } from "../lib/calculator/engine";
import { calculateCategoryEmission, sanitizeItemCount } from "../lib/calculator/plastic";
import { DEFAULT_CALCULATOR_INPUT, sanitizeCalculatorInput } from "../lib/validation/index";
import { getPersonalizedGreenActions } from "../lib/recommendations/index";
import { PLASTIC_EMISSION_FACTORS } from "../lib/constants/emission-factors";

// ==============================================================================
// PENGUJIAN LOGIKA KALKULASI JEJAK KARBON PLASTIK SEKALI PAKAI (10 CHECKLIST POIN)
// ==============================================================================

// 1. Semua input 0 menghasilkan total emisi 0
test("1. Semua input 0 menghasilkan total emisi 0 dan persentase 0%", () => {
  const result = calculateCarbonFootprint(DEFAULT_CALCULATOR_INPUT);

  assert.equal(result.totalWeeklyKgCO2e, 0);
  assert.equal(result.totalMonthlyKgCO2e, 0);
  assert.equal(result.totalYearlyKgCO2e, 0);
  assert.equal(result.totalItemsPerWeek, 0);

  assert.equal(result.categories.kantong_plastik.weeklyKgCO2e, 0);
  assert.equal(result.categories.wadah_makanan.weeklyKgCO2e, 0);
  assert.equal(result.categories.botol_minum.weeklyKgCO2e, 0);
  assert.equal(result.categories.wadah_styrofoam.weeklyKgCO2e, 0);

  assert.equal(result.categories.kantong_plastik.percentage, 0);
  assert.equal(result.categories.wadah_makanan.percentage, 0);
  assert.equal(result.categories.botol_minum.percentage, 0);
  assert.equal(result.categories.wadah_styrofoam.percentage, 0);

  assert.equal(result.benchmark.status, "rendah");
});

// 2. Setiap kategori dapat dihitung secara terpisah
test("2. Setiap kategori dapat dihitung secara terpisah dengan benar", () => {
  const bagResult = calculateCategoryEmission("kantong_plastik", 5);
  // 5 kantong * 0.033 = 0.165 kg CO2e
  assert.equal(bagResult.weeklyKgCO2e, 0.165);
  assert.equal(bagResult.itemCountPerWeek, 5);
  assert.equal(bagResult.emissionFactor, 0.033);

  const foodResult = calculateCategoryEmission("wadah_makanan", 4);
  // 4 wadah * 0.155 = 0.620 kg CO2e
  assert.equal(foodResult.weeklyKgCO2e, 0.62);
  assert.equal(foodResult.itemCountPerWeek, 4);
  assert.equal(foodResult.emissionFactor, 0.155);

  const bottleResult = calculateCategoryEmission("botol_minum", 6);
  // 6 botol * 0.083 = 0.498 kg CO2e
  assert.equal(bottleResult.weeklyKgCO2e, 0.498);
  assert.equal(bottleResult.itemCountPerWeek, 6);
  assert.equal(bottleResult.emissionFactor, 0.083);

  const foamResult = calculateCategoryEmission("wadah_styrofoam", 3);
  // 3 wadah * 0.035 = 0.105 kg CO2e
  assert.equal(foamResult.weeklyKgCO2e, 0.105);
  assert.equal(foamResult.itemCountPerWeek, 3);
  assert.equal(foamResult.emissionFactor, 0.035);
});

// 3. Perubahan jumlah barang menghasilkan perubahan emisi sesuai faktor emisinya (linearitas)
test("3. Perubahan jumlah barang menghasilkan perubahan emisi linier sesuai faktor emisi", () => {
  const baseInput = {
    kantongPlastik: 2,
    wadahMakanan: 2,
    botolMinum: 2,
    wadahStyrofoam: 2,
  };
  const baseResult = calculateCarbonFootprint(baseInput);

  // Tambahkan 3 botol minum baru (+3 * 0.083 = +0.249 kg CO2e)
  const modifiedInput = {
    ...baseInput,
    botolMinum: 5,
  };
  const modifiedResult = calculateCarbonFootprint(modifiedInput);

  const diffBottle =
    modifiedResult.categories.botol_minum.weeklyKgCO2e -
    baseResult.categories.botol_minum.weeklyKgCO2e;
  assert.equal(Math.round(diffBottle * 1000) / 1000, 0.249);

  const diffTotal =
    modifiedResult.totalWeeklyKgCO2e - baseResult.totalWeeklyKgCO2e;
  assert.equal(Math.round(diffTotal * 1000) / 1000, 0.249);

  // Kategori lain tidak boleh terpengaruh
  assert.equal(
    modifiedResult.categories.kantong_plastik.weeklyKgCO2e,
    baseResult.categories.kantong_plastik.weeklyKgCO2e
  );
  assert.equal(
    modifiedResult.categories.wadah_makanan.weeklyKgCO2e,
    baseResult.categories.wadah_makanan.weeklyKgCO2e
  );
  assert.equal(
    modifiedResult.categories.wadah_styrofoam.weeklyKgCO2e,
    baseResult.categories.wadah_styrofoam.weeklyKgCO2e
  );
});

// 4. Total emisi sama dengan penjumlahan keempat kategori
test("4. Total emisi mingguan sama persis dengan penjumlahan keempat kategori", () => {
  const input = {
    kantongPlastik: 7,
    wadahMakanan: 3,
    botolMinum: 5,
    wadahStyrofoam: 4,
  };
  const result = calculateCarbonFootprint(input);

  const sumCategories =
    result.categories.kantong_plastik.weeklyKgCO2e +
    result.categories.wadah_makanan.weeklyKgCO2e +
    result.categories.botol_minum.weeklyKgCO2e +
    result.categories.wadah_styrofoam.weeklyKgCO2e;

  assert.equal(result.totalWeeklyKgCO2e, Math.round(sumCategories * 1000) / 1000);
  assert.equal(result.totalItemsPerWeek, 7 + 3 + 5 + 4); // 19 barang/minggu
});

// 5. Persentase kontribusi konsisten dengan total emisi (~100%)
test("5. Persentase kontribusi konsisten dengan total emisi dan berjumlah ~100%", () => {
  const input = {
    kantongPlastik: 8,
    wadahMakanan: 5,
    botolMinum: 6,
    wadahStyrofoam: 3,
  };
  const result = calculateCarbonFootprint(input);

  assert.ok(result.totalWeeklyKgCO2e > 0);

  const sumPercentages =
    result.categories.kantong_plastik.percentage +
    result.categories.wadah_makanan.percentage +
    result.categories.botol_minum.percentage +
    result.categories.wadah_styrofoam.percentage;

  // Toleransi pembulatan 1 desimal: 99.0% - 101.0%
  assert.ok(
    sumPercentages >= 99.0 && sumPercentages <= 101.0,
    `Jumlah persentase adalah ${sumPercentages}%`
  );

  // Kategori tertinggi teridentifikasi dengan benar
  assert.ok(result.highestCategory.label.length > 0);
  assert.ok(result.highestCategory.percentage > 0);
  assert.ok(result.highestCategory.weeklyKgCO2e > 0);
});

// 6. Input negatif dan tidak valid ditangani dengan benar
test("6. Input negatif, kosong, float, dan string tidak valid disanitasi menjadi integer nonnegatif", () => {
  assert.equal(sanitizeItemCount(-10), 0);
  assert.equal(sanitizeItemCount("-5"), 0);
  assert.equal(sanitizeItemCount("abc"), 0);
  assert.equal(sanitizeItemCount(null), 0);
  assert.equal(sanitizeItemCount(undefined), 0);
  assert.equal(sanitizeItemCount(NaN), 0);
  assert.equal(sanitizeItemCount(4.9), 4); // Floor integer

  const sanitizedInput = sanitizeCalculatorInput({
    kantongPlastik: -15,
    wadahMakanan: "bukan_angka" as unknown as number,
    botolMinum: 3.7,
    wadahStyrofoam: -0.5,
  });

  assert.equal(sanitizedInput.kantongPlastik, 0);
  assert.equal(sanitizedInput.wadahMakanan, 0);
  assert.equal(sanitizedInput.botolMinum, 3);
  assert.equal(sanitizedInput.wadahStyrofoam, 0);

  // Perhitungan dari input yang disanitasi tidak boleh menghasilkan NaN
  const result = calculateCarbonFootprint(sanitizedInput);
  assert.equal(typeof result.totalWeeklyKgCO2e, "number");
  assert.ok(!Number.isNaN(result.totalWeeklyKgCO2e));
});

// 7. Penggunaan ulang barang yang sama tidak dihitung sebagai barang baru tambahan
test("7. Aturan penggunaan ulang: botol yang diisi ulang berkali-kali tetap dihitung 1 barang baru", () => {
  // Skenario A: Mahasiswa A membeli 1 botol baru dan mengisinya ulang 5 kali dalam 1 minggu
  const inputSatuBotolIsiUlang = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 1, // Dihitung 1 botol baru
    wadahStyrofoam: 0,
  };
  const resultSatu = calculateCarbonFootprint(inputSatuBotolIsiUlang);

  // Skenario B: Mahasiswa B membeli 5 botol baru yang berbeda
  const inputLimaBotolBaru = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 5, // Dihitung 5 botol baru
    wadahStyrofoam: 0,
  };
  const resultLima = calculateCarbonFootprint(inputLimaBotolBaru);

  // Emisi 1 botol yang diisi ulang harus 1/5 dari emisi 5 botol baru
  assert.equal(resultSatu.categories.botol_minum.weeklyKgCO2e, 0.083);
  assert.equal(resultLima.categories.botol_minum.weeklyKgCO2e, 0.415);
  assert.ok(resultSatu.totalWeeklyKgCO2e < resultLima.totalWeeklyKgCO2e);

  // Skenario C: Mahasiswa C menggunakan botol dari minggu lalu (0 botol baru minggu ini)
  const inputMingguLalu = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const resultMingguLalu = calculateCarbonFootprint(inputMingguLalu);
  assert.equal(resultMingguLalu.totalWeeklyKgCO2e, 0);
});

// 8. Dynamic green actions derived from weekly plastic inputs
test("8. Rekomendasi Green Action menghasilkan penghematan positif yang diturunkan dari input mingguan", () => {
  const input = {
    kantongPlastik: 6,
    wadahMakanan: 5,
    botolMinum: 4,
    wadahStyrofoam: 2,
  };
  const result = calculateCarbonFootprint(input);
  const actions = getPersonalizedGreenActions(input, result);

  assert.ok(actions.length > 0);

  // Aksi tumbler harus aplikatif dan menghemat 4 * 0.083 = 0.332 kg CO2e/minggu
  const tumblerAction = actions.find((a) => a.id === "action_tumbler_sendiri");
  assert.ok(tumblerAction);
  assert.equal(tumblerAction.isApplicable, true);
  assert.equal(tumblerAction.potentialWeeklySavingKgCO2e, 0.332);

  // Aksi kantong kain harus menghemat 6 * 0.033 = 0.198 kg CO2e/minggu
  const bagAction = actions.find((a) => a.id === "action_kantong_kain");
  assert.ok(bagAction);
  assert.equal(bagAction.potentialWeeklySavingKgCO2e, 0.198);

  // Penghematan tidak boleh melebihi total emisi mingguan
  const totalWeeklySavings = actions.reduce(
    (sum, a) => sum + a.potentialWeeklySavingKgCO2e,
    0
  );
  assert.ok(totalWeeklySavings > 0);
  assert.ok(totalWeeklySavings <= result.totalWeeklyKgCO2e * 1.05);
});

// ==============================================================================
// VALIDASI ILMIAH FAKTOR EMISI (DIPISAHKAN DARI LOGIKA KALKULASI)
// ==============================================================================
test("9. Validasi Ilmiah Faktor Emisi: Memiliki rujukan resmi, tahun, massa, dan batas sistem LCA", () => {
  const factors = PLASTIC_EMISSION_FACTORS;

  // 1. Kantong plastik HDPE (0.033 kg CO2e/buah, massa ~10g, UK Environment Agency / DEFRA)
  assert.equal(factors.kantong_plastik.value, 0.033);
  assert.equal(factors.kantong_plastik.unit, "kg CO₂e / buah");
  assert.equal(factors.kantong_plastik.materialMassGrams, 10);
  assert.ok(factors.kantong_plastik.source.includes("Environment Agency"));
  assert.ok(factors.kantong_plastik.systemBoundary.toLowerCase().includes("cradle-to-grave"));

  // 2. Wadah makanan plastik PP (0.155 kg CO2e/buah, massa ~30g, Gallego-Schmid et al. / Prevent Waste)
  assert.equal(factors.wadah_makanan.value, 0.155);
  assert.equal(factors.wadah_makanan.unit, "kg CO₂e / buah");
  assert.equal(factors.wadah_makanan.materialMassGrams, 30);
  assert.ok(factors.wadah_makanan.source.includes("Gallego-Schmid"));
  assert.ok(factors.wadah_makanan.systemBoundary.toLowerCase().includes("cradle-to-grave"));

  // 3. Botol minum plastik PET (0.083 kg CO2e/buah, massa ~20g, PlasticsEurope & DEFRA)
  assert.equal(factors.botol_minum.value, 0.083);
  assert.equal(factors.botol_minum.unit, "kg CO₂e / buah");
  assert.equal(factors.botol_minum.materialMassGrams, 20);
  assert.ok(factors.botol_minum.source.includes("PlasticsEurope"));
  assert.ok(factors.botol_minum.systemBoundary.toLowerCase().includes("cradle-to-grave"));

  // 4. Wadah styrofoam EPS (0.035 kg CO2e/buah, massa ~5g, Zero Waste Scotland & ACC)
  assert.equal(factors.wadah_styrofoam.value, 0.035);
  assert.equal(factors.wadah_styrofoam.unit, "kg CO₂e / buah");
  assert.equal(factors.wadah_styrofoam.materialMassGrams, 5);
  assert.ok(factors.wadah_styrofoam.source.includes("Zero Waste Scotland"));
  assert.ok(factors.wadah_styrofoam.systemBoundary.toLowerCase().includes("cradle-to-grave"));
});

test("10. Asumsi konversi mingguan ke bulanan dan tahunan konsisten", () => {
  const input = {
    kantongPlastik: 10,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const result = calculateCarbonFootprint(input);

  // 10 * 0.033 = 0.33 kg CO2e/minggu
  assert.equal(result.totalWeeklyKgCO2e, 0.33);

  // Tahunan: 0.33 * 52 = 17.16 kg CO2e/tahun
  assert.equal(result.totalYearlyKgCO2e, 17.16);

  // Bulanan: 17.16 / 12 = 1.43 kg CO2e/bulan
  assert.equal(result.totalMonthlyKgCO2e, 1.43);
});
