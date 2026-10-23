import test from "node:test";
import assert from "node:assert/strict";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import {
  generateRuleBasedGreenActions,
} from "../lib/ai/green-action";
import { POST as greenActionPostHandler } from "../app/api/green-action/route";
import { NextRequest } from "next/server";
import { PLASTIC_EMISSION_FACTORS } from "../lib/constants/emission-factors";

test("1. Kategori dengan kontribusi emisi CO₂e terbesar diprioritaskan dengan benar", () => {
  // Skenario: 10 kantong plastik (10 * 0.033 = 0.33 kg) vs 4 wadah makanan (4 * 0.155 = 0.62 kg)
  // Meskipun kantong plastik lebih banyak secara jumlah barang (10 > 4),
  // emisi wadah makanan jauh lebih besar (0.62 > 0.33 kg CO₂e).
  // Sistem HARUS memprioritaskan wadah makanan sebagai fokus utama!
  const input = {
    kantongPlastik: 10,
    wadahMakanan: 4,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const result = calculateCarbonFootprint(input);

  // Verifikasi hasil kalkulasi dasar
  assert.equal(result.categories.kantong_plastik.weeklyKgCO2e, 0.33);
  assert.equal(result.categories.wadah_makanan.weeklyKgCO2e, 0.62);
  assert.equal(result.highestCategory.category, "wadah_makanan");

  const greenActions = generateRuleBasedGreenActions(input, result);

  // Prioritas utama harus wadah makanan
  assert.equal(greenActions.primaryPriority.category, "wadah_makanan");
  assert.equal(greenActions.primaryPriority.weeklyKgCO2e, 0.62);

  // Tindakan pertama dalam rekomendasi harus berstatus "Utama" dan menargetkan wadah makanan
  const primaryAction = greenActions.recommendations[0];
  assert.ok(primaryAction);
  assert.equal(primaryAction.priority, "Utama");
  assert.equal(primaryAction.category, "wadah_makanan");

  // Tindakan kantong plastik harus berstatus "Tambahan"
  const bagAction = greenActions.recommendations.find((a) => a.category === "kantong_plastik");
  assert.ok(bagAction);
  assert.equal(bagAction.priority, "Tambahan");
});

test("2. Hasil rekomendasi berubah secara dinamis ketika profil emisi pengguna berubah", () => {
  // Profil A: Mahasiswa dengan dominasi botol air mineral (15 botol/minggu)
  const profileBottle = {
    kantongPlastik: 1,
    wadahMakanan: 0,
    botolMinum: 15,
    wadahStyrofoam: 0,
  };
  const resultBottle = calculateCarbonFootprint(profileBottle);
  const actionsBottle = generateRuleBasedGreenActions(profileBottle, resultBottle);

  assert.equal(actionsBottle.primaryPriority.category, "botol_minum");
  assert.equal(actionsBottle.recommendations[0].category, "botol_minum");
  assert.equal(actionsBottle.recommendations[0].priority, "Utama");
  assert.ok(actionsBottle.recommendations[0].title.toLowerCase().includes("tumbler"));

  // Profil B: Mahasiswa dengan dominasi kemasan styrofoam (10 bungkus/minggu)
  const profileStyrofoam = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 1,
    wadahStyrofoam: 10,
  };
  const resultStyrofoam = calculateCarbonFootprint(profileStyrofoam);
  const actionsStyrofoam = generateRuleBasedGreenActions(profileStyrofoam, resultStyrofoam);

  assert.equal(actionsStyrofoam.primaryPriority.category, "wadah_styrofoam");
  assert.equal(actionsStyrofoam.recommendations[0].category, "wadah_styrofoam");
  assert.equal(actionsStyrofoam.recommendations[0].priority, "Utama");
  assert.ok(actionsStyrofoam.recommendations[0].title.toLowerCase().includes("styrofoam"));

  // Profil C: Mahasiswa dengan dominasi kantong kresek (20 kantong/minggu)
  const profileBags = {
    kantongPlastik: 20,
    wadahMakanan: 1,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const resultBags = calculateCarbonFootprint(profileBags);
  const actionsBags = generateRuleBasedGreenActions(profileBags, resultBags);

  assert.equal(actionsBags.primaryPriority.category, "kantong_plastik");
  assert.equal(actionsBags.recommendations[0].category, "kantong_plastik");
  assert.ok(actionsBags.recommendations[0].title.toLowerCase().includes("tas belanja"));
});

test("3. Pengurangan emisi didasarkan pada faktor emisi valid dan tidak melebihi emisi kategori", () => {
  const input = {
    kantongPlastik: 5,
    wadahMakanan: 6,
    botolMinum: 8,
    wadahStyrofoam: 4,
  };
  const result = calculateCarbonFootprint(input);
  const greenActions = generateRuleBasedGreenActions(input, result);

  for (const action of greenActions.recommendations) {
    const weeklySaving = action.potentialImpact.weeklySavingKgCO2e;
    assert.ok(weeklySaving !== null);
    assert.ok(weeklySaving > 0, "Penghematan harus positif");

    const categoryEmissions = result.categories[action.category].weeklyKgCO2e;
    assert.ok(
      weeklySaving <= categoryEmissions + 0.001,
      `Penghematan (${weeklySaving}) tidak boleh melebihi emisi kategori (${categoryEmissions})`
    );

    // Verifikasi rumus linier faktor emisi
    if (action.category === "kantong_plastik") {
      const expected = Math.round(5 * PLASTIC_EMISSION_FACTORS.kantong_plastik.value * 1000) / 1000;
      assert.equal(weeklySaving, expected);
    }
    if (action.category === "botol_minum") {
      const expected = Math.round(8 * PLASTIC_EMISSION_FACTORS.botol_minum.value * 1000) / 1000;
      assert.equal(weeklySaving, expected);
    }
  }
});

test("4. Penanganan kondisi data kosong / Zero-Waste Hero", () => {
  const zeroInput = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const zeroResult = calculateCarbonFootprint(zeroInput);
  const greenActions = generateRuleBasedGreenActions(zeroInput, zeroResult);

  assert.equal(greenActions.isZeroPlasticHero, true);
  assert.equal(greenActions.primaryPriority.weeklyKgCO2e, 0);
  assert.ok(greenActions.habitAnalysis.includes("0 penggunaan plastik"));
  assert.ok(greenActions.recommendations.length > 0);
  // Pada status zero-waste, penghematan adalah 0 atau null (bukan angka halusinasi)
  assert.equal(greenActions.recommendations[0].potentialImpact.weeklySavingKgCO2e, null);
});

test("5. API Route Server-Side: Berjalan lancar dan tidak membocorkan API Key ke client", async () => {
  const testApiKey = "secret_gemini_key_test_123456";
  const originalKey = process.env.GEMINI_API_KEY;

  try {
    process.env.GEMINI_API_KEY = testApiKey;

    const req = new NextRequest("http://localhost:3000/api/green-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { kantongPlastik: 4, wadahMakanan: 2, botolMinum: 3, wadahStyrofoam: 1 },
      }),
    });

    const res = await greenActionPostHandler(req);
    assert.equal(res.status, 200);

    const bodyText = await res.text();
    // Kunci API rahasia TIDAK BOLEH muncul di respons client
    assert.ok(!bodyText.includes(testApiKey), "API key rahasia bocor di response body!");

    const json = JSON.parse(bodyText);
    assert.equal(json.success, true);
    assert.ok(json.data.primaryPriority);
    assert.ok(Array.isArray(json.data.recommendations));
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
});

test("6. API Route Server-Side: Fallback graceful saat API Key tidak ada atau input rusak", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;

    // Test input valid tanpa API key -> fallback berbasis aturan
    const req = new NextRequest("http://localhost:3000/api/green-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { kantongPlastik: 5, wadahMakanan: 0, botolMinum: 0, wadahStyrofoam: 0 },
      }),
    });

    const res = await greenActionPostHandler(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.isAiGenerated, false);
    assert.equal(json.source, "rule_based_fallback");
    assert.ok(json.message?.includes("GEMINI_API_KEY"));
    assert.equal(json.data.primaryPriority.category, "kantong_plastik");
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
});
