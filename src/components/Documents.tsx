
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Upload, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  student: string;
  type: string;
  name: string;
  status: string;
  createdAt: string;
  signedAt?: string;
  content?: string;
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      student: "João Silva",
      type: "Contrato",
      name: "Contrato de Personal Training",
      status: "Assinado",
      createdAt: "2024-01-15",
      signedAt: "2024-01-16"
    },
    {
      id: 2,
      student: "Maria Santos",
      type: "Anamnese",
      name: "Avaliação Física Inicial",
      status: "Pendente",
      createdAt: "2024-01-20"
    },
    {
      id: 3,
      student: "Pedro Costa",
      type: "Atestado",
      name: "Liberação Médica para Exercícios",
      status: "Aprovado",
      createdAt: "2024-01-18",
      signedAt: "2024-01-19"
    },
    {
      id: 4,
      student: "Ana Paula",
      type: "Termo",
      name: "Termo de Responsabilidade",
      status: "Pendente",
      createdAt: "2024-01-22"
    }
  ]);

  const [newDocument, setNewDocument] = useState({
    student: "",
    type: "",
    name: "",
    content: ""
  });

  const { toast } = useToast();

  const handleAddDocument = () => {
    if (!newDocument.student || !newDocument.type || !newDocument.name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const document: Document = {
      id: documents.length + 1,
      ...newDocument,
      status: "Pendente",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setDocuments([...documents, document]);
    setNewDocument({
      student: "",
      type: "",
      name: "",
      content: ""
    });

    toast({
      title: "Sucesso",
      description: "Documento criado com sucesso!",
    });
  };

  const handleSignDocument = (id: number) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { 
        ...doc, 
        status: "Assinado", 
        signedAt: new Date().toISOString().split('T')[0] 
      } : doc
    ));

    toast({
      title: "Documento Assinado",
      description: "Assinatura digital registrada com sucesso!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assinado":
        return "bg-green-100 text-green-800";
      case "Aprovado":
        return "bg-blue-100 text-blue-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Rejeitado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Documentos e Contratos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie contratos, anamneses e documentos legais</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Aluno *</Label>
                <Select value={newDocument.student} onValueChange={(value) => setNewDocument({...newDocument, student: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="João Silva">João Silva</SelectItem>
                    <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                    <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                    <SelectItem value="Ana Paula">Ana Paula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de Documento *</Label>
                <Select value={newDocument.type} onValueChange={(value) => setNewDocument({...newDocument, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contrato">Contrato</SelectItem>
                    <SelectItem value="Anamnese">Anamnese</SelectItem>
                    <SelectItem value="Atestado">Atestado Médico</SelectItem>
                    <SelectItem value="Termo">Termo de Responsabilidade</SelectItem>
                    <SelectItem value="Certificado">Certificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Nome do Documento *</Label>
                <Input
                  id="name"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                  placeholder="Ex: Contrato de Personal Training"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Conteúdo/Observações</Label>
                <Textarea
                  id="content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                  placeholder="Adicione detalhes ou observações sobre o documento"
                  rows={4}
                />
              </div>
              
              <Button onClick={handleAddDocument} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Criar Documento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{documents.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Assinados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {documents.filter(doc => doc.status === "Assinado").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {documents.filter(doc => doc.status === "Pendente").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {documents.filter(doc => {
                const docDate = new Date(doc.createdAt);
                const now = new Date();
                return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(document.type)}
                  <CardTitle className="text-lg font-semibold">{document.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Aluno</p>
                  <p className="font-medium">{document.student}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium">{document.type}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Criado em</p>
                  <p className="font-medium">
                    {new Date(document.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {document.signedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Assinado em</p>
                    <p className="font-medium text-green-600">
                      {new Date(document.signedAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <Eye className="w-3 h-3 mr-1" />
                  Visualizar
                </Button>
                
                {document.status === "Pendente" && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleSignDocument(document.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Assinar
                  </Button>
                )}
                
                <Button size="sm" variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
