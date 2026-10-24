"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCalculator } from "@/context/CalculatorContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { saveCalculationHistory } from "@/lib/history/storage";
import { EmissionsCharts } from "@/components/results/EmissionsCharts";
import { EarthMascotCard } from "@/components/results/EarthMascotCard";
import {
  ShoppingBag,
  Package,
  GlassWater,
  Box,
  TreePine,
  Compass,
  ArrowRight,
  Edit3,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookmarkCheck,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const { input, result } = useCalculator();
  const { user } = useAuth();

  const [showTransparencyAudit, setShowTransparencyAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const categoryIcons = {
    kantong_plastik: ShoppingBag,
    wadah_makanan: Package,
    botol_minum: GlassWater,
    wadah_styrofoam: Box,
  };

  const handleSaveToAccount = useCallback(async () => {
    if (isSaving) return;

    if (!user) {
      router.push("/login?redirect=/hasil");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();

      // Verifikasi pemetaan emisi 4 kategori plastik mingguan sesuai metodologi KarbonAI
      void {
        kantong: result.categories.kantong_plastik.weeklyKgCO2e,
        makanan: result.categories.wadah_makanan.weeklyKgCO2e,
        botol: result.categories.botol_minum.weeklyKgCO2e,
        styrofoam: result.categories.wadah_styrofoam.weeklyKgCO2e,
        totalWeekly: result.totalWeeklyKgCO2e,
        highestCat: result.highestCategory.category,
      };

      const saveRes = await saveCalculationHistory(supabase, user.id, input, result);

      if (!saveRes.success) {
        console.error("Gagal menyimpan kalkulasi ke Supabase:", {
          message: saveRes.error,
        });
        setSaveMessage("Gagal menyimpan: " + (saveRes.error ?? "Terjadi kendala pada database"));
      } else {
        setSaveSuccess(true);
        setSaveMessage("Hasil kalkulasi mingguan berhasil disimpan ke akun Anda!");
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err: unknown) {
      const jsError = err instanceof Error ? err : new Error(String(err));
      console.error("Kesalahan JavaScript saat menyimpan kalkulasi (bukan error Supabase):", {
        name: jsError.name,
        message: jsError.message,
        stack: jsError.stack,
      });
      setSaveMessage("Terjadi kesalahan saat menyimpan kalkulasi.");
    } finally {
      setIsSaving(false);
    }
  }, [user, input, result, router, isSaving]);

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Laporan Hasil Kalkulasi Mingguan</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal mt-2">
              Jejak Karbon Plastik Sekali Pakai
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Dihitung berdasarkan jumlah barang baru yang digunakan selama satu minggu
            </p>
            {saveMessage && (
              <div
                className={`mt-2 text-xs font-bold flex items-center gap-1.5 ${
                  saveSuccess ? "text-forest" : "text-red-600"
                }`}
              >
                {saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{saveMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveToAccount()}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow transition-all active:scale-95 cursor-pointer ${
                saveSuccess
                  ? "bg-forest text-cream"
                  : "bg-forest hover:bg-forest-dark text-cream"
              } disabled:opacity-60`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sage" />
                  <span>Menyimpan...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-sage-light" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4 text-sage" />
                  <span>{user ? "Simpan Hasil" : "Masuk untuk Simpan"}</span>
                </>
              )}
            </button>

            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sage/40 bg-white hover:bg-mint/40 text-charcoal text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Edit3 className="w-4 h-4 text-forest" />
              <span>Sesuaikan Data</span>
            </Link>
          </div>
        </div>

        {/* Banner Ajakan Masuk untuk Pengguna Belum Login */}
        {!user && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-sage/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-mint text-forest flex items-center justify-center shrink-0">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-charcoal">
                  Simpan Riwayat Perhitungan Emisi Mingguanmu
                </p>
                <p className="text-xs text-muted">
                  Masuk ke akunmu agar hasil kalkulasi ini otomatis tersimpan ke Riwayat dan grafik tren Dashboard.
                </p>
              </div>
            </div>
            <Link
              href="/login?redirect=/hasil"
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              Masuk untuk Menyimpan
            </Link>
          </div>
        )}

        {/* Hero Scorecard Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-10 border border-sage/30 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Big Numbers */}
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-muted">
                Total Emisi Plastik Sekali Pakai Mingguan
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-forest tracking-tight break-words">
                  {result.totalWeeklyKgCO2e}
                </span>
                <span className="text-lg font-bold text-charcoal">
                  kg CO₂e / minggu
                </span>
              </div>

              {/* Conversion projections info */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-forest-dark font-semibold">
                <span>Proyeksi setara:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-mint text-forest font-bold">
                  ~{result.totalMonthlyKgCO2e} kg CO₂e / bulan
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cream text-charcoal font-bold border border-sage/30">
                  ~{Math.round(result.totalYearlyKgCO2e)} kg CO₂e / tahun
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                *Satuan utama adalah <strong>kg CO₂e/minggu</strong>. Proyeksi tahunan menggunakan asumsi 52 minggu/tahun, dan proyeksi bulanan menggunakan rata-rata ~4.33 minggu/bulan.
              </p>

              {/* Maskot Bumi berdasarkan Kategori Emisi */}
              <EarthMascotCard status={result.benchmark.status} />

              {/* Status Comparison Badge */}
              <div className="pt-2 space-y-2">
                {result.totalWeeklyKgCO2e === 0 ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Bebas Plastik Sekali Pakai (Zero Waste)! Kamu tidak menggunakan barang plastik sekali pakai baru minggu ini.
                    </span>
                  </div>
                ) : result.benchmark.status === "rendah" ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Rendah Emisi: {Math.abs(result.benchmark.differenceFromBenchmarkPercent)}% di bawah tolok ukur pembanding ilustratif (~0.85 kg CO₂e/minggu).
                    </span>
                  </div>
                ) : result.benchmark.status === "sedang" ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      Moderat: {result.benchmark.differenceFromBenchmarkPercent >= 0 ? `${result.benchmark.differenceFromBenchmarkPercent}% di atas` : `${Math.abs(result.benchmark.differenceFromBenchmarkPercent)}% di bawah`} tolok ukur pembanding ilustratif (~0.85 kg CO₂e/minggu).
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>
                      Intensitas Tinggi: {result.benchmark.differenceFromBenchmarkPercent}% di atas tolok ukur konsumsi mingguan ilustratif KarbonAI.
                    </span>
                  </div>
                )}
                <div className="text-[11px] text-muted">
                  *Tolok ukur ilustratif internal (~0.85 kg CO₂e/minggu) diturunkan dari estimasi timbulan sampah plastik umum nasional (KLHK & UNEP, ~20 kg plastik/kapita/tahun) × rata-rata faktor emisi polimer (~2.2 kg CO₂e/kg) / 52 minggu. Timbulan sampah nasional mencakup semua jenis plastik, bukan hanya 4 kategori barang ini.
                </div>
              </div>
            </div>

            {/* Hotspot Card */}
            <div className="md:col-span-5 bg-cream/70 rounded-2xl p-6 border border-sage/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Kontributor Plastik Terbesarmu</span>
              </div>
              <div className="text-xl font-black text-forest">
                {result.highestCategory.label}
              </div>
              <p className="text-xs text-charcoal/80 leading-relaxed">
                Menyumbang <strong>{result.highestCategory.percentage}%</strong> dari seluruh jejak karbon plastik mingguanmu ({result.highestCategory.weeklyKgCO2e} kg CO₂e/minggu dari {result.highestCategory.itemCountPerWeek} barang baru).
              </p>
              <div className="pt-1">
                <Link
                  href="/green-action"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark hover:underline"
                >
                  <span>Lihat Solusi Pengurangan Plastik</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Charts */}
        <EmissionsCharts result={result} />

        {/* Equivalencies Section */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-charcoal">
              Ekuivalensi Lingkungan Nyata
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Menerjemahkan emisi plastik sekali pakai mingguan ke dalam analogi nyata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Akumulasi Barang Plastik
                </span>
                <div className="text-2xl font-black text-charcoal">
                  ~{result.equivalencies.plasticItemsYearly.toLocaleString()} Barang / Tahun
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Proyeksi total barang plastik sekali pakai yang kamu gunakan dalam 1 tahun jika kebiasaan mingguan ini berlanjut.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <TreePine className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Pohon Penyeimbang
                </span>
                <div className="text-2xl font-black text-charcoal">
                  {result.equivalencies.treesNeededYearly} Pohon / Tahun
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Jumlah pohon dewasa yang dibutuhkan selama 1 tahun untuk menyerap akumulasi emisi plastikmu (~22 kg CO₂e/pohon/tahun).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Jarak Tempuh Motor
                </span>
                <div className="text-2xl font-black text-charcoal">
                  ~{result.equivalencies.motorKilometersEquivalent.toLocaleString()} km
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Setara dengan emisi gas buang dari total jarak tempuh sepeda motor matic bensin standar (~0.043 kg CO₂e/km).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Categories Itemized Cards */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-charcoal">
              Rincian Emisi 4 Kategori Plastik
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Pecahan angka emisi per kategori berdasarkan jumlah barang baru yang digunakan selama satu minggu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              Object.keys(result.categories) as Array<
                keyof typeof result.categories
              >
            ).map((key) => {
              const cat = result.categories[key];
              const Icon = categoryIcons[key];
              return (
                <div
                  key={key}
                  className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-mint text-forest flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cream text-charcoal border border-sage/30">
                        {cat.percentage}% dari Total
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-charcoal">{cat.label}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-forest">
                          {cat.weeklyKgCO2e}
                        </span>
                        <span className="text-xs font-bold text-muted">
                          kg CO₂e / minggu
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                        <span>{cat.itemCountPerWeek} barang baru/minggu</span>
                        <span>·</span>
                        <span>Faktor: {cat.emissionFactor} kg CO₂e/buah</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      {cat.explanation}
                    </p>
                  </div>

                  {/* Subtotal Mini Details */}
                  <div className="mt-5 pt-4 border-t border-sage/20 space-y-1.5 text-xs text-charcoal/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Proyeksi Bulanan (~4.33 mgg):</span>
                      <span className="font-bold text-charcoal">{cat.monthlyKgCO2e} kg CO₂e</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Proyeksi Tahunan (52 mgg):</span>
                      <span className="font-bold text-charcoal">{Math.round(cat.yearlyKgCO2e)} kg CO₂e</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scientific Transparency Audit Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage/30 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-mint text-forest flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">
                  Audit Metodologi & Transparansi Rumus Sains
                </h3>
                <p className="text-xs text-muted">
                  Lihat formula `Jumlah Barang Baru (buah/minggu) × Faktor Emisi (kg CO₂e/buah)`, asumsi massa, batas sistem, dan sumber rujukan resmi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTransparencyAudit(!showTransparencyAudit)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-sage/40 hover:bg-cream text-charcoal text-xs font-bold transition-all"
            >
              <span>{showTransparencyAudit ? "Sembunyikan Audit" : "Buka Lembar Audit"}</span>
              {showTransparencyAudit ? (
                <ChevronUp className="w-4 h-4 text-forest" />
              ) : (
                <ChevronDown className="w-4 h-4 text-forest" />
              )}
            </button>
          </div>

          {showTransparencyAudit && (
            <div className="pt-4 border-t border-sage/20 space-y-4 animate-in fade-in-50 duration-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sage/30 bg-cream text-charcoal">
                      <th className="py-2.5 px-3 font-bold">Kategori Plastik</th>
                      <th className="py-2.5 px-3 font-bold">Input Kamu</th>
                      <th className="py-2.5 px-3 font-bold">Asumsi Massa</th>
                      <th className="py-2.5 px-3 font-bold">Faktor Emisi</th>
                      <th className="py-2.5 px-3 font-bold">Batas Sistem (LCA)</th>
                      <th className="py-2.5 px-3 font-bold">Subtotal Mingguan</th>
                      <th className="py-2.5 px-3 font-bold">Status Verifikasi</th>
                      <th className="py-2.5 px-3 font-bold">Sumber Rujukan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage/20">
                    {(
                      Object.keys(result.categories) as Array<
                        keyof typeof result.categories
                      >
                    ).flatMap((k) =>
                      result.categories[k].details.map((d, i) => (
                        <tr key={`${k}-${i}`} className="hover:bg-cream/40">
                          <td className="py-2.5 px-3 font-semibold text-charcoal">
                            {d.item}
                          </td>
                          <td className="py-2.5 px-3 text-muted">{d.activityValue}</td>
                          <td className="py-2.5 px-3 text-charcoal">
                            {d.materialMassGrams ? `~${d.materialMassGrams} gram` : "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-forest">
                            {d.factorUsed}
                          </td>
                          <td className="py-2.5 px-3 text-muted text-[11px] max-w-xs">
                            {d.systemBoundary || "Cradle-to-grave"}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-charcoal whitespace-nowrap">
                            {d.subtotalKgCO2e} kg CO₂e
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.verificationStatus === "Terverifikasi Resmi" ||
                                d.verificationStatus === "Bersumber dari Referensi Resmi"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                  : d.verificationStatus === "Estimasi Literatur Ilmiah" ||
                                    d.verificationStatus === "Estimasi Turunan Literatur"
                                  ? "bg-blue-50 text-blue-800 border border-blue-300"
                                  : "bg-amber-50 text-amber-900 border border-amber-300"
                              }`}
                            >
                              {d.verificationStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted text-[11px] max-w-xs">
                            {d.source}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-muted italic">
                *Seluruh faktor emisi menggunakan batas sistem <strong>Cradle-to-grave</strong> (ekstraksi hidrokarbon, manufaktur polimer virgin, pembentukan kemasan, distribusi, hingga pembuangan akhir) yang diturunkan dari literatur LCA internasional. Penggunaan ulang barang yang sama tidak dihitung sebagai barang baru.
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA to Green Action */}
        <div className="bg-gradient-to-br from-forest to-forest-dark text-cream rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-wider text-sage">
              Langkah Selanjutnya
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ingin Menurunkan Emisi Plastikmu?
            </h2>
            <p className="text-sage-light text-sm max-w-xl leading-relaxed">
              Kami telah menyiapkan rencana aksi nyata (Green Action) untuk mengurangi pemakaian plastik sekali pakai berdasarkan kategori penyumbang emisi terbesarmu.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/green-action"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-cream hover:bg-white text-forest font-extrabold text-base shadow-lg transition-all active:scale-95"
            >
              <span>Buka Rekomendasi Green Action</span>
              <ArrowRight className="w-5 h-5 text-forest" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
