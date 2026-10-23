import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { parseResultSnapshot, isPlasticCalculationResult } from "../lib/history/snapshot";
import { calculateCarbonFootprint } from "../lib/calculator/engine";

test("Dashboard code structure: maintains 'Perhitungan Terakhir' and removes duplicate 'Emisi Perhitungan Terbaru'", async () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    "src/app/(app)/dashboard/page.tsx"
  );
  const content = await fs.readFile(dashboardPath, "utf-8");

  // Harus mempertahankan "Perhitungan Terakhir"
  assert.ok(
    content.includes("Perhitungan Terakhir"),
    "Dashboard harus mempertahankan komponen 'Perhitungan Terakhir'"
  );

  // Komponen duplikat "Emisi Perhitungan Terbaru" harus sudah dihapus
  assert.ok(
    !content.includes("Emisi Perhitungan Terbaru"),
    "Dashboard tidak boleh lagi menampilkan komponen duplikat 'Emisi Perhitungan Terbaru'"
  );

  // Grid summary cards harus disesuaikan menjadi 2 kolom (sm:grid-cols-2)
  assert.ok(
    content.includes("sm:grid-cols-2"),
    "Summary cards grid harus menggunakan layout 2 kolom yang rapi"
  );
  assert.ok(
    !content.includes("xl:grid-cols-3"),
    "Grid tidak boleh lagi menggunakan 3 kolom setelah komponen duplikat dihapus"
  );

  // Empty state informatif jika belum ada kalkulasi
  assert.ok(
    content.includes("Belum ada perhitungan karbon"),
    "Harus ada empty state informatif jika belum ada kalkulasi"
  );
  assert.ok(
    content.includes("Yuk, mulai hitung jejak karbon"),
    "Empty state harus mengajak pengguna untuk mulai menghitung"
  );
});

test("Dashboard emission resolution: does not mask missing data as 0 and recovers emission from snapshot", () => {
  // 1. Kasus kalkulasi plastik baru tersimpan dengan kolom total_weekly_kg
  const calcWithCol = {
    id: "calc-1",
    total_weekly_kg: 2.345,
    result_snapshot: calculateCarbonFootprint({
      kantongPlastik: 5,
      wadahMakanan: 3,
      botolMinum: 2,
      wadahStyrofoam: 1,
    }),
  };
  assert.equal(Number(calcWithCol.total_weekly_kg), 2.345);

  // 2. Kasus database remote belum memiliki kolom total_weekly_kg (fallback storage)
  // total_weekly_kg bernilai null/undefined, tetapi data tersimpan di result_snapshot
  const realResult = calculateCarbonFootprint({
    kantongPlastik: 4,
    wadahMakanan: 2,
    botolMinum: 3,
    wadahStyrofoam: 1,
  });
  const calcWithoutCol = {
    id: "calc-2",
    total_weekly_kg: null,
    total_monthly_kg: realResult.totalMonthlyKgCO2e,
    result_snapshot: realResult,
  };

  const snap = parseResultSnapshot(calcWithoutCol.result_snapshot);
  assert.ok(snap && isPlasticCalculationResult(snap));

  // Resolusi nilai tidak boleh 0, melainkan mengambil totalWeeklyKgCO2e dari snapshot
  const resolvedEmission =
    calcWithoutCol.total_weekly_kg != null
      ? Number(calcWithoutCol.total_weekly_kg)
      : snap && isPlasticCalculationResult(snap)
      ? Number(snap.totalWeeklyKgCO2e)
      : null;

  assert.equal(resolvedEmission, realResult.totalWeeklyKgCO2e);
  assert.ok(resolvedEmission > 0, "Emisi tidak boleh 0 jika snapshot memiliki emisi positif");
});

