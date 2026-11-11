# Nine Living — direção de arte aplicada ao software

Data: 10/11/2026. Direção adotada: clube residencial contemporâneo, acolhedor e preciso. Aplicação no checkout local; sem publicação do frontend nesta rodada.

## Identidade

- Verde profundo para orientação e ações principais; marfim no fundo; verde claro para acentos. Cores de alerta preservam significado operacional.
- Manrope para leitura e interface; DM Serif Display para aberturas editoriais; números e controles legíveis. Corrigidos os imports e aliases conflitantes das fontes.
- Marca tipográfica Nine Living com símbolo 9, traços geométricos e composição de movimento em CSS/SVG. Sem dependência de fotografia decorativa.
- Bordas delicadas, sombras discretas, cantos consistentes e espaçamento mais generoso. Hierarquia por contraste e composição.

## Aplicação por persona

| Persona | Aplicação no código |
| --- | --- |
| Morador | Abertura personalizada; CTA real para o treino quando disponível; cartão de treino destacado; rotina em grade no desktop; barra de progresso; navegação inferior no celular |
| Coach | Abertura própria; títulos específicos de atendimento, moradores, agenda e biblioteca; navegação evidente e consistência nos componentes de montagem e execução |
| Síndico | Condomínio como abertura principal; ações e indicadores com acabamento compartilhado; quatro destinos preservados |
| Admin | Sidebar, contexto, cabeçalhos operacionais, métricas e listagem de condomínios refinados; implantação guiada usa a mesma linguagem |

Componentes compartilhados atualizados: PersonaLayout, PageIntro, LivingMark, cards, botões, campos, PageShell, MetCard, Sidebar e ContextSwitcher. Layouts de subpáginas herdam a base visual; a revisão estética individual de cada formulário não foi declarada como aprovada.

## Navegação e acessibilidade

Estado atual visível com texto, ícone e contraste. Corrigido o destaque do destino do morador ao variar parâmetros e subpáginas; síndico mantém categoria ativa em subrotas. Contextos, permissões e rotas continuam os existentes.

Navegação de quatro destinos na base da tela no celular, com espaço reservado no conteúdo e respeito à safe area. Cabeçalho móvel compacto. Link de salto ao conteúdo, foco visível, controles nativos, responsividade e animação de entrada condicionada à preferência de movimento reduzido. O acabamento não substitui a homologação de acessibilidade com leitores de tela e dispositivos reais.

## Prévia e evidências

A prévia local `design-review.html` usa os componentes e tokens compartilhados com exemplos de composição. Está explicitamente identificada como **dados ilustrativos**: números, pessoas, aulas e cards desse ambiente não representam o banco. Ela não faz parte das rotas do aplicativo e não é entrada do build de produção.

A prévia está disponível enquanto o servidor local estiver ativo em http://127.0.0.1:5178/design-review.html. Os seletores superiores alternam as quatro direções de composição. As ações de negócio na prévia são apenas representação visual.

Capturas em `docs/design/`: morador-desktop.jpg, morador-mobile.jpg, coach-desktop.jpg, sindico-desktop.jpg, admin-desktop.jpg. Conferência no navegador da prévia desktop e breakpoint de 390 × 844; viewport temporário restaurado ao final. Não foi acessada sessão autenticada para simular QA completa do produto.

## Verificação e entrega

TypeScript, lint dos arquivos alterados e build de produção. Verificado que a prévia de dados ilustrativos não foi exportada como página de produção. Permanecem avisos já existentes de bundle grande, import misto e Browserslist antigo.

Nenhuma migration, alteração de permissão ou mudança de dados nesta etapa visual. Publicar o frontend deste checkout para ver a direção no domínio do produto. Depois conferir com contas reais os textos longos, estados vazios/erro, formulários, teclado, zoom, navegação e telas de execução.
