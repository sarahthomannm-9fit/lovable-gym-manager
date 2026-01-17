import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFuncionarios, Funcionario } from '@/hooks/useFuncionarios';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  DollarSign,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const cargos = [
  { value: 'professor', label: 'Professor' },
  { value: 'personal', label: 'Personal Trainer' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
];

const especialidadesOptions = [
  'Musculação', 'Pilates', 'Yoga', 'Funcional', 'CrossFit', 
  'Spinning', 'Natação', 'Dança', 'Lutas', 'Alongamento'
];

export function Funcionarios() {
  const { funcionarios, loading, addFuncionario, updateFuncionario, deleteFuncionario } = useFuncionarios();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: 'professor' as Funcionario['cargo'],
    especialidades: [] as string[],
    salario: '',
    observacoes: '',
  });

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ativos = funcionarios.filter(f => f.ativo).length;
  const inativos = funcionarios.filter(f => !f.ativo).length;
  const totalSalarios = funcionarios
    .filter(f => f.ativo)
    .reduce((acc, f) => acc + (f.salario || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: Parameters<typeof addFuncionario>[0] = {
      nome: formData.nome,
      email: formData.email || null,
      telefone: formData.telefone || null,
      cargo: formData.cargo,
      especialidades: formData.especialidades,
      salario: formData.salario ? parseFloat(formData.salario) : null,
      observacoes: formData.observacoes || null,
      horarios: {},
      ativo: true,
      data_contratacao: new Date().toISOString().split('T')[0],
    };

    if (editingFuncionario) {
      await updateFuncionario(editingFuncionario.id, data);
    } else {
      await addFuncionario(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cargo: 'professor',
      especialidades: [],
      salario: '',
      observacoes: '',
    });
    setEditingFuncionario(null);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      email: funcionario.email || '',
      telefone: funcionario.telefone || '',
      cargo: funcionario.cargo,
      especialidades: funcionario.especialidades || [],
      salario: funcionario.salario?.toString() || '',
      observacoes: funcionario.observacoes || '',
    });
    setIsDialogOpen(true);
  };

  const handleToggleAtivo = async (funcionario: Funcionario) => {
    await updateFuncionario(funcionario.id, { ativo: !funcionario.ativo });
  };

  const getCargoColor = (cargo: string) => {
    const colors: Record<string, string> = {
      professor: 'bg-blue-500',
      personal: 'bg-purple-500',
      recepcionista: 'bg-green-500',
      gerente: 'bg-orange-500',
      nutricionista: 'bg-teal-500',
      fisioterapeuta: 'bg-pink-500',
    };
    return colors[cargo] || 'bg-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie a equipe da academia</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select 
                    value={formData.cargo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cargo: value as Funcionario['cargo'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo.value} value={cargo.value}>
                          {cargo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salario">Salário (R$)</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    value={formData.salario}
                    onChange={(e) => setFormData(prev => ({ ...prev, salario: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {especialidadesOptions.map(esp => (
                    <Badge
                      key={esp}
                      variant={formData.especialidades.includes(esp) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          especialidades: prev.especialidades.includes(esp)
                            ? prev.especialidades.filter(e => e !== esp)
                            : [...prev.especialidades, esp]
                        }));
                      }}
                    >
                      {esp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFuncionario ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{funcionarios.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{ativos}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">{inativos}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha Salarial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {totalSalarios.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar funcionário..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : filteredFuncionarios.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum funcionário encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFuncionarios.map(funcionario => (
            <Card key={funcionario.id} className={!funcionario.ativo ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                    <Badge className={`${getCargoColor(funcionario.cargo)} mt-1`}>
                      {cargos.find(c => c.value === funcionario.cargo)?.label || funcionario.cargo}
                    </Badge>
                  </div>
                  <Badge variant={funcionario.ativo ? 'default' : 'secondary'}>
                    {funcionario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {funcionario.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {funcionario.email}
                  </div>
                )}
                {funcionario.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {funcionario.telefone}
                  </div>
                )}
                {funcionario.salario && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    {funcionario.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                )}
                {funcionario.especialidades && funcionario.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {funcionario.especialidades.map(esp => (
                      <Badge key={esp} variant="outline" className="text-xs">
                        {esp}
                      </Badge>
                    ))}
                  </div>
                )}
                {funcionario.data_contratacao && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="w-3 h-3" />
                    Desde {format(new Date(funcionario.data_contratacao), "MMM 'de' yyyy", { locale: ptBR })}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(funcionario)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant={funcionario.ativo ? 'secondary' : 'default'}
                    onClick={() => handleToggleAtivo(funcionario)}
                  >
                    {funcionario.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteFuncionario(funcionario.id)}
                  >
                    <Trash2 className="w-3 h-3" />
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
