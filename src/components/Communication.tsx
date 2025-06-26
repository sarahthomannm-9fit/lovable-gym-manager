
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Mail, Bell, Send, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  type: 'chat' | 'email' | 'notification';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export function Communication() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'chat',
      from: 'Personal Trainer',
      to: 'João Silva',
      content: 'Lembre-se do treino hoje às 14h!',
      timestamp: '2024-01-23T13:30:00',
      status: 'read'
    },
    {
      id: 2,
      type: 'email',
      from: 'Sistema',
      to: 'Maria Santos',
      subject: 'Avaliação Física Agendada',
      content: 'Sua avaliação física foi agendada para amanhã às 10h.',
      timestamp: '2024-01-23T10:15:00',
      status: 'delivered'
    },
    {
      id: 3,
      type: 'notification',
      from: 'Sistema',
      to: 'Todos os Alunos',
      subject: 'Novos Equipamentos',
      content: 'Temos novos equipamentos disponíveis na academia!',
      timestamp: '2024-01-23T08:00:00',
      status: 'sent'
    }
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Pagamento Recebido',
      message: 'Pagamento de João Silva - R$ 300,00',
      type: 'success',
      timestamp: '2024-01-23T14:20:00',
      read: false
    },
    {
      id: 2,
      title: 'Aula Cancelada',
      message: 'Maria Santos cancelou a aula de hoje',
      type: 'warning',
      timestamp: '2024-01-23T12:45:00',
      read: true
    },
    {
      id: 3,
      title: 'Nova Avaliação',
      message: 'Pedro Costa solicitou uma reavaliação física',
      type: 'info',
      timestamp: '2024-01-23T09:30:00',
      read: false
    }
  ]);

  const [newMessage, setNewMessage] = useState({
    type: 'chat' as const,
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

    const message: Message = {
      id: messages.length + 1,
      ...newMessage,
      from: 'Personal Trainer',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages([...messages, message]);
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

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "read":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "info":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "notification":
        return <Bell className="w-4 h-4" />;
      case "chat":
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Comunicação
          </h1>
          <p className="text-gray-600 mt-1">Central de mensagens e notificações</p>
        </div>
        
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
                <Select value={newMessage.type} onValueChange={(value: 'chat' | 'email' | 'notification') => setNewMessage({...newMessage, type: value})}>
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
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="space-y-4">
            {/* Estatísticas de mensagens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Total Enviadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{messages.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Lidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {messages.filter(msg => msg.status === 'read').length}
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
                    {messages.filter(msg => msg.status === 'sent').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de mensagens */}
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-full">
                          {getMessageIcon(message.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{message.to}</span>
                            <Badge className={getStatusColor(message.status)}>
                              {message.status}
                            </Badge>
                          </div>
                          {message.subject && (
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">{message.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(message.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{notification.title}</span>
                          <Badge className={getNotificationColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          {!notification.read && (
                            <Badge className="bg-blue-600 text-white">Novo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
