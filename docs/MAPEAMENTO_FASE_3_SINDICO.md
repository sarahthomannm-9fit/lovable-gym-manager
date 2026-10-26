# Fase 3 — Síndico

Atualizado em 26/10/2026 após implementação. Escopo: telas → ações → dados/permissões → lacunas → critérios de conclusão. A QA visual das quatro contas será realizada pelo usuário.

| Tela / rota | Ações implementadas | Dados e permissão |
|---|---|---|
| Acesso `/convite/:token` e `/select-context` | Aceitar convite, selecionar condomínio e trocar contexto. | Papel síndico vinculado ao condomínio; outro vínculo não autoriza a organização ativa. |
| Painel `/sindico` | Atualizar indicadores, definir metas, registrar/concluir ações e exportar acompanhamento. | Resumo operacional seguro: nomes/unidades/status e indicadores agregados; sem conceder acesso à anamnese. |
| Moradores e aulas, abas do painel | Consultar lista nominal/unidades/status, agenda, profissionais e ocupação. | Somente organização ativa; unidades e plantão vêm de configuração real. |
| Comunicados `/sindico/comunicados` | Criar/editar rascunho, associar evento, publicar e arquivar. | Destinatários do próprio condomínio/evento; publicado chega ao painel do morador. |
| Health Day `/sindico/health-day` | Criar/editar evento, definir local/horário/vagas, publicar, encerrar/cancelar e copiar link de inscrição. | Datas e capacidade validadas; não reduz vagas abaixo das inscrições confirmadas. |
| Participantes, painel Health Day | Ver inscritos/lista de espera/check-in, promover/cancelar inscrição e exportar CSV. | RPC retorna identificação estritamente dos participantes do evento autorizado. |
| Áreas e serviços `/sindico/operacao` | Consultar reservas, cancelar futuras e registrar utilização encerrada; cotar serviço e concluir execução. | Mesma organização; aceite do orçamento cabe ao morador. |
| Atendimento, painel/operação | Criar solicitação, consultar histórico, responder e resolver chamados autorizados. | Chamados associados por organization_id e identidade do solicitante. |

Lacunas operacionais: cadastrar total de unidades, plantão e telefone real de suporte; ativar os moradores reais. A lista não inventa moradores ou indicadores. O papel comitê não foi incluído como quinta persona.

Critério de conclusão da QA: síndico vê apenas Maison Guimet → metas persistem → comunicado chega ao morador → evento respeita vagas/fila → relatório identifica participantes → reserva/serviço e chamado refletem as ações das outras personas.

