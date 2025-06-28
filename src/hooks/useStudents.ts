
import { useState } from "react";

export interface Student {
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

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      id: students.length + 1,
      ...student,
      status: "Ativo"
    };
    setStudents([...students, newStudent]);
    return newStudent;
  };

  const updateStudent = (id: number, updates: Partial<Student>) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, ...updates } : student
    ));
  };

  const deleteStudent = (id: number) => {
    setStudents(prev => prev.filter(student => student.id !== id));
  };

  return {
    students,
    addStudent,
    updateStudent,
    deleteStudent
  };
}
