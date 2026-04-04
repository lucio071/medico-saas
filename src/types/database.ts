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
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          email: string;
          full_name: string;
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
          full_name: string;
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
          full_name?: string;
          phone?: string | null;
          role?: "admin" | "doctor" | "secretary" | "patient";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      doctors: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string;
          specialty: string | null;
          license_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          specialty?: string | null;
          license_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string;
          specialty?: string | null;
          license_number?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "patients_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
