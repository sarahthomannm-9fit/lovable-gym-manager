import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { decideTriage } from './triagem.ts';

const id = '11111111-1111-1111-1111-111111111111';
const configuredAdjustments = { [id]: { 1: { series: 2, descanso_seg: 75 } } };
const organization = '22222222-2222-2222-2222-222222222222';

for (const scenario of [
  { name: 'PAR-Q positivo', response: 'sim', objective: 'Força', expected: 'rejeitado', catalog: false },
  { name: 'sem protocolo compatível', response: 'nao', objective: 'Força avançada', expected: 'rejeitado', catalog: true },
  { name: 'protocolo compatível', response: 'nao', objective: 'Força iniciante', expected: 'pendente', catalog: true },
]) {
  Deno.test(scenario.name, async () => {
    let written: Record<string, unknown> | undefined;
    let catalogCalled = false;
    let writes = 0;
    const db = createClient('https://example.test', 'test', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (request, options) => {
          const path = new URL(String(request)).pathname;
          if (path.endsWith('/treinos_ia_fila')) {
            if (options?.method === 'POST') {
              writes++;
              written = JSON.parse(String(options.body));
              return new Response(null, { status: 201 });
            }
            return Response.json(written ? [{ id }] : []);
          }
          if (path.endsWith('/anamnese_respostas')) {
            return Response.json([{
              aluno_id: id,
              alunos: { organization_id: organization },
              respostas: {
                par_q: Array.from({ length: 7 }, () => ({ resposta: scenario.response })),
                objetivos: scenario.objective,
              },
            }]);
          }
          if (path.endsWith('/workout_protocol_templates')) {
            catalogCalled = true;
            return Response.json(scenario.expected === 'pendente'
              ? [
                { id: organization, nome: 'Modelo incompleto', sessoes_semana: 3, estrutura: {} },
                { id, nome: 'Base de força', sessoes_semana: 3, estrutura: {
                  ajustes: configuredAdjustments,
                  exercicios: [1, 3, 5].map(dia_semana => ({ exercicio_id: id, dia_semana })),
                } },
              ] : []);
          }
          throw new Error(`Unexpected request: ${path}`);
        },
      },
    });

    await decideTriage(db, id);
    await decideTriage(db, id);
    if (scenario.expected === 'pendente') {
      const suggestion = written?.sugestao as { ajustes?: unknown; protocol_template_id?: string } | undefined;
      if (suggestion?.protocol_template_id !== id || JSON.stringify(suggestion?.ajustes) !== JSON.stringify(configuredAdjustments)) {
        throw new Error('Ajustes do protocolo não foram preservados na sugestão');
      }
    }
    if (catalogCalled !== scenario.catalog || written?.status !== scenario.expected || writes !== 1) {
      throw new Error('Decisão, encaminhamento ou reenvio divergente');
    }
  });
}
