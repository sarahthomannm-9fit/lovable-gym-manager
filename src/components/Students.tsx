
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "João Silva",
      phone: "21987654321",
      email: "joao@email.com",
      startDate: "15/08/2023",
      plan: "Pacote 12 aulas",
      objective: "Hipertrofia",
      restrictions: "Lesão no ombro",
      status: "Ativo"
    },
    {
      id: 2,
      name: "Maria Santos",
      phone: "21987654322",
      email: "maria@email.com",
      startDate: "20/08/2023",
      plan: "Mensal",
      objective: "Emagrecimento",
      restrictions: "Nenhuma",
      status: "Ativo"
    },
    {
      id: 3,
      name: "Pedro Costa",
      phone: "21987654323",
      email: "pedro@email.com",
      startDate: "01/09/2023",
      plan: "Trimestral",
      objective: "Resistência",
      restrictions: "Problema no joelho",
      status: "Inativo"
    }
  ]);

  const [newStudent, setNewStudent] = useState({
    name: "",
    phone: "",
    email: "",
    plan: "",
    objective: "",
    restrictions: ""
  });

  const { toast } = useToast();

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.phone || !newStudent.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const student = {
      id: students.length + 1,
      ...newStudent,
      startDate: new Date().toLocaleDateString("pt-BR"),
      status: "Ativo"
    };

    setStudents([...students, student]);
    setNewStudent({
      name: "",
      phone: "",
      email: "",
      plan: "",
      objective: "",
      restrictions: ""
    });

    toast({
      title: "Sucesso",
      description: "Aluno cadastrado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Gerenciar Alunos
          </h1>
          <p className="text-gray-600 mt-1">Cadastre e gerencie seus alunos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  placeholder="Nome do aluno"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                <Input
                  id="phone"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                  placeholder="21987654321"
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="plan">Plano</Label>
                <Select value={newStudent.plan} onValueChange={(value) => setNewStudent({...newStudent, plan: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="pacote12">Pacote 12 aulas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="objective">Objetivo</Label>
                <Select value={newStudent.objective} onValueChange={(value) => setNewStudent({...newStudent, objective: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="resistencia">Resistência</SelectItem>
                    <SelectItem value="condicionamento">Condicionamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="restrictions">Restrições/Observações</Label>
                <Textarea
                  id="restrictions"
                  value={newStudent.restrictions}
                  onChange={(e) => setNewStudent({...newStudent, restrictions: e.target.value})}
                  placeholder="Lesões, condições médicas, etc."
                />
              </div>
              
              <Button onClick={handleAddStudent} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Cadastrar Aluno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{student.name}</CardTitle>
                <Badge variant={student.status === "Ativo" ? "default" : "secondary"}>
                  {student.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{student.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{student.email}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm"><strong>Plano:</strong> {student.plan}</p>
                  <p className="text-sm"><strong>Objetivo:</strong> {student.objective}</p>
                  <p className="text-sm"><strong>Início:</strong> {student.startDate}</p>
                </div>
                
                {student.restrictions && student.restrictions !== "Nenhuma" && (
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Restrições:</strong> {student.restrictions}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
