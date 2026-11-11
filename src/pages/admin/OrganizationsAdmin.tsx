import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { OrganizationSettings } from "@/components/admin/OrganizationSettings";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { OrganizationMembers } from "@/components/admin/OrganizationMembers";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  OnboardingRoteiro,
  onboardingProgress,
} from "@/components/admin/OnboardingRoteiro";
import { OrganizationOperations } from "@/components/admin/OrganizationOperations";

const TIPO_LABELS: Record<string, string> = {
  condominio: "Condomínio",
  corporate: "Corporativo",
  professor: "Coach/Professor",
  studio: "Studio",
};

interface Organization {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  onboarding_status: string;
  created_at: string;
  metadata?: any;
  operational_profile?: Record<string, any>;
}

interface Delivery {
  status: string;
  created_at: string;
  error: string | null;
}

interface Invite {
  id: string;
  email: string;
  papel: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  deliveries?: Delivery[];
}

const PAPEL_LABELS: Record<string, string> = {
  sindico: "Síndico",
  professor: "Coach/Professor",
  user: "Morador",
  corporate: "RH / Gestor",
};

export default function OrganizationsAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const { setActiveOrg, refresh, activeOrg } = useOperationalContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invites, setInvites] = useState<Record<string, Invite[]>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!location.hash) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ block: "start" });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, loading]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(
    params.get("organization") || activeOrg?.id || null,
  );

  const [newOrgOpen, setNewOrgOpen] = useState(false);
  const [newOrgNome, setNewOrgNome] = useState("");
  const [newOrgTipo, setNewOrgTipo] = useState("corporate");
  const [creatingOrg, setCreatingOrg] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePapel, setInvitePapel] = useState("sindico");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const selectedOrgRef = useRef(selectedOrg);
  selectedOrgRef.current = selectedOrg;

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, nome, tipo, status, onboarding_status, created_at, metadata, operational_profile",
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar organizações", {
        description: error.message,
      });
    } else {
      setOrganizations((data as Organization[]) ?? []);
      if (!selectedOrg && data && data.length > 0) {
        if (activeOrg && data.some((o) => o.id === activeOrg.id))
          setSelectedOrg(activeOrg.id);
      }
    }
    setLoading(false);
  }, [selectedOrg]);

  const loadInvites = useCallback(async (orgId: string) => {
    const { data, error } = await supabase
      .from("organization_invites")
      .select(
        "id, email, papel, status, token, expires_at, created_at, deliveries:organization_invite_deliveries(status,created_at,error)",
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar convites", { description: error.message });
      return;
    }
    setInvites((prev) => ({ ...prev, [orgId]: (data as Invite[]) ?? [] }));
  }, []);

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInviteEmail("");
    if (selectedOrg) {
      loadInvites(selectedOrg);
      const organization = organizations.find(
        (item) => item.id === selectedOrg,
      );
      if (organization && activeOrg?.id !== organization.id) {
        setActiveOrg({
          id: organization.id,
          nome: organization.nome,
          tipo: organization.tipo as any,
          status: organization.status,
        });
      }
      setInvitePapel(
        organization?.tipo === "corporate"
          ? "corporate"
          : organization?.tipo === "condominio"
            ? "sindico"
            : "professor",
      );
    }
  }, [selectedOrg, loadInvites, organizations]);

  useEffect(() => {
    const requested = params.get("organization");
    if (requested) setSelectedOrg(requested);
  }, [params, organizations]);

  const createOrganization = async () => {
    if (creatingOrg) return;
    if (!newOrgNome.trim()) {
      toast.error("Informe o nome da organização");
      return;
    }
    setCreatingOrg(true);
    const { data, error } = await supabase
      .from("organizations")
      .insert({ nome: newOrgNome.trim(), tipo: newOrgTipo })
      .select("id,nome,tipo,status")
      .single();
    setCreatingOrg(false);
    if (error) {
      toast.error("Erro ao criar organização", { description: error.message });
      return;
    }
    toast.success("Organização criada com sucesso");
    setNewOrgOpen(false);
    setNewOrgNome("");
    await loadOrganizations();
    if (data?.id) {
      await refresh();
      setActiveOrg({
        id: data.id,
        nome: data.nome,
        tipo: data.tipo as any,
        status: data.status,
      });
      setSelectedOrg(data.id);
      navigate(
        "/admin/organizacoes?organization=" + data.id + "&tab=operacao",
        { replace: true },
      );
    }
  };

  const createInvite = async () => {
    if (!selectedOrg || sendingInvite) return;
    const targetOrg = selectedOrg;
    const targetEmail = inviteEmail.trim().toLowerCase();
    if (!targetEmail) {
      toast.error("Informe o e-mail do convidado");
      return;
    }
    setSendingInvite(true);
    const { data, error } = await supabase.rpc("create_organization_invite", {
      p_organization_id: targetOrg,
      p_email: targetEmail,
      p_papel: invitePapel,
    });
    setSendingInvite(false);
    if (error) {
      toast.error("Erro ao criar convite", { description: error.message });
      return;
    }
    toast.success(`Convite criado para ${targetEmail}`, {
      description: "Copie o link e envie ao convidado.",
    });
    if (selectedOrgRef.current === targetOrg) setInviteEmail("");
    if (data?.token) {
      const link = `${window.location.origin}/convite/${data.token}?email=${encodeURIComponent(targetEmail)}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.info("Link do convite copiado");
      } catch {
        // clipboard pode falhar; o link continua disponível na lista
      }
    }
    await loadInvites(targetOrg);
  };

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase.rpc("cancel_organization_invite", {
      p_invite_id: inviteId,
    });
    if (error) {
      toast.error("Erro ao cancelar convite", { description: error.message });
      return;
    }
    toast.success("Convite cancelado");
    if (selectedOrg) await loadInvites(selectedOrg);
  };

  const sendInvite = async (invite: Invite) => {
    if (sendingEmailId) return;
    const targetOrg = selectedOrg;
    setSendingEmailId(invite.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-organization-invite",
        {
          body: {
            inviteId: invite.id,
            token: invite.token,
            email: invite.email,
            papel: invite.papel,
          },
        },
      );
      if (error || data?.error)
        toast.error(data?.error || "Falha ao solicitar envio.");
      else if (data?.sent)
        toast.success("Provedor aceitou o envio. O convite aguarda aceite.");
      else
        toast.info(
          "Provedor não configurado. O link continua disponível para compartilhar.",
        );
      if (targetOrg) await loadInvites(targetOrg);
    } finally {
      setSendingEmailId(null);
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/convite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado");
    } catch {
      toast.info(link);
    }
  };

  const selectedOrgData = organizations.find((o) => o.id === selectedOrg);
  const orgInvites = selectedOrg ? (invites[selectedOrg] ?? []) : [];
  const inviteRoles =
    selectedOrgData?.tipo === "corporate"
      ? [
          { value: "corporate", label: "RH / Gestor" },
          { value: "user", label: "Colaborador" },
        ]
      : selectedOrgData?.tipo === "professor" ||
          selectedOrgData?.tipo === "studio"
        ? [
            { value: "professor", label: "Coach/Professor" },
            { value: "user", label: "Aluno" },
          ]
        : [
            { value: "sindico", label: "Síndico" },
            { value: "professor", label: "Coach/Professor" },
            { value: "user", label: "Morador" },
          ];

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="nl-eyebrow text-primary mb-3">
            Nine Living · Ecossistema
          </p>
          <h1 className="font-display text-4xl tracking-tight">
            Condomínios e organizações.
          </h1>
          <p className="text-muted-foreground">
            Crie condomínios e gere convites para síndicos, coaches e moradores.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Atualizar organizações"
            onClick={loadOrganizations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => navigate("/operacao-9fit")}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar condomínio
          </Button>
          <Dialog open={newOrgOpen} onOpenChange={setNewOrgOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Outra organização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar outra organização</DialogTitle>
                <DialogDescription>
                  Cadastre um parceiro corporativo, professor ou studio.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="org-nome">Nome</Label>
                  <Input
                    id="org-nome"
                    value={newOrgNome}
                    onChange={(e) => setNewOrgNome(e.target.value)}
                    placeholder="Ex.: Central Park Residencial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newOrgTipo} onValueChange={setNewOrgTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="professor">Coach/Professor</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewOrgOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrganization} disabled={creatingOrg}>
                  {creatingOrg && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && organizations.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando
          organizações...
        </div>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum condomínio cadastrado ainda. Crie o primeiro para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organizações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Input
                aria-label="Buscar condomínio ou organização"
                placeholder="Buscar por nome"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <label className="block py-2 text-sm">
                Situação
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="ml-2 rounded border bg-background p-1"
                >
                  <option value="todos">Todas</option>
                  <option value="ativo">Ativas</option>
                  <option value="outros">Inativas ou suspensas</option>
                </select>
              </label>
              {organizations
                .filter(
                  (org) =>
                    org.nome
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()) &&
                    (statusFilter === "todos" ||
                      (statusFilter === "ativo"
                        ? org.status === "ativo"
                        : org.status !== "ativo")),
                )
                .map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      navigate(
                        "/admin/organizacoes?organization=" +
                          org.id +
                          "&tab=operacao",
                        { replace: true },
                      );
                      setSelectedOrg(org.id);
                      setActiveOrg({
                        id: org.id,
                        nome: org.nome,
                        tipo: org.tipo as any,
                        status: org.status,
                      });
                    }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedOrg === org.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{org.nome}</span>
                      <Badge
                        variant={
                          org.status === "ativo" ? "default" : "secondary"
                        }
                      >
                        {TIPO_LABELS[org.tipo] ?? org.tipo}
                      </Badge>
                    </div>
                    {(() => {
                      const p = onboardingProgress(org.metadata);
                      return (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Onboarding {p.done}/{p.total}
                        </p>
                      );
                    })()}
                  </button>
                ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedOrgData && (
              <section className="rounded-xl border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  Organização selecionada
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">
                    {selectedOrgData.nome}
                  </h2>
                  <Badge
                    variant={
                      selectedOrgData.status === "ativo" ? "default" : "outline"
                    }
                  >
                    {selectedOrgData.status}
                  </Badge>
                </div>
                {selectedOrgData.tipo === "condominio" && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        "/operacao-9fit?organization=" +
                          encodeURIComponent(selectedOrgData.id),
                      )
                    }
                  >
                    Retomar implantação guiada
                  </Button>
                )}
              </section>
            )}

            {!selectedOrgData ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Selecione um condomínio ou organização para abrir a
                  implantação.
                </CardContent>
              </Card>
            ) : (
              <Tabs
                key={
                  selectedOrgData.id + ":" + (params.get("tab") || "operacao")
                }
                defaultValue={params.get("tab") || "operacao"}
                onValueChange={(tab) =>
                  navigate(
                    "/admin/organizacoes?organization=" +
                      selectedOrgData.id +
                      "&tab=" +
                      tab,
                    { replace: true },
                  )
                }
              >
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="operacao">1. Conferência</TabsTrigger>
                  <TabsTrigger value="vinculos">2. Pessoas</TabsTrigger>
                  <TabsTrigger value="convites">3. Convites</TabsTrigger>
                  <TabsTrigger value="configuracao">
                    4. Acesso e serviços
                  </TabsTrigger>
                  <TabsTrigger value="onboarding">
                    Roteiro de implantação
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="configuracao">
                  <OrganizationSettings
                    key={selectedOrg}
                    orgId={selectedOrgData.id}
                    onSaved={() => {
                      void loadOrganizations();
                    }}
                  />
                </TabsContent>
                <TabsContent value="vinculos">
                  <OrganizationMembers
                    key={selectedOrg}
                    orgId={selectedOrgData.id}
                  />
                </TabsContent>
                <TabsContent value="operacao">
                  <OrganizationOperations
                    key={selectedOrgData.id}
                    orgId={selectedOrgData.id}
                    orgName={selectedOrgData.nome}
                    profile={selectedOrgData.operational_profile}
                    onProfileSaved={(operational_profile) =>
                      setOrganizations((prev) =>
                        prev.map((o) =>
                          o.id === selectedOrgData.id
                            ? { ...o, operational_profile }
                            : o,
                        ),
                      )
                    }
                  />
                </TabsContent>{" "}
                <TabsContent value="onboarding">
                  <OnboardingRoteiro
                    key={selectedOrgData.id}
                    orgId={selectedOrgData.id}
                    onChange={(metadata) =>
                      setOrganizations((prev) =>
                        prev.map((o) =>
                          o.id === selectedOrgData.id ? { ...o, metadata } : o,
                        ),
                      )
                    }
                  />
                </TabsContent>
                <TabsContent value="convites" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <UserPlus className="h-4 w-4" /> Convidar para{" "}
                        {selectedOrgData.nome}
                      </CardTitle>
                      <CardDescription>
                        O convite é criado no banco e você envia o link ao
                        convidado. Ao aceitar, o acesso da persona é liberado
                        automaticamente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="invite-email">E-mail</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-1 sm:w-48">
                          <Label>Persona</Label>
                          <Select
                            value={invitePapel}
                            onValueChange={setInvitePapel}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {inviteRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={createInvite}
                            disabled={sendingInvite}
                          >
                            {sendingInvite ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="mr-2 h-4 w-4" />
                            )}
                            Gerar convite
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Convites</CardTitle>
                      <CardDescription>
                        Convites gerados para esta organização.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {orgInvites.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Nenhum convite criado ainda.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {orgInvites.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {inv.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {PAPEL_LABELS[inv.papel] ?? inv.papel} ·
                                  criado em{" "}
                                  {new Date(inv.created_at).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    inv.status === "aceito"
                                      ? "default"
                                      : inv.status === "pendente"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {inv.status}
                                </Badge>
                                {(() => {
                                  const latest = [
                                    ...(inv.deliveries ?? []),
                                  ].sort((a, b) =>
                                    b.created_at.localeCompare(a.created_at),
                                  )[0];
                                  const labels: Record<string, string> = {
                                    sent: "Envio aceito pelo provedor",
                                    failed: "Falha no envio",
                                    not_configured: "Provedor não configurado",
                                  };
                                  return (
                                    <span className="text-xs text-muted-foreground">
                                      {latest
                                        ? (labels[latest.status] ??
                                          latest.status)
                                        : "Envio ainda não solicitado"}
                                    </span>
                                  );
                                })()}
                                {inv.status === "pendente" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => copyInviteLink(inv.token)}
                                      title="Copiar link do convite"
                                      aria-label="Copiar link do convite"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={!!sendingEmailId}
                                      onClick={() => sendInvite(inv)}
                                    >
                                      {sendingEmailId === inv.id
                                        ? "Solicitando envio…"
                                        : "Enviar por e-mail"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => cancelInvite(inv.id)}
                                      title="Cancelar convite"
                                      aria-label="Cancelar convite"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
