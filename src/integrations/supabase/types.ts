export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          created_by: string | null
          dentist_id: string | null
          google_calendar_event_id: string | null
          id: string
          notes: string | null
          office_id: string
          patient_id: string
          procedure_type_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          created_by?: string | null
          dentist_id?: string | null
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          office_id: string
          patient_id: string
          procedure_type_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          created_by?: string | null
          dentist_id?: string | null
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          office_id?: string
          patient_id?: string
          procedure_type_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_type_id_fkey"
            columns: ["procedure_type_id"]
            isOneToOne: false
            referencedRelation: "procedure_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_records: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          clinical_history: string | null
          created_at: string
          dentist_id: string | null
          diagnosis: string | null
          id: string
          observations: string | null
          patient_id: string
          tenant_id: string
          treatment: string | null
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinical_history?: string | null
          created_at?: string
          dentist_id?: string | null
          diagnosis?: string | null
          id?: string
          observations?: string | null
          patient_id: string
          tenant_id: string
          treatment?: string | null
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinical_history?: string | null
          created_at?: string
          dentist_id?: string | null
          diagnosis?: string | null
          id?: string
          observations?: string | null
          patient_id?: string
          tenant_id?: string
          treatment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_records: {
        Row: {
          created_at: string
          dentist_id: string | null
          diagnosis: string
          id: string
          notes: string | null
          patient_id: string
          tenant_id: string
          tooth_number: number
        }
        Insert: {
          created_at?: string
          dentist_id?: string | null
          diagnosis: string
          id?: string
          notes?: string | null
          patient_id: string
          tenant_id: string
          tooth_number: number
        }
        Update: {
          created_at?: string
          dentist_id?: string | null
          diagnosis?: string
          id?: string
          notes?: string | null
          patient_id?: string
          tenant_id?: string
          tooth_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dental_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          active: boolean
          city: string | null
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          state: string | null
          street: string | null
          tenant_id: string
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          tenant_id: string
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          tenant_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          patient_id: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          patient_id: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          patient_id?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          dentist_id: string | null
          id: string
          lgpd_consent: boolean | null
          lgpd_consent_date: string | null
          lgpd_consent_ip: string | null
          name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          lgpd_consent?: boolean | null
          lgpd_consent_date?: string | null
          lgpd_consent_ip?: string | null
          name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          lgpd_consent?: boolean | null
          lgpd_consent_date?: string | null
          lgpd_consent_ip?: string | null
          name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_types: {
        Row: {
          active: boolean
          color: string
          duration: number
          id: string
          name: string
          price: number
          tenant_id: string
        }
        Insert: {
          active?: boolean
          color?: string
          duration?: number
          id?: string
          name: string
          price?: number
          tenant_id: string
        }
        Update: {
          active?: boolean
          color?: string
          duration?: number
          id?: string
          name?: string
          price?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dentist" | "super_admin"
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "waiting"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "confirmed"
        | "no_show"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dentist", "super_admin"],
      appointment_status: [
        "scheduled",
        "checked_in",
        "waiting",
        "in_progress",
        "completed",
        "cancelled",
        "confirmed",
        "no_show",
      ],
    },
  },
} as const
