import { EmissionFactorMeta, PlasticCategory } from "../../types/carbon";

/**
 * BASIS DATA FAKTOR EMISI PLASTIK SEKALI PAKAI
 * Dihitung berdasarkan pendekatan Data Aktivitas (buah/minggu) × Faktor Emisi (kg CO₂e/buah)
 * dengan rujukan Life Cycle Assessment (LCA) ilmiah dan basis data resmi internasional.
 */
export const PLASTIC_EMISSION_FACTORS: Record<PlasticCategory, EmissionFactorMeta> = {
  // 1. KANTONG PLASTIK SEKALI PAKAI (HDPE)
  kantong_plastik: {
    id: "kantong_plastik",
    name: "Kantong Plastik Sekali Pakai (Kresek HDPE)",
    category: "kantong_plastik",
    value: 0.033,
    unit: "kg CO₂e / buah",
    activityUnit: "buah kantong / minggu",
    materialMassGrams: 10,
    systemBoundary: "Cradle-to-grave",
    source:
      "UK Environment Agency (2011) Life Cycle Assessment of Supermarket Carrier Bags (SC030148) & DEFRA GHG Conversion Factors (2022)",
    year: 2022,
    scope: "Global LCA / Retail Packaging Standard",
    uncertainty: "Rendah (<10%)",
    verificationStatus: "Bersumber dari Referensi Resmi",
    derivationFormula: "10 g × ~3.27 kg CO₂e/kg (DEFRA 2022) = 0.033 kg CO₂e/buah",
    limitations:
      "Estimasi turunan berdasarkan kantong kresek ritel standar berbobot 10 gram menggunakan koefisien DEFRA 2022 (HDPE incl. forming, 3.27 kg CO₂e/kg). Dalam laporan UK Environment Agency 2011 (SC030148), massa sampel kantong adalah 8.12 gram dengan emisi 0.025 kg CO₂e (tanpa secondary reuse) atau 0.019 kg CO₂e (dengan 40.3% reuse sebagai bin liner).",
    notes:
      "Dihitung dari perkiraan berat kantong kresek sekitar 10 gram dan faktor emisi material polimer HDPE sebesar 3,27 kg CO₂e/kg.",
    isAvailable: true,
  },

  // 2. WADAH MAKANAN PLASTIK SEKALI PAKAI (PP THINWALL / MIKA)
  wadah_makanan: {
    id: "wadah_makanan",
    name: "Wadah Makanan Plastik Sekali Pakai (Thinwall / Kotak Plastik PP)",
    category: "wadah_makanan",
    value: 0.155,
    unit: "kg CO₂e / buah",
    activityUnit: "buah wadah / minggu",
    materialMassGrams: 30,
    systemBoundary: "Cradle-to-grave",
    source:
      "Gallego-Schmid et al. (2019) University of Manchester (Journal of Cleaner Production 211: 417-427) & Prevent Waste Alliance (2021)",
    year: 2021,
    scope: "Global LCA / Takeaway Food Packaging",
    uncertainty: "Sedang (10-30%)",
    verificationStatus: "Estimasi Turunan Literatur",
    derivationFormula: "30 g × ~5.17 kg CO₂e/kg (emisi kemasan takeaway) = 0.155 kg CO₂e/buah",
    limitations:
      "Estimasi turunan dari studi kemasan takeaway PP kapasitas 650–750 ml dengan massa wadah dan tutup rata-rata 30 gram (rentang studi: 25–35 gram, rentang emisi: 0.12–0.19 kg CO₂e/wadah). Nilai 5.17 kg CO₂e/kg mencakup intensitas rantai pasok kemasan takeaway siap pakai, bukan sekadar koefisien resin polimer curah murni (DEFRA PP forming = 3.10 kg CO₂e/kg).",
    notes:
      "Dihitung dari perkiraan berat wadah beserta tutup sekitar 30 gram dan faktor emisi material kemasan polipropilena sebesar 5,17 kg CO₂e/kg.",
    isAvailable: true,
  },

  // 3. BOTOL MINUM PLASTIK SEKALI PAKAI (PET 500-600 ML)
  botol_minum: {
    id: "botol_minum",
    name: "Botol Minum Plastik Sekali Pakai (PET 500–600 ml)",
    category: "botol_minum",
    value: 0.083,
    unit: "kg CO₂e / buah",
    activityUnit: "buah botol / minggu",
    materialMassGrams: 20,
    systemBoundary: "Cradle-to-grave",
    source:
      "PlasticsEurope Eco-profiles (2020) & DEFRA UK GHG Conversion Factors for Packaging (PET, 2022)",
    year: 2022,
    scope: "Global LCA / Beverage Packaging",
    uncertainty: "Rendah (<10%)",
    verificationStatus: "Bersumber dari Referensi Resmi",
    derivationFormula: "[18 g PET × 4.03 kg CO₂e/kg] + [2 g HDPE cap × 3.27 kg CO₂e/kg] + EoL = 0.083 kg CO₂e/buah",
    limitations:
      "Estimasi turunan untuk botol air mineral ukuran 500–600 ml berbobot rata-rata 18–22 gram berbahan virgin PET tanpa kandungan rPET daur ulang. LCI PlasticsEurope murni berfokus pada gerbang pabrik resin (cradle-to-gate ~2.15–2.80 kg CO₂e/kg), sedangkan angka 0.083 kg CO₂e/buah merupakan model cradle-to-grave lengkap berbasis DEFRA 2022 (4.03 kg CO₂e/kg PET forming + tutup HDPE 2g).",
    notes:
      "Dihitung dari perkiraan berat botol sekitar 20 gram dan faktor emisi material kemasan plastik PET beserta tutupnya.",
    isAvailable: true,
  },

  // 4. WADAH STYROFOAM SEKALI PAKAI (EXPANDED POLYSTYRENE / EPS)
  wadah_styrofoam: {
    id: "wadah_styrofoam",
    name: "Wadah Makanan Styrofoam Sekali Pakai (Expanded Polystyrene / EPS)",
    category: "wadah_styrofoam",
    value: 0.035,
    unit: "kg CO₂e / buah",
    activityUnit: "buah wadah / minggu",
    materialMassGrams: 5,
    systemBoundary: "Cradle-to-grave",
    source:
      "Zero Waste Scotland (2020) LCA of Takeaway Food Packaging & Franklin Associates / American Chemistry Council (2018)",
    year: 2020,
    scope: "Global LCA / Foodservice Packaging",
    uncertainty: "Sedang (10-30%)",
    verificationStatus: "Estimasi Turunan Literatur",
    derivationFormula: "5 g × ~7.00 kg CO₂e/kg (estimasi internal proses foaming EPS) = 0.035 kg CO₂e/buah",
    limitations:
      "Estimasi turunan internal KarbonAI berdasarkan boks makanan ringan EPS tipis (~5 gram) dengan koefisien proses foaming ~7.0 kg CO₂e/kg. Sebagai perbandingan, laporan Zero Waste Scotland mencatat 51 g CO₂e (0.051 kg CO₂e) per wadah EPS takeaway standar UK dengan massa ~7.8 gram. Angka 0.035 kg CO₂e KarbonAI merupakan estimasi independen untuk wadah berukuran lebih kecil/ringan di Indonesia dan bukan kutipan angka langsung dari Zero Waste Scotland.",
    notes:
      "Dihitung dari perkiraan berat wadah makanan sekitar 5 gram dan faktor emisi material polistirena busa (EPS) sebesar 7,00 kg CO₂e/kg.",
    isAvailable: true,
  },
};

// Aliaskan untuk kompatibilitas
export const EMISSION_FACTORS = PLASTIC_EMISSION_FACTORS;

// Tolok ukur pembanding ilustratif internal KarbonAI (~0.85 kg CO₂e/minggu per orang):
// Diturunkan sebagai simulasi kasar dari estimasi timbulan sampah plastik umum per kapita Indonesia
// (~20 kg plastik/orang/tahun dari data umum KLHK/BPS yang mencakup seluruh jenis plastik,
// dikalikan faktor emisi rata-rata plastik ~2.2 kg CO₂e/kg dibagi 52 minggu = ~0.85 kg CO₂e/minggu).
// KETERBATASAN PENTING: Angka ini BUKAN data survei resmi nasional mengenai konsumsi 4 kategori
// plastik yang dihitung KarbonAI, melainkan hanya titik referensi ilustratif internal.
export const NATIONAL_AVG_PLASTIC_WEEKLY_KG = 0.85;
