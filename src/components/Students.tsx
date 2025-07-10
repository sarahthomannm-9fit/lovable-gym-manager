
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { SupabaseStudents } from "./SupabaseStudents";
import { DatabaseToggle } from "./DatabaseToggle";
import { useGymData } from "@/contexts/GymDataContext";

export function Students() {
  const { students, addStudent } = useGymData();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [useSupabase, setUseSupabase] = useState(false);

  const handleAddStudent = (studentData: any) => {
    addStudent({
      ...studentData,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      paymentStatus: 'up-to-date' as const
    });
  };

  // If using Supabase, render the Supabase component
  if (useSupabase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Alunos
            </h1>
            <p className="text-gray-600 mt-1">Gerencie seus alunos</p>
          </div>
        </div>
        
        <DatabaseToggle currentMode={useSupabase} onToggle={setUseSupabase} />
        <SupabaseStudents />
      </div>
    );
  }

  // Local version (existing functionality)
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

      <DatabaseToggle currentMode={useSupabase} onToggle={setUseSupabase} />

      <StudentsList 
        students={students}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewProfile={setSelectedStudent}
      />
    </div>
  );
}
