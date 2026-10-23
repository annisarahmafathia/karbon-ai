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
    (f) => f.verificationStatus === "Terverifikasi Resmi"
  ).length;
  const literatureCount = factorList.filter(
    (f) => f.verificationStatus === "Estimasi Literatur Ilmiah"
  ).length;

  const filteredFactors = factorList.filter((f) => {
    const matchesStatus =
      statusFilter === "all" || f.verificationStatus === statusFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.limitations.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.activityUnit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: VerificationTier) => {
    switch (status) {
      case "Terverifikasi Resmi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Terverifikasi Resmi
          </span>
        );
      case "Estimasi Literatur Ilmiah":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <BookMarked className="w-3 h-3 text-blue-600" />
            Literatur Ilmiah
          </span>
        );
      case "Provisional (Perlu Riset Lokal)":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Info className="w-3 h-3 text-amber-700" />
            Provisional (Riset Lokal)
          </span>
        );
    }
  };

  const faqs = [
    {
      q: "Mengapa perhitungan menggunakan jumlah barang baru per minggu, bukan berat plastik atau nominal rupiah?",
      a: "Dalam kehidupan sehari-hari, masyarakat dan mahasiswa tidak menimbang berat sampah plastiknya dengan timbangan gram, dan harga barang tidak mencerminkan emisi fisik plastiknya. KarbonAI menggunakan pendekatan satuan fisik 'buah/minggu' yang kemudian dikonversikan ke dalam kg CO₂e menggunakan faktor emisi per buah yang diturunkan dari data massa referensi (gram/buah) dan koefisien emisi polimer resin (kg CO₂e/kg) dari publikasi ilmiah resmi.",
    },
    {
      q: "Bagaimana aturan penggunaan ulang (reuse) diterapkan dalam perhitungan?",
      a: "Perhitungan berfokus pada jumlah barang baru yang masuk ke siklus konsumsi selama 1 minggu. Contoh: (1) Satu botol atau kotak makan yang dicuci dan digunakan 5 kali dalam seminggu tetap dihitung 1 barang baru. (2) Lima botol berbeda yang dibuka dihitung 5 barang baru. (3) Wadah yang sudah digunakan pada minggu sebelumnya tidak dihitung kembali sebagai barang baru hanya karena masih digunakan. Penggunaan ulang barang yang sama tidak boleh meningkatkan jumlah barang baru.",
    },
    {
      q: "Bagaimana faktor emisi per barang dihitung dari referensi berbasis berat?",
      a: "Jika publikasi ilmiah menyediakan faktor emisi dalam satuan kg CO₂e per kg plastik, nilai tersebut dikalikan dengan massa rata-rata per barang yang memiliki dasar referensi ilmiah: (1) Kantong kresek HDPE: massa acuan ~10 gram (UK Environment Agency 2011 & DEFRA); (2) Kotak makanan thinwall PP: massa acuan ~30 gram (Gallego-Schmid et al. 2019 / Prevent Waste Alliance); (3) Botol air mineral PET: massa acuan ~20 gram (PlasticsEurope 2020 & DEFRA); (4) Kotak styrofoam EPS: massa acuan ~5 gram (Zero Waste Scotland 2020).",
    },
    {
      q: "Apa batas sistem (system boundary) yang digunakan pada perhitungan ini?",
      a: "Seluruh faktor emisi menggunakan batas sistem Cradle-to-Grave (dari ekstraksi bahan baku hidrokarbon fosil, polimerisasi resin plastik, pembentukan kemasan/botol, transportasi distribusi ritel, hingga pengangkutan dan pembuangan akhir di TPA/insinerasi). Emisi produksi plastik dipisahkan dan dihitung bersama emisi pembuangannya secara terpadu dalam model daur hidup.",
    },
    {
      q: "Bagaimana asumsi konversi mingguan ke bulanan dan tahunan?",
      a: "Satuan utama adalah kg CO₂e/minggu. Untuk proyeksi tahunan, nilai mingguan dikalikan 52 minggu (1 tahun = 52 minggu). Untuk proyeksi bulanan, nilai tahunan dibagi 12 bulan (atau nilai mingguan dikalikan ~4.333 minggu/bulan).",
    },
    {
      q: "Dari mana angka tolok ukur nasional 0.85 kg CO₂e/minggu diperoleh?",
      a: "Berdasarkan data Kementerian Lingkungan Hidup dan Kehutanan (KLHK) dan Program Lingkungan PBB (UNEP), rata-rata timbulan sampah plastik per kapita di Indonesia adalah sekitar 18–22 kg plastik/orang/tahun (~0.35–0.42 kg plastik/minggu). Menggunakan rata-rata faktor emisi plastik sekali pakai (~2.0–2.5 kg CO₂e/kg), diperoleh baseline rata-rata sekitar 0.85 kg CO₂e/minggu per orang.",
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
              <div className="text-xs font-bold text-charcoal">Terverifikasi Resmi</div>
              <p className="text-[11px] text-muted mt-1">
                Diterbitkan instansi pemerintah resmi dan asosiasi polimer internasional (DEFRA UK & PlasticsEurope).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-800">{literatureCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Literatur Ilmiah Peer-Reviewed</div>
              <p className="text-[11px] text-muted mt-1">
                LCA kemasan makanan sekali pakai dari University of Manchester (Gallego-Schmid et al.), Zero Waste Scotland, dan Prevent Waste Alliance.
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
                Standar Activity-Based Estimation: Jumlah Barang Baru × Faktor Emisi per Barang
              </span>
            </div>
          </div>

          <div className="p-6 bg-cream/70 rounded-2xl border border-sage/30 text-center space-y-3">
            <div className="text-xs uppercase font-extrabold text-muted tracking-wider">
              Formula Matematika Utama
            </div>
            <div className="text-lg sm:text-2xl font-mono font-black text-forest">
              Emisi Kategori (kg CO₂e/minggu) = Jumlah Barang Baru (buah/minggu) × Faktor Emisi (kg CO₂e/buah)
            </div>
            <div className="text-base sm:text-xl font-mono font-bold text-charcoal">
              Total Emisi Mingguan = Σ (Emisi dari 4 Kategori Plastik)
            </div>
            <p className="text-xs text-muted max-w-xl mx-auto pt-1 leading-relaxed">
              Satuan utama yang ditampilkan adalah <strong>kg CO₂e/minggu</strong>. Proyeksi tahunan menggunakan asumsi 52 minggu per tahun, dan proyeksi bulanan menggunakan rata-rata ~4.333 minggu per bulan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-forest" />
                <span>1. Basis Massa per Barang</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Faktor emisi per barang tidak ditebak sembarangan, melainkan diturunkan secara saintifik dari massa rata-rata per barang (gram) dikalikan faktor emisi polimer resin (kg CO₂e/kg) dari studi LCA resmi.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-forest" />
                <span>2. Aturan Penggunaan Ulang</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Perhitungan menggunakan jumlah barang baru, bukan berapa kali barang digunakan. Penggunaan ulang barang yang sama (misal mencuci kotak thinwall atau mengisi ulang botol) tidak menambah hitungan barang baru.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-forest" />
                <span>3. Batas Sistem Daur Hidup</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Perhitungan mencakup emisi produksi resin plastik hulu hingga emisi pengelolaan sampah akhir di hilir (Cradle-to-Grave), mencegah klaim berlebih di luar data pendukung yang tersedia.
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
                <option value="Terverifikasi Resmi">Terverifikasi Resmi</option>
                <option value="Estimasi Literatur Ilmiah">Literatur Ilmiah</option>
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
              <strong>1. Massa Referensi yang Diuji:</strong> Nilai faktor emisi per barang diturunkan dari berat referensi tipikal produk di pasaran (10g untuk kantong kresek HDPE, 30g untuk kotak thinwall PP, 20g untuk botol PET 500-600ml, dan 5g untuk kotak foam EPS). Kemasan dengan ketebalan ekstrem di luar rentang standar akan memiliki emisi sedikit berbeda.
            </p>
            <p>
              <strong>2. Pemisahan Emisi Produksi dan Pengelolaan Sampah:</strong> Faktor emisi dalam metodologi ini mencakup kedua fase secara terintegrasi (manufaktur polimer dan pengangkutan/pembuangan sampah), namun tidak mengklaim dampak ekologis di luar gas rumah kaca (seperti bahaya mikroplastik bagi biota laut yang belum memiliki konversi GWP resmi).
            </p>
            <p>
              <strong>3. Integritas Data - Tidak Mengarang Angka:</strong> Seluruh nilai emisi berakar pada publikasi LCA resmi (UK Environment Agency, DEFRA, PlasticsEurope, University of Manchester, dan Zero Waste Scotland). Tidak ada angka yang dibuat-buat atau ditebak tanpa referensi.
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
