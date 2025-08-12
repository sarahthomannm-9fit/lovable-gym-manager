
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  fonte?: string | null;
  status: "novo" | "qualificado" | "contatado" | "convertido" | "perdido" | string;
  score?: number | null;
  observacoes?: string | null;
}

export function useSupabaseLeads() {
  const fetchLeads = async (): Promise<Lead[]> => {
    console.log("[Leads] fetching from Supabase");
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
    console.log("[Leads] inserting", lead);
    const { data: inserted, error } = await supabase.from("leads").insert(lead).select("*").single();
    if (error) throw error;
    await refetch();
    return inserted as Lead;
  };

  return {
    leads: data || [],
    leadsLoading: isLoading,
    leadsError: error as Error | null,
    refetchLeads: refetch,
    addLead,
  };
}
