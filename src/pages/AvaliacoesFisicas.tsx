import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAvaliacoesFisicas, AvaliacaoFisica } from '@/hooks/useAvaliacoesFisicas';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { 
  Activity, 
  Plus, 
  Search, 
  User, 
  Calendar,
  Scale,
  Ruler,
  Percent,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AvaliacoesFisicas() {
  const { avaliacoes, loading, addAvaliacao, getAvaliacoesByAluno } = useAvaliacoesFisicas();
  const { students } = useSupabaseGymData();
  const { getProfessores } = useFuncionarios();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<string>('');
  
  const [formData, setFormData] = useState({
    aluno_id: '',
    avaliador_id: '',
    data_avaliacao: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    percentual_gordura: '',
    massa_muscular: '',
    circunferencia_cintura: '',
    circunferencia_quadril: '',
    circunferencia_braco_direito: '',
    circunferencia_coxa_direita: '',
    observacoes: '',
    data_entrega: '',
    data_programa: '',
    proxima_avaliacao: '',
  });

  const professores = getProfessores();

  const filteredAvaliacoes = avaliacoes.filter(a => {
    const aluno = students.find(s => s.id === a.aluno_id);
    return aluno?.nome.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addAvaliacao({
      aluno_id: formData.aluno_id,
      avaliador_id: formData.avaliador_id || null,
      data_avaliacao: formData.data_avaliacao,
      peso: formData.peso ? parseFloat(formData.peso) : null,
      altura: formData.altura ? parseFloat(formData.altura) : null,
      percentual_gordura: formData.percentual_gordura ? parseFloat(formData.percentual_gordura) : null,
      massa_muscular: formData.massa_muscular ? parseFloat(formData.massa_muscular) : null,
      massa_ossea: null,
      agua_corporal: null,
      circunferencia_pescoco: null,
      circunferencia_peitoral: null,
      circunferencia_cintura: formData.circunferencia_cintura ? parseFloat(formData.circunferencia_cintura) : null,
      circunferencia_quadril: formData.circunferencia_quadril ? parseFloat(formData.circunferencia_quadril) : null,
      circunferencia_braco_direito: formData.circunferencia_braco_direito ? parseFloat(formData.circunferencia_braco_direito) : null,
      circunferencia_braco_esquerdo: null,
      circunferencia_coxa_direita: formData.circunferencia_coxa_direita ? parseFloat(formData.circunferencia_coxa_direita) : null,
      circunferencia_coxa_esquerda: null,
      circunferencia_panturrilha_direita: null,
      circunferencia_panturrilha_esquerda: null,
      dobra_triceps: null,
      dobra_biceps: null,
      dobra_subescapular: null,
      dobra_suprailiaca: null,
      dobra_abdominal: null,
      dobra_coxa: null,
      dobra_panturrilha: null,
      teste_flexibilidade: {},
      teste_forca: {},
      teste_resistencia: {},
      observacoes: formData.observacoes || null,
      metas: [],
      proxima_avaliacao: formData.proxima_avaliacao || null,
      data_entrega: formData.data_entrega || null,
      data_programa: formData.data_programa || null,
    });

    setIsDialogOpen(false);
    setFormData({
      aluno_id: '',
      avaliador_id: '',
      data_avaliacao: new Date().toISOString().split('T')[0],
      peso: '',
      altura: '',
      percentual_gordura: '',
      massa_muscular: '',
      circunferencia_cintura: '',
      circunferencia_quadril: '',
      circunferencia_braco_direito: '',
      circunferencia_coxa_direita: '',
      observacoes: '',
      data_entrega: '',
      data_programa: '',
      proxima_avaliacao: '',
    });
  };

  const getIMCClassificacao = (imc: number | null) => {
    if (!imc) return { label: 'N/A', color: 'bg-gray-500' };
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'bg-yellow-500' };
    if (imc < 25) return { label: 'Peso normal', color: 'bg-green-500' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'bg-orange-500' };
    return { label: 'Obesidade', color: 'bg-red-500' };
  };

  const getAlunoNome = (alunoId: string | null) => {
    if (!alunoId) return 'N/A';
    const aluno = students.find(s => s.id === alunoId);
    return aluno?.nome || 'Aluno não encontrado';
  };

  // Estatísticas
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesEsteMes = avaliacoes.filter(a => {
    const dataAvaliacao = new Date(a.data_avaliacao);
    const agora = new Date();
    return dataAvaliacao.getMonth() === agora.getMonth() && 
           dataAvaliacao.getFullYear() === agora.getFullYear();
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avaliações Físicas</h1>
          <p className="text-muted-foreground">Acompanhe a evolução dos alunos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Avaliação Física</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aluno *</Label>
                  <Select 
                    value={formData.aluno_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, aluno_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.filter(s => s.status === 'ativo').map(aluno => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Avaliador</Label>
                  <Select 
                    value={formData.avaliador_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, avaliador_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o avaliador" />
                    </SelectTrigger>
                    <SelectContent>
                      {professores.map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Data da Avaliação</Label>
                <Input
                  type="date"
                  value={formData.data_avaliacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_avaliacao: e.target.value }))}
                />
              </div>

              <Tabs defaultValue="basico">
                <TabsList className="w-full">
                  <TabsTrigger value="basico" className="flex-1">Básico</TabsTrigger>
                  <TabsTrigger value="circunferencias" className="flex-1">Circunferências</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={(e) => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Altura (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1.75"
                        value={formData.altura}
                        onChange={(e) => setFormData(prev => ({ ...prev, altura: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>% Gordura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.percentual_gordura}
                        onChange={(e) => setFormData(prev => ({ ...prev, percentual_gordura: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Massa Muscular (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.massa_muscular}
                        onChange={(e) => setFormData(prev => ({ ...prev, massa_muscular: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="circunferencias" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cintura (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.circunferencia_cintura}
                        onChange={(e) => setFormData(prev => ({ ...prev, circunferencia_cintura: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Quadril (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.circunferencia_quadril}
                        onChange={(e) => setFormData(prev => ({ ...prev, circunferencia_quadril: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Braço Direito (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.circunferencia_braco_direito}
                        onChange={(e) => setFormData(prev => ({ ...prev, circunferencia_braco_direito: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Coxa Direita (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.circunferencia_coxa_direita}
                        onChange={(e) => setFormData(prev => ({ ...prev, circunferencia_coxa_direita: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Data de Entrega</Label>
                  <Input type="date" value={formData.data_entrega} onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))} />
                </div>
                <div>
                  <Label>Data do Programa</Label>
                  <Input type="date" value={formData.data_programa} onChange={(e) => setFormData(prev => ({ ...prev, data_programa: e.target.value }))} />
                </div>
                <div>
                  <Label>Próxima Avaliação</Label>
                  <Input type="date" value={formData.proxima_avaliacao} onChange={(e) => setFormData(prev => ({ ...prev, proxima_avaliacao: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.aluno_id}>
                  Salvar Avaliação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{totalAvaliacoes}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{avaliacoesEsteMes}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Avaliados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {new Set(avaliacoes.map(a => a.aluno_id)).size}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por aluno..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : filteredAvaliacoes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma avaliação encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAvaliacoes.map(avaliacao => {
            const imcClass = getIMCClassificacao(avaliacao.imc);
            return (
              <Card key={avaliacao.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{getAlunoNome(avaliacao.aluno_id)}</CardTitle>
                      <CardDescription>
                        {format(new Date(avaliacao.data_avaliacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    {avaliacao.imc && (
                      <Badge className={imcClass.color}>
                        IMC: {avaliacao.imc.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {avaliacao.peso && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{avaliacao.peso} kg</span>
                      </div>
                    )}
                    {avaliacao.altura && (
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{avaliacao.altura} m</span>
                      </div>
                    )}
                    {avaliacao.percentual_gordura && (
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{avaliacao.percentual_gordura}% gordura</span>
                      </div>
                    )}
                    {avaliacao.massa_muscular && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{avaliacao.massa_muscular} kg músc.</span>
                      </div>
                    )}
                  </div>

                  {(avaliacao.circunferencia_cintura || avaliacao.circunferencia_quadril) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Circunferências</p>
                      <div className="flex gap-4 text-sm">
                        {avaliacao.circunferencia_cintura && (
                          <span>Cintura: {avaliacao.circunferencia_cintura}cm</span>
                        )}
                        {avaliacao.circunferencia_quadril && (
                          <span>Quadril: {avaliacao.circunferencia_quadril}cm</span>
                        )}
                      </div>
                    </div>
                  )}

                  {avaliacao.observacoes && (
                    <p className="text-sm text-muted-foreground italic">
                      "{avaliacao.observacoes}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
