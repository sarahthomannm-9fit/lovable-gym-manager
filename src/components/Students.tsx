
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { useStudents } from "@/hooks/useStudents";

export function Students() {
  const { students, addStudent } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddStudent = (studentData: any) => {
    addStudent(studentData);
  };

  if (selectedStudent) {
    return (
      <StudentProfile 
        student={selectedStudent} 
        onBack={() => setSelectedStudent(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Alunos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus alunos</p>
        </div>
        
        <AddStudentDialog onAddStudent={handleAddStudent} />
      </div>

      <StudentsList 
        students={students}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewProfile={setSelectedStudent}
      />
    </div>
  );
}
