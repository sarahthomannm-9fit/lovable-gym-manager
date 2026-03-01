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
import { 
  UserPlus, Plus, Search, Phone, Mail, Target, TrendingUp, UserCheck,
  Clock, CheckCircle2, XCircle, Star, DollarSign
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
  const { 
    aulasExperimentais, loading, addAulaExperimental, updateAulaExperimental,
    converterParaAluno, getMetricasFunil, getByFonte 
  } = useAulasExperimentais();
  const { plans } = useSupabasePlans();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<AulaExperimental | null>(null);
  const [selectedPlano, setSelectedPlano] = useState('');
  const [converting, setConverting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '',
    fonte: 'instagram' as AulaExperimental['fonte'],
    data_agendada: '', horario_agendado: '', notas: '',
  });

  const metricas = getMetricasFunil();
  const porFonte = getByFonte();
  const filteredAulas = aulasExperimentais.filter(a =>
    a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlanData = plans.find(p => p.id === selectedPlano);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAulaExperimental({
      nome: formData.nome, email: formData.email || null, telefone: formData.telefone || null,
      fonte: formData.fonte, aula_id: null, data_agendada: formData.data_agendada,
      horario_agendado: formData.horario_agendado || null, status: 'agendada',
      notas: formData.notas || null, motivo_nao_conversao: null, data_conversao: null,
      plano_convertido_id: null, avaliacao_experiencia: null, feedback: null, atendido_por: null,
    });
    setIsDialogOpen(false);
    setFormData({ nome: '', email: '', telefone: '', fonte: 'instagram', data_agendada: '', horario_agendado: '', notas: '' });
  };

  const handleConvert = async () => {
    if (!selectedAula || !selectedPlano) return;
    setConverting(true);
    try {
      const result = await converterParaAluno(selectedAula.id, selectedPlano);
      setConvertDialogOpen(false);
      setSelectedAula(null);
      setSelectedPlano('');
      // Navigate to the new student profile
      navigate('/alunos');
    } catch (e) {
      // error handled in hook
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return <Badge className={statusInfo?.color || 'bg-gray-500'}>{statusInfo?.label || status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aulas Experimentais</h1>
          <p className="text-muted-foreground">Funil de conversão de novos alunos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Agendar Experimental</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Aula Experimental</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome Completo *</Label><Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>E-mail</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={formData.telefone} onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Origem do Lead</Label>
                <Select value={formData.fonte || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, fonte: value as AulaExperimental['fonte'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{fontes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={formData.data_agendada} onChange={(e) => setFormData(prev => ({ ...prev, data_agendada: e.target.value }))} required /></div>
                <div><Label>Horário</Label><Input type="time" value={formData.horario_agendado} onChange={(e) => setFormData(prev => ({ ...prev, horario_agendado: e.target.value }))} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={formData.notas} onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))} rows={3} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Agendar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><span className="text-2xl font-bold">{metricas.total}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Agendadas</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /><span className="text-2xl font-bold">{metricas.agendadas + metricas.confirmadas}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Convertidas</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-green-500" /><span className="text-2xl font-bold">{metricas.convertidas}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Taxa Conversão</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><span className="text-2xl font-bold">{metricas.taxaConversao}%</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Comparecimento</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-500" /><span className="text-2xl font-bold">{metricas.taxaComparecimento}%</span></div></CardContent></Card>
      </div>

      {/* Por Fonte */}
      <Card><CardHeader><CardTitle className="text-lg">Leads por Origem</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{Object.entries(porFonte).map(([fonte, qtd]) => <Badge key={fonte} variant="outline" className="text-sm py-1 px-3">{fontes.find(f => f.value === fonte)?.label || fonte}: {qtd}</Badge>)}</div></CardContent></Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : filteredAulas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma aula experimental encontrada</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAulas.map(aula => (
            <Card key={aula.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{aula.nome}</CardTitle>
                    <CardDescription>
                      {format(new Date(aula.data_agendada), "dd/MM/yyyy", { locale: ptBR })}
                      {aula.horario_agendado && ` às ${aula.horario_agendado.slice(0, 5)}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(aula.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {aula.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" />{aula.email}</div>}
                {aula.telefone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{aula.telefone}</div>}
                {aula.fonte && <Badge variant="outline">{fontes.find(f => f.value === aula.fonte)?.label || aula.fonte}</Badge>}
                {aula.avaliacao_experiencia && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < aula.avaliacao_experiencia! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                  </div>
                )}
                {aula.notas && <p className="text-sm text-muted-foreground italic">"{aula.notas}"</p>}

                <div className="flex gap-2 pt-2 flex-wrap">
                  {aula.status === 'agendada' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateAulaExperimental(aula.id, { status: 'confirmada' })}>Confirmar</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateAulaExperimental(aula.id, { status: 'cancelada' })}>Cancelar</Button>
                    </>
                  )}
                  {(aula.status === 'confirmada' || aula.status === 'agendada') && (
                    <>
                      <Button size="sm" onClick={() => updateAulaExperimental(aula.id, { status: 'realizada' })}><CheckCircle2 className="w-3 h-3 mr-1" />Realizada</Button>
                      <Button size="sm" variant="secondary" onClick={() => updateAulaExperimental(aula.id, { status: 'nao_compareceu' })}><XCircle className="w-3 h-3 mr-1" />Faltou</Button>
                    </>
                  )}
                  {aula.status === 'realizada' && (
                    <>
                      <Button size="sm" onClick={() => { setSelectedAula(aula); setConvertDialogOpen(true); }}><UserPlus className="w-3 h-3 mr-1" />Converter</Button>
                      <Button size="sm" variant="secondary" onClick={() => updateAulaExperimental(aula.id, { status: 'nao_convertida' })}>Não Converteu</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Convert Dialog with Preview */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Converter para Aluno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAula && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <p className="font-medium">{selectedAula.nome}</p>
                  {selectedAula.email && <p className="text-sm text-muted-foreground">{selectedAula.email}</p>}
                  {selectedAula.telefone && <p className="text-sm text-muted-foreground">{selectedAula.telefone}</p>}
                  {selectedAula.fonte && <Badge variant="outline" className="text-xs">{fontes.find(f => f.value === selectedAula.fonte)?.label}</Badge>}
                </CardContent>
              </Card>
            )}

            <div>
              <Label>Selecione o Plano</Label>
              <Select value={selectedPlano} onValueChange={setSelectedPlano}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.ativo).map(plano => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - {Number(plano.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlanData && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Preview da conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>✅ Aluno será criado com status <strong>Ativo</strong></p>
                  <p>✅ Plano: <strong>{selectedPlanData.nome}</strong></p>
                  <p>✅ Mensalidade: <strong>R$ {Number(selectedPlanData.preco).toFixed(2)}</strong></p>
                  <p>✅ Primeira cobrança será gerada automaticamente</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleConvert} disabled={!selectedPlano || converting}>
                {converting ? 'Convertendo...' : 'Confirmar Conversão'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
