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
      a: "Faktor emisi per barang dihitung dengan mengalikan perkiraan berat rata-rata barang dengan faktor emisi material dari literatur ilmiah: kantong kresek HDPE (~10 gram), kotak makanan PP (~30 gram), botol PET (~20 gram), dan wadah styrofoam EPS (~5 gram).",
    },
    {
      q: "Apa batas sistem (system boundary) yang digunakan dalam perhitungan?",
      a: "Perhitungan menggunakan batas sistem Cradle-to-Grave yang mencakup siklus hidup barang mulai dari ekstraksi bahan baku, proses produksi, distribusi, hingga pembuangan akhir.",
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
      a: "Tidak selalu langsung lebih rendah. Alternatif guna ulang umumnya memerlukan lebih banyak energi untuk diproduksi, sehingga perlu digunakan berulang kali agar dampak emisinya menjadi lebih hemat dibanding plastik sekali pakai.",
    },
    {
      q: "Mengapa faktor emisi wadah styrofoam per buah lebih kecil daripada kotak makanan plastik PP thinwall?",
      a: "Hal ini terjadi karena perbedaan berat barang: wadah styrofoam sangat ringan (~5 gram karena strukturnya sebagian besar berupa udara), sedangkan kotak thinwall polipropilena memiliki struktur plastik padat (~30 gram, sekitar 6 kali lebih berat).",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Core Formula Box */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-sage/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint text-forest flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal">
                Rumus Dasar Perhitungan Emisi Mingguan
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Emisi Kategori */}
            <div className="space-y-2 text-xs bg-cream/50 p-4 rounded-2xl border border-sage/20">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5 text-sm">
                <Scale className="w-4 h-4 text-forest shrink-0" />
                <span>1. Emisi Setiap Kategori</span>
              </h3>
              <p className="font-mono text-xs font-bold text-forest bg-white/80 p-2.5 rounded-xl border border-sage/20 leading-relaxed break-words">
                Emisi kategori = jumlah barang baru per minggu × faktor emisi per barang
              </p>
            </div>

            {/* 2. Total Emisi Mingguan */}
            <div className="space-y-2 text-xs bg-cream/50 p-4 rounded-2xl border border-sage/20">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5 text-sm">
                <RotateCcw className="w-4 h-4 text-forest shrink-0" />
                <span>2. Total Emisi Mingguan</span>
              </h3>
              <p className="font-mono text-xs font-bold text-charcoal bg-white/80 p-2.5 rounded-xl border border-sage/20 leading-relaxed break-words">
                Total emisi mingguan = jumlah emisi dari empat kategori plastik (kg CO₂e/minggu)
              </p>
            </div>
          </div>

          <div className="p-4 bg-cream/70 rounded-2xl border border-sage/30 text-xs text-muted leading-relaxed">
            <strong className="text-charcoal font-semibold">Catatan metodologi:</strong>{" "}
            Perhitungan didasarkan pada jumlah barang baru yang digunakan setiap minggu. Penggunaan ulang barang yang sama tidak dihitung sebagai barang baru. Faktor emisi setiap jenis plastik ditentukan berdasarkan estimasi massa material dan referensi ilmiah yang digunakan. Nilainya dapat berbeda untuk setiap kategori plastik. Hasil merupakan estimasi dan dapat berbeda dari kondisi aktual.
          </div>
        </div>

        {/* Database of Emission Factors Table */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-sage/30 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-forest" />
                <h2 className="text-lg font-bold text-charcoal">
                  Tabel Empat Faktor Emisi Plastik Sekali Pakai
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Rincian faktor emisi, asumsi massa, status verifikasi, dan sumber referensi ilmiah.
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
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs border-collapse">
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

          <div className="pt-2 border-t border-sage/20">
            <p className="text-[11px] text-muted italic">
              *Catatan metodologi: Hasil perhitungan merupakan estimasi berdasarkan literatur dan perkiraan berat barang, sehingga hasil aktual dapat berbeda.
            </p>
          </div>
        </div>

        {/* Assumptions & Limitations Box */}
        <div className="bg-amber-50/70 rounded-3xl p-5 sm:p-8 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-900">
              Asumsi, Batasan Metodologi, & Peringatan Ilmiah
            </h2>
          </div>

          <div className="text-xs text-amber-950/80 space-y-3 leading-relaxed">
            <p>
              <strong>1. Estimasi Berbasis Massa</strong>
              <br />
              Faktor emisi dihitung berdasarkan perkiraan berat setiap barang dan faktor emisi material dari literatur. Berat produk yang berbeda dapat menghasilkan estimasi berbeda.
            </p>
            <p>
              <strong>2. Emisi Karbon vs. Pencemaran Sampah</strong>
              <br />
              Emisi CO₂e berkaitan dengan dampak perubahan iklim, sedangkan lamanya plastik terurai merupakan persoalan pencemaran lingkungan yang berbeda.
            </p>
            <p>
              <strong>3. Penggunaan Ulang</strong>
              <br />
              Alternatif guna ulang tidak selalu langsung lebih rendah emisi. Dampaknya bergantung pada jumlah pemakaian dan cara perawatannya.
            </p>
            <p>
              <strong>4. Tolok Ukur Internal</strong>
              <br />
              Angka 0,85 kg CO₂e/minggu merupakan tolok ukur ilustratif KarbonAI, bukan statistik resmi nasional untuk empat jenis barang yang dihitung.
            </p>
            <p>
              <strong>5. Keterbatasan Data</strong>
              <br />
              Faktor emisi berasal dari literatur internasional dan asumsi perhitungan, sehingga hasilnya merupakan estimasi yang belum tentu sepenuhnya mewakili kondisi Indonesia.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-sage/30 shadow-sm space-y-6">
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
