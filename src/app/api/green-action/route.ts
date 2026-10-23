import { NextResponse, type NextRequest } from "next/server";
import { PlasticCalculatorInput, CalculationResult } from "@/types/carbon";
import { GreenActionApiResponse } from "@/types/green-action";
import {
  generateGeminiGreenActions,
  generateRuleBasedGreenActions,
} from "@/lib/ai/green-action";
import { sanitizeCalculatorInput } from "@/lib/validation";
import { calculateCarbonFootprint } from "@/lib/calculator/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          isAiGenerated: false,
          source: "rule_based_fallback",
          message: "Request body harus berupa objek JSON yang memuat input kalkulator.",
        },
        { status: 400 }
      );
    }

    // Sanitasi input pengguna untuk memastikan nilai nonnegatif yang valid
    const rawInput = body.input as Partial<PlasticCalculatorInput> | undefined;
    const sanitizedInput = sanitizeCalculatorInput(rawInput);

    // Hitung atau verifikasi ulang hasil kalkulasi agar integritas data terjamin 100%
    const computedResult: CalculationResult = calculateCarbonFootprint(sanitizedInput);

    // Cek apakah API Key Gemini tersedia di environment server
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

    if (hasGeminiKey) {
      try {
        const aiData = await generateGeminiGreenActions(sanitizedInput, computedResult);
        const response: GreenActionApiResponse = {
          success: true,
          isAiGenerated: true,
          source: "gemini_ai",
          modelName: process.env.GEMINI_MODEL || "gemini-1.5-flash",
          data: aiData,
        };
        return NextResponse.json(response);
      } catch (geminiError: unknown) {
        // Log kegagalan di server secara aman tanpa mengekspos API key
        const errMessage =
          geminiError instanceof Error ? geminiError.message : String(geminiError);
        console.warn(
          "[GreenAction API] Panggilan AI gagal, mengalihkan ke fallback berbasis aturan ilmiah:",
          errMessage
        );

        // Fallback otomatis jika AI gagal
        const fallbackData = generateRuleBasedGreenActions(sanitizedInput, computedResult);
        const fallbackResponse: GreenActionApiResponse = {
          success: true,
          isAiGenerated: false,
          source: "rule_based_fallback",
          data: fallbackData,
          message:
            "Layanan AI sedang sibuk atau mengalami kendala jaringan. Rekomendasi disajikan menggunakan metodologi ilmiah KarbonAI.",
        };
        return NextResponse.json(fallbackResponse);
      }
    }

    // Jika API Key belum dikonfigurasi, gunakan fallback terverifikasi
    const fallbackData = generateRuleBasedGreenActions(sanitizedInput, computedResult);
    const fallbackResponse: GreenActionApiResponse = {
      success: true,
      isAiGenerated: false,
      source: "rule_based_fallback",
      data: fallbackData,
      message:
        "Layanan AI eksternal belum dikonfigurasi (GEMINI_API_KEY). Rekomendasi dihitung menggunakan sistem berbasis metodologi ilmiah KarbonAI.",
    };
    return NextResponse.json(fallbackResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json(
      {
        success: false,
        isAiGenerated: false,
        source: "rule_based_fallback",
        message,
      },
      { status: 500 }
    );
  }
}
