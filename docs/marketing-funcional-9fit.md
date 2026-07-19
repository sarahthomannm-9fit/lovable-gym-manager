# 9FIT — Documento de Marketing Funcional

Base de comunicação para todos os canais de distribuição — ancorado ao produto real (Lovable/Supabase).

Este documento é a **fonte única de verdade** para gerar qualquer peça de comunicação do 9FIT — posts, WhatsApp, apresentações a síndicos/RH, roteiros de vídeo, landing pages. Toda comunicação deve nascer daqui, adaptando tom e formato ao canal, sem alterar a mensagem central.

> Atualização: Seção 3 (funcionalidades) e Seção 9 (ancoragem técnica) alinhadas ao estado real do produto. Nada abaixo promete o que está listado como "fora de escopo" (assinatura eletrônica, portal público de onboarding, BI agregado).

---

## 1. Posicionamento Central

**"Portaria eletrônica do fitness"**

Um único professor de educação física gerencia até 100 condomínios simultaneamente através de uma plataforma digital escalável — substituindo o modelo tradicional de personal trainer fixo no local, caro e de baixa cobertura.

A frase de ancoragem em qualquer peça deve remeter a isso: tecnologia que **multiplica** a capacidade de um profissional humano, não que o substitui.

---

## 2. Diferenciais Reais (o que vender)

> Importante: o diferencial **NÃO** é "ter inteligência artificial". IA é meio, não fim.

### 2.1 — Modelo de negócio: 1 professor / 100 condomínios
- Custo-benefício muito superior ao personal trainer fixo
- Cobertura ampliada sem multiplicar custo de mão de obra
- Profissional de educação física real e qualificado por trás

### 2.2 — Onboarding sem fricção (QR code)
- Morador escaneia → anamnese → plano automático
- Professor aprova em 1 clique
- Adesão em minutos, não em semanas

### 2.3 — Dashboards em tempo real para o síndico
- Adesão, frequência, uso da academia sem perguntar a ninguém
- Academia deixa de ser "espaço ocioso" e vira ativo de valorização
- Dado concreto para prestação de contas em assembleia

### 2.4 — Comunidade e bem-estar
- Engajamento social dentro do próprio condomínio
- Fortalece convivência através de saúde
- Diferencial competitivo do imóvel

---

## 3. Funcionalidades por Produto (rotas reais)

### 3.1 — Gym Manager (back-office / operador)

| Função | O que faz | Onde vive no produto |
|---|---|---|
| Dashboard síndico | Adesão, frequência, KPIs (receita, inadimplência, ocupação, NPS) | `/sindico` — aba Visão Geral |
| Relatório do mês + download | Card com KPIs e botão CSV/PDF | `/sindico` — `dashboard_sindico()` + `relatorio_inadimplencia()` |
| Dashboard morador | Progresso individual, treinos, check-ins | `/morador` |
| Dashboard coach | Alunos e condomínios, agenda, fila de anamnese | `/coach` |
| Geração de planos | Anamnese → plano automático → aprovação em 1 clique | FitPro ↔ `/coach` |
| Alertas automáticos | 15 dias sem check-in; vencimento em 7 dias | `pg_cron` — ativo |
| Multitenant | Condomínios, empresas e estúdios na mesma estrutura | `/corp`, `/sindico`, `/painel` |
| Painel administrativo | Hub central Sara/Rony: comercial, orgs, relatórios, troca de persona | `/painel` (admin) |

### 3.2 — FitPro (app do aluno/morador — PWA)

| Função | O que faz |
|---|---|
| Check-in | Registro via QR code — leve, sem fricção |
| Treino do dia | Plano personalizado no celular (PWA, sem loja) |
| Notificações | Novo treino, lembretes, comunicados |
| Suporte | WhatsApp direto com o professor |
| Hoje / Aulas / Pagamentos / Comunicados | Abas centrais da experiência |

---

## 4. Interface — O que mostrar em prints/demos

Priorizar sempre nesta ordem:

1. **Dashboard do síndico** em `/sindico` — controle e transparência
2. **Fluxo QR → anamnese → treino** — velocidade e simplicidade
3. **Check-in no celular** (FitPro) — facilidade no dia a dia
4. **Notificação de novo treino** — sistema vivo, não estático
5. **Troca de persona em 1 clique** via `/select-context` — versatilidade em demo

---

## 5. Públicos e Adaptação por Canal

| Público | Canal principal | Priorizar | Tom |
|---|---|---|---|
| Síndico / condomínio | WhatsApp, presencial, contrato | Custo-benefício, dashboard, valorização | Direto, com números |
| RH / corporate | E-mail, apresentação, LinkedIn | Bem-estar, produtividade, employer branding | Institucional |
| Morador / aluno | Grupo WhatsApp, cartaz/QR | Facilidade, sem esforço, resultado rápido | Simples, acolhedor |
| Estúdios parceiros | Reunião comercial, proposta | Receita sem expansão física | Consultivo |

---

## 6. Banco de Frases-Chave

- "Um professor. Cem condomínios. Tecnologia que multiplica gente boa."
- "Sua academia parada de custo virou ativo de valorização."
- "Do QR code ao treino: menos de 5 minutos."
- "O síndico vê tudo. O morador só precisa treinar."
- "Não é personal trainer. É assessoria fitness com escala."

---

## 7. O que NUNCA comunicar

- ❌ "Inteligência artificial" como diferencial central
- ❌ Substituição total de acompanhamento humano
- ❌ Termos técnicos (RLS, RPC, trigger, edge function)
- ❌ Comparação nominal com concorrentes
- ❌ Recursos fora de escopo (Seção 9.5)

---

## 8. Checklist antes de publicar

- [ ] Reforça "portaria eletrônica do fitness"?
- [ ] Diferencial = modelo / onboarding / dashboard / comunidade (não "IA")?
- [ ] Tom adaptado ao público e canal (Seção 5)?
- [ ] Funcionalidade existe hoje ou está no roadmap imediato (Seção 3/9)?
- [ ] CTA claro (visita, QR, falar com Sara/Rony)?

---

## 9. Ancoragem Técnica — Estado Real do Produto

### 9.1 — Acesso administrativo (Sara e Rony)
- Login supremo: `roni.comercial19@gmail.com` e `sarahthomannm@gmail.com` (role `admin`)
- Acesso a qualquer persona via "Pré-visualizar como persona" em `/select-context`
- Argumento de venda: em reunião, mostrar síndico + professor + morador ao vivo, sem logout

### 9.2 — Personas × documentos de processo

| Persona | Rota | Documento |
|---|---|---|
| Síndico | `/sindico` | Modelo Relatório Síndico (doc 5) — com download CSV |
| Professor/Coach | `/coach` | Doc Visita Rony (doc 2) |
| Morador | `/morador` | Processo Cronograma (doc 1) |
| Admin | `/painel` | Hub central + atalho "Operação 9FIT" |

### 9.3 — Coleta de dados de uso (doc 4) — já operacional
- `system_events`, `checkins`, `pessoa_eventos`, `agent_logs` já capturam uso real
- Pode ser dito com segurança: "o sistema registra cada check-in desde o dia 1"

### 9.4 — Confirmado nesta rodada
- Botão de exportação CSV no relatório do síndico
- Atalho "Operação 9FIT" no menu admin

### 9.5 — Fora de escopo (NÃO comunicar como disponível)
- ❌ Assinatura eletrônica do contrato 9FIT × Condomínio
- ❌ Portal público de onboarding (auto-cadastro de condomínios)
- ❌ Dashboard de BI agregado cross-condomínio
