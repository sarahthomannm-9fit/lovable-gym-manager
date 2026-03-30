import { useMemo } from 'react';

// === State Classifications ===

export type AlunoEstado = 
  | 'ativo_regular' | 'ativo_sem_freq' | 'ativo_sem_freq_risco'
  | 'inadimplente_1' | 'inadimplente_2' | 'inadimplente_3' | 'inadimplente_critico'
  | 'trial_ativo' | 'trial_expirando' | 'cancelado' | 'pausado';

export type PagamentoEstado = 
  | 'em_dia' | 'vence_3d' | 'vence_hoje' | 'vencido_1' | 'vencido_3' 
  | 'vencido_7' | 'vencido_15' | 'vencido_30';

export type AulaEstado = 
  | 'agendada_ok' | 'agendada_sem_inst' | 'agendada_lotada' | 'agendada_vazia'
  | 'em_andamento' | 'concluida' | 'cancelada';

export type LeadEstado = 
  | 'captado' | 'agendado' | 'experimental_feito' | 'proposta_enviada'
  | 'convertido' | 'perdido_quente' | 'perdido_frio' | 'arquivado';

export interface ClassifiedAluno {
  id: string;
  nome: string;
  estado: AlunoEstado;
  diasSemCheckin: number;
  diasAtraso: number;
  valorAtraso: number;
}

export interface ClassifiedPagamento {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  valor: number;
  estado: PagamentoEstado;
  diasAtraso: number;
  etapaRegua: number; // 0-5
}

export interface ClassifiedAula {
  id: string;
  nome: string;
  estado: AulaEstado;
  ocupacaoPct: number;
  horario: string;
  data: string;
}

export interface ClassifiedLead {
  id: string;
  nome: string;
  estado: LeadEstado;
  temperatura: 'quente' | 'morno' | 'frio';
  diasSemContato: number;
}

export interface EngineState {
  alunos: ClassifiedAluno[];
  pagamentos: ClassifiedPagamento[];
  aulas: ClassifiedAula[];
  leads: ClassifiedLead[];
  // Summary counts
  criticos: number;
  atencao: number;
  oportunidades: number;
}

interface EngineInput {
  alunos: any[];
  pagamentos: any[];
  checkins: any[];
  aulas: any[];
  leads: any[];
  experimentais: any[];
}

