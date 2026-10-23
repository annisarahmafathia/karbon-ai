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
    systemBoundary:
      "Cradle-to-grave (ekstraksi minyak bumi/gas fosil, polimerisasi resin polietilena HDPE, ekstrusi blown film kantong belanja, transportasi distribusi ritel, serta pengelolaan sampah akhir di TPA/insinerasi)",
    source:
      "UK Environment Agency (2011) Life Cycle Assessment of Supermarket Carrier Bags (SC030148) & DEFRA GHG Conversion Factors (2022)",
    year: 2022,
    scope: "Global LCA / Retail Packaging Standard",
    uncertainty: "Rendah (<10%)",
    verificationStatus: "Terverifikasi Resmi",
    limitations:
      "Mengasumsikan kantong kresek belanjaan ritel/pasar standar berbobot rata-rata 10–12 gram. Tidak mencakup kantong non-woven polypropylene tebal (spunbond) yang membutuhkan frekuensi pemakaian ulang lebih tinggi untuk mencapai titik impas emisi.",
    notes:
      "Dihitung dari emisi resin HDPE (~2.1 kg CO₂e/kg polimer) ditambah energi pembentukan kantong dan pembuangan akhir. Menggunakan tas belanja kain guna ulang (reusable tote bag) secara berulang mengeliminasi emisi kresek baru.",
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
    systemBoundary:
      "Cradle-to-grave (ekstraksi propilena petrokimia, polimerisasi polipropilena/PP, thermoforming/injection molding wadah makanan dan penutup, distribusi, serta penanganan akhir sampah)",
    source:
      "Gallego-Schmid et al. (2019) University of Manchester / Prevent Waste Alliance LCA of Takeaway Packaging (2021)",
    year: 2021,
    scope: "Global LCA / Takeaway Food Packaging",
    uncertainty: "Sedang (10-30%)",
    verificationStatus: "Estimasi Literatur Ilmiah",
    limitations:
      "Berdasarkan wadah makanan bawa pulang (takeaway/thinwall) polipropilena ukuran 650–750 ml dengan massa wadah dan tutup sekitar 25–35 gram. Emisi aktual dapat berbeda untuk wadah komposit multi-layer atau wadah berdinding sangat tebal.",
    notes:
      "Wadah plastik kaku memiliki massa polimer lebih padat (~30 gram) sehingga emisinya per buah lebih besar dibanding kantong tipis. Membawa kotak bekal (reusable food container) langsung memangkas kebutuhan wadah plastik baru.",
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
    systemBoundary:
      "Cradle-to-grave (produksi bahan baku purified terephthalic acid/PTA dan monoethylene glycol/MEG, polimerisasi resin virgin PET, injection stretch blow molding, penutup botol HDPE, label, serta penanganan akhir sampah)",
    source:
      "PlasticsEurope Eco-profiles (2020) & DEFRA UK GHG Conversion Factors for Packaging (PET, 2022)",
    year: 2022,
    scope: "Global LCA / Beverage Packaging",
    uncertainty: "Rendah (<10%)",
    verificationStatus: "Terverifikasi Resmi",
    limitations:
      "Mengasumsikan botol air mineral ukuran 500–600 ml berbobot rata-rata 18–22 gram berbahan PET virgin tanpa kandungan rPET daur ulang. Botol galon isi ulang atau botol dengan persentase rPET tinggi memiliki intensitas karbon per liter yang berbeda.",
    notes:
      "Emisi didorong oleh energi pemurnian petrokimia resin PET dan proses blow-molding bertekanan tinggi. Membiasakan membawa tumbler isi ulang mengeliminasi akumulasi botol plastik baru.",
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
    systemBoundary:
      "Cradle-to-grave (ekstraksi stirena monomerdari minyak bumi, polimerisasi, peniupan gas pentana menjadi foam EPS busa, thermoforming kotak clamshell, distribusi, dan pembuangan akhir)",
    source:
      "Zero Waste Scotland (2020) LCA of Takeaway Food Packaging & Franklin Associates / American Chemistry Council (2018)",
    year: 2020,
    scope: "Global LCA / Foodservice Packaging",
    uncertainty: "Sedang (10-30%)",
    verificationStatus: "Estimasi Literatur Ilmiah",
    limitations:
      "Berdasarkan boks makanan styrofoam (clamshell) burger atau boks makan siang ringan dengan massa rata-rata 4–6 gram. Nilai tidak mencakup kerusakan ekosistem laut atau bahaya fragmentasi mikroplastik yang belum terkuantifikasi dalam GWP 100 tahun.",
    notes:
      "Styrofoam terdiri atas 95-98% udara dan 2-5% polistirena. Walaupun massanya ringan, sifatnya sangat resisten terhadap degradasi alami, hampir tidak memiliki nilai daur ulang di Indonesia, dan menghasilkan emisi gas rumah kaca saat dibakar atau ditimbun di TPA.",
    isAvailable: true,
  },
};

// Aliaskan untuk kompatibilitas
export const EMISSION_FACTORS = PLASTIC_EMISSION_FACTORS;

// Tolok ukur emisi plastik sekali pakai per kapita nasional (Indonesia):
// Berdasarkan data timbulan sampah plastik KLHK / BPS (~20 kg plastik/kapita/tahun)
// Ekuivalen dengan ~0.85 kg CO₂e / minggu per kapita dari barang plastik sekali pakai.
export const NATIONAL_AVG_PLASTIC_WEEKLY_KG = 0.85;
