
# Tela do Síndico — Reimplementação

Objetivo: substituir `src/pages/sindico/SindicoHome.tsx` por uma versão fiel ao mock `Sindico_Dashboard_GymManager_2.html`, usando dados reais do condomínio ativo (`useOperationalContext`) e mantendo o modelo read-only: o síndico **vê** e **solicita**, quem **executa** é a 9FIT (admin).

## Estrutura visual (1 arquivo)

```
[Header]  Logo(2 letras) | Nome do condomínio · "Condomínio residencial"
          Badges à direita: "{N} alunos" · "R$ {receita}"

[Grid 2x2 de métricas]
  Receita do Mês        Inadimplência
  Ocupação Média        Status (✓ Saudável / ⚠ Atenção)

[Seção] Inadimplentes (Ação Necessária)
  Lista: Nome · "Vencido há X dias · R$ Y" · botão "Solicitar cobrança"
  (botão abre dialog que cria support_ticket categoria=cobranca com o nome do aluno)

[Seção] Aulas Hoje (X de Y turmas)
  Lista: Nome da aula · "HH:MM · Prof. Nome · presentes/capacidade"
  Status colorido: Confirmada / Baixa ocupação / Cancelada

[Seção] Falar com a 9FIT
  Textarea + botão "Enviar solicitação"  (já existe — manter)

[Seção] Minhas solicitações
  Lista de support_tickets do condomínio com status (já existe — manter)
```

## Fontes de dados (Supabase, todas filtradas por `activeOrg.id`)

| Bloco | Query |
|---|---|
| Alunos ativos | `alunos` count where organization_id + status='ativo' |
| Receita mês | `pagamentos` sum(valor) where status='pago' e data_pagamento no mês corrente |
| Inadimplentes | `pagamentos` join `alunos` where status='atrasado' order by data_vencimento limit 5 |
| Ocupação média | média de (presentes/capacidade) das aulas dos últimos 7 dias |
| Aulas hoje | `aulas` where data_aula = hoje, ordenadas por horario_inicio |
| Tickets | já implementado |

Se alguma tabela/coluna não existir (ex.: `organization_id` em `alunos`/`aulas`), o bloco mostra estado vazio com `--` em vez de quebrar.

## Ações disponíveis ao síndico (todas geram `support_tickets`, modo simulação)

1. **Solicitar cobrança** (por aluno inadimplente) → ticket categoria=`cobranca`, mensagem `[Org] Cobrar {aluno} — R$ {valor} vencido há {dias} dias`.
2. **Enviar solicitação livre** (textarea) → ticket categoria=`condominio`.

Nenhum botão executa cobrança/WhatsApp direto — é o admin que age no painel dele.

## Design tokens

Manter accent azul `#60A5FA` (já é a cor do contexto Síndico no PersonaLayout). Reaproveitar `Card`, `Badge`, `Button`, `Textarea` do shadcn. Layout responsivo: grid 2 col no mobile, 4 col em sm+.

## Arquivos

- **Editar**: `src/pages/sindico/SindicoHome.tsx` (rewrite completo).
- Nenhuma migration, nenhuma alteração de rota, nenhum outro arquivo tocado.

## Validação

Após a edição, abrir `/sindico` no preview com um usuário sindico de uma org de teste e confirmar: header com nome da org, 4 métricas renderizam (mesmo que zeradas), seção de inadimplentes mostra lista ou empty state, seção de aulas hoje idem, textarea e lista de tickets continuam funcionando.
