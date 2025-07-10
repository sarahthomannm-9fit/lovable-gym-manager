
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { convertSupabaseStudentToOld, convertOldStudentToSupabase } from "@/utils/dataConverters";
import { Student } from "@/types/gym";

export function SupabaseStudents() {
  const { 
    students: supabaseStudents, 
    studentsLoading, 
    addStudent, 
    updateStudent 
  } = useSupabaseGymData();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Convert Supabase students to old format for UI compatibility
  const students = supabaseStudents.map(convertSupabaseStudentToOld);

  const handleAddStudent = async (studentData: any) => {
    try {
      const supabaseData = convertOldStudentToSupabase({
        ...studentData,
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        paymentStatus: 'up-to-date' as const
      });
      
      await addStudent(supabaseData);
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando alunos...</div>
      </div>
    );
  }

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
            Alunos (Supabase)
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus alunos conectados ao banco de dados</p>
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
