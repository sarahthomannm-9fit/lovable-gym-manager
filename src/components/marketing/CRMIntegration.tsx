import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link2, RefreshCw, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CRMIntegration() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [crmUrl, setCrmUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleConnect = () => {
    if (!crmUrl || !apiKey) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha URL do CRM e API Key",
        variant: "destructive",
      });
      return;
    }

    setIsConnected(true);
    toast({
      title: "CRM Conectado",
      description: "Integração com CRM comercial estabelecida com sucesso!",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCrmUrl("");
    setApiKey("");
    toast({
      title: "CRM Desconectado",
      description: "Integração removida.",
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: "Sincronizando",
      description: "Atualizando dados com CRM central...",
    });

    // Simular sincronização
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Sincronização Completa",
        description: "Todos os leads foram atualizados no CRM central!",
      });
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Integração CRM Comercial
            </CardTitle>
            <CardDescription>
              Sincronize leads automaticamente com seu CRM central
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure a integração para que novos leads sejam automaticamente enviados ao CRM comercial.
            </p>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Integração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurar CRM</DialogTitle>
                  <DialogDescription>
                    Conecte seu CRM comercial para sincronização automática
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm-url">URL do CRM</Label>
                    <Input
                      id="crm-url"
                      placeholder="https://seu-crm.com.br"
                      value={crmUrl}
                      onChange={(e) => setCrmUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Sua chave de API"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleConnect} className="w-full">
                    Conectar CRM
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✓ CRM Conectado
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Novos leads serão automaticamente enviados para: {crmUrl}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={isSyncing} variant="default">
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
              </Button>
              <Button onClick={handleDisconnect} variant="outline">
                Desconectar
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Status da Última Sincronização</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Leads Enviados</p>
                  <p className="font-semibold">23</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Última Sync</p>
                  <p className="font-semibold">Hoje 14:30</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">OK</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
