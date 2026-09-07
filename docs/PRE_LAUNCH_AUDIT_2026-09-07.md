# Auditoria pré-lançamento — Gym Manager / Nine Living
Data: 2026-09-07

## Decisão
**PRONTO COM RISCO — não liberar venda ampla ainda.** O núcleo funcional está implementado, mas faltam build reproduzível, validação autenticada no Supabase/Lovable e correção da qualidade estática.

## Evidências executadas
- `pnpm run lint`: falhou com múltiplos erros `@typescript-eslint/no-explicit-any` distribuídos por componentes e páginas.
- `pnpm exec tsc --noEmit`: bloqueado porque o executável `tsc` não foi encontrado no runtime local.
- `vite build`: bloqueado pelo sandbox/esbuild com `Access is denied` ao resolver `vite.config.ts`.
- Migrações, rotas e componentes foram inspecionados por busca e leitura no repositório.

## Fluxos
Implementados no código: criação do condomínio, responsáveis, inventário, QR/entrada, onboarding seguro, objetivos, protocolos, substituições, entrega/feedback/adaptação, Health Day, comunicados e dashboard.
**Pendente de prova:** executar cada fluxo com usuário autenticado e dados reais no Supabase/Lovable.

## Personas e isolamento
Rotas usam `ProtectedRoute` e `RoleRoute`; contexto operacional usa organização ativa. Há RLS e RPCs de auditoria/convites/ativação.
**Pendente de prova:** teste negativo por URL e consultas cruzadas entre duas organizações.

## Banco e migrations
Há migrations para onboarding operacional, segurança, protocolos, Health Day, convites, importação, auditoria, ativação, versionamento, transferência e monitoramento.
**Risco:** não foi possível aplicar migrations contra um projeto Supabase real nesta execução; verificar ordem e schemas no Lovable.

## Identidade visual
Tokens Nine Living, teal/ink/paper, Inter + Playfair Display, layouts por persona, perfil e agenda do morador foram implementados.
**Risco:** algumas telas legadas ainda podem conter componentes com estilos antigos; fazer revisão visual no Preview.

## Prontidão comercial
Demonstração possível para condomínio, assessoria digital, Health Day e dashboard.
Riscos: não há evidência de build publicado nesta auditoria; dados fictícios e módulos legados existem no código; proposta comercial/planos/contrato não foram validados como jornada comercial.

## Segurança/LGPD
Há triagem, restrições, auditoria e inativação implementadas.
**Bloqueador de aceite:** confirmar consentimento, RLS de dados clínicos e exclusão/anonimização em ambiente real.

## Classificação
- Build/deploy: **BLOQUEADOR DE LANÇAMENTO** até executar no Lovable/CI.
- Lint/typecheck: **BLOQUEADOR DE QUALIDADE**.
- Fluxos de produto: **PRONTO COM RISCO**.
- Identidade visual: **PRONTO COM RISCO**.
- Venda ampla: **MELHORIA/VALIDAÇÃO OBRIGATÓRIA**.

## Correções imediatas
1. Executar build no Lovable/CI e guardar log.
2. Aplicar migrations em projeto Supabase de staging.
3. Rodar smoke test autenticado com cinco personas e duas organizações.
4. Corrigir erros de lint que impedem CI.
5. Revisar dados fictícios e preparar demo comercial.

## Roteiro de demonstração (10 min)
1. Admin cria condomínio e cadastra responsáveis.
2. Confirma infraestrutura e QR.
3. Morador entra pelo QR e conclui triagem.
4. Professor revisa risco e publica treino.
5. Morador executa, envia feedback e recebe próxima recomendação.
6. Síndico acompanha ativação, publica Health Day e exporta relatório.

## Conclusão
O projeto tem cobertura funcional ampla, mas ainda não há evidência suficiente para afirmar lançamento comercial seguro. A decisão recomendada é **publicar em staging, validar e vender somente após os quatro bloqueadores imediatos**.
