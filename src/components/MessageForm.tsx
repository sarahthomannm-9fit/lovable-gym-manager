
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/communication";

interface MessageFormProps {
  onSendMessage: (message: Omit<Message, 'id' | 'from' | 'timestamp' | 'status'>) => void;
}

export function MessageForm({ onSendMessage }: MessageFormProps) {
  const [newMessage, setNewMessage] = useState<{
    type: 'chat' | 'email' | 'notification';
    to: string;
    subject: string;
    content: string;
  }>({
    type: 'chat',
    to: '',
    subject: '',
    content: ''
  });

  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!newMessage.to || !newMessage.content) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onSendMessage(newMessage);
    setNewMessage({
      type: 'chat',
      to: '',
      subject: '',
      content: ''
    });

    toast({
      title: "Mensagem Enviada",
      description: "Sua mensagem foi enviada com sucesso!",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova Mensagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Mensagem</Label>
            <Select value={newMessage.type} onValueChange={(value: string) => setNewMessage({...newMessage, type: value as 'chat' | 'email' | 'notification'})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat/SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="notification">Notificação Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="to">Destinatário *</Label>
            <Select value={newMessage.to} onValueChange={(value) => setNewMessage({...newMessage, to: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destinatário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="João Silva">João Silva</SelectItem>
                <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                <SelectItem value="Ana Paula">Ana Paula</SelectItem>
                <SelectItem value="Todos os Alunos">Todos os Alunos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {newMessage.type === 'email' && (
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                placeholder="Assunto do email"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="content">Mensagem *</Label>
            <Textarea
              id="content"
              value={newMessage.content}
              onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
              placeholder="Digite sua mensagem..."
              rows={4}
            />
          </div>
          
          <Button onClick={handleSendMessage} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
            <Send className="w-4 h-4 mr-2" />
            Enviar Mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