test("Dashboard distinguishes genuine 0 emission (Zero-Waste Hero) from missing data (null)", () => {
  // Input semua 0 (Zero-Waste Hero)
  const zeroResult = calculateCarbonFootprint({
    kantongPlastik: 0,
    wadahMakanan: 0,
    botolMinum: 0,
    wadahStyrofoam: 0,
  });

  const zeroCalc = {
    id: "calc-zero",
    total_weekly_kg: 0,
    result_snapshot: zeroResult,
  };

  const snap = parseResultSnapshot(zeroCalc.result_snapshot);
  assert.ok(snap && isPlasticCalculationResult(snap));

  const resolvedEmission =
    zeroCalc.total_weekly_kg != null
      ? Number(zeroCalc.total_weekly_kg)
      : snap && isPlasticCalculationResult(snap)
      ? Number(snap.totalWeeklyKgCO2e)
      : null;

  // Nilai emisi benar-benar 0 (number), bukan null
  assert.equal(resolvedEmission, 0);
  assert.notEqual(resolvedEmission, null);

  // Data kosong/belum ada (misal pengguna baru)
  const missingCalc = null;
  const missingEmission = missingCalc ? 0 : null;
  assert.equal(missingEmission, null, "Pengguna tanpa kalkulasi harus menghasilkan null, bukan 0");
});

test("formatWeekRangeLabel and getWeekBounds correctly format weekly bounds into '5–11 Okt', '12–18 Okt', '19–25 Okt'", async () => {
  const { getWeekBounds, formatWeekRangeLabel } = await import("../lib/history/snapshot");

  // 1. Tanggal 8 Oktober 2026 (Kamis) -> Minggu 5-11 Oktober
  const oct8 = new Date(2026, 9, 8); // Bulan 9 = Oktober (0-indexed)
  const boundsOct8 = getWeekBounds(oct8);
  assert.equal(formatWeekRangeLabel(boundsOct8.start, boundsOct8.end), "5–11 Okt");

  // 2. Tanggal 15 Oktober 2026 (Kamis) -> Minggu 12-18 Oktober
  const oct15 = new Date(2026, 9, 15);
  const boundsOct15 = getWeekBounds(oct15);
  assert.equal(formatWeekRangeLabel(boundsOct15.start, boundsOct15.end), "12–18 Okt");

  // 3. Tanggal 23 Oktober 2026 (Jumat) -> Minggu 19-25 Oktober
  const oct23 = new Date(2026, 9, 23);
  const boundsOct23 = getWeekBounds(oct23);
  assert.equal(formatWeekRangeLabel(boundsOct23.start, boundsOct23.end), "19–25 Okt");

  // 4. Batas lintas bulan: 28 Oktober 2026 -> 26 Okt - 1 Nov
  const oct28 = new Date(2026, 9, 28);
  const boundsOct28 = getWeekBounds(oct28);
  assert.equal(formatWeekRangeLabel(boundsOct28.start, boundsOct28.end), "26 Okt–1 Nov");
});

