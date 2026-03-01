
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Eye, Edit } from "lucide-react";

export interface StudentCardData {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  tipo?: string | null;
  status?: string | null;
  data_matricula?: string | null;
  valor_mensalidade?: number | null;
  categoria_aluno?: string | null;
  dias_aula?: string[] | null;
  dia_pagamento?: number | null;
  _original?: any;
}

interface StudentCardProps {
  student: StudentCardData;
  onViewProfile: (student: StudentCardData) => void;
  onEditStudent: (student: StudentCardData) => void;
}

export function StudentCard({ student, onViewProfile, onEditStudent }: StudentCardProps) {
  const isActive = student.status === 'ativo' || !student.status;
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            {student.nome}
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Ativo" : student.status === 'inativo' ? "Inativo" : "Suspenso"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{student.email}</span>
          </div>
          {student.telefone && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{student.telefone}</span>
            </div>
          )}
          <div className="text-sm">
            <strong>Modalidade:</strong> {student.tipo === 'consultoria' ? 'Consultoria' : 'Presencial'}
          </div>
          {student.categoria_aluno && (
            <div className="text-sm">
              <strong>Categoria:</strong> {student.categoria_aluno === 'fixo' ? 'Fixo' : student.categoria_aluno === 'variavel' ? 'Variável' : 'Experimental'}
            </div>
          )}
          {student.data_matricula && (
            <div className="text-sm text-muted-foreground">
              Início: {new Date(student.data_matricula + 'T00:00:00').toLocaleDateString('pt-BR')}
            </div>
          )}
          {student.valor_mensalidade != null && student.valor_mensalidade > 0 && (
            <div className="text-sm text-muted-foreground">
              Mensalidade: R$ {student.valor_mensalidade.toLocaleString('pt-BR')}
            </div>
          )}
          {student.dias_aula && student.dias_aula.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {student.dias_aula.map(dia => (
                <Badge key={dia} variant="outline" className="text-xs capitalize">{dia}</Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewProfile(student)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Perfil
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEditStudent(student)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
