# Correções gerais — consolidação das quatro personas

Data: 10/11/2026. Admin, morador, coach e síndico têm implementação no checkout. Este documento registra o fechamento compartilhado e as pendências de entrega; não declara sistema homologado.

| Prioridade | Frente | Ação de fechamento | Evidência de aceite |
| --- | --- | --- | --- |
| P0 | Publicação | Publicar o frontend que contém as quatro frentes | Versão exibida corresponde ao checkout; domínio abre a nova navegação de cada persona |
| P0 | Operação real | Preparar condomínio, infraestrutura, responsáveis e vínculos; ativar pelo fluxo administrativo | Conta real de cada papel acessa apenas seu escopo; nenhum bypass de status |
| P0 | Jornada integrada | Executar preparação → convite → triagem → revisão coach → treino → sessão → agregado síndico | Registros relacionados e visões coerentes; saúde individual não aparece para síndico |
| P0 | Segurança legada | Revisar funções privilegiadas expostas, configuração Auth e patches do Postgres apontados pelo advisor | Correções avaliadas por dependência, sem revogação indiscriminada que quebre jornadas |
| P0 | Banco pendente | Reconciliar migration local fitness_delivery_readiness com histórico remoto antes de aplicar | Contrato revisado, testes SQL e implantação explícita; não fazer push geral de migrations |
| P1 | QA por persona | Executar checklists de cada documento e matriz de design coach | Evidências com conta, condomínio, versão, resultado e falhas reproduzíveis |
| P1 | Navegação | Medir acesso às tarefas em até três cliques, teclado e celular | Percursos observados; preenchimento e decisões não contados como simples abertura |
| P1 | Resiliência | Rede lenta, resposta perdida, clique duplo, retorno e troca de contexto | Sem duplicação, mistura de dados ou confirmação sem servidor |
| P1 | Evento e rotina | Ensaiar volume operacional real e acompanhamento 7/30 dias | Capacidade definida pela equipe; 80 apartamentos não tratados como 80 pessoas |
| P1 | Desempenho | Avaliar bundle, consultas e dispositivos de uso; aplicar divisão de código conforme medição | Comparação antes/depois e orçamento de carregamento |

Registros específicos: ENTREGA_MORADOR_2026-11-10.md, ENTREGA_COACH_2026-11-10.md e ENTREGA_SINDICO_2026-11-10.md; planos em personas/01_ADMIN.md a 04_SINDICO.md. A QA foi atribuída pelo usuário a ele próprio. Não há garantia de ausência de falhas sem executar esses aceites.

## Atualização da jornada integrada

Alternativas aprovadas, prescrição por sessão, execução parcial, retomada, acompanhamento e disponibilidade de equipamentos foram implementados. Ver [entrega integrada](../ENTREGA_JORNADA_INTEGRADA_2026-11-10.md). A linha de QA integrada permanece pendente de homologação pelo responsável, após publicação do frontend.

## Preparação da publicação completa

A migration fitness_delivery_readiness foi conferida e aplicada antes do envio ao GitHub, incluindo exclusão de sessões parciais do indicador de conclusão. O teste real retornou sete critérios autorizados. A dependência de banco dessa linha foi resolvida; publicação e versão efetivamente servida são registradas em REGISTRO_PUBLICACAO_2026-11-10.md.
