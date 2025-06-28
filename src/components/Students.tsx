import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, User, Phone, Mail, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentProfile } from "./StudentProfile";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  startDate: string;
  paymentMethod?: string;
  emergencyContact?: string;
  medicalInfo?: string;
}

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    paymentMethod: "",
    emergencyContact: "",
    medicalInfo: ""
  });

  const { toast } = useToast();

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.phone || !newStudent.plan) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const student: Student = {
      id: students.length + 1,
      ...newStudent,
      status: "Ativo",
      startDate: new Date().toISOString().split('T')[0]
    };

    setStudents([...students, student]);
    setNewStudent({
      name: "",
      email: "",
      phone: "",
      plan: "",
      paymentMethod: "",
      emergencyContact: "",
      medicalInfo: ""
    });

    toast({
      title: "Sucesso",
      description: "Aluno cadastrado com sucesso!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Inativo":
        return "bg-red-100 text-red-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStudent) {
    return (
      <StudentProfile 
        student={selectedStudent} 
        onBack={() => setSelectedStudent(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Alunos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus alunos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-96 overflow-y-auto">
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="plan">Plano *</Label>
                <Select value={newStudent.plan} onValueChange={(value) => setNewStudent({...newStudent, plan: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={newStudent.paymentMethod} onValueChange={(value) => setNewStudent({...newStudent, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                <Input
                  id="emergencyContact"
                  value={newStudent.emergencyContact}
                  onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})}
                  placeholder="Nome e telefone"
                />
              </div>

              <div>
                <Label htmlFor="medicalInfo">Informações Médicas</Label>
                <Textarea
                  id="medicalInfo"
                  value={newStudent.medicalInfo}
                  onChange={(e) => setNewStudent({...newStudent, medicalInfo: e.target.value})}
                  placeholder="Restrições, lesões, medicamentos..."
                />
              </div>
              
              <Button onClick={handleAddStudent} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Cadastrar Aluno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Pesquisar alunos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {students.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro aluno</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    {student.name}
                  </CardTitle>
                  <Badge className={student.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {student.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                  <div className="text-sm">
                    <strong>Plano:</strong> {student.plan}
                  </div>
                  <div className="text-sm text-gray-500">
                    Início: {new Date(student.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Perfil
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Editar
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
