
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf,
  Calculator,
  BarChart3,
  Sparkles,
  BookOpen,
  Clock,
  Menu,
  X,
  ArrowRight,
  User as UserIcon,
  LogOut,
  LogIn,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
    { href: "/hasil", label: "Hasil Analisis", icon: BarChart3 },
    { href: "/riwayat", label: "Riwayat", icon: Clock },
    { href: "/green-action", label: "Green Action", icon: Sparkles },
    { href: "/edukasi", label: "Edukasi", icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      setMobileMenuOpen(false);
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal keluar dari akun:", error);
      setIsLoggingOut(false);
    }
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Akun";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sage/20 bg-cream/90 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 focus:outline-none"
            aria-label="Karbon AI Beranda"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Leaf className="h-6 w-6 text-sage" />
            </div>

            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-forest">
                Karbon<span className="text-sage-dark">AI</span>
              </span>
              <span className="hidden text-xs font-medium text-muted sm:block">
                Kalkulator Jejak Karbon Mahasiswa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all duration-200 xl:gap-2 xl:px-3 ${
                    active
                      ? "bg-forest text-cream shadow-sm"
                      : "text-charcoal/80 hover:bg-mint/60 hover:text-forest"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-sage-light" : "text-muted"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Account Actions */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {!isLoading &&
              (user ? (
                <>
                  <Link
                    href="/profil"
                    aria-label="Buka profil akun"
                    className={`inline-flex max-w-40 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                      isActive("/profil")
                        ? "border-forest bg-forest text-cream"
                        : "border-sage/40 bg-white text-charcoal shadow-sm hover:bg-mint/60"
                    }`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">
                      {initial}
                    </div>
                    <span className="truncate">{displayName}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Keluar akun"
                    aria-label="Keluar akun"
                  >
                    {isLoggingOut ? (
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-charcoal transition-all hover:bg-mint/60 hover:text-forest"
                  >
                    <LogIn className="h-4 w-4 text-forest" />
                    Masuk
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-cream shadow transition-all hover:bg-forest-dark hover:shadow-md active:scale-95"
                  >
                    Daftar
                    <ArrowRight className="h-3.5 w-3.5 text-sage" />
                  </Link>
                </div>
              ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-xl p-2.5 text-charcoal transition-colors hover:bg-mint/60 focus:outline-none lg:hidden"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-forest" />
            ) : (
              <Menu className="h-6 w-6 text-forest" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="space-y-2 border-b border-sage/20 bg-cream/95 px-4 pb-6 pt-3 shadow-lg backdrop-blur-lg lg:hidden">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                  active
                    ? "bg-forest text-cream"
                    : "text-charcoal hover:bg-mint/60"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active ? "text-sage-light" : "text-muted"
                  }`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Mobile Account Actions */}
          <div className="space-y-2 border-t border-sage/20 pt-3">
            {!isLoading &&
              (user ? (
                <>
                  <Link
                    href="/profil"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors ${
                      isActive("/profil")
                        ? "bg-forest text-cream"
                        : "border border-sage/30 bg-white text-charcoal"
                    }`}
                  >
                    <UserIcon className="h-5 w-5" />
                    <span className="min-w-0 flex-1 truncate">
                      Profil ({displayName})
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Sedang keluar..." : "Keluar Akun"}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-forest py-3 text-sm font-bold text-forest"
                  >
                    <LogIn className="h-4 w-4" />
                    Masuk
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-3 text-sm font-bold text-cream shadow"
                  >
                    Daftar
                    <ArrowRight className="h-4 w-4 text-sage" />
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
