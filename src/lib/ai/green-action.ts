import {
  CalculationResult,
  PlasticCalculatorInput,
  PlasticCategory,
} from "@/types/carbon";
import {
  GreenActionAnalysisResult,
  PersonalizedAction,
  PrimaryPriorityInfo,
} from "@/types/green-action";
import { PLASTIC_EMISSION_FACTORS } from "@/lib/constants/emission-factors";

const CATEGORY_NAMES: Record<PlasticCategory, string> = {
  kantong_plastik: "Kantong Plastik",
  wadah_makanan: "Wadah Makanan Plastik",
  botol_minum: "Botol Minum Plastik",
  wadah_styrofoam: "Wadah Styrofoam",
};

/**
 * Generator Rekomendasi Berbasis Aturan Ilmiah (Fallback Terverifikasi)
 * Digunakan jika API AI belum dikonfigurasi atau mengalami gangguan jaringan.
 * Menggunakan data aktual pengguna dan faktor emisi ilmiah KarbonAI tanpa manipulasi angka.
 */
export function generateRuleBasedGreenActions(
  input: PlasticCalculatorInput,
  result: CalculationResult
): GreenActionAnalysisResult {
  const isZero = result.totalItemsPerWeek === 0 || result.totalWeeklyKgCO2e === 0;

  if (isZero) {
    return {
      habitAnalysis:
        "Luar biasa! Kamu mencatatkan 0 penggunaan plastik sekali pakai baru minggu ini. Gaya hidup ramah lingkunganmu sudah sangat optimal dan menjadi inspirasi nyata bagi lingkungan sekitarmu.",
      primaryPriority: {
        category: "botol_minum",
        categoryLabel: "Gaya Hidup Zero-Waste",
        weeklyKgCO2e: 0,
        percentage: 0,
        itemCountPerWeek: 0,
        explanation:
          "Tidak ada emisi plastik sekali pakai yang perlu dikurangi minggu ini. Fokus utamamu adalah mempertahankan kebiasaan baik ini dan menginspirasi teman-temanmu.",
      },
      isZeroPlasticHero: true,
      recommendations: [
        {
          id: "rule_hero_maintain",
          category: "botol_minum",
          categoryLabel: "Pemeliharaan Kebiasaan",
          priority: "Utama",
          title: "Pertahankan Perlengkapan Reusable & Ajak Teman Sekitarmu",
          reason:
            "Kamu sudah berhasil menghindari plastik sekali pakai secara konsisten. Langkah terbaik adalah menjaga peralatan pakai ulang tetap bersih dan menularkan kebiasaan ini ke lingkaran pertemanan kampus.",
          practicalSteps: [
            "Pastikan tumbler dan kotak makan selalu dicuci bersih dan siap di dalam tas sebelum berangkat kuliah.",
            "Bagikan pengalaman dan tips praktis membawa wadah sendiri saat makan bareng teman di warung kampus.",
            "Dukung warung dan kantin kampus yang pro-lingkungan dan memfasilitasi wadah pribadi.",
          ],
          potentialImpact: {
            weeklySavingKgCO2e: null,
            monthlySavingKgCO2e: null,
            formattedSaving: "Bebas Emisi (0 kg CO₂e)",
            qualitativeBenefit:
              "Mencegah timbulan sampah baru secara permanen dan membangun budaya peduli lingkungan.",
          },
          difficulty: "Mudah",
          financialBenefit: "Menghemat pengeluaran harian hingga ratusan ribu rupiah per bulan",
          localContext:
            "Kampus di Darussalam sangat terbantu oleh mahasiswa yang aktif menjalankan budaya zero-waste sehari-hari.",
        },
      ],
    };
  }

  const highestCat = result.highestCategory.category;
  const highestLabel = CATEGORY_NAMES[highestCat];
  const highestEmission = result.highestCategory.weeklyKgCO2e;
  const highestPercent = result.highestCategory.percentage;
  const highestItems = result.highestCategory.itemCountPerWeek;

  // Analisis kebiasaan berdasarkan data aktual
  const activeCategoriesCount = [
    input.kantongPlastik > 0,
    input.wadahMakanan > 0,
    input.botolMinum > 0,
    input.wadahStyrofoam > 0,
  ].filter(Boolean).length;

  let habitSummary = `Berdasarkan kalkulasi mingguan, kamu menggunakan total ${result.totalItemsPerWeek} barang plastik sekali pakai yang menghasilkan ~${result.totalWeeklyKgCO2e} kg CO₂e/minggu. `;
  if (activeCategoriesCount === 1) {
    habitSummary += `Emisi plastikmu sepenuhnya terkonsentrasi pada ${highestLabel}, sehingga fokus pada satu kebiasaan ini akan langsung memangkas jejak karbonmu secara drastis.`;
  } else {
    habitSummary += `Penyumbang emisi terbesarmu adalah ${highestLabel} sebesar ${highestPercent}% dari total emisi. Mengingat faktor emisi ${highestLabel} yang signifikan, intervensi pada kategori ini memberikan dampak penurunan terbesar.`;
  }

  const primaryPriority: PrimaryPriorityInfo = {
    category: highestCat,
    categoryLabel: highestLabel,
    weeklyKgCO2e: highestEmission,
    percentage: highestPercent,
    itemCountPerWeek: highestItems,
    explanation: `${highestLabel} menyumbang ${highestPercent}% dari seluruh emisi mingguanmu (~${highestEmission} kg CO₂e/minggu dari ${highestItems} barang). Mengurangi kategori ini merupakan prioritas paling efektif.`,
  };

  const recommendations: PersonalizedAction[] = [];

  // Urutkan kategori berdasarkan emisi mingguan tertinggi ke terendah
  const sortedCategories: PlasticCategory[] = (
    ["wadah_makanan", "botol_minum", "kantong_plastik", "wadah_styrofoam"] as PlasticCategory[]
  ).sort(
    (a, b) => result.categories[b].weeklyKgCO2e - result.categories[a].weeklyKgCO2e
  );

  for (const cat of sortedCategories) {
    const catResult = result.categories[cat];
    const itemCount = catResult.itemCountPerWeek;
    if (itemCount <= 0) continue;

    const isPrimary = cat === highestCat;
    const factor = PLASTIC_EMISSION_FACTORS[cat].value;

    if (cat === "kantong_plastik") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Tas Belanja Lipat (Tote Bag) & Tolak Kantong Kresek",
        reason: `Kamu menggunakan ${itemCount} kantong kresek baru per minggu. Karena kantong plastik sering kali hanya dipakai beberapa menit sebelum dibuang, membawa tas kain lipat akan langsung mengeliminasi sampah ini.`,
        practicalSteps: [
          "Selalu selipkan 1 tas belanja kain lipat di saku atau kompartemen depan ransel kuliahmu.",
          "Ucapkan secara proaktif ke kasir minimarket atau pedagang: 'Tidak usah pakai kantong kresek ya, Kak/Bang.'",
          "Kumpulkan barang belanjaan kecil langsung ke dalam tas tanpa kantong terpisah.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: saving,
          monthlySavingKgCO2e: Math.round(saving * (52 / 12) * 100) / 100,
          formattedSaving: `~${saving} kg CO₂e / minggu`,
          qualitativeBenefit:
            "Mencegah sumbatan drainase kota dan mengurangi sampah kantong plastik di TPA.",
        },
        difficulty: "Mudah",
        financialBenefit: "Bebas biaya kantong plastik berbayar di supermarket dan minimarket.",
        localContext:
          "Pedagang di Pasar Rukoh, Peunayong, dan minimarket sekitar kampus sangat terbiasa dengan pembeli yang membawa tas belanja sendiri.",
      });
    } else if (cat === "wadah_makanan") {
      // Asumsi substitusi 80% wadah bawa pulang
      const reducedItems = Math.max(1, Math.round(itemCount * 0.8));
      const saving = Math.round(reducedItems * factor * 1000) / 1000;
      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Kotak Makan Sendiri Saat Beli Makanan Bawa Pulang (Takeaway)",
        reason: `Wadah makanan plastik memiliki faktor emisi tinggi (${factor} kg CO₂e/buah) karena massanya yang tebal (~25 gram). Mengurangi ${reducedItems} dari ${itemCount} wadah per minggu memberikan dampak pengurangan emisi terbesar.`,
        practicalSteps: [
          "Bawa wadah makan bersekat atau thinwall tebal yang bisa dicuci ulang saat pergi keluar beli makan.",
          "Serahkan kotak makanmu saat memesan mie aceh, nasi gurih, atau lauk makan siang di warung.",
          "Jika makan di tempat, pilih piring atau mangkuk daripada wadah bungkus jika tidak terburu-buru.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: saving,
          monthlySavingKgCO2e: Math.round(saving * (52 / 12) * 100) / 100,
          formattedSaving: `~${saving} kg CO₂e / minggu`,
          qualitativeBenefit:
            "Menghindari paparan mikroplastik dan zat kimia berbahaya saat makanan masih panas.",
        },
        difficulty: "Sedang",
        financialBenefit:
          "Banyak penjual warung nasi memberikan porsi lebih saat pembeli membawa wadah sendiri!",
        localContext:
          "Warung nasi dan warung mie di seputaran kampus USK/UIN sangat ramah melayani pesanan dengan wadah bawaan pembeli.",
      });
    } else if (cat === "botol_minum") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Tumbler & Manfaatkan Stasiun Pengisian Air Minum Kampus",
        reason: `Kamu membeli ${itemCount} botol plastik baru per minggu (~${catResult.weeklyKgCO2e} kg CO₂e). Membawa tumbler dan mengisi ulang air minum akan menghapus 100% jejak karbon kategori ini.`,
        practicalSteps: [
          "Isi penuh tumbler air minum dari kos sebelum berangkat kuliah di pagi hari.",
          "Manfaatkan dispenser galon di fakultas, perpustakaan, atau musholla kampus untuk isi ulang gratis.",
          "Bawa tumbler saat nongkrong di kafe/warkop untuk memesan minuman dingin.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: saving,
          monthlySavingKgCO2e: Math.round(saving * (52 / 12) * 100) / 100,
          formattedSaving: `~${saving} kg CO₂e / minggu`,
          qualitativeBenefit:
            "Air minum tetap dingin/hangat lebih lama dan tubuh terhidrasi secara sehat sepanjang hari.",
        },
        difficulty: "Mudah",
        financialBenefit:
          "Menghemat anggaran beli air mineral botol ~Rp 20.000 - 50.000 setiap minggunya.",
        localContext:
          "Kampus di Darussalam menyediakan fasilitas air minum isi ulang di berbagai gedung perkuliahan.",
      });
    } else if (cat === "wadah_styrofoam") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Tolak Kemasan Styrofoam & Pilih Bungkus Daun / Kertas Cokelat",
        reason: `Kamu menggunakan ${itemCount} wadah styrofoam per minggu. Styrofoam sangat sulit terurai (ratusan tahun) dan mudah pecah menjadi mikroplastik berbahaya.`,
        practicalSteps: [
          "Minta penjual membungkus makanan dengan kertas nasi atau daun pisang jika ada.",
          "Bawa kotak makan sendiri saat membeli makanan cepat saji atau gorengan.",
          "Hindari menu makanan berkuah panas dimasukkan langsung ke dalam wadah styrofoam.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: saving,
          monthlySavingKgCO2e: Math.round(saving * (52 / 12) * 100) / 100,
          formattedSaving: `~${saving} kg CO₂e / minggu`,
          qualitativeBenefit:
            "Mencegah pelepasan zat stirena karsinogenik ke makanan hangat dan menjaga kesehatan tubuh.",
        },
        difficulty: "Mudah",
        financialBenefit: "Mendukung tradisi kuliner lokal yang ramah lingkungan.",
        localContext:
          "Kuliner tradisional Aceh seperti nasi gurih dan timphan secara alami dibungkus daun pisang yang jauh lebih sehat dan ramah lingkungan.",
      });
    }
  }

  return {
    habitAnalysis: habitSummary,
    primaryPriority,
    recommendations,
  };
}

