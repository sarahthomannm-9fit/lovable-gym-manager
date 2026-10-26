> Implantação posterior confirmada: frontend, cinco migrations e seis funções publicados em 26/10/2026. Consulte [Registro de implantação](REGISTRO_IMPLANTACAO_2026-10-26.md) para revisão publicada, versões e pendências reais. A referência abaixo ao pacote local descreve o estado anterior à publicação.

> Atualização de 26/10/2026: consulte [Correções dos relatórios](CORRECOES_RELATORIOS_2026-10-26.md). As alterações posteriores são locais e não foram testadas nesta rodada por solicitação do responsável. Evidências anteriores não validam o código atual nem confirmam implantação.

# Matriz atual de telas, dados e acessos

Atualização: 26/10/2026. Esta versão substitui as lacunas do levantamento inicial. O código foi implementado e recebeu validação técnica; a homologação visual com as quatro contas continua pendente.

| Fase | Catálogo detalhado | Acesso | Dados |
|---|---|---|---|
| 1. Morador | [Telas, ações e critérios](MAPEAMENTO_FASE_1_MORADOR.md) | Conta autenticada e vínculo user no condomínio ativo. Entrada e catálogo mínimo são públicos; triagem pode iniciar o vínculo após confirmar e-mail. | Próprio cadastro, saúde, treino/sessão, inscrições, pagamentos, reservas e suporte. |
| 2. Coach | [Telas, ações e critérios](MAPEAMENTO_FASE_2_COACH.md) | Papel professor no condomínio e funcionário ativo vinculado para agenda. | Alunos autorizados, triagem, exercícios, treinos, presença e feedback. |
| 3. Síndico | [Telas, ações e critérios](MAPEAMENTO_FASE_3_SINDICO.md) | Papel sindico no condomínio ativo. | Cadastro operacional mínimo, indicadores agregados, eventos/participantes, comunicados, reservas, serviços e chamados. Sem acesso à anamnese pelo resumo. |
| 4. Admin | [Telas, ações e critérios](MAPEAMENTO_FASE_4_ADMIN.md) | Papel admin global; manager conserva apenas módulos de gestão previstos. | Organizações, contas/vínculos/convites, equipe, operação, auditorias e integrações. |

Regras implementadas:

- Papel de outro condomínio não autoriza a rota da organização ativa; múltiplos papéis na mesma organização são considerados.
- Admin pode abrir as superfícies das personas, mas não passa a ser automaticamente um aluno ou coach real. Use contas separadas na QA.
- Módulos gerais de gestão são limitados a admin/manager; coach pode usar treinos e planos.
- Campos de crédito, identidade e organização do morador não são editáveis pelo próprio morador.
- Reserva, inscrição, oferta de serviço, publicação/revisão de treino e crédito possuem validações no servidor.
- As operações de crédito Staff são exclusivas do servidor; falha confirmada e webhook tratam estorno uma única vez.
- Novo cadastro/convite verifica e-mail confirmado; metadados enviados pelo usuário não concedem privilégio.
- Síndico recebe resumo operacional e participantes do evento por funções restritas, sem liberar tabelas de saúde.

Consulte [roteiro de QA](QA_QUATRO_PERSONAS_MAISON_GUIMET.md) e [preparação comercial](LANCAMENTO_PRIMEIRO_CONDOMINIO.md).
