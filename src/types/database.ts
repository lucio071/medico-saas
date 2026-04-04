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
      departments: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: number;
          department_id: number;
          name: string;
        };
        Insert: {
          id?: number;
          department_id: number;
          name: string;
        };
        Update: {
          id?: number;
          department_id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
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
          consultation_duration: number;
          department_id: number | null;
          city_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          specialty?: string | null;
          license_number?: string | null;
          consultation_duration?: number;
          department_id?: number | null;
          city_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string;
          specialty?: string | null;
          license_number?: string | null;
          consultation_duration?: number;
          department_id?: number | null;
          city_id?: number | null;
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
      offices: {
        Row: {
          id: string;
          doctor_id: string;
          tenant_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          tenant_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          tenant_id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offices_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      doctor_schedules: {
        Row: {
          id: string;
          doctor_id: string;
          office_id: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          office_id?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          office_id?: string | null;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
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
          {
            foreignKeyName: "doctor_schedules_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string;
          birth_date: string | null;
          phone: string | null;
          blood_type: string | null;
          allergies: string[] | null;
          emergency_contact: string | null;
          department_id: number | null;
          city_id: number | null;
          address: string | null;
          neighborhood: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          birth_date?: string | null;
          phone?: string | null;
          blood_type?: string | null;
          allergies?: string[] | null;
          emergency_contact?: string | null;
          department_id?: number | null;
          city_id?: number | null;
          address?: string | null;
          neighborhood?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          birth_date?: string | null;
          phone?: string | null;
          blood_type?: string | null;
          allergies?: string[] | null;
          emergency_contact?: string | null;
          department_id?: number | null;
          city_id?: number | null;
          address?: string | null;
          neighborhood?: string | null;
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
      patient_doctors: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_doctors_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_doctors_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      secretary_doctors: {
        Row: {
          id: string;
          secretary_id: string;
          doctor_id: string;
          tenant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          secretary_id: string;
          doctor_id: string;
          tenant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          secretary_id?: string;
          doctor_id?: string;
          tenant_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      appointment_slots: {
        Row: {
          id: string;
          doctor_id: string;
          office_id: string;
          tenant_id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          status: "available" | "booked" | "blocked";
          appointment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          office_id: string;
          tenant_id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          status?: "available" | "booked" | "blocked";
          appointment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          office_id?: string;
          tenant_id?: string;
          slot_date?: string;
          start_time?: string;
          end_time?: string;
          status?: "available" | "booked" | "blocked";
          appointment_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_slots_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_slots_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_slots_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
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
          office_id: string | null;
          slot_id: string | null;
          status: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";
          scheduled_at: string | null;
          starts_at: string | null;
          ends_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          doctor_id: string;
          patient_id: string;
          office_id?: string | null;
          slot_id?: string | null;
          status?: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";
          scheduled_at?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          doctor_id?: string;
          patient_id?: string;
          office_id?: string | null;
          slot_id?: string | null;
          status?: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";
          scheduled_at?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
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
          {
            foreignKeyName: "appointments_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "appointment_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      prescriptions: {
        Row: {
          id: string;
          tenant_id: string;
          appointment_id: string | null;
          doctor_id: string;
          patient_id: string;
          diagnosis: string | null;
          instructions: string;
          medications: Json;
          pdf_url: string | null;
          status: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          appointment_id?: string | null;
          doctor_id: string;
          patient_id: string;
          diagnosis?: string | null;
          instructions: string;
          medications?: Json;
          pdf_url?: string | null;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          appointment_id?: string | null;
          doctor_id?: string;
          patient_id?: string;
          diagnosis?: string | null;
          instructions?: string;
          medications?: Json;
          pdf_url?: string | null;
          status?: string;
          expires_at?: string | null;
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
      invitations: {
        Row: {
          id: string;
          token: string;
          doctor_id: string;
          invited_email: string;
          status: "pending" | "accepted" | "expired";
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          doctor_id: string;
          invited_email: string;
          status?: "pending" | "accepted" | "expired";
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          doctor_id?: string;
          invited_email?: string;
          status?: "pending" | "accepted" | "expired";
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          doctor_id: string;
          requested_date: string;
          notes: string | null;
          status: "waiting" | "scheduled" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          doctor_id: string;
          requested_date: string;
          notes?: string | null;
          status?: "waiting" | "scheduled" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          patient_id?: string;
          doctor_id?: string;
          requested_date?: string;
          notes?: string | null;
          status?: "waiting" | "scheduled" | "cancelled";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
