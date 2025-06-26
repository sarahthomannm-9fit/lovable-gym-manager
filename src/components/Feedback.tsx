
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, MessageSquare, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      student: "João Silva",
      date: "2024-01-15",  
      rating: 5,
      message: "Treino excelente! Me senti muito bem e consegui executar todos os exercícios.",
      response: "Que ótimo João! Continue assim que os resultados virão!"
    },
    {
      id: 2,
      student: "Maria Santos",
      date: "2024-01-14",
      rating: 4,
      message: "Gostei da aula, mas achei um pouco intensa. Talvez possamos ajustar?",
      response: ""
    },
    {
      id: 3,
      student: "Pedro Costa", 
      date: "2024-01-13",
      rating: 5,
      message: "Perfeito! Estou vendo resultados e me sentindo mais forte.",
      response: "Excelente Pedro! Seus esforços estão dando resultado!"
    }
  ]);

  const [responses, setResponses] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const handleResponse = (feedbackId: number) => {
    const response = responses[feedbackId];
    if (!response?.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma resposta antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setFeedbacks(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, response } : f
    ));

    setResponses(prev => ({ ...prev, [feedbackId]: "" }));

    toast({
      title: "Sucesso",
      description: "Resposta enviada com sucesso!",
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

  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  const satisfactionRate = Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Feedback dos Alunos
          </h1>
          <p className="text-gray-600 mt-1">Receba e responda feedbacks sobre os treinos</p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-yellow-800">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Total de Feedbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {feedbacks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Taxa de Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {satisfactionRate}%
            </div>
            <p className="text-xs text-green-600 mt-1">Notas 4 e 5</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de feedbacks */}
      <div className="space-y-4">
        {feedbacks
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{feedback.student}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {new Date(feedback.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(feedback.rating)}
                    </div>
                    <span className="font-bold text-yellow-600">
                      {feedback.rating}/5
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 italic">"{feedback.message}"</p>
                  </div>
                  
                  {feedback.response ? (
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-800 mb-1">Sua resposta:</p>
                      <p className="text-blue-700">"{feedback.response}"</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Digite sua resposta para o aluno..."
                        value={responses[feedback.id] || ""}
                        onChange={(e) => setResponses(prev => ({ 
                          ...prev, 
                          [feedback.id]: e.target.value 
                        }))}
                      />
                      <Button 
                        onClick={() => handleResponse(feedback.id)}
                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Resposta
                      </Button>
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
