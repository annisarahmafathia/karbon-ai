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

export const TIE_BREAKER_CATEGORY_ORDER: Record<string, number> = {
  wadah_makanan: 1,
  botol_minum: 2,
  kantong_plastik: 3,
  wadah_styrofoam: 4,
};

/**
 * Menentukan urutan rekomendasi Green Action secara otomatis:
 * 1. Utamakan rekomendasi yang berkaitan dengan kategori plastik dengan estimasi emisi mingguan terbesar (weeklyKgCO2e)
 * 2. Jika dua kategori memiliki nilai emisi yang sama (tied), gunakan urutan alternatif yang konsisten:
 *    a. Status prioritas ("Utama" didahulukan dibanding "Tambahan")
 *    b. Estimasi penghematan emisi mingguan terbesar (weeklySavingKgCO2e)
 *    c. Urutan kategori deterministik yang konsisten
 *    d. Judul rekomendasi secara alfabetis
 */
export function sortRecommendationsByFootprint(
  recommendations: PersonalizedAction[],
  result: CalculationResult
): PersonalizedAction[] {
  return [...recommendations].sort((a, b) => {
    const emissionA = result.categories[a.category]?.weeklyKgCO2e ?? 0;
    const emissionB = result.categories[b.category]?.weeklyKgCO2e ?? 0;

    // 1. Utamakan kategori dengan estimasi emisi mingguan terbesar
    if (Math.abs(emissionB - emissionA) > 0.0001) {
      return emissionB - emissionA;
    }

    // 2. Pemutus seri alternatif yang konsisten:
    // a. Status prioritas ("Utama" sebelum "Tambahan")
    if (a.priority === "Utama" && b.priority !== "Utama") return -1;
    if (a.priority !== "Utama" && b.priority === "Utama") return 1;

    // b. Estimasi penghematan mingguan terbesar
    const saveA = a.potentialImpact?.weeklySavingKgCO2e ?? 0;
    const saveB = b.potentialImpact?.weeklySavingKgCO2e ?? 0;
    if (Math.abs(saveB - saveA) > 0.0001) {
      return saveB - saveA;
    }

    // c. Urutan kategori deterministik yang konsisten
    const orderA = TIE_BREAKER_CATEGORY_ORDER[a.category] ?? 99;
    const orderB = TIE_BREAKER_CATEGORY_ORDER[b.category] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // d. Judul rekomendasi secara alfabetis
    return a.title.localeCompare(b.title);
  });
}

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
    const generalRecommendations: PersonalizedAction[] = [
      {
        id: "rule_hero_maintain",
        category: "botol_minum",
        categoryLabel: CATEGORY_NAMES.botol_minum,
        priority: "Tambahan",
        title: "Pertahankan Perlengkapan Reusable & Ajak Teman Sekitarmu",
        reason:
          "Membawa botol minum guna ulang (tumbler) secara konsisten merupakan langkah efektif untuk mencegah timbulan sampah botol plastik sekali pakai secara permanen.",
        practicalSteps: [
          "Pastikan tumbler air minum selalu dicuci bersih dan siap di dalam tas sebelum beraktivitas.",
          "Manfaatkan dispenser galon atau fasilitas air minum gratis di kampus atau tempat kerja.",
          "Ajak teman atau rekan sekitar untuk mulai membiasakan membawa wadah minum sendiri.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: null,
          monthlySavingKgCO2e: null,
          formattedSaving: "Bebas Emisi (0 kg CO₂e)",
          qualitativeBenefit:
            "Mencegah timbulan sampah baru secara permanen dan membangun budaya peduli lingkungan.",
        },
        difficulty: "Mudah",
        financialBenefit: "Menghemat pengeluaran harian hingga ratusan ribu rupiah per bulan untuk pembelian air kemasan.",
        localContext:
          "Fasilitas air minum isi ulang di berbagai gedung perkuliahan dan perpustakaan dapat dimanfaatkan gratis.",
        targetFactor: CATEGORY_NAMES.botol_minum,
        isPrimaryContributorAction: false,
      },
      {
        id: "rule_hero_kantong",
        category: "kantong_plastik",
        categoryLabel: CATEGORY_NAMES.kantong_plastik,
        priority: "Tambahan",
        title: "Sediakan Tas Belanja Lipat (Tote Bag) di Dalam Tas Harian",
        reason:
          "Menyiapkan tas belanja kain lipat membantu membiasakan diri menolak kantong plastik sekali pakai saat berbelanja di minimarket atau pasar.",
        practicalSteps: [
          "Selipkan satu tas belanja kain lipat berukuran kecil di saku atau kompartemen ransel.",
          "Biasakan menolak kantong kresek secara proaktif kepada kasir atau pedagang saat berbelanja.",
          "Gunakan kembali kantong yang sudah ada di rumah untuk keperluan penyimpanan barang.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: null,
          monthlySavingKgCO2e: null,
          formattedSaving: "Bebas Emisi (0 kg CO₂e)",
          qualitativeBenefit:
            "Mencegah sumbatan saluran drainase kota dan mengurangi beban tumpukan sampah plastik di TPA.",
        },
        difficulty: "Mudah",
        financialBenefit: "Terbebas dari biaya kantong belanja berbayar di gerai perbelanjaan dan minimarket.",
        localContext:
          "Pedagang pasar tradisional dan minimarket sangat terbiasa dengan pembeli yang membawa tas belanja sendiri.",
        targetFactor: CATEGORY_NAMES.kantong_plastik,
        isPrimaryContributorAction: false,
      },
      {
        id: "rule_hero_wadah",
        category: "wadah_makanan",
        categoryLabel: CATEGORY_NAMES.wadah_makanan,
        priority: "Tambahan",
        title: "Bawa Kotak Makan Guna Ulang Saat Membeli Makanan Takeaway",
        reason:
          "Membawa wadah makanan pribadi berbahan food-grade saat membeli makanan siap santap menghindarkan penggunaan kotak plastik mika sekali pakai.",
        practicalSteps: [
          "Bawa kotak makan bersekat atau mistin saat berencana membeli makanan di luar.",
          "Minta penjual menaruh makanan langsung ke dalam wadah pribadi yang kamu bawa.",
          "Pilih makan di tempat (dine-in) dengan piring atau mangkuk jika waktu luang memungkinkan.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: null,
          monthlySavingKgCO2e: null,
          formattedSaving: "Bebas Emisi (0 kg CO₂e)",
          qualitativeBenefit:
            "Menghindari risiko paparan mikroplastik dan bahan kimia kemasan plastik saat terkena makanan panas.",
        },
        difficulty: "Sedang",
        financialBenefit:
          "Banyak penjual warung makan memberikan porsi lebih saat pembeli membawa wadah makan sendiri!",
        localContext:
          "Warung nasi dan warung makan di seputaran kampus sangat ramah melayani pesanan dengan wadah bawaan pembeli.",
        targetFactor: CATEGORY_NAMES.wadah_makanan,
        isPrimaryContributorAction: false,
      },
      {
        id: "rule_hero_styrofoam",
        category: "wadah_styrofoam",
        categoryLabel: CATEGORY_NAMES.wadah_styrofoam,
        priority: "Tambahan",
        title: "Hindari Kemasan Styrofoam & Pilih Bungkus Daun atau Kotak Bekal",
        reason:
          "Menolak kemasan styrofoam dan memilih wadah sendiri atau pembungkus alami menjaga kesehatan sekaligus mencegah polusi lingkungan yang persisten.",
        practicalSteps: [
          "Minta pedagang membungkus makanan menggunakan kertas nasi atau daun pisang jika tersedia.",
          "Gunakan kotak makan sendiri saat membeli bubur, nasi goreng, atau jajanan hangat.",
          "Hindari meletakkan makanan berlemak atau berkuah panas langsung pada wadah styrofoam.",
        ],
        potentialImpact: {
          weeklySavingKgCO2e: null,
          monthlySavingKgCO2e: null,
          formattedSaving: "Bebas Emisi (0 kg CO₂e)",
          qualitativeBenefit:
            "Mencegah pelepasan zat stirena karsinogenik ke makanan hangat dan melindungi ekosistem dari polusi mikroplastik.",
        },
        difficulty: "Mudah",
        financialBenefit: "Mendukung tradisi kuliner lokal yang menggunakan kemasan daun alami ramah lingkungan.",
        localContext:
          "Kuliner tradisional seperti nasi gurih secara alami dibungkus daun pisang yang jauh lebih sehat dan ramah lingkungan.",
        targetFactor: CATEGORY_NAMES.wadah_styrofoam,
        isPrimaryContributorAction: false,
      },
    ];

    return {
      habitAnalysis:
        "Luar biasa! Kamu mencatatkan 0 penggunaan plastik sekali pakai baru minggu ini. Gaya hidup ramah lingkunganmu sudah sangat optimal dan menjadi inspirasi nyata bagi lingkungan sekitarmu.",
      primaryPriority: {
        category: "botol_minum",
        categoryLabel: "Belum Ada Emisi Terdeteksi",
        weeklyKgCO2e: 0,
        percentage: 0,
        itemCountPerWeek: 0,
        explanation:
          "Tidak ada emisi plastik sekali pakai yang terdeteksi minggu ini. Berdasarkan data kalkulasimu saat ini, seluruh kategori bernilai 0 sehingga tidak ada faktor penyumbang emisi terbesar yang perlu dikurangi.",
        allTopContributors: [],
        isTied: false,
        hasValidData: false,
      },
      isZeroPlasticHero: true,
      recommendations: generalRecommendations,
    };
  }

  // Dapatkan seluruh kategori dengan emisi aktif > 0
  const categoriesList: PlasticCategory[] = [
    "wadah_makanan",
    "botol_minum",
    "kantong_plastik",
    "wadah_styrofoam",
  ];

  const activeCategories = categoriesList
    .map((cat) => ({
      category: cat,
      categoryLabel: CATEGORY_NAMES[cat],
      weeklyKgCO2e: result.categories[cat]?.weeklyKgCO2e ?? 0,
      percentage: result.categories[cat]?.percentage ?? 0,
      itemCountPerWeek: result.categories[cat]?.itemCountPerWeek ?? 0,
    }))
    .filter((c) => c.weeklyKgCO2e > 0);

  // Cari nilai emisi mingguan maksimum yang sebenarnya
  const maxEmission = activeCategories.length > 0
    ? Math.max(...activeCategories.map((c) => c.weeklyKgCO2e))
    : 0;

  // Temukan semua faktor yang menghasilkan emisi tertinggi (mendukung kasus tied/imbang)
  const topContributors = activeCategories.filter(
    (c) => Math.abs(c.weeklyKgCO2e - maxEmission) < 0.0001
  );

  const isTied = topContributors.length > 1;
  const topCategorySet = new Set(topContributors.map((c) => c.category));

  // Ambil rujukan kategori utama
  const highestCat = topContributors[0]?.category ?? result.highestCategory.category;
  const highestEmission = maxEmission;
  const highestPercent = topContributors[0]?.percentage ?? result.highestCategory.percentage;
  const highestItems = isTied
    ? topContributors.reduce((s, c) => s + c.itemCountPerWeek, 0)
    : (topContributors[0]?.itemCountPerWeek ?? result.highestCategory.itemCountPerWeek);

  const highestLabel = isTied
    ? topContributors.map((c) => c.categoryLabel).join(" & ")
    : (topContributors[0]?.categoryLabel ?? CATEGORY_NAMES[highestCat]);

  // Analisis kebiasaan berdasarkan kategori aktif yang benar-benar diinput
  const activeInputDetails = activeCategories.map(
    (c) => `**${c.categoryLabel}** (${c.itemCountPerWeek} barang/minggu)`
  );

  let habitSummary = `Dalam sepekan, kamu menggunakan total **${result.totalItemsPerWeek} barang plastik sekali pakai** dengan estimasi jejak emisi sebesar **~${result.totalWeeklyKgCO2e} kg CO₂e**. `;
  if (activeCategories.length === 1) {
    habitSummary += `Penggunaan plastikmu sepenuhnya berpusat pada satu kebiasaan, yaitu ${activeInputDetails[0]}. `;
  } else {
    habitSummary += `Pola konsumsimu tersebar pada beberapa kebiasaan harian, yaitu ${activeInputDetails.join(", ")}. `;
  }

  // Identifikasi faktor penyumbang emisi terbesar dan alasan ilmiah singkatnya
  if (isTied) {
    const tiedLabels = topContributors.map((c) => `**${c.categoryLabel}**`).join(" dan ");
    habitSummary += `Dari pola tersebut, ${tiedLabels} secara setara menjadi faktor penyumbang emisi terbesar karena kombinasi frekuensi pemakaian dan intensitas emisi materialnya.`;
  } else {
    switch (highestCat) {
      case "wadah_makanan":
        habitSummary += `Dari pola tersebut, **Wadah Makanan Plastik** menjadi penyumbang emisi terbesar karena plastik polipropilena (PP) atau mika tebal membutuhkan energi manufaktur tinggi dan melepaskan emisi signifikan per unitnya.`;
        break;
      case "botol_minum":
        habitSummary += `Dari pola tersebut, **Botol Minum Sekali Pakai** menjadi penyumbang emisi terbesar karena material plastik PET memerlukan proses ekstraksi minyak bumi dan pemurnian yang intensif energi.`;
        break;
      case "kantong_plastik":
        habitSummary += `Dari pola tersebut, **Kantong Plastik** menjadi penyumbang emisi terbesar akibat frekuensi penggunaannya yang sangat sering dan tingkat daur ulang polietilena tipis yang masih sangat rendah.`;
        break;
      case "wadah_styrofoam":
        habitSummary += `Dari pola tersebut, **Wadah Styrofoam** menjadi penyumbang emisi terbesar karena proses polimerisasi stirena dan foaming EPS memerlukan energi intensif, di samping dampak persistensi fisik sampahnya yang sulit terurai di alam.`;
        break;
    }
  }

  // Tindakan konkret yang diprioritaskan untuk kartu "Prioritas Reduksi Utama" (tanpa mengulang analisis emisi)
  let explanation = "";
  if (isTied) {
    const tiedCats = topContributors.map((c) => c.category);
    if (tiedCats.includes("botol_minum") && tiedCats.includes("kantong_plastik")) {
      explanation =
        "Tindakan prioritas utamamu adalah menerapkan dua kebiasaan praktis: **selalu membawa tumbler pribadi** serta **menyiapkan tas belanja kain lipat** saat bepergian untuk memangkas kedua sumber emisi utama ini secara serentak.";
    } else if (tiedCats.includes("wadah_styrofoam") && tiedCats.includes("kantong_plastik")) {
      explanation =
        "Tindakan prioritas utamamu adalah **membawa wadah makan guna ulang (mistin/kotak bekal)** saat membeli makanan dan **menyiapkan tas belanja kain lipat** agar tidak lagi memerlukan styrofoam maupun kantong kresek.";
    } else if (tiedCats.includes("wadah_makanan") && tiedCats.includes("botol_minum")) {
      explanation =
        "Tindakan prioritas utamamu adalah membawa perlengkapan harian: **selalu membawa tumbler pribadi** untuk minuman dan **kotak bekal guna ulang** saat membeli makanan di luar guna mengurangi emisi dari kedua kategori ini secara langsung.";
    } else {
      const tiedLabels = topContributors.map((c) => `**${c.categoryLabel}**`).join(" dan ");
      explanation = `Tindakan prioritas utamamu adalah beralih ke wadah dan kemasan guna ulang untuk ${tiedLabels} secara bersamaan guna menekan kedua sumber emisi tersebut.`;
    }
  } else {
    switch (highestCat) {
      case "wadah_styrofoam":
        explanation =
          "Tindakan prioritas utamamu adalah **membawa wadah makan guna ulang (mistin/kotak bekal)** saat membeli makanan bawa pulang (take-away), atau memilih tempat makan yang menyediakan kemasan alternatif berbahan daun pisang atau kertas ramah lingkungan.";
        break;
      case "botol_minum":
        explanation =
          "Tindakan prioritas utamamu adalah **selalu membawa botol minum (tumbler) pribadi** dan memanfaatkan fasilitas isi ulang air minum di kampus atau tempat kerja untuk sepenuhnya menggantikan pembelian air mineral kemasan sekali pakai.";
        break;
      case "wadah_makanan":
        explanation =
          "Tindakan prioritas utamamu adalah **membawa kotak bekal reusable berbahan food-grade** saat membeli makanan siap santap dan meminta penjual tidak membungkusnya dengan kotak plastik mika sekali pakai.";
        break;
      case "kantong_plastik":
        explanation =
          "Tindakan prioritas utamamu adalah **selalu menyiapkan tas belanja kain lipat (tote bag)** di dalam tas ransel atau jok kendaraan, serta membiasakan diri menolak kantong kresek saat berbelanja.";
        break;
    }
  }

  const primaryPriority: PrimaryPriorityInfo = {
    category: highestCat,
    categoryLabel: highestLabel,
    weeklyKgCO2e: highestEmission,
    percentage: highestPercent,
    itemCountPerWeek: highestItems,
    explanation,
    allTopContributors: topContributors,
    isTied,
    hasValidData: true,
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

    const isPrimary = topCategorySet.has(cat);
    const factor = PLASTIC_EMISSION_FACTORS[cat].value;

    if (cat === "kantong_plastik") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      const reasonText = isPrimary
        ? `Tindakan ini menargetkan pengurangan **Kantong Plastik**, yang merupakan **penyumbang emisi terbesar** dari jejak karbonmu (~${catResult.weeklyKgCO2e} kg CO₂e/minggu dari ${itemCount} kantong baru). Membawa tas belanja lipat kain akan langsung memangkas habis emisi kategori ini.`
        : `Tindakan ini menargetkan pengurangan **Kantong Plastik** (${itemCount} kantong/minggu, ~${catResult.weeklyKgCO2e} kg CO₂e). Membawa tas belanja lipat mandiri secara konsisten membantu menghentikan timbulan kantong kresek sekali pakai.`;

      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Tas Belanja Lipat (Tote Bag) & Tolak Kantong Kresek",
        reason: reasonText,
        practicalSteps: [
          "Selalu selipkan 1 tas belanja kain lipat di saku atau kompartemen ransel harianmu.",
          "Ucapkan secara proaktif ke kasir atau pedagang: 'Tidak usah pakai kantong kresek ya, Kak/Bang.'",
          "Kumpulkan barang belanjaan kecil langsung ke dalam tas tanpa kantong plastik terpisah.",
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
          "Pedagang di pasar tradisional dan minimarket sekitar kampus sangat terbiasa dengan pembeli yang membawa tas belanja sendiri.",
        targetFactor: CATEGORY_NAMES[cat],
        isPrimaryContributorAction: isPrimary,
      });
    } else if (cat === "wadah_makanan") {
      // Asumsi substitusi 80% wadah bawa pulang
      const reducedItems = Math.max(1, Math.round(itemCount * 0.8));
      const saving = Math.round(reducedItems * factor * 1000) / 1000;
      const reasonText = isPrimary
        ? `Tindakan ini menargetkan pengurangan **Wadah Makanan Plastik**, yang merupakan **penyumbang emisi terbesar** mingguanmu (~${catResult.weeklyKgCO2e} kg CO₂e/minggu). Karena wadah makanan memiliki faktor emisi tinggi (${factor} kg CO₂e/buah), mengganti ${reducedItems} dari ${itemCount} wadah takeaway dengan kotak makan guna ulang memberikan dampak reduksi emisi paling nyata.`
        : `Tindakan ini menargetkan pengurangan **Wadah Makanan Plastik** (~${catResult.weeklyKgCO2e} kg CO₂e/minggu). Membawa wadah makan sendiri saat memesan makanan takeaway menghemat pemakaian wadah plastik tebal.`;

      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Kotak Makan Sendiri Saat Beli Makanan Bawa Pulang (Takeaway)",
        reason: reasonText,
        practicalSteps: [
          "Bawa wadah makan bersekat atau kotak makan yang bisa dicuci ulang saat pergi beli makan.",
          "Serahkan kotak makanmu saat memesan mie, nasi bungkus, atau lauk makan siang di warung.",
          "Jika makan di tempat, pilih piring atau mangkuk daripada wadah bungkus sekali pakai.",
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
          "Banyak penjual warung makan memberikan porsi lebih saat pembeli membawa wadah sendiri!",
        localContext:
          "Warung nasi dan warung mie di seputaran kampus sangat ramah melayani pesanan dengan wadah bawaan pembeli.",
        targetFactor: CATEGORY_NAMES[cat],
        isPrimaryContributorAction: isPrimary,
      });
    } else if (cat === "botol_minum") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      const reasonText = isPrimary
        ? `Tindakan ini menargetkan pengurangan **Botol Minum Plastik**, yang merupakan **penyumbang emisi terbesar** dari jejak karbonmu (~${catResult.weeklyKgCO2e} kg CO₂e/minggu dari ${itemCount} botol baru). Membawa botol minum isi ulang (tumbler) akan menghapus hingga 100% jejak emisi kategori ini.`
        : `Tindakan ini menargetkan pengurangan **Botol Minum Plastik** (${itemCount} botol baru/minggu, ~${catResult.weeklyKgCO2e} kg CO₂e). Membawa tumbler dan memanfaatkan stasiun air minum kampus menghindarkan pembelian botol PET sekali pakai.`;

      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Bawa Tumbler & Manfaatkan Stasiun Pengisian Air Minum Kampus",
        reason: reasonText,
        practicalSteps: [
          "Isi penuh tumbler air minum dari rumah/kos sebelum berangkat beraktivitas di pagi hari.",
          "Manfaatkan dispenser galon di fakultas, perpustakaan, atau musholla untuk isi ulang gratis.",
          "Bawa tumbler saat nongkrong di kafe atau warkop untuk memesan minuman dingin.",
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
          "Fasilitas air minum isi ulang di berbagai gedung perkuliahan dan perpustakaan dapat dimanfaatkan gratis.",
        targetFactor: CATEGORY_NAMES[cat],
        isPrimaryContributorAction: isPrimary,
      });
    } else if (cat === "wadah_styrofoam") {
      const saving = Math.round(itemCount * factor * 1000) / 1000;
      const reasonText = isPrimary
        ? `Tindakan ini menargetkan pengurangan **Wadah Styrofoam**, yang merupakan **penyumbang emisi terbesar** pengguna (~${catResult.weeklyKgCO2e} kg CO₂e/minggu dari ${itemCount} wadah). Styrofoam sulit terurai dan melepaskan zat berbahaya, sehingga menolaknya adalah prioritas utama.`
        : `Tindakan ini menargetkan pengurangan **Wadah Styrofoam** (${itemCount} wadah/minggu, ~${catResult.weeklyKgCO2e} kg CO₂e). Memilih kemasan daun pisang atau kotak bekal sendiri mencegah polusi mikroplastik yang persisten di alam.`;

      recommendations.push({
        id: `rule_action_${cat}`,
        category: cat,
        categoryLabel: CATEGORY_NAMES[cat],
        priority: isPrimary ? "Utama" : "Tambahan",
        title: "Tolak Kemasan Styrofoam & Pilih Bungkus Daun / Kertas Cokelat",
        reason: reasonText,
        practicalSteps: [
          "Minta penjual membungkus makanan dengan kertas nasi atau daun pisang jika tersedia.",
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
          "Kuliner tradisional seperti nasi gurih secara alami dibungkus daun pisang yang jauh lebih sehat dan ramah lingkungan.",
        targetFactor: CATEGORY_NAMES[cat],
        isPrimaryContributorAction: isPrimary,
      });
    }
  }

  // Urutkan rekomendasi secara otomatis berdasarkan emisi mingguan terbesar dengan tie-breaker konsisten
  const sortedRecommendations = sortRecommendationsByFootprint(recommendations, result);

  return {
    habitAnalysis: habitSummary,
    primaryPriority,
    recommendations: sortedRecommendations,
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
  const isZero = result.totalItemsPerWeek === 0 || result.totalWeeklyKgCO2e === 0;
  if (isZero) {
    return generateRuleBasedGreenActions(input, result);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Hitung faktor penyumbang emisi terbesar secara akurat dari nilai emisi riil
  const categoriesList: PlasticCategory[] = [
    "wadah_makanan",
    "botol_minum",
    "kantong_plastik",
    "wadah_styrofoam",
  ];

  const activeCategories = categoriesList
    .map((cat) => ({
      category: cat,
      categoryLabel: CATEGORY_NAMES[cat],
      weeklyKgCO2e: result.categories[cat]?.weeklyKgCO2e ?? 0,
      percentage: result.categories[cat]?.percentage ?? 0,
      itemCountPerWeek: result.categories[cat]?.itemCountPerWeek ?? 0,
    }))
    .filter((c) => c.weeklyKgCO2e > 0);

  const maxEmission = activeCategories.length > 0
    ? Math.max(...activeCategories.map((c) => c.weeklyKgCO2e))
    : 0;

  const topContributors = activeCategories.filter(
    (c) => Math.abs(c.weeklyKgCO2e - maxEmission) < 0.0001
  );

  const isTied = topContributors.length > 1;
  const topCategorySet = new Set(topContributors.map((c) => c.category));

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
      isTied,
      allTopContributors: topContributors,
    },
  };

  const systemInstruction = `Kamu adalah pakar keberlanjutan dan konsultan pengurangan plastik dari KarbonAI, platform jejak karbon kampus di Indonesia.
Tugasmu adalah menganalisis data jejak karbon plastik sekali pakai pengguna dan menghasilkan rekomendasi aksi hijau (Green Action) yang personal, suportif, dan realistis.

ATURAN KETAT:
1. Prioritaskan tindakan yang mengurangi faktor PENYUMBANG EMISI TERBESAR (${promptData.primaryHotspot.categoryLabel} = ${promptData.primaryHotspot.weeklyKgCO2e} kg CO₂e/minggu), bukan hanya jumlah barang terbanyak.
2. Sebutkan secara EKSPLISIT nama faktor yang ingin dikurangi dalam setiap teks rekomendasi. Gunakan format bold (**nama faktor**) pada nama faktor utama dan kata-kata penting.
3. JANGAN PERNAH mengarang angka pengurangan emisi! Pengurangan emisi mingguan (potentialImpact.weeklySavingKgCO2e) HANYA BOLEH dihitung dari jumlah barang yang dikurangi dikalikan faktor emisi resmi yang disediakan. Angka penghematan TIDAK BOLEH melebihi emisi kategori tersebut. Jika tidak dapat dihitung eksak, beri nilai null.
4. Berikan bahasa Indonesia yang santun, hangat, suportif, memberdayakan, dan kontekstual dengan kehidupan mahasiswa/masyarakat sehari-hari (misal: kantin kampus, warung makan, kos, minimarket).
5. Output HARUS berupa JSON valid persis sesuai struktur yang diminta, tanpa awalan atau akhiran teks selain JSON.`;

  const userPrompt = `Data kalkulasi jejak karbon pengguna:
${JSON.stringify(promptData, null, 2)}

Buatlah respons JSON dengan format persis berikut:
{
  "habitAnalysis": "Analisis pola konsumsi dan emisi pengguna 2-3 kalimat yang personal berdasarkan data di atas (sebutkan total barang, total emisi, pola kategori aktif yang diinput, dan alasan singkat mengapa faktor terbesar perlu diperhatikan dengan format bold). Jangan menuliskan rekomendasi aksi konkret di sini.",
  "primaryPriority": {
    "category": "${promptData.primaryHotspot.category}",
    "categoryLabel": "${promptData.primaryHotspot.categoryLabel}",
    "weeklyKgCO2e": ${promptData.primaryHotspot.weeklyKgCO2e},
    "percentage": ${promptData.primaryHotspot.percentage},
    "itemCountPerWeek": ${promptData.primaryHotspot.itemCountPerWeek},
    "explanation": "Tindakan konkret dan realistis yang perlu diprioritaskan pengguna untuk mengurangi ${promptData.primaryHotspot.categoryLabel} (fokus pada langkah nyata yang harus dilakukan, BUKAN mengulang data emisi atau persentase)"
  },
  "recommendations": [
    {
      "id": "action_primary",
      "category": "${promptData.primaryHotspot.category}",
      "categoryLabel": "${promptData.primaryHotspot.categoryLabel}",
      "priority": "Utama",
      "title": "Judul tindakan utama yang menarik & jelas",
      "reason": "Alasan spesifik menyebutkan faktor yang ingin dikurangi dan statusnya sebagai penyumbang emisi terbesar",
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

  // Lengkapi metadata primaryPriority dengan data akurat
  parsed.primaryPriority.allTopContributors = topContributors;
  parsed.primaryPriority.isTied = isTied;
  parsed.primaryPriority.hasValidData = true;

  // Sanitasi & verifikasi angka emisi AI agar tidak melebihi nilai aktual (mencegah halusinasi emisi)
  parsed.recommendations = parsed.recommendations.map((action, idx) => {
    const cat = action.category || highest.category;
    const catMaxEmission = result.categories[cat]?.weeklyKgCO2e ?? highest.weeklyKgCO2e;
    const isPrimary = topCategorySet.has(cat);

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
      priority: isPrimary ? "Utama" : "Tambahan",
      targetFactor: CATEGORY_NAMES[cat] || action.categoryLabel,
      isPrimaryContributorAction: isPrimary,
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

  // Urutkan aksi secara otomatis berdasarkan emisi mingguan terbesar dengan tie-breaker konsisten
  parsed.recommendations = sortRecommendationsByFootprint(parsed.recommendations, result);

  return parsed;
}
