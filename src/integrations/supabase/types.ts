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
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_experimentais: {
        Row: {
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
          plano_convertido_id: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
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
          plano_convertido_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
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
          plano_convertido_id?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      entitlements: {
        Row: {
          aluno_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          sku_id: string
          status: Database["public"]["Enums"]["entitlement_status"]
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
        ]
      }
      equipamentos: {
        Row: {
          created_at: string | null
          custo: number | null
          data_aquisicao: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          data_aquisicao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          data_aquisicao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
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
          salario: number | null
          telefone: string | null
          updated_at: string | null
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
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
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
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
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
          data_evento: string | null
          email: string | null
          empresa: string | null
          fonte: string | null
          id: string
          nome: string
          nome_contato: string | null
          observacoes: string | null
          orcamento_estimado: number | null
          score: number | null
          status: string
          telefone: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_evento?: string | null
          email?: string | null
          empresa?: string | null
          fonte?: string | null
          id?: string
          nome: string
          nome_contato?: string | null
          observacoes?: string | null
          orcamento_estimado?: number | null
          score?: number | null
          status?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_evento?: string | null
          email?: string | null
          empresa?: string | null
          fonte?: string | null
          id?: string
          nome?: string
          nome_contato?: string | null
          observacoes?: string | null
          orcamento_estimado?: number | null
          score?: number | null
          status?: string
          telefone?: string | null
          tipo?: string | null
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
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          id: string
          metadata: Json
          nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          nome: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          nome?: string
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
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      app_role: [
        "admin",
        "manager",
        "user",
        "sindico",
        "professor",
        "corporate",
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
      treino_ia_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
