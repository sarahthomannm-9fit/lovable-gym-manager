# Admin Nine Living
## Diagnóstico, direção de produto e plano específico de correção

Data da análise: 10/11/2026. Referência: código local do repositório lovable-gym-manager. Este documento inicia a sequência admin → morador → coach → síndico. As correções compartilhadas serão consolidadas depois das quatro análises.

## 1. Resultado que o admin deve conseguir produzir

O admin prepara e sustenta a operação da Portaria Fitness em cada condomínio. Precisa cadastrar o prédio, vincular os responsáveis, cadastrar e revisar a infraestrutura, preparar a entrada do morador e verificar se o professor consegue atender. Depois acompanha pendências, suporte e evidências de uso.

O resultado verificável é um condomínio com pessoas e equipamentos corretos, acessos funcionando e uma jornada homologada do QR à execução do treino. O cadastro do prédio é o primeiro passo dessa entrega.

A análise considera quatro trabalhos principais.

| Trabalho | Pergunta do admin | Resultado esperado |
| --- | --- | --- |
| Implantar | Qual é o próximo passo para colocar este condomínio em funcionamento? | Próxima ação vinculada ao condomínio e configuração retomável |
| Operar | O que precisa de atenção e quem vai resolver? | Pendência com responsável, motivo, idade e ação |
| Verificar | Quais etapas já foram comprovadas? | Evidência por fase, com data e resultado |
| Administrar | Quem pode acessar ou alterar esta operação? | Permissões conferidas e alterações auditáveis |

## 2. Diagnóstico macro do admin

A superfície administrativa reúne implantação, comercial, financeiro, marketing, agentes, gestão de pessoas e auditoria. A divisão atual ainda exige conhecer a estrutura dos módulos para encontrar uma tarefa. O percurso de implantação também se divide entre o assistente novo e a página de organizações.

As mudanças locais recentes melhoraram essa entrada: menu secundário recolhido, ação Cadastrar condomínio, perguntas individuais e infraestrutura integrada. A página de organizações, porém, ainda oferece um segundo cadastro e uma configuração extensa. A prioridade é completar a continuidade entre essas superfícies.

A hierarquia proposta para o menu é uma decisão de produto a implementar.

| Grupo | Destinos | Comportamento esperado |
| --- | --- | --- |
| Operação | Visão geral, condomínios, cadastrar condomínio, solicitações | Acesso inicial do admin |
| Pessoas e acessos | Usuários, equipe, convites e vínculos | Alterações dentro de contexto explícito |
| Comercial e financeiro | Pipeline, contratos, pagamentos e relatórios | Grupo secundário com nomes de tarefas |
| Comunicação | Campanhas, comunicados, eventos e automações | Mostrar qual público e condomínio serão afetados |
| Administração técnica | Integrações, agentes, auditorias e demonstração | Ações de maior consequência com identificação clara do escopo |

A hierarquia precisa preservar os destinos existentes e a permissão de cada papel. Admin global e gestor de condomínio têm escopos diferentes. A disponibilidade de um botão depende da autorização, e o servidor precisa validar a mesma regra.

## 3. O que foi identificado no código

| ID | Evidência local | Interpretação |
| --- | --- | --- |
| ADM-E01 | AppSidebar tem grupos expansíveis e Cadastrar condomínio. PersonaLayout usa navegação própria para páginas administrativas | Há dois padrões de navegação administrativa para harmonizar |
| ADM-E02 | Operacao9FIT pergunta nome, apartamentos e forma de entrada, confirma o resumo e cria o condomínio | Assistente básico existe localmente |
| ADM-E03 | O assistente usa useState e um UUID em useRef. Não há persistência de retomada nele | O identificador protege o reenvio na mesma montagem. Recarregar a página perde o percurso do assistente |
| ADM-E04 | OrganizationsAdmin mantém diálogo Novo condomínio com nome e tipo | Duas entradas criam condomínio com níveis diferentes de configuração |
| ADM-E05 | OrganizationInfrastructure é usado no assistente e na gestão da organização | Cadastro e revisão de equipamento compartilham implementação |
| ADM-E06 | A aprovação de infraestrutura chama save_facility_analysis e depois atualiza o status da linha | Duas gravações podem deixar análise e status divergentes se a segunda falhar |
| ADM-E07 | OrganizationOperations lista perfil operacional, playbook, infraestrutura, serviços e ativação | A configuração continua extensa após o assistente |
| ADM-E08 | OperationsActivation consulta a prontidão e chama activate_organization_operation | Existe uma trava de pré-requisitos no servidor |
| ADM-E09 | FitnessDeliveryReadiness agrega acesso, equipe, protocolo, treino e execução | Existe uma visão local de evidências para a Portaria |
| ADM-E10 | A lista de organizações é renderizada integralmente com seleção de contexto. O carregamento de convites é assíncrono | Busca, escala da lista e troca rápida de contexto precisam de validação específica |

