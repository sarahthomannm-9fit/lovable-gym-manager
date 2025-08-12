
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Suggestion = {
  title: string;
  description: string;
  categoria?: string;
  canal?: string;
};

const SUGGESTIONS: Record<string, Suggestion[]> = {
  captacao: [
    { title: "Campanha Instagram", description: "Divulgar aula experimental gratuita.", categoria: "captacao", canal: "instagram" },
    { title: "Google Ads Local", description: "Anúncios para moradores próximos.", categoria: "captacao", canal: "ads" },
  ],
  campanhas: [
    { title: "Reativação de ex-alunos", description: "Ofereça um benefício de retorno.", categoria: "comunicacao", canal: "whatsapp" },
  ],
  conversao: [
    { title: "Follow-up WhatsApp", description: "Mensagem automática após visita.", categoria: "conversao", canal: "whatsapp" },
  ],
  email: [
    { title: "Newsletter Mensal", description: "Conteúdos e promoções do mês.", categoria: "email", canal: "email" },
  ],
  promocoes: [
    { title: "Amigo Indica Amigo", description: "Benefícios para ambos os amigos.", categoria: "promocao", canal: "whatsapp" },
  ],
  comunicacao: [
    { title: "Boas-vindas novos leads", description: "Mensagem de apresentação e horários.", categoria: "comunicacao", canal: "whatsapp" },
  ],
};

export function MarketingSuggestions({
  context,
  onCreateFromSuggestion,
}: {
  context: "captacao" | "campanhas" | "conversao" | "email" | "promocoes" | "comunicacao";
  onCreateFromSuggestion: (s: Suggestion) => void;
}) {
  const suggestions = SUGGESTIONS[context] || [];

  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestões</CardTitle>
        <CardDescription>Ideias rápidas para iniciar ações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {suggestions.map((s, idx) => (
            <div key={idx} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{s.title}</h4>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
              <Button variant="outline" onClick={() => onCreateFromSuggestion(s)}>Criar</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
