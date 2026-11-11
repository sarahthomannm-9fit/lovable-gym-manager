import { LivingMark, PageIntro } from "@/components/visual/LivingIdentity";
import { confirmResidentNavigation } from "@/hooks/useResidentDraftGuard";
import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  ArrowLeftRight,
  Building2,
  GraduationCap,
  Briefcase,
  User,
  LayoutDashboard,
  Bot,
  Network,
  ClipboardCheck,
  Calendar,
  Dumbbell,
  MessageSquare,
} from "lucide-react";

const ICONS: Record<string, any> = {
  user: User,
  sindico: Building2,
  professor: GraduationCap,
  corporate: Briefcase,
  condominio: Building2,
  studio: GraduationCap,
};

type NavLink = { label: string; path: string; icon: any; accent: string };

const PERSONA_LINKS: NavLink[] = [
  {
    label: "Síndico",
    path: "/sindico",
    icon: Building2,
    accent: "hsl(var(--primary))",
  },
  {
    label: "Coach",
    path: "/coach",
    icon: GraduationCap,
    accent: "hsl(var(--primary))",
  },
  {
    label: "Corporativo",
    path: "/corp",
    icon: Briefcase,
    accent: "hsl(var(--primary))",
  },
  {
    label: "Morador",
    path: "/morador",
    icon: User,
    accent: "hsl(var(--primary))",
  },
];

export function PersonaLayout({
  title,
  subtitle,
  accent = "hsl(var(--primary))",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
}) {
  const { activeOrg, activeRole, memberships, isAdmin, setActiveOrg } =
    useOperationalContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const Icon = ICONS[activeRole as string] || Building2;

  // Org options visible to user: memberships + (admin only) any saved active org
  const coachSurface =
    location.pathname.startsWith("/coach") ||
    (activeRole === "professor" &&
      ["/treinos", "/planos-treino"].includes(location.pathname));
  const surfaceRole = location.pathname.startsWith("/sindico")
    ? "sindico"
    : coachSurface
      ? "professor"
      : location.pathname.startsWith("/morador")
        ? "user"
        : location.pathname.startsWith("/corp")
          ? "corporate"
          : null;
  const orgOptions = Array.from(
    new Map(
      memberships
        .filter((m) => isAdmin || !surfaceRole || m.papel === surfaceRole)
        .map((m) => [m.organization.id, m.organization]),
    ).values(),
  );
  if (activeOrg && !orgOptions.find((o) => o.id === activeOrg.id))
    orgOptions.unshift(activeOrg);

  const previewSurface =
    isAdmin &&
    ["/morador", "/coach", "/sindico", "/corp"].some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/"),
    );
  const syndicSurface = location.pathname.startsWith("/sindico");
  const residentSurface = location.pathname.startsWith("/morador");

  // Persona links visible: admin sees all; non-admin sees only those matching memberships
  const visiblePersonas = PERSONA_LINKS.filter(
    (link) =>
      location.pathname === link.path ||
      location.pathname.startsWith(link.path + "/") ||
      (coachSurface && link.path === "/coach"),
  );

  const sectionLinks: NavLink[] = residentSurface
    ? [
        { label: "Hoje", path: "/morador", icon: LayoutDashboard, accent },
        {
          label: "Treino",
          path: "/morador?tab=treino",
          icon: Dumbbell,
          accent,
        },
        { label: "Agenda", path: "/morador/agenda", icon: Calendar, accent },
        { label: "Mais", path: "/morador?tab=mais", icon: User, accent },
      ]
    : syndicSurface
      ? [
          {
            label: "Meu condomínio",
            path: "/sindico",
            icon: Building2,
            accent,
          },
          {
            label: "Eventos",
            path: "/sindico/health-day",
            icon: Calendar,
            accent,
          },
          {
            label: "Comunicação",
            path: "/sindico/comunicados",
            icon: MessageSquare,
            accent,
          },
          {
            label: "Atendimento",
            path: "/sindico/operacao",
            icon: ClipboardCheck,
            accent,
          },
        ]
      : coachSurface
        ? [
            {
              label: "Atendimentos",
              path: "/coach",
              icon: ClipboardCheck,
              accent,
            },
            {
              label: "Moradores",
              path: "/coach?view=moradores",
              icon: User,
              accent,
            },
            {
              label: "Agenda",
              path: "/coach?view=agenda",
              icon: Calendar,
              accent,
            },
            {
              label: "Biblioteca",
              path: "/coach?view=biblioteca",
              icon: Dumbbell,
              accent,
            },
          ]
        : [];

  if (
    location.pathname.startsWith("/admin") ||
    location.pathname === "/operacao-9fit"
  ) {
    return (
      <section className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageIntro
          compact
          tone="paper"
          eyebrow={activeOrg?.nome || "Administração Nine Living"}
          title={title}
          description={subtitle}
        />
        {children}
      </section>
    );
  }

  return (
    <div
      className="nl-shell text-foreground"
      data-persona={surfaceRole || "admin"}
    >
      <a href="#nl-main" className="nl-skip">
        Ir para o conteúdo
      </a>
      <header className="nl-topbar">
        <div className="nl-topbar-inner">
          <div className="flex items-center gap-3 min-w-0">
            <LivingMark />
            <div className="min-w-0">
              <p className="nl-wordmark">NINE LIVING</p>
              {previewSurface && (
                <p className="text-xs text-amber-600">
                  Pré-visualização administrativa desta persona
                </p>
              )}
              <p className="nl-brand-caption">Saúde · Movimento · Comunidade</p>
              {(activeOrg || subtitle) && (
                <p className="nl-context-name">{activeOrg?.nome || subtitle}</p>
              )}
            </div>
          </div>

          <div className="nl-account flex items-center gap-2 flex-wrap">
            <span className="nl-persona-label">
              {residentSurface
                ? "Morador"
                : coachSurface
                  ? "Coach"
                  : syndicSurface
                    ? "Síndico"
                    : "Nine Living"}
            </span>
            {orgOptions.length > 1 && (
              <Select
                value={activeOrg?.id || ""}
                onValueChange={(id) => {
                  const o = orgOptions.find((x) => x.id === id);
                  if (
                    o &&
                    (!(residentSurface || coachSurface || syndicSurface) ||
                      confirmResidentNavigation())
                  )
                    setActiveOrg(o);
                }}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="Org" />
                </SelectTrigger>
                <SelectContent>
                  {orgOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(memberships.length > 1 || isAdmin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/select-context")}
              >
                <ArrowLeftRight className="w-4 h-4 mr-1" /> Trocar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (
                  !(residentSurface || coachSurface || syndicSurface) ||
                  confirmResidentNavigation()
                )
                  void signOut();
              }}
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Nav strip */}
        <nav className="nl-navigation" aria-label="Navegação principal">
          <div className="nl-nav-track">
            {[
              ...(residentSurface || coachSurface || syndicSurface
                ? []
                : visiblePersonas),
              ...sectionLinks,
            ].map((l) => {
              const I = l.icon;
              const query = new URLSearchParams(location.search);
              const tab = query.get("tab") || "hoje";
              const active = residentSurface
                ? l.path === "/morador"
                  ? location.pathname === "/morador" && tab === "hoje"
                  : l.path.includes("tab=treino")
                    ? location.pathname === "/morador" && tab === "treino"
                    : l.path === "/morador/agenda"
                      ? location.pathname === "/morador/agenda" ||
                        tab === "aulas"
                      : l.path.includes("tab=mais") &&
                        location.pathname !== "/morador/agenda" &&
                        !(
                          location.pathname === "/morador" &&
                          ["hoje", "treino", "aulas"].includes(tab)
                        )
                : syndicSurface
                  ? l.path === "/sindico"
                    ? location.pathname === l.path
                    : location.pathname.startsWith(l.path)
                  : coachSurface
                    ? l.path ===
                      "/coach" +
                        (query.get("view") ? "?view=" + query.get("view") : "")
                    : location.pathname + location.search === l.path;
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  aria-current={active ? "page" : undefined}
                  className="nl-nav-link"
                >
                  <I className="w-3.5 h-3.5" /> {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main id="nl-main" className="nl-content">
        {activeOrg &&
        ["suspenso", "suspended"].includes(
          String(activeOrg.status).toLowerCase(),
        ) &&
        !isAdmin ? (
          <div className="border border-destructive/40 bg-destructive/10 rounded-sm p-8 text-center">
            <p className="font-display text-lg mb-1">Acesso suspenso</p>
            <p className="text-sm text-muted-foreground">
              O acesso de {activeOrg.nome} está temporariamente suspenso. Fale
              com a administração do seu condomínio.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export function PersonaEmptyState({
  message = "Selecione uma organização para visualizar este painel.",
}: {
  message?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="border border-dashed border-border/40 rounded-sm p-10 text-center bg-card">
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button onClick={() => navigate("/select-context")} variant="outline">
        <ArrowLeftRight className="w-4 h-4 mr-1" /> Selecionar contexto
      </Button>
    </div>
  );
}
