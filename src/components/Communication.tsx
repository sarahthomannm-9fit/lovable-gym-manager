import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageForm } from "./MessageForm";
import { MessageStats } from "./MessageStats";
import { MessageList } from "./MessageList";
import { NotificationList } from "./NotificationList";
import { useMessages } from "@/hooks/useMessages";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { Notification } from "@/types/communication";

export function Communication() {
  const { messages, handleSendMessage } = useMessages();
  const { notificacoes, marcarComoLida, loading } = useNotificacoes();

  // Map notification type to expected format
  const mapNotificationType = (tipo: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (tipo) {
      case 'pagamento':
      case 'promocao':
        return 'success';
      case 'lembrete':
      case 'avaliacao':
        return 'warning';
      case 'sistema':
        return 'error';
      default:
        return 'info';
    }
  };

  // Convert Supabase notifications to the format expected by NotificationList
  const notifications: Notification[] = notificacoes.map(n => ({
    id: parseInt(n.id.slice(0, 8), 16) || Math.random() * 1000000, // Convert UUID to number
    title: n.titulo,
    message: n.mensagem,
    type: mapNotificationType(n.tipo),
    read: n.status === 'lida',
    timestamp: n.created_at || new Date().toISOString()
  }));

  const handleMarkAsRead = (id: number) => {
    // Find the original notification by the converted id
    const notification = notificacoes.find(n => 
      (parseInt(n.id.slice(0, 8), 16) || 0) === id
    );
    if (notification) {
      marcarComoLida(notification.id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Comunicação
          </h1>
          <p className="text-muted-foreground mt-1">Central de mensagens e notificações</p>
        </div>
        
        <MessageForm onSendMessage={handleSendMessage} />
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="space-y-4">
            <MessageStats messages={messages} />
            <MessageList messages={messages} />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : (
            <NotificationList 
              notifications={notifications} 
              onMarkAsRead={handleMarkAsRead} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}