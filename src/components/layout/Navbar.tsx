"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Calculator,
  BarChart3,
  Sparkles,
  BookOpen,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda", icon: Leaf },
    { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
    { href: "/hasil", label: "Hasil Analisis", icon: BarChart3 },
    { href: "/green-action", label: "Green Action", icon: Sparkles },
    { href: "/edukasi", label: "Metodologi & Edukasi", icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-cream/90 backdrop-blur-md border-b border-sage/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="Karbon AI Beranda"
          >
            <div className="w-11 h-11 rounded-2xl bg-forest flex items-center justify-center text-cream shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Leaf className="w-6 h-6 text-sage" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-forest">
                  Karbon<span className="text-sage-dark">AI</span>
                </span>
              </div>
              <span className="text-xs text-muted font-medium">
                Kalkulator Jejak Karbon Mahasiswa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-forest text-cream shadow-sm"
                      : "text-charcoal/80 hover:text-forest hover:bg-mint/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-sage-light" : "text-muted"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-cream font-semibold text-sm transition-all duration-200 shadow hover:shadow-md active:scale-95"
            >
              <span>Mulai Hitung</span>
              <ArrowRight className="w-4 h-4 text-sage" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-charcoal hover:bg-mint/60 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-forest" />
              ) : (
                <Menu className="w-6 h-6 text-forest" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sage/20 bg-cream-card/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  active
                    ? "bg-forest text-cream"
                    : "text-charcoal hover:bg-mint/60"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-sage-light" : "text-muted"
                  }`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3">
            <Link
              href="/kalkulator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-forest text-cream font-semibold text-base shadow"
            >
              <span>Mulai Hitung Emisi Sekarang</span>
              <ArrowRight className="w-4 h-4 text-sage" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
