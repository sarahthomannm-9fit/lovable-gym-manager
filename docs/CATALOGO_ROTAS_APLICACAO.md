# Catálogo atual de rotas — Nine Living

Extraído de src/App.tsx em 26/10/2026 após a implementação. Papéis de rota respeitam a organização ativa; admin pode visualizar personas. A autorização de dados também depende das políticas/RPCs do servidor.

| Rota | Guarda | Componentes |
|---|---|---|
| `/login` | Pública / redirecionamento | Login |
| `/forgot-password` | Pública / redirecionamento | ForgotPassword |
| `/reset-password` | Pública / redirecionamento | ResetPassword |
| `/anamnese/:token` | Pública / redirecionamento | Anamnese |
| `/entrada` | Pública / redirecionamento | ResidentEntry |
| `/convite/:token` | Pública / redirecionamento | AcceptInvite |
| `/convite-coach/:token` | Pública / redirecionamento | AcceptInvite |
| `/primeiro-acesso` | Sessão | ProtectedRoute, FirstAccess |
| `/select-context` | Sessão | ProtectedRoute, SelectContext |
| `/sindico` | Sessão + 'sindico','admin' | ProtectedRoute, RoleRoute, SindicoHome |
| `/sindico/health-day` | Sessão + 'sindico','admin' | ProtectedRoute, RoleRoute, HealthDay |
| `/sindico/operacao` | Sessão + 'sindico','admin' | ProtectedRoute, RoleRoute, SindicoOperacao |
| `/sindico/comunicados` | Sessão + 'sindico','admin' | ProtectedRoute, RoleRoute, Announcements |
| `/coach` | Sessão + 'professor','admin' | ProtectedRoute, RoleRoute, CoachHome |
| `/coach/revisoes` | Sessão + 'professor','admin' | ProtectedRoute, RoleRoute, ReviewQueue |
| `/corp` | Sessão + 'corporate','admin' | ProtectedRoute, RoleRoute, CorpHome |
| `/morador` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, MoradorHome |
| `/morador/onboarding` | Sessão | ProtectedRoute, OnboardingMorador |
| `/morador/eventos` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, Events |
| `/morador/perfil` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, MoradorProfile |
| `/morador/agenda` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, MoradorAgenda |
| `/morador/staff` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, MoradorStaff |
| `/morador/operacao` | Sessão + 'user','admin' | ProtectedRoute, RoleRoute, MoradorOperacao |
| `/admin/solicitacoes` | Sessão + admin | AdminOnly, Requests |
| `/admin/vinculos` | Sessão + admin | AdminOnly, VinculosOrfaos |
| `/admin/organizacoes` | Sessão + admin | AdminOnly, OrganizationsAdmin |
| `/admin/auditoria-prescricoes` | Sessão + admin | AdminOnly, PrescriptionAudit |
| `/admin/auditoria-acessos` | Sessão + admin | AdminOnly, AccessAudit |
| `/admin/aprovacoes-workflows` | Sessão + admin/manager | StaffOnly, WorkflowApprovals |
| `/admin/fitpro` | Sessão + admin | AdminOnly, FitProIntegration |
| `/operacao-9fit` | Sessão + admin/manager | StaffOnly, Operacao |
| `/cfo/leads` | Sessão + admin | AdminOnly, LeadsExtractionPlan |
| `/pipeline` | Sessão + admin/manager | StaffOnly, PipelineComercial |
| `/clientes` | Sessão + admin/manager | Protected, Clientes |
| `/contratos` | Sessão + admin/manager | Protected, Contratos |
| `/planos-treino` | Sessão + admin/manager/professor | TrainingAccess, PlanosTreino |
| `/studio` | Sessão + 'admin','manager','professor' | ProtectedRoute, RoleRoute, MainLayout, StudioHome |
| `/insights` | Sessão + admin/manager | Protected, InsightsMercado |
| `/coaches` | Sessão + admin/manager | StaffOnly, Funcionarios |
| `/` | Pública / redirecionamento | Navigate |
| `/home` | Sessão + admin/manager | Protected, Home |
| `/mercados/:tipo` | Sessão + admin/manager | Protected, MercadoLista |
| `/relatorios/automaticos` | Sessão + admin | AdminOnly, RelatoriosAutomaticos |
| `/agents` | Sessão + admin/manager | StaffOnly, AgentsHub |
| `/admin/usuarios` | Sessão + admin | AdminOnly, UsersAdmin |
| `/admin/reset-demo` | Sessão + admin | AdminOnly, ResetDemoData |
| `/painel` | Sessão + admin/manager | StaffOnly, Painel |
| `/painel/inadimplencia` | Sessão + admin/manager | StaffOnly, Inadimplencia |
| `/painel/retencao` | Sessão + admin/manager | StaffOnly, Retencao |
| `/painel/agenda` | Sessão + admin/manager | StaffOnly, AgendaSemanal |
| `/painel/pipeline` | Sessão + admin/manager | StaffOnly, Pipeline |
| `/alunos` | Sessão + admin/manager | Protected, SupabaseStudents |
| `/planos` | Sessão + admin/manager | Protected, SupabasePlans |
| `/aulas` | Sessão + admin/manager | StaffOnly, SupabaseClasses |
| `/pagamentos` | Sessão + admin/manager | Protected, SupabasePayments |
| `/checkin` | Sessão + admin/manager | Protected, SupabaseCheckIn |
| `/equipamentos` | Sessão + admin/manager | Protected, Equipment |
| `/treinos` | Sessão + admin/manager/professor | TrainingAccess, Treinos |
| `/relatorios` | Sessão + admin/manager | StaffOnly, Relatorios |
| `/relatorios/pagamentos` | Sessão + admin/manager | StaffOnly, FluxoPagamentos |
| `/relatorios/recebimentos` | Sessão + admin/manager | StaffOnly, FluxoRecebimentos |
| `/relatorios/cobrancas` | Sessão + admin/manager | StaffOnly, Cobrancas |
| `/relatorios/estrategias` | Sessão + admin/manager | StaffOnly, EstrategiasIA |
| `/relatorios/promocoes-cupons` | Sessão + admin/manager | StaffOnly, PromocoesCupons |
| `/marketing/campanhas` | Sessão + admin/manager | Protected, Campanhas |
| `/marketing/captacao` | Sessão + admin/manager | Protected, Captacao |
| `/marketing/comunicacao` | Sessão + admin/manager | Protected, Comunicacao |
| `/marketing/conversao` | Sessão + admin/manager | Protected, Conversao |
| `/marketing/funis` | Sessão + admin/manager | Protected, Funis |
| `/marketing/email` | Sessão + admin/manager | Protected, EmailMarketing |
| `/marketing/promocoes` | Sessão + admin/manager | Protected, Promocoes |
| `/marketing/insights-ia` | Sessão + admin/manager | Protected, InsightsIA |
| `/marketing/automacao` | Sessão + admin/manager | Protected, Automacao |
| `/agente-ia` | Sessão + admin/manager | Protected, AgenteIA |
| `/catalogo` | Sessão + admin/manager | Protected, Catalogo |
| `/produtos` | Sessão + admin/manager | Protected, Produtos |
| `/9fit` | Sessão + admin/manager | Protected, Dashboard |
| `/9fit/ceo` | Sessão + admin | AdminOnly, CEODashboard |
| `/9fit/consultoria` | Sessão + admin/manager | Protected, ConsultoriaDashboard |
| `/9fit/concierge` | Sessão + admin/manager | Protected, ConciergeDashboard |
| `/9fit/trust` | Sessão + admin/manager | Protected, TrustDashboard |
| `/9fit/network` | Sessão + admin/manager | Protected, NetworkDashboard |
| `/9fit/automation` | Sessão + admin/manager | Protected, AutomationDashboard |
| `/9fit/store` | Sessão + admin/manager | Protected, StoreDashboard |
| `/funcionarios` | Sessão + admin/manager | StaffOnly, Funcionarios |
| `/avaliacoes` | Sessão + admin/manager | StaffOnly, AvaliacoesFisicas |
| `/experimentais` | Sessão + admin/manager | StaffOnly, AulasExperimentais |
| `*` | Pública / redirecionamento | NotFound |

Detalhes de ações e QA: [matriz de personas](MATRIZ_PERFIS_TELAS_DADOS_ACESSOS.md).
