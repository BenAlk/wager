/**
 * Database type definitions for Supabase
 *
 * This file will be auto-generated once we create the database schema.
 * For now, it's a placeholder to allow the Supabase client to compile.
 *
 * To generate types after creating tables:
 * pnpm supabase gen types typescript --project-id your-project-ref > src/types/database.ts
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
      // Tables will be defined here after we create the schema
      users: {
        Row: {
          id: string
          email: string
          start_week: number
          start_year: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          start_week: number
          start_year: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          start_week?: number
          start_year?: number
          created_at?: string
        }
      }
      // More tables will be added as we build the schema
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      route_type: 'Normal' | 'DRS'
      performance_level: 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
