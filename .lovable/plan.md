# Plano — Admins supremos + alinhamento operacional

## 1. Resetar credenciais dos dois admins supremos (bloqueador de login)

Executar a edge function `setup-users` já existente, ajustando a senha para `54967554` (hoje está fixada em `54996754`, por isso o login falha):

- Atualizar `supabase/functions/setup-users/index.ts` → senha `54967554` para ambos.
- Invocar a função (via `supabase.functions.invoke('setup-users')` a partir de um script/curl único) para:
  - Criar/atualizar `roni.comercial19@gmail.com` com `email_confirm: true`.
  - Criar/atualizar `sarahthomannm@gmail.com` com `email_confirm: true`.
  - Garantir `user_roles.role = 'admin'` em ambos (limpa e reinsere).
- Verificar via `supabase--read_query` em `auth.users` + `user_roles` que os dois estão como admin confirmados.

Resultado: login imediato em `/login` com a senha `54967554`, redirecionamento para `/painel` (rota de admin).

## 2. Garantir que admin = "usuário supremo" em toda a app

Auditoria rápida (sem reescrever regras já existentes):

- `RoleRoute` já libera admin para qualquer persona ✅.
- `AppSidebar` — confirmar que admin vê o grupo "Personas" com atalhos para `/sindico`, `/coach`, `/corp`, `/morador`, `/agents`, `/painel`, `/admin/*`.
- `SelectContext` — manter a seção "Pré-visualizar como persona" para admin navegar entre contextos com 1 clique.

Nenhuma migration necessária aqui — só verificação.

## 3. Alinhar FitManager ao fluxo operacional dos anexos

Os 5 documentos descrevem: cronograma da Sara (comercial/onboarding), visita do Rony (implantação), contrato 9FIT×Condomínio, coleta de dados de uso, e relatório do síndico. Já existem telas para as 4 personas — o plano é **fechar as pontas que os anexos exigem**, sem inventar módulos novos:

### 3a. Persona Síndico (`/sindico`)

- Confirmar que o **Relatório do Síndico** mensal está disponível: card "Relatório do mês" na aba Visão Geral com KPIs (receita, inadimplência, ocupação, NPS) + botão "Baixar PDF/CSV".
  - Implementação lean: gerar CSV client-side a partir de `dashboard_sindico(org_id)` + lista de inadimplentes de `relatorio_inadimplencia()`.
- Manter comunicados, tickets e aprovação de moradores como já estão.

### 3b. Persona Professor/Coach (`/coach`)

- Já cobre agenda, alunos, check-in, fila de anamnese. Sem mudanças estruturais — só garantir link no menu admin.

### 3c. Persona Morador (`/morador`)

- Já tem Hoje/Aulas/Pagamentos/Comunicados. Sem mudanças.

### 3d. Persona Admin (Sara & Rony)

- Painel `/painel` continua sendo o hub.
- Garantir atalhos no sidebar admin para:
  - Comercial (pipeline/clientes/contratos) — já existe.
  - Organizações — já existe.
  - Relatórios — já existe.
  - **Novo atalho "Operação 9FIT"** apontando para `/select-context` para trocar de persona rapidamente.

### 3e. Coleta de dados de uso (anexo 4)

- Já temos `system_events`, `checkins`, `pessoa_eventos`, `agent_logs`. Não é necessário criar nada novo agora — apenas confirmar que os triggers de eventos estão ativos (já estão nas db-functions listadas).

## 4. Verificação final

- Login com `roni.comercial19@gmail.com` / `54967554` → `/painel`.
- Login com `sarahthomannm@gmail.com` / `54967554` → `/painel`.
- Trocar contexto via topo → cada persona carrega sem flicker.
- Baixar relatório do síndico da org demo → CSV abre corretamente.

## Detalhes técnicos

