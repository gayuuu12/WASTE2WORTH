/**
 * Supabase table types for Waste2Worth.
 *
 * buyer_requirements Row reflects the POST-MIGRATION schema
 * (supabase/migrations/20260816_buyer_requirements_phase3_columns.sql).
 *
 * Regenerate from Supabase when possible:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type RequirementStatus = "active" | "fulfilled" | "paused" | "closed"

export interface Database {
  public: {
    Tables: {
      buyer_requirements: {
        Row: {
          id: string
          buyer_company_id: string
          created_by: string | null
          title: string
          description: string | null
          category_id: string | null
          material_name: string
          desired_grade: string | null
          quantity_needed: number | null
          minimum_acceptable_quantity: number | null
          quantity_unit: string
          max_price: number | null
          currency: string
          preferred_quality: string | null
          max_distance_km: number | null
          preferred_city: string | null
          preferred_state: string | null
          preferred_country: string | null
          latitude: number | null
          longitude: number | null
          recurring: boolean
          required_by: string | null
          notes: string | null
          status: RequirementStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_company_id: string
          created_by?: string | null
          title: string
          description?: string | null
          category_id?: string | null
          material_name: string
          desired_grade?: string | null
          quantity_needed?: number | null
          minimum_acceptable_quantity?: number | null
          quantity_unit: string
          max_price?: number | null
          currency: string
          preferred_quality?: string | null
          max_distance_km?: number | null
          preferred_city?: string | null
          preferred_state?: string | null
          preferred_country?: string | null
          latitude?: number | null
          longitude?: number | null
          recurring?: boolean
          required_by?: string | null
          notes?: string | null
          status?: RequirementStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["buyer_requirements"]["Insert"]>
      }
    }
  }
}

/** Columns the create/update requirement actions insert (snake_case). */
export const BUYER_REQUIREMENT_WRITE_COLUMNS = [
  "buyer_company_id",
  "created_by",
  "title",
  "description",
  "category_id",
  "material_name",
  "desired_grade",
  "quantity_needed",
  "minimum_acceptable_quantity",
  "quantity_unit",
  "max_price",
  "currency",
  "preferred_quality",
  "max_distance_km",
  "preferred_city",
  "preferred_state",
  "preferred_country",
  "latitude",
  "longitude",
  "recurring",
  "required_by",
  "notes",
  "status",
] as const

export type BuyerRequirementInsert =
  Database["public"]["Tables"]["buyer_requirements"]["Insert"]
