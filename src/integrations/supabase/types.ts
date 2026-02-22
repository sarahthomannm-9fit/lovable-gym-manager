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
          plano_id?: string | null
          professor_id?: string | null
          recorrencia?: string | null
          status?: string | null
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
      dashboard_trust: { Args: never; Returns: Json }
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
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
