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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          aulas_disponiveis: number | null
          aulas_por_mes: number | null
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
          tipo: string | null
          updated_at: string | null
          valor_mensalidade: number | null
        }
        Insert: {
          aulas_disponiveis?: number | null
          aulas_por_mes?: number | null
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
          tipo?: string | null
          updated_at?: string | null
          valor_mensalidade?: number | null
        }
        Update: {
          aulas_disponiveis?: number | null
          aulas_por_mes?: number | null
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
          tipo?: string | null
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
      alunos_planos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          forma_pagamento_id: string | null
          id: string
          plano_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          forma_pagamento_id?: string | null
          id?: string
          plano_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          forma_pagamento_id?: string | null
          id?: string
          plano_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_planos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_planos_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_planos_plano_id_fkey"
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
          dia_semana: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          nome: string
          plano_id: string | null
          professor_id: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidade_maxima?: number | null
          created_at?: string | null
          data_aula: string
          descricao?: string | null
          dia_semana?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          nome: string
          plano_id?: string | null
          professor_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidade_maxima?: number | null
          created_at?: string | null
          data_aula?: string
          descricao?: string | null
          dia_semana?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          nome?: string
          plano_id?: string | null
          professor_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
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
      campanhas_marketing: {
        Row: {
          alcance: number | null
          canal: string | null
          categoria: string
          conversoes: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          orcamento: number | null
          segmento: Json | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          alcance?: number | null
          canal?: string | null
          categoria: string
          conversoes?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          orcamento?: number | null
          segmento?: Json | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          alcance?: number | null
          canal?: string | null
          categoria?: string
          conversoes?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          orcamento?: number | null
          segmento?: Json | null
          status?: string
          titulo?: string
          updated_at?: string
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
      formas_pagamento: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
        }
        Relationships: []
      }
      historico_planos: {
        Row: {
          aluno_id: string | null
          ativo: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          plano_id: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          ativo?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          ativo?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          plano_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_planos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          fonte: string | null
          id: string
          nome: string
          observacoes: string | null
          score: number | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          fonte?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          score?: number | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          fonte?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          score?: number | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mensagens_marketing: {
        Row: {
          aluno_id: string | null
          canal: string
          corpo: string | null
          created_at: string
          destinatarios: number | null
          entregues: number | null
          enviadas: number | null
          enviado_em: string | null
          id: string
          lidas: number | null
          status: string
          titulo: string | null
        }
        Insert: {
          aluno_id?: string | null
          canal: string
          corpo?: string | null
          created_at?: string
          destinatarios?: number | null
          entregues?: number | null
          enviadas?: number | null
          enviado_em?: string | null
          id?: string
          lidas?: number | null
          status?: string
          titulo?: string | null
        }
        Update: {
          aluno_id?: string | null
          canal?: string
          corpo?: string | null
          created_at?: string
          destinatarios?: number | null
          entregues?: number | null
          enviadas?: number | null
          enviado_em?: string | null
          id?: string
          lidas?: number | null
          status?: string
          titulo?: string | null
        }
        Relationships: []
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
          duracao_dias: number | null
          duracao_meses: number | null
          id: string
          nome: string
          preco: number
          quantidade_aulas: number | null
          tipo: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          beneficios?: string[] | null
          created_at?: string | null
          duracao_dias?: number | null
          duracao_meses?: number | null
          id?: string
          nome: string
          preco: number
          quantidade_aulas?: number | null
          tipo?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          beneficios?: string[] | null
          created_at?: string | null
          duracao_dias?: number | null
          duracao_meses?: number | null
          id?: string
          nome?: string
          preco?: number
          quantidade_aulas?: number | null
          tipo?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      promocoes: {
        Row: {
          created_at: string
          desconto: string
          descricao: string | null
          id: string
          limite: number | null
          nome: string
          status: string
          tipo: string | null
          updated_at: string
          usado: number | null
          valido_ate: string | null
        }
        Insert: {
          created_at?: string
          desconto: string
          descricao?: string | null
          id?: string
          limite?: number | null
          nome: string
          status?: string
          tipo?: string | null
          updated_at?: string
          usado?: number | null
          valido_ate?: string | null
        }
        Update: {
          created_at?: string
          desconto?: string
          descricao?: string | null
          id?: string
          limite?: number | null
          nome?: string
          status?: string
          tipo?: string | null
          updated_at?: string
          usado?: number | null
          valido_ate?: string | null
        }
        Relationships: []
      }
      treinos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
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
      relatorio_receitas_por_plano: {
        Args: Record<PropertyKey, never>
        Returns: {
          nome_plano: string
          forma_pagamento: string
          total_recebido: number
        }[]
      }
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
