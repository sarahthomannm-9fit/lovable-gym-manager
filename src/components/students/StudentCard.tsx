
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Eye } from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  startDate: string;
  paymentMethod?: string;
  emergencyContact?: string;
  medicalInfo?: string;
}

interface StudentCardProps {
  student: Student;
  onViewProfile: (student: Student) => void;
}

export function StudentCard({ student, onViewProfile }: StudentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            {student.name}
          </CardTitle>
          <Badge className={student.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {student.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{student.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{student.phone}</span>
          </div>
          <div className="text-sm">
            <strong>Plano:</strong> {student.plan}
          </div>
          <div className="text-sm text-gray-500">
            Início: {new Date(student.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button 
            size="sm" 
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={() => onViewProfile(student)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Perfil
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
