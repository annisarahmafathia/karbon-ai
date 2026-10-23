import {
  CalculationResult,
  PlasticCalculatorInput,
  PlasticCategory,
  CarbonCategoryType,
} from "../../types/carbon";
import { PLASTIC_EMISSION_FACTORS } from "../constants/emission-factors";

export interface EvaluatedGreenAction {
  id: string;
  title: string;
  category: CarbonCategoryType;
  categoryLabel: string;
  impactLevel: "Tinggi" | "Sedang" | "Rendah";
  potentialWeeklySavingKgCO2e: number;
  potentialMonthlySavingKgCO2e: number;
  calculationExplanation: string;
  isDynamic: boolean;
  financialBenefit: string;
  difficulty: "Mudah" | "Sedang" | "Perlu Usaha";
  description: string;
  localContextAceh: string;
  isApplicable: boolean;
}

interface ActionDefinition {
  id: string;
  title: string;
  category: PlasticCategory;
  categoryLabel: string;
  difficulty: "Mudah" | "Sedang" | "Perlu Usaha";
  financialBenefit: string;
  description: string;
  localContextAceh: string;
  evaluate: (
    input: PlasticCalculatorInput,
    result: CalculationResult
  ) => {
    isApplicable: boolean;
    weeklySavingKgCO2e: number;
    explanation: string;
    isDynamic: boolean;
  };
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  // 1. KANTONG PLASTIK
  {
    id: "action_kantong_kain",
    title: "Gunakan Tas Belanja Kain (Tote Bag) untuk Belanja Pasar / Swalayan",
    category: "kantong_plastik",
    categoryLabel: "Kantong Plastik",
    difficulty: "Mudah",
    financialBenefit: "Menghindari biaya kantong kresek berbayar di minimarket",
    description:
      "Selalu simpan satu atau dua kantong belanja kain lipat di dalam tas ransel kuliahmu untuk digunakan saat belanja di pasar tradisional atau swalayan.",
    localContextAceh:
      "Pasar Peunayong, Pasar Rukoh Darussalam, dan minimarket sekitar kampus USK/UIN siap melayani pembeli yang membawa tas belanja kain sendiri.",
    evaluate: (input) => {
      const bags = input.kantongPlastik;
      if (bags <= 0) {
        return {
          isApplicable: false,
          weeklySavingKgCO2e: 0,
          explanation: "Kamu sudah tidak menggunakan kantong kresek sekali pakai baru minggu ini.",
          isDynamic: false,
        };
      }

      // Mengganti 100% kantong kresek sekali pakai
      const factor = PLASTIC_EMISSION_FACTORS.kantong_plastik.value; // 0.033
      const weeklySavingKgCO2e = Math.round(bags * factor * 1000) / 1000;

      return {
        isApplicable: true,
        weeklySavingKgCO2e,
        explanation: `Dengan membawa tas kain sendiri, kamu menghemat ${bags} kantong kresek baru per minggu atau memangkas ~${weeklySavingKgCO2e} kg CO₂e/minggu (~${Math.round(weeklySavingKgCO2e * 52 * 10) / 10} kg CO₂e/tahun).`,
        isDynamic: true,
      };
    },
  },

  // 2. WADAH MAKANAN PLASTIK
  {
    id: "action_wadah_makanan_reusable",
    title: "Bawa Kotak Makan Sendiri (Food Container) Saat Beli Takeaway",
    category: "wadah_makanan",
    categoryLabel: "Wadah Makanan Plastik",
    difficulty: "Sedang",
    financialBenefit: "Porsi makanan di warung sering kali dilebihkan penjual!",
    description:
      "Gunakan kotak makan kaca atau plastik tebal guna ulang saat memesan makanan bawa pulang alih-alih menerima kotak thinwall atau mika sekali pakai.",
    localContextAceh:
      "Warung nasi, mie aceh, dan rumah makan di sekeliling Darussalam sangat terbuka menyajikan makanan ke dalam wadah yang dibawa mahasiswa.",
    evaluate: (input) => {
      const boxes = input.wadahMakanan;
      if (boxes <= 0) {
        return {
          isApplicable: false,
          weeklySavingKgCO2e: 0,
          explanation: "Kamu sudah bebas dari wadah makanan plastik sekali pakai minggu ini.",
          isDynamic: false,
        };
      }

      // Mengganti setidaknya 80% wadah makanan takeaway
      const factor = PLASTIC_EMISSION_FACTORS.wadah_makanan.value; // 0.155
      const reducedBoxes = Math.max(1, Math.round(boxes * 0.8));
      const weeklySavingKgCO2e = Math.round(reducedBoxes * factor * 1000) / 1000;

      return {
        isApplicable: true,
        weeklySavingKgCO2e,
        explanation: `Mengganti ${reducedBoxes} dari ${boxes} wadah makanan takeaway per minggu dengan kotak bekal menghemat ~${weeklySavingKgCO2e} kg CO₂e/minggu (~${Math.round(weeklySavingKgCO2e * 52 * 10) / 10} kg CO₂e/tahun).`,
        isDynamic: true,
      };
    },
  },

