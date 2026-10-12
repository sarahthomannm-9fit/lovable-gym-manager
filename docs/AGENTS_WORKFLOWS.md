# Agentes e workflows — Gym Manager / Nine Living

## Agentes já existentes

### RON Core
Gatilho: comando do administrador, falha de cadeia ou briefing diário.
Fluxo: interpretar objetivo -> escolher agente -> enviar contexto mínimo -> acompanhar execução -> consolidar resultado -> registrar em `agent_logs`.
Aprovação: obrigatória para mutações sensíveis.
Saída: plano, responsável, prazo e resultado.

### SDR
Gatilho: novo lead ou lista de prospecção.
Fluxo: qualificar -> classificar -> gerar primeira abordagem -> registrar contato -> criar follow-up.
Ações permitidas: marcar lead contactado.
Humano: aprova proposta e envio em massa.

### Reativação
Gatilho: aluno sem check-in em 30/60/90 dias.
Fluxo: segmentar motivo provável -> criar mensagem -> enviar somente com consentimento -> registrar resposta -> escalar interesse ao SDR.

### Upsell
Gatilho: uso recorrente, limite do plano ou interesse em suporte.
Fluxo: detectar gap -> sugerir plano -> calcular valor -> criar recomendação.
Humano: aprova mudança de cobrança.

### Proposta B2B
Gatilho: lead qualificado ou parceiro com carteira.
Fluxo: coletar unidades, academia, cobertura e objetivo -> montar proposta -> calcular implantação/comissão -> gerar CTA.
Humano: aprova preço e contrato.

### Onboarding
Gatilho: convite aceito, QR escaneado ou morador criado.
Fluxo: confirmar condomínio -> coletar unidade/consentimento -> triagem -> identificar pendências -> lembrar até concluir -> marcar ativado.

### Billing
Gatilho: pagamento pendente, vencimento ou inadimplência.
Fluxo: classificar 3/7/15 dias -> gerar lembrete -> registrar tentativa -> escalar para humano.
Humano: negocia acordo e cancela cobrança.

### Content
Gatilho: campanha, Health Day ou calendário editorial.
Fluxo: receber objetivo e público -> gerar rascunho -> validar fatos e tom -> enviar para aprovação -> publicar após aprovação.

### Suporte
Gatilho: ticket, erro ou dúvida.
Fluxo: classificar -> responder com base conhecida -> verificar resolução -> escalar risco/técnico -> fechar somente com registro.

### Agentes genéricos de chat
RH, Administração, Comercial, Marketing, Financeiro e Operações já existem em `agent-chat`. Eles devem permanecer consultivos: analisar dados, sugerir ações e não mutar dados sem uma ação server-side autorizada.

## Agentes que precisam ser criados para o Gym Manager

### 1. Implantação do Condomínio
Gatilho: contrato assinado.
Fluxo: criar organização -> configurar regras -> pedir fotos da academia -> gerar inventário pendente -> convidar síndico/professores -> gerar QR -> checklist de aceite.
Saída: condomínio operacional ou lista de bloqueios.
Humano: aprova inventário e regras de uso.

### 2. Ativação do Morador
Gatilho: convite enviado, QR usado ou onboarding abandonado.
Fluxo: detectar etapa -> enviar lembrete -> registrar conversão -> medir primeiro treino/check-in -> notificar síndico em baixa adesão.
Saída: ativo, pendente ou opt-out.

### 3. Segurança de Prescrição
Gatilho: triagem concluída ou atualizada.
Fluxo: ler restrições/lesões -> classificar risco -> bloquear incompatíveis -> encaminhar alto risco para professor -> liberar contexto seguro.
Humano obrigatório: risco, dor, cirurgia e exceções.
Nunca prescrever automaticamente em caso bloqueado.

### 4. Protocolo e Treino Diário
Gatilho: onboarding aprovado, treino concluído ou objetivo alterado.
Fluxo: selecionar objetivo -> filtrar equipamentos aprovados -> aplicar restrições -> evitar repetição inadequada -> criar versão -> publicar.
Humano: aprova casos de risco e alterações clínicas.

### 5. Adaptação por Feedback
Gatilho: sessão finalizada com feedback.
Fluxo: classificar dor/dificuldade -> gerar sugestão explicável -> criar substituição ou ajuste -> enviar para professor quando necessário -> publicar próxima versão.
Regra: feedback com dor nunca gera ajuste automático sem revisão.

### 6. Infraestrutura e Inventário
Gatilho: foto enviada, equipamento alterado ou item reprovado.
Fluxo: extrair sugestão -> comparar biblioteca -> criar item pendente -> solicitar confirmação humana -> atualizar equipamentos elegíveis.

### 7. Health Day
Gatilho: evento criado ou vaga próxima do limite.
Fluxo: publicar -> divulgar por segmento -> confirmar inscrição -> controlar lista de espera -> enviar lembrete -> registrar check-in -> gerar relatório.

### 8. Comunicação Condominial
Gatilho: comunicado criado, evento ou alerta operacional.
Fluxo: escolher público -> validar consentimento -> gerar texto -> aprovar -> publicar -> registrar entrega e leitura.

### 9. Monitoramento Operacional
Gatilho: erro de RPC, falha de notificação, ausência de check-in ou job atrasado.
Fluxo: detectar -> classificar severidade -> tentar retry seguro -> abrir ticket -> alertar responsável -> encerrar com evidência.

### 10. LGPD e Auditoria
Gatilho: acesso a dado clínico, mudança de prescrição, transferência ou exportação.
Fluxo: registrar ator/organização/finalidade -> aplicar retenção -> sinalizar acesso anômalo -> permitir revisão e anonimização.
Humano: solicitações de titular e incidentes.

### 11. Transferência de Condomínio
Gatilho: mudança de unidade ou contrato.
Fluxo: validar autorização -> preservar histórico mínimo necessário -> trocar organização -> reavaliar infraestrutura e protocolo -> registrar auditoria.
Nunca mover dados sem autorização e log.

### 12. Renovação e Retenção
Gatilho: 30/60/90 dias de uso ou vencimento do período gratuito.
Fluxo: medir ativação -> gerar relatório de valor -> alertar síndico -> criar oferta de renovação -> registrar aceite ou churn.

## Orquestração

```text
Contrato
 -> Implantação
 -> Infraestrutura aprovada
 -> QR e convites
 -> Ativação do morador
 -> Segurança de prescrição
 -> Protocolo e treino
 -> Feedback e adaptação
 -> Comunicação / Health Day
 -> Monitoramento
 -> Renovação
```

RON Core coordena somente a sequência e o estado. Cada agente possui escopo, permissões, idempotência e log próprios. Nenhum agente deve acessar dados de outra organização.

## Matriz de aprovação

- Automático: lembretes, relatórios, métricas, classificação e retries idempotentes.
- Aprovação do professor: risco, dor, cirurgia, substituição clínica e alteração de protocolo.
- Aprovação do síndico: comunicados, eventos, infraestrutura e metas.
- Aprovação do admin: transferência, acesso, exclusão, cobrança e contratos.

## Ordem de criação

1. Implantação do Condomínio.
2. Ativação do Morador.
3. Segurança de Prescrição.
4. Protocolo e Treino Diário.
5. Adaptação por Feedback.
6. Health Day e Comunicação.
7. Monitoramento, LGPD e Renovação.

## Métricas mínimas

Tempo de implantação, taxa de onboarding concluído, primeiro check-in, treinos concluídos, feedbacks com dor, tempo de revisão do professor, presença em Health Day, alertas resolvidos, retenção em 90 dias e conversão após período gratuito.
