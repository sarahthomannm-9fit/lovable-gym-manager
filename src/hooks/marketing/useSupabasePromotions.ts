
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  desconto: string;
  tipo?: string | null;
  status: "ativa" | "pausada" | "finalizada" | string;
  valido_ate?: string | null;
  usado?: number | null;
  limite?: number | null;
  descricao?: string | null;
}

export function useSupabasePromotions() {
  const fetchPromotions = async (): Promise<Promotion[]> => {
    console.log("[Promotions] fetching from Supabase");
    const { data, error } = await supabase
      .from("promocoes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const addPromotion = async (promotion: Omit<Promotion, "id" | "created_at" | "updated_at">) => {
    console.log("[Promotions] inserting", promotion);
    const { data: inserted, error } = await supabase
      .from("promocoes")
      .insert(promotion)
      .select("*")
      .single();
    if (error) throw error;
    await refetch();
    return inserted as Promotion;
  };

  return {
    promotions: data || [],
    promotionsLoading: isLoading,
    promotionsError: error as Error | null,
    refetchPromotions: refetch,
    addPromotion,
  };
}
