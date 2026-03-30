import { useState } from "react";
import { StudentProfile } from "./StudentProfile";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { EditStudentDialog } from "./students/EditStudentDialog";
import { StudentsList } from "./students/StudentsList";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageShell } from "./warroom/PageShell";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";
import { StudentCardData } from "./students/StudentCard";
import { Plus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SupabaseStudents() {
  const { 
    students: supabaseStudents, studentsLoading, addStudent, updateStudent, deleteStudent,
    plans: supabasePlans, plansLoading, payments, checkIns
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

  if (selectedStudent) {
    const plan = supabasePlans.find(p => p.id === selectedStudent.plano_id);
    return (
      <StudentProfile student={selectedStudent as any} onBack={() => setSelectedStudent(null)} planName={plan?.nome} />
    );
  }

  // Metrics
  const total = supabaseStudents.length;
  const ativos = supabaseStudents.filter(s => s.status === 'ativo').length;
  const inativos = total - ativos;
  
  // Churn risk: ativos sem checkin recente
  const hoje = new Date();
  const quinzeDias = new Date(hoje.getTime() - 15 * 86400000).toISOString().split('T')[0];
  const comCheckin = new Set((checkIns || []).filter((c: any) => c.data_checkin >= quinzeDias).map((c: any) => c.aluno_id));
  const emRisco = supabaseStudents.filter(s => s.status === 'ativo' && !comCheckin.has(s.id)).length;

  // Inadimplentes
  const hojeStr = hoje.toISOString().split('T')[0];
  const inadimplentesSet = new Set(
    (payments || []).filter((p: any) => p.status !== 'pago' && p.data_vencimento < hojeStr).map((p: any) => p.aluno_id)
  );
  const inadimplentes = supabaseStudents.filter(s => inadimplentesSet.has(s.id)).length;

  const hasCritical = inadimplentes > 0 || emRisco > 5;

  const shellMetrics = [
    { label: 'TOTAL', value: String(total) },
    { label: 'ATIVOS', value: String(ativos), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'INATIVOS', value: String(inativos), color: inativos > 0 ? 'text-[hsl(var(--urgency-attention))]' : undefined },
    { label: 'RISCO CHURN', value: String(emRisco), sub: '15d+ sem freq', color: emRisco > 0 ? 'text-[hsl(var(--urgency-critical))]' : undefined },
    { label: 'INADIMPL.', value: String(inadimplentes), color: inadimplentes > 0 ? 'text-[hsl(var(--urgency-critical))]' : undefined },
  ];

  const loading = studentsLoading || plansLoading;

  if (loading) {
    return (
      <PageShell title="ALUNOS" sub="Carregando...">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}
        </div>
      </PageShell>
    );
  }

  if (total === 0) {
    return (
      <PageShell title="ALUNOS" sub="Nenhum aluno cadastrado">
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">Cadastre seu primeiro aluno</p>
                <p className="text-sm text-muted-foreground mt-1">Comece adicionando alunos para gerenciar sua academia.</p>
              </div>
              <AddStudentDialog onAddStudent={handleAddStudent} plans={supabasePlans} />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  const studentsForList: StudentCardData[] = supabaseStudents.map(s => ({
    id: s.id, nome: s.nome, email: s.email || '', telefone: s.telefone,
    tipo: s.tipo, status: s.status, data_matricula: s.data_matricula,
    valor_mensalidade: s.valor_mensalidade, categoria_aluno: s.categoria_aluno,
    dias_aula: s.dias_aula, dia_pagamento: s.dia_pagamento, _original: s,
  }));

  return (
    <PageShell 
      title="ALUNOS" 
      sub={`${ativos} ativos · ${emRisco} em risco`}
      criticals={hasCritical ? inadimplentes + emRisco : undefined}
      metrics={shellMetrics}
      actions={<AddStudentDialog onAddStudent={handleAddStudent} plans={supabasePlans} />}
    >
      <StudentsList 
        students={studentsForList}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewProfile={(student) => {
          const original = student._original || supabaseStudents.find(s => s.id === student.id);
          setSelectedStudent(original || null);
        }}
        onEditStudent={(student) => setEditingStudent(student)}
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
        description="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteStudent}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </PageShell>
  );
}
