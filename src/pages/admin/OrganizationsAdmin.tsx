import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Copy, Loader2, Mail, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";

interface Organization {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  onboarding_status: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  papel: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
}

const PAPEL_LABELS: Record<string, string> = {
  sindico: "Síndico",
  professor: "Coach/Professor",
  user: "Morador",
};

export default function OrganizationsAdmin() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invites, setInvites] = useState<Record<string, Invite[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const [newOrgOpen, setNewOrgOpen] = useState(false);
  const [newOrgNome, setNewOrgNome] = useState("");
  const [newOrgTipo, setNewOrgTipo] = useState("condominio");
  const [creatingOrg, setCreatingOrg] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePapel, setInvitePapel] = useState("sindico");
  const [sendingInvite, setSendingInvite] = useState(false);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations")
      .select("id, nome, tipo, status, onboarding_status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar organizações", { description: error.message });
    } else {
      setOrganizations((data as Organization[]) ?? []);
      if (!selectedOrg && data && data.length > 0) {
        setSelectedOrg(data[0].id);
      }
    }
    setLoading(false);
  }, [selectedOrg]);

  const loadInvites = useCallback(async (orgId: string) => {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("id, email, papel, status, token, expires_at, created_at")
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
    if (selectedOrg) loadInvites(selectedOrg);
  }, [selectedOrg, loadInvites]);

  const createOrganization = async () => {
    if (!newOrgNome.trim()) {
      toast.error("Informe o nome do condomínio");
      return;
    }
    setCreatingOrg(true);
    const { data, error } = await supabase
      .from("organizations")
      .insert({ nome: newOrgNome.trim(), tipo: newOrgTipo })
      .select("id")
      .single();
    setCreatingOrg(false);
    if (error) {
      toast.error("Erro ao criar condomínio", { description: error.message });
      return;
    }
    toast.success("Condomínio criado com sucesso");
    setNewOrgOpen(false);
    setNewOrgNome("");
    await loadOrganizations();
    if (data?.id) setSelectedOrg(data.id);
  };

  const createInvite = async () => {
    if (!selectedOrg) return;
    if (!inviteEmail.trim()) {
      toast.error("Informe o e-mail do convidado");
      return;
    }
    setSendingInvite(true);
    const { data, error } = await supabase.rpc("create_organization_invite", {
      p_organization_id: selectedOrg,
      p_email: inviteEmail.trim(),
      p_papel: invitePapel,
    });
    setSendingInvite(false);
    if (error) {
      toast.error("Erro ao criar convite", { description: error.message });
      return;
    }
    toast.success(`Convite criado para ${inviteEmail.trim()}`, {
      description: "Copie o link e envie ao convidado.",
    });
    setInviteEmail("");
    if (data?.token) {
      const link = `${window.location.origin}/aceitar-convite?token=${data.token}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.info("Link do convite copiado");
      } catch {
        // clipboard pode falhar; o link continua disponível na lista
      }
    }
    await loadInvites(selectedOrg);
  };

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase.rpc("cancel_organization_invite", { p_invite_id: inviteId });
    if (error) {
      toast.error("Erro ao cancelar convite", { description: error.message });
      return;
    }
    toast.success("Convite cancelado");
    if (selectedOrg) await loadInvites(selectedOrg);
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/aceitar-convite?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado");
    } catch {
      toast.info(link);
    }
  };

  const selectedOrgData = organizations.find((o) => o.id === selectedOrg);
  const orgInvites = selectedOrg ? invites[selectedOrg] ?? [] : [];

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Condomínios e Organizações</h1>
          <p className="text-muted-foreground">
            Crie condomínios e gere convites para síndicos, coaches e moradores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadOrganizations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={newOrgOpen} onOpenChange={setNewOrgOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo condomínio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar condomínio</DialogTitle>
                <DialogDescription>
                  Cadastre um novo condomínio ou organização parceira.
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
                      <SelectItem value="condominio">Condomínio</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="academia">Academia</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewOrgOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrganization} disabled={creatingOrg}>
                  {creatingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && organizations.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando organizações...
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
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedOrg === org.id
                      ? "bg-accent font-medium text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{org.nome}</span>
                    <Badge variant={org.status === "ativo" ? "default" : "secondary"}>
                      {org.tipo}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedOrgData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4" /> Convidar para {selectedOrgData.nome}
                  </CardTitle>
                  <CardDescription>
                    O convite é criado no banco e você envia o link ao convidado. Ao aceitar, o
                    acesso da persona é liberado automaticamente.
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
                      <Select value={invitePapel} onValueChange={setInvitePapel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sindico">Síndico</SelectItem>
                          <SelectItem value="professor">Coach/Professor</SelectItem>
                          <SelectItem value="user">Morador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={createInvite} disabled={sendingInvite}>
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
            )}

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
                          <p className="truncate font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {PAPEL_LABELS[inv.papel] ?? inv.papel} · criado em{" "}
                            {new Date(inv.created_at).toLocaleDateString("pt-BR")}
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
                          {inv.status === "pendente" && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyInviteLink(inv.token)}
                                title="Copiar link do convite"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cancelInvite(inv.id)}
                                title="Cancelar convite"
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
          </div>
        </div>
      )}
    </div>
  );
}