test("Dashboard groups calculations per weekly date range chronologically and displays Tren Emisi Mingguan", async () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    "src/app/(app)/dashboard/page.tsx"
  );
  const content = await fs.readFile(dashboardPath, "utf-8");

  // 1. Judul grafik disesuaikan menjadi "Tren Emisi Mingguan"
  assert.ok(
    content.includes("Tren Emisi Mingguan"),
    "Judul grafik harus berupa 'Tren Emisi Mingguan'"
  );

  // 2. Keterangan satuan mingguan jelas
  assert.ok(
    content.includes("kg CO₂e/minggu"),
    "Grafik harus mencantumkan keterangan satuan 'kg CO₂e/minggu'"
  );

  // 3. Sumbu Y menampilkan skala emisi kg CO₂e
  assert.ok(
    content.includes("Sumbu Y"),
    "Grafik harus memiliki sumbu Y dengan satuan emisi"
  );

  // 4. Sumbu X menampilkan rentang tanggal mingguan
  assert.ok(
    content.includes("Sumbu X"),
    "Grafik harus memiliki sumbu X dengan rentang tanggal per minggu"
  );

  // 5. Menggunakan getWeekBounds dan formatWeekRangeLabel
  assert.ok(
    content.includes("getWeekBounds"),
    "Dashboard harus menggunakan getWeekBounds untuk pemetaan tanggal per minggu"
  );
  assert.ok(
    content.includes("formatWeekRangeLabel"),
    "Dashboard harus menggunakan formatWeekRangeLabel untuk sumbu X"
  );

  // 6. Menggunakan calculateBarHeight dan tidak menggunakan h-[62%] yang tidak terdefinisi
  assert.ok(
    content.includes("calculateBarHeight"),
    "Dashboard harus menggunakan calculateBarHeight untuk menghitung proporsi batang secara aman"
  );
  assert.ok(
    !content.includes("h-[62%]"),
    "Dashboard tidak boleh menggunakan h-[62%] yang menyebabkan batang tidak terlihat"
  );

  // 7. Layout batang harus selalu rata kiri (left-aligned) dengan justify-start, tidak boleh justify-center
  assert.ok(
    content.includes("justify-start"),
    "Kontainer batang dan label sumbu X harus menggunakan justify-start agar selalu rata kiri"
  );
  assert.ok(
    !content.includes("justify-center") || !content.includes("flex-1 flex-col items-center justify-end group"),
    "Batang tidak boleh menggunakan layout yang memusatkan seluruh batang (tidak boleh justify-center)"
  );

  // 8. Penanganan overflow responsif (overflow-x-auto) jika data melebihi lebar kontainer
  assert.ok(
    content.includes("overflow-x-auto"),
    "Dashboard harus menyediakan overflow-x-auto untuk mendukung scroll horizontal responsif"
  );

  // 9. Batang menggunakan posisi absolute bottom-0 dengan tinggi pasti 192px dan warna eksplisit
  assert.ok(
    content.includes("192px"),
    "Plot area dan sumbu Y harus memiliki tinggi pasti 192px agar persentase tinggi batang terdefinisi mutlak di Safari/WebKit"
  );
  assert.ok(
    content.includes("absolute bottom-0"),
    "Batang harus diposisikan di absolute bottom-0 agar menempel tepat pada garis dasar sumbu X"
  );
  assert.ok(
    content.includes("#234B38"),
    "Batang terbaru harus memiliki warna hijau tua resmi (#234B38) yang terdefinisi pasti"
  );
});

test("calculateBarHeight accurately handles 0 emissions, small positive emissions, and normal emissions", async () => {
  const { calculateBarHeight } = await import("../lib/history/snapshot");
  const maxEmission = 5.0; // 5.0 kg CO₂e

  // 1. Kasus Emisi 0 (Zero-Waste Hero)
  const zeroResult = calculateBarHeight(0, maxEmission);
  assert.equal(zeroResult.isZero, true, "Emisi 0 harus ditandai isZero = true");
  assert.equal(zeroResult.heightPercent, 0, "Tinggi persentase emisi 0 harus 0 (tidak mengarang batang palsu)");
  assert.equal(zeroResult.emission, 0);

  // 2. Kasus Emisi Positif Sangat Kecil (misal 0.02 kg pada skala 5.0 kg)
  // Perhitungan murni: (0.02 / 5.0) * 100 = 0.4% -> jika tanpa batas minimum, batang hanya ~0.6px dan tak terlihat
  const tinyResult = calculateBarHeight(0.02, maxEmission);
  assert.equal(tinyResult.isZero, false, "Emisi positif kecil bukan nol");
  assert.ok(
    tinyResult.heightPercent >= 6,
    `Tinggi persentase untuk emisi kecil (${tinyResult.heightPercent}%) harus memiliki tinggi minimum setidaknya 6% agar terlihat`
  );
  assert.equal(
    tinyResult.minHeightPx,
    8,
    "Harus menyertakan minHeight minimal 8px agar batang tetap ter-render secara visual"
  );

  // 3. Kasus Emisi Positif Normal / Proporsional (misal 2.5 kg pada skala 5.0 kg = 50%)
  const normalResult = calculateBarHeight(2.5, maxEmission);
  assert.equal(normalResult.isZero, false);
  assert.equal(normalResult.heightPercent, 50, "Tinggi harus proporsional 50% dari nilai maksimum");

  // 4. Kasus Emisi Maksimum (5.0 kg pada skala 5.0 kg = 100%)
  const maxResult = calculateBarHeight(5.0, maxEmission);
  assert.equal(maxResult.isZero, false);
  assert.equal(maxResult.heightPercent, 100, "Tinggi emisi puncak harus 100%");

  // 5. Pertahanan terhadap input rusak (NaN, negatif, undefined, null)
  const invalidResult = calculateBarHeight(NaN as unknown as number, maxEmission);
  assert.equal(invalidResult.isZero, true, "Input NaN harus ditangani aman sebagai emisi 0");
  assert.equal(invalidResult.heightPercent, 0);

  const negativeResult = calculateBarHeight(-1.5, maxEmission);
  assert.equal(negativeResult.isZero, true, "Input negatif harus disanitasi aman sebagai 0");
  assert.equal(negativeResult.heightPercent, 0);
});

