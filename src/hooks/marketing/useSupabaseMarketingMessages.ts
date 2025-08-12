
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketingMessage {
  id: string;
  created_at: string;
  canal: string; // whatsapp | email | sms | etc
  titulo?: string | null;
  corpo?: string | null;
  destinatarios?: number | null;
  enviadas?: number | null;
  entregues?: number | null;
  lidas?: number | null;
  status: string; // enviando | entregue | erro
  enviado_em?: string | null;
  aluno_id?: string | null;
}

export function useSupabaseMarketingMessages(canal?: string) {
  const fetchMessages = async (): Promise<MarketingMessage[]> => {
    console.log("[MarketingMessages] fetching from Supabase", canal);
    let query = supabase.from("mensagens_marketing").select("*").order("created_at", { ascending: false });
    if (canal) {
      query = query.eq("canal", canal);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["marketing-messages", canal || "all"],
    queryFn: fetchMessages,
  });

  const addMessage = async (message: Omit<MarketingMessage, "id" | "created_at">) => {
    console.log("[MarketingMessages] inserting", message);
    const { data: inserted, error } = await supabase
      .from("mensagens_marketing")
      .insert(message)
      .select("*")
      .single();
    if (error) throw error;
    await refetch();
    return inserted as MarketingMessage;
  };

  return {
    messages: data || [],
    messagesLoading: isLoading,
    messagesError: error as Error | null,
    refetchMessages: refetch,
    addMessage,
  };
}
