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
      tenants: {
        Row: {
          id: string
          nome: string
          slug: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          tenant_id: string | null
          nome: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id?: string | null
          nome: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string | null
          nome?: string
          email?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          tenant_id: string | null
          modulo: string
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id?: string | null
          modulo: string
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string | null
          modulo?: string
          enabled?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          telefone: string | null
          cpf: string | null
          email: string | null
          data_nascimento: string | null
          historico_clinico: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          telefone?: string | null
          cpf?: string | null
          email?: string | null
          data_nascimento?: string | null
          historico_clinico?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          telefone?: string | null
          cpf?: string | null
          email?: string | null
          data_nascimento?: string | null
          historico_clinico?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string
          data: string
          horario: string
          procedimento: string
          status: string
          cadeira: number | null
          dentista_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id: string
          data: string
          horario: string
          procedimento: string
          status?: string
          cadeira?: number | null
          dentista_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string
          data?: string
          horario?: string
          procedimento?: string
          status?: string
          cadeira?: number | null
          dentista_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string
          agendamento_id: string | null
          profissional_id: string | null
          data_atendimento: string
          queixa_principal: string
          historico_br: string | null
          observacoes_clinicas: string | null
          conduta: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id: string
          agendamento_id?: string | null
          profissional_id?: string | null
          data_atendimento?: string
          queixa_principal: string
          historico_br?: string | null
          observacoes_clinicas?: string | null
          conduta?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string
          agendamento_id?: string | null
          profissional_id?: string | null
          data_atendimento?: string
          queixa_principal?: string
          historico_br?: string | null
          observacoes_clinicas?: string | null
          conduta?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          id: string
          tenant_id: string
          tipo: string
          valor: number
          descricao: string
          data: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tipo: string
          valor: number
          descricao: string
          data?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          tipo?: string
          valor?: number
          descricao?: string
          data?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          id: string
          tenant_id: string
          item: string
          quantidade: number
          nivel_alerta: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          item: string
          quantidade?: number
          nivel_alerta?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          item?: string
          quantidade?: number
          nivel_alerta?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          id: string
          tenant_id: string
          usuario_id: string | null
          tipo: string
          valor: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          usuario_id?: string | null
          tipo: string
          valor?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          usuario_id?: string | null
          tipo?: string
          valor?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          id: string
          tenant_id: string
          usuario_id: string | null
          tipo: string
          titulo: string
          mensagem: string
          lida: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          usuario_id?: string | null
          tipo: string
          titulo: string
          mensagem: string
          lida?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          usuario_id?: string | null
          tipo?: string
          titulo?: string
          mensagem?: string
          lida?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_logs: {
        Row: {
          id: string
          tenant_id: string
          usuario_id: string | null
          acao: string
          entidade: string
          entidade_id: string | null
          detalhes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          usuario_id?: string | null
          acao: string
          entidade: string
          entidade_id?: string | null
          detalhes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          usuario_id?: string | null
          acao?: string
          entidade?: string
          entidade_id?: string | null
          detalhes?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string | null
          table_name: string
          operation: string
          old_data: Json | null
          new_data: Json | null
          user_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          table_name: string
          operation: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          table_name?: string
          operation?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_resumo_dia: {
        Row: {
          data: string
          total_agendados: number
          total_concluidos: number
          total_cancelados: number
          total_em_atendimento: number
        }
      }
    }
    Functions: {
      get_user_tenant_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      verificar_conflito_horario: {
        Args: {
          p_data: string
          p_horario: string
          p_dentista_id: string
          p_exclude_id?: string
        }
        Returns: boolean
      }
      verificar_disponibilidade_cadeira: {
        Args: {
          _data: string
          _horario: string
          _cadeira: number
          _exclude_id?: string
        }
        Returns: boolean
      }
      buscar_paciente_por_cpf: {
        Args: { _cpf: string }
        Returns: {
          id: string
          nome: string
          telefone: string | null
          email: string | null
          cpf: string | null
        }[]
      }
      buscar_agendamentos_do_dia: {
        Args: { _data: string }
        Returns: {
          id: string
          paciente_nome: string
          horario: string
          procedimento: string
          status: string
          cadeira: number | null
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "dentista"
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
      app_role: ["admin", "dentista"],
    },
  },
} as const
