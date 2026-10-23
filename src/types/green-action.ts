import { PlasticCategory } from "./carbon";

export type ActionPriority = "Utama" | "Tambahan";
export type ActionDifficulty = "Mudah" | "Sedang" | "Perlu Usaha";

export interface PotentialImpact {
  weeklySavingKgCO2e: number | null; // null jika tidak dapat dihitung persis dengan faktor emisi
  monthlySavingKgCO2e: number | null;
  formattedSaving: string; // contoh: "~0.332 kg CO₂e / minggu" atau "Manfaat Kualitatif"
  qualitativeBenefit: string; // dampak non-angka yang pasti (misal: kesehatan, bebas mikroplastik)
}

export interface PersonalizedAction {
  id: string;
  category: PlasticCategory;
  categoryLabel: string;
  priority: ActionPriority;
  title: string;
  reason: string; // Alasan mengapa tindakan ini cocok untuk profil pengguna
  practicalSteps: string[]; // Langkah konkret sehari-hari
  potentialImpact: PotentialImpact;
  difficulty: ActionDifficulty;
  financialBenefit: string;
  localContext: string; // Konteks relevan kehidupan mahasiswa / lokal Aceh
}

export interface PrimaryPriorityInfo {
  category: PlasticCategory;
  categoryLabel: string;
  weeklyKgCO2e: number;
  percentage: number;
  itemCountPerWeek: number;
  explanation: string; // Mengapa kategori ini menjadi fokus utama
}

export interface GreenActionAnalysisResult {
  habitAnalysis: string; // Ringkasan singkat kondisi pengguna berdasarkan data kalkulasi
  primaryPriority: PrimaryPriorityInfo;
  recommendations: PersonalizedAction[];
  isZeroPlasticHero?: boolean;
}

export interface GreenActionApiResponse {
  success: boolean;
  isAiGenerated: boolean;
  source: "gemini_ai" | "rule_based_fallback";
  modelName?: string;
  data: GreenActionAnalysisResult;
  message?: string;
}
