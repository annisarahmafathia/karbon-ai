import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculateCarbonFootprint } from "../lib/calculator/engine";
import {
  generateRuleBasedGreenActions,
  sortRecommendationsByFootprint,
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

test("7. Jika beberapa faktor memiliki kontribusi emisi sama, tampilkan semuanya sebagai faktor tertinggi (Tied)", () => {
  // Skenario: 35 kantong plastik (35 * 0.033 = 1.155 kg CO₂e) dan 33 wadah styrofoam (33 * 0.035 = 1.155 kg CO₂e)
  // Kedua kategori memiliki nilai emisi mingguan sama persis (1.155 kg CO₂e)
  const inputTied = {
    kantongPlastik: 35,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 33,
  };
  const resultTied = calculateCarbonFootprint(inputTied);

  assert.equal(resultTied.categories.kantong_plastik.weeklyKgCO2e, 1.155);
  assert.equal(resultTied.categories.wadah_styrofoam.weeklyKgCO2e, 1.155);

  const greenActions = generateRuleBasedGreenActions(inputTied, resultTied);

  // Verifikasi deteksi faktor imbang
  assert.equal(greenActions.primaryPriority.isTied, true);
  assert.ok(greenActions.primaryPriority.allTopContributors);
  assert.equal(greenActions.primaryPriority.allTopContributors.length, 2);

  const topCategories = greenActions.primaryPriority.allTopContributors.map((c) => c.category);
  assert.ok(topCategories.includes("kantong_plastik"));
  assert.ok(topCategories.includes("wadah_styrofoam"));

  // Kedua aksi yang menargetkan faktor imbang harus berstatus "Utama"
  const primaryActions = greenActions.recommendations.filter((a) => a.priority === "Utama");
  assert.equal(primaryActions.length, 2);
  const primaryActionCats = primaryActions.map((a) => a.category);
  assert.ok(primaryActionCats.includes("kantong_plastik"));
  assert.ok(primaryActionCats.includes("wadah_styrofoam"));
});

test("8. Teks rekomendasi menyebutkan faktor yang ingin dikurangi secara eksplisit dengan format penekanan bold", () => {
  const input = {
    kantongPlastik: 2,
    wadahMakanan: 5, // 5 * 0.155 = 0.775 kg CO2e (Tertinggi)
    botolMinum: 2,
    wadahStyrofoam: 0,
  };
  const result = calculateCarbonFootprint(input);
  const greenActions = generateRuleBasedGreenActions(input, result);

  // Aksi prioritas utama (wadah makanan)
  const mainAction = greenActions.recommendations[0];
  assert.equal(mainAction.category, "wadah_makanan");
  assert.equal(mainAction.targetFactor, "Wadah Makanan Plastik");
  assert.equal(mainAction.isPrimaryContributorAction, true);
  // Alasan harus memuat nama kategori secara eksplisit dan penekanan penyumbang emisi terbesar
  assert.ok(mainAction.reason.includes("**Wadah Makanan Plastik**"));
  assert.ok(mainAction.reason.toLowerCase().includes("penyumbang emisi terbesar"));

  // Aksi sekunder juga menyebutkan target faktornya
  const secondaryAction = greenActions.recommendations.find((a) => a.category === "botol_minum");
  assert.ok(secondaryAction);
  assert.equal(secondaryAction.priority, "Tambahan");
  assert.equal(secondaryAction.targetFactor, "Botol Minum Plastik");
  assert.ok(secondaryAction.reason.includes("**Botol Minum Plastik**"));
});

test("9. Ketika data emisi 0 / kosong, tidak menetapkan faktor penyumbang emisi secara sembarangan", () => {
  const zeroInput = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const zeroResult = calculateCarbonFootprint(zeroInput);
  const greenActions = generateRuleBasedGreenActions(zeroInput, zeroResult);

  assert.equal(greenActions.primaryPriority.hasValidData, false);
  assert.equal(greenActions.primaryPriority.allTopContributors?.length, 0);
  assert.equal(greenActions.primaryPriority.weeklyKgCO2e, 0);
  assert.ok(greenActions.primaryPriority.categoryLabel.includes("Belum Ada Emisi Terdeteksi"));
  assert.ok(greenActions.primaryPriority.explanation.includes("tidak ada faktor penyumbang emisi terbesar"));
});

test("10. habitAnalysis dan primaryPriority.explanation memiliki fungsi terpisah dan tidak repetitif", () => {
  const input = {
    kantongPlastik: 5,
    wadahMakanan: 0,
    botolMinum: 8, // 8 * 0.083 = 0.664 kg CO2e (Tertinggi)
    wadahStyrofoam: 0,
  };
  const result = calculateCarbonFootprint(input);
  const greenActions = generateRuleBasedGreenActions(input, result);

  // habitAnalysis: Fokus pada analisis pola konsumsi & emisi
  assert.ok(greenActions.habitAnalysis.includes("13 barang plastik sekali pakai"));
  assert.ok(greenActions.habitAnalysis.includes("Botol Minum"));
  assert.ok(greenActions.habitAnalysis.includes("Kantong Plastik"));
  assert.ok(greenActions.habitAnalysis.includes("ekstraksi minyak bumi"));

  // primaryPriority.explanation: Fokus pada tindakan konkret (bukan mengulang data emisi)
  assert.ok(greenActions.primaryPriority.explanation.toLowerCase().includes("tumbler"));
  assert.ok(greenActions.primaryPriority.explanation.toLowerCase().includes("isi ulang"));
  // Memastikan tidak ada pengulangan paragraf analisis yang kaku
  assert.ok(!greenActions.primaryPriority.explanation.includes("Berdasarkan data kalkulasi"));
});

test("11. Rekomendasi tindakan prioritas utama berubah dinamis sesuai faktor terbesar", () => {
  // Skenario 1: Styrofoam terbesar
  const inputStyrofoam = { kantongPlastik: 0, wadahMakanan: 0, botolMinum: 0, wadahStyrofoam: 6 };
  const actionsStyrofoam = generateRuleBasedGreenActions(inputStyrofoam, calculateCarbonFootprint(inputStyrofoam));
  assert.ok(actionsStyrofoam.primaryPriority.explanation.toLowerCase().includes("mistin") || actionsStyrofoam.primaryPriority.explanation.toLowerCase().includes("kotak bekal"));

  // Skenario 2: Kantong Plastik terbesar
  const inputKantong = { kantongPlastik: 20, wadahMakanan: 0, botolMinum: 0, wadahStyrofoam: 0 };
  const actionsKantong = generateRuleBasedGreenActions(inputKantong, calculateCarbonFootprint(inputKantong));
  assert.ok(actionsKantong.primaryPriority.explanation.toLowerCase().includes("tas belanja kain") || actionsKantong.primaryPriority.explanation.toLowerCase().includes("tote bag"));

  // Skenario 3: Wadah Makanan terbesar
  const inputWadah = { kantongPlastik: 0, wadahMakanan: 4, botolMinum: 0, wadahStyrofoam: 0 };
  const actionsWadah = generateRuleBasedGreenActions(inputWadah, calculateCarbonFootprint(inputWadah));
  assert.ok(actionsWadah.primaryPriority.explanation.toLowerCase().includes("kotak bekal reusable") || actionsWadah.primaryPriority.explanation.toLowerCase().includes("food-grade"));
});

test("12. Urutan rekomendasi otomatis mengutamakan kategori dengan estimasi emisi mingguan terbesar", () => {
  // Skenario 4 kategori aktif dengan nilai emisi bertingkat:
  // wadah_makanan: 4 * 0.155 = 0.62 kg CO2e (Terbesar ke-1)
  // botol_minum: 5 * 0.083 = 0.415 kg CO2e (Terbesar ke-2)
  // kantong_plastik: 8 * 0.033 = 0.264 kg CO2e (Terbesar ke-3)
  // wadah_styrofoam: 2 * 0.035 = 0.07 kg CO2e (Terbesar ke-4)
  const input = {
    kantongPlastik: 8,
    wadahMakanan: 4,
    botolMinum: 5,
    wadahStyrofoam: 2,
  };
  const result = calculateCarbonFootprint(input);
  const greenActions = generateRuleBasedGreenActions(input, result);

  assert.equal(greenActions.recommendations.length, 4);
  assert.equal(greenActions.recommendations[0].category, "wadah_makanan");
  assert.equal(greenActions.recommendations[1].category, "botol_minum");
  assert.equal(greenActions.recommendations[2].category, "kantong_plastik");
  assert.equal(greenActions.recommendations[3].category, "wadah_styrofoam");

  // Uji juga fungsi utilitas sortRecommendationsByFootprint secara langsung
  const reversed = [...greenActions.recommendations].reverse();
  const sorted = sortRecommendationsByFootprint(reversed, result);
  assert.equal(sorted[0].category, "wadah_makanan");
  assert.equal(sorted[1].category, "botol_minum");
  assert.equal(sorted[2].category, "kantong_plastik");
  assert.equal(sorted[3].category, "wadah_styrofoam");
});

test("13. Konsistensi urutan alternatif (tie-breaker) ketika emisi dua kategori bernilai sama", () => {
  // Skenario: 35 kantong plastik (1.155 kg CO2e) dan 33 wadah styrofoam (1.155 kg CO2e)
  // Nilai emisi sama persis.
  // Urutan tie-breaker deterministik KarbonAI: kantong_plastik (order 3) mendahului wadah_styrofoam (order 4)
  const inputTied = {
    kantongPlastik: 35,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 33,
  };
  const resultTied = calculateCarbonFootprint(inputTied);
  const greenActions = generateRuleBasedGreenActions(inputTied, resultTied);

  assert.equal(greenActions.recommendations.length, 2);
  assert.equal(greenActions.recommendations[0].category, "kantong_plastik");
  assert.equal(greenActions.recommendations[1].category, "wadah_styrofoam");

  // Jalankan berulang kali untuk memastikan deterministik 100%
  for (let i = 0; i < 5; i++) {
    const actions = sortRecommendationsByFootprint([...greenActions.recommendations].reverse(), resultTied);
    assert.equal(actions[0].category, "kantong_plastik");
    assert.equal(actions[1].category, "wadah_styrofoam");
  }
});

test("14. Kondisi data belum tersedia / zero plastic menyediakan rekomendasi umum untuk 4 kategori tanpa klaim prioritas personal", () => {
  const zeroInput = {
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  };
  const zeroResult = calculateCarbonFootprint(zeroInput);
  const greenActions = generateRuleBasedGreenActions(zeroInput, zeroResult);

  // Menyediakan 4 rekomendasi umum lengkap untuk setiap kategori
  assert.equal(greenActions.recommendations.length, 4);

  const categories = greenActions.recommendations.map((a) => a.category);
  assert.ok(categories.includes("kantong_plastik"));
  assert.ok(categories.includes("wadah_makanan"));
  assert.ok(categories.includes("botol_minum"));
  assert.ok(categories.includes("wadah_styrofoam"));

  // Seluruh rekomendasi umum tidak mengklaim penghematan emisi numerik fiktif
  for (const act of greenActions.recommendations) {
    assert.equal(act.potentialImpact.weeklySavingKgCO2e, null);
    assert.equal(act.potentialImpact.monthlySavingKgCO2e, null);
    assert.equal(act.isPrimaryContributorAction, false);
  }
});

test("15. Halaman Green Action menghapus filter prioritas manual dan mempertahankan filter kategori", () => {
  const pagePath = path.resolve(__dirname, "../app/(app)/green-action/page.tsx");
  const pageCode = fs.readFileSync(pagePath, "utf-8");

  // Filter prioritas manual harus sudah dihapus dari UI dan state
  assert.ok(!pageCode.includes("selectedPriority"), "selectedPriority state masih tertinggal");
  assert.ok(!pageCode.includes("setSelectedPriority"), "setSelectedPriority handler masih tertinggal");
  assert.ok(!pageCode.includes("Prioritas:"), "Label UI 'Prioritas:' masih tertinggal");

  // Filter kategori wajib dipertahankan
  assert.ok(pageCode.includes("selectedCategory"), "Filter kategori hilang");
  assert.ok(pageCode.includes("Semua Kategori"), "Pilihan 'Semua Kategori' hilang");
  assert.ok(pageCode.includes("kantong_plastik"), "Pilihan 'kantong_plastik' hilang");
  assert.ok(pageCode.includes("wadah_makanan"), "Pilihan 'wadah_makanan' hilang");
  assert.ok(pageCode.includes("botol_minum"), "Pilihan 'botol_minum' hilang");
  assert.ok(pageCode.includes("wadah_styrofoam"), "Pilihan 'wadah_styrofoam' hilang");

  // Fungsi pengurutan otomatis terhubung ke perhitungan emisi mingguan
  assert.ok(pageCode.includes("sortRecommendationsByFootprint"), "Fungsi pengurutan otomatis tidak terhubung");
});


