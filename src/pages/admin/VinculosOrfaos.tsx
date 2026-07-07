import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link2, AlertCircle, CheckCircle2 } from 'lucide-react';

type OrfaoUsuario = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
};

type Organization = {
  id: string;
  nome: string;
};

const PAPEIS_DISPONIVEIS = [
  { value: 'sindico', label: 'Síndico' },
  { value: 'comite', label: 'Comitê' },
  { value: 'professor', label: 'Professor/Coach' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'user', label: 'Usuário/Morador' },
];

export default function VinculosOrfaos() {
  const { activeOrg, isAdmin } = useOperationalContext();
  const { user } = useAuth();
  const [orfaos, setOrfaos] = useState<OrfaoUsuario[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Record<string, string>>({});
  const [selectedPapel, setSelectedPapel] = useState<Record<string, string>>({});

  // Carregar usuários órfãos e organizações
  const carregar = async () => {
    setLoading(true);
    try {
      // 1. Buscar todos user_roles
      const { data: roles } = await supabase.from('user_roles').select('*');
      
      // 2. Buscar todos organization_members
      const { data: members } = await supabase.from('organization_members').select('user_id');
      
      // 3. Encontrar IDs em user_roles mas não em organization_members
      const memberUserIds = new Set((members || []).map(m => m.user_id));
      const orfaosFiltered = (roles || []).filter(r => !memberUserIds.has(r.user_id));
      
      setOrfaos(orfaosFiltered);

      // 4. Se admin, buscar todas as orgs; se não, usar activeOrg
      if (isAdmin) {
        const { data: orgs } = await supabase.from('organizations').select('id, nome').order('nome');
        setOrganizations(orgs || []);
      } else if (activeOrg) {
        setOrganizations([activeOrg]);
      }
    } catch (error) {
      console.error('[VinculosOrfaos] Erro ao carregar:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [activeOrg, isAdmin]);

  const vincular = async (orfao: OrfaoUsuario) => {
    const orgId = selectedOrg[orfao.id];
    const papel = selectedPapel[orfao.id];

    if (!orgId || !papel) {
      toast.error('Selecione organização e papel');
      return;
    }

    setVinculando(orfao.id);
    try {
      const { error } = await supabase.from('organization_members').insert({
        user_id: orfao.user_id,
        organization_id: orgId,
        papel: papel,
      });

      if (error) {
        toast.error(`Falha: ${error.message}`);
      } else {
        toast.success(`Usuário vinculado a ${papel}`);
        setSelectedOrg(s => { delete s[orfao.id]; return s; });
        setSelectedPapel(s => { delete s[orfao.id]; return s; });
        carregar();
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setVinculando(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
            <div>
              <h2 className="font-semibold text-destructive">Acesso Negado</h2>
              <p className="text-sm text-muted-foreground">Apenas administradores podem acessar esta página.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Link2 className="w-6 h-6" /> Vincular Usuários Órfãos
        </h1>
        <p className="text-sm text-muted-foreground">
          Usuários criados em `user_roles` mas sem organização vinculada em `organization_members`
        </p>
      </div>

      {orfaos.length === 0 ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary/50 mx-auto mb-3" />
            <p className="font-semibold text-primary">Nenhum usuário órfão</p>
            <p className="text-sm text-muted-foreground">Todos os usuários estão vinculados a organizações.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orfaos.map(orfao => (
            <Card key={orfao.id} className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{orfao.user_id.slice(0, 8)}…</div>
                  <div className="text-xs text-muted-foreground font-mono">{orfao.user_id}</div>
                  <Badge variant="outline" className="mt-1">{orfao.role}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Organização */}
                  <Select
                    value={selectedOrg[orfao.id] || ''}
                    onValueChange={v => setSelectedOrg(s => ({ ...s, [orfao.id]: v }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Papel */}
                  <Select
                    value={selectedPapel[orfao.id] || ''}
                    onValueChange={v => setSelectedPapel(s => ({ ...s, [orfao.id]: v }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPEIS_DISPONIVEIS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Botão Vincular */}
                  <Button
                    size="sm"
                    onClick={() => vincular(orfao)}
                    disabled={vinculando === orfao.id || !selectedOrg[orfao.id] || !selectedPapel[orfao.id]}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                  >
                    {vinculando === orfao.id ? '…' : 'Vincular'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