As evidências acima demonstram estrutura de código. A renderização com conta real, as respostas das integrações e a versão publicada precisam ser verificadas no ensaio. Esta análise não atualizou o estado de produção.

## 4. Percurso específico do admin

### 4.1 Encontrar ou iniciar uma operação

A entrada deve oferecer Encontrar condomínio e Cadastrar condomínio. A lista precisa de busca por nome e filtros operacionais claros. Exibir um resumo curto com situação da implantação, pendência principal e última atualização.

Ao selecionar outro condomínio, atualizar o contexto antes de habilitar ações. Limpar formulários associados ao condomínio anterior ou pedir decisão sobre um rascunho. Uma resposta atrasada de consulta não deve substituir os dados da organização atualmente selecionada.

### 4.2 Cadastrar com uma pergunta por etapa

A ordem sugerida é nome → apartamentos → forma de entrada → conferir e criar. O condomínio salvo abre as próximas etapas da mesma implantação.

O assistente precisa mostrar o que já foi salvo e permitir retomar. O rascunho anterior à criação deve ser associado ao usuário. Depois da criação, a retomada deve usar o ID do condomínio no servidor. Nome ou posição na lista não servem como identidade.

O comportamento de Voltar deve preservar respostas. Erro de rede mantém os dados digitados. Reenvio após resposta perdida deve reencontrar a criação original.

### 4.3 Preparar a infraestrutura

Cadastrar um item por vez. Ambiente, equipamento e quantidade são obrigatórios. Categoria, foto e descrição podem ser complementados. A lista distingue pendente, aprovado e eventual revisão.

Aprovação significa análise técnica registrada e equipamento apto para entrar no filtro de prescrição. Deve ser uma operação consistente no servidor. Uma falha não pode resultar em aviso de sucesso sem a alteração correspondente.

A foto hoje é um link HTTPS. Upload e análise automática de imagem são propostas adicionais e precisam de definição própria antes da implementação.

### 4.4 Vincular responsáveis e acesso do morador

Separar síndico, professor e recepção. O professor precisa do papel e do cadastro profissional ativo requeridos pela operação. A recepção deve ter somente as ações necessárias ao evento; o escopo desse acesso ainda precisa ser definido.

Distinguir convite criado, envio solicitado, envio confirmado pelo provedor e convite aceito. Mostrar falha de entrega com ação de recuperação. Reenviar convite não deve criar outro vínculo nem conceder outro papel.

A forma de entrada por convite ou QR deve ser exibida antes de alterar o acesso público do condomínio. O QR final precisa ser testado impresso e em celular sem sessão iniciada.

### 4.5 Conferir a entrega e iniciar a rotina

Organizar o resumo em três camadas.

| Camada | Significado |
| --- | --- |
| Cadastrado | Dados mínimos foram gravados |
| Configurado | Equipe, acesso, inventário e recursos necessários estão disponíveis |
| Homologado | O ensaio das personas foi executado e tem evidência registrada |

A ativação existente deve manter sua trava de pré-requisitos. A indicação de homologação precisa ter registro explícito de responsável, data, versão e cenário. Contagens de cadastros e sessões são parte da evidência, mas não demonstram sozinhas que o ensaio foi executado.

