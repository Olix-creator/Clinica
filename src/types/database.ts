export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_date: string
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_date?: string
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: []
      }
      clinics: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          clinic_id: string
          id: string
          profile_id: string
          specialty: string | null
        }
        Insert: {
          clinic_id: string
          id?: string
          profile_id: string
          specialty?: string | null
        }
        Update: {
          clinic_id?: string
          id?: string
          profile_id?: string
          specialty?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_doctor: { Args: { doctor_row: string }; Returns: boolean }
      is_receptionist: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "patient" | "doctor" | "receptionist"
      appointment_status: "pending" | "confirmed" | "done" | "cancelled"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
