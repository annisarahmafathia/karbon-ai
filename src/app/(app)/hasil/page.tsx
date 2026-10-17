"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCalculator } from "@/context/CalculatorContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { EmissionsCharts } from "@/components/results/EmissionsCharts";
import {
  Bike,
  Zap,
  Utensils,
  ShoppingBag,
  Trash2,
  TreePine,
  Compass,
  ArrowRight,
  Edit3,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Share2,
  BookmarkCheck,
  Loader2,
} from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const { input, result } = useCalculator();
  const { user } = useAuth();

  const [showTransparencyAudit, setShowTransparencyAudit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const categoryIcons = {
    transportasi: Bike,
    energi: Zap,
    pangan: Utensils,
    konsumsi: ShoppingBag,
    sampah: Trash2,
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Jejak karbon saya sebagai mahasiswa di Aceh adalah ${result.totalMonthlyKgCO2e} kg CO₂e/bulan (~${Math.round(result.totalYearlyKgCO2e)} kg/tahun). Cek emisi harianmu di Karbon AI!`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveToAccount = async () => {
    if (!user) {
      router.push("/login?redirect=/hasil");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      const now = new Date();
      const { error } = await supabase.from("carbon_calculations").insert({
        user_id: user.id,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        total_monthly_kg: result.totalMonthlyKgCO2e,
        total_yearly_kg: result.totalYearlyKgCO2e,
        transport_monthly_kg: result.categories.transportasi.monthlyKgCO2e,
        energy_monthly_kg: result.categories.energi.monthlyKgCO2e,
        food_monthly_kg: result.categories.pangan.monthlyKgCO2e,
        consumption_monthly_kg: result.categories.konsumsi.monthlyKgCO2e,
        waste_monthly_kg: result.categories.sampah.monthlyKgCO2e,
        highest_category: result.highestCategory.category,
        confidence_score: result.dataQuality.confidenceScore,
        input_snapshot: input,
        result_snapshot: result,
      });

      if (error) {
        console.error("Gagal menyimpan kalkulasi ke Supabase:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setSaveMessage("Gagal menyimpan: " + error.message);
      } else {
        setSaveSuccess(true);
        setSaveMessage("Kalkulasi berhasil disimpan ke akun Anda!");
        setTimeout(() => setSaveSuccess(false), 4000);
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
  };

  return (
    <div className="w-full bg-cream py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest px-3 py-1 rounded-full bg-mint">
              <span>Laporan Hasil Kalkulasi Emisi</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal mt-2">
              Jejak Karbon
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Dihitung berdasarkan profil aktivitas harianmu
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
              onClick={handleSaveToAccount}
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
                  <span>{user ? "Simpan ke Akun" : "Masuk untuk Simpan"}</span>
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

        {/* Hero Scorecard Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-sage/30 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Big Numbers */}
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-muted">
                Total Estimasi Jejak Karbon Pribadi
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-5xl sm:text-6xl font-black text-forest tracking-tight">
                  {result.totalMonthlyKgCO2e}
                </span>
                <span className="text-lg font-bold text-charcoal">
                  kg CO₂e / bulan
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-forest-dark font-semibold">
                <span>Setara proyeksi:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-mint text-forest font-bold">
                  {Math.round(result.totalYearlyKgCO2e)} kg CO₂e / tahun
                </span>
                <span className="text-xs text-muted">
                  ({(result.totalYearlyKgCO2e / 1000).toFixed(2)} Ton)
                </span>
              </div>

              {/* Status Comparison Badge */}
              <div className="pt-2 space-y-2">
                {result.benchmark.status === "rendah" ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Rendah Emisi: {Math.abs(result.benchmark.differenceFromNationalPercent)}% di bawah rata-rata nasional (~2.140 kg) dan memenuhi batas target Paris 2030 (~2.000 kg CO₂e/thn).
                    </span>
                  </div>
                ) : result.benchmark.status === "sedang" ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      Moderat: {result.benchmark.differenceFromNationalPercent >= 0 ? `${result.benchmark.differenceFromNationalPercent}% di atas` : `${Math.abs(result.benchmark.differenceFromNationalPercent)}% di bawah`} rata-rata nasional (~2.140 kg CO₂e/thn).
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>
                      Intensitas Tinggi: {result.benchmark.differenceFromNationalPercent}% di atas rata-rata nasional ({result.benchmark.differenceFromParisTargetPercent}% di atas batas target keberlanjutan Paris 2030).
                    </span>
                  </div>
                )}
                <div className="text-[11px] text-muted">
                  *Rujukan tolok ukur: Our World in Data / KLHK BUR 3 (Nasional ~2.140 kg/thn) & IPCC AR6 WG3 (Target 1.5°C ~2.000 kg/thn).
                </div>
              </div>
            </div>

            {/* Hotspot Card */}
            <div className="md:col-span-5 bg-cream/70 rounded-2xl p-6 border border-sage/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Kontributor Emisi Terbesarmu</span>
              </div>
              <div className="text-xl font-black text-forest">
                {result.highestCategory.label}
              </div>
              <p className="text-xs text-charcoal/80 leading-relaxed">
                Menyumbang <strong>{result.highestCategory.percentage}%</strong> dari seluruh jejak karbonmu ({result.highestCategory.monthlyKgCO2e} kg CO₂e/bln). Mengubah kebiasaan pada sektor ini memberi dampak penurunan emisi paling cepat!
              </p>
              <div className="pt-1">
                <Link
                  href="/green-action"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark hover:underline"
                >
                  <span>Lihat Solusi Khusus Sektor Ini</span>
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
              Menerjemahkan angka kg CO₂e ke dalam analogi nyata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <TreePine className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Pohon Penyeimbang
                </span>
                <div className="text-2xl font-black text-charcoal">
                  {result.equivalencies.treesNeededYearly} Pohon
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Jumlah pohon trembesi atau mangrove dewasa yang dibutuhkan selama 1 tahun untuk menyerap seluruh emisimu.
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
                  {result.equivalencies.motorKilometersEquivalent.toLocaleString()} km
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Setara dengan total jarak perjalanan yang ditempuh menggunakan sepeda motor matic bensin standar.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Rute Banda Aceh — Medan
                </span>
                <div className="text-2xl font-black text-charcoal">
                  {Math.floor(result.equivalencies.roundTripBandaAcehMedan)} kali PP
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Setara dengan emisi dari sekitar{" "}
                  {Math.floor(result.equivalencies.roundTripBandaAcehMedan)} kali perjalanan
                  pulang-pergi Banda Aceh–Medan, dengan jarak acuan sekitar 1.200 km per PP.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Categories Itemized Cards */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-charcoal">
              Rincian Perhitungan per Kategori
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Pecahan angka emisi berdasarkan masing-masing sektor kehidupan kampusmu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          {cat.monthlyKgCO2e}
                        </span>
                        <span className="text-xs font-bold text-muted">
                          kg CO₂e / bln
                        </span>
                      </div>
                      <span className="text-[11px] text-muted block mt-0.5">
                        Proyeksi ~{Math.round(cat.yearlyKgCO2e)} kg / tahun
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      {cat.explanation}
                    </p>
                  </div>

                  {/* Subtotal Mini Details */}
                  <div className="mt-5 pt-4 border-t border-sage/20 space-y-1.5">
                    {cat.details.slice(0, 3).map((det, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-charcoal/80 truncate max-w-[170px]" title={det.item}>
                          {det.item}
                        </span>
                        <span className="font-bold text-forest shrink-0">
                          {det.subtotalKgCO2e} kg
                        </span>
                      </div>
                    ))}
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
                  Audit Metodologi & Transparansi Rumus
                </h3>
                <p className="text-xs text-muted">
                  Lihat formula `Data Aktivitas × Faktor Emisi` dan sumber rujukan resmi untuk setiap variabelmu
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
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sage/30 bg-cream text-charcoal">
                      <th className="py-2.5 px-3 font-bold">Item Aktivitas</th>
                      <th className="py-2.5 px-3 font-bold">Input Aktivitas Kamu</th>
                      <th className="py-2.5 px-3 font-bold">Faktor Emisi Digunakan</th>
                      <th className="py-2.5 px-3 font-bold">Subtotal Emisi</th>
                      <th className="py-2.5 px-3 font-bold">Status Verifikasi</th>
                      <th className="py-2.5 px-3 font-bold">Sumber Resmi</th>
                      <th className="py-2.5 px-3 font-bold">Ketidakpastian</th>
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
                          <td className="py-2 px-3 font-semibold text-charcoal">
                            {d.item}
                          </td>
                          <td className="py-2 px-3 text-muted">{d.activityValue}</td>
                          <td className="py-2 px-3 font-mono text-forest">
                            {d.factorUsed}
                          </td>
                          <td className="py-2 px-3 font-bold text-charcoal">
                            {d.subtotalKgCO2e} kg CO₂e
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.verificationStatus === "Terverifikasi Resmi"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                  : d.verificationStatus === "Estimasi Literatur Ilmiah"
                                  ? "bg-blue-50 text-blue-800 border border-blue-300"
                                  : "bg-amber-50 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {d.verificationStatus}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted">{d.source}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-mint text-forest-dark font-medium text-[10px]">
                              {d.uncertainty}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-muted italic">
                Seluruh perhitungan diaudit sesuai Pedoman Inventarisasi Gas Rumah Kaca Nasional (KLHK & Kementerian ESDM RI) dan IPCC Guidelines 2006.
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA to Green Action */}
        <div className="bg-gradient-to-br from-forest to-forest-dark text-cream rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-wider text-sage">
              Langkah Selanjutnya
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ingin Menurunkan Jejak Karbonmu?
            </h2>
            <p className="text-sage-light text-sm max-w-xl leading-relaxed">
              Kami telah menyiapkan rencana aksi nyata (Green Action) yang dipersonalisasi berdasarkan sektor penyumbang emisi terbesarmu.
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
