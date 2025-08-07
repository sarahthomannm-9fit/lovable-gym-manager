
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, DollarSign, Clock } from "lucide-react";

interface PackageTypeSelectorProps {
  onTypeChange: (type: 'recorrente' | 'variavel') => void;
  selectedType: 'recorrente' | 'variavel';
}

export function PackageTypeSelector({ onTypeChange, selectedType }: PackageTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Tipo de Cliente</Label>
      
      <RadioGroup value={selectedType} onValueChange={onTypeChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="recorrente" id="recorrente" />
          <Card className={`flex-1 cursor-pointer transition-all ${selectedType === 'recorrente' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span>Cliente Recorrente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span>Valor entra no faturamento imediatamente</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Cobrança automática</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Recomendado para clientes fixos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="variavel" id="variavel" />
          <Card className={`flex-1 cursor-pointer transition-all ${selectedType === 'variavel' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span>Cliente Variável</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <DollarSign className="w-3 h-3 text-orange-600" />
                  <span>Valor entra no faturamento após confirmação</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Clock className="w-3 h-3 text-orange-600" />
                  <span>Cobrança sob demanda</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Para clientes eventuais
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </RadioGroup>
    </div>
  );
}