### 4.6 Operar e acompanhar

O painel inicial deve priorizar as pendências do condomínio selecionado. Cada pendência precisa explicar o efeito para a operação e abrir o lugar certo para resolvê-la.

Exemplos de encaminhamento: professor sem vínculo → Pessoas e acessos; inventário pendente → Infraestrutura; morador aguardando prescrição → operação do professor autorizada; falha de envio de convite → Convites; solicitação aberta → Atendimento.

O admin acompanha contagens e responsáveis. A navegação por persona precisa distinguir pré-visualização administrativa de uma sessão real daquele perfil.

## 5. Backlog de correção do admin

P0 indica risco de ação incorreta, inconsistência ou permissão. P1 impede uma operação fluida. P2 melhora leitura e velocidade.

| ID | Prioridade | Correção específica | Superfície | Aceite |
| --- | --- | --- | --- | --- |
| ADM-01 | P1 | Fazer Novo condomínio abrir o assistente de condomínio. Preservar criação de outros tipos de organização em ação distinta | OrganizationsAdmin e Operacao9FIT | Todos os caminhos de novo condomínio chegam ao mesmo percurso |
| ADM-02 | P1 | Persistir e retomar a implantação por usuário e condomínio, mantendo o reenvio idempotente | Assistente e armazenamento | Recarregar antes e depois da criação preserva o ponto correto e não duplica o condomínio |
| ADM-03 | P0 | Invalidar respostas e ações do contexto anterior durante troca de organização | Contexto, formulários e consultas | Alternar A → B com rede lenta nunca permite gravar os dados de A em B |
| ADM-04 | P1 | Dividir a continuidade em Infraestrutura, Pessoas e acessos, Entrada do morador e Conferência | Organização e assistente | Admin conclui uma etapa e encontra a próxima sem retornar ao menu |
| ADM-05 | P0 | Tornar atômica a aprovação da infraestrutura, com validação de autorização | Componente, RPC e banco | Falha simulada mantém análise e status coerentes |
| ADM-06 | P0 | Separar os escopos de admin global, gestor e recepção | Rotas, funções e permissões | Perfis não administrativos não criam organizações nem ampliam permissões |
| ADM-07 | P1 | Mostrar estados de convite e recuperação de envio | Convites e função de envio | Convite criado não é apresentado como e-mail entregue. Aceite associa uma única conta |
| ADM-08 | P1 | Criar distinção visual e registro entre configuração e homologação | Prontidão e ativação | Cadastro completo não ganha selo de ensaio aprovado automaticamente |
| ADM-09 | P1 | Buscar e filtrar condomínios, preservando o selecionado | Lista de organizações | Encontrar e abrir a organização correta com volume representativo |
| ADM-10 | P1 | Harmonizar menu lateral e navegação das páginas administrativas | Layouts | Mesma terminologia, destino e contexto para a mesma tarefa |
| ADM-11 | P1 | Dar encaminhamento específico às pendências de prontidão | Painel e configuração | Cada pendência abre a etapa do condomínio correspondente |
| ADM-12 | P2 | Uniformizar títulos, estados, foco e métricas responsivas | Componentes administrativos | Teclado, zoom e celular mantêm leitura e acesso aos controles |
| ADM-13 | P0 | Preservar proteção de ações de suspensão, papéis, limpeza de demonstração e credenciais | Gestão técnica | Escopo é explícito, autorização é validada no servidor e há histórico da alteração |

## 6. Direção de arte aplicada à operação

Uma tela administrativa deve ter título de tarefa, contexto do condomínio e ação principal reconhecíveis. Usar uma coluna principal para o trabalho e informação auxiliar por expansão. Reservar cartões para agrupamentos que tenham significado operacional.

No assistente, manter uma pergunta ativa, resposta, progresso e controles Voltar/Continuar. Na conferência, apresentar o resumo completo antes da gravação. Na gestão recorrente, usar lista com busca e detalhes por organização.

