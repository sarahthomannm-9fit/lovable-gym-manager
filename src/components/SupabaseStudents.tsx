
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { EditStudentDialog } from "./students/EditStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";

export function SupabaseStudents() {
  const { 
    students: supabaseStudents, 
    studentsLoading, 
    addStudent, 
    updateStudent,
    plans: supabasePlans,
    plansLoading
  } = useSupabaseGymData();
  
  const [selectedStudent, setSelectedStudent] = useState<SupabaseStudent | null>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddStudent = async (studentData: any) => {
    try { await addStudent(studentData); } catch (error) { console.error('Failed to add student:', error); }
  };

  const handleUpdateStudent = async (id: string, updates: any) => {
    try { await updateStudent(id, updates); setEditingStudent(null); } catch (error) { console.error('Failed to update student:', error); }
  };

  if (studentsLoading || plansLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Carregando dados...</div></div>;
  }

  if (selectedStudent) {
    const plan = supabasePlans.find(p => p.id === selectedStudent.plano_id);
    return (
      <StudentProfile 
        student={selectedStudent as any}
        onBack={() => setSelectedStudent(null)}
        planName={plan?.nome}
      />
    );
  }

  // Convert for StudentsList compatibility
  const studentsForList = supabaseStudents.map(s => ({
    id: s.id as any,
    name: s.nome,
    email: s.email || '',
    phone: s.telefone || '',
    plan: s.tipo || 'presencial',
    registrationDate: s.data_matricula || '',
    status: (s.status === 'ativo' ? 'active' : s.status === 'inativo' ? 'inactive' : 'suspended') as any,
    monthlyPayment: s.valor_mensalidade || 0,
    paymentStatus: 'up-to-date' as any,
    _original: s,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus alunos</p>
        </div>
        <AddStudentDialog onAddStudent={handleAddStudent} plans={supabasePlans} />
      </div>

      <StudentsList 
        students={studentsForList}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewProfile={(student: any) => setSelectedStudent(student._original || supabaseStudents.find(s => s.nome === student.name) || null)}
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
