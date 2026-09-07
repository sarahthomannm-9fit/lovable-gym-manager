import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperationalContext, routeForRole } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, GraduationCap, Briefcase, Crown, LogOut, User, Eye } from 'lucide-react';

const TIPO_META: Record<string, { icon: any; label: string; accent: string }> = {
  condominio: { icon: Building2, label: 'Condomínio', accent: '#60A5FA' },
  corporate: { icon: Briefcase, label: 'Corporativo', accent: '#A78BFA' },
  professor: { icon: GraduationCap, label: 'Profissional', accent: 'hsl(var(--primary))' },
  studio: { icon: GraduationCap, label: 'Studio', accent: '#F472B6' },
};

const PAPEL_LABEL: Record<string, string> = {
  sindico: 'Síndico', professor: 'Professor', corporate: 'RH / Gestor',
};

const ADMIN_PREVIEWS = [
  { label: 'Síndico (preview)', tipo: 'condominio' as const, route: '/sindico', icon: Building2, accent: '#60A5FA' },
  { label: 'Professor (preview)', tipo: 'professor' as const, route: '/coach', icon: GraduationCap, accent: 'hsl(var(--primary))' },
  { label: 'Corporativo (preview)', tipo: 'corporate' as const, route: '/corp', icon: Briefcase, accent: '#A78BFA' },
  { label: 'Morador / Aluno (preview)', tipo: null, route: '/morador', icon: User, accent: '#F472B6' },
];

export default function SelectContext() {
  const { loading, isAdmin, memberships, setActiveOrg } = useOperationalContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin && memberships.length === 0) navigate('/morador');
    else if (!isAdmin && memberships.length === 1) {
      const m = memberships[0];
      setActiveOrg(m.organization);
      navigate(routeForRole(m.papel));
    }
  }, [loading, isAdmin, memberships, navigate, setActiveOrg]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-muted-foreground">Carregando…</div>;
  }

  const entrarComoPreview = async (tipo: string | null, route: string) => {
    if (tipo) {
      // Buscar primeira org desse tipo entre memberships (admin pode não ter membership)
      const m = memberships.find(x => x.organization.tipo === tipo);
      if (m) setActiveOrg(m.organization);
      else {
        // Buscar qualquer org real no banco
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await (supabase as any).from('organizations')
          .select('id, nome, tipo, status').eq('tipo', tipo).limit(1).maybeSingle();
        if (data) setActiveOrg(data);
        else setActiveOrg(null);
      }
    } else {
      setActiveOrg(null);
    }
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-normal font-display">Como você quer entrar?</h1>
            <p className="text-sm text-muted-foreground">Escolha o contexto operacional.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sair</Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {isAdmin && (
            <Card className="border-[hsl(var(--primary))]/40 bg-card/60 hover:bg-card cursor-pointer transition"
                  onClick={() => { setActiveOrg(null); navigate('/painel'); }}>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-sm bg-[hsl(var(--primary))]/15 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))]">Admin Geral</p>
                  <p className="font-semibold">9FIT — Visão Completa</p>
                  <p className="text-xs text-muted-foreground mt-1">Acesso a tudo: painel, alunos, agentes, organizações.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {memberships.map(m => {
            const meta = TIPO_META[m.organization.tipo] || TIPO_META.condominio;
            const Icon = meta.icon;
            return (
              <Card key={m.organization_id + m.papel}
                    className="bg-card/60 hover:bg-card cursor-pointer transition border-border/40"
                    onClick={() => { setActiveOrg(m.organization); navigate(routeForRole(m.papel)); }}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center"
                       style={{ backgroundColor: `${meta.accent}1A`, color: meta.accent }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: meta.accent }}>
                      {PAPEL_LABEL[m.papel] || m.papel} · {meta.label}
                    </p>
                    <p className="font-semibold">{m.organization.nome}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isAdmin && memberships.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              Você ainda não está vinculado a nenhuma organização. Peça ao admin para te incluir.
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Pré-visualizar como persona</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ADMIN_PREVIEWS.map(p => {
                const Icon = p.icon;
                return (
                  <Card key={p.label}
                        className="bg-card/40 hover:bg-card cursor-pointer transition border-border/30"
                        onClick={() => entrarComoPreview(p.tipo, p.route)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-sm flex items-center justify-center"
                           style={{ backgroundColor: `${p.accent}1A`, color: p.accent }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{p.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Modo preview do admin: usa a primeira org disponível do tipo correspondente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