A cor acompanha um texto de estado. Pendente, em revisão, concluído e falha precisam ser distinguíveis sem depender da cor. Erros ficam próximos da ação, preservam os dados e oferecem recuperação. Carregamento não deve ser exibido como valor zero.

Rótulos de métricas precisam corresponder ao cálculo. O painel local passou a chamar a proporção de cadastros inativos pelo seu significado. Receita mensal e receita recorrente também precisam de definições distintas caso o produto venha a medir ambas.

## 7. Pacotes de implementação e dependências

| Pacote | Itens | Verificação antes do próximo pacote |
| --- | --- | --- |
| A. Entrada consistente | ADM-01, ADM-02, ADM-09, ADM-10 | Mesmo assistente em todas as entradas e retomada comprovada |
| B. Configuração segura | ADM-03, ADM-04, ADM-05, ADM-06 | Troca de contexto, aprovação e permissões testadas |
| C. Entrega verificável | ADM-07, ADM-08, ADM-11 | Convite, prontidão e homologação têm estados distintos |
| D. Acabamento e regressão | ADM-12, ADM-13 | Ensaio de celular, teclado, erro e ações de maior consequência |

Os pacotes são o plano específico do admin. Os documentos posteriores devem apontar as dependências recebidas e devolvidas a esse perfil. A consolidação geral vem depois.

## 8. Roteiro de aceite do admin

| Teste | Execução | Evidência esperada |
| --- | --- | --- |
| ADM-Q01 | Criar condomínio pela navegação e pelo botão de organizações | Um único fluxo guiado de condomínio |
| ADM-Q02 | Voltar, avançar e recarregar antes de criar | Respostas e etapa recuperadas |
| ADM-Q03 | Perder a resposta de criação e repetir | Mesmo ID e um único cadastro |
| ADM-Q04 | Reabrir a implantação após criar e adicionar dois equipamentos | Retomada do condomínio correto e dois itens persistidos |
| ADM-Q05 | Interromper a aprovação de equipamento | Status e análise consistentes, sem confirmação falsa |
| ADM-Q06 | Trocar A → B durante consulta e com formulário preenchido | Nenhum dado tardio ou rascunho de A gravado em B |
| ADM-Q07 | Convidar professor e síndico, simular falha de envio e reenviar | Estado de envio correto e vínculo único após aceite |
| ADM-Q08 | Tentar ações com gestor, recepção e outro condomínio | Negação no servidor de tudo que estiver fora do escopo |
| ADM-Q09 | Conferir QR sem sessão e iniciar o percurso de morador | Entrada no condomínio correto, sem conceder papel administrativo |
| ADM-Q10 | Preencher cadastros e conferir prontidão | Configuração completa ainda solicita evidência do ensaio |
| ADM-Q11 | Ensaiar morador → professor → síndico → admin | Mesma jornada conferida em cada visão autorizada |
| ADM-Q12 | Repetir no celular, com teclado, zoom e falha de rede | Controles acessíveis, contexto legível e recuperação disponível |

A evidência de cada teste precisa guardar ambiente, versão, perfil de teste, data, resultado esperado e observado. Evitar dados pessoais ou de saúde identificáveis nos registros compartilhados.

## 9. Situação e próximo passo

Os pacotes de implementação local estão descritos na atualização abaixo. A próxima persona é o morador, mapeada em [02_MORADOR.md](02_MORADOR.md). A QA funcional fica com o responsável, por orientação expressa recebida em 10/11/2026. Esse encaminhamento não equivale a um resultado de teste aprovado.

## Fontes locais consultadas

- [Menu administrativo](../../src/components/AppSidebar.tsx)
- [Layout das personas](../../src/layouts/PersonaLayout.tsx)
- [Assistente de condomínio](../../src/pages/admin/Operacao9FIT.tsx)
- [Gestão de organizações](../../src/pages/admin/OrganizationsAdmin.tsx)
- [Infraestrutura compartilhada](../../src/components/admin/OrganizationInfrastructure.tsx)
- [Configurações da organização](../../src/components/admin/OrganizationSettings.tsx)
- [Operação da organização](../../src/components/admin/OrganizationOperations.tsx)
- [Prontidão da Portaria](../../src/components/admin/FitnessDeliveryReadiness.tsx)
- [Ativação da operação](../../src/components/admin/OperationsActivation.tsx)
- [Painel administrativo](../../src/pages/Painel.tsx)
- [Mapeamento técnico de outubro](../MAPEAMENTO_FASE_4_ADMIN.md)

