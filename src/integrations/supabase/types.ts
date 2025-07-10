export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          contato_emergencia: string | null
          created_at: string | null
          data_matricula: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          forma_pagamento: string | null
          id: string
          nome: string
          observacoes_medicas: string | null
          plano_id: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          valor_mensalidade: number | null
        }
        Insert: {
          contato_emergencia?: string | null
          created_at?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome: string
          observacoes_medicas?: string | null
          plano_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_mensalidade?: number | null
        }
        Update: {
          contato_emergencia?: string | null
          created_at?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome?: string
          observacoes_medicas?: string | null
          plano_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_mensalidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          capacidade_maxima: number | null
          created_at: string | null
          data_aula: string
          descricao: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          nome: string
          professor_id: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidade_maxima?: number | null
          created_at?: string | null
          data_aula: string
          descricao?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          nome: string
          professor_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidade_maxima?: number | null
          created_at?: string | null
          data_aula?: string
          descricao?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          nome?: string
          professor_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      "cadastro.alunos": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      checkins: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_checkin: string | null
          horario_entrada: string | null
          horario_saida: string | null
          id: string
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_checkin?: string | null
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_checkin?: string | null
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          referencia_mes: string
          status: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          referencia_mes: string
          status?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          referencia_mes?: string
          status?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          beneficios: string[] | null
          created_at: string | null
          duracao_meses: number
          id: string
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          beneficios?: string[] | null
          created_at?: string | null
          duracao_meses: number
          id?: string
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          beneficios?: string[] | null
          created_at?: string | null
          duracao_meses?: number
          id?: string
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          senha_hash: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nome: string
          senha_hash: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          senha_hash?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
