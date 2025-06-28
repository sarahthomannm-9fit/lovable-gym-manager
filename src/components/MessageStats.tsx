
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Message } from "@/types/communication";

interface MessageStatsProps {
  messages: Message[];
}

export function MessageStats({ messages }: MessageStatsProps) {
  return (
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
  );
}
