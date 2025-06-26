
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star, MessageSquare, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      student: "João Silva",
      classDate: "2024-01-15",
      rating: 5,
      comments: "Excelente treino! Me senti muito bem e consegui executar todos os exercícios corretamente."
    },
    {
      id: 2,
      student: "Maria Santos",
      classDate: "2024-01-14",
      rating: 4,
      comments: "Ótima aula, mas achei um pouco puxado. Talvez possa diminuir um pouco a intensidade."
    },
    {
      id: 3,
      student: "Pedro Costa",
      classDate: "2024-01-13",
      rating: 5,
      comments: "Treino perfeito! Estou vendo resultados e me sentindo mais forte a cada dia."
    },
    {
      id: 4,
      student: "Ana Paula",
      classDate: "2024-01-12",
      rating: 3,
      comments: "A aula foi boa, mas tive dificuldade com alguns exercícios. Preciso de mais orientação."
    }
  ]);

  const [newFeedback, setNewFeedback] = useState({
    student: "",
    classDate: "",
    rating: "",
    comments: ""
  });

  const { toast } = useToast();

  const handleAddFeedback = () => {
    if (!newFeedback.student || !newFeedback.classDate || !newFeedback.rating) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const feedback = {
      id: feedbacks.length + 1,
      ...newFeedback,
      rating: parseInt(newFeedback.rating)
    };

    setFeedbacks([...feedbacks, feedback]);
    setNewFeedback({
      student: "",
      classDate: "",
      rating: "",
      comments: ""
    });

    toast({
      title: "Sucesso",
      description: "Feedback registrado com sucesso!",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? "text-yellow-400 fill-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Feedback dos Alunos
          </h1>
          <p className="text-gray-600 mt-1">Colete e analise avaliações das aulas</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Aluno *</Label>
                <Select value={newFeedback.student} onValueChange={(value) => setNewFeedback({...newFeedback, student: value})}>
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
                <Label htmlFor="classDate">Data da Aula *</Label>
                <Input
                  id="classDate"
                  type="date"
                  value={newFeedback.classDate}
                  onChange={(e) => setNewFeedback({...newFeedback, classDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="rating">Nota (1-5) *</Label>
                <Select value={newFeedback.rating} onValueChange={(value) => setNewFeedback({...newFeedback, rating: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a nota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Ruim</SelectItem>
                    <SelectItem value="2">2 - Ruim</SelectItem>
                    <SelectItem value="3">3 - Regular</SelectItem>
                    <SelectItem value="4">4 - Bom</SelectItem>
                    <SelectItem value="5">5 - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="comments">Comentários</Label>
                <Textarea
                  id="comments"
                  value={newFeedback.comments}
                  onChange={(e) => setNewFeedback({...newFeedback, comments: e.target.value})}
                  placeholder="Comentários sobre a aula..."
                />
              </div>
              
              <Button onClick={handleAddFeedback} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Salvar Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-blue-50 to-green-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-600" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-yellow-600">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
              Total de Feedbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {feedbacks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Star className="w-4 h-4 mr-2 text-green-600" />
              Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Notas 4 e 5</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Feedbacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks
          .sort((a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime())
          .map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{feedback.student}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(feedback.rating)}
                    </div>
                    <span className={`font-bold ${getRatingColor(feedback.rating)}`}>
                      {feedback.rating}/5
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Aula de {new Date(feedback.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {feedback.comments && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 italic">
                        "{feedback.comments}"
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
