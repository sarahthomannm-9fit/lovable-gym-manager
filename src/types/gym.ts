
// Core interfaces for the gym management system

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

export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'suspended';
  lastVisit?: string;
  avatar?: string;
  age?: number;
  emergencyContact?: string;
  medicalNotes?: string;
  monthlyPayment: number;
  paymentStatus: 'up-to-date' | 'overdue' | 'pending';
  daysOverdue?: number;
  startDate?: string;
  paymentMethod?: string;
  medicalInfo?: string;
  performanceData?: PerformanceData;
}

export interface Class {
  id: number;
  name: string;
  instructor: string;
  date: string;
  time: string;
  capacity: number;
  enrolled: number;
  type: string;
  price?: number;
}

export interface Payment {
  id: string;
  studentId: number;
  studentName: string;
  amount: number;
  date: string;
  method: 'pix' | 'card' | 'cash' | 'transfer';
  status: 'confirmed' | 'pending' | 'cancelled';
  plan: string;
  dueDate?: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  status: 'working' | 'maintenance' | 'broken';
  lastMaintenance?: string;
  nextMaintenance?: string;
  acquisitionDate: string;
  warranty?: string;
  cost: number;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  duration: number; // em meses
  benefits: string[];
  active: boolean;
}

export interface CheckIn {
  id: string;
  studentId: number;
  studentName: string;
  date: string;
  time: string;
  type: 'entry' | 'exit';
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string;
  exercises: Exercise[];
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // em minutos
}

export interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  equipment?: string;
}

export interface PerformanceRecord {
  id: string;
  studentId: number;
  date: string;
  metrics: {
    weight?: number;
    bodyFat?: number;
    muscle?: number;
    measurements?: {
      chest?: number;
      waist?: number;
      arm?: number;
      thigh?: number;
    };
  };
  notes?: string;
}

export interface GymMetrics {
  totalStudents: number;
  activeStudents: number;
  monthlyRevenue: number;
  averageAttendance: number;
  overduePayments: number;
  equipmentInMaintenance: number;
  totalClasses: number;
  classAttendanceRate: number;
}
