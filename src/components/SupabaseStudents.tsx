
import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { EditStudentDialog } from "./students/EditStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { ConfirmDialog } from "./ConfirmDialog";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";
import { StudentCardData } from "./students/StudentCard";

export function SupabaseStudents() {
  const { 
    students: supabaseStudents, 
    studentsLoading, 
    addStudent, 
    updateStudent,
    deleteStudent,
    plans: supabasePlans,
    plansLoading
  } = useSupabaseGymData();
  
  const [selectedStudent, setSelectedStudent] = useState<SupabaseStudent | null>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddStudent = async (studentData: any) => {
    try { await addStudent(studentData); } catch (error) { console.error('Failed to add student:', error); }
  };

  const handleUpdateStudent = async (id: string, updates: any) => {
    try { await updateStudent(id, updates); setEditingStudent(null); } catch (error) { console.error('Failed to update student:', error); }
  };

  const handleDeleteStudent = async () => {
    if (!deletingId) return;
    try { await deleteStudent(deletingId); } catch (error) { console.error('Failed to delete student:', error); }
    setDeletingId(null);
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

  const studentsForList: StudentCardData[] = supabaseStudents.map(s => ({
    id: s.id,
    nome: s.nome,
    email: s.email || '',
    telefone: s.telefone,
    tipo: s.tipo,
    status: s.status,
    data_matricula: s.data_matricula,
    valor_mensalidade: s.valor_mensalidade,
    categoria_aluno: s.categoria_aluno,
    dias_aula: s.dias_aula,
    dia_pagamento: s.dia_pagamento,
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
        onViewProfile={(student) => {
          const original = student._original || supabaseStudents.find(s => s.id === student.id);
          setSelectedStudent(original || null);
        }}
        onEditStudent={setEditingStudent}
        onDeleteStudent={(student) => setDeletingId(student.id)}
      />

      <EditStudentDialog
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onUpdateStudent={handleUpdateStudent}
        plans={supabasePlans}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Excluir Aluno"
        description="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
        onConfirm={handleDeleteStudent}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
