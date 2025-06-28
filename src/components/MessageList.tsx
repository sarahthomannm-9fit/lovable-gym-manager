
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Bell } from "lucide-react";
import { Message } from "@/types/communication";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
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
  );
}
