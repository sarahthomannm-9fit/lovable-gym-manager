
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOperationalContext } from '@/hooks/useOperationalContext';

// Define um tipo Json compatível com o padrão do Supabase
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  titulo: string;
  categoria: "captacao" | "comunicacao" | "conversao" | "email" | "promocao" | string;
  status: "ativa" | "pausada" | "finalizada" | string;
  descricao?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  orcamento?: number | null;
  alcance?: number | null;
  conversoes?: number | null;
  canal?: string | null;
  segmento?: Json | null; // ajustado para JSON
  organization_id: string;
  scheduled_for?: string | null;
  external_delivery_id?: string | null;
}

export function useSupabaseCampaigns() {
  const { activeOrg } = useOperationalContext();
  const fetchCampaigns = async (): Promise<Campaign[]> => {
    console.log("[Campaigns] fetching from Supabase");
    if (!activeOrg?.id) return [];
    const { data, error } = await supabase
      .from("campanhas_marketing")
      .select("*")
      .eq('organization_id', activeOrg.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns", activeOrg?.id],
    queryFn: fetchCampaigns,
    enabled: !!activeOrg?.id,
  });

  const addCampaign = async (campaign: Omit<Campaign, "id" | "created_at" | "updated_at" | "organization_id">) => {
    if (!activeOrg?.id) throw new Error('Selecione uma organização.');
    const { data: inserted, error } = await supabase
      .from("campanhas_marketing")
      .insert({ ...campaign, organization_id: activeOrg?.id, status: campaign.status || 'draft' })
      .select("*")
      .single();
    if (error) throw error;
    await refetch();
    return inserted as Campaign;
  };

  return {
    campaigns: data || [],
    campaignsLoading: isLoading,
    campaignsError: error as Error | null,
    refetchCampaigns: refetch,
    addCampaign,
  };
}
