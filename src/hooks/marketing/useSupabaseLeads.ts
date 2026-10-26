
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOperationalContext } from '@/hooks/useOperationalContext';

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
  organization_id: string;
  consent_marketing: boolean;
  next_follow_up_at?: string | null;
}

export function useSupabaseLeads() {
  const { activeOrg } = useOperationalContext();
  const fetchLeads = async (): Promise<Lead[]> => {

    if (!activeOrg?.id) return [];
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq('organization_id', activeOrg.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leads", activeOrg?.id],
    queryFn: fetchLeads,
    enabled: !!activeOrg?.id,
  });

  const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {

    if (!activeOrg?.id) throw new Error('Selecione uma organização.');
    const { data: inserted, error } = await (supabase as any).rpc('capture_lead', { p_organization_id:activeOrg.id, p_nome:lead.nome, p_email:lead.email, p_telefone:lead.telefone, p_fonte:lead.fonte, p_consent:lead.consent_marketing, p_source_detail:null, p_campaign_id:null });
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

