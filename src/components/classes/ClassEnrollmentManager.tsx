import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  Search,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAulasInscritos } from '@/hooks/useAulasInscritos';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

interface ClassEnrollmentManagerProps {
  aulaId: string;
  aulaNome: string;
  capacidadeMaxima: number;
  inscritosAtual: number;
}

export function ClassEnrollmentManager({
  aulaId,
  aulaNome,
  capacidadeMaxima,
  inscritosAtual
}: ClassEnrollmentManagerProps) {
  const { students } = useSupabaseGymData();
  const { 
    inscreverAluno, 
    cancelarInscricao, 
    marcarPresenca, 
    marcarFalta,
    getInscritosPorAula,
    getListaEspera
  } = useAulasInscritos();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const inscritos = getInscritosPorAula(aulaId);
  const listaEspera = getListaEspera(aulaId);
  const vagasDisponiveis = capacidadeMaxima - inscritos.filter(i => i.status !== 'lista_espera').length;

  const getAlunoInfo = (alunoId: string) => {
    return students.find(s => s.id === alunoId);
  };

  const filteredStudents = students.filter(s =>
    s.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
    s.status === 'ativo' &&
    !inscritos.some(i => i.aluno_id === s.id && i.status !== 'cancelado')
  );

  const handleInscrever = async (alunoId: string) => {
    await inscreverAluno(aulaId, alunoId, capacidadeMaxima);
    setSearchQuery('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'inscrito':
        return <Badge variant="default">Inscrito</Badge>;
      case 'presente':
        return <Badge className="bg-green-500">Presente</Badge>;
      case 'faltou':
        return <Badge variant="destructive">Faltou</Badge>;
      case 'lista_espera':
        return <Badge variant="secondary">Lista de Espera</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            {aulaNome}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={vagasDisponiveis > 0 ? 'outline' : 'destructive'}>
              {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : 'Lotado'}
            </Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Inscrever
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inscrever Aluno em {aulaNome}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar aluno..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {vagasDisponiveis <= 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Aula lotada. Novos inscritos irão para lista de espera.</span>
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.slice(0, 10).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{student.nome}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInscrever(student.id)}
                          >
                            Inscrever
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        {searchQuery ? 'Nenhum aluno encontrado' : 'Digite para buscar'}
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de Inscritos */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            Inscritos ({inscritos.filter(i => i.status !== 'lista_espera').length}/{capacidadeMaxima})
          </h4>
          
          {inscritos.filter(i => i.status !== 'lista_espera').length > 0 ? (
            <div className="space-y-2">
              {inscritos
                .filter(i => i.status !== 'lista_espera')
                .map((inscrito) => {
                  const aluno = getAlunoInfo(inscrito.aluno_id);
                  return (
                    <div
                      key={inscrito.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{aluno?.nome || 'Aluno'}</p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(inscrito.data_inscricao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inscrito.status)}
                        {inscrito.status === 'inscrito' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => marcarPresenca(inscrito.id)}
                              title="Marcar presença"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => marcarFalta(inscrito.id)}
                              title="Marcar falta"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => cancelarInscricao(inscrito.id)}
                          title="Cancelar inscrição"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhum inscrito ainda
            </p>
          )}
        </div>

        {/* Lista de Espera */}
        {listaEspera.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">
              Lista de Espera ({listaEspera.length})
            </h4>
            <div className="space-y-2">
              {listaEspera.map((inscrito, index) => {
                const aluno = getAlunoInfo(inscrito.aluno_id);
                return (
                  <div
                    key={inscrito.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{aluno?.nome || 'Aluno'}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6"
                      onClick={() => cancelarInscricao(inscrito.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
