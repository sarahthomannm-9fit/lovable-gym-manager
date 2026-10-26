> Implantação posterior confirmada: frontend, cinco migrations e seis funções publicados em 26/10/2026. Consulte [Registro de implantação](REGISTRO_IMPLANTACAO_2026-10-26.md) para revisão publicada, versões e pendências reais. A referência abaixo ao pacote local descreve o estado anterior à publicação.

> Atualização de 26/10/2026: consulte [Correções dos relatórios](CORRECOES_RELATORIOS_2026-10-26.md). As alterações posteriores são locais e não foram testadas nesta rodada por solicitação do responsável. Evidências anteriores não validam o código atual nem confirmam implantação.

# Piloto comercial — Maison Guimet

Atualização: 26/10/2026.

Condomínio existente: Maison Guimet, ativo, ID 069ab50e-5921-412a-95c4-a56ed0b7d34d. O cadastro semelhante “maison guimettt” não foi alterado nem utilizado.

Estado consultado ao final: 1 vínculo de organização, 0 moradores e 0 itens de infraestrutura aprovados. As contas reais de síndico/morador e o funcionário ativo do coach precisam ser configurados pelo admin. Nenhum dado fictício foi mantido no piloto.

Implementação entregue:

- Telas e ações das quatro jornadas detalhadas na [matriz](MATRIZ_PERFIS_TELAS_DADOS_ACESSOS.md).
- Migrações 20261026110727 até 20261026115018 aplicadas no projeto Supabase utilizado pelo app.
- Funções de usuários, convites, relatórios, workflow e Staff atualizadas no backend.
- Validação TypeScript, testes de acesso e testes transacionais de fluxos e permissões; fixtures revertidas.
- Frontend alterado no repositório local. Estas alterações ainda precisam ser publicadas no domínio utilizado pelos moradores.

Antes de abrir comercialmente:

1. Em /admin/organizacoes, selecionar Maison Guimet; preencher unidades, plantão, suporte e operação real.
2. Vincular síndico e coach; conferir funcionário ativo e agenda. Convidar um morador real para homologação.
3. Registrar equipamentos reais e aprovar a infraestrutura.
4. Conferir domínio e redirects de autenticação/recuperação; testar entrega de e-mail.
5. Confirmar RESEND_API_KEY/RESEND_FROM_EMAIL para convites, FITPRO_API_KEY/FITPRO_WEBHOOK_SECRET para Staff e LOVABLE_API_KEY para os relatórios de IA que forem contratados. A entrega não comprova presença ou validade dessas credenciais.
6. Executar a [QA das quatro personas](QA_QUATRO_PERSONAS_MAISON_GUIMET.md), incluindo isolamento entre contas.
7. Publicar o frontend atualizado e repetir login, convite e jornada principal no domínio final.

Cobranças de serviços são registradas após o aceite; não foi integrado um novo checkout de cartão/Pix. Cancelamento de profissional externo segue atendimento até confirmação do Staff. Tarefas de workflow sem execução implementada retornam para avaliação humana.

O sistema não foi declarado homologado ou pronto para venda apenas porque compila. A decisão comercial depende da QA do usuário e da configuração operacional real.
