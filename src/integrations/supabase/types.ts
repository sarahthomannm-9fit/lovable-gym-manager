export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          input: Json | null
          latency_ms: number | null
          output: Json | null
          status: string
          triggered_by: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          input?: Json | null
          latency_ms?: number | null
          output?: Json | null
          status?: string
          triggered_by?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          input?: Json | null
          latency_ms?: number | null
          output?: Json | null
          status?: string
          triggered_by?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_reports: {
        Row: {
          agent_id: string
          created_at: string
          highlights: Json | null
          id: string
          metrics: Json | null
          report_date: string
          summary: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          highlights?: Json | null
          id?: string
          metrics?: Json | null
          report_date?: string
          summary: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          highlights?: Json | null
          id?: string
          metrics?: Json | null
          report_date?: string
          summary?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          aulas_disponiveis: number | null
          aulas_por_mes: number | null
          categoria_aluno: string | null
          contato_emergencia: string | null
          created_at: string | null
          data_matricula: string | null
          data_nascimento: string | null
          dia_pagamento: number | null
          dias_aula: string[] | null
          email: string
          endereco: string | null
          forma_pagamento: string | null
          id: string
          lead_id: string | null
          lifecycle_status: Database["public"]["Enums"]["pessoa_status"]
          nome: string
          observacoes_medicas: string | null
          organization_id: string | null
          plano_id: string | null
          status: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
          valor_mensalidade: number | null
        }
        Insert: {
          aulas_disponiveis?: number | null
          aulas_por_mes?: number | null
          categoria_aluno?: string | null
          contato_emergencia?: string | null
          created_at?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          dia_pagamento?: number | null
          dias_aula?: string[] | null
          email: string
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          lifecycle_status?: Database["public"]["Enums"]["pessoa_status"]
          nome: string
          observacoes_medicas?: string | null
          organization_id?: string | null
          plano_id?: string | null
          status?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_mensalidade?: number | null
        }
        Update: {
          aulas_disponiveis?: number | null
          aulas_por_mes?: number | null
          categoria_aluno?: string | null
          contato_emergencia?: string | null
          created_at?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          dia_pagamento?: number | null
          dias_aula?: string[] | null
          email?: string
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          lifecycle_status?: Database["public"]["Enums"]["pessoa_status"]
          nome?: string
          observacoes_medicas?: string | null
          organization_id?: string | null
          plano_id?: string | null
          status?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_mensalidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
      analises_produto: {
        Row: {
          analise_mercado: Json | null
          campanhas_sugeridas: Json | null
          created_at: string
          estrategias_recomendadas: Json | null
          id: string
          metricas_projetadas: Json | null
          produto_id: string | null
          score_viabilidade: number | null
        }
        Insert: {
          analise_mercado?: Json | null
          campanhas_sugeridas?: Json | null
          created_at?: string
          estrategias_recomendadas?: Json | null
          id?: string
          metricas_projetadas?: Json | null
          produto_id?: string | null
          score_viabilidade?: number | null
        }
        Update: {
          analise_mercado?: Json | null
          campanhas_sugeridas?: Json | null
          created_at?: string
          estrategias_recomendadas?: Json | null
          id?: string
          metricas_projetadas?: Json | null
          produto_id?: string | null
          score_viabilidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analises_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_respostas: {
        Row: {
          aluno_id: string
          created_at: string | null
          id: string
          preenchido_em: string | null
          respostas: Json | null
          status: string | null
          tipo: string
          token: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          id?: string
          preenchido_em?: string | null
          respostas?: Json | null
          status?: string | null
          tipo?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          id?: string
          preenchido_em?: string | null
          respostas?: Json | null
          status?: string | null
          tipo?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_respostas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          data_proxima_cobranca: string | null
          id: string
          metodo_pagamento: string | null
          plano_id: string | null
          status: string | null
          store_order_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          valor_recorrente: number | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_proxima_cobranca?: string | null
          id?: string
          metodo_pagamento?: string | null
          plano_id?: string | null
          status?: string | null
          store_order_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          valor_recorrente?: number | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_proxima_cobranca?: string | null
          id?: string
          metodo_pagamento?: string | null
          plano_id?: string | null
          status?: string | null
          store_order_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          valor_recorrente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_store_order_id_fkey"
            columns: ["store_order_id"]
            isOneToOne: true
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          capacidade_maxima: number | null
          categoria: string | null
          created_at: string | null
          data_aula: string
          descricao: string | null
          dia_semana: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          inscritos_atual: number | null
          modalidade: string | null
          nome: string
          organization_id: string | null
          plano_id: string | null
          professor_id: string | null
          recorrencia: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidade_maxima?: number | null
          categoria?: string | null
          created_at?: string | null
          data_aula: string
          descricao?: string | null
          dia_semana?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          inscritos_atual?: number | null
          modalidade?: string | null
          nome: string
          organization_id?: string | null
          plano_id?: string | null
          professor_id?: string | null
          recorrencia?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidade_maxima?: number | null
          categoria?: string | null
          created_at?: string | null
          data_aula?: string
          descricao?: string | null
          dia_semana?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          inscritos_atual?: number | null
          modalidade?: string | null
          nome?: string
          organization_id?: string | null
          plano_id?: string | null
          professor_id?: string | null
          recorrencia?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_experimentais: {
        Row: {
          aluno_convertido_id: string | null
          atendido_por: string | null
          aula_id: string | null
          avaliacao_experiencia: number | null
          created_at: string | null
          data_agendada: string
          data_conversao: string | null
          email: string | null
          feedback: string | null
          fonte: string | null
          horario_agendado: string | null
          id: string
          motivo_nao_conversao: string | null
          nome: string
          notas: string | null
          organization_id: string | null
          plano_convertido_id: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_convertido_id?: string | null
          atendido_por?: string | null
          aula_id?: string | null
          avaliacao_experiencia?: number | null
          created_at?: string | null
          data_agendada: string
          data_conversao?: string | null
          email?: string | null
          feedback?: string | null
          fonte?: string | null
          horario_agendado?: string | null
          id?: string
          motivo_nao_conversao?: string | null
          nome: string
          notas?: string | null
          organization_id?: string | null
          plano_convertido_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_convertido_id?: string | null
          atendido_por?: string | null
          aula_id?: string | null
          avaliacao_experiencia?: number | null
          created_at?: string | null
          data_agendada?: string
          data_conversao?: string | null
          email?: string | null
          feedback?: string | null
          fonte?: string | null
          horario_agendado?: string | null
          id?: string
          motivo_nao_conversao?: string | null
          nome?: string
          notas?: string | null
          organization_id?: string | null
          plano_convertido_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_experimentais_aluno_convertido_id_fkey"
            columns: ["aluno_convertido_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_experimentais_atendido_por_fkey"
            columns: ["atendido_por"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_experimentais_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_experimentais_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_experimentais_plano_convertido_id_fkey"
            columns: ["plano_convertido_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_inscritos: {
        Row: {
          aluno_id: string | null
          aula_id: string | null
          created_at: string | null
          data_inscricao: string | null
          id: string
          posicao_lista_espera: number | null
          status: string | null
        }
        Insert: {
          aluno_id?: string | null
          aula_id?: string | null
          created_at?: string | null
          data_inscricao?: string | null
          id?: string
          posicao_lista_espera?: number | null
          status?: string | null
        }
        Update: {
          aluno_id?: string | null
          aula_id?: string | null
          created_at?: string | null
          data_inscricao?: string | null
          id?: string
          posicao_lista_espera?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_inscritos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_inscritos_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_fisicas: {
        Row: {
          agua_corporal: number | null
          altura: number | null
          aluno_id: string | null
          avaliador_id: string | null
          circunferencia_braco_direito: number | null
          circunferencia_braco_esquerdo: number | null
          circunferencia_cintura: number | null
          circunferencia_coxa_direita: number | null
          circunferencia_coxa_esquerda: number | null
          circunferencia_panturrilha_direita: number | null
          circunferencia_panturrilha_esquerda: number | null
          circunferencia_peitoral: number | null
          circunferencia_pescoco: number | null
          circunferencia_quadril: number | null
          created_at: string | null
          data_avaliacao: string
          data_entrega: string | null
          data_programa: string | null
          dobra_abdominal: number | null
          dobra_biceps: number | null
          dobra_coxa: number | null
          dobra_panturrilha: number | null
          dobra_subescapular: number | null
          dobra_suprailiaca: number | null
          dobra_triceps: number | null
          id: string
          imc: number | null
          massa_muscular: number | null
          massa_ossea: number | null
          metas: Json | null
          observacoes: string | null
          percentual_gordura: number | null
          peso: number | null
          proxima_avaliacao: string | null
          registered_by: string | null
          teste_flexibilidade: Json | null
          teste_forca: Json | null
          teste_resistencia: Json | null
          updated_at: string | null
        }
        Insert: {
          agua_corporal?: number | null
          altura?: number | null
          aluno_id?: string | null
          avaliador_id?: string | null
          circunferencia_braco_direito?: number | null
          circunferencia_braco_esquerdo?: number | null
          circunferencia_cintura?: number | null
          circunferencia_coxa_direita?: number | null
          circunferencia_coxa_esquerda?: number | null
          circunferencia_panturrilha_direita?: number | null
          circunferencia_panturrilha_esquerda?: number | null
          circunferencia_peitoral?: number | null
          circunferencia_pescoco?: number | null
          circunferencia_quadril?: number | null
          created_at?: string | null
          data_avaliacao?: string
          data_entrega?: string | null
          data_programa?: string | null
          dobra_abdominal?: number | null
          dobra_biceps?: number | null
          dobra_coxa?: number | null
          dobra_panturrilha?: number | null
          dobra_subescapular?: number | null
          dobra_suprailiaca?: number | null
          dobra_triceps?: number | null
          id?: string
          imc?: number | null
          massa_muscular?: number | null
          massa_ossea?: number | null
          metas?: Json | null
          observacoes?: string | null
          percentual_gordura?: number | null
          peso?: number | null
          proxima_avaliacao?: string | null
          registered_by?: string | null
          teste_flexibilidade?: Json | null
          teste_forca?: Json | null
          teste_resistencia?: Json | null
          updated_at?: string | null
        }
        Update: {
          agua_corporal?: number | null
          altura?: number | null
          aluno_id?: string | null
          avaliador_id?: string | null
          circunferencia_braco_direito?: number | null
          circunferencia_braco_esquerdo?: number | null
          circunferencia_cintura?: number | null
          circunferencia_coxa_direita?: number | null
          circunferencia_coxa_esquerda?: number | null
          circunferencia_panturrilha_direita?: number | null
          circunferencia_panturrilha_esquerda?: number | null
          circunferencia_peitoral?: number | null
          circunferencia_pescoco?: number | null
          circunferencia_quadril?: number | null
          created_at?: string | null
          data_avaliacao?: string
          data_entrega?: string | null
          data_programa?: string | null
          dobra_abdominal?: number | null
          dobra_biceps?: number | null
          dobra_coxa?: number | null
          dobra_panturrilha?: number | null
          dobra_subescapular?: number | null
          dobra_suprailiaca?: number | null
          dobra_triceps?: number | null
          id?: string
          imc?: number | null
          massa_muscular?: number | null
          massa_ossea?: number | null
          metas?: Json | null
          observacoes?: string | null
          percentual_gordura?: number | null
          peso?: number | null
          proxima_avaliacao?: string | null
          registered_by?: string | null
          teste_flexibilidade?: Json | null
          teste_forca?: Json | null
          teste_resistencia?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_fisicas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fisicas_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_charges: {
        Row: {
          aluno_id: string
          created_at: string
          created_by: string
          descricao: string | null
          id: string
          organization_id: string
          pagamento_id: string
          sent_at: string | null
          status: string
          titulo: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          created_by: string
          descricao?: string | null
          id?: string
          organization_id: string
          pagamento_id: string
          sent_at?: string | null
          status?: string
          titulo: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          created_by?: string
          descricao?: string | null
          id?: string
          organization_id?: string
          pagamento_id?: string
          sent_at?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_charges_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_charges_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: true
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          amount: number | null
          campaign_id: string
          event_type: string
          external_id: string | null
          id: string
          occurred_at: string
          organization_id: string
          payload: Json
          recorded_by: string
        }
        Insert: {
          amount?: number | null
          campaign_id: string
          event_type: string
          external_id?: string | null
          id?: string
          occurred_at?: string
          organization_id: string
          payload?: Json
          recorded_by: string
        }
        Update: {
          amount?: number | null
          campaign_id?: string
          event_type?: string
          external_id?: string | null
          id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_marketing: {
        Row: {
          alcance: number | null
          approved_at: string | null
          approved_by: string | null
          canal: string | null
          categoria: string
          conversoes: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          external_delivery_id: string | null
          id: string
          orcamento: number | null
          organization_id: string | null
          scheduled_for: string | null
          segmento: Json | null
          spent_amount: number
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          alcance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          canal?: string | null
          categoria: string
          conversoes?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          external_delivery_id?: string | null
          id?: string
          orcamento?: number | null
          organization_id?: string | null
          scheduled_for?: string | null
          segmento?: Json | null
          spent_amount?: number
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          alcance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          canal?: string | null
          categoria?: string
          conversoes?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          external_delivery_id?: string | null
          id?: string
          orcamento?: number | null
          organization_id?: string | null
          scheduled_for?: string | null
          segmento?: Json | null
          spent_amount?: number
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_marketing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      config_notificacoes: {
        Row: {
          ativo: boolean | null
          canais: string[] | null
          created_at: string | null
          dias_antecedencia: number | null
          hora_envio: string | null
          id: string
          template_mensagem: string | null
          template_titulo: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          canais?: string[] | null
          created_at?: string | null
          dias_antecedencia?: number | null
          hora_envio?: string | null
          id?: string
          template_mensagem?: string | null
          template_titulo?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          canais?: string[] | null
          created_at?: string | null
          dias_antecedencia?: number | null
          hora_envio?: string | null
          id?: string
          template_mensagem?: string | null
          template_titulo?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_drafts: {
        Row: {
          approved_at: string | null
          body: string | null
          created_at: string
          id: string
          scheduled_at: string | null
          status: string
          topic: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          scheduled_at?: string | null
          status?: string
          topic?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          scheduled_at?: string | null
          status?: string
          topic?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversion_actions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          campaign_id: string | null
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json
          occurred_at: string
          organization_id: string
          recorded_by: string
          student_id: string | null
          value_amount: number | null
        }
        Insert: {
          campaign_id?: string | null
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id: string
          recorded_by: string
          student_id?: string | null
          value_amount?: number | null
        }
        Update: {
          campaign_id?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          recorded_by?: string
          student_id?: string | null
          value_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          aluno_id: string
          coupon_id: string
          discount_amount: number
          final_amount: number
          id: string
          organization_id: string
          original_amount: number
          payment_id: string
          redeemed_at: string
          redeemed_by: string
        }
        Insert: {
          aluno_id: string
          coupon_id: string
          discount_amount: number
          final_amount: number
          id?: string
          organization_id: string
          original_amount: number
          payment_id: string
          redeemed_at?: string
          redeemed_by: string
        }
        Update: {
          aluno_id?: string
          coupon_id?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          organization_id?: string
          original_amount?: number
          payment_id?: string
          redeemed_at?: string
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string
          discount_type: string
          discount_value: number
          ends_on: string
          id: string
          name: string
          organization_id: string
          starts_on: string
          status: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          discount_type: string
          discount_value: number
          ends_on: string
          id?: string
          name: string
          organization_id: string
          starts_on?: string
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          discount_type?: string
          discount_value?: number
          ends_on?: string
          id?: string
          name?: string
          organization_id?: string
          starts_on?: string
          status?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          aluno_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          sku_id: string
          status: Database["public"]["Enums"]["entitlement_status"]
          store_order_id: string | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          sku_id: string
          status?: Database["public"]["Enums"]["entitlement_status"]
          store_order_id?: string | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          sku_id?: string
          status?: Database["public"]["Enums"]["entitlement_status"]
          store_order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_store_order_id_fkey"
            columns: ["store_order_id"]
            isOneToOne: true
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          created_at: string | null
          custo: number | null
          data_aquisicao: string | null
          id: string
          localizacao: string | null
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          organization_id: string | null
          proxima_manutencao: string | null
          status: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          data_aquisicao?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          organization_id?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          data_aquisicao?: string | null
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          organization_id?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance_events: {
        Row: {
          action: string
          actor_id: string
          detail: string
          equipment_id: string
          id: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_id: string
          detail: string
          equipment_id: string
          id?: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          detail?: string
          equipment_id?: string
          id?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_events_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_condominio: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          data_evento: string
          descricao: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local: string | null
          nome: string
          organization_id: string
          status: string
          updated_at: string
          vagas_totais: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          data_evento: string
          descricao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          nome: string
          organization_id: string
          status?: string
          updated_at?: string
          vagas_totais?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          data_evento?: string
          descricao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local?: string | null
          nome?: string
          organization_id?: string
          status?: string
          updated_at?: string
          vagas_totais?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_condominio_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicios_biblioteca: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          dificuldade: string | null
          equipamento: string | null
          grupo_muscular: string | null
          id: string
          imagem_url: string | null
          instrucoes: string | null
          nome: string
          organization_id: string | null
          restricoes_incompativeis: string[]
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          dificuldade?: string | null
          equipamento?: string | null
          grupo_muscular?: string | null
          id?: string
          imagem_url?: string | null
          instrucoes?: string | null
          nome: string
          organization_id?: string | null
          restricoes_incompativeis?: string[]
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          dificuldade?: string | null
          equipamento?: string | null
          grupo_muscular?: string | null
          id?: string
          imagem_url?: string | null
          instrucoes?: string | null
          nome?: string
          organization_id?: string | null
          restricoes_incompativeis?: string[]
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercicios_biblioteca_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercicios_biblioteca_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_substitution_rules: {
        Row: {
          ativo: boolean
          created_at: string
          exercise_id: string
          id: string
          motivo: string
          prioridade: number
          substitute_exercise_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          motivo: string
          prioridade?: number
          substitute_exercise_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          motivo?: string
          prioridade?: number
          substitute_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_substitution_rules_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercicios_biblioteca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitution_rules_substitute_exercise_id_fkey"
            columns: ["substitute_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercicios_biblioteca"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_ledger: {
        Row: {
          approved_by: string | null
          categoria: string
          comprovante_url: string | null
          created_at: string
          created_by: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor: string | null
          id: string
          organization_id: string
          paid_by: string | null
          recorrente: boolean
          status: string
          subcategoria: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          approved_by?: string | null
          categoria: string
          comprovante_url?: string | null
          created_at?: string
          created_by: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          fornecedor?: string | null
          id?: string
          organization_id: string
          paid_by?: string | null
          recorrente?: boolean
          status?: string
          subcategoria?: string | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          approved_by?: string | null
          categoria?: string
          comprovante_url?: string | null
          created_at?: string
          created_by?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          organization_id?: string
          paid_by?: string | null
          recorrente?: boolean
          status?: string
          subcategoria?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fitmanager_connections: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          created_at: string
          id: string
          last_sync_at: string | null
          professor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          professor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          professor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fitmanager_events: {
        Row: {
          connection_id: string | null
          created_at: string
          event_type: string
          fitpro_professor_id: string | null
          fitpro_student_id: string | null
          id: string
          payload: Json
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          event_type: string
          fitpro_professor_id?: string | null
          fitpro_student_id?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          event_type?: string
          fitpro_professor_id?: string | null
          fitpro_student_id?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fitmanager_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "fitmanager_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          created_at: string
          created_by: string | null
          data_proxima_acao: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          proposal_id: string | null
          proxima_acao: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_proxima_acao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proposal_id?: string | null
          proxima_acao?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_proxima_acao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proposal_id?: string | null
          proxima_acao?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
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
      frequencia_alunos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data: string
          duracao_minutos: number | null
          horario_entrada: string
          horario_saida: string | null
          id: string
          tipo_entrada: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data?: string
          duracao_minutos?: number | null
          horario_entrada?: string
          horario_saida?: string | null
          id?: string
          tipo_entrada?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data?: string
          duracao_minutos?: number | null
          horario_entrada?: string
          horario_saida?: string | null
          id?: string
          tipo_entrada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string
          comissao_percentual: number | null
          created_at: string | null
          data_contratacao: string | null
          email: string | null
          especialidades: string[] | null
          horarios: Json | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          salario: number | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo: string
          comissao_percentual?: number | null
          created_at?: string | null
          data_contratacao?: string | null
          email?: string | null
          especialidades?: string[] | null
          horarios?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string
          comissao_percentual?: number | null
          created_at?: string | null
          data_contratacao?: string | null
          email?: string | null
          especialidades?: string[] | null
          horarios?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_day_inscricoes: {
        Row: {
          aluno_id: string
          checkin_at: string | null
          created_at: string
          evento_id: string
          id: string
          status: string
        }
        Insert: {
          aluno_id: string
          checkin_at?: string | null
          created_at?: string
          evento_id: string
          id?: string
          status?: string
        }
        Update: {
          aluno_id?: string
          checkin_at?: string | null
          created_at?: string
          evento_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_day_inscricoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_day_inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_condominio"
            referencedColumns: ["id"]
          },
        ]
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
      lead_follow_ups: {
        Row: {
          created_by: string
          id: string
          lead_id: string
          next_at: string | null
          note: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          created_by: string
          id?: string
          lead_id: string
          next_at?: string | null
          note: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          created_by?: string
          id?: string
          lead_id?: string
          next_at?: string | null
          note?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          consent_marketing: boolean
          consented_at: string | null
          created_at: string
          data_evento: string | null
          email: string | null
          empresa: string | null
          fonte: string | null
          id: string
          next_follow_up_at: string | null
          nome: string
          nome_contato: string | null
          observacoes: string | null
          orcamento_estimado: number | null
          organization_id: string | null
          score: number | null
          source_detail: string | null
          status: string
          telefone: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          consent_marketing?: boolean
          consented_at?: string | null
          created_at?: string
          data_evento?: string | null
          email?: string | null
          empresa?: string | null
          fonte?: string | null
          id?: string
          next_follow_up_at?: string | null
          nome: string
          nome_contato?: string | null
          observacoes?: string | null
          orcamento_estimado?: number | null
          organization_id?: string | null
          score?: number | null
          source_detail?: string | null
          status?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          consent_marketing?: boolean
          consented_at?: string | null
          created_at?: string
          data_evento?: string | null
          email?: string | null
          empresa?: string | null
          fonte?: string | null
          id?: string
          next_follow_up_at?: string | null
          nome?: string
          nome_contato?: string | null
          observacoes?: string | null
          orcamento_estimado?: number | null
          organization_id?: string | null
          score?: number | null
          source_detail?: string | null
          status?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automation_runs: {
        Row: {
          automation_id: string
          created_at: string
          dedupe_key: string
          error_detail: string | null
          finished_at: string | null
          id: string
          organization_id: string
          payload: Json
          scheduled_for: string
          started_at: string | null
          status: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          dedupe_key: string
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          organization_id: string
          payload?: Json
          scheduled_for?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          dedupe_key?: string
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          organization_id?: string
          payload?: Json
          scheduled_for?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "marketing_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automations: {
        Row: {
          actions: Json
          approval_required: boolean
          category: string
          conditions: Json
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          approval_required?: boolean
          category: string
          conditions?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          status?: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          approval_required?: boolean
          category?: string
          conditions?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_message_events: {
        Row: {
          event_type: string
          id: string
          message_id: string
          occurred_at: string
          organization_id: string
          payload: Json
          provider_event_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          message_id: string
          occurred_at?: string
          organization_id: string
          payload?: Json
          provider_event_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          message_id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
          provider_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "mensagens_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_message_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_segments: {
        Row: {
          created_at: string
          created_by: string
          criteria: Json
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          criteria?: Json
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          criteria?: Json
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_subscribers: {
        Row: {
          consented_at: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          organization_id: string
          source: string | null
          subscribed: boolean
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          consented_at?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          organization_id: string
          source?: string | null
          subscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          consented_at?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          organization_id?: string
          source?: string | null
          subscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_subscribers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_marketing: {
        Row: {
          aluno_id: string | null
          campaign_id: string | null
          canal: string
          corpo: string | null
          created_at: string
          created_by: string | null
          destinatarios: number | null
          entregues: number | null
          enviadas: number | null
          enviado_em: string | null
          error_detail: string | null
          id: string
          lidas: number | null
          organization_id: string | null
          provider_message_id: string | null
          scheduled_for: string | null
          status: string
          titulo: string | null
        }
        Insert: {
          aluno_id?: string | null
          campaign_id?: string | null
          canal: string
          corpo?: string | null
          created_at?: string
          created_by?: string | null
          destinatarios?: number | null
          entregues?: number | null
          enviadas?: number | null
          enviado_em?: string | null
          error_detail?: string | null
          id?: string
          lidas?: number | null
          organization_id?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          status?: string
          titulo?: string | null
        }
        Update: {
          aluno_id?: string | null
          campaign_id?: string | null
          canal?: string
          corpo?: string | null
          created_at?: string
          created_by?: string | null
          destinatarios?: number | null
          entregues?: number | null
          enviadas?: number | null
          enviado_em?: string | null
          error_detail?: string | null
          id?: string
          lidas?: number | null
          organization_id?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          status?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_marketing_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_marketing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          canal: string[] | null
          created_at: string | null
          dados_extras: Json | null
          data_agendada: string | null
          data_envio: string | null
          data_leitura: string | null
          destinatario_id: string | null
          destinatario_tipo: string
          enviado_email: boolean | null
          enviado_push: boolean | null
          enviado_whatsapp: boolean | null
          id: string
          mensagem: string
          prioridade: string | null
          status: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          canal?: string[] | null
          created_at?: string | null
          dados_extras?: Json | null
          data_agendada?: string | null
          data_envio?: string | null
          data_leitura?: string | null
          destinatario_id?: string | null
          destinatario_tipo: string
          enviado_email?: boolean | null
          enviado_push?: boolean | null
          enviado_whatsapp?: boolean | null
          id?: string
          mensagem: string
          prioridade?: string | null
          status?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          canal?: string[] | null
          created_at?: string | null
          dados_extras?: Json | null
          data_agendada?: string | null
          data_envio?: string | null
          data_leitura?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string
          enviado_email?: boolean | null
          enviado_push?: boolean | null
          enviado_whatsapp?: boolean | null
          id?: string
          mensagem?: string
          prioridade?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      onboarding_requests: {
        Row: {
          created_at: string
          organization_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_calendar_entries: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          kind: string
          notes: string | null
          organization_id: string
          owner: string
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind: string
          notes?: string | null
          organization_id: string
          owner?: string
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          organization_id?: string
          owner?: string
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_calendar_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_delivery_case_events: {
        Row: {
          action: string
          actor_id: string
          case_id: string
          created_at: string
          detail: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          case_id: string
          created_at?: string
          detail?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          case_id?: string
          created_at?: string
          detail?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_delivery_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "operational_delivery_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_delivery_cases: {
        Row: {
          completed_by: string | null
          created_at: string
          created_by: string
          description: string | null
          due_on: string | null
          evidence_url: string | null
          id: string
          module_key: string
          organization_id: string
          outcome: string | null
          owner_id: string | null
          source_id: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_on?: string | null
          evidence_url?: string | null
          id?: string
          module_key: string
          organization_id: string
          outcome?: string | null
          owner_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_on?: string | null
          evidence_url?: string | null
          id?: string
          module_key?: string
          organization_id?: string
          outcome?: string | null
          owner_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_delivery_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_activation_alert_actions: {
        Row: {
          acted_by: string | null
          action_label: string
          alert_type: string
          created_at: string
          id: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          acted_by?: string | null
          action_label: string
          alert_type: string
          created_at?: string
          id?: string
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          acted_by?: string | null
          action_label?: string
          alert_type?: string
          created_at?: string
          id?: string
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_activation_alert_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_announcements: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          mensagem: string
          organization_id: string
          publicado_em: string | null
          publicado_por: string | null
          publico: string
          status: string
          titulo: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          mensagem: string
          organization_id: string
          publicado_em?: string | null
          publicado_por?: string | null
          publico?: string
          status?: string
          titulo: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          mensagem?: string
          organization_id?: string
          publicado_em?: string | null
          publicado_por?: string | null
          publico?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos_condominio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_commercial_plans: {
        Row: {
          created_at: string
          created_by: string
          ends_on: string | null
          id: string
          notes: string | null
          organization_id: string
          seats: number
          sku: string
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_on?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          seats?: number
          sku?: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_on?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          seats?: number
          sku?: string
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_commercial_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_facilities: {
        Row: {
          ambiente: string
          analysis_status: string
          categoria: string | null
          created_at: string
          foto_path: string | null
          id: string
          image_analysis: Json
          nome: string
          organization_id: string
          quantidade: number
          status: string
          updated_at: string
        }
        Insert: {
          ambiente: string
          analysis_status?: string
          categoria?: string | null
          created_at?: string
          foto_path?: string | null
          id?: string
          image_analysis?: Json
          nome: string
          organization_id: string
          quantidade?: number
          status?: string
          updated_at?: string
        }
        Update: {
          ambiente?: string
          analysis_status?: string
          categoria?: string | null
          created_at?: string
          foto_path?: string | null
          id?: string
          image_analysis?: Json
          nome?: string
          organization_id?: string
          quantidade?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_implementation_steps: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_on: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          organization_id: string
          owner: string
          status: string
          step_key: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_on?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          owner?: string
          status?: string
          step_key: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_on?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          owner?: string
          status?: string
          step_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_implementation_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          papel: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          papel: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          papel?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_lifecycle_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          new_status: string
          organization_id: string
          previous_status: string
          reason: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          new_status: string
          organization_id: string
          previous_status: string
          reason: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          new_status?: string
          organization_id?: string
          previous_status?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_lifecycle_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          papel: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          papel: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          papel?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          capacidade_academia: number | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          horarios_academia: Json | null
          id: string
          metadata: Json
          nome: string
          onboarding_status: string
          operational_profile: Json
          restricoes_academia: string[] | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          capacidade_academia?: number | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          horarios_academia?: Json | null
          id?: string
          metadata?: Json
          nome: string
          onboarding_status?: string
          operational_profile?: Json
          restricoes_academia?: string[] | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          capacidade_academia?: number | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          horarios_academia?: Json | null
          id?: string
          metadata?: Json
          nome?: string
          onboarding_status?: string
          operational_profile?: Json
          restricoes_academia?: string[] | null
          status?: string
          tipo?: string
          updated_at?: string
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
      payment_settlement_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          organization_id: string
          pagamento_id: string
          previous_status: string
          reference: string
          resulting_status: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          organization_id: string
          pagamento_id: string
          previous_status: string
          reference: string
          resulting_status: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          pagamento_id?: string
          previous_status?: string
          reference?: string
          resulting_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_settlement_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_settlement_audit_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoa_eventos: {
        Row: {
          actor_id: string | null
          created_at: string
          dados: Json | null
          descricao: string | null
          id: string
          pessoa_id: string
          tipo_evento: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          dados?: Json | null
          descricao?: string | null
          id?: string
          pessoa_id: string
          tipo_evento: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          dados?: Json | null
          descricao?: string | null
          id?: string
          pessoa_id?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_eventos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_assessment_audit: {
        Row: {
          action: string
          actor_id: string | null
          aluno_id: string
          assessment_id: string
          created_at: string
          id: string
          organization_id: string
          snapshot: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          aluno_id: string
          assessment_id: string
          created_at?: string
          id?: string
          organization_id: string
          snapshot: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          aluno_id?: string
          assessment_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessment_audit_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessment_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_exercicios: {
        Row: {
          carga_kg: number | null
          created_at: string | null
          descanso_seg: number | null
          dia_semana: number | null
          exercicio_id: string
          id: string
          observacoes: string | null
          ordem: number | null
          plano_treino_id: string
          repeticoes: string | null
          semana: number | null
          series: number | null
        }
        Insert: {
          carga_kg?: number | null
          created_at?: string | null
          descanso_seg?: number | null
          dia_semana?: number | null
          exercicio_id: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_treino_id: string
          repeticoes?: string | null
          semana?: number | null
          series?: number | null
        }
        Update: {
          carga_kg?: number | null
          created_at?: string | null
          descanso_seg?: number | null
          dia_semana?: number | null
          exercicio_id?: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_treino_id?: string
          repeticoes?: string | null
          semana?: number | null
          series?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plano_exercicios_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios_biblioteca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_exercicios_plano_treino_id_fkey"
            columns: ["plano_treino_id"]
            isOneToOne: false
            referencedRelation: "planos_treino"
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
      planos_treino: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          dias_semana: number | null
          id: string
          nivel: string | null
          nome: string
          objetivo: string | null
          organization_id: string | null
          professor_id: string | null
          publico: boolean | null
          semanas: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          dias_semana?: number | null
          id?: string
          nivel?: string | null
          nome: string
          objetivo?: string | null
          organization_id?: string | null
          professor_id?: string | null
          publico?: boolean | null
          semanas?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          dias_semana?: number | null
          id?: string
          nivel?: string | null
          nome?: string
          objetivo?: string | null
          organization_id?: string | null
          professor_id?: string | null
          publico?: boolean | null
          semanas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_treino_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_treino_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          organization_id: string | null
          payload: Json
          student_id: string | null
          treino_id: string | null
          workout_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string | null
          payload?: Json
          student_id?: string | null
          treino_id?: string | null
          workout_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string | null
          payload?: Json
          student_id?: string | null
          treino_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_audit_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_audit_log_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_audit_log_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          canais_preferidos: Json | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          objetivos: Json | null
          orcamento_marketing: number | null
          preco: number | null
          status: string
          target_publico: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          canais_preferidos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          objetivos?: Json | null
          orcamento_marketing?: number | null
          preco?: number | null
          status?: string
          target_publico?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          canais_preferidos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          objetivos?: Json | null
          orcamento_marketing?: number | null
          preco?: number | null
          status?: string
          target_publico?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          ultimo_acesso_em: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          ultimo_acesso_em?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          ultimo_acesso_em?: string | null
          updated_at?: string | null
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
      proposals: {
        Row: {
          created_at: string
          created_by: string | null
          data_validade: string | null
          descricao: string | null
          id: string
          itens_inclusos: string | null
          lead_id: string | null
          status: string
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_validade?: string | null
          descricao?: string | null
          id?: string
          itens_inclusos?: string | null
          lead_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_validade?: string | null
          descricao?: string | null
          id?: string
          itens_inclusos?: string | null
          lead_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas_b2b: {
        Row: {
          contato: string | null
          created_at: string
          email: string | null
          empresa: string
          html: string | null
          id: string
          servicos: Json | null
          status: string
          telefone: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          contato?: string | null
          created_at?: string
          email?: string | null
          empresa: string
          html?: string | null
          id?: string
          servicos?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          contato?: string | null
          created_at?: string
          email?: string | null
          empresa?: string
          html?: string | null
          id?: string
          servicos?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      sku_permissions: {
        Row: {
          created_at: string
          id: string
          modulo: string
          nivel_acesso: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          nivel_acesso?: string
          sku_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          nivel_acesso?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_permissions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          ativo: boolean
          beneficios: Json | null
          capacidade: number | null
          created_at: string
          descricao: string | null
          entregas: Json | null
          id: string
          modulos_liberados: string[] | null
          nome: string
          plano_id: string | null
          preco: number
          recorrencia: Database["public"]["Enums"]["sku_recorrencia"]
          tipo: Database["public"]["Enums"]["sku_tipo"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          beneficios?: Json | null
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          entregas?: Json | null
          id?: string
          modulos_liberados?: string[] | null
          nome: string
          plano_id?: string | null
          preco?: number
          recorrencia?: Database["public"]["Enums"]["sku_recorrencia"]
          tipo?: Database["public"]["Enums"]["sku_tipo"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          beneficios?: Json | null
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          entregas?: Json | null
          id?: string
          modulos_liberados?: string[] | null
          nome?: string
          plano_id?: string | null
          preco?: number
          recorrencia?: Database["public"]["Enums"]["sku_recorrencia"]
          tipo?: Database["public"]["Enums"]["sku_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_bookings: {
        Row: {
          aluno_id: string
          cancel_synced: boolean
          created_at: string
          credit_refunded: boolean
          credits_charged: number
          freelancer_id: string
          hub: string | null
          id: string
          integration_status: Database["public"]["Enums"]["staff_booking_status"]
          method: string
          professional_name: string | null
          professional_photo_url: string | null
          slot: string | null
          staff_booking_id: string
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          cancel_synced?: boolean
          created_at?: string
          credit_refunded?: boolean
          credits_charged?: number
          freelancer_id: string
          hub?: string | null
          id?: string
          integration_status?: Database["public"]["Enums"]["staff_booking_status"]
          method: string
          professional_name?: string | null
          professional_photo_url?: string | null
          slot?: string | null
          staff_booking_id: string
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          cancel_synced?: boolean
          created_at?: string
          credit_refunded?: boolean
          credits_charged?: number
          freelancer_id?: string
          hub?: string | null
          id?: string
          integration_status?: Database["public"]["Enums"]["staff_booking_status"]
          method?: string
          professional_name?: string | null
          professional_photo_url?: string | null
          slot?: string | null
          staff_booking_id?: string
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_bookings_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          funcionario_id: string
          id: string
          organization_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          funcionario_id: string
          id?: string
          organization_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          funcionario_id?: string
          id?: string
          organization_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          aluno_id: string
          created_at: string
          created_by: string
          fulfilled_at: string | null
          fulfillment_reference: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payment_id: string | null
          quantity: number
          request_id: string
          sku_id: string
          status: string
          total: number
          unit_price: number
        }
        Insert: {
          aluno_id: string
          created_at?: string
          created_by: string
          fulfilled_at?: string | null
          fulfillment_reference?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          payment_id?: string | null
          quantity: number
          request_id: string
          sku_id: string
          status?: string
          total: number
          unit_price: number
        }
        Update: {
          aluno_id?: string
          created_at?: string
          created_by?: string
          fulfilled_at?: string | null
          fulfillment_reference?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_id?: string | null
          quantity?: number
          request_id?: string
          sku_id?: string
          status?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      student_safety_onboarding: {
        Row: {
          aluno_id: string
          cirurgias: string | null
          consentimento: boolean
          created_at: string
          dor_atual: boolean
          historico_lesoes: string | null
          id: string
          lesoes_atuais: string[]
          objetivo: string | null
          observacoes: string | null
          organization_id: string
          restricoes: string[]
          risco: string
          sinais_alerta: string[]
          updated_at: string
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          aluno_id: string
          cirurgias?: string | null
          consentimento?: boolean
          created_at?: string
          dor_atual?: boolean
          historico_lesoes?: string | null
          id?: string
          lesoes_atuais?: string[]
          objetivo?: string | null
          observacoes?: string | null
          organization_id: string
          restricoes?: string[]
          risco?: string
          sinais_alerta?: string[]
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          aluno_id?: string
          cirurgias?: string | null
          consentimento?: boolean
          created_at?: string
          dor_atual?: boolean
          historico_lesoes?: string | null
          id?: string
          lesoes_atuais?: string[]
          objetivo?: string | null
          observacoes?: string | null
          organization_id?: string
          restricoes?: string[]
          risco?: string
          sinais_alerta?: string[]
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_safety_onboarding_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: true
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_safety_onboarding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          agent_response: string | null
          aluno_id: string | null
          category: string | null
          created_at: string
          escalated_to_ceo: boolean | null
          id: string
          message: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_response?: string | null
          aluno_id?: string | null
          category?: string | null
          created_at?: string
          escalated_to_ceo?: boolean | null
          id?: string
          message: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_response?: string | null
          aluno_id?: string | null
          category?: string | null
          created_at?: string
          escalated_to_ceo?: boolean | null
          id?: string
          message?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      treino_execucoes: {
        Row: {
          aluno_id: string
          carga_real: Json | null
          concluido: boolean | null
          created_at: string | null
          data_execucao: string
          duracao_min: number | null
          humor: number | null
          id: string
          observacoes: string | null
          treino_id: string | null
        }
        Insert: {
          aluno_id: string
          carga_real?: Json | null
          concluido?: boolean | null
          created_at?: string | null
          data_execucao?: string
          duracao_min?: number | null
          humor?: number | null
          id?: string
          observacoes?: string | null
          treino_id?: string | null
        }
        Update: {
          aluno_id?: string
          carga_real?: Json | null
          concluido?: boolean | null
          created_at?: string | null
          data_execucao?: string
          duracao_min?: number | null
          humor?: number | null
          id?: string
          observacoes?: string | null
          treino_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_execucoes_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string | null
          organization_id: string | null
          plano_treino_id: string | null
          professor_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string | null
          organization_id?: string | null
          plano_treino_id?: string | null
          professor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string | null
          organization_id?: string | null
          plano_treino_id?: string | null
          professor_id?: string | null
          status?: string | null
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
          {
            foreignKeyName: "treinos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_plano_treino_id_fkey"
            columns: ["plano_treino_id"]
            isOneToOne: false
            referencedRelation: "planos_treino"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treinos_ia_fila: {
        Row: {
          aluno_id: string
          anamnese_id: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          id: string
          nivel: string | null
          objetivo: string | null
          organization_id: string | null
          plano_treino_id: string | null
          resumo: string | null
          status: Database["public"]["Enums"]["treino_ia_status"]
          sugestao: Json
          updated_at: string
        }
        Insert: {
          aluno_id: string
          anamnese_id?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          nivel?: string | null
          objetivo?: string | null
          organization_id?: string | null
          plano_treino_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["treino_ia_status"]
          sugestao?: Json
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          anamnese_id?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          nivel?: string | null
          objetivo?: string | null
          organization_id?: string | null
          plano_treino_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["treino_ia_status"]
          sugestao?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinos_ia_fila_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_ia_fila_anamnese_id_fkey"
            columns: ["anamnese_id"]
            isOneToOne: false
            referencedRelation: "anamnese_respostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_ia_fila_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_ia_fila_plano_treino_id_fkey"
            columns: ["plano_treino_id"]
            isOneToOne: false
            referencedRelation: "planos_treino"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_audit: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json
          organization_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      workout_protocol_templates: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          estrutura: Json
          id: string
          nivel: string
          nome: string
          objetivo: string
          organization_id: string | null
          sessoes_semana: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estrutura?: Json
          id?: string
          nivel?: string
          nome: string
          objetivo: string
          organization_id?: string | null
          sessoes_semana?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estrutura?: Json
          id?: string
          nivel?: string
          nome?: string
          objetivo?: string
          organization_id?: string | null
          sessoes_semana?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_protocol_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_publications: {
        Row: {
          created_at: string
          payload: Json
          request_id: string
          treino_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          payload: Json
          request_id: string
          treino_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          payload?: Json
          request_id?: string
          treino_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_publications_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          aluno_id: string
          completed_at: string | null
          data: string
          feedback: string | null
          id: string
          progress: Json
          started_at: string
          status: string
          treino_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          completed_at?: string | null
          data: string
          feedback?: string | null
          id?: string
          progress?: Json
          started_at?: string
          status?: string
          treino_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          completed_at?: string | null
          data?: string
          feedback?: string | null
          id?: string
          progress?: Json
          started_at?: string
          status?: string
          treino_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invite: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          papel: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_staff_invite: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          funcionario_id: string
          id: string
          organization_id: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "staff_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      analise_faturamento_avancada: {
        Args: never
        Returns: {
          estrategias_retencao: Json
          periodo: string
          receita_atual: number
          receita_projetada: number
          recomendacoes: Json
          risco_inadimplencia: string
          taxa_crescimento: number
          variabilidade: number
        }[]
      }
      apply_coupon_to_payment: {
        Args: { p_code: string; p_payment_id: string }
        Returns: {
          aluno_id: string
          coupon_id: string
          discount_amount: number
          final_amount: number
          id: string
          organization_id: string
          original_amount: number
          payment_id: string
          redeemed_at: string
          redeemed_by: string
        }
        SetofOptions: {
          from: "*"
          to: "coupon_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_facility: {
        Args: { p_facility_id: string; p_status: string }
        Returns: undefined
      }
      archive_organization_announcement: {
        Args: { p_id: string }
        Returns: {
          created_at: string
          event_id: string | null
          id: string
          mensagem: string
          organization_id: string
          publicado_em: string | null
          publicado_por: string | null
          publico: string
          status: string
          titulo: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bulk_import_residents: {
        Args: { p_organization_id: string; p_rows: Json }
        Returns: Json
      }
      calcular_mrr: {
        Args: { p_org_id: string }
        Returns: {
          alunos_ativos: number
          crescimento_pct: number
          mrr: number
          receita_mes_anterior: number
          receita_mes_atual: number
          ticket_medio: number
        }[]
      }
      cancel_health_day_registration: {
        Args: { p_aluno_id: string; p_event_id: string }
        Returns: {
          aluno_id: string
          checkin_at: string | null
          created_at: string
          evento_id: string
          id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "health_day_inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_organization_invite: {
        Args: { p_invite_id: string }
        Returns: undefined
      }
      capture_lead: {
        Args: {
          p_campaign_id?: string
          p_consent: boolean
          p_email: string
          p_fonte: string
          p_nome: string
          p_organization_id: string
          p_source_detail?: string
          p_telefone: string
        }
        Returns: {
          assigned_to: string | null
          campaign_id: string | null
          consent_marketing: boolean
          consented_at: string | null
          created_at: string
          data_evento: string | null
          email: string | null
          empresa: string | null
          fonte: string | null
          id: string
          next_follow_up_at: string | null
          nome: string
          nome_contato: string | null
          observacoes: string | null
          orcamento_estimado: number | null
          organization_id: string | null
          score: number | null
          source_detail: string | null
          status: string
          telefone: string | null
          tipo: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      checkin_health_day: {
        Args: { p_aluno_id: string; p_event_id: string }
        Returns: {
          aluno_id: string
          checkin_at: string | null
          created_at: string
          evento_id: string
          id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "health_day_inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      convert_experimental_class: {
        Args: {
          p_experimental_id: string
          p_organization_id: string
          p_plano_id: string
        }
        Returns: string
      }
      create_billing_charge: {
        Args: {
          p_aluno_id: string
          p_descricao: string
          p_due: string
          p_organization_id: string
          p_titulo: string
          p_valor: number
        }
        Returns: {
          aluno_id: string
          created_at: string
          created_by: string
          descricao: string | null
          id: string
          organization_id: string
          pagamento_id: string
          sent_at: string | null
          status: string
          titulo: string
        }
        SetofOptions: {
          from: "*"
          to: "billing_charges"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization_invite: {
        Args: { p_email: string; p_organization_id: string; p_papel: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          papel: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_staff_invite: {
        Args: { p_funcionario_id: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          funcionario_id: string
          id: string
          organization_id: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "staff_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      criar_notificacao: {
        Args: {
          p_canal?: string[]
          p_destinatario_id: string
          p_destinatario_tipo?: string
          p_mensagem: string
          p_prioridade?: string
          p_tipo: string
          p_titulo: string
        }
        Returns: string
      }
      dashboard_coach: { Args: { p_prof_id: string }; Returns: Json }
      dashboard_morador: { Args: { p_aluno_id: string }; Returns: Json }
      dashboard_sindico: { Args: { p_org_id: string }; Returns: Json }
      dashboard_trust: { Args: never; Returns: Json }
      eligible_exercises: {
        Args: { p_restrictions?: string[] }
        Returns: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          dificuldade: string | null
          equipamento: string | null
          grupo_muscular: string | null
          id: string
          imagem_url: string | null
          instrucoes: string | null
          nome: string
          organization_id: string | null
          restricoes_incompativeis: string[]
          updated_at: string | null
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "exercicios_biblioteca"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      exercise_substitutions: {
        Args: { p_exercise_id: string }
        Returns: {
          ativo: boolean
          created_at: string
          exercise_id: string
          id: string
          motivo: string
          prioridade: number
          substitute_exercise_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "exercise_substitution_rules"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fulfill_store_order: {
        Args: { p_order_id: string; p_reference: string }
        Returns: {
          aluno_id: string
          created_at: string
          created_by: string
          fulfilled_at: string | null
          fulfillment_reference: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payment_id: string | null
          quantity: number
          request_id: string
          sku_id: string
          status: string
          total: number
          unit_price: number
        }
        SetofOptions: {
          from: "*"
          to: "store_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_aluno_idade: { Args: { p_aluno_id: string }; Returns: number }
      get_alunos_sem_checkin: {
        Args: { p_dias?: number; p_org_id?: string }
        Returns: {
          aluno_id: string
          dias_ausente: number
          email: string
          nome: string
          plano_id: string
          telefone: string
          ultimo_checkin: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_comunicados: {
        Args: { p_org: string }
        Returns: {
          agendada_para: string
          comunicado_id: string
          criado_em: string
          enviados: number
          lidos: number
          mensagem: string
          publico: string
          tipo_label: string
          titulo: string
          urgente: boolean
        }[]
      }
      manage_health_day_registration: {
        Args: { p_registration_id: string; p_status: string }
        Returns: {
          aluno_id: string
          checkin_at: string | null
          created_at: string
          evento_id: string
          id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "health_day_inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      onboard_condominio: {
        Args: {
          p_capacidade: number
          p_cnpj: string
          p_equipamentos: string[]
          p_horarios: Json
          p_nome: string
          p_professores: string[]
          p_request_id: string
          p_restricoes: string[]
          p_sindico: string
          p_unidades: number
        }
        Returns: string
      }
      organization_activation_metrics: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      place_store_order: {
        Args: {
          p_aluno_id: string
          p_organization_id: string
          p_quantity: number
          p_request_id: string
          p_sku_id: string
        }
        Returns: {
          aluno_id: string
          created_at: string
          created_by: string
          fulfilled_at: string | null
          fulfillment_reference: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payment_id: string | null
          quantity: number
          request_id: string
          sku_id: string
          status: string
          total: number
          unit_price: number
        }
        SetofOptions: {
          from: "*"
          to: "store_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      projecao_cenarios: {
        Args: never
        Returns: {
          cenario: string
          investimento_necessario: number
          receita_projetada_12m: number
          receita_projetada_3m: number
          receita_projetada_6m: number
          roi_estimado: number
        }[]
      }
      publish_comunicado: {
        Args: {
          p_agendar?: string
          p_aula_id?: string
          p_mensagem: string
          p_org: string
          p_publico?: string
          p_tipo?: string
          p_titulo: string
          p_urgente?: boolean
        }
        Returns: number
      }
      publish_organization_announcement: {
        Args: { p_id: string }
        Returns: {
          created_at: string
          event_id: string | null
          id: string
          mensagem: string
          organization_id: string
          publicado_em: string | null
          publicado_por: string | null
          publico: string
          status: string
          titulo: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_workout: {
        Args: { p_payload: Json; p_request_id: string }
        Returns: string
      }
      queue_marketing_message: {
        Args: {
          p_body: string
          p_campaign_id?: string
          p_channel: string
          p_organization_id: string
          p_recipient_count: number
          p_scheduled_for?: string
          p_title: string
        }
        Returns: {
          aluno_id: string | null
          campaign_id: string | null
          canal: string
          corpo: string | null
          created_at: string
          created_by: string | null
          destinatarios: number | null
          entregues: number | null
          enviadas: number | null
          enviado_em: string | null
          error_detail: string | null
          id: string
          lidas: number | null
          organization_id: string | null
          provider_message_id: string | null
          scheduled_for: string | null
          status: string
          titulo: string | null
        }
        SetofOptions: {
          from: "*"
          to: "mensagens_marketing"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_activation_alert_action: {
        Args: {
          p_action_label: string
          p_alert_type: string
          p_organization_id: string
        }
        Returns: {
          acted_by: string | null
          action_label: string
          alert_type: string
          created_at: string
          id: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_activation_alert_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_daily_checkin: {
        Args: { p_aluno_id: string; p_date?: string }
        Returns: {
          aluno_id: string | null
          created_at: string | null
          data_checkin: string | null
          horario_entrada: string | null
          horario_saida: string | null
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_equipment_maintenance: {
        Args: { p_action: string; p_detail: string; p_equipment_id: string }
        Returns: {
          created_at: string | null
          custo: number | null
          data_aquisicao: string | null
          id: string
          localizacao: string | null
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          organization_id: string | null
          proxima_manutencao: string | null
          status: string
          tipo: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "equipamentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_manual_payment: {
        Args: { p_action: string; p_payment_id: string; p_reference: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "pagamentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_user_access: {
        Args: {
          p_event_type: string
          p_metadata?: Json
          p_organization_id?: string
        }
        Returns: undefined
      }
      register_health_day: {
        Args: { p_aluno_id: string; p_event_id: string }
        Returns: {
          aluno_id: string
          checkin_at: string | null
          created_at: string
          evento_id: string
          id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "health_day_inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      relatorio_evolucao_receitas: {
        Args: never
        Returns: {
          mes: string
          quantidade_pagamentos: number
          receita: number
          ticket_medio: number
        }[]
      }
      relatorio_faturamento_mensal: {
        Args: never
        Returns: {
          mes: string
          quantidade_pagamentos: number
          total_faturado: number
          total_pendente: number
          total_recebido: number
        }[]
      }
      relatorio_inadimplencia: {
        Args: never
        Returns: {
          aluno_id: string
          aluno_nome: string
          dias_atraso: number
          metodo_pagamento: string
          plano_nome: string
          telefone: string
          valor_em_atraso: number
        }[]
      }
      relatorio_metricas_gerais: {
        Args: never
        Returns: {
          crescimento_percentual: number
          formas_pagamento_distintas: number
          ticket_medio: number
          total_alunos_ativos: number
          total_receita_mes_anterior: number
          total_receita_mes_atual: number
        }[]
      }
      relatorio_receitas_por_plano: {
        Args: never
        Returns: {
          forma_pagamento: string
          nome_plano: string
          total_recebido: number
        }[]
      }
      resend_organization_invite: {
        Args: { p_invite_id: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          papel: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resident_announcements: {
        Args: { p_aluno_id: string }
        Returns: {
          created_at: string
          event_id: string | null
          id: string
          mensagem: string
          organization_id: string
          publicado_em: string | null
          publicado_por: string | null
          publico: string
          status: string
          titulo: string
        }[]
        SetofOptions: {
          from: "*"
          to: "organization_announcements"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      resolve_activation_alert_action: {
        Args: { p_action_id: string }
        Returns: {
          acted_by: string | null
          action_label: string
          alert_type: string
          created_at: string
          id: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_activation_alert_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_conversion_action: {
        Args: { p_action_id: string; p_status: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "conversion_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_student_safety: {
        Args: { p_decision: string; p_queue_id: string }
        Returns: boolean
      }
      save_facility_analysis: {
        Args: { p_analysis: Json; p_facility_id: string; p_status?: string }
        Returns: {
          ambiente: string
          analysis_status: string
          categoria: string | null
          created_at: string
          foto_path: string | null
          id: string
          image_analysis: Json
          nome: string
          organization_id: string
          quantidade: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_facilities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_workout_session: {
        Args: {
          p_action: string
          p_feedback?: string
          p_progress?: Json
          p_treino_id: string
        }
        Returns: Json
      }
      seed_organization_implementation: {
        Args: { p_organization_id: string }
        Returns: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_on: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          organization_id: string
          owner: string
          status: string
          step_key: string
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "organization_implementation_steps"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      send_billing_charge: {
        Args: { p_charge_id: string }
        Returns: {
          aluno_id: string
          created_at: string
          created_by: string
          descricao: string | null
          id: string
          organization_id: string
          pagamento_id: string
          sent_at: string | null
          status: string
          titulo: string
        }
        SetofOptions: {
          from: "*"
          to: "billing_charges"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_condominium_event_status: {
        Args: { p_event_id: string; p_status: string }
        Returns: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          data_evento: string
          descricao: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local: string | null
          nome: string
          organization_id: string
          status: string
          updated_at: string
          vagas_totais: number | null
        }
        SetofOptions: {
          from: "*"
          to: "eventos_condominio"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_corporate_employee_eligibility: {
        Args: { p_active: boolean; p_aluno_id: string; p_reason: string }
        Returns: {
          aulas_disponiveis: number | null
          aulas_por_mes: number | null
          categoria_aluno: string | null
          contato_emergencia: string | null
          created_at: string | null
          data_matricula: string | null
          data_nascimento: string | null
          dia_pagamento: number | null
          dias_aula: string[] | null
          email: string
          endereco: string | null
          forma_pagamento: string | null
          id: string
          lead_id: string | null
          lifecycle_status: Database["public"]["Enums"]["pessoa_status"]
          nome: string
          observacoes_medicas: string | null
          organization_id: string | null
          plano_id: string | null
          status: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
          valor_mensalidade: number | null
        }
        SetofOptions: {
          from: "*"
          to: "alunos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_marketing_automation_status: {
        Args: { p_id: string; p_status: string }
        Returns: {
          actions: Json
          approval_required: boolean
          category: string
          conditions: Json
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          trigger_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "marketing_automations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_professional_organization_status: {
        Args: { p_organization_id: string; p_reason: string; p_status: string }
        Returns: {
          capacidade_academia: number | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          horarios_academia: Json | null
          id: string
          metadata: Json
          nome: string
          onboarding_status: string
          operational_profile: Json
          restricoes_academia: string[] | null
          status: string
          tipo: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_staff_active: {
        Args: { p_active: boolean; p_funcionario_id: string; p_reason: string }
        Returns: {
          ativo: boolean | null
          cargo: string
          comissao_percentual: number | null
          created_at: string | null
          data_contratacao: string | null
          email: string | null
          especialidades: string[] | null
          horarios: Json | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          salario: number | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "funcionarios"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      student_is_safe_for_workout: {
        Args: { p_aluno_id: string }
        Returns: boolean
      }
      student_workout: { Args: never; Returns: Json }
      submit_student_safety_onboarding: {
        Args: { p_aluno_id: string; p_organization_id: string; p_payload: Json }
        Returns: {
          aluno_id: string
          cirurgias: string | null
          consentimento: boolean
          created_at: string
          dor_atual: boolean
          historico_lesoes: string | null
          id: string
          lesoes_atuais: string[]
          objetivo: string | null
          observacoes: string | null
          organization_id: string
          restricoes: string[]
          risco: string
          sinais_alerta: string[]
          updated_at: string
          validado_em: string | null
          validado_por: string | null
        }
        SetofOptions: {
          from: "*"
          to: "student_safety_onboarding"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_campaign: {
        Args: {
          p_campaign_id: string
          p_external_id?: string
          p_schedule?: string
          p_status: string
        }
        Returns: {
          alcance: number | null
          approved_at: string | null
          approved_by: string | null
          canal: string | null
          categoria: string
          conversoes: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          external_delivery_id: string | null
          id: string
          orcamento: number | null
          organization_id: string | null
          scheduled_for: string | null
          segmento: Json | null
          spent_amount: number
          status: string
          titulo: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "campanhas_marketing"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_client_status: {
        Args: { p_organization_id: string; p_reason: string; p_status: string }
        Returns: {
          capacidade_academia: number | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          horarios_academia: Json | null
          id: string
          metadata: Json
          nome: string
          onboarding_status: string
          operational_profile: Json
          restricoes_academia: string[] | null
          status: string
          tipo: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_expense: {
        Args: { p_action: string; p_id: string; p_proof_url?: string }
        Returns: {
          approved_by: string | null
          categoria: string
          comprovante_url: string | null
          created_at: string
          created_by: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor: string | null
          id: string
          organization_id: string
          paid_by: string | null
          recorrente: boolean
          status: string
          subcategoria: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        SetofOptions: {
          from: "*"
          to: "expense_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_operational_case: {
        Args: {
          p_case_id: string
          p_detail?: string
          p_evidence_url?: string
          p_status: string
        }
        Returns: {
          completed_by: string | null
          created_at: string
          created_by: string
          description: string | null
          due_on: string | null
          evidence_url: string | null
          id: string
          module_key: string
          organization_id: string
          outcome: string | null
          owner_id: string | null
          source_id: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "operational_delivery_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unsubscribe_marketing: {
        Args: { p_email: string; p_organization_id: string }
        Returns: undefined
      }
      update_org_metas: {
        Args: { p_metas: Json; p_org: string }
        Returns: Json
      }
      user_has_org: { Args: { _org: string; _user: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "user"
        | "sindico"
        | "professor"
        | "corporate"
        | "nutricionista"
        | "fisioterapeuta"
      entitlement_status: "ativo" | "suspenso" | "expirado"
      pessoa_status:
        | "lead"
        | "lead_aquecido"
        | "experimental"
        | "ativo"
        | "recorrente"
        | "inativo"
        | "ex_aluno"
      sku_recorrencia: "mensal" | "trimestral" | "semestral" | "anual" | "unico"
      sku_tipo:
        | "plano"
        | "consultoria"
        | "programa"
        | "produto_digital"
        | "produto_fisico"
        | "academy"
      staff_booking_status:
        | "pendente"
        | "confirmado"
        | "rejeitado"
        | "cancelado"
        | "concluido"
      treino_ia_status: "pendente" | "aprovado" | "rejeitado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "manager",
        "user",
        "sindico",
        "professor",
        "corporate",
        "nutricionista",
        "fisioterapeuta",
      ],
      entitlement_status: ["ativo", "suspenso", "expirado"],
      pessoa_status: [
        "lead",
        "lead_aquecido",
        "experimental",
        "ativo",
        "recorrente",
        "inativo",
        "ex_aluno",
      ],
      sku_recorrencia: ["mensal", "trimestral", "semestral", "anual", "unico"],
      sku_tipo: [
        "plano",
        "consultoria",
        "programa",
        "produto_digital",
        "produto_fisico",
        "academy",
      ],
      staff_booking_status: [
        "pendente",
        "confirmado",
        "rejeitado",
        "cancelado",
        "concluido",
      ],
      treino_ia_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
