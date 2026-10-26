> Implantação posterior confirmada: frontend, cinco migrations e seis funções publicados em 26/10/2026. Consulte [Registro de implantação](REGISTRO_IMPLANTACAO_2026-10-26.md) para revisão publicada, versões e pendências reais. A referência abaixo ao pacote local descreve o estado anterior à publicação.

# Implantação comercial — 1 → 10 → 100 condomínios

Este roteiro acompanha as correções locais de 26/10/2026. Não registra publicação nem execução de testes.

## Preparar a implantação

1. Separar staging e produção com projetos Supabase distintos. Configurar as variáveis de `.env.example` e os segredos das funções; nunca colocar service_role no frontend.
2. Conferir histórico remoto de migrations e compatibilidade das migrations anteriores. Preparar backup e recuperação antes da alteração de políticas. Não executar todas as migrations locais novamente por estarem sem commit.
3. Aplicar as quatro migrations novas em ordem no ambiente escolhido, dentro de uma implantação coordenada: o frontend novo depende das novas RPCs e o banco novo restringe gravações antigas.
4. Publicar as versões correspondentes das funções alteradas. Para staging, configurar `APP_URL`, `QA_EMAIL_SINK`, `STAFF_API_URL` e `AI_API_URL` quando a integração for usada. Evitar destinos de produção no ambiente separado.
5. Gerar e publicar frontend com ambiente e revisão identificáveis. O Vite prepara `build-info.json` na geração do build; não existe build novo gerado nesta rodada.
6. Conferir condomínio e persona selecionados. Integrações opcionais permanecem desabilitadas até configuração e aprovação pelo responsável.

## 1 condomínio — Maison Guimet

Concentrar a liberação no condomínio piloto. Cadastrar equipe e moradores reais via vínculos autorizados, equipamentos aprovados, agenda, comunicados e responsável pelo suporte. Revisar dados legados divergentes e republicar prescrições pelo fluxo autorizado quando necessário.

Critério de liberação: implantação identificada, quatro contas reais com permissões correspondentes, operação preenchida, atendimento e responsabilidades definidos, recuperação documentada e QA aprovada pelo responsável. A entrega local de código não satisfaz sozinha esses critérios.

## 10 condomínios

Repetir implantação operacional por organização, sem copiar vínculos ou dados pessoais entre condomínios. Administrar convites, profissionais e recursos por organização; manter integrações habilitadas individualmente. Registrar responsáveis, canais de suporte, falhas e tempos de atendimento por condomínio.

Critério de ampliação: piloto aprovado e processos de cadastro, suporte, incidente e revogação repetíveis. Índices e filtros foram adicionados no código; desempenho real permanece uma evidência a ser obtida pelos responsáveis, fora desta rodada sem testes.

## 100 condomínios

Planejar capacidade do projeto contratado, volume de eventos, consultas, armazenamento, filas externas, recuperação e retenção. Definir operação de plantão, limites por integração, observabilidade e responsáveis por incidentes. Os registros de créditos entregues cobrem reserva/estorno e não substituem conciliação financeira de concessões/saldos.

Critério de ampliação: capacidade e recuperação demonstradas pela operação, acompanhamento de incidentes e autorização comercial. Não há certificação para 100 condomínios nesta entrega.

## Recuperação

Guardar a revisão do frontend, versões das funções e inventário das migrations antes de publicar. Em incidente, suspender o recurso afetado e avaliar conjuntamente banco e clientes: retornar apenas o frontend pode recolocar chamadas incompatíveis com as novas permissões. Alterações de esquema exigem plano específico de recuperação; não há promessa de reversão automática de dados.
