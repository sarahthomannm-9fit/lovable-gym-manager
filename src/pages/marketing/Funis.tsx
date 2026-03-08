import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleFunnel } from "@/components/marketing/funis/GoogleFunnel";
import { InstagramFunnel } from "@/components/marketing/funis/InstagramFunnel";
import { WhatsAppFunnel } from "@/components/marketing/funis/WhatsAppFunnel";
import { FunnelOverview } from "@/components/marketing/funis/FunnelOverview";
import { Search, Instagram, MessageCircle } from "lucide-react";

export function Funis() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Funis de Conversão</h2>
        <p className="text-muted-foreground">Sistemas automatizados para Google Ads, Instagram e WhatsApp</p>
      </div>

      <FunnelOverview />

      <Tabs defaultValue="google" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="flex items-center gap-2"><Search className="h-4 w-4" />Google Ads</TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2"><Instagram className="h-4 w-4" />Instagram</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="google" className="space-y-6"><GoogleFunnel /></TabsContent>
        <TabsContent value="instagram" className="space-y-6"><InstagramFunnel /></TabsContent>
        <TabsContent value="whatsapp" className="space-y-6"><WhatsAppFunnel /></TabsContent>
      </Tabs>
    </div>
  );
}
