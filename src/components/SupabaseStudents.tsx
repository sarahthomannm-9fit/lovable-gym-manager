
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { EditStudentDialog } from "./students/EditStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { convertSupabaseStudentToOld } from "@/utils/dataConverters";
import { Student } from "@/types/gym";

export function SupabaseStudents() {
  const { 
    students: supabaseStudents, 
    studentsLoading, 
    addStudent, 
    updateStudent,
    plans: supabasePlans,
    plansLoading
  } = useSupabaseGymData();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Convert Supabase students to old format for UI compatibility
  const students = supabaseStudents.map(convertSupabaseStudentToOld);

  const handleAddStudent = async (studentData: any) => {
    try {
      await addStudent(studentData);
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  const handleUpdateStudent = async (id: string, updates: any) => {
    try {
      await updateStudent(id, updates);
      setEditingStudent(null);
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  if (studentsLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
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
        
        <AddStudentDialog 
          onAddStudent={handleAddStudent} 
          plans={supabasePlans}
        />
      </div>

      <StudentsList 
        students={students}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewProfile={setSelectedStudent}
        onEditStudent={setEditingStudent}
      />

      <EditStudentDialog
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onUpdateStudent={handleUpdateStudent}
        plans={supabasePlans}
      />
    </div>
  );
}