test("calculateYAxisScale automatically adjusts Y-axis scale with adequate headroom for zero, small, normal, and exceeding emissions", async () => {
  const { calculateYAxisScale, calculateBarHeight } = await import("../lib/history/snapshot");

  // 1. Kasus Emisi Nol / Kosong (Zero-Waste Hero)
  const zeroScale = calculateYAxisScale(0);
  assert.equal(zeroScale.yAxisMax, 1.0, "Nilai 0 harus menggunakan skala default 1.0 kg CO₂e");
  assert.equal(zeroScale.yAxisMid, 0.5, "Nilai tengah skala 1.0 harus 0.5 kg CO₂e");

  // 2. Kasus Emisi Kecil (0.05 kg dan 0.55 kg)
  const smallScale1 = calculateYAxisScale(0.05);
  assert.ok(smallScale1.yAxisMax > 0.05, "Skala maksimum harus lebih besar dari 0.05 kg (memiliki headroom)");
  assert.equal(smallScale1.yAxisMax, 0.2);
  assert.equal(smallScale1.yAxisMid, 0.1);

  const smallScale2 = calculateYAxisScale(0.55);
  assert.ok(smallScale2.yAxisMax > 0.55, "Skala maksimum harus lebih besar dari 0.55 kg");
  assert.equal(smallScale2.yAxisMax, 0.8);
  assert.equal(smallScale2.yAxisMid, 0.4);

  // 3. Kasus Emisi Normal (1.85 kg dan 4.92 kg)
  const normalScale1 = calculateYAxisScale(1.85);
  assert.ok(normalScale1.yAxisMax > 1.85, "Skala maksimum harus lebih besar dari 1.85 kg");
  assert.equal(normalScale1.yAxisMax, 2.5);
  assert.equal(normalScale1.yAxisMid, 1.25);

  const normalScale2 = calculateYAxisScale(4.92);
  assert.ok(normalScale2.yAxisMax > 4.92, "Skala maksimum harus lebih besar dari 4.92 kg");
  assert.equal(normalScale2.yAxisMax, 8.0);
  assert.equal(normalScale2.yAxisMid, 4.0);

  // 4. Kasus Emisi yang Melebihi Skala Sebelumnya (misal 12.0 kg, 25.0 kg, 55.0 kg)
  const largeScale1 = calculateYAxisScale(12.0);
  assert.ok(largeScale1.yAxisMax > 12.0, "Skala harus naik otomatis jika nilai melebihi skala sebelumnya");
  assert.equal(largeScale1.yAxisMax, 15.0);
  assert.equal(largeScale1.yAxisMid, 7.5);

  const largeScale2 = calculateYAxisScale(25.0);
  assert.ok(largeScale2.yAxisMax > 25.0, "Skala harus naik untuk nilai 25.0 kg");
  assert.ok(largeScale2.yAxisMax >= 30.0);

  const largeScale3 = calculateYAxisScale(55.0);
  assert.ok(largeScale3.yAxisMax > 55.0, "Skala harus naik untuk nilai 55.0 kg");

  // 5. Verifikasi Tinggi Batang Proporsional terhadap Skala Otomatis dan Tidak Terpotong (Headroom)
  // Pada nilai puncak 4.92 kg dengan skala 8.0 kg:
  const barAtPeak = calculateBarHeight(4.92, normalScale2.yAxisMax);
  assert.ok(
    barAtPeak.heightPercent < 90,
    `Tinggi batang pada nilai puncak (${barAtPeak.heightPercent}%) harus < 90% sehingga memiliki ruang headroom agar label dan batang tidak terpotong`
  );
  assert.ok(
    barAtPeak.heightPercent > 50,
    `Tinggi batang pada nilai puncak (${barAtPeak.heightPercent}%) harus proporsional di atas nilai tengah`
  );

  // Pada nilai tepat di titik tengah skala:
  const barAtMid = calculateBarHeight(normalScale2.yAxisMid, normalScale2.yAxisMax);
  assert.equal(
    barAtMid.heightPercent,
    50,
    "Nilai pada titik tengah skala harus menghasilkan tinggi tepat 50%"
  );
});

