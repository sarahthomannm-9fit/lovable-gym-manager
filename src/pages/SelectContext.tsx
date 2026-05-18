import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperationalContext, routeForRole } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, GraduationCap, Briefcase, Crown, LogOut } from 'lucide-react';

const TIPO_META: Record<string, { icon: any; label: string; accent: string }> = {
  condominio: { icon: Building2, label: 'Condomínio', accent: '#60A5FA' },
  corporate: { icon: Briefcase, label: 'Corporativo', accent: '#A78BFA' },
  professor: { icon: GraduationCap, label: 'Profissional', accent: '#C8FF00' },
  studio: { icon: GraduationCap, label: 'Studio', accent: '#F472B6' },
};

const PAPEL_LABEL: Record<string, string> = {
  sindico: 'Síndico',
  professor: 'Professor',
  corporate: 'RH / Gestor',
};

export default function SelectContext() {
  const { loading, isAdmin, memberships, setActiveOrg } = useOperationalContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin && memberships.length === 0) {
      // Sem papel admin nem membership: vai pro painel padrão
      navigate('/painel');
    } else if (!isAdmin && memberships.length === 1) {
      const m = memberships[0];
      setActiveOrg(m.organization);
      navigate(routeForRole(m.papel));
    }
  }, [loading, isAdmin, memberships, navigate, setActiveOrg]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#07070A] text-muted-foreground">Carregando contextos…</div>;
  }

  return (
    <div className="min-h-screen bg-[#07070A] text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Como você quer entrar?</h1>
            <p className="text-sm text-muted-foreground">Escolha o contexto operacional.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sair</Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {isAdmin && (
            <Card className="border-[#C8FF00]/40 bg-card/60 hover:bg-card cursor-pointer transition"
                  onClick={() => { setActiveOrg(null); navigate('/painel'); }}>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C8FF00]/15 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#C8FF00]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#C8FF00]">Admin Geral</p>
                  <p className="font-semibold">9FIT — Visão Completa</p>
                  <p className="text-xs text-muted-foreground mt-1">Acesso a tudo: painel, alunos, agentes, organizações.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {memberships.map((m) => {
            const meta = TIPO_META[m.organization.tipo] || TIPO_META.condominio;
            const Icon = meta.icon;
            return (
              <Card key={m.organization_id + m.papel}
                    className="bg-card/60 hover:bg-card cursor-pointer transition border-border/40"
                    onClick={() => { setActiveOrg(m.organization); navigate(routeForRole(m.papel)); }}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
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
      </div>
    </div>
  );
}
