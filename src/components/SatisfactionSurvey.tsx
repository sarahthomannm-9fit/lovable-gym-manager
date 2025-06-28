
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, BarChart3 } from "lucide-react";
import { useSatisfactionSurvey } from "@/hooks/useSatisfactionSurvey";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SatisfactionSurvey() {
  const { responses, addResponse, getAverageRatings } = useSatisfactionSurvey();
  const [ratings, setRatings] = useState({
    clarity: 0,
    teacherAttention: 0,
    communication: 0,
    overallSatisfaction: 0
  });
  const [comments, setComments] = useState("");
  const { toast } = useToast();

  const handleRatingChange = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = () => {
    if (Object.values(ratings).some(r => r === 0)) {
      toast({
        title: "Erro",
        description: "Por favor, avalie todos os itens",
        variant: "destructive",
      });
      return;
    }

    addResponse({
      studentId: 1, // Seria o ID do aluno logado
      studentName: "Aluno Exemplo", // Seria o nome do aluno logado
      ...ratings,
      comments: comments || undefined
    });

    setRatings({ clarity: 0, teacherAttention: 0, communication: 0, overallSatisfaction: 0 });
    setComments("");

    toast({
      title: "Sucesso",
      description: "Avaliação enviada com sucesso!",
    });
  };

  const renderStars = (category: keyof typeof ratings, currentRating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-6 h-6 cursor-pointer transition-colors ${
          index < currentRating 
            ? "text-yellow-400 fill-yellow-400" 
            : "text-gray-300 hover:text-yellow-300"
        }`}
        onClick={() => handleRatingChange(category, index + 1)}
      />
    ));
  };

  const averages = getAverageRatings();
  const chartData = averages ? [
    { name: 'Clareza das Aulas', value: parseFloat(averages.clarity) },
    { name: 'Atendimento', value: parseFloat(averages.teacherAttention) },
    { name: 'Comunicação', value: parseFloat(averages.communication) },
    { name: 'Satisfação Geral', value: parseFloat(averages.overallSatisfaction) }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Pesquisa de Satisfação
          </h1>
          <p className="text-gray-600 mt-1">Avalie nossos serviços e nos ajude a melhorar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">Clareza das Aulas</Label>
              <div className="flex space-x-1 mt-2">
                {renderStars('clarity', ratings.clarity)}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Atendimento do Professor</Label>
              <div className="flex space-x-1 mt-2">
                {renderStars('teacherAttention', ratings.teacherAttention)}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Comunicação Geral</Label>
              <div className="flex space-x-1 mt-2">
                {renderStars('communication', ratings.communication)}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Satisfação Geral</Label>
              <div className="flex space-x-1 mt-2">
                {renderStars('overallSatisfaction', ratings.overallSatisfaction)}
              </div>
            </div>

            <div>
              <Label htmlFor="comments">Comentários (Opcional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Deixe seus comentários e sugestões..."
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              Enviar Avaliação
            </Button>
          </CardContent>
        </Card>

        {/* Resultados e Estatísticas */}
        <div className="space-y-6">
          {/* Médias Gerais */}
          {averages && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Médias Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{averages.clarity}</div>
                    <p className="text-sm text-gray-600">Clareza</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{averages.teacherAttention}</div>
                    <p className="text-sm text-gray-600">Atendimento</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{averages.communication}</div>
                    <p className="text-sm text-gray-600">Comunicação</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{averages.overallSatisfaction}</div>
                    <p className="text-sm text-gray-600">Satisfação</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Barras */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análise Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis domain={[0, 5]} stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Total de Respostas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">{responses.length}</div>
                <p className="text-gray-600">Total de Avaliações</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
