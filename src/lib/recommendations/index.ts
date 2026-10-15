import { CalculationResult, UserCalculatorInput } from "../../types/carbon";
import { EMISSION_FACTORS } from "../constants/emission-factors";

export interface EvaluatedGreenAction {
  id: string;
  title: string;
  category: "transportasi" | "energi" | "pangan" | "konsumsi" | "sampah";
  categoryLabel: string;
  impactLevel: "Tinggi" | "Sedang" | "Rendah";
  potentialMonthlySavingKgCO2e: number;
  calculationExplanation: string;
  isDynamic: boolean; // Menandai apakah dihitung dari input aktual atau estimasi tipikal
  financialBenefit: string;
  difficulty: "Mudah" | "Sedang" | "Perlu Usaha";
  description: string;
  localContextAceh: string;
  isApplicable: boolean;
}

interface ActionDefinition {
  id: string;
  title: string;
  category: "transportasi" | "energi" | "pangan" | "konsumsi" | "sampah";
  categoryLabel: string;
  difficulty: "Mudah" | "Sedang" | "Perlu Usaha";
  financialBenefit: string;
  description: string;
  localContextAceh: string;
  evaluate: (
    input: UserCalculatorInput,
    result: CalculationResult
  ) => {
    isApplicable: boolean;
    savingKgCO2e: number;
    explanation: string;
    isDynamic: boolean;
  };
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  // --- TRANSPORTASI ---
  {
    id: "action_trans_koetaradja",
    title: "Beralih ke Bus Trans Koetaradja (Gratis ke Kampus)",
    category: "transportasi",
    categoryLabel: "Transportasi",
    difficulty: "Mudah",
    financialBenefit: "100% Gratis bagi Mahasiswa (Hemat bensin ~Rp 80.000 - 150.000/bln)",
    description:
      "Gunakan layanan Bus Trans Koetaradja Koridor 1 (Pusat Kota - Darussalam) yang memiliki halte tepat di gerbang USK dan UIN Ar-Raniry.",
    localContextAceh:
      "Bus Trans Koetaradja ber-AC, memiliki jalur khusus, dan beroperasi reguler setiap 10-15 menit di jam kuliah tanpa dipungut biaya apapun.",
    evaluate: (input) => {
      const isMotorOrCar =
        input.transport.primaryVehicle === "motor_matic_bebek" ||
        input.transport.primaryVehicle === "motor_sport" ||
        input.transport.primaryVehicle === "mobil_bensin" ||
        input.transport.primaryVehicle === "mobil_diesel";

      if (!isMotorOrCar || input.transport.campusDistanceKm <= 0 || input.transport.daysPerWeekToCampus <= 0) {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamu sudah menggunakan transportasi umum atau moda non-emisi untuk ke kampus.",
          isDynamic: false,
        };
      }

      // Jarak bulanan perjalanan kuliah PP
      const campusMonthlyKm =
        input.transport.campusDistanceKm * 2 * input.transport.daysPerWeekToCampus * 4.33;
      const currentFactor = EMISSION_FACTORS[input.transport.primaryVehicle]?.value || 0.043;
      const busFactor = EMISSION_FACTORS.trans_koetaradja.value; // 0.038
      const diffFactor = Math.max(0, currentFactor - busFactor);

      const savingKgCO2e = Math.round(campusMonthlyKm * diffFactor * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.5,
        savingKgCO2e,
        explanation: `Dihitung dari jarak kuliahmu (${Math.round(campusMonthlyKm)} km/bln): beralih dari ${EMISSION_FACTORS[input.transport.primaryVehicle]?.name} (${currentFactor} kg/km) ke Bus Trans Koetaradja (${busFactor} kg/pnp-km) menghemat ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_jalan_sepeda_darussalam",
    title: "Jalan Kaki atau Bersepeda untuk Jarak Dekat (<1.5 km)",
    category: "transportasi",
    categoryLabel: "Transportasi",
    difficulty: "Mudah",
    financialBenefit: "Nol biaya bensin & menjaga kebugaran tubuh",
    description:
      "Untuk jarak kos dekat (misal sekitar Rukoh, Limpok, Tanjung Deah, atau Kompleks Pelajar Mahasiswa Kopelma), biasakan berjalan kaki atau bersepeda santai.",
    localContextAceh:
      "Jalur pedestrian lingkar kampus USK dan UIN memiliki pepohonan kanopi yang rindang dan aman untuk pejalan kaki.",
    evaluate: (input) => {
      const isMotor =
        input.transport.primaryVehicle === "motor_matic_bebek" ||
        input.transport.primaryVehicle === "motor_sport";

      if (!isMotor) {
        return { isApplicable: false, savingKgCO2e: 0, explanation: "", isDynamic: false };
      }

      // Jika jarak kampus dekat (< 2.5 km) atau mobilitas harian lain
      const shortTripKm = input.transport.campusDistanceKm <= 2.5
        ? input.transport.campusDistanceKm * 2 * input.transport.daysPerWeekToCampus * 4.33
        : Math.min(input.transport.otherDailyKm * 7 * 4.33, 20);

      const savingKgCO2e =
        Math.round(shortTripKm * (EMISSION_FACTORS[input.transport.primaryVehicle]?.value || 0.043) * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.5,
        savingKgCO2e,
        explanation: `Mengganti ~${Math.round(shortTripKm)} km/bulan perjalanan jarak pendek dengan jalan kaki/sepeda (0 emisi) memangkas ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },

  // --- ENERGI ---
  {
    id: "action_ac_setting",
    title: "Atur Suhu AC Kos ke 25-26°C & Pasang Timer Tidur",
    category: "energi",
    categoryLabel: "Energi",
    difficulty: "Mudah",
    financialBenefit: "Hemat token listrik kos ~Rp 40.000 - 80.000/bln",
    description:
      "Menaikkan suhu AC dari 18°C ke 25°C mengurangi beban kerja kompresor hingga 25-30% (Kemen ESDM). Pasang timer otomatis agar AC mati 1-2 jam sebelum bangun tidur.",
    localContextAceh:
      "Listrik di Aceh disuplai dari jaringan Sumatera (0.761 kg CO₂e/kWh). Menghemat 1 kWh AC langsung memotong 0.761 kg emisi karbon.",
    evaluate: (input) => {
      if (!input.energy.hasAirConditioner || input.energy.acDailyHours <= 0) {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamar kosmu tidak menggunakan AC.",
          isDynamic: false,
        };
      }

      // AC kos 0.5 PK: 0.38 kWh/jam * jam/hari * 30.4 hari
      const monthlyAcKwh = input.energy.acDailyHours * 0.38 * 30.4;
      // Efisiensi suhu 25C + timer tidur = ~28% reduksi kWh
      const savedKwh = monthlyAcKwh * 0.28;
      const savingKgCO2e = Math.round(savedKwh * EMISSION_FACTORS.grid_sumatera.value * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 1.0,
        savingKgCO2e,
        explanation: `Dari konsumsi AC kosmu (${input.energy.acDailyHours} jam/hari = ~${Math.round(monthlyAcKwh)} kWh/bln), optimasi suhu dan timer menghemat ~${Math.round(savedKwh)} kWh atau ${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_cabut_colokan_kipas",
    title: "Matikan Kipas Angin & Cabut Adaptor Saat Ditinggal Kuliah",
    category: "energi",
    categoryLabel: "Energi",
    difficulty: "Mudah",
    financialBenefit: "Mencegah korsleting listrik kos & hemat token",
    description:
      "Hindari membiarkan kipas angin berputar di kamar kosong seharian saat kamu berada di kampus, dan cabut adaptor laptop saat baterai penuh.",
    localContextAceh:
      "Anak kos di Darussalam sering terburu-buru kuliah pagi dan membiarkan kipas tetap menyala di kamar kosong.",
    evaluate: (input) => {
      if (input.energy.fanDailyHours < 4) {
        return { isApplicable: false, savingKgCO2e: 0, explanation: "", isDynamic: false };
      }

      // Mengurangi 2 jam idle per hari
      const savedKwh = 2 * 0.045 * 30.4; // ~2.74 kWh/bln
      const savingKgCO2e = Math.round(savedKwh * EMISSION_FACTORS.grid_sumatera.value * 10) / 10;

      return {
        isApplicable: true,
        savingKgCO2e,
        explanation: `Mematikan kipas angin 2 jam pemakaian mubazir per hari menghemat ~2.7 kWh atau ${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },

  // --- PANGAN ---
  {
    id: "action_pilih_ikan_laut",
    title: "Ganti 1-2 Porsi Daging Sapi dengan Ikan Laut Pesisir Aceh",
    category: "pangan",
    categoryLabel: "Pangan & Minuman",
    difficulty: "Sedang",
    financialBenefit: "Ikan dencis & tongkol lebih hemat di kantong mahasiswa",
    description:
      "Mengganti 1 atau 2 porsi daging sapi/kambing per minggu dengan ikan laut pesisir Aceh (tongkol/dencis) atau olahan nabati (tahu/tempe) menurunkan jejak karbon protein hingga 75%.",
    localContextAceh:
      "Perairan Aceh memiliki pasokan ikan laut segar melimpah seperti tongkol dan dencis di Pasar Peunayong dan Ulee Kareng dengan emisi solar kapal jauh lebih rendah dari emisi peternakan sapi.",
    evaluate: (input) => {
      if (input.food.beefMuttonMealsPerWeek <= 0) {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamu sudah jarang/tidak mengonsumsi daging ruminansia.",
          isDynamic: false,
        };
      }

      // Ganti 1 porsi sapi (3.2 kg CO2e) dengan ikan (0.65 kg CO2e) = hemat 2.55 kg/porsi
      const replacedPortionsPerWeek = Math.min(input.food.beefMuttonMealsPerWeek, 2);
      const savingKgCO2e = Math.round(replacedPortionsPerWeek * 4.33 * (3.2 - 0.65) * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 1.0,
        savingKgCO2e,
        explanation: `Mengganti ${replacedPortionsPerWeek} porsi daging sapi/mgg dengan ikan laut segar menghemat ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_tumbler_warkop",
    title: "Bawa Tumbler & Nikmati Kopi Warkop Pakai Cangkir Keramik",
    category: "pangan",
    categoryLabel: "Pangan & Minuman",
    difficulty: "Mudah",
    financialBenefit: "Beberapa kedai memberi potongan harga bawa wadah sendiri",
    description:
      "Jika nongkrong di warkop atau cafe, pilih sajian cangkir keramik porselen yang dicuci berulang alih-alih meminta cup plastik sekali pakai take-away berpenutup.",
    localContextAceh:
      "Budaya minum kopi saring di Aceh secara tradisional menggunakan cangkir keramik tebal yang merupakan praktik zero waste asli warisan indatu.",
    evaluate: (input) => {
      if (input.food.singleUseCoffeeCupsPerWeek <= 0) {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamu sudah bebas dari limbah cup plastik sekali pakai.",
          isDynamic: false,
        };
      }

      const monthlyCups = input.food.singleUseCoffeeCupsPerWeek * 4.33;
      // Menghemat cup plastik (0.052) dikurangi emisi pencucian keramik (~0.005)
      const savingKgCO2e = Math.round(monthlyCups * (0.052 - 0.005) * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.1,
        savingKgCO2e: Math.max(0.2, savingKgCO2e),
        explanation: `Menghindari ${Math.round(monthlyCups)} cup plastik/bulan dengan tumbler/cangkir keramik memangkas ~${savingKgCO2e} kg CO₂e/bln limbah plastik.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_bawa_kotak_makan",
    title: "Bawa Kotak Makan Sendiri Saat Beli Makanan Bungkus",
    category: "pangan",
    categoryLabel: "Pangan & Minuman",
    difficulty: "Sedang",
    financialBenefit: "Porsi makanan sering kali dilebihkan penjual warung!",
    description:
      "Hindari penumpukan bungkus styrofoam dan kertas minyak berlapis plastik di kamar kos dengan membawa kotak bekal reusable saat membeli makan siang/malam.",
    localContextAceh:
      "Warung nasi di sekitar Darussalam sangat terbuka melayani mahasiswa yang menyodorkan wadah makanan sendiri.",
    evaluate: (input) => {
      if (input.food.takeawayFoodPackagingPerWeek <= 0) {
        return { isApplicable: false, savingKgCO2e: 0, explanation: "", isDynamic: false };
      }

      // Mengurangi 50% makanan bungkus
      const reducedPackages = input.food.takeawayFoodPackagingPerWeek * 0.5 * 4.33;
      const savingKgCO2e = Math.round(reducedPackages * 0.118 * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.2,
        savingKgCO2e: Math.max(0.3, savingKgCO2e),
        explanation: `Mengganti separuh (${Math.round(reducedPackages)} bungkus/bln) kemasan takeaway dengan kotak bekal menghemat ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },

  // --- KONSUMSI & BELANJA ---
  {
    id: "action_satukan_belanja_online",
    title: "Kolektifkan Belanja Online Ekspedisi Jawa ke Aceh",
    category: "konsumsi",
    categoryLabel: "Belanja",
    difficulty: "Mudah",
    financialBenefit: "Patungan ongkos kirim antarpulau dengan teman satu kos",
    description:
      "Gabungkan pesanan kebutuhan bulanan dalam satu kali pengiriman dari marketplace alih-alih memesan terpisah beberapa kali per minggu.",
    localContextAceh:
      "Pengiriman paket dari Jawa ke Aceh menempuh jarak logistik lebih dari 2.500 km yang memicu emisi bahan bakar kargo udara dan kurir darat (~1.85 kg CO₂e/paket).",
    evaluate: (input) => {
      if (input.consumption.onlinePackagesPerMonth <= 1) {
        return { isApplicable: false, savingKgCO2e: 0, explanation: "", isDynamic: false };
      }

      // Konsolidasi: mengurangi separuh frekuensi pengiriman paket
      const savedPackages = Math.floor(input.consumption.onlinePackagesPerMonth / 2);
      const savingKgCO2e = Math.round(savedPackages * 1.85 * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.5,
        savingKgCO2e,
        explanation: `Mengurangi ${savedPackages} kali ekspedisi logistik jarak jauh (~2.500 km) menghemat ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_paperless_kuliah",
    title: "Beralih ke Catatan Digital & PDF untuk Modul Kuliah",
    category: "konsumsi",
    categoryLabel: "Belanja",
    difficulty: "Mudah",
    financialBenefit: "Hemat biaya fotokopi modul ~Rp 30.000 - 60.000/bln",
    description:
      "Gunakan tablet, laptop, atau smartphone untuk membaca jurnal, slide kuliah dosen, dan diktat tanpa perlu mencetak kertas fisik.",
    localContextAceh:
      "Mayoritas dosen dan elearning kampus di USK dan UIN kini sudah mendukung penuh pengumpulan tugas secara paperless.",
    evaluate: (input) => {
      if (input.consumption.photocopySheetsPerMonth < 20) {
        return { isApplicable: false, savingKgCO2e: 0, explanation: "", isDynamic: false };
      }

      // Mengurangi 60% cetakan kertas
      const savedSheets = input.consumption.photocopySheetsPerMonth * 0.6;
      const savingKgCO2e = Math.round(savedSheets * 0.0048 * 10) / 10;

      return {
        isApplicable: true,
        savingKgCO2e: Math.max(0.2, savingKgCO2e),
        explanation: `Mengurangi cetak ~${Math.round(savedSheets)} lembar kertas/bulan menghemat ~${savingKgCO2e} kg CO₂e/bln.`,
        isDynamic: true,
      };
    },
  },

  // --- SAMPAH ---
  {
    id: "action_stop_bakar_sampah",
    title: "Hentikan Membakar Sampah di Pekarangan Kos",
    category: "sampah",
    categoryLabel: "Pengelolaan Sampah",
    difficulty: "Sedang",
    financialBenefit: "Kualitas udara pernapasan bersih & terhindar dari sanksi qanun",
    description:
      "Membakar sampah daun dan plastik menghasilkan gas metana, jelaga karbon hitam, dan zat karsinogenik dioksin. Buang ke tong resmi gampong agar diangkut armada DLHK3 ke TPA.",
    localContextAceh:
      "Qanun Kota Banda Aceh melarang keras pembakaran sampah terbuka di permukiman perkotaan demi menjaga kesehatan lingkungan masyarakat.",
    evaluate: (input, result) => {
      if (input.waste.openBurningHabit === "tidak_pernah") {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamu sudah tidak membakar sampah terbuka.",
          isDynamic: false,
        };
      }

      // Menghilangkan 100% emisi pembakaran sampah yang saat ini terjadi
      const burningDetail = result.categories.sampah.details.find((d) =>
        d.item.toLowerCase().includes("pembakaran")
      );
      const savingKgCO2e = burningDetail ? burningDetail.subtotalKgCO2e : 8.5;

      return {
        isApplicable: savingKgCO2e > 0,
        savingKgCO2e,
        explanation: `Menghentikan total praktik pembakaran sampah pekarangan menghilangkan ~${savingKgCO2e} kg CO₂e/bln emisi gas rumah kaca langsung.`,
        isDynamic: true,
      };
    },
  },
  {
    id: "action_pilah_botol_bank_sampah",
    title: "Pilah Botol Plastik & Kardus ke Bank Sampah Kampus",
    category: "sampah",
    categoryLabel: "Pengelolaan Sampah",
    difficulty: "Sedang",
    financialBenefit: "Dapat ditabung dan ditukar saldo di Bank Sampah USK",
    description:
      "Pisahkan botol minuman plastik PET, kaleng, dan kardus bekas paket belanja online secara terpisah dari sisa makanan basah.",
    localContextAceh:
      "Kampus USK memiliki unit Bank Sampah dan fasilitas pemilahan mandiri di berbagai fakultas yang siap menampung sampah daur ulang mahasiswa.",
    evaluate: (input, result) => {
      if (input.waste.sortingHabit === "selalu_pilah") {
        return {
          isApplicable: false,
          savingKgCO2e: 0,
          explanation: "Kamu sudah aktif memilah sampah secara optimal.",
          isDynamic: false,
        };
      }

      // Dari tidak pernah / kadang pilah menjadi selalu pilah: mereduksi timbulan ke TPA hingga 40%
      const landfillEmissions = result.categories.sampah.details[0]?.subtotalKgCO2e || 4.0;
      const savingKgCO2e = Math.round(landfillEmissions * 0.45 * 10) / 10;

      return {
        isApplicable: savingKgCO2e > 0.3,
        savingKgCO2e,
        explanation: `Memilah sampah anorganik mengalihkan beban residu dari TPA, menghemat ~${savingKgCO2e} kg CO₂e/bln emisi dekomposisi metana.`,
        isDynamic: true,
      };
    },
  },
];

export function getPersonalizedGreenActions(
  input: UserCalculatorInput,
  result: CalculationResult
): EvaluatedGreenAction[] {
  const evaluatedList: EvaluatedGreenAction[] = ACTION_DEFINITIONS.map((def) => {
    const { isApplicable, savingKgCO2e, explanation, isDynamic } = def.evaluate(input, result);

    let impactLevel: "Tinggi" | "Sedang" | "Rendah" = "Rendah";
    if (savingKgCO2e >= 10) {
      impactLevel = "Tinggi";
    } else if (savingKgCO2e >= 3) {
      impactLevel = "Sedang";
    }

    return {
      id: def.id,
      title: def.title,
      category: def.category,
      categoryLabel: def.categoryLabel,
      impactLevel,
      potentialMonthlySavingKgCO2e: Math.max(0, savingKgCO2e),
      calculationExplanation: explanation,
      isDynamic,
      financialBenefit: def.financialBenefit,
      difficulty: def.difficulty,
      description: def.description,
      localContextAceh: def.localContextAceh,
      isApplicable,
    };
  });

  // Hanya tampilkan aksi yang relevan dan dapat diterapkan
  const applicableActions = evaluatedList.filter((a) => a.isApplicable);

  // Urutkan aksi:
  // 1. Aksi dari sektor yang merupakan hotspot tertinggi pengguna didahulukan
  // 2. Aksi dengan potensi penurunan emisi terbesar didahulukan
  return applicableActions.sort((a, b) => {
    const aIsHighest = a.category === result.highestCategory.category ? 1 : 0;
    const bIsHighest = b.category === result.highestCategory.category ? 1 : 0;
    if (aIsHighest !== bIsHighest) return bIsHighest - aIsHighest;

    return b.potentialMonthlySavingKgCO2e - a.potentialMonthlySavingKgCO2e;
  });
}
