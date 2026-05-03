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
          appointment_day: string | null
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          time_slot: string | null
        }
        Insert: {
          appointment_date: string
          appointment_day?: string | null
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_day?: string | null
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot?: string | null
        }
        Relationships: []
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          last_geocoded_at: string | null
          latitude: number | null
          location_accuracy_m: number | null
          location_source: string | null
          longitude: number | null
          monthly_appointments_count: number
          name: string
          phone: string | null
          plan_type: "free" | "premium"
          since_year: number | null
          specialty: string | null
          status: "pending" | "approved" | "rejected"
          trial_end_date: string
          trust_reason: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          location_source?: string | null
          longitude?: number | null
          monthly_appointments_count?: number
          name: string
          phone?: string | null
          plan_type?: "free" | "premium"
          since_year?: number | null
          specialty?: string | null
          status?: "pending" | "approved" | "rejected"
          trial_end_date?: string
          trust_reason?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          location_source?: string | null
          longitude?: number | null
          monthly_appointments_count?: number
          name?: string
          phone?: string | null
          plan_type?: "free" | "premium"
          since_year?: number | null
          specialty?: string | null
          status?: "pending" | "approved" | "rejected"
          trial_end_date?: string
          trust_reason?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          clinic_id: string
          description: string | null
          diploma: string | null
          id: string
          name: string | null
          profile_id: string
          since_year: number | null
          specialty: string | null
        }
        Insert: {
          clinic_id: string
          description?: string | null
          diploma?: string | null
          id?: string
          name?: string | null
          profile_id: string
          since_year?: number | null
          specialty?: string | null
        }
        Update: {
          clinic_id?: string
          description?: string | null
          diploma?: string | null
          id?: string
          name?: string | null
          profile_id?: string
          since_year?: number | null
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
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          appointment_id: string | null
          phone: string | null
          template_key: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          message: string
          appointment_id?: string | null
          phone?: string | null
          template_key?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          message?: string
          appointment_id?: string | null
          phone?: string | null
          template_key?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      clinic_members: {
        Row: {
          id: string
          clinic_id: string
          user_id: string
          role: Database["public"]["Enums"]["clinic_member_role"]
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id: string
          role: Database["public"]["Enums"]["clinic_member_role"]
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["clinic_member_role"]
          invited_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          clinic_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: string
          seats: number
          started_at: string
          renewed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          clinic_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          seats?: number
          started_at?: string
          renewed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          clinic_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          seats?: number
          started_at?: string
          renewed_at?: string | null
          cancelled_at?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_doctor: { Args: { doctor_row: string }; Returns: boolean }
      is_receptionist: { Args: never; Returns: boolean }
      is_clinic_owner: { Args: { clinic_row: string }; Returns: boolean }
      is_clinic_member: { Args: { clinic_row: string }; Returns: boolean }
      is_clinic_staff: { Args: { clinic_row: string }; Returns: boolean }
      find_profile_by_email: {
        Args: { lookup_email: string }
        Returns: {
          id: string
          full_name: string | null
          email: string | null
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      search_clinics_nearby: {
        Args: {
          p_city?: string
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_query?: string
          p_radius_km?: number
          p_specialty?: string
        }
        Returns: {
          address: string | null
          city: string | null
          description: string | null
          distance_km: number
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          specialty: string | null
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "receptionist"
      appointment_status: "pending" | "confirmed" | "done" | "cancelled"
      clinic_member_role: "doctor" | "receptionist" | "owner"
      plan_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
