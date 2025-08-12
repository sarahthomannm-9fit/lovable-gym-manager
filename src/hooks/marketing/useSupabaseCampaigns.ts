
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  segmento?: Record<string, unknown> | null;
}

export function useSupabaseCampaigns() {
  const fetchCampaigns = async (): Promise<Campaign[]> => {
    console.log("[Campaigns] fetching from Supabase");
    const { data, error } = await supabase
      .from("campanhas_marketing")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const addCampaign = async (campaign: Omit<Campaign, "id" | "created_at" | "updated_at">) => {
    console.log("[Campaigns] inserting", campaign);
    const { data: inserted, error } = await supabase
      .from("campanhas_marketing")
      .insert(campaign)
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
