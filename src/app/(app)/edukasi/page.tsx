"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EMISSION_FACTORS } from "@/lib/constants/emission-factors";
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
} from "lucide-react";

export default function EdukasiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const factorList = Object.values(EMISSION_FACTORS);

  const verifiedCount = factorList.filter(
    (f) => f.verificationStatus === "Terverifikasi Resmi"
  ).length;
  const literatureCount = factorList.filter(
    (f) => f.verificationStatus === "Estimasi Literatur Ilmiah"
  ).length;
  const provisionalCount = factorList.filter(
    (f) => f.verificationStatus === "Provisional (Perlu Riset Lokal)"
  ).length;

  const filteredFactors = factorList.filter((f) => {
    const matchesCategory =
      categoryFilter === "all" || f.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || f.verificationStatus === statusFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.limitations.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.activityUnit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: VerificationTier) => {
    switch (status) {
      case "Terverifikasi Resmi":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Terverifikasi Resmi
          </span>
        );
      case "Estimasi Literatur Ilmiah":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <BookMarked className="w-3 h-3 text-blue-600" />
            Literatur Ilmiah
          </span>
        );
      case "Provisional (Perlu Riset Lokal)":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Info className="w-3 h-3 text-amber-700" />
            Provisional (Riset Lokal)
          </span>
        );
    }
  };

  const faqs = [
    {
      q: "Apa perbedaan antara estimasi emisi dan pengukuran emisi aktual?",
      a: "Pengukuran emisi aktual memerlukan sensor laboratorium atau alat pengukur cerdas langsung pada knalpot kendaraan dan meteran listrik secara berkelanjutan. Karbon AI menggunakan metode estimasi inventarisasi aktivitas (Activity-Based Estimation) standar IPCC, yaitu mengalikan kuantitas aktivitasmu (km perjalanan, kWh listrik, porsi makan) dengan faktor emisi rata-rata yang telah diuji di laboratorium dan literatur ilmiah resmi.",
    },
    {
      q: "Bagaimana angka rata-rata nasional (2.140 kg) dan target iklim Paris (2.000 kg) diperoleh?",
      a: "Angka tolok ukur nasional 2.140 kg CO₂e/kapita/tahun diturunkan dari data gabungan inventarisasi GRK Our World in Data (2022) dan Laporan Biennial Update Report ke-3 (BUR 3) KLHK Republik Indonesia untuk sektor non-LULUCF (energi, transportasi, industri/IPPU, limbah, dan peternakan). Target 2.000 kg CO₂e/kapita/tahun adalah ambang batas emisi per kapita global tahun 2030 yang disimulasikan oleh IPCC Working Group III (AR6) untuk menjaga skenario kenaikan suhu bumi di bawah 1,5°C - 2°C.",
    },
    {
      q: "Mengapa Karbon AI tidak menghitung emisi dari nominal rupiah uang belanja?",
      a: "Pendekatan berbasis uang (Spend-based model) memiliki tingkat ketidakpastian sangat tinggi di Indonesia. Harga baju fast fashion Rp 50.000 dan baju bermerek Rp 500.000 berbahan katun yang sama memiliki emisi fisik pembuatan yang relatif setara, namun jika dihitung dari uang, baju bermerek akan diklaim beremisi 10x lebih kotor secara keliru. Karbon AI memilih menghitung unit fisik riil (helai pakaian, jumlah paket kargo, lembar kertas fotokopi) demi integritas metodologi sains.",
    },
    {
      q: "Mengapa faktor emisi listrik menggunakan Sistem Sumatera (0.761 kg CO₂e/kWh)?",
      a: "Provinsi Aceh terhubung ke dalam Sistem Kelistrikan Interkoneksi Sumatera (Sumatera Grid). Berdasarkan data resmi Direktorat Jenderal Ketenagalistrikan Kementerian ESDM, pembangkitan listrik di Sumatera mengombinasikan PLTU batubara, PLTGU gas, serta sebagian energi terbarukan (seperti PLTA Peusangan dan geotermal), menghasilkan rata-rata 0.761 kg CO₂e untuk setiap 1 kWh listrik yang dialirkan.",
    },
    {
      q: "Bagaimana pencegahan penghitungan ganda (double-counting) antara sampah dan belanja?",
      a: "Dalam metodologi Karbon AI, kantong plastik kresek belanja (0.033 kg CO₂e/lembar) hanya memperhitungkan emisi manufaktur polimer virgin hulu (embodied manufacturing carbon). Sedangkan faktor emisi sampah harian (0.41 kg CO₂e/kg) dihitung secara terpisah untuk degradasi anaerobik di TPA (landfill methane emission). Ini mencegah satu kantong plastik dihitung berulang pada proses kimia yang sama.",
    },
    {
      q: "Mengapa membakar sampah di pekarangan kos dihitung sangat tinggi emisinya?",
      a: "Pembakaran sampah terbuka (Open Burning) tidak memiliki sistem filtrasi cerobong dan berlangsung pada suhu rendah yang tidak sempurna. Menurut IPCC Guidelines Vol 5, pembakaran terbuka menghasilkan emisi langsung gas rumah kaca metana (CH₄), dinitrogen oksida (N₂O), CO₂ fosil dari plastik, serta aerosol jelaga karbon hitam (black carbon) yang beracun bagi paru-paru dan memicu pemanasan atmosfer global.",
    },
    {
      q: "Bagaimana cara mahasiswa memanfaatkan angka hasil kalkulasi ini?",
      a: "Hasil kalkulasi berfungsi sebagai baseline (tolok ukur awal) untuk melihat di mana letak pemborosan energimu. Setelah mengetahui hotspot terbesarmu, buka halaman Green Action untuk memilih aksi yang paling terukur dampaknya, seperti beralih ke bus gratis Trans Koetaradja, memasang timer AC kos, atau mengganti porsi daging sapi.",
    },
  ];

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumentasi Sains & Transparansi Metodologi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
            Metodologi Perhitungan & Basis Data Emisi
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Transparansi penuh mengenai rumus perhitungan, asal-usul faktor emisi, pemisahan tingkat verifikasi data, dan batasan ilmiah Karbon AI.
          </p>
        </div>

        {/* Verification Tiers Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-800">{verifiedCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Terverifikasi Resmi</div>
              <p className="text-[11px] text-muted mt-1">
                Diterbitkan instansi pemerintah resmi (Kementerian ESDM & Ditjen Ketenagalistrikan).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-800">{literatureCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Literatur Ilmiah Internasional</div>
              <p className="text-[11px] text-muted mt-1">
                LCA Peer-reviewed IPCC AR6, UK DEFRA GHG Conversion, dan Poore & Nemecek (Science 2018).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-900">{provisionalCount} Faktor</div>
              <div className="text-xs font-bold text-charcoal">Provisional (Perlu Riset Lokal)</div>
              <p className="text-[11px] text-muted mt-1">
                Estimasi berbasis survei perkotaan Aceh yang ditandai untuk pengumpulan data primer lanjutan.
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
                Prinsip Perhitungan Baku: Data Aktivitas (A) × Faktor Emisi (EF)
              </h2>
              <span className="text-xs text-muted">
                Mengikuti panduan IPCC Guidelines for National Greenhouse Gas Inventories & ISO 14064
              </span>
            </div>
          </div>

          <div className="p-6 bg-cream/70 rounded-2xl border border-sage/30 text-center space-y-2">
            <div className="text-xs uppercase font-extrabold text-muted tracking-wider">
              Rumus Matematika Dasar
            </div>
            <div className="text-xl sm:text-3xl font-mono font-black text-forest">
              Emisi (kg CO₂e) = Data Aktivitas (A) × Faktor Emisi (EF)
            </div>
            <p className="text-xs text-muted max-w-xl mx-auto pt-1">
              Di mana <strong>Data Aktivitas (A)</strong> adalah kuantitas fisik konsumsi (seperti km pulang-pergi, kWh listrik per penghuni, atau porsi makan), dan <strong>Faktor Emisi (EF)</strong> adalah koefisien gas rumah kaca terverifikasi per unit aktivitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-forest" />
                <span>1. Normalisasi Perjalanan & Hunian</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Jarak kampus dikalikan 2 (pulang-pergi) dan dikalikan frekuensi per minggu (× 4.33 minggu/bulan). Pada kos berbagi dan asrama, peralatan bersama (AC, kulkas mini, lampu) dialokasikan terbagi 2 penghuni.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-forest" />
                <span>2. Satuan Setara CO₂ (CO₂e)</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Angka emisi dinyatakan dalam CO₂e (Carbon Dioxide Equivalent) yang mencakup efek gas rumah kaca lain seperti Metana (CH₄) dan Dinitrogen Oksida (N₂O) menggunakan nilai Global Warming Potential (GWP) 100 tahun IPCC.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-forest-dark flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-forest" />
                <span>3. Pendekatan Unit Fisik (Physical Units)</span>
              </h3>
              <p className="text-muted leading-relaxed">
                Kami menghindari estimasi berbasis nominal rupiah karena harga pasar barang di Banda Aceh tidak berkorelasi linier dengan emisi manufaktur dan logistik fisiknya.
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
                  Tabel Faktor Emisi Terbuka (Open Data Factors)
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                Seluruh 19 faktor emisi dalam basis data Karbon AI lengkap dengan satuan aktivitas, sumber resmi, tahun rilis, dan batasan ruang lingkup.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Cari faktor, sumber, batasan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-sage/40 focus:outline-none focus:ring-1 focus:ring-forest bg-cream/40"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-sage/40 bg-cream/40 font-semibold text-charcoal"
              >
                <option value="all">Semua Kategori</option>
                <option value="transportasi">Transportasi</option>
                <option value="energi">Energi</option>
                <option value="pangan">Pangan</option>
                <option value="konsumsi">Belanja</option>
                <option value="sampah">Sampah</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-sage/40 bg-cream/40 font-semibold text-charcoal"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="Terverifikasi Resmi">Terverifikasi Resmi</option>
                <option value="Estimasi Literatur Ilmiah">Literatur Ilmiah</option>
                <option value="Provisional (Perlu Riset Lokal)">Provisional (Riset Lokal)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sage/30 bg-cream text-charcoal">
                  <th className="py-3 px-3 font-bold">Nama Aktivitas / Parameter</th>
                  <th className="py-3 px-3 font-bold">Nilai Koefisien</th>
                  <th className="py-3 px-3 font-bold">Satuan Input Aktivitas</th>
                  <th className="py-3 px-3 font-bold">Status Verifikasi</th>
                  <th className="py-3 px-3 font-bold">Sumber Resmi</th>
                  <th className="py-3 px-3 font-bold">Tahun</th>
                  <th className="py-3 px-3 font-bold">Catatan & Batasan Ruang Lingkup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/20">
                {filteredFactors.map((f) => (
                  <tr key={f.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-charcoal">{f.name}</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                        Kategori: {f.category} • Cakupan: {f.scope}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top font-mono font-bold text-forest whitespace-nowrap">
                      {f.value} <span className="text-[11px] font-normal text-muted">{f.unit}</span>
                    </td>
                    <td className="py-3 px-3 align-top font-mono text-charcoal/80 whitespace-nowrap">
                      {f.activityUnit}
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {getStatusBadge(f.verificationStatus)}
                    </td>
                    <td className="py-3 px-3 align-top text-muted font-medium">
                      {f.source}
                    </td>
                    <td className="py-3 px-3 align-top text-muted whitespace-nowrap">
                      {f.year}
                    </td>
                    <td className="py-3 px-3 align-top text-muted max-w-xs">
                      <div className="text-[11px] text-charcoal/90">{f.notes}</div>
                      <div className="text-[10px] text-amber-900/80 mt-1 italic">
                        <strong>Batasan:</strong> {f.limitations}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFactors.length === 0 && (
            <div className="text-center py-8 text-xs text-muted">
              Tidak ada faktor emisi yang sesuai dengan kriteria pencarian dan filter status.
            </div>
          )}
        </div>

        {/* Assumptions & Limitations Box */}
        <div className="bg-amber-50/70 rounded-3xl p-6 sm:p-8 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-900">
              Asumsi, Batasan Ilmiah, & Catatan Metodologi
            </h2>
          </div>

          <div className="text-xs text-amber-950/80 space-y-2.5 leading-relaxed">
            <p>
              <strong>1. Cakupan Grid Regional Sumatera:</strong> Faktor emisi listrik menggunakan nilai resmi Ditjen Ketenagalistrikan Kementerian ESDM (0.761 kg CO₂e/kWh) untuk Sistem Interkoneksi Sumatera. Faktor emisi lokal khusus jaringan distribusi Aceh belum dipublikasikan tersendiri oleh PLN.
            </p>
            <p>
              <strong>2. Amortisasi Manufaktur Gadget:</strong> Jejak karbon smartphone baru (~60 kg CO₂e) dan laptop baru (~200 kg CO₂e) dihitung dengan amortisasi tahun pertama (12 bulan) untuk mencerminkan beban emisi manufaktur embodied carbon di tahun pembelian.
            </p>
            <p>
              <strong>3. Pencegahan Penghitungan Ganda Kantong Plastik:</strong> Kantong plastik kresek belanja (0.033 kg CO₂e/lembar) hanya mencakup emisi manufaktur hulu. Beban dekomposisi di TPA dihitung dalam timbulan sampah harian terpisah.
            </p>
            <p>
              <strong>4. Tolok Ukur Ilmiah Transparan:</strong> Perbandingan nasional menggunakan rata-rata Indonesia 2.140 kg CO₂e/kapita/tahun (Our World in Data & KLHK BUR 3 sektor non-LULUCF). Target iklim menggunakan 2.000 kg CO₂e/kapita/tahun (IPCC AR6 WG3 untuk jalur emisi global 2030).
            </p>
            <p>
              <strong>5. Bukan Pengukuran Regulasi Formal:</strong> Hasil kalkulasi ini merupakan estimasi ilmiah edukatif pribadi bagi mahasiswa Aceh untuk memandu aksi iklim nyata, bukan merupakan audit karbon resmi kepatuhan industri ISO/GHG Protocol berbayar.
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
            <span>Mulai Hitung Jejak Karbonmu Sekarang</span>
            <ArrowRight className="w-4 h-4 text-sage" />
          </Link>
        </div>
      </div>
    </div>
  );
}