  // 3. BOTOL MINUM PLASTIK
  {
    id: "action_tumbler_sendiri",
    title: "Bawa Tumbler & Manfaatkan Stasiun Pengisian Air Minum Kampus",
    category: "botol_minum",
    categoryLabel: "Botol Minum Plastik",
    difficulty: "Mudah",
    financialBenefit: "Hemat pengeluaran air mineral botol ~Rp 30.000 - 60.000/minggu",
    description:
      "Gunakan botol minum isi ulang (tumbler) sehari-hari dan isi ulang air minum di dispenser galon kos atau water station kampus.",
    localContextAceh:
      "Kampus di Darussalam menyediakan fasilitas air minum isi ulang di berbagai gedung fakultas dan perpustakaan yang dapat dimanfaatkan secara gratis.",
    evaluate: (input) => {
      const bottles = input.botolMinum;
      if (bottles <= 0) {
        return {
          isApplicable: false,
          weeklySavingKgCO2e: 0,
          explanation: "Kamu sudah tidak membeli botol minum plastik sekali pakai baru minggu ini.",
          isDynamic: false,
        };
      }

      // Mengeliminasi seluruh pembelian botol baru dengan isi ulang tumbler
      const factor = PLASTIC_EMISSION_FACTORS.botol_minum.value; // 0.083
      const weeklySavingKgCO2e = Math.round(bottles * factor * 1000) / 1000;

      return {
        isApplicable: true,
        weeklySavingKgCO2e,
        explanation: `Membawa tumbler isi ulang menggantikan ${bottles} botol mineral PET baru per minggu, memangkas ~${weeklySavingKgCO2e} kg CO₂e/minggu (~${Math.round(weeklySavingKgCO2e * 52 * 10) / 10} kg CO₂e/tahun).`,
        isDynamic: true,
      };
    },
  },

  // 4. WADAH STYROFOAM
  {
    id: "action_hindari_styrofoam",
    title: "Tolak Kemasan Makanan Styrofoam & Minta Bungkus Daun / Wadah Sendiri",
    category: "wadah_styrofoam",
    categoryLabel: "Wadah Styrofoam",
    difficulty: "Mudah",
    financialBenefit: "Menghindari kontaminasi bahan kimia stirena berbahaya pada makanan panas",
    description:
      "Minta penjual untuk membungkus makanan dengan kertas/daun pisang atau gunakan kotak bekal sendiri daripada wadah styrofoam yang berpotensi melepaskan mikroplastik dan racun kimia.",
    localContextAceh:
      "Tradisi kuliner Aceh membungkus nasi gurih dan timphan menggunakan daun pisang alami merupakan alternatif ramah lingkungan terbaik warisan lokal.",
    evaluate: (input) => {
      const foam = input.wadahStyrofoam;
      if (foam <= 0) {
        return {
          isApplicable: false,
          weeklySavingKgCO2e: 0,
          explanation: "Kamu sudah tidak menggunakan wadah makanan styrofoam minggu ini.",
          isDynamic: false,
        };
      }

      const factor = PLASTIC_EMISSION_FACTORS.wadah_styrofoam.value; // 0.035
      const weeklySavingKgCO2e = Math.round(foam * factor * 1000) / 1000;

      return {
        isApplicable: true,
        weeklySavingKgCO2e,
        explanation: `Menolak ${foam} kotak styrofoam per minggu menghemat ~${weeklySavingKgCO2e} kg CO₂e/minggu dan mencegah sampah styrofoam yang bertahan ribuan tahun di lingkungan.`,
        isDynamic: true,
      };
    },
  },
];

export function getPersonalizedGreenActions(
  input: PlasticCalculatorInput,
  result: CalculationResult
): EvaluatedGreenAction[] {
  const evaluatedList: EvaluatedGreenAction[] = ACTION_DEFINITIONS.map((def) => {
    const { isApplicable, weeklySavingKgCO2e, explanation, isDynamic } = def.evaluate(
      input,
      result
    );

    const monthlySavingKgCO2e = Math.round(weeklySavingKgCO2e * (52 / 12) * 100) / 100;

    let impactLevel: "Tinggi" | "Sedang" | "Rendah" = "Rendah";
    if (weeklySavingKgCO2e >= 0.5) {
      impactLevel = "Tinggi";
    } else if (weeklySavingKgCO2e >= 0.15) {
      impactLevel = "Sedang";
    }

    return {
      id: def.id,
      title: def.title,
      category: def.category,
      categoryLabel: def.categoryLabel,
      impactLevel,
      potentialWeeklySavingKgCO2e: weeklySavingKgCO2e,
      potentialMonthlySavingKgCO2e: monthlySavingKgCO2e,
      calculationExplanation: explanation,
      isDynamic,
      financialBenefit: def.financialBenefit,
      difficulty: def.difficulty,
      description: def.description,
      localContextAceh: def.localContextAceh,
      isApplicable,
    };
  });

  // Tampilkan seluruh aksi, dengan aksi yang aplikatif dan sesuai hotspot tertinggi di urutan teratas
  return evaluatedList.sort((a, b) => {
    // 1. Aksi yang applicable di atas
    if (a.isApplicable !== b.isApplicable) {
      return a.isApplicable ? -1 : 1;
    }
    // 2. Kategori hotspot tertinggi didahulukan
    const aIsHighest = a.category === result.highestCategory.category ? 1 : 0;
    const bIsHighest = b.category === result.highestCategory.category ? 1 : 0;
    if (aIsHighest !== bIsHighest) return bIsHighest - aIsHighest;

    // 3. Potensi penghematan mingguan terbesar didahulukan
    return b.potentialWeeklySavingKgCO2e - a.potentialWeeklySavingKgCO2e;
  });
}
