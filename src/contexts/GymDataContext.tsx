
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Student, Class, Payment, Equipment, Plan, CheckIn,
  WorkoutTemplate, PerformanceRecord, GymMetrics
} from '@/types/gym';
import { useGymMetrics } from '@/hooks/useGymMetrics';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface GymDataContextType {
  // Data
  students: Student[];
  classes: Class[];
  payments: Payment[];
  equipment: Equipment[];
  plans: Plan[];
  checkIns: CheckIn[];
  workoutTemplates: WorkoutTemplate[];
  performanceRecords: PerformanceRecord[];

  // Actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: number, student: Partial<Student>) => void;
  deleteStudent: (id: number) => void;
  
  addClass: (classItem: Omit<Class, 'id'>) => void;
  updateClass: (id: number, classItem: Partial<Class>) => void;
  deleteClass: (id: number) => void;
  
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: number, equipment: Partial<Equipment>) => void;
  
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  updatePlan: (id: number, plan: Partial<Plan>) => void;
  
  addCheckIn: (checkIn: Omit<CheckIn, 'id'>) => void;
  
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id'>) => void;
  updateWorkoutTemplate: (id: number, template: Partial<WorkoutTemplate>) => void;
  
  addPerformanceRecord: (record: Omit<PerformanceRecord, 'id'>) => void;

  // Calculated metrics
  metrics: GymMetrics;
}

const GymDataContext = createContext<GymDataContextType | undefined>(undefined);

export function GymDataProvider({ children }: { children: ReactNode }) {
  // Estados iniciais com dados de exemplo
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      plan: "Mensal",
      registrationDate: "2024-01-15",
      status: "active",
      monthlyPayment: 100,
      paymentStatus: "up-to-date",
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
      registrationDate: "2024-01-20",
      status: "active",
      monthlyPayment: 150,
      paymentStatus: "up-to-date",
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: "Mensal",
      price: 100,
      duration: 1,
      benefits: ["Acesso total à academia", "Aulas coletivas"],
      active: true
    },
    {
      id: 2,
      name: "Trimestral",
      price: 270,
      duration: 3,
      benefits: ["Acesso total à academia", "Aulas coletivas", "Avaliação física"],
      active: true
    }
  ]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);

  // Persistência no localStorage
  const allData = {
    students, classes, payments, equipment, plans, 
    checkIns, workoutTemplates, performanceRecords
  };

  useLocalStorage('gymData', allData, (data) => {
    setStudents(data.students || []);
    setClasses(data.classes || []);
    setPayments(data.payments || []);
    setEquipment(data.equipment || []);
    setPlans(data.plans || []);
    setCheckIns(data.checkIns || []);
    setWorkoutTemplates(data.workoutTemplates || []);
    setPerformanceRecords(data.performanceRecords || []);
  });

  // Actions
  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: Date.now() };
    setStudents(prev => [...prev, newStudent]);
  };

  const updateStudent = (id: number, studentData: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...studentData } : s));
  };

  const deleteStudent = (id: number) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addClass = (classItem: Omit<Class, 'id'>) => {
    const newClass = { ...classItem, id: Date.now() };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: number, classData: Partial<Class>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...classData } : c));
  };

  const deleteClass = (id: number) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: Date.now().toString() };
    setPayments(prev => [...prev, newPayment]);
    
    updateStudent(payment.studentId, { 
      paymentStatus: 'up-to-date',
      daysOverdue: 0 
    });
  };

  const updatePayment = (id: string, paymentData: Partial<Payment>) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...paymentData } : p));
  };

  const addEquipment = (equipment: Omit<Equipment, 'id'>) => {
    const newEquipment = { ...equipment, id: Date.now() };
    setEquipment(prev => [...prev, newEquipment]);
  };

  const updateEquipment = (id: number, equipmentData: Partial<Equipment>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...equipmentData } : e));
  };

  const addPlan = (plan: Omit<Plan, 'id'>) => {
    const newPlan = { ...plan, id: Date.now() };
    setPlans(prev => [...prev, newPlan]);
  };

  const updatePlan = (id: number, planData: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...planData } : p));
  };

  const addCheckIn = (checkIn: Omit<CheckIn, 'id'>) => {
    const newCheckIn = { ...checkIn, id: Date.now().toString() };
    setCheckIns(prev => [...prev, newCheckIn]);
    
    updateStudent(checkIn.studentId, { 
      lastVisit: `${checkIn.date} ${checkIn.time}` 
    });
  };

  const addWorkoutTemplate = (template: Omit<WorkoutTemplate, 'id'>) => {
    const newTemplate = { ...template, id: Date.now() };
    setWorkoutTemplates(prev => [...prev, newTemplate]);
  };

  const updateWorkoutTemplate = (id: number, templateData: Partial<WorkoutTemplate>) => {
    setWorkoutTemplates(prev => prev.map(t => t.id === id ? { ...t, ...templateData } : t));
  };

  const addPerformanceRecord = (record: Omit<PerformanceRecord, 'id'>) => {
    const newRecord = { ...record, id: Date.now().toString() };
    setPerformanceRecords(prev => [...prev, newRecord]);
  };

  // Métricas calculadas
  const metrics = useGymMetrics(students, payments, checkIns, equipment, classes);

  const value: GymDataContextType = {
    students, classes, payments, equipment, plans, checkIns, workoutTemplates, performanceRecords,
    addStudent, updateStudent, deleteStudent,
    addClass, updateClass, deleteClass,
    addPayment, updatePayment,
    addEquipment, updateEquipment,
    addPlan, updatePlan,
    addCheckIn,
    addWorkoutTemplate, updateWorkoutTemplate,
    addPerformanceRecord,
    metrics
  };

  return (
    <GymDataContext.Provider value={value}>
      {children}
    </GymDataContext.Provider>
  );
}

export function useGymData() {
  const context = useContext(GymDataContext);
  if (context === undefined) {
    throw new Error('useGymData must be used within a GymDataProvider');
  }
  return context;
}
