import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAulasExperimentais, AulaExperimental } from '@/hooks/useAulasExperimentais';
import { useSupabasePlans } from '@/hooks/useSupabasePlans';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/warroom/PageShell';
import { 
  UserPlus, Plus, Search, Phone, Mail, Target,
  CheckCircle2, XCircle, Star, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fontes = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'site', label: 'Site' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'outro', label: 'Outro' },
];

const statusOptions = [
  { value: 'agendada', label: 'Agendada', color: 'bg-blue-500' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-cyan-500' },
  { value: 'realizada', label: 'Realizada', color: 'bg-green-500' },
  { value: 'nao_compareceu', label: 'Não Compareceu', color: 'bg-red-500' },
  { value: 'convertida', label: 'Convertida', color: 'bg-emerald-500' },
  { value: 'nao_convertida', label: 'Não Convertida', color: 'bg-orange-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-gray-500' },
];

export function AulasExperimentais() {
  const { aulasExperimentais, loading, addAulaExperimental, updateAulaExperimental, converterParaAluno, getMetricasFunil, getByFonte } = useAulasExperimentais();
  const { plans } = useSupabasePlans();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<AulaExperimental | null>(null);
  const [selectedPlano, setSelectedPlano] = useState('');
  const [converting, setConverting] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', fonte: 'instagram' as AulaExperimental['fonte'], data_agendada: '', horario_agendado: '', notas: '' });

  const metricas = getMetricasFunil();
  const porFonte = getByFonte();
  const filteredAulas = aulasExperimentais.filter(a => a.nome.toLowerCase().includes(searchQuery.toLowerCase()) || a.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedPlanData = plans.find(p => p.id === selectedPlano);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAulaExperimental({ nome: formData.nome, email: formData.email || null, telefone: formData.telefone || null, fonte: formData.fonte, aula_id: null, data_agendada: formData.data_agendada, horario_agendado: formData.horario_agendado || null, status: 'agendada', notas: formData.notas || null, motivo_nao_conversao: null, data_conversao: null, plano_convertido_id: null, avaliacao_experiencia: null, feedback: null, atendido_por: null });
    setIsDialogOpen(false);
    setFormData({ nome: '', email: '', telefone: '', fonte: 'instagram', data_agendada: '', horario_agendado: '', notas: '' });
  };

  const handleConvert = async () => {
    if (!selectedAula || !selectedPlano) return;
    setConverting(true);
    try { await converterParaAluno(selectedAula.id, selectedPlano); setConvertDialogOpen(false); setSelectedAula(null); setSelectedPlano(''); navigate('/alunos'); } catch (e) {} finally { setConverting(false); }
  };

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find(x => x.value === status);
    return <Badge className={`${s?.color || 'bg-gray-500'} text-[10px]`}>{s?.label || status}</Badge>;
  };

  const shellMetrics = [
    { label: 'TOTAL', value: String(metricas.total) },
    { label: 'AGENDADAS', value: String(metricas.agendadas + metricas.confirmadas), color: 'text-[hsl(var(--urgency-info))]' },
    { label: 'CONVERTIDAS', value: String(metricas.convertidas), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'TAXA CONV.', value: `${metricas.taxaConversao}%`, color: metricas.taxaConversao > 0 ? 'text-[hsl(var(--urgency-opportunity))]' : undefined },
    { label: 'COMPAREC.', value: `${metricas.taxaComparecimento}%` },
  ];

  if (loading) {
    return <PageShell title="AULAS EXPERIMENTAIS" sub="Carregando..."><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}</div></PageShell>;
  }

  return (
    <PageShell
      title="AULAS EXPERIMENTAIS"
      sub={`Funil de conversão · ${metricas.taxaConversao}% conversão`}
      metrics={shellMetrics}
      actions={
        <button onClick={() => setIsDialogOpen(true)} className="px-2 py-1 text-[10px] font-mono rounded border border-white/20 text-white/60 hover:text-white transition-colors">
          + AGENDAR
        </button>
      }
    >
      {/* Por Fonte */}
      {Object.keys(porFonte).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(porFonte).map(([fonte, qtd]) => (
            <Badge key={fonte} variant="outline" className="text-[10px] font-mono">{fontes.find(f => f.value === fonte)?.label || fonte}: {qtd}</Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      {/* List */}
      {filteredAulas.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma aula experimental</p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Agendar Primeira</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAulas.map(aula => (
            <Card key={aula.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium text-sm">{aula.nome}</p><p className="text-xs text-muted-foreground font-mono">{format(new Date(aula.data_agendada), "dd/MM/yyyy", { locale: ptBR })}{aula.horario_agendado && ` · ${aula.horario_agendado.slice(0, 5)}`}</p></div>
                  {getStatusBadge(aula.status)}
                </div>
                {aula.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{aula.email}</div>}
                {aula.telefone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{aula.telefone}</div>}
                {aula.fonte && <Badge variant="outline" className="text-[9px]">{fontes.find(f => f.value === aula.fonte)?.label || aula.fonte}</Badge>}
                {aula.avaliacao_experiencia && <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < aula.avaliacao_experiencia! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}</div>}
                <div className="flex gap-1.5 pt-1 flex-wrap">
                  {aula.status === 'agendada' && <><Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateAulaExperimental(aula.id, { status: 'confirmada' })}>Confirmar</Button><Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => updateAulaExperimental(aula.id, { status: 'cancelada' })}>Cancelar</Button></>}
                  {['confirmada', 'agendada'].includes(aula.status) && <><Button size="sm" className="h-6 text-xs" onClick={() => updateAulaExperimental(aula.id, { status: 'realizada' })}><CheckCircle2 className="w-3 h-3 mr-1" />Realizada</Button><Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => updateAulaExperimental(aula.id, { status: 'nao_compareceu' })}>Faltou</Button></>}
                  {aula.status === 'realizada' && <><Button size="sm" className="h-6 text-xs" onClick={() => { setSelectedAula(aula); setConvertDialogOpen(true); }}><UserPlus className="w-3 h-3 mr-1" />Converter</Button><Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => updateAulaExperimental(aula.id, { status: 'nao_convertida' })}>Não Converteu</Button></>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Aula Experimental</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nome *</Label><Input value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>E-mail</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div><div><Label>Telefone</Label><Input value={formData.telefone} onChange={(e) => setFormData(p => ({ ...p, telefone: e.target.value }))} /></div></div>
            <div><Label>Origem</Label><Select value={formData.fonte || ''} onValueChange={(v) => setFormData(p => ({ ...p, fonte: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fontes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Data *</Label><Input type="date" value={formData.data_agendada} onChange={(e) => setFormData(p => ({ ...p, data_agendada: e.target.value }))} required /></div><div><Label>Horário</Label><Input type="time" value={formData.horario_agendado} onChange={(e) => setFormData(p => ({ ...p, horario_agendado: e.target.value }))} /></div></div>
            <div><Label>Observações</Label><Textarea value={formData.notas} onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))} rows={2} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit">Agendar</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Converter para Aluno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAula && <Card className="bg-muted/50"><CardContent className="pt-4 space-y-1"><p className="font-medium">{selectedAula.nome}</p>{selectedAula.email && <p className="text-sm text-muted-foreground">{selectedAula.email}</p>}</CardContent></Card>}
            <div><Label>Plano</Label><Select value={selectedPlano} onValueChange={setSelectedPlano}><SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger><SelectContent>{plans.filter(p => p.ativo).map(p => <SelectItem key={p.id} value={p.id}>{p.nome} - R$ {Number(p.preco).toFixed(2)}</SelectItem>)}</SelectContent></Select></div>
            {selectedPlanData && <Card className="border-[hsl(var(--urgency-opportunity))]/40 bg-[hsl(var(--urgency-opportunity))]/5"><CardContent className="pt-4 space-y-1 text-sm"><p>✅ Status: <strong>Ativo</strong></p><p>✅ Plano: <strong>{selectedPlanData.nome}</strong></p><p>✅ Mensalidade: <strong>R$ {Number(selectedPlanData.preco).toFixed(2)}</strong></p></CardContent></Card>}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Cancelar</Button><Button onClick={handleConvert} disabled={!selectedPlano || converting}>{converting ? 'Convertendo...' : 'Confirmar'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
