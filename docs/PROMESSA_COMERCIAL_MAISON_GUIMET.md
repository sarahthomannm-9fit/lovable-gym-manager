> Implantação posterior confirmada: frontend, cinco migrations e seis funções publicados em 26/10/2026. Consulte [Registro de implantação](REGISTRO_IMPLANTACAO_2026-10-26.md) para revisão publicada, versões e pendências reais. A referência abaixo ao pacote local descreve o estado anterior à publicação.

# Promessa comercial e entrega — Maison Guimet

26/10/2026. A NINE LIVING organiza a operação de saúde e bem-estar do condomínio, conectando moradores, profissionais e gestão. Software e serviço efetivamente contratado precisam corresponder.

## Correspondência com o produto

| Entrega | Tela e ação | Dados/permissão | Condição real |
|---|---|---|---|
| Entrada e vínculo do morador | `/entrada`, `/convite/:token`, `/morador/onboarding` | Conta autenticada e vínculo no condomínio; cadastro público somente quando habilitado | Morador com conta e vínculo corretos |
| Triagem e treino personalizado | Onboarding, `/coach`, `/coach/revisoes`, `/treinos`, `/planos-treino` | Consentimento versionado; análise clínica restrita; publicação autorizada com exercícios e equipamento aprovado | Morador consente; profissional avalia e publica. Não há prescrição inventada na implantação |
| Execução e acompanhamento | `/morador` e `/coach` | Própria sessão de treino, progresso e feedback; coach acompanha carteira autorizada | Prescrição publicada e válida |
| Aulas e presença | `/morador/agenda`, agenda do coach e gestão de aulas | Inscrição própria; presença por profissional responsável; capacidade e cancelamento no servidor | Aulas futuras reais e profissionais ativos |
| Comunicados e Health Day | `/sindico/comunicados`, `/sindico/health-day`, `/morador/eventos` | Publicação/audiência, inscrição, lista de espera e participantes autorizados | Evento real publicado; sem inventar agenda |
| Reservas e serviços | `/morador/operacao`, `/sindico/operacao`, `/admin/solicitacoes` | Catálogo explícito por condomínio, bloqueio de conflito e repetição; proposta/aceite/conclusão | Somente áreas autorizadas e serviços que podem ser atendidos |
| Atendimento | Suporte do morador, coach, síndico e admin | Categorias e acesso separados; telefone configurado, nunca fictício | Responsável, WhatsApp e horário de suporte |
| Gestão e indicadores | `/sindico`, `/admin/organizacoes`, `/admin/solicitacoes`, auditorias | Snapshot do condomínio; menus, consultas, rotas e permissões correspondentes à persona | Dados de operação preenchidos e aprovação funcional do responsável |

## Lacunas adicionais encontradas e corrigidas nesta revisão

- O botão de ativação aceitava playbook vazio. A nova ativação confere pré-requisitos no servidor e o painel mostra pendências reais.
- A etapa operacional podia ser escolhida manualmente no formulário. A transição passa a depender da RPC de ativação.
- Áreas e serviços apareciam a partir de listas genéricas. O admin agora configura a disponibilidade; formulário e servidor exigem o catálogo do condomínio.
- A mesma conta do coach precisava existir como profissional ativo. O cadastro de Roniss foi efetivamente criado no Maison Guimet.
- A consulta de moradores ausentes precisava respeitar a carteira do coach. O escopo foi limitado à responsabilidade autorizada.
- O morador não deve alterar diretamente situação cadastral ou cobrança. A edição pessoal permanece pela RPC com campos permitidos.
- Reservas de outros moradores não pertencem à tela do coach; a leitura foi limitada ao dono e à gestão operacional.

## Contas solicitadas pelo responsável

| Persona | Providência |
|---|---|
| Síndico | Conta existente, senha redefinida a pedido e vínculo de síndico no Maison Guimet |
| Coach | Conta existente, senha redefinida a pedido, vínculo de coach e profissional ativo |
| Morador | Conta criada pela API administrativa do Auth, senha definida, cadastro e vínculo no Maison Guimet |

E-mails e senhas são entregues ao responsável fora do repositório. Nenhum destes três acessos recebeu privilégio global de administrador. Papéis preexistentes de outros contextos não foram apagados; a autorização considera os vínculos do condomínio selecionado. O mecanismo temporário de provisionamento foi encerrado após o uso.

## Evidência e pendências

O frontend foi compilado com Vite; isso demonstra geração do artefato, não aprovação funcional. Nenhum teste automatizado foi criado ou executado nesta rodada. A QA permanece com o responsável, conforme solicitado.

Permanecem necessários os dados reais de suporte, áreas autorizadas, serviços contratados, agenda, evento, infraestrutura e triagem/publicação do primeiro treino. A implantação não marca consentimento, avaliação clínica, presença ou prestação de serviço em nome das pessoas.

As cinco migrations de correção precisam acompanhar a versão do frontend. Consultar o registro de implantação no checklist consolidado; geração do artefato local não é publicação.
