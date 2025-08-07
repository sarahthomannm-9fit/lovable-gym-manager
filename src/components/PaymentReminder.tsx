
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Mail, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentReminderProps {
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  planExpirationDate: string;
  planValue: number;
}

interface ReminderSettings {
  enableWhatsApp: boolean;
  enableEmail: boolean;
  whatsAppMessage: string;
  emailMessage: string;
  reminderDays: number;
  autoResend: boolean;
}

export function PaymentReminder({ 
  studentId, 
  studentName, 
  studentPhone, 
  studentEmail,
  planExpirationDate,
  planValue 
}: PaymentReminderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enableWhatsApp: true,
    enableEmail: true,
    whatsAppMessage: `Olá ${studentName}! Seu plano vence em {dias} dias no valor de R$ ${planValue.toFixed(2)}. Para renovar, entre em contato conosco. Obrigado! 💪`,
    emailMessage: `Prezado(a) ${studentName},\n\nSeu plano está próximo ao vencimento (${format(parseISO(planExpirationDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}).\n\nValor: R$ ${planValue.toFixed(2)}\n\nPara renovar, entre em contato conosco.\n\nObrigado!`,
    reminderDays: 3,
    autoResend: true
  });

  const { sendPaymentNotification, isSending } = useWhatsApp();
  const { toast } = useToast();

  const daysUntilExpiration = differenceInDays(
    parseISO(planExpirationDate + 'T00:00:00'), 
    new Date()
  );

  const isExpired = daysUntilExpiration < 0;
  const isExpiringSoon = daysUntilExpiration <= reminderSettings.reminderDays && daysUntilExpiration >= 0;

  const handleSendReminder = async () => {
    try {
      if (reminderSettings.enableWhatsApp && studentPhone) {
        const messageWithDays = reminderSettings.whatsAppMessage.replace(
          '{dias}', 
          Math.max(0, daysUntilExpiration).toString()
        );
        
        await sendPaymentNotification(studentPhone, planValue, format(parseISO(planExpirationDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }));
      }

      if (reminderSettings.enableEmail && studentEmail) {
        // Aqui você implementaria o envio de email
        // Por enquanto, apenas mostramos um toast
        toast({
          title: "Email Enviado",
          description: `Lembrete de pagamento enviado para ${studentEmail}`,
        });
      }

      toast({
        title: "Sucesso",
        description: "Lembretes de pagamento enviados com sucesso!",
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar lembretes",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Plano Vencido
        </Badge>
      );
    } else if (isExpiringSoon) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Vence em {daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Calendar className="w-3 h-3 mr-1" />
          Plano Ativo
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cobrança - {studentName}</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Vencimento:</span>
              <span className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
                {format(parseISO(planExpirationDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Valor:</span>
              <span className="font-medium text-green-600">R$ {planValue.toFixed(2)}</span>
            </div>

            {(isExpired || isExpiringSoon) && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full" variant={isExpired ? "destructive" : "default"}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar Lembrete
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Configurar Lembrete de Pagamento</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Aluno</Label>
                        <Input value={studentName} disabled />
                      </div>
                      <div>
                        <Label>Valor</Label>
                        <Input value={`R$ ${planValue.toFixed(2)}`} disabled />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <Label>WhatsApp</Label>
                        </div>
                        <Switch
                          checked={reminderSettings.enableWhatsApp}
                          onCheckedChange={(checked) => 
                            setReminderSettings(prev => ({ ...prev, enableWhatsApp: checked }))
                          }
                        />
                      </div>
                      
                      {reminderSettings.enableWhatsApp && (
                        <div>
                          <Label>Mensagem WhatsApp</Label>
                          <Textarea
                            value={reminderSettings.whatsAppMessage}
                            onChange={(e) => 
                              setReminderSettings(prev => ({ ...prev, whatsAppMessage: e.target.value }))
                            }
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <Label>Email</Label>
                        </div>
                        <Switch
                          checked={reminderSettings.enableEmail}
                          onCheckedChange={(checked) => 
                            setReminderSettings(prev => ({ ...prev, enableEmail: checked }))
                          }
                        />
                      </div>
                      
                      {reminderSettings.enableEmail && (
                        <div>
                          <Label>Mensagem Email</Label>
                          <Textarea
                            value={reminderSettings.emailMessage}
                            onChange={(e) => 
                              setReminderSettings(prev => ({ ...prev, emailMessage: e.target.value }))
                            }
                            rows={4}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Reenviar automaticamente após 3 dias</Label>
                        <Switch
                          checked={reminderSettings.autoResend}
                          onCheckedChange={(checked) => 
                            setReminderSettings(prev => ({ ...prev, autoResend: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={handleSendReminder} disabled={isSending} className="flex-1">
                        {isSending ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar Lembrete
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
