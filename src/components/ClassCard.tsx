
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface ClassItem {
  id: number;
  student: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface ClassCardProps {
  classItem: ClassItem;
  onConfirm?: (id: number) => void;
  onCancel?: (id: number) => void;
}

export function ClassCard({ classItem, onConfirm, onCancel }: ClassCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-100 text-green-800";
      case "Agendada":
        return "bg-blue-100 text-blue-800";
      case "Cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            {classItem.time}
          </CardTitle>
          <Badge className={getStatusColor(classItem.status)}>
            {classItem.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{classItem.student}</span>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Tipo:</strong> {classItem.type}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4">
          {classItem.status === "Agendada" && onConfirm && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => onConfirm(classItem.id)}
            >
              Confirmar
            </Button>
          )}
          {onCancel && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => onCancel(classItem.id)}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
