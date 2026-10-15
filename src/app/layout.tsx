import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CalculatorProvider } from "@/context/CalculatorContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Karbon AI — Kalkulator Jejak Karbon Mahasiswa Aceh",
  description:
    "Hitung estimasi jejak karbon harian mahasiswa di Aceh dengan metodologi sains yang transparan, faktor emisi terverifikasi Kementerian ESDM & KLHK, dan rekomendasi aksi nyata.",
  keywords: [
    "karbon ai",
    "jejak karbon aceh",
    "kalkulator karbon mahasiswa",
    "trans koetaradja",
    "emisi sumatera aceh",
    "mahasiswa usk",
    "green action",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-cream text-charcoal">
        <CalculatorProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </CalculatorProvider>
      </body>
    </html>
  );
}