export function useBusinessEngine(data: EngineInput): EngineState {
  return useMemo(() => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const hojeMs = hoje.getTime();
    const MS_DIA = 86400000;

    // === ALUNOS ===
    const checkinPorAluno = new Map<string, string>();
    (data.checkins || []).forEach((c: any) => {
      const dt = c.data_checkin || c.horario_entrada?.split('T')[0];
      if (!dt) return;
      const prev = checkinPorAluno.get(c.aluno_id);
      if (!prev || dt > prev) checkinPorAluno.set(c.aluno_id, dt);
    });

    const atrasosPorAluno = new Map<string, { dias: number; valor: number }>();
    (data.pagamentos || []).forEach((p: any) => {
      if (p.status === 'pago' || !p.data_vencimento) return;
      const dias = Math.ceil((hojeMs - new Date(p.data_vencimento).getTime()) / MS_DIA);
      if (dias <= 0) return;
      const prev = atrasosPorAluno.get(p.aluno_id) || { dias: 0, valor: 0 };
      atrasosPorAluno.set(p.aluno_id, {
        dias: Math.max(prev.dias, dias),
        valor: prev.valor + (p.valor || 0),
      });
    });

    const classifiedAlunos: ClassifiedAluno[] = (data.alunos || []).map((a: any) => {
      const lastCheckin = checkinPorAluno.get(a.id);
      const diasSemCheckin = lastCheckin ? Math.ceil((hojeMs - new Date(lastCheckin).getTime()) / MS_DIA) : 999;
      const atraso = atrasosPorAluno.get(a.id) || { dias: 0, valor: 0 };

      let estado: AlunoEstado = 'ativo_regular';
      if (a.status === 'cancelado' || a.lifecycle_status === 'ex_aluno') {
        estado = 'cancelado';
      } else if (a.lifecycle_status === 'experimental') {
        estado = diasSemCheckin <= 3 ? 'trial_ativo' : 'trial_expirando';
      } else if (atraso.dias > 30) {
        estado = 'inadimplente_critico';
      } else if (atraso.dias > 15) {
        estado = 'inadimplente_3';
      } else if (atraso.dias > 7) {
        estado = 'inadimplente_2';
      } else if (atraso.dias > 0) {
        estado = 'inadimplente_1';
      } else if (diasSemCheckin > 14) {
        estado = 'ativo_sem_freq_risco';
      } else if (diasSemCheckin > 7) {
        estado = 'ativo_sem_freq';
      }

      return { id: a.id, nome: a.nome, estado, diasSemCheckin, diasAtraso: atraso.dias, valorAtraso: atraso.valor };
    });

    // === PAGAMENTOS ===
    const classifiedPagamentos: ClassifiedPagamento[] = (data.pagamentos || [])
      .filter((p: any) => p.status !== 'pago')
      .map((p: any) => {
        const venc = new Date(p.data_vencimento);
        const diff = Math.ceil((hojeMs - venc.getTime()) / MS_DIA);
        const aluno = (data.alunos || []).find((a: any) => a.id === p.aluno_id);

        let estado: PagamentoEstado = 'em_dia';
        let etapaRegua = 0;
        if (diff > 30) { estado = 'vencido_30'; etapaRegua = 5; }
        else if (diff > 15) { estado = 'vencido_15'; etapaRegua = 4; }
        else if (diff > 7) { estado = 'vencido_7'; etapaRegua = 3; }
        else if (diff > 3) { estado = 'vencido_3'; etapaRegua = 2; }
        else if (diff > 0) { estado = 'vencido_1'; etapaRegua = 1; }
        else if (diff === 0) { estado = 'vence_hoje'; }
        else if (diff >= -3) { estado = 'vence_3d'; }

        return {
          id: p.id,
          aluno_id: p.aluno_id,
          aluno_nome: aluno?.nome || 'Desconhecido',
          valor: p.valor || 0,
          estado,
          diasAtraso: Math.max(0, diff),
          etapaRegua,
        };
      });

    // === AULAS ===
    const amanha = new Date(hojeMs + MS_DIA).toISOString().split('T')[0];
    const classifiedAulas: ClassifiedAula[] = (data.aulas || [])
      .filter((a: any) => a.data_aula >= hojeStr)
      .map((a: any) => {
        const cap = a.capacidade_maxima || 20;
        const ins = a.inscritos_atual || 0;
        const ocupPct = cap > 0 ? (ins / cap) * 100 : 0;

        let estado: AulaEstado = 'agendada_ok';
        if (a.status === 'cancelada') estado = 'cancelada';
        else if (a.status === 'concluida') estado = 'concluida';
        else if (!a.professor_id) estado = 'agendada_sem_inst';
        else if (ocupPct >= 100) estado = 'agendada_lotada';
        else if (ocupPct < 30 && ins > 0) estado = 'agendada_vazia';
        else if (ocupPct < 30 && ins === 0) estado = 'agendada_vazia';

        return {
          id: a.id,
          nome: a.nome,
          estado,
          ocupacaoPct: ocupPct,
          horario: a.horario_inicio,
          data: a.data_aula,
        };
      });

    // === LEADS ===
    const experimentaisMap = new Map<string, string>();
    (data.experimentais || []).forEach((e: any) => {
      if (e.email) experimentaisMap.set(e.email.toLowerCase(), e.status);
      if (e.telefone) experimentaisMap.set(e.telefone, e.status);
    });

    const classifiedLeads: ClassifiedLead[] = (data.leads || []).map((l: any) => {
      const createdAt = new Date(l.created_at);
      const diasSemContato = Math.ceil((hojeMs - createdAt.getTime()) / MS_DIA);

      let estado: LeadEstado = 'captado';
      if (l.status === 'convertido') estado = 'convertido';
      else if (l.status === 'perdido') estado = diasSemContato < 30 ? 'perdido_quente' : 'perdido_frio';
      else if (l.status === 'agendado') estado = 'agendado';
      else if (l.status === 'proposta') estado = 'proposta_enviada';

      let temperatura: 'quente' | 'morno' | 'frio' = 'frio';
      if (diasSemContato <= 3) temperatura = 'quente';
      else if (diasSemContato <= 14) temperatura = 'morno';

      return { id: l.id, nome: l.nome, estado, temperatura, diasSemContato };
    });

    // === SUMMARY ===
    const criticos = classifiedAlunos.filter(a => 
      ['inadimplente_2', 'inadimplente_3', 'inadimplente_critico'].includes(a.estado)
    ).length + classifiedAulas.filter(a => a.estado === 'agendada_sem_inst').length;

    const atencao = classifiedAlunos.filter(a => 
      ['ativo_sem_freq_risco', 'inadimplente_1', 'trial_expirando'].includes(a.estado)
    ).length;

    const oportunidades = classifiedLeads.filter(l => l.temperatura === 'quente' && l.estado !== 'convertido').length;

    return { alunos: classifiedAlunos, pagamentos: classifiedPagamentos, aulas: classifiedAulas, leads: classifiedLeads, criticos, atencao, oportunidades };
  }, [data]);
}
