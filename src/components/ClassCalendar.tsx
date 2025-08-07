
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Video } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarClass {
  id: string;
  nome: string;
  tipo: string;
  data_aula: string;
  horario_inicio: string;
  horario_fim: string;
  modalidade: 'presencial' | 'online';
  aluno?: string;
}

export function ClassCalendar() {
  const { classes, students } = useSupabaseGymData();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [calendarClasses, setCalendarClasses] = useState<CalendarClass[]>([]);

  useEffect(() => {
    // Convert Supabase classes to calendar format
    const convertedClasses = classes.map(classItem => ({
      id: classItem.id,
      nome: classItem.nome,
      tipo: classItem.tipo || 'Aula',
      data_aula: classItem.data_aula,
      horario_inicio: classItem.horario_inicio,
      horario_fim: classItem.horario_fim,
      modalidade: (classItem.tipo?.toLowerCase().includes('online') ? 'online' : 'presencial') as 'presencial' | 'online'
    }));

    setCalendarClasses(convertedClasses);
  }, [classes]);

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getClassesForDay = (date: Date) => {
    return calendarClasses.filter(classItem => 
      isSameDay(parseISO(classItem.data_aula + 'T00:00:00'), date)
    );
  };

  const getModalityIcon = (modalidade: string) => {
    return modalidade === 'online' ? 
      <Video className="w-3 h-3" /> : 
      <MapPin className="w-3 h-3" />;
  };

  const getModalityColor = (modalidade: string) => {
    return modalidade === 'online' ? 
      'bg-blue-100 text-blue-800' : 
      'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Agenda de Aulas</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium px-4">
            {format(weekStart, "dd 'de' MMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMM yyyy", { locale: ptBR })}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button 
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Hoje
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayClasses = getClassesForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">
                  <div>{format(day, "EEE", { locale: ptBR })}</div>
                  <div className={`text-lg ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {format(day, "dd")}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {dayClasses.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center">Nenhuma aula</p>
                  ) : (
                    dayClasses.map((classItem) => (
                      <div key={classItem.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-xs ${getModalityColor(classItem.modalidade)}`}>
                            {getModalityIcon(classItem.modalidade)}
                            <span className="ml-1">{classItem.modalidade}</span>
                          </Badge>
                        </div>
                        
                        <div className="text-xs font-medium mb-1">{classItem.nome}</div>
                        
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {classItem.horario_inicio} - {classItem.horario_fim}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          {classItem.tipo}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 rounded-full"></div>
          <span>Presencial</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
