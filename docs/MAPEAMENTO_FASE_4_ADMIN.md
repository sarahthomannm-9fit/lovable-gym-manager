# Fase 4 — Admin

Atualizado em 26/10/2026 após implementação. Escopo: telas → ações → dados/permissões → lacunas → critérios de conclusão. A QA visual das quatro contas será realizada pelo usuário.

| Tela / rota | Ações implementadas | Dados e permissão |
|---|---|---|
| Painel `/painel` e operação `/operacao-9fit` | Consultar indicadores e abrir os módulos de gestão existentes. | Admin global; seleção de organização controla o contexto operacional. |
| Organizações `/admin/organizacoes` | Criar, selecionar, editar nome/status/unidades/plantão e configurar operação. | Seleção atualiza também o contexto global. |
| Convites, aba da organização | Criar, copiar link, enviar por e-mail e cancelar. | Papéis válidos para o tipo de organização; remetente e provedor exigem configuração. |
| Vínculos, aba da organização e `/admin/vinculos` | Associar/remover papel, vincular coach ao funcionário ativo e resolver vínculos. | Mudanças por RPC admin, com auditoria. |
| Usuários `/admin/usuarios` | Criar conta, definir papel global, ativar/desativar, recuperar senha, excluir e vincular aluno. | Administração exclusiva; proteção contra desativar/remover o próprio acesso administrativo. |
| Onboarding e operação, abas da organização | Salvar perfil/telefone, gerar e acompanhar playbook, registrar e aprovar infraestrutura e ativar operação. | Dados associados à organização escolhida; preparação mostra pendências reais. |
| Profissionais `/coaches` e `/funcionarios` | Usar cadastro e gestão de equipe existentes. | Admin/gestão autorizada; funcionário ativo necessário para agenda do coach. |
| Solicitações `/admin/solicitacoes` | Operar reservas, cotar/concluir/cancelar serviços, responder/resolver suporte. | Organização ativa; cobrança e cancelamento respeitam o estado do pagamento. |
| Aprovações `/admin/aprovacoes-workflows` | Criar solicitação, ler entrada/saída, aprovar/rejeitar com motivo e executar tarefas suportadas. | Fila e execução limitadas à organização; tarefa sem handler retorna à avaliação humana. |
| Auditorias `/admin/auditoria-acessos` e `/admin/auditoria-prescricoes` | Filtrar data/busca, paginar, inspecionar detalhes e exportar página. | Admin; contexto da organização ou visão global quando não selecionada. |
| Integração `/admin/fitpro` | Consultar conexão/eventos, gerar/rotacionar/revogar chave e copiar endpoints. | Chave completa só aparece ao ser gerada; ações administrativas. |
| Relatórios `/relatorios/automaticos` | Gerar e consultar relatórios da organização ativa. | Dados e chave de IA no servidor. |
| Demonstração `/admin/reset-demo` | Limpar dados operacionais somente de organização marcada como demo, com frase de confirmação. | Nunca executado no Maison Guimet; contas e organização preservadas. |

Lacunas operacionais: cadastro das pessoas, agenda, infraestrutura e canais reais; credenciais externas; validação manual das quatro contas e publicação do frontend atualizado. A limpeza demo não certifica prontidão comercial.

Critério de conclusão da QA: configurar piloto → convidar e vincular quatro acessos → operar atendimento e aprovações → conferir auditoria → alternar contexto sem mistura de dados. Confirmar que morador, coach e síndico são bloqueados em rotas administrativas.

