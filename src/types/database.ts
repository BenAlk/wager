/**
 * Database type definitions for Supabase
 *
 * Generated from database schema - Last updated: 2025-10-11
 *
 * To regenerate types:
 * supabase gen types typescript --project-id erospvtjewayhmqcyeoh > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          first_name: string | null
          last_name: string | null
          start_week: number
          start_year: number
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          start_week: number
          start_year: number
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          start_week?: number
          start_year?: number
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          user_id: string
          normal_rate: number
          drs_rate: number
          mileage_rate: number
          invoicing_service: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          normal_rate?: number
          drs_rate?: number
          mileage_rate?: number
          invoicing_service?: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          normal_rate?: number
          drs_rate?: number
          mileage_rate?: number
          invoicing_service?: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      weeks: {
        Row: {
          id: string
          user_id: string
          week_number: number
          year: number
          individual_level: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          company_level: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          bonus_amount: number
          mileage_rate: number
          invoicing_service: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          notes: string | null
          rankings_entered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          year: number
          individual_level?: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          company_level?: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          bonus_amount?: number
          mileage_rate?: number
          invoicing_service?: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          notes?: string | null
          rankings_entered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_number?: number
          year?: number
          individual_level?: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          company_level?: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+' | null
          bonus_amount?: number
          mileage_rate?: number
          invoicing_service?: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
          notes?: string | null
          rankings_entered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weeks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      work_days: {
        Row: {
          id: string
          week_id: string
          date: string
          route_type: 'Normal' | 'DRS'
          route_number: string | null
          daily_rate: number
          stops_given: number
          stops_taken: number
          amazon_paid_miles: number | null
          van_logged_miles: number | null
          mileage_rate: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_id: string
          date: string
          route_type: 'Normal' | 'DRS'
          route_number?: string | null
          daily_rate: number
          stops_given?: number
          stops_taken?: number
          amazon_paid_miles?: number | null
          van_logged_miles?: number | null
          mileage_rate?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_id?: string
          date?: string
          route_type?: 'Normal' | 'DRS'
          route_number?: string | null
          daily_rate?: number
          stops_given?: number
          stops_taken?: number
          amazon_paid_miles?: number | null
          van_logged_miles?: number | null
          mileage_rate?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_days_week_id_fkey"
            columns: ["week_id"]
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          }
        ]
      }
      van_hires: {
        Row: {
          id: string
          user_id: string
          on_hire_date: string
          off_hire_date: string | null
          van_type: 'Fleet' | 'Flexi' | null
          registration: string
          weekly_rate: number
          deposit_paid: number
          deposit_complete: boolean
          deposit_refunded: boolean
          deposit_refund_amount: number | null
          deposit_hold_until: string | null
          deposit_calculation_start_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          on_hire_date: string
          off_hire_date?: string | null
          van_type?: 'Fleet' | 'Flexi' | null
          registration: string
          weekly_rate: number
          deposit_paid?: number
          deposit_complete?: boolean
          deposit_refunded?: boolean
          deposit_refund_amount?: number | null
          deposit_hold_until?: string | null
          deposit_calculation_start_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          on_hire_date?: string
          off_hire_date?: string | null
          van_type?: 'Fleet' | 'Flexi' | null
          registration?: string
          weekly_rate?: number
          deposit_paid?: number
          deposit_complete?: boolean
          deposit_refunded?: boolean
          deposit_refund_amount?: number | null
          deposit_hold_until?: string | null
          deposit_calculation_start_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_hires_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage throughout the app
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type User = Tables<'users'>
export type UserSettings = Tables<'user_settings'>
export type Week = Tables<'weeks'> & { work_days?: WorkDay[] }
export type WorkDay = Tables<'work_days'>
export type VanHire = Tables<'van_hires'>

// Enum types
export type PerformanceLevel = 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+'
export type RouteType = 'Normal' | 'DRS'
export type VanType = 'Fleet' | 'Flexi'
export type InvoicingService = 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
