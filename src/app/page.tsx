import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Bike,
  Utensils,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Sparkles,
  MapPin,
} from "lucide-react";
import { calculateCarbonFootprint } from "@/lib/calculator/engine";
import { DEFAULT_CALCULATOR_INPUT } from "@/lib/validation";

export default function HomePage() {
  const defaultSim = calculateCarbonFootprint(DEFAULT_CALCULATOR_INPUT);

  const categories = [
    {
      title: "Transportasi & Mobilitas",
      icon: Bike,
      desc: "Motor matic/bebek Darussalam, mobil, Labi-labi, hingga bus gratis Trans Koetaradja koridor kampus.",
      highlight: "Faktor DEFRA & KLHK",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "Energi Tempat Tinggal",
      icon: Zap,
      desc: "Listrik kamar kos ber-AC atau kipas angin, laptop, dan kulkas berbasis grid interkoneksi Sumatera.",
      highlight: "0.761 kg CO₂e/kWh (Kemen ESDM)",
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: "Konsumsi Pangan",
      icon: Utensils,
      desc: "Frekuensi kuliner khas (Sie Reuboh, Kuah Beulangong) vs ikan laut segar pesisir, serta cup es kopi warkop.",
      highlight: "LCA Poore & Nemecek 2018",
      color: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      title: "Konsumsi & Belanja",
      icon: ShoppingBag,
      desc: "Pakaian baru (fast fashion), paket e-commerce ekspedisi Jawa ke Aceh (~2.500 km), dan kertas modul fotokopi.",
      highlight: "Berbasis Satuan Fisik Barang",
      color: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "Pengelolaan Sampah",
      icon: Trash2,
      desc: "Timbulan sampah harian mahasiswa, pemilahan Bank Sampah, hingga dampak pembakaran sampah pekarangan.",
      highlight: "IPCC 2006 Open Burning",
      color: "bg-teal-50 text-teal-800 border-teal-200",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-mint/40 via-cream to-cream border-b border-sage/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mint text-forest-dark border border-sage/40 text-xs sm:text-sm font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Inisiatif Iklim Mahasiswa Banda Aceh • Metodologi Berbasis Sains</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal tracking-tight leading-[1.15]">
                Berapa Jejak Karbonmu Selama Kuliah di{" "}
                <span className="text-forest underline decoration-sage/60 decoration-wavy underline-offset-8">
                  Banda Aceh?
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                Kalkulator jejak karbon ilmiah pertama yang disesuaikan secara khusus dengan realitas kehidupan mahasiswa di Banda Aceh. Dari rute harian Trans Koetaradja, konsumsi listrik kos di grid Sumatera, hingga kebiasaan nongkrong di warung kopi.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/kalkulator"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-forest hover:bg-forest-dark text-cream font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                >
                  <span>Mulai Hitung Sekarang</span>
                  <ArrowRight className="w-5 h-5 text-sage" />
                </Link>

                <Link
                  href="/edukasi"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-mint/40 text-forest font-semibold text-base border border-sage/40 shadow-sm transition-all duration-200"
                >
                  <ShieldCheck className="w-5 h-5 text-forest" />
                  <span>Transparansi Metodologi</span>
                </Link>
              </div>
            </div>
        

            {/* Right Card: Interactive Preview (Dynamically Computed from Default Student Archetype) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sage/30">
                <div className="flex items-center justify-between border-b border-sage/20 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Ilustrasi Simulasi Mahasiswa
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-mint text-forest border border-sage/30">
                    Kos Darussalam (Standar)
                  </span>
                </div>

                {/* Score Big Preview */}
                <div className="my-6 text-center bg-cream/70 rounded-2xl p-5 border border-sage/20">
                  <span className="text-[11px] text-muted font-bold uppercase tracking-wider block">
                    Estimasi Emisi Profil Rata-rata
                  </span>
                  <div className="flex items-baseline justify-center gap-1.5 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-forest">
                      {defaultSim.totalMonthlyKgCO2e}
                    </span>
                    <span className="text-sm font-bold text-muted">kg CO₂e / bln</span>
                  </div>
                  <p className="text-xs text-forest-dark mt-1 font-semibold">
                    Proyeksi: ~{Math.round(defaultSim.totalYearlyKgCO2e)} kg CO₂e / tahun ({Math.abs(defaultSim.benchmark.differenceFromNationalPercent)}% di bawah rata-rata nasional)
                  </p>
                </div>

                {/* Mini Categories Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5 font-medium">
                      <Bike className="w-3.5 h-3.5 text-forest" /> Transportasi Motor
                    </span>
                    <span className="font-bold text-charcoal">
                      {defaultSim.categories.transportasi.monthlyKgCO2e} kg ({defaultSim.categories.transportasi.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-cream rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-forest h-2 rounded-full"
                      style={{ width: `${Math.max(5, defaultSim.categories.transportasi.percentage)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-600" /> Listrik Kamar Kos
                    </span>
                    <span className="font-bold text-charcoal">
                      {defaultSim.categories.energi.monthlyKgCO2e} kg ({defaultSim.categories.energi.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-cream rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{ width: `${Math.max(5, defaultSim.categories.energi.percentage)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5 font-medium">
                      <Utensils className="w-3.5 h-3.5 text-rose-600" /> Pangan & Minuman
                    </span>
                    <span className="font-bold text-charcoal">
                      {defaultSim.categories.pangan.monthlyKgCO2e} kg ({defaultSim.categories.pangan.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-cream rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${Math.max(5, defaultSim.categories.pangan.percentage)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-sage/20 flex items-center justify-between">
                  <div className="text-xs text-muted">
                    Penyerapan: Butuh <strong className="text-charcoal font-bold">{defaultSim.equivalencies.treesNeededYearly} pohon</strong>
                  </div>
                  <Link
                    href="/kalkulator"
                    className="text-xs font-bold text-forest hover:text-forest-dark flex items-center gap-1 hover:underline"
                  >
                    <span>Hitung Profilmu Sendiri</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Aceh Context Section */}
      <section className="py-16 md:py-24 bg-white border-b border-sage/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
              <MapPin className="w-3.5 h-3.5" />
              <span>Mengapa Konteks Banda Aceh Berbeda?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
              Kalkulasi Karbon yang Memahami Kehidupan Mahasiswa Banda Aceh
            </h2>
            <p className="text-muted text-sm sm:text-base leading-relaxed">
              Banyak kalkulator karbon di internet menggunakan faktor emisi rata-rata negara barat atau kota metropolitan besar yang tidak mencerminkan realitas mahasiswa di Banda Aceh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-3xl p-7 border border-sage/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-forest text-cream flex items-center justify-center font-bold text-xl">
                  ⚡
                </div>
                <h3 className="text-lg font-bold text-forest-dark">
                  Sistem Listrik Interkoneksi Sumatera
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  Listrik di Aceh bersumber dari interkoneksi Sumatera dengan intensitas emisi resmi <strong>0.761 kg CO₂e / kWh</strong> (Ditjen Ketenagalistrikan ESDM), berbeda dengan grid Jawa-Madura-Bali.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-sage/20 text-xs font-semibold text-muted">
                Faktor Emisi Resmi ESDM 2023
              </div>
            </div>

            <div className="bg-cream rounded-3xl p-7 border border-sage/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-forest text-cream flex items-center justify-center font-bold text-xl">
                  🚌
                </div>
                <h3 className="text-lg font-bold text-forest-dark">
                  Trans Koetaradja & Labi-Labi
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  Banda Aceh memiliki bus BRT gratis Trans Koetaradja yang menghubungkan Pusat Kota dengan kampus USK & UIN di Darussalam. Menggunakannya memangkas emisi bensin harian hingga nol biaya.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-sage/20 text-xs font-semibold text-muted">
                Dihitung Khusus Transit Bus Aceh
              </div>
            </div>

            <div className="bg-cream rounded-3xl p-7 border border-sage/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-forest text-cream flex items-center justify-center font-bold text-xl">
                  ☕
                </div>
                <h3 className="text-lg font-bold text-forest-dark">
                  Kearifan Warkop & Budaya Jep Kuphi
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  Tradisi minum kopi di warung kopi Aceh dengan cangkir keramik yang dicuci adalah praktik <em>zero waste</em> sejati. Karbon AI membedakan jejak cangkir keramik vs cup plastik take-away.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-sage/20 text-xs font-semibold text-muted">
                Perbandingan Siklus Hidup Kemasan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Categories Section */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
              Cakupan Komprehensif
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-charcoal">
              5 Kategori Aktivitas yang Dihitung
            </h2>
            <p className="text-muted text-sm sm:text-base">
              Setiap kategori dihitung secara terpisah dengan rumus data aktivitas dikalikan faktor emisi ilmiah yang dapat diaudit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-7 border border-sage/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center text-forest">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cream text-charcoal border border-sage/30">
                        {cat.highlight}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-charcoal">{cat.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* Final Highlight Card */}
            <div className="bg-gradient-to-br from-forest to-forest-dark text-cream rounded-3xl p-7 flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cream/10 flex items-center justify-center text-sage">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-cream">
                  Rekomendasi Aksi Nyata (Green Action)
                </h3>
                <p className="text-sm text-sage-light leading-relaxed">
                  Setelah menghitung, kamu akan mendapatkan rekomendasi aksi yang spesifik dengan kondisi mahasiswa Aceh dan potensi penurunan emisi konkret.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/kalkulator"
                  className="inline-flex items-center gap-2 text-sm font-bold text-sage hover:text-white"
                >
                  <span>Mulai Hitung Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Transparency Commitment */}
      <section className="py-16 md:py-24 bg-white border-t border-sage/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-mint/40 rounded-3xl p-8 sm:p-12 border border-sage/30 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest text-cream text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-sage" />
              <span>Komitmen Transparansi Sains</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
              Tidak Ada Angka Karangan. Tidak Ada Greenwashing.
            </h2>

            <div className="max-w-3xl mx-auto space-y-4 text-sm sm:text-base text-charcoal/80 leading-relaxed text-left sm:text-center">
              <p>
                Platform Karbon AI memisahkan mesin perhitungan dari antarmuka pengguna. Seluruh kalkulasi berpegang teguh pada prinsip baku akuntansi karbon internasional:
              </p>
              <div className="py-3 px-6 bg-white rounded-2xl border border-sage/30 font-mono text-forest font-bold text-base sm:text-lg inline-block shadow-sm">
                Emisi GRK (kg CO₂e) = Data Aktivitas × Faktor Emisi
              </div>
              <p className="text-sm text-muted">
                Kami tidak mengestimasi emisi belanja dari jumlah uang tanpa data fisik, dan kami menandai secara jujur tingkat ketidakpastian data sesuai panduan IPCC.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/edukasi"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest text-cream font-bold text-sm shadow hover:bg-forest-dark transition-all"
              >
                <span>Buka Dokumentasi & Tabel Faktor Emisi</span>
                <ArrowRight className="w-4 h-4 text-sage" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-forest text-cream">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ambil Peran Nyata untuk Iklim Bumi dari Kampusmu
          </h2>
          <p className="text-sage-light text-base sm:text-lg max-w-2xl mx-auto">
            Hanya butuh 3 menit untuk mengetahui jejak karbon harianmu dan menemukan langkah penghematan emisi paling efektif.
          </p>
          <div className="pt-2">
            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-cream hover:bg-white text-forest font-extrabold text-base shadow-xl hover:scale-105 transition-all duration-200"
            >
              <span>Mulai Kalkulasi Karbon Gratis</span>
              <ArrowRight className="w-5 h-5 text-forest" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
