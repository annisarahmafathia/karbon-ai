
import Link from "next/link";
import {
  Leaf,
  Calculator,
  Sparkles,
  BookOpen,
  ArrowRight,
  MapPin,
  Lightbulb,
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Kalkulator Jejak Karbon",
    description:
      "Hitung perkiraan emisi dari transportasi, makanan, energi, dan aktivitas sehari-hari.",
    href: "/kalkulator",
    action: "Mulai menghitung",
  },
  {
    icon: Sparkles,
    title: "Green Action",
    description:
      "Temukan rekomendasi sederhana untuk membantu mengurangi jejak karbonmu.",
    href: "/green-action",
    action: "Lihat rekomendasi",
  },
  {
    icon: BookOpen,
    title: "Metodologi & Edukasi",
    description:
      "Pelajari cara perhitungan emisi dan kebiasaan yang lebih ramah lingkungan.",
    href: "/edukasi",
    action: "Mulai belajar",
  },
];

export default function HomePage() {
  return (
    <div className="w-full bg-cream">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint text-forest text-sm font-bold">
                <Leaf className="w-4 h-4" />
                Langkah kecil, dampak berarti
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-charcoal">
                Kenali Jejak Karbonmu,
                <span className="text-forest"> Mulai dari Aceh.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl">
                Pahami dampak aktivitas sehari-harimu terhadap lingkungan.
                Hitung perkiraan emisi karbon, kenali sumber terbesarnya, dan
                temukan langkah sederhana untuk hidup lebih berkelanjutan.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/kalkulator"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest hover:bg-forest-dark text-cream font-bold shadow-md transition-all"
                >
                  <Calculator className="w-5 h-5" />
                  Hitung Jejak Karbon
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/edukasi"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-sage/40 bg-white hover:bg-mint/40 text-forest font-bold transition-all"
                >
                  Pelajari Lebih Lanjut
                </Link>
              </div>

              <p className="text-xs text-muted">
                Dirancang untuk membantu mahasiswa memahami emisi dari
                aktivitas sehari-hari.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-mint/50 rounded-[2.5rem] rotate-3" />

              <div className="relative bg-white rounded-[2rem] border border-sage/30 shadow-lg p-7 sm:p-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-forest flex items-center justify-center">
                  <Leaf className="w-9 h-9 text-cream" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-forest">
                    Mulai dari kebiasaanmu
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-charcoal">
                    Setiap aktivitas punya dampak.
                  </h2>
                  <p className="text-sm text-muted leading-relaxed">
                    Perjalanan ke kampus, pilihan makanan, pemakaian listrik,
                    hingga kebiasaan berbelanja dapat berkontribusi terhadap
                    jejak karbon.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Kenali sumber emisi pribadi",
                    "Pahami hasil perhitungan",
                    "Pilih aksi yang bisa dilakukan",
                  ].map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-mint text-forest flex items-center justify-center text-sm font-black shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-charcoal">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-white/60 border-y border-sage/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-bold uppercase tracking-widest text-forest">
              Jelajahi CarbonAceh
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-charcoal">
              Mulai dari memahami, lanjutkan dengan bertindak.
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Gunakan fitur yang tersedia untuk mengenali jejak karbon dan
              menemukan cara mengurangi dampaknya dalam kehidupan sehari-hari.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.href}
                  className="bg-white rounded-2xl border border-sage/30 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-mint text-forest flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-black text-charcoal">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-muted leading-relaxed mt-3 flex-1">
                    {feature.description}
                  </p>

                  <Link
                    href={feature.href}
                    className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-forest hover:underline"
                  >
                    {feature.action}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-forest text-cream p-7 sm:p-10 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-7">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 text-sage-light">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-bold">
                  Mulai dari lingkungan sekitar
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black">
                Perubahan tidak harus dimulai dari hal besar.
              </h2>

              <p className="text-sm text-cream/80 leading-relaxed">
                Kenali kebiasaanmu terlebih dahulu, lalu tentukan langkah
                yang paling realistis untuk dilakukan.
              </p>
            </div>

            <Link
              href="/kalkulator"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cream text-forest hover:bg-mint font-bold transition-colors shrink-0"
            >
              <Lightbulb className="w-5 h-5" />
              Mulai Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
