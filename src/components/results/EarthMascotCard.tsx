"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Smile, AlertTriangle, AlertCircle } from "lucide-react";

export type EmissionMascotStatus = "rendah" | "sedang" | "tinggi";

export interface MascotConfig {
  src: string;
  title: string;
  message: string;
  alt: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBg: string;
  borderColor: string;
  titleColor: string;
  fallbackIcon: React.ElementType;
}

export const MASCOT_CONFIGS: Record<EmissionMascotStatus, MascotConfig> = {
  rendah: {
    src: "/images/bumisenang.png",
    title: "Bumi Tersenyum",
    message:
      "Kebiasaanmu sudah cukup baik! Pertahankan langkah kecilmu untuk mengurangi penggunaan plastik sekali pakai.",
    alt: "Maskot Bumi Tersenyum - Emisi Rendah",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-300",
    badgeText: "text-emerald-800",
    cardBg: "bg-emerald-50/50",
    borderColor: "border-emerald-200/80",
    titleColor: "text-emerald-900",
    fallbackIcon: Smile,
  },
  sedang: {
    src: "/images/bumikhawatir.png",
    title: "Bumi Mulai Khawatir",
    message:
      "Masih ada kebiasaan yang bisa diperbaiki. Yuk, mulai kurangi penggunaan plastik sekali pakai.",
    alt: "Maskot Bumi Mulai Khawatir - Emisi Sedang",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-300",
    badgeText: "text-amber-900",
    cardBg: "bg-amber-50/50",
    borderColor: "border-amber-200/80",
    titleColor: "text-amber-950",
    fallbackIcon: AlertTriangle,
  },
  tinggi: {
    src: "/images/bumisedih.png",
    title: "Bumi Butuh Bantuanmu",
    message:
      "Emisi dari penggunaan plastikmu relatif tinggi. Tenang, kamu bisa mulai menguranginya dari satu kebiasaan kecil.",
    alt: "Maskot Bumi Butuh Bantuanmu - Emisi Tinggi",
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-300",
    badgeText: "text-rose-900",
    cardBg: "bg-rose-50/50",
    borderColor: "border-rose-200/80",
    titleColor: "text-rose-950",
    fallbackIcon: AlertCircle,
  },
};

interface EarthMascotCardProps {
  status: EmissionMascotStatus | string | undefined | null;
  className?: string;
}

export function EarthMascotCard({ status, className = "" }: EarthMascotCardProps) {
  const [imageError, setImageError] = useState(false);

  // Fallback aman ke kategori 'sedang' jika status tidak terdefinisi
  const safeStatus: EmissionMascotStatus =
    status === "rendah" || status === "tinggi" ? status : "sedang";

  const config = MASCOT_CONFIGS[safeStatus];
  const FallbackIcon = config.fallbackIcon;

  return (
    <div
      data-testid="earth-mascot-card"
      data-status={safeStatus}
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-4 ${config.cardBg} ${config.borderColor} ${className}`}
    >
      {/* Kontainer Gambar Maskot Proporsional dengan object-contain */}
      <div className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 flex items-center justify-center">
        {!imageError ? (
          <Image
            src={config.src}
            alt={config.alt}
            width={184}
            height={234}
            priority
            onError={() => setImageError(true)}
            className="w-full h-full object-contain drop-shadow-xs select-none transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs ${config.badgeBg} ${config.badgeBorder}`}
          >
            <FallbackIcon className={`w-8 h-8 ${config.badgeText}`} />
          </div>
        )}
      </div>

      {/* Konten Teks Analisis Maskot */}
      <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{config.title}</span>
        </div>

        <p className="text-xs sm:text-sm font-medium text-charcoal/90 leading-relaxed">
          {config.message}
        </p>
      </div>
    </div>
  );
}
