# Direção de produto e interface Nine Living

## Análise macro

A navegação reúne cadastro, operação, relatórios e módulos comerciais. O menu precisa agrupar essas camadas sem fazer o usuário percorrê-las a cada visita. O layout deve ter uma ação principal identificável, estados de espera na página de entrada e indicadores com período e denominador claros.

A interface compartilha tipografia, espaçamento, foco visível, estados de carregamento e recuperação. A hierarquia muda por perfil. O contexto do condomínio precisa permanecer visível e os controles de acesso precisam continuar no servidor.

## Diagnóstico e intervenção por persona

| Persona | Problema observado no código | Mudança específica | Aceite |
| --- | --- | --- | --- |
| Admin | Menu extenso e primeiro contato com jargão de gestão técnica | Cadastro guiado e infraestrutura integrados; grupos secundários recolhidos; atalhos de cadastro, condomínios e solicitações no painel; métricas responsivas | Admin encontra um condomínio, cria outro e retoma configuração sem procurar módulos. No celular, métricas permanecem legíveis |
| Morador | Sem treino, a tela Hoje pode omitir o próximo passo. A ação de treino também aparece em dia sem sessão | Estado e ação da triagem na tela Hoje; distinção entre sessão concluída, sessão disponível e dia sem sessão; navegação com quebra no celular | Morador explica o próximo passo sem ajuda. Em dia sem sessão, o botão não inicia treino. Progresso e retomada seguem funcionais |
| Coach | Resumo tem pouca informação operacional e o caminho até as revisões depende de procurar na lista | Entrada na fila, ações de atendimento e acompanhamento; atalhos de moradores e planos próximos do vencimento | Professor passa da pendência ao aluno ou plano correspondente e publica conferindo a prescrição |
| Síndico | Blocos de implantação e indicadores competem com a rotina. Cabeçalho financeiro precisava seguir a mesma permissão dos demais dados | Implantação recolhida, atalhos para evento/comunicados/serviços e linguagem de moradores. Zero de adesão aparece como zero quando há base | Síndico localiza uma ação e distingue adesão zero de ausência de base. Perfil consultivo recebe apenas informação autorizada |

## Sistema visual

- Títulos expressam a tarefa da página. Descrições explicam o próximo passo.
- Navegação primária organiza o trabalho. Grupos secundários ficam disponíveis por expansão.
- Cartões de ação usam verbo e destino claros. Métricas têm rótulos explícitos.
- Cor acompanha texto de estado. Botões e links devem ser operáveis por teclado e ter foco visível.
- Listas, métricas e navegação adaptam-se ao celular. Espaçamento separa decisões principais dos detalhes.

## Validação ainda necessária

A análise desta rodada foi feita no código. É preciso conferir a renderização e a operação com cada perfil, em celular e desktop, e verificar a versão publicada. As mudanças locais e os testes técnicos não confirmam que o domínio acessado pelo usuário recebeu a atualização.

## Correções de interpretação dos dados

O painel administrativo exibe receita mensal e proporção de cadastros inativos com rótulos correspondentes aos cálculos existentes. A lista legada de anamneses do coach exclui capturas da Portaria que já pertencem ao fluxo novo de fila, para evitar duas contagens do mesmo envio. A homologação deve conferir a contagem com um caso legado e um caso moderno.
