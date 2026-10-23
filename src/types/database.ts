import {
  UserCalculatorInput,
  CalculationResult,
  LegacyCalculationResult,
  CarbonCategoryType,
} from "./carbon";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type { CarbonCategoryType };

export type ActionCommitmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "abandoned";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email_notifications_enabled: boolean;
          last_notification_sent_at: string | null;
          last_notified_calculation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email_notifications_enabled?: boolean;
          last_notification_sent_at?: string | null;
          last_notified_calculation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email_notifications_enabled?: boolean;
          last_notification_sent_at?: string | null;
          last_notified_calculation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string;
          calculation_id: string | null;
          recipient_email: string;
          notification_type: string;
          status: "sent" | "failed" | "simulated";
          provider_id: string | null;
          error_message: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calculation_id?: string | null;
          recipient_email: string;
          notification_type?: string;
          status: "sent" | "failed" | "simulated";
          provider_id?: string | null;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calculation_id?: string | null;
          recipient_email?: string;
          notification_type?: string;
          status?: "sent" | "failed" | "simulated";
          provider_id?: string | null;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      carbon_calculations: {
        Row: {
          id: string;
          user_id: string;
          calculation_date: string;
          period_month: number;
          period_year: number;
          period_week?: number | null;
          methodology_version?: string;
          // Kolom utama metodologi baru (mingguan plastik sekali pakai)
          total_weekly_kg?: number;
          kantong_plastik_weekly_kg?: number;
          wadah_makanan_weekly_kg?: number;
          botol_minum_weekly_kg?: number;
          wadah_styrofoam_weekly_kg?: number;
          total_items_per_week?: number;
          // Kolom proyeksi / kompatibilitas bulanan & tahunan
          total_monthly_kg: number;
          total_yearly_kg: number;
          // Kolom historis metodologi v1
          transport_monthly_kg?: number;
          energy_monthly_kg?: number;
          food_monthly_kg?: number;
          consumption_monthly_kg?: number;
          waste_monthly_kg?: number;
          highest_category: CarbonCategoryType;
          confidence_score: number;
          input_snapshot: UserCalculatorInput | Record<string, unknown>;
          result_snapshot: CalculationResult | LegacyCalculationResult | Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calculation_date?: string;
          period_month: number;
          period_year: number;
          period_week?: number | null;
          methodology_version?: string;
          total_weekly_kg?: number;
          kantong_plastik_weekly_kg?: number;
          wadah_makanan_weekly_kg?: number;
          botol_minum_weekly_kg?: number;
          wadah_styrofoam_weekly_kg?: number;
          total_items_per_week?: number;
          total_monthly_kg: number;
          total_yearly_kg: number;
          transport_monthly_kg?: number;
          energy_monthly_kg?: number;
          food_monthly_kg?: number;
          consumption_monthly_kg?: number;
          waste_monthly_kg?: number;
          highest_category: CarbonCategoryType;
          confidence_score: number;
          input_snapshot: UserCalculatorInput | Record<string, unknown>;
          result_snapshot: CalculationResult | LegacyCalculationResult | Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calculation_date?: string;
          period_month?: number;
          period_year?: number;
          period_week?: number | null;
          methodology_version?: string;
          total_weekly_kg?: number;
          kantong_plastik_weekly_kg?: number;
          wadah_makanan_weekly_kg?: number;
          botol_minum_weekly_kg?: number;
          wadah_styrofoam_weekly_kg?: number;
          total_items_per_week?: number;
          total_monthly_kg?: number;
          total_yearly_kg?: number;
          transport_monthly_kg?: number;
          energy_monthly_kg?: number;
          food_monthly_kg?: number;
          consumption_monthly_kg?: number;
          waste_monthly_kg?: number;
          highest_category?: CarbonCategoryType;
          confidence_score?: number;
          input_snapshot?: UserCalculatorInput | Record<string, unknown>;
          result_snapshot?: CalculationResult | LegacyCalculationResult | Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carbon_calculations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      green_action_commitments: {
        Row: {
          id: string;
          user_id: string;
          action_id: string;
          category: CarbonCategoryType;
          title: string;
          potential_saving_kg: number;
          realized_saving_kg: number;
          potential_weekly_saving_kg?: number;
          realized_weekly_saving_kg?: number;
          status: ActionCommitmentStatus;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_id: string;
          category: CarbonCategoryType;
          title: string;
          potential_saving_kg: number;
          realized_saving_kg?: number;
          potential_weekly_saving_kg?: number;
          realized_weekly_saving_kg?: number;
          status?: ActionCommitmentStatus;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_id?: string;
          category?: CarbonCategoryType;
          title?: string;
          potential_saving_kg?: number;
          realized_saving_kg?: number;
          potential_weekly_saving_kg?: number;
          realized_weekly_saving_kg?: number;
          status?: ActionCommitmentStatus;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "green_action_commitments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      community_impact_summary: {
        Row: {
          total_active_students: number;
          total_calculations_recorded: number;
          avg_student_monthly_kg: number;
          total_recorded_footprint_kg: number;
          total_potential_savings_kg: number;
          total_realized_savings_kg: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_community_impact_summary: {
        Args: Record<string, never>;
        Returns: {
          total_active_students: number;
          total_calculations_recorded: number;
          avg_student_monthly_kg: number;
          total_recorded_footprint_kg: number;
          total_potential_savings_kg: number;
          total_realized_savings_kg: number;
        }[];
      };
    };
  };
}

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileInsert =
  Database["public"]["Tables"]["profiles"]["Insert"];

export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];

export type CarbonCalculation =
  Database["public"]["Tables"]["carbon_calculations"]["Row"];

export type CarbonCalculationInsert =
  Database["public"]["Tables"]["carbon_calculations"]["Insert"];

export type GreenActionCommitment =
  Database["public"]["Tables"]["green_action_commitments"]["Row"];

export type GreenActionCommitmentInsert =
  Database["public"]["Tables"]["green_action_commitments"]["Insert"];

export type CommunityImpactSummary =
  Database["public"]["Views"]["community_impact_summary"]["Row"];
