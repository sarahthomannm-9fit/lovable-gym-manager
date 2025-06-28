
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
  performanceData?: PerformanceData;
}

export interface PerformanceData {
  weight: number[];
  bodyFat: number[];
  muscle: number[];
  dates: string[];
  workoutData: WorkoutData[];
  frequency: number;
}

export interface WorkoutData {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      plan: "Mensal",
      status: "Ativo",
      startDate: "2024-01-15",
      paymentMethod: "PIX",
      emergencyContact: "Maria Silva - (11) 88888-8888",
      medicalInfo: "Sem restrições",
      performanceData: {
        weight: [75.2, 74.8, 74.2, 73.8, 73.5],
        bodyFat: [18.5, 17.8, 17.2, 16.8, 16.2],
        muscle: [42.1, 42.8, 43.5, 44.1, 44.8],
        dates: ["Jan", "Fev", "Mar", "Abr", "Mai"],
        workoutData: [
          { exercise: "Supino", weight: 80, reps: 12, sets: 3 },
          { exercise: "Agachamento", weight: 120, reps: 10, sets: 4 },
          { exercise: "Levantamento", weight: 100, reps: 8, sets: 3 },
          { exercise: "Desenvolvimento", weight: 60, reps: 12, sets: 3 }
        ],
        frequency: 95
      }
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      plan: "Trimestral",
      status: "Ativo",
      startDate: "2024-01-20",
      paymentMethod: "Cartão",
      emergencyContact: "Pedro Santos - (11) 77777-7777",
      medicalInfo: "Hipertensão controlada",
      performanceData: {
        weight: [68.0, 67.5, 67.0, 66.8, 66.5],
        bodyFat: [22.0, 21.5, 21.0, 20.5, 20.0],
        muscle: [38.5, 39.0, 39.5, 40.0, 40.5],
        dates: ["Jan", "Fev", "Mar", "Abr", "Mai"],
        workoutData: [
          { exercise: "Leg Press", weight: 150, reps: 15, sets: 3 },
          { exercise: "Puxada", weight: 40, reps: 12, sets: 3 },
          { exercise: "Rosca", weight: 15, reps: 15, sets: 3 }
        ],
        frequency: 88
      }
    }
  ]);

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

  const getStudentById = (id: number) => {
    return students.find(student => student.id === id);
  };

  return {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById
  };
}