- Arquivo alterado: `supabase/functions/setup-users/index.ts` (troca de senha).
- Invocação da função: um `code--exec` com `curl -X POST` para `https://jobytedbdptuncvobarw.supabase.co/functions/v1/setup-users` usando a anon key.
- Novo botão CSV no `SindicoHome` (aba Visão Geral) — ~30 linhas, sem migration.
- Novo item de sidebar "Operação 9FIT" no `AppSidebar` (admin only) — 1 entry.
- Sem migrations de banco nesta rodada.  
  
EXTRAS : 9FIT — DOCUMENTO DE MARKETING FUNCIONAL
  *Base de comunicação para todos os canais de distribuição — ancorado ao produto real (Lovable/Supabase)*
  Este documento é a fonte única de verdade para gerar qualquer peça de comunicação do 9FIT — posts, mensagens de WhatsApp, apresentações a síndicos/RH, roteiros de vídeo, landing pages. Toda comunicação deve nascer daqui, adaptando tom e formato ao canal, sem alterar a mensagem central.
  Atualização: a Seção 3 (funcionalidades) e a nova Seção 9 (ancoragem técnica) foram alinhadas ao estado real do produto conforme o plano de implementação em curso — cada promessa de marketing aqui corresponde a uma tela, rota ou dado que já existe ou está confirmado no roadmap imediato. Nada abaixo promete o que está listado como "fora de escopo" no plano técnico (assinatura eletrônica, portal público de onboarding, BI agregado).
  ---
  ### 1. Posicionamento Central
  **"Portaria eletrônica do fitness"**
  Um único professor de educação física gerencia até 100 condomínios simultaneamente através de uma plataforma digital escalável — substituindo o modelo tradicional de personal trainer fixo no local, caro e de baixa cobertura.
  A frase de ancoragem em qualquer peça deve remeter a isso: tecnologia que multiplica a capacidade de um profissional humano, não que o substitui.
  ---
  ### 2. Diferenciais Reais (o que vender)
  Importante: o diferencial NÃO é "ter inteligência artificial". IA é meio, não fim. Os diferenciais que efetivamente vendem são:
  **2.1 — Modelo de negócio: 1 professor / 100 condomínios**
  - Custo-benefício muito superior ao personal trainer fixo (que atende só 1 local)
  - Cobertura ampliada sem multiplicar custo de mão de obra
  - Profissional de educação física real e qualificado por trás — não é só um app
  **2.2 — Onboarding sem fricção (QR code)**
  - Morador escaneia o QR → preenche anamnese em poucos minutos → recebe plano de treino automaticamente
  - Professor aprova em 1 clique — sem burocracia, sem agendamento, sem espera
  - Adesão em minutos, não em semanas
  **2.3 — Dashboards em tempo real para o síndico**
  - Síndico acompanha adesão, frequência e uso da academia sem precisar perguntar a ninguém
  - Visibilidade que transforma a academia de "espaço ocioso" em ativo de valorização do condomínio
  - Dado concreto para prestação de contas em assembleia
  **2.4 — Comunidade e bem-estar**
  - Não é só treino — é engajamento social dentro do próprio condomínio
  - Fortalece a convivência entre moradores através de um objetivo em comum (saúde)
  - Diferencial competitivo do imóvel para venda/locação
  ---
  ### 3. Funcionalidades por Produto (ancoradas às rotas reais)
  **3.1 — Gym Manager (back-office / operador)**

  | Função                      | O que faz                                                                           | Onde vive no produto                                                 |
  | --------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
  | Dashboard síndico           | Adesão, frequência, uso da academia, KPIs (receita, inadimplência, ocupação, NPS)   | `/sindico` — aba Visão Geral                                         |
  | Relatório do mês + download | Card com KPIs e botão para baixar CSV/PDF                                           | `/sindico` — via `dashboard_sindico()` + `relatorio_inadimplencia()` |
  | Dashboard morador           | Progresso individual, treinos, check-ins                                            | `/morador`                                                           |
  | Dashboard coach             | Visão consolidada de alunos e condomínios sob o professor, agenda, fila de anamnese | `/coach`                                                             |
  | Geração de planos           | Anamnese → plano de treino automático → aprovação do professor em 1 clique          | Fluxo entre FitPro e `/coach`                                        |
  | Alertas automáticos         | Aviso de 15 dias sem check-in; aviso de vencimento em 7 dias                        | pg_cron — já ativo                                                   |
  | Multitenant                 | Condomínios, empresas (corporate/RH) e estúdios na mesma estrutura                  | `/corp`, `/sindico`, organizações no `/painel`                       |
  | Painel administrativo       | Hub central para Sara e Rony: comercial, organizações, relatórios, troca de persona | `/painel` (admin)                                                    |

  **3.2 — FitPro (app do aluno/morador — PWA)**

  | Função                                  | O que faz                                                                       |
  | --------------------------------------- | ------------------------------------------------------------------------------- |
  | Check-in                                | Registro de uso da academia via QR code — leve, sem fricção                     |
  | Treino do dia                           | Acesso ao plano personalizado direto no celular, sem instalar app da loja (PWA) |
  | Notificações                            | Avisos de novo treino, lembretes, comunicados do condomínio                     |
  | Suporte                                 | Canal direto com o professor via WhatsApp para dúvidas e ajustes                |
  | Hoje / Aulas / Pagamentos / Comunicados | Abas centrais da experiência do morador                                         |

  ---
  ### 4. Interface — O que mostrar em prints/demos
  Ao gerar peças com print de tela ou demo, priorizar sempre nesta ordem (o que mais convence visualmente):
  1. Dashboard do síndico em `/sindico` (mostra controle e transparência — fala direto com quem decide a compra)
  2. Fluxo de QR code → anamnese → treino gerado (mostra velocidade e simplicidade)
  3. Tela de check-in no celular do morador, FitPro (mostra facilidade de uso no dia a dia)
  4. Notificação de novo treino (mostra que o sistema é vivo, não estático)
  5. Troca de persona em 1 clique via `/select-context` (mostra a versatilidade da plataforma — útil em demo comercial para RH/condomínio/estúdio no mesmo pitch)
  ---
  ### 5. Públicos e Adaptação de Mensagem por Canal

  | Público                      | Canal principal                            | O que priorizar                                     | Tom                 |
  | ---------------------------- | ------------------------------------------ | --------------------------------------------------- | ------------------- |
  | Síndico / condomínio         | WhatsApp, reunião presencial, contrato     | Custo-benefício, dashboard, valorização do imóvel   | Direto, com números |
  | RH / corporate               | E-mail, apresentação, LinkedIn             | Bem-estar do time, produtividade, employer branding | Institucional       |
  | Morador / aluno final        | Grupo de WhatsApp do condomínio, cartaz/QR | Facilidade, gratuidade de esforço, resultado rápido | Simples, acolhedor  |
  | Estúdios/academias parceiras | Reunião comercial, proposta                | Expansão de receita sem expansão de espaço físico   | Consultivo          |

  ---
  ### 6. Banco de Frases-Chave (usar como base, não copiar literalmente)
  - "Um professor. Cem condomínios. Tecnologia que multiplica gente boa."
  - "Sua academia parada de custo virou ativo de valorização."
  - "Do QR code ao treino: menos de 5 minutos."
  - "O síndico vê tudo. O morador só precisa treinar."
  - "Não é personal trainer. É assessoria fitness com escala."
  ---
  ### 7. O que NUNCA comunicar
  - Não vender "inteligência artificial" como diferencial central — é meio, não é o que resolve a dor do síndico ou do morador
  - Não prometer substituição total de acompanhamento humano — o professor real por trás é parte do valor
  - Não usar termos técnicos de banco de dados/infraestrutura em comunicação externa (RLS, RPC, trigger, edge function, etc. são apenas uso interno)
  - Não comparar nominalmente com concorrentes específicos em peças públicas
  - Não prometer o que está fora de escopo no roadmap atual: assinatura eletrônica de contrato, portal público de onboarding, dashboards de BI agregado (ver Seção 9)
  ---
  ### 8. Checklist antes de publicar qualquer peça
  - A peça reforça o posicionamento "portaria eletrônica do fitness"?
  - O diferencial citado é modelo de negócio / onboarding / dashboard / comunidade — não "IA"?
  - O tom está adaptado ao público e canal certos (seção 5)?
  - A funcionalidade mencionada já existe na versão atual do produto (seção 3) ou está confirmada no roadmap imediato — não no "fora de escopo" (seção 9)?
  - Existe uma chamada para ação clara (agendar visita, escanear QR, falar com Sara/Rony)?
  ---
  ### 9. Ancoragem Técnica — Estado Real do Produto
  Esta seção existe para que marketing e produto nunca se descolem. Toda promessa de comunicação deve ser checada contra o que está aqui antes de sair.
  **9.1 — Acesso administrativo (Sara e Rony)**
  - Login supremo: [roni.comercial19@gmail.com](mailto:roni.comercial19@gmail.com) e [sarahthomannm@gmail.com](mailto:sarahthomannm@gmail.com), ambos com role admin — acesso irrestrito a todas as personas da plataforma
  - Admin acessa qualquer persona com 1 clique via "Pré-visualizar como persona" em `/select-context` — útil em demonstrações comerciais ao vivo, sem precisar logar/deslogar
  - Isso é argumento de venda em si: em uma reunião, Sara ou Rony podem mostrar a visão do síndico, do professor e do morador na mesma tela, ao vivo
  **9.2 — Personas e onde cada anexo de processo se conecta**

  | Persona           | Rota     | Documento de processo relacionado                                                                         |
  | ----------------- | -------- | --------------------------------------------------------------------------------------------------------- |
  | Síndico           | /sindico | Modelo de Relatório do Síndico (doc 5) — agora com botão de download CSV/PDF                              |
  | Professor/Coach   | /coach   | Doc de Visita do Rony (doc 2) — agenda, fila de anamnese e aprovação de planos vividos nesta tela         |
  | Morador           | /morador | Fluxo de onboarding descrito no Processo de Cronograma (doc 1) — check-in, treino do dia, comunicados     |
  | Admin (Sara/Rony) | /painel  | Hub que conecta comercial, organizações, relatórios e atalho "Operação 9FIT" para troca rápida de persona |

  **9.3 — Coleta de dados de uso (doc 4) — o que já está gravando dado hoje**
  - system_events, checkins, pessoa_eventos e agent_logs já capturam o uso real da plataforma — a Estratégia de Coleta de Dados (doc 4) já está operacional na camada de dados, não é uma promessa futura
  - Isso pode ser dito com segurança a um síndico ou RH em prospecção: "o sistema já está registrando cada check-in e evento desde o primeiro dia"
  **9.4 — O que está confirmado para esta rodada (pode virar comunicação em breve)**
  - Relatório do síndico com botão de exportação CSV direto no dashboard — antes de anunciar publicamente, confirmar que já foi lançado
  - Atalho "Operação 9FIT" no menu admin para troca rápida de contexto entre personas
  **9.5 — Fora de escopo nesta rodada (NÃO comunicar como disponível)**
  - Assinatura eletrônica do contrato 9FIT × Condomínio — hoje o contrato (doc 3) ainda é assinado fora da plataforma
  - Portal público de onboarding (formulário externo para novos condomínios se cadastrarem sozinhos) — hoje a captação é feita por Sara/Rony diretamente
  - Dashboard de BI agregado entre múltiplos condomínios — hoje os eventos são gravados por organização, mas não há uma tela consolidada cross-condomínio

## Fora de escopo (proponho separado se quiser)

- Assinatura eletrônica do contrato 9FIT×Condomínio.
- Portal público de onboarding da Sara (formulário externo).
- Dashboards de coleta agregada (BI) — hoje os eventos são gravados, mas não há tela dedicada.