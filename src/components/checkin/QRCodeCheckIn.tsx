import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Search, UserCheck, UserMinus, Clock, RefreshCw } from 'lucide-react';
import { useFrequencia } from '@/hooks/useFrequencia';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

export function QRCodeCheckIn() {
  const { students } = useSupabaseGymData();
  const { 
    registrarEntrada, 
    registrarSaida, 
    getAlunosNaAcademia,
    getFrequenciaHoje,
    refetch 
  } = useFrequencia();
  
  const [qrInput, setQrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simular leitura de QR Code (foco automático no input)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    // QR Code pode conter ID do aluno ou email
    const aluno = students.find(
      s => s.id === qrInput || s.email.toLowerCase() === qrInput.toLowerCase()
    );

    if (!aluno) {
      setLastAction(`Aluno não encontrado: ${qrInput}`);
      setQrInput('');
      return;
    }

    // Verificar se já está na academia
    const alunosNaAcademia = getAlunosNaAcademia();
    const estaPresente = alunosNaAcademia.some(f => f.aluno_id === aluno.id);

    if (estaPresente) {
      await registrarSaida(aluno.id);
      setLastAction(`Check-out: ${aluno.nome}`);
    } else {
      await registrarEntrada(aluno.id, 'qrcode');
      setLastAction(`Check-in: ${aluno.nome}`);
    }
    
    setQrInput('');
    inputRef.current?.focus();
  };

  const handleManualCheckIn = async (alunoId: string, nome: string) => {
    const alunosNaAcademia = getAlunosNaAcademia();
    const estaPresente = alunosNaAcademia.some(f => f.aluno_id === alunoId);

    if (estaPresente) {
      await registrarSaida(alunoId);
      setLastAction(`Check-out: ${nome}`);
    } else {
      await registrarEntrada(alunoId, 'manual');
      setLastAction(`Check-in: ${nome}`);
    }
    setSearchQuery('');
  };

  const filteredStudents = students.filter(s =>
    s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const alunosNaAcademia = getAlunosNaAcademia();
  const frequenciaHoje = getFrequenciaHoje();

  const getAlunoNome = (alunoId: string) => {
    return students.find(s => s.id === alunoId)?.nome || 'Aluno desconhecido';
  };

  return (
    <div className="space-y-6">
      {/* Scanner QR Code */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Scanner QR Code / Biometria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQRSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Escaneie o QR Code ou digite o ID do aluno..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="text-lg h-12 font-mono"
                autoComplete="off"
              />
              <Button type="submit" size="lg" className="h-12">
                <Camera className="w-5 h-5 mr-2" />
                Registrar
              </Button>
            </div>
            
            {lastAction && (
              <div className="p-3 bg-primary/10 rounded-lg text-center font-medium text-primary">
                {lastAction}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Na Academia</p>
                <p className="text-3xl font-bold text-green-600">{alunosNaAcademia.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas Hoje</p>
                <p className="text-3xl font-bold text-blue-600">{frequenciaHoje.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alunos</p>
                <p className="text-3xl font-bold text-purple-600">{students.length}</p>
              </div>
              <UserMinus className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Busca Manual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Check-in Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar aluno por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {searchQuery && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.slice(0, 10).map((student) => {
                    const estaPresente = alunosNaAcademia.some(f => f.aluno_id === student.id);
                    
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{student.nome}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={student.status === 'ativo' ? 'default' : 'destructive'}>
                            {student.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant={estaPresente ? 'outline' : 'default'}
                            onClick={() => handleManualCheckIn(student.id, student.nome)}
                            disabled={student.status !== 'ativo'}
                          >
                            {estaPresente ? 'Check-out' : 'Check-in'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum aluno encontrado
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alunos na Academia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              Na Academia ({alunosNaAcademia.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {alunosNaAcademia.length > 0 ? (
                alunosNaAcademia.map((freq) => {
                  const entrada = new Date(freq.horario_entrada);
                  const minutos = Math.floor((Date.now() - entrada.getTime()) / 60000);
                  
                  return (
                    <div
                      key={freq.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{getAlunoNome(freq.aluno_id)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-xs">({minutos} min)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {freq.tipo_entrada}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => registrarSaida(freq.aluno_id)}
                        >
                          Saída
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum aluno na academia
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
