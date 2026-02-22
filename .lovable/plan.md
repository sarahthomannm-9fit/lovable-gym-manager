

# Ajustes FitManage - Plano de Implementacao

## 1. CADASTRO DE ALUNOS

### 1.1 Migracao de Banco de Dados

Adicionar 2 novas colunas na tabela `alunos`:

- `dias_aula` (ARRAY de text, default '{}') -- ex: ['segunda', 'quarta', 'sexta']
- `dia_pagamento` (integer, nullable) -- dia do mes para cobranca (1-31)
- `categoria_aluno` (text, default 'fixo') -- valores: 'fixo', 'variavel', 'experimental'

O campo `tipo` ja existe com valores 'presencial' | 'consultoria' -- sera mantido e expandido na UI.

### 1.2 Atualizar AddStudentDialog.tsx

Novos campos no formulario:

- **Dias de Aula**: checkboxes para Seg/Ter/Qua/Qui/Sex/Sab (multi-select), salva como array em `dias_aula`
- **Categoria do Aluno**: Select com opcoes "Fixo", "Variavel", "Experimental"
- **Modalidade**: Select com "Presencial" e "Consultoria" (campo `tipo` existente)
- **Dia do Pagamento**: Input numerico (1-31) para definir quando a cobranca vence
- **Formas de Pagamento expandidas**: Adicionar "Boleto" e "Cartao de Credito Recorrente" ao Select existente (total: PIX, Cartao, Dinheiro, Transferencia, Boleto, Credito Recorrente)

Remover o checkbox "Incluir pacote mensal" e substituir pela logica de plano vinculado (o plano ja define quantidade de aulas).

### 1.3 Atualizar EditStudentDialog.tsx

- Mesmos campos novos do AddStudentDialog
- Corrigir bug: esta importando `Student` de `types/gym.ts` (tipo legado com id: number) -- migrar para usar `SupabaseStudent`

### 1.4 Atualizar useSupabaseStudents.ts

- Adicionar `dias_aula`, `dia_pagamento`, `categoria_aluno` ao tipo `SupabaseStudent`
- Expandir tipo do campo `tipo` para incluir 'consultoria' | 'presencial'

### 1.5 Alerta de Cobranca (2 dias antes)

Atualizar `useSmartAlerts.ts` para gerar alerta quando `dia_pagamento` do aluno estiver a 2 dias de distancia. O alerta aparece no Painel principal.

---

## 2. PLANOS

### 2.1 Atualizar AddPlanDialog.tsx

Adicionar campo **Tipo de Plano** com opcoes:
- Mensal
- Trimestral
- Semestral
- Anual
- Pacote de Aulas (quantidade fixa)
- Consultoria Online
- Avulso (aula unica)

Esses valores serao salvos no campo `tipo` da tabela `planos` (ja existe).

Adicionar campo **Quantidade de Aulas** (input numerico) vinculado ao tipo -- quando for "Pacote de Aulas", esse campo e obrigatorio.

O campo `duracao_meses` continua existindo para planos baseados em tempo. O campo `duracao_dias` sera calculado automaticamente.

---

## 3. PRODUTOS

### 3.1 Atualizar AddProductDialog.tsx

Substituir os tipos de produto atuais (App Mobile, Software, Servicos, Produtos) por tipos relevantes para academia/personal:

- **Suplemento** (icone: Pill)
- **Acessorio Fitness** (icone: Dumbbell)
- **Roupa/Vestuario** (icone: Shirt)
- **Equipamento** (icone: Package)

Remover "Consultoria" como tipo de produto (sera tratado como tipo de plano).

### 3.2 Atualizar Produtos.tsx

Atualizar as funcoes `getTipoIcon` e `getTipoLabel` para refletir os novos tipos.

---

## 4. FUNCIONARIOS

### 4.1 Migracao de Banco de Dados

Adicionar coluna na tabela `funcionarios`:
- `comissao_percentual` (numeric, nullable) -- percentual de comissao para agentes comerciais

### 4.2 Atualizar Funcionarios.tsx e useFuncionarios.ts

