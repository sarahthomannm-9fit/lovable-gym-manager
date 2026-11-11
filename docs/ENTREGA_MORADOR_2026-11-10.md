# Entrega técnica do morador — 10/11/2026

Escopo: os quatro pacotes de [02_MORADOR.md](personas/02_MORADOR.md). A QA visual e funcional fica com o responsável por orientação expressa. Nenhum cenário manual foi marcado como aprovado nesta rodada.

## Código implementado

| Pacote | Resultado |
| --- | --- |
| Entrada e confiança | Falha de vínculo separada de cadastro ausente; recuperação e seleção de contexto. Entrada funciona sem depender de localStorage. Destinatário do link enviado permanece explícito mesmo após editar o campo. Triagem em 11 etapas, uma pergunta PAR-Q por etapa, revisão final, consentimento e encaminhamento para correção profissional |
| Treino e retorno | Situação consultável com erro e atualização. Prescrição inclui instruções e observações, carga prescrita separada da realizada, vídeo com nome acessível. Iniciar/salvar/pausar/retomar/concluir, progresso pendente explícito e recuperação de falha. Presença e sessão concluída têm indicadores separados |
| Rotina do condomínio | Agenda reúne aulas, eventos, reservas, solicitações e agendamentos Staff habilitados. Estados de vaga/espera/presença/encerramento explícitos. Cobranças canceladas não são pendência. Serviços seguem catálogo e configuração; solicitação não equivale a confirmação externa |
| Navegação e acabamento | Hoje, Treino, Agenda e Mais com destinos na URL. Removida a faixa de abas concorrente. Blocos carregam independentemente com erro próprio. Forms são remontados por identidade/condomínio. Controles maiores, textos completos e uso do fuso do condomínio |

### Correções adicionais encontradas durante a implementação

- As funções antigas `student_workout` e `save_workout_session` exigem um único cadastro por usuário. Foram preservadas para compatibilidade, e o morador passou a usar `resident_workout(p_aluno)` e `save_resident_workout_session`, com verificação de posse e segurança no servidor. Um usuário com dois condomínios pode consultar e registrar o treino correspondente a cada cadastro.
- Repetir `start` retorna a sessão existente sem sobrescrever o progresso. Conclusão repetida retorna o resultado já salvo e não gera uma segunda execução. O servidor também rejeita carga negativa/inválida, exercício fora da sessão, conclusão incompleta e gravação que exige retomada de uma sessão pausada.
- Navegação interna, inclusive Voltar do navegador, usa `useBlocker`. O provider de rotas passou a `createBrowserRouter`/`RouterProvider` para suportar o bloqueio, mantendo as rotas existentes. Recarregamento/fechamento usa `beforeunload`; troca direta de condomínio e saída da conta também consultam a proteção de rascunho. Trocar abas dentro de `/morador` preserva o formulário no componente.
- Respostas de saúde não foram persistidas no armazenamento do navegador. Etapas preservam o formulário em memória; identificadores de pedido e de envio salvo permitem retomada. Se o servidor já recebeu um pedido cuja resposta se perdeu, o aplicativo conclui aquele envio e orienta que correções devem passar pela equipe, sem afirmar que alterações posteriores foram gravadas.
- O dia da sessão vem do servidor. Se o dia mudar enquanto a página estiver aberta, a gravação exige atualização; não é permitido atribuir a uma nova data o progresso carregado no dia anterior.
- O comando anterior `tsc --noEmit` na raiz apontava para um projeto sem arquivos. `typecheck` agora verifica explicitamente `tsconfig.app.json` e `tsconfig.node.json`. Foi corrigida também a tipagem do plugin que emite a identidade do build.

## Banco e funções implantados

Projeto do produto: `jobytedbdptuncvobarw`. Não foi executado push geral das migrations.

| Arquivo local | Nome remoto | Versão remota |
| --- | --- | --- |
| `20261105110224_portaria_eletronica_fitness.sql` | `portaria_eletronica_fitness` | `20261110153738` |
| `20261105223500_health_day_entry.sql` | `health_day_entry` | `20261110153746` |
| `20261105224436_resident_fitness_status.sql` | `resident_fitness_status` | `20261110153754` |
| `20261110153906_resident_context_workout.sql` | `resident_context_workout` | `20261110154107` |
| `20261110194844_resident_marketing_preference.sql` | `resident_marketing_preference` | `20261110195020` |

Funções publicadas: `triagem-decidir` versão 1 e `anamnese-public` versão 6. A primeira valida autenticação e posse da anamnese no próprio código; a segunda preserva a entrada pública por token. Nenhuma chave de servidor foi incluída no frontend.

