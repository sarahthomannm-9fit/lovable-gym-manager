
import { Calendar } from "lucide-react";
import { ClassCard } from "./ClassCard";

interface ClassItem {
  id: number;
  student: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface DailyClassViewProps {
  classes: ClassItem[];
  onConfirmClass?: (id: number) => void;
  onCancelClass?: (id: number) => void;
}

export function DailyClassView({ classes, onConfirmClass, onCancelClass }: DailyClassViewProps) {
  const groupedClasses = classes.reduce((acc, classItem) => {
    const date = classItem.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(classItem);
    return acc;
  }, {} as Record<string, ClassItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedClasses)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, dayClasses]) => (
          <div key={date}>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayClasses
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    onConfirm={onConfirmClass}
                    onCancel={onCancelClass}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