- Adicionar cargo "Agente Comercial" a lista de cargos
- Atualizar tipo `Funcionario['cargo']` para incluir 'agente_comercial'
- Adicionar campo **Comissao (%)** no formulario, visivel apenas quando cargo = 'agente_comercial' ou 'personal'
- Adicionar cor do badge para agente_comercial

---

## 5. AVALIACOES FISICAS

### 5.1 Atualizar AvaliacoesFisicas.tsx

Adicionar 3 campos de data no formulario de nova avaliacao:

- **Data da Avaliacao** (ja existe)
- **Data de Entrega** (novo campo -- quando o resultado sera entregue ao aluno)
- **Data do Programa** (novo campo -- quando o programa de treino baseado na avaliacao comeca)
- **Proxima Avaliacao** (campo `proxima_avaliacao` ja existe na tabela mas nao esta no form)

### 5.2 Alerta de Renovacao

Atualizar `useSmartAlerts.ts` para gerar alertas quando:
- `proxima_avaliacao` estiver a 7 dias ou menos
- `proxima_avaliacao` ja passou (avaliacao vencida)

Exibir esses alertas no Painel e no card da avaliacao.

### 5.3 Migracao de Banco de Dados

Adicionar colunas na tabela `avaliacoes_fisicas`:
- `data_entrega` (date, nullable)
- `data_programa` (date, nullable)

---

## 6. TREINOS

### 6.1 Criar AddTrainingDialog.tsx

Novo componente com:
- Select de aluno (lista de alunos ativos do Supabase)
- Textarea para descricao do treino
- Date picker para data inicio e data fim
- Botao salvar que insere na tabela `treinos`

### 6.2 Atualizar Treinos.tsx

- Conectar o botao "Novo Treino" ao AddTrainingDialog
- Conectar o botao "Criar Primeiro Treino" ao mesmo dialog
- Exibir na listagem qual aluno tem qual treino ativo (ja mostra, mas adicionar badge de status mais claro)
- A Sarah (ou qualquer usuario) vera todos os treinos de cada aluno na pagina

---

## Secao Tecnica - Resumo de Mudancas

### Migracoes SQL

```text
ALTER TABLE alunos ADD COLUMN dias_aula text[] DEFAULT '{}';
ALTER TABLE alunos ADD COLUMN dia_pagamento integer;
ALTER TABLE alunos ADD COLUMN categoria_aluno text DEFAULT 'fixo';
ALTER TABLE funcionarios ADD COLUMN comissao_percentual numeric;
ALTER TABLE avaliacoes_fisicas ADD COLUMN data_entrega date;
ALTER TABLE avaliacoes_fisicas ADD COLUMN data_programa date;
```

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/training/AddTrainingDialog.tsx` | Dialog para criar novo treino |

### Arquivos a Atualizar

| Arquivo | Mudancas |
|---------|----------|
| `src/hooks/useSupabaseStudents.ts` | Adicionar dias_aula, dia_pagamento, categoria_aluno ao tipo |
| `src/components/students/AddStudentDialog.tsx` | Novos campos: dias_aula, categoria_aluno, dia_pagamento, formas pagamento expandidas |
| `src/components/students/EditStudentDialog.tsx` | Mesmos campos novos + migrar de Student para SupabaseStudent |
| `src/hooks/useFuncionarios.ts` | Adicionar 'agente_comercial' ao tipo cargo, comissao_percentual |
| `src/pages/Funcionarios.tsx` | Adicionar cargo Agente Comercial e campo comissao |
| `src/pages/AvaliacoesFisicas.tsx` | Adicionar campos data_entrega, data_programa, proxima_avaliacao |
| `src/hooks/useAvaliacoesFisicas.ts` | Adicionar data_entrega, data_programa ao tipo |
| `src/components/AddProductDialog.tsx` | Novos tipos: suplemento, acessorio, roupa, equipamento |
| `src/pages/Produtos.tsx` | Atualizar getTipoIcon/getTipoLabel |
| `src/components/plans/AddPlanDialog.tsx` | Adicionar tipo de plano (mensal, trimestral, pacote, consultoria, avulso) |
| `src/pages/Treinos.tsx` | Integrar AddTrainingDialog no botao |
| `src/hooks/useSmartAlerts.ts` | Alertas de cobranca (2 dias antes) e renovacao de avaliacao |