Foram conferidos no banco: RLS da pré-inscrição, ausência de leitura anônima da lista, ausência de execução anônima nas RPCs de captura/situação/treino, e permissão autenticada nas novas RPCs de treino. A pré-inscrição pública permanece intencionalmente acessível sem login. Uma chamada HTTP sem Authorization para `triagem-decidir` retornou 403.

As migrations de impacto do evento, uso agregado, autoria de protocolo e prontidão fitness de novembro não foram aplicadas nesta rodada. Elas pertencem às outras frentes e continuam no histórico local; essa pendência não deve ser confundida com as cinco migrations acima já aplicadas. Conciliar nomes e timestamps antes de qualquer deploy por CLI.

A preferência comercial ganhou leitura e gravação próprias no perfil, separadas do formulário pessoal. As RPCs exigem sessão, posse do cadastro e e-mail confirmado, usam o e-mail da conta no servidor e registram a mudança em auditoria. Reenvio do mesmo estado não duplica a auditoria. Não foi enviada nenhuma comunicação comercial como parte da implementação.

## Verificação técnica

- TypeScript do aplicativo e da configuração do Vite; ESLint sem erros nas telas do morador, layout, roteamento e novos utilitários.
- Build de produção compilado. Permanece aviso de bundle acima de 500 kB e base Browserslist antiga; não foram apresentados como falha de compilação nem como medição de desempenho.
- 17 testes Node: 11 de acesso e 6 de datas, virada de ano, fuso e status financeiros.
- 3 testes Deno de decisão: PAR-Q positivo, ausência de protocolo e protocolo compatível, incluindo reenvio.
- Ensaios SQL locais: captura/rollback/publicação e reenvio; pré-inscrição/capacidade/vínculo; situação do morador; ciclo da sessão; novo ciclo com dois condomínios, negação a terceiro, segurança, prescrição completa, preservação após repetição de início, carga inválida, pausa/retomada e conclusão sem duplicação.
- Ensaio SQL da preferência comercial: ausência de adesão por padrão, identidade verificada, escopo próprio, adesão/retirada, auditoria e reenvio sem duplicação. Confirmadas no servidor as permissões autenticadas e a ausência de execução anônima nas duas RPCs.

Comandos reproduzíveis para as verificações incluídas no repositório:

```powershell
npm run typecheck
node --test scripts/access.test.mjs scripts/resident.test.mjs
npm run build
```

Os ensaios `scripts/resident-context-workout.test.mjs` e `scripts/resident-marketing.test.mjs` usam Postgres em memória via PGlite 0.3.14. Instale esse runtime isoladamente e defina `PGLITE_MODULE` com o caminho absoluto de seu `dist/index.js`, depois execute cada arquivo com `node`. Esses testes não se conectam ao banco do produto. Os demais ensaios SQL herdados desta conversa foram executados no runtime isolado temporário e não substituem um ensaio integrado com contas reais.

## Limites e passagem para QA

O frontend desta rodada permanece no checkout local. Não houve commit/push nem publicação do aplicativo. O build local não comprova que o domínio publicado contém essas telas. Banco e Edge Functions foram atualizados conforme o registro acima.

A QA do responsável deve usar uma versão que contenha esse frontend e executar MOR-Q01 a MOR-Q23 do documento da persona. Dar atenção adicional ao Voltar do navegador, troca de contexto com formulário preenchido, sessão retomada, dois condomínios por usuário e retorno do link de e-mail em outro navegador. Para evento, testar capacidade e confirmação com dados de teste; não considerar pré-inscrição como vaga garantida.

Sem integração Staff configurada, não haverá confirmação de agendamento externo. Sem suporte, agenda, evento ou plano publicados pela equipe, as telas apresentam indisponibilidade/estado vazio real; nenhum conteúdo operacional foi inventado para preencher a interface. Não foi implementado modo offline de execução ou garantia de preservação após encerramento forçado do navegador.

O advisor do Supabase foi consultado após as alterações. Há avisos do projeto sobre funções legadas sem search_path fixo, extensão em public, configuração de Auth, versão do Postgres e funções SECURITY DEFINER expostas. As novas funções de treino possuem search_path fixo, checagem de sessão/posse e execução anônima revogada. Os avisos gerais não foram tratados como homologação aprovada nem motivaram mudanças globais fora desta fase. Referências: [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [funções privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Auth em produção](https://supabase.com/docs/guides/platform/going-into-prod#security) e [versão do Postgres](https://supabase.com/docs/guides/platform/upgrading).
