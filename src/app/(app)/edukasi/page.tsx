"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLASTIC_EMISSION_FACTORS } from "@/lib/constants/emission-factors";
import { VerificationTier } from "@/types/carbon";
import {
  BookOpen,
  ShieldCheck,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Database,
  FileCheck,
  CheckCircle2,
  BookMarked,
  Info,
  Scale,
  RotateCcw,
} from "lucide-react";

export default function EdukasiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const factorList = Object.values(PLASTIC_EMISSION_FACTORS);

  const verifiedCount = factorList.filter(
    (f) =>
      f.verificationStatus === "Terverifikasi Resmi" ||
      f.verificationStatus === "Bersumber dari Referensi Resmi"
  ).length;
  const literatureCount = factorList.filter(
    (f) =>
      f.verificationStatus === "Estimasi Literatur Ilmiah" ||
      f.verificationStatus === "Estimasi Turunan Literatur"
  ).length;
  const provisionalCount = factorList.filter(
    (f) =>
      f.verificationStatus === "Provisional (Perlu Riset Lokal)" ||
      f.verificationStatus === "Provisional (Perlu Validasi Lokal)"
  ).length;

  const filteredFactors = factorList.filter((f) => {
    let matchesStatus = true;
    if (statusFilter === "verified") {
      matchesStatus =
        f.verificationStatus === "Terverifikasi Resmi" ||
        f.verificationStatus === "Bersumber dari Referensi Resmi";
    } else if (statusFilter === "literature") {
      matchesStatus =
        f.verificationStatus === "Estimasi Literatur Ilmiah" ||
        f.verificationStatus === "Estimasi Turunan Literatur";
    } else if (statusFilter === "provisional") {
      matchesStatus =
        f.verificationStatus === "Provisional (Perlu Riset Lokal)" ||
        f.verificationStatus === "Provisional (Perlu Validasi Lokal)";
    } else if (statusFilter !== "all") {
      matchesStatus = f.verificationStatus === statusFilter;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(searchLower) ||
      f.source.toLowerCase().includes(searchLower) ||
      f.notes.toLowerCase().includes(searchLower) ||
      f.limitations.toLowerCase().includes(searchLower) ||
      (f.derivationFormula && f.derivationFormula.toLowerCase().includes(searchLower)) ||
      f.activityUnit.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: VerificationTier) => {
    switch (status) {
      case "Terverifikasi Resmi":
      case "Bersumber dari Referensi Resmi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Bersumber dari Referensi Resmi
          </span>
        );
      case "Estimasi Literatur Ilmiah":
      case "Estimasi Turunan Literatur":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <BookMarked className="w-3 h-3 text-blue-600" />
            Estimasi Turunan Literatur
          </span>
        );
      case "Provisional (Perlu Riset Lokal)":
      case "Provisional (Perlu Validasi Lokal)":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Info className="w-3 h-3 text-amber-700" />
            Provisional (Perlu Validasi Lokal)
          </span>
        );
    }
  };

  const faqs = [
    {
      q: "Mengapa perhitungan menggunakan jumlah barang baru per minggu, bukan berat gram plastik atau nominal rupiah?",
      a: "Dalam kehidupan sehari-hari, masyarakat tidak menimbang sampah plastiknya dengan timbangan gram, dan harga barang tidak mencerminkan emisi fisik plastiknya. KarbonAI menggunakan pendekatan Activity-Based Estimation satuan fisik 'buah baru/minggu' yang kemudian dikonversikan ke kg CO₂e menggunakan faktor emisi per buah yang diturunkan dari massa referensi pasar (gram/buah) dan koefisien emisi resin polimer (kg CO₂e/kg) dari publikasi ilmiah resmi.",
    },
    {
      q: "Bagaimana aturan penggunaan ulang (reuse) diterapkan dalam perhitungan?",
      a: "Perhitungan berfokus pada jumlah barang baru yang masuk ke siklus konsumsi selama 1 minggu. Contoh: (1) Satu botol atau kotak makan plastik yang dicuci dan digunakan ulang 5 kali dalam seminggu tetap dihitung 1 barang baru. (2) Lima botol berbeda yang dibuka dihitung 5 barang baru. (3) Wadah yang sudah digunakan pada minggu sebelumnya tidak dihitung kembali sebagai barang baru hanya karena masih digunakan. Penggunaan ulang barang yang sama tidak menambah jumlah barang baru.",
    },
    {
      q: "Bagaimana faktor emisi per barang dihitung dari referensi berbasis berat (kg material)?",
      a: "Sebagian besar basis data LCA menyediakan faktor emisi dalam satuan kg CO₂e per kg polimer resin murni. KarbonAI menghitung faktor emisi per barang jadi secara transparan melalui rumus estimasi turunan: [Massa Referensi Barang (kg) × Faktor Emisi Polimer (kg CO₂e/kg)]. Rincian massa acuan: (1) Kantong kresek HDPE: ~10 gram (koefisien DEFRA 2022); (2) Kotak makanan thinwall PP: ~30 gram (Gallego-Schmid et al. 2019 / Prevent Waste Alliance); (3) Botol air mineral PET 500-600ml: ~20 gram (PlasticsEurope 2020 & DEFRA 2022); (4) Kotak styrofoam EPS: ~5 gram (estimasi internal KarbonAI untuk boks ringan lokal; sebagai pembanding, laporan Zero Waste Scotland mencatat 51 g CO₂e untuk boks standar UK berbobot 7,8 gram).",
    },
    {
      q: "Apa batas sistem (system boundary) yang digunakan dan apa keterbatasan geografisnya?",
      a: "Seluruh faktor emisi menggunakan batas sistem Cradle-to-Grave (dari ekstraksi bahan baku hidrokarbon fosil, polimerisasi resin plastik, pembentukan kemasan/botol, transportasi distribusi ritel, hingga pengangkutan dan pembuangan akhir di TPA/insinerasi). Namun demikian, data inventarisasi daur hidup (LCI) dasar yang tersedia di literatur global berasal dari Eropa dan Inggris (DEFRA/PlasticsEurope). Di Indonesia, bauran energi pembangkit listrik (grid mix) masih didominasi batu bara dan pengelolaan sampah akhir memiliki tingkat open dumping lebih tinggi, sehingga angka ini merupakan estimasi konservatif yang idealnya disempurnakan dengan LCI lokal Indonesia di masa mendatang.",
    },
    {
      q: "Bagaimana asumsi konversi mingguan ke bulanan dan tahunan?",
      a: "Satuan utama adalah kg CO₂e/minggu. Untuk proyeksi tahunan, nilai mingguan dikalikan 52 minggu (1 tahun = 52 minggu). Untuk proyeksi bulanan, nilai tahunan dibagi 12 bulan (atau nilai mingguan dikalikan ~4.333 minggu/bulan).",
    },
    {
      q: "Apakah angka 0.85 kg CO₂e/minggu merupakan rata-rata resmi konsumsi plastik nasional dari pemerintah?",
      a: "Bukan. Angka 0,85 kg CO₂e/minggu adalah tolok ukur pembanding ilustratif internal KarbonAI untuk memberikan konteks komparasi, bukan data statistik resmi per kapita untuk 4 jenis barang ini yang diterbitkan oleh KLHK atau BPS. Angka ini diestimasi secara aproksimatif dari total timbulan sampah plastik per kapita nasional (data KLHK/UNEP, ~18–22 kg plastik/orang/tahun) dikalikan rata-rata faktor emisi polimer plastik (~2,2 kg CO₂e/kg) lalu dibagi 52 minggu. Keterbatasan ilmiah: timbulan sampah nasional mencakup semua jenis plastik (kemasan sachet multilayer, kantong besar, kemasan industri, dll.), sementara kalkulator KarbonAI berfokus secara spesifik pada 4 kategori kemasan harian individu.",
    },
    {
      q: "Apakah beralih ke wadah nonplastik atau tas kain selalu menghasilkan emisi karbon lebih rendah?",
      a: "Tidak secara instan. Pembuatan material alternatif memiliki jejak energi manufaktur awal yang lebih tinggi daripada plastik sekali pakai yang sangat tipis/ringan, sehingga memerlukan frekuensi penggunaan ulang tertentu (break-even reuse threshold) untuk mencapai titik impas. Berdasarkan studi LCA primer: (1) Tas katun konvensional memerlukan minimal 131 kali penggunaan ulang untuk mengimbangi kresek HDPE sekali pakai (UK Environment Agency 2011 SC030148), sedangkan tas belanja non-woven PP memerlukan 11 kali; (2) Kotak makanan bekal guna ulang (reusable PP container) menurut Gallego-Schmid et al. (2019) memiliki rentang titik impas 16–39 kali penggunaan untuk indikator jejak karbon tergantung metode pencucian (mesin cuci piring efisien ~18 kali vs pencucian manual air panas ~39 kali) jika dibandingkan kemasan sekali pakai, dan dapat mencapai 208 kali jika mengevaluasi dampak lingkungan lain seperti ekotoksisitas; wadah thinwall sekali pakai jika dicuci kembali mencapai titik impas pada 4–5 kali; (3) Tumbler botol minum memerlukan sekitar 15–50 kali pemakaian ulang dibanding botol air mineral PET sekali pakai.",
    },
    {
      q: "Mengapa faktor emisi wadah styrofoam per buah lebih kecil daripada kotak makanan plastik PP thinwall?",
      a: "Perbedaan ini disebabkan oleh perbedaan massa fisik produk. Kotak styrofoam (EPS) di KarbonAI diasumsikan berbobot ~5 gram untuk boks makanan ringan lokal (emisi estimasi internal ~0.035 kg CO₂e atau 35 g CO₂e; sebagai perbandingan, Zero Waste Scotland mencatat 51 g CO₂e untuk boks standar UK berbobot 7,8 gram). Sebaliknya, kotak thinwall polipropilena (PP) memiliki struktur plastik padat (~30 gram, sekitar 6 kali lebih berat) dengan emisi produk ~0.155 kg CO₂e. Meskipun emisi gas rumah kaca styrofoam per buah tampak lebih kecil karena massanya ringan, styrofoam memiliki dampak fisik lingkungan yang sangat buruk karena hampir tidak didaur ulang di Indonesia dan mudah terfragmentasi menjadi mikroplastik di alam liar.",
    },
  ];

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumentasi Sains & Metodologi Perhitungan</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
            Metodologi Jejak Karbon Plastik Sekali Pakai
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Transparansi penuh mengenai rumus perhitungan, asal-usul faktor emisi per barang, data massa referensi, batas sistem LCA, dan aturan penggunaan ulang.
          </p>
        </div>

        {/* Verification Tiers Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-800">{verifiedCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Bersumber dari Referensi Resmi</div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Koefisien emisi material polimer primer bersumber dari basis data instansi resmi (DEFRA UK & PlasticsEurope) dan dikalikan massa barang acuan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-800">{literatureCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Estimasi Turunan Literatur</div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Diturunkan dari studi LCA peer-reviewed (University of Manchester / Gallego-Schmid et al., Zero Waste Scotland) berbasis massa spesifik wadah.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-900">{provisionalCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Provisional (Perlu Validasi Lokal)</div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Penanda status untuk faktor emisi yang memerlukan kalibrasi lanjutan terhadap data bauran energi (grid mix) dan fasilitas persampahan lokal Indonesia.
              </p>
            </div>
          </div>
        </div>

        {/* Core Formula Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-sage/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint text-forest flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal">
                Rumus Dasar Perhitungan Emisi Mingguan
              </h2>
              <span className="text-xs text-muted">
                Standar Activity-Based Estimation & Pendekatan Estimasi Turunan (Massa × Faktor Emisi Material)
              </span>
            </div>
          </div>

          <div className="p-6 bg-cream/70 rounded-2xl border border-sage/30 text-center space-y-3">
            <div className="text-xs uppercase font-extrabold text-muted tracking-wider">
              Formula Matematika Utama
            </div>
            <div className="text-base sm:text-xl font-mono font-black text-forest">
              Emisi Kategori (kg CO₂e/minggu) = Jumlah Barang Baru (buah/minggu) × Faktor Emisi per Barang (kg CO₂e/buah)
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-forest-dark bg-white/70 py-1.5 px-3 rounded-xl border border-sage/20 inline-block">
              Faktor Emisi per Barang = [Massa Acuan (kg) × Koefisien Polimer Resin (kg CO₂e/kg material)] + Emisi EoL
            </div>
            <div className="text-sm sm:text-lg font-mono font-bold text-charcoal">
              Total Emisi Mingguan = Σ (Emisi dari 4 Kategori Plastik)
            </div>
            <p className="text-xs text-muted max-w-xl mx-auto pt-1 leading-relaxed">
              Satuan utama adalah <strong>kg CO₂e/minggu</strong>. Proyeksi tahunan menggunakan 52 minggu per tahun, dan proyeksi bulanan menggunakan rata-rata ~4.333 minggu per bulan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-forest" />
                <span>1. Basis Massa & Estimasi Turunan</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Faktor emisi per barang merupakan estimasi turunan transparan dari massa rata-rata kemasan (gram) dikalikan faktor emisi polimer resin (kg CO₂e/kg) dari referensi LCA resmi internasional.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-forest" />
                <span>2. Aturan Penggunaan Ulang</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Perhitungan menggunakan jumlah barang baru yang masuk siklus mingguan. Penggunaan ulang barang yang sama (misal mencuci kotak thinwall atau mengisi ulang botol) tidak menambah hitungan barang baru.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-forest" />
                <span>3. Batas Sistem Daur Hidup</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Mencakup emisi produksi resin hulu hingga pengangkutan dan pembuangan akhir di hilir (Cradle-to-Grave), namun tetap memperhatikan keterbatasan data lokal Indonesia.
              </p>
            </div>
          </div>
        </div>

        {/* Database of Emission Factors Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-forest" />
                <h2 className="text-lg font-bold text-charcoal">
                  Tabel Empat Faktor Emisi Plastik Sekali Pakai
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Seluruh faktor emisi lengkap dengan data massa referensi, batas sistem LCA, status verifikasi, dan publikasi sumber
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Cari faktor emisi, sumber..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-sage/40 focus:outline-none focus:ring-1 focus:ring-forest bg-cream/40"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-sage/40 bg-cream/40 font-semibold text-charcoal"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="verified">Bersumber dari Referensi Resmi</option>
                <option value="literature">Estimasi Turunan Literatur</option>
                <option value="provisional">Provisional (Perlu Validasi Lokal)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sage/30 bg-cream text-charcoal">
                  <th className="py-3 px-3 font-bold">Kategori Barang</th>
                  <th className="py-3 px-3 font-bold">Faktor Emisi (EF)</th>
                  <th className="py-3 px-3 font-bold">Asumsi Massa</th>
                  <th className="py-3 px-3 font-bold">Satuan Input</th>
                  <th className="py-3 px-3 font-bold">Batas Sistem (LCA)</th>
                  <th className="py-3 px-3 font-bold">Status Verifikasi</th>
                  <th className="py-3 px-3 font-bold">Sumber Rujukan Ilmiah</th>
                  <th className="py-3 px-3 font-bold">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/20">
                {filteredFactors.map((f) => (
                  <tr key={f.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-charcoal">{f.name}</div>
                      <div className="text-[10px] text-muted mt-0.5 max-w-xs">{f.notes}</div>
                      {f.derivationFormula && (
                        <div className="text-[9px] font-mono text-forest bg-mint/40 border border-mint/60 px-1.5 py-0.5 rounded mt-1 max-w-xs">
                          {f.derivationFormula}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 align-top font-mono font-bold text-forest whitespace-nowrap">
                      {f.value} <span className="text-[11px] font-normal text-muted">{f.unit}</span>
                    </td>
                    <td className="py-3 px-3 align-top font-semibold text-charcoal whitespace-nowrap">
                      ~{f.materialMassGrams} gram
                    </td>
                    <td className="py-3 px-3 align-top font-mono text-charcoal/80 whitespace-nowrap">
                      {f.activityUnit}
                    </td>
                    <td className="py-3 px-3 align-top text-muted text-[11px] max-w-xs">
                      {f.systemBoundary}
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {getStatusBadge(f.verificationStatus)}
                    </td>
                    <td className="py-3 px-3 align-top text-muted font-medium max-w-xs">
                      {f.source}
                    </td>
                    <td className="py-3 px-3 align-top text-muted whitespace-nowrap">
                      {f.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assumptions & Limitations Box */}
        <div className="bg-amber-50/70 rounded-3xl p-6 sm:p-8 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-900">
              Asumsi, Batasan Metodologi, & Peringatan Ilmiah
            </h2>
          </div>

          <div className="text-xs text-amber-950/80 space-y-2.5 leading-relaxed">
            <p>
              <strong>1. Sifat Estimasi Turunan Berbasis Massa:</strong> Faktor emisi per barang dihitung dari berat rata-rata sampel barang di pasaran (10g untuk kantong kresek HDPE, 30g untuk kotak thinwall PP, 20g untuk botol PET 500-600ml, dan 5g untuk kotak foam EPS) dikalikan faktor emisi polimer resin. Khusus wadah styrofoam, angka 0,035 kg CO₂e adalah estimasi internal KarbonAI untuk boks ringan lokal 5 gram; sebagai perbandingan, laporan Zero Waste Scotland mencatat 0,051 kg CO₂e (51 g CO₂e) untuk boks standar UK berbobot 7,8 gram. Barang dengan ketebalan ekstrem di luar rentang standar akan memiliki emisi aktual yang berbeda.
            </p>
            <p>
              <strong>2. Pemisahan Dampak Perubahan Iklim (GWP) vs Persistensi Sampah Padat:</strong> Persistensi fisik styrofoam dan kantong plastik yang bertahan puluhan hingga ratusan tahun di alam merupakan isu pencemaran sampah padat dan fragmentasi mikroplastik, bukan berarti gas rumah kaca (CO₂e) terus berakumulasi bertambah di atmosfer selama sampah mengendap di tanah. Emisi gas rumah kaca diukur dalam potensi pemanasan global 100 tahun (GWP-100) yang terjadi selama siklus daur hidup material (manufaktur dan dekomposisi).
            </p>
            <p>
              <strong>3. Alternatif Nonplastik Memerlukan Titik Impas Kontekstual (Break-Even Reuse):</strong> Mengganti kemasan plastik dengan tas kain atau kotak bekal guna ulang tidak otomatis menghemat emisi karbon seketika. Berdasarkan studi LCA primer, setiap alternatif memerlukan titik impas pemakaian yang berbeda: tas katun memerlukan minimal 131 kali penggunaan ulang untuk mengimbangi kresek HDPE sekali pakai (UK Environment Agency 2011 SC030148), tas spunbond non-woven PP memerlukan 11 kali, kotak makanan guna ulang tebal memerlukan rentang 16–39 kali penggunaan untuk indikator gas rumah kaca tergantung metode pencucian (mesin cuci piring efisien ~18 kali vs manual air panas ~39 kali) dibanding kemasan sekali pakai, dan dapat mencapai 208 kali jika mengevaluasi dampak lingkungan lain seperti ekotoksisitas (Gallego-Schmid et al. 2019); serta tumbler botol minum memerlukan sekitar 15–50 kali pemakaian.
            </p>
            <p>
              <strong>4. Status Tolok Ukur 0,85 kg CO₂e/minggu:</strong> Angka 0,85 kg CO₂e/minggu merupakan tolok ukur ilustratif internal KarbonAI, bukan data statistik resmi nasional per kapita untuk 4 barang ini dari pemerintah. Angka ini diestimasi dari total timbulan sampah plastik nasional per kapita (data KLHK/UNEP, ~20 kg/tahun) dikalikan rata-rata faktor polimer (~2,2 kg CO₂e/kg) dibagi 52 minggu. Timbulan sampah nasional mencakup semua jenis plastik (multilayer sachet, karung, galon, dll.), sedangkan KarbonAI berfokus secara spesifik pada 4 kemasan harian individu.
            </p>
            <p>
              <strong>5. Batasan Geografis dan Validitas Data Lokal:</strong> Seluruh faktor emisi menggunakan batas sistem Cradle-to-Grave berdasarkan data inventarisasi daur hidup (LCI) internasional (DEFRA/PlasticsEurope). Di Indonesia, bauran energi listrik masih didominasi batu bara dan tingkat penanganan TPA terbuka (open dumping) lebih tinggi, sehingga angka ini merupakan estimasi konservatif yang idealnya disempurnakan dengan studi LCI spesifik Indonesia di masa mendatang.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-forest" />
            <h2 className="text-lg font-bold text-charcoal">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-sage/30 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 bg-cream/30 hover:bg-cream transition-colors"
                  >
                    <span className="text-sm font-bold text-charcoal">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-forest shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-forest shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white text-xs sm:text-sm text-charcoal/80 leading-relaxed border-t border-sage/20 animate-in fade-in-50 duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA to Calculator */}
        <div className="text-center pt-4">
          <Link
            href="/kalkulator"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-forest hover:bg-forest-dark text-cream font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <span>Mulai Hitung Jejak Karbon Plastikmu</span>
            <ArrowRight className="w-4 h-4 text-sage" />
          </Link>
        </div>
      </div>
    </div>
  );
}
