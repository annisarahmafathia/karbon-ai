import React from "react";
import Link from "next/link";
import { Leaf, ShieldCheck, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sage/20 bg-forest text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center text-forest shadow">
                <Leaf className="w-6 h-6 text-forest" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-cream">
                Karbon<span className="text-sage">AI</span>
              </span>
            </div>
            <p className="text-sage-light/90 text-sm leading-relaxed max-w-sm">
              Inisiatif platform keterbukaan sains untuk membantu masyarakat
              memahami, mengukur, dan mengurangi jejak karbon dari aktivitas kehidupan
              sehari-hari.
            </p>
          </div>

          {/* Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-sage">
              Fitur Utama
            </h4>
            <ul className="space-y-2 text-sm text-cream/80">
              <li>
                <Link href="/" className="hover:text-cream transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/kalkulator"
                  className="hover:text-cream transition-colors"
                >
                  Kalkulator 5 Kategori
                </Link>
              </li>
              <li>
                <Link href="/hasil" className="hover:text-cream transition-colors">
                  Hasil & Visualisasi Emisi
                </Link>
              </li>
              <li>
                <Link href="/riwayat" className="hover:text-cream transition-colors">
                  Riwayat Emisi
                </Link>
              </li>
              <li>
                <Link
                  href="/green-action"
                  className="hover:text-cream transition-colors"
                >
                  Rekomendasi Aksi Nyata
                </Link>
              </li>
              <li>
                <Link
                  href="/edukasi"
                  className="hover:text-cream transition-colors"
                >
                  Metodologi & Sumber Data
                </Link>
              </li>
            </ul>
          </div>

          {/* Metodologi & Transparansi */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-sage">
              Metodologi Sains
            </h4>
            <ul className="space-y-2 text-sm text-cream/80">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sage" />
                <span>Prinsip Aktivitas × Faktor Emisi</span>
              </li>
              <li>Sistem Grid Listrik Sumatera (ESDM)</li>
              <li>Emisi Transportasi Kota & BRT</li>
              <li>Analisis Daur Hidup Pangan (LCA)</li>
              <li>Tanpa Greenwashing & Angka Karangan</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-forest-light flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sage-light/70">
          <p>© {new Date().getFullYear()} Karbon AI. Berbasis Sains & Terbuka</p>
          <p className="flex items-center gap-1">
            Dibangun dengan komitmen transparansi lingkungan untuk Aceh
          </p>
        </div>
      </div>
    </footer>
  );
}
