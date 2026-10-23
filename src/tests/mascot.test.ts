import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { MASCOT_CONFIGS } from "../components/results/EarthMascotCard";
import { calculateCarbonFootprint } from "../lib/calculator/engine";

test("1. Asset file ilustrasi maskot Bumi tersedia di public/images", async () => {
  const images = ["bumisenang.png", "bumikhawatir.png", "bumisedih.png"];
  for (const img of images) {
    const imgPath = path.resolve(process.cwd(), "public/images", img);
    const stat = await fs.stat(imgPath);
    assert.ok(stat.isFile(), `File ${img} harus berupa file yang valid`);
    assert.ok(stat.size > 0, `File ${img} tidak boleh kosong`);
  }
});

test("2. Konfigurasi maskot Bumi sesuai ketentuan emisi (rendah, sedang, tinggi)", () => {
  // Emisi Rendah: bumisenang.png, Bumi Tersenyum
  assert.equal(MASCOT_CONFIGS.rendah.src, "/images/bumisenang.png");
  assert.equal(MASCOT_CONFIGS.rendah.title, "Bumi Tersenyum");
  assert.equal(
    MASCOT_CONFIGS.rendah.message,
    "Kebiasaanmu sudah cukup baik! Pertahankan langkah kecilmu untuk mengurangi penggunaan plastik sekali pakai."
  );

  // Emisi Sedang: bumikhawatir.png, Bumi Mulai Khawatir
  assert.equal(MASCOT_CONFIGS.sedang.src, "/images/bumikhawatir.png");
  assert.equal(MASCOT_CONFIGS.sedang.title, "Bumi Mulai Khawatir");
  assert.equal(
    MASCOT_CONFIGS.sedang.message,
    "Masih ada kebiasaan yang bisa diperbaiki. Yuk, mulai kurangi penggunaan plastik sekali pakai."
  );

  // Emisi Tinggi: bumisedih.png, Bumi Butuh Bantuanmu
  assert.equal(MASCOT_CONFIGS.tinggi.src, "/images/bumisedih.png");
  assert.equal(MASCOT_CONFIGS.tinggi.title, "Bumi Butuh Bantuanmu");
  assert.equal(
    MASCOT_CONFIGS.tinggi.message,
    "Emisi dari penggunaan plastikmu relatif tinggi. Tenang, kamu bisa mulai menguranginya dari satu kebiasaan kecil."
  );
});

test("3. Pemilihan maskot otomatis mengikuti kategori emisi hasil kalkulasi", () => {
  // Skenario A: Input kecil (Zero waste / < 0.4 kg CO2e) -> status 'rendah' -> bumisenang.png
  const lowInput = {
    kantongPlastik: 1,
    wadahMakanan: 0,
    botolMinum: 1,
    wadahStyrofoam: 0,
  };
  const lowResult = calculateCarbonFootprint(lowInput);
  assert.equal(lowResult.benchmark.status, "rendah");
  const lowMascot = MASCOT_CONFIGS[lowResult.benchmark.status];
  assert.equal(lowMascot.src, "/images/bumisenang.png");
  assert.equal(lowMascot.title, "Bumi Tersenyum");

  // Skenario B: Input sedang (0.4 - 1.2 kg CO2e) -> status 'sedang' -> bumikhawatir.png
  const medInput = {
    kantongPlastik: 5,
    wadahMakanan: 3,
    botolMinum: 4,
    wadahStyrofoam: 1,
  };
  const medResult = calculateCarbonFootprint(medInput);
  assert.equal(medResult.benchmark.status, "sedang");
  const medMascot = MASCOT_CONFIGS[medResult.benchmark.status];
  assert.equal(medMascot.src, "/images/bumikhawatir.png");
  assert.equal(medMascot.title, "Bumi Mulai Khawatir");

  // Skenario C: Input tinggi (> 1.2 kg CO2e) -> status 'tinggi' -> bumisedih.png
  const highInput = {
    kantongPlastik: 15,
    wadahMakanan: 8,
    botolMinum: 14,
    wadahStyrofoam: 5,
  };
  const highResult = calculateCarbonFootprint(highInput);
  assert.equal(highResult.benchmark.status, "tinggi");
  const highMascot = MASCOT_CONFIGS[highResult.benchmark.status];
  assert.equal(highMascot.src, "/images/bumisedih.png");
  assert.equal(highMascot.title, "Bumi Butuh Bantuanmu");
});

test("4. Halaman hasil kalkulator mengintegrasikan EarthMascotCard dengan proporsionalitas gambar", async () => {
  const hasilPath = path.resolve(process.cwd(), "src/app/(app)/hasil/page.tsx");
  const content = await fs.readFile(hasilPath, "utf-8");

  assert.ok(
    content.includes("EarthMascotCard"),
    "hasil/page.tsx harus mengimpor dan menggunakan EarthMascotCard"
  );
  assert.ok(
    content.includes("result.benchmark.status"),
    "hasil/page.tsx harus meneruskan result.benchmark.status ke EarthMascotCard"
  );

  const componentPath = path.resolve(
    process.cwd(),
    "src/components/results/EarthMascotCard.tsx"
  );
  const componentContent = await fs.readFile(componentPath, "utf-8");

  // Verifikasi object-contain digunakan agar gambar proporsional dan tidak terpotong
  assert.ok(
    componentContent.includes("object-contain"),
    "EarthMascotCard harus menggunakan object-contain agar rasio gambar tetap proporsional"
  );

  // Verifikasi penanganan gambar hilang (onError fallback)
  assert.ok(
    componentContent.includes("onError"),
    "EarthMascotCard harus memiliki penanganan onError jika gambar tidak ditemukan"
  );
});