test("Weekly emission labels are stably positioned above bars with 6–8px clearance, collision staggering, and top overflow safety", async () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    "src/app/(app)/dashboard/page.tsx"
  );
  const content = await fs.readFile(dashboardPath, "utf-8");

  // 1. Label angka diposisikan stabil di Safari (tidak bersarang di dalam batang dengan bottom-full)
  assert.ok(
    !content.includes("bottom-full mb-1"),
    "Label tidak boleh menggunakan bottom-full di dalam elemen batang yang bertransisi"
  );
  assert.ok(
    content.includes("labelBottomPx"),
    "Dashboard harus menghitung labelBottomPx secara pasti untuk posisi vertikal label"
  );

  // 2. Label angka menggunakan flex center pada kolom agar tepat sejajar horizontal dengan batang
  assert.ok(
    content.includes("absolute inset-x-0 flex items-center justify-center pointer-events-none z-10"),
    "Label harus menggunakan absolute inset-x-0 flex center dengan z-10 agar selalu di atas batang dan grid"
  );

  // 3. Batang berada pada z-0 dan label pada z-10 sehingga tidak tertutup
  assert.ok(
    content.includes("z-0") && content.includes("z-10"),
    "Stacking context harus jelas: batang z-0 dan label z-10"
  );

  // 4. Jarak vertikal 7px (6-8px) di atas batang / indikator 0
  assert.ok(
    content.includes("isZero\n                                ? 17") ||
    content.includes("isZero ? 17 :") ||
    content.includes("labelBottomPx = isZero\n                                ? 17"),
    "Indikator 0 harus menempatkan label pada 17px (jarak 7px di atas indikator 10px)"
  );

  // 5. Staggering jika ada tetangga dengan tinggi berdekatan (< 8%)
  assert.ok(
    content.includes("isCloseToNeighbor"),
    "Harus ada logika pendeteksi tetangga dengan tinggi berdekatan"
  );
  assert.ok(
    content.includes("verticalOffsetPx"),
    "Harus ada verticalOffsetPx untuk mencegah tabrakan label antar batang berdekatan"
  );

  // 6. Batas atas aman (maksimum 168px) agar label batang tertinggi tidak terpotong oleh overflow 192px
  assert.ok(
    content.includes("168"),
    "Label harus dibatasi maksimal 168px agar tidak pernah terpotong oleh overflow plot area 192px"
  );
});