## Atualização da implementação do admin em 10/11/2026

Foram implementados localmente os seguintes pontos do plano.

| Itens | Resultado local |
| --- | --- |
| ADM-01 e ADM-09 | Cadastro de condomínio direcionado ao assistente. Criação de outros tipos fica em Outra organização. Busca por nome e filtro por situação na lista |
| ADM-02 | Rascunho por usuário, com etapa e identificador de reenvio. Retomada de condomínio pelo ID no servidor. Rascunho do item de infraestrutura por usuário e condomínio |
| ADM-03 e ADM-04 | Contexto explícito, formulários remontados por organização, abas vinculadas ao endereço e convite com destinatário capturado no início da ação |
| ADM-05 | Aprovação atômica por RPC, com status, análise e auditoria na mesma transação |
| ADM-07 | Estado de envio a partir do histórico de entregas. Envio aceito pelo provedor é apresentado separadamente do aceite do convite |
| ADM-08 | Registro de ensaio com responsável, versão, ambiente, resultado, evidência e snapshot de prontidão. Resultado aprovado exige os pré-requisitos atuais |
| ADM-10 e ADM-11 | Removida a segunda navegação das páginas admin que usavam PersonaLayout. Pendências encaminham à configuração correspondente |
| ADM-12 | Ajustes de quebra de linha, tamanho dos controles e rótulos acessíveis nas ações revisadas |

ADM-06 e ADM-13 continuam dependendo da homologação dos escopos e das ações de maior consequência com contas separadas. As regras de autorização existentes foram preservadas. O teste legado que esperava acesso sem organização foi alinhado à regra atual que exige contexto para usuários não administrativos.

Os 11 testes de acesso passaram. O teste SQL local da alteração confirmou rollback de aprovação quando a auditoria falha, aprovação completa, negação a outra organização, registro de pendência, bloqueio de aprovação de ensaio sem prontidão e reenvio sem duplicidade.

A conferência visual, a troca de contexto com rede lenta, o envio real de convites e a publicação continuam como critérios de aceite abertos. O registro manual de ensaio depende da evidência informada pelo responsável.

### Fechamento técnico desta rodada

- Cadastro confirmado passa a usar o ID no endereço, permitindo retomada mesmo sem armazenamento local. Falha inesperada na consulta de retomada apresenta recuperação.
- Rascunho de equipamento que conflita com item já salvo permite conferir a lista e iniciar explicitamente outro item, preservando os dados preenchidos.
- Links internos de pendência rolam até o bloco correspondente e transferem foco. ID de organização desconhecido não mantém os detalhes da anterior.
- Consulta de homologação trata rejeição inesperada e apresenta erro recuperável.
- TypeScript e 11 testes de acesso passaram; aprovação atômica, rollback, escopo, prontidão e replay passaram no ensaio SQL local.
- Banco do produto atualizado pela migration `admin_operation_acceptance`, versão remota `20261110152336`, correspondente ao arquivo local `20261110150630_admin_operation_acceptance.sql`. Verificados RLS ativo, ausência de execução anônima nas duas RPCs, leitura autenticada e ausência de INSERT direto na tabela de homologação.
- As outras migrations de novembro não foram aplicadas nesta rodada. Não executar um push geral por divergência dos timestamps já documentados.
- Frontend permanece no checkout local; publicação do aplicativo não foi executada. O banco atualizado não publica as telas. A tentativa de QA visual no domínio publicado chegou à tela de login; nenhum resultado funcional foi registrado como aprovado.

Os itens de escopo e ações de maior consequência continuam no roteiro de QA do responsável. O próximo documento é um plano de correções do morador, não uma declaração de que essa persona está pronta.