/**
 * Panggilan ke Layanan AI Google Gemini (Server-Side Saja)
 * Menggunakan model Gemini via REST API resmi tanpa ketergantungan library eksternal besar.
 */
export async function generateGeminiGreenActions(
  input: PlasticCalculatorInput,
  result: CalculationResult
): Promise<GreenActionAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Siapkan data faktual yang presisi untuk prompt
  const highest = result.highestCategory;
  const promptData = {
    weeklyInputItems: {
      kantongPlastik: input.kantongPlastik,
      wadahMakanan: input.wadahMakanan,
      botolMinum: input.botolMinum,
      wadahStyrofoam: input.wadahStyrofoam,
      totalItemsPerWeek: result.totalItemsPerWeek,
    },
    weeklyEmissionsKgCO2e: {
      kantongPlastik: result.categories.kantong_plastik.weeklyKgCO2e,
      wadahMakanan: result.categories.wadah_makanan.weeklyKgCO2e,
      botolMinum: result.categories.botol_minum.weeklyKgCO2e,
      wadahStyrofoam: result.categories.wadah_styrofoam.weeklyKgCO2e,
      totalWeeklyKgCO2e: result.totalWeeklyKgCO2e,
    },
    emissionFactorsOfficial: {
      kantong_plastik: PLASTIC_EMISSION_FACTORS.kantong_plastik.value, // 0.033 kg CO2e / buah
      wadah_makanan: PLASTIC_EMISSION_FACTORS.wadah_makanan.value, // 0.155 kg CO2e / buah
      botol_minum: PLASTIC_EMISSION_FACTORS.botol_minum.value, // 0.083 kg CO2e / buah
      wadah_styrofoam: PLASTIC_EMISSION_FACTORS.wadah_styrofoam.value, // 0.035 kg CO2e / buah
    },
    primaryHotspot: {
      category: highest.category,
      categoryLabel: CATEGORY_NAMES[highest.category],
      weeklyKgCO2e: highest.weeklyKgCO2e,
      percentage: highest.percentage,
      itemCountPerWeek: highest.itemCountPerWeek,
    },
  };

  const systemInstruction = `Kamu adalah pakar keberlanjutan dan konsultan pengurangan plastik dari KarbonAI, platform jejak karbon kampus di Indonesia.
Tugasmu adalah menganalisis data jejak karbon plastik sekali pakai pengguna dan menghasilkan rekomendasi aksi hijau (Green Action) yang personal, suportif, dan realistis.

ATURAN KETAT:
1. Prioritaskan kategori yang menghasilkan EMISI CO₂e TERBESAR (${promptData.primaryHotspot.categoryLabel} = ${promptData.primaryHotspot.weeklyKgCO2e} kg CO₂e/minggu), bukan hanya jumlah barang. Contoh: wadah makanan bernilai 0.155 kg CO₂e/buah jauh lebih tinggi dampaknya dibanding kantong plastik 0.033 kg CO₂e/buah.
2. JANGAN PERNAH mengarang angka pengurangan emisi! Pengurangan emisi mingguan (potentialImpact.weeklySavingKgCO2e) HANYA BOLEH dihitung dari jumlah barang yang dikurangi dikalikan faktor emisi resmi yang disediakan. Angka penghematan TIDAK BOLEH melebihi emisi kategori tersebut. Jika tidak dapat dihitung eksak, beri nilai null.
3. Berikan bahasa Indonesia yang santun, hangat, suportif, memberdayakan, dan kontekstual dengan kehidupan mahasiswa/masyarakat sehari-hari (misal: kantin kampus, warung makan, kos, minimarket).
4. Output HARUS berupa JSON valid persis sesuai struktur yang diminta, tanpa awalan atau akhiran teks selain JSON.`;

  const userPrompt = `Data kalkulasi jejak karbon pengguna:
${JSON.stringify(promptData, null, 2)}

Buatlah respons JSON dengan format persis berikut:
{
  "habitAnalysis": "Analisis kebiasaan 2-3 kalimat yang personal berdasarkan data di atas",
  "primaryPriority": {
    "category": "${promptData.primaryHotspot.category}",
    "categoryLabel": "${promptData.primaryHotspot.categoryLabel}",
    "weeklyKgCO2e": ${promptData.primaryHotspot.weeklyKgCO2e},
    "percentage": ${promptData.primaryHotspot.percentage},
    "itemCountPerWeek": ${promptData.primaryHotspot.itemCountPerWeek},
    "explanation": "Penjelasan mengapa kategori ini menjadi fokus utama reduksi emisi"
  },
  "recommendations": [
    {
      "id": "action_primary",
      "category": "${promptData.primaryHotspot.category}",
      "categoryLabel": "${promptData.primaryHotspot.categoryLabel}",
      "priority": "Utama",
      "title": "Judul tindakan utama yang menarik & jelas",
      "reason": "Alasan mengapa tindakan ini cocok untuk kebiasaan pengguna",
      "practicalSteps": [
        "Langkah 1 konkret",
        "Langkah 2 konkret",
        "Langkah 3 konkret"
      ],
      "potentialImpact": {
        "weeklySavingKgCO2e": ${promptData.primaryHotspot.weeklyKgCO2e},
        "monthlySavingKgCO2e": ${Math.round(promptData.primaryHotspot.weeklyKgCO2e * (52 / 12) * 100) / 100},
        "formattedSaving": "~${promptData.primaryHotspot.weeklyKgCO2e} kg CO₂e / minggu",
        "qualitativeBenefit": "Manfaat kesehatan/lingkungan non-angka yang nyata"
      },
      "difficulty": "Mudah",
      "financialBenefit": "Estimasi penghematan finansial uang saku",
      "localContext": "Konteks lokal kampus atau kehidupan kota"
    }
  ]
}

Jika pengguna memiliki kategori lain dengan item > 0, tambahkan 1-3 rekomendasi berikutnya dengan "priority": "Tambahan".
Kembalikan HANYA JSON valid.`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(12000), // Timeout 12 detik
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_API_ERROR_${response.status}: ${errorText.substring(0, 150)}`);
  }

  const rawJson = await response.json();
  const candidateText =
    rawJson.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  // Bersihkan markdown code fences jika model menyertakannya
  const cleanedText = candidateText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleanedText) as GreenActionAnalysisResult;

  // Validasi keabsahan struktur minimum
  if (!parsed.habitAnalysis || !parsed.primaryPriority || !Array.isArray(parsed.recommendations)) {
    throw new Error("GEMINI_INVALID_SCHEMA");
  }

  // Sanitasi & verifikasi angka emisi AI agar tidak melebihi nilai aktual (mencegah halusinasi emisi)
  parsed.recommendations = parsed.recommendations.map((action, idx) => {
    const cat = action.category || highest.category;
    const catMaxEmission = result.categories[cat]?.weeklyKgCO2e ?? highest.weeklyKgCO2e;

    let weeklySaving = action.potentialImpact?.weeklySavingKgCO2e ?? null;
    if (typeof weeklySaving === "number") {
      // Pastikan penghematan tidak bernilai negatif dan tidak melebihi total emisi kategori
      weeklySaving = Math.max(0, Math.min(catMaxEmission, weeklySaving));
      weeklySaving = Math.round(weeklySaving * 1000) / 1000;
    }

    const monthlySaving =
      typeof weeklySaving === "number"
        ? Math.round(weeklySaving * (52 / 12) * 100) / 100
        : null;

    return {
      ...action,
      id: action.id || `ai_action_${idx}`,
      category: cat,
      categoryLabel: CATEGORY_NAMES[cat] || action.categoryLabel,
      priority: action.priority === "Utama" ? "Utama" : "Tambahan",
      potentialImpact: {
        weeklySavingKgCO2e: weeklySaving,
        monthlySavingKgCO2e: monthlySaving,
        formattedSaving:
          weeklySaving !== null ? `~${weeklySaving} kg CO₂e / minggu` : "Manfaat Kualitatif",
        qualitativeBenefit:
          action.potentialImpact?.qualitativeBenefit ||
          "Mengurangi penumpukan sampah plastik di lingkungan dan mencegah polusi mikroplastik.",
      },
    };
  });

  return parsed;
}
