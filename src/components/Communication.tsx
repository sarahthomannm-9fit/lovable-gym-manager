
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageForm } from "./MessageForm";
import { MessageStats } from "./MessageStats";
import { MessageList } from "./MessageList";
import { NotificationList } from "./NotificationList";
import { useMessages } from "@/hooks/useMessages";
import { useNotifications } from "@/hooks/useNotifications";

export function Communication() {
  const { messages, handleSendMessage } = useMessages();
  const { notifications, markNotificationAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Comunicação
          </h1>
          <p className="text-gray-600 mt-1">Central de mensagens e notificações</p>
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
          <NotificationList 
            notifications={notifications} 
            onMarkAsRead={markNotificationAsRead} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
