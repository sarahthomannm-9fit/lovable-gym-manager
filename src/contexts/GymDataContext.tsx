
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
  // Estados iniciais
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
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
