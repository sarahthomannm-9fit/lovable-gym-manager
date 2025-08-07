
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, Clock, MapPin, Video, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassReportProps {
  studentId: string;
  studentName: string;
  packageData: any;
}

interface ClassRecord {
  id: string;
  date: string;
  confirmationTime: string;
  modality: 'presencial' | 'online';
  status: 'confirmada' | 'cancelada' | 'pendente';
  expirationDate: string;
  classType: string;
}

export function StudentClassReport({ studentId, studentName, packageData }: ClassReportProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock data - Em produção, isso viria do banco de dados
  const classRecords: ClassRecord[] = [
    {
      id: '1',
      date: '2024-01-15',
      confirmationTime: '2024-01-15T08:30:00',
      modality: 'presencial',
      status: 'confirmada',
      expirationDate: '2024-01-31',
      classType: 'Musculação'
    },
    {
      id: '2',
      date: '2024-01-17',
      confirmationTime: '2024-01-17T09:15:00',
      modality: 'online',
      status: 'confirmada',
      expirationDate: '2024-01-31',
      classType: 'Funcional'
    },
    {
      id: '3',
      date: '2024-01-20',
      confirmationTime: '',
      modality: 'presencial',
      status: 'pendente',
      expirationDate: '2024-01-31',
      classType: 'HIIT'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pendente':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModalityIcon = (modality: string) => {
    return modality === 'online' ? 
      <Video className="w-4 h-4 text-blue-600" /> : 
      <MapPin className="w-4 h-4 text-green-600" />;
  };

  const isExpired = (expirationDate: string) => {
    return isAfter(new Date(), parseISO(expirationDate + 'T23:59:59'));
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expiration = parseISO(expirationDate + 'T23:59:59');
    const threeDaysFromNow = addDays(new Date(), 3);
    return isAfter(threeDaysFromNow, expiration) && !isExpired(expirationDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>Relatório de Aulas</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Relatório de Aulas - {studentName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Pacote */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pacote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {packageData?.totalClasses || 12}
                  </div>
                  <div className="text-sm text-gray-600">Total de Aulas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {classRecords.filter(r => r.status === 'confirmada').length}
                  </div>
                  <div className="text-sm text-gray-600">Confirmadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {classRecords.filter(r => r.status === 'pendente').length}
                  </div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {classRecords.filter(r => r.status === 'cancelada').length}
                  </div>
                  <div className="text-sm text-gray-600">Canceladas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes das Aulas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controle de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data da Aula</TableHead>
                    <TableHead>Horário de Confirmação</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{format(parseISO(record.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {record.confirmationTime ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{format(parseISO(record.confirmationTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getModalityIcon(record.modality)}
                          <span className="capitalize">{record.modality}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>{record.classType}</TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(record.status)}
                            <span className="capitalize">{record.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className={`text-sm ${isExpired(record.expirationDate) ? 'text-red-600 font-semibold' : isExpiringSoon(record.expirationDate) ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                          {format(parseISO(record.expirationDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                          {isExpired(record.expirationDate) && <span className="ml-1">(Vencida)</span>}
                          {isExpiringSoon(record.expirationDate) && <span className="ml-1">(Vence em breve)</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
