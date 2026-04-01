export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: "admin" | "doctor" | "secretary" | "patient";
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          tenant_id?: string | null;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role: "admin" | "doctor" | "secretary" | "patient";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "admin" | "doctor" | "secretary" | "patient";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      doctors: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          specialty: string | null;
          license_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          specialty?: string | null;
          license_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          specialty?: string | null;
          license_number?: string | null;
          created_at?: string;
        };
      };
      doctor_schedules: {
        Row: {
          id: string;
          tenant_id: string;
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          doctor_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          birth_date: string | null;
          phone: string | null;
          emergency_contact: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          birth_date?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          birth_date?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          tenant_id: string;
          doctor_id: string;
          patient_id: string;
          status: "scheduled" | "confirmed" | "cancelled" | "completed";
          starts_at: string;
          ends_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          doctor_id: string;
          patient_id: string;
          status?: "scheduled" | "confirmed" | "cancelled" | "completed";
          starts_at: string;
          ends_at: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          doctor_id?: string;
          patient_id?: string;
          status?: "scheduled" | "confirmed" | "cancelled" | "completed";
          starts_at?: string;
          ends_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          tenant_id: string;
          appointment_id: string;
          doctor_id: string;
          patient_id: string;
          instructions: string;
          medications: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          appointment_id: string;
          doctor_id: string;
          patient_id: string;
          instructions: string;
          medications?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          appointment_id?: string;
          doctor_id?: string;
          patient_id?: string;
          instructions?: string;
          medications?: Json;
          created_at?: string;
        };
      };
      whatsapp_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          phone_number: string;
          status: "active" | "inactive" | "error";
          provider: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone_number: string;
          status?: "active" | "inactive" | "error";
          provider: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone_number?: string;
          status?: "active" | "inactive" | "error";
          provider?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
};
