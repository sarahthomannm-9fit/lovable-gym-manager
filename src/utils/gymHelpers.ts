import { supabase } from "@/integrations/supabase/client";

// Função para atualizar dados do aluno em outras tabelas
export async function updateAlunoEReferencias(alunoId: string, dadosAtualizados: any) {
  try {
    const { data, error } = await supabase
      .from('alunos')
      .update(dadosAtualizados)
      .eq('id', alunoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar aluno:', error);
    throw error;
  }
}

// Classificação de treinos
export function classificarTreino(data_fim: string) {
  const hoje = new Date();
  const fim = new Date(data_fim);
  const diffDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'atrasado';
  if (diffDias <= 10) return 'vencendo';
  return 'em dia';
}

// Função para calcular dias restantes de um plano
export function calcularDiasRestantes(dataFim: string): number {
  const hoje = new Date();
  const fim = new Date(dataFim);
  return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Função para formatar valores em reais
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Função para formatar datas
export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}