
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { StudentCard, StudentCardData } from "./StudentCard";

interface StudentsListProps {
  students: StudentCardData[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onViewProfile: (student: StudentCardData) => void;
  onEditStudent: (student: StudentCardData) => void;
}

export function StudentsList({ 
  students, 
  searchTerm, 
  onSearchChange, 
  onViewProfile, 
  onEditStudent 
}: StudentsListProps) {
  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.telefone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Pesquisar alunos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {students.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece cadastrando seu primeiro aluno</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onViewProfile={onViewProfile}
              onEditStudent={onEditStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
