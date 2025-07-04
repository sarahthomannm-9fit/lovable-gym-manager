
import { Student, Payment, CheckIn, Equipment, Class } from "@/types/gym";

export function useGymMetrics(
  students: Student[],
  payments: Payment[],
  checkIns: CheckIn[],
  equipment: Equipment[],
  classes: Class[]
) {
  const metrics = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    monthlyRevenue: payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0),
    averageAttendance: students.length > 0 ? 
      (checkIns.filter(c => c.type === 'entry').length / students.length) : 0,
    overduePayments: payments
      .filter(p => p.status === 'pending' || 
        students.find(s => s.id === p.studentId)?.paymentStatus === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0),
    equipmentInMaintenance: equipment.filter(e => e.status === 'maintenance' || e.status === 'broken').length,
    totalClasses: classes.length,
    classAttendanceRate: classes.length > 0 ? 
      (classes.reduce((sum, c) => sum + c.enrolled, 0) / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100 : 0
  };

  return metrics;
}
