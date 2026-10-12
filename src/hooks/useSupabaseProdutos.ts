import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Produto {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  tipo: string;
  descricao?: string;
  preco?: number;
  target_publico?: string;
  objetivos?: any;
  canais_preferidos?: any;
  orcamento_marketing?: number;
  status: string;
}

export interface AnaliseProduto {
  id: string;
  produto_id: string;
  created_at: string;
  analise_mercado: any;
  estrategias_recomendadas: any;
  campanhas_sugeridas: any;
  metricas_projetadas: any;
  score_viabilidade: number | null;
}

export function useSupabaseProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProduto = async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single();

      if (error) throw error;
      
      await fetchProdutos();
      toast({
        title: "Produto Criado",
        description: "Produto cadastrado para avaliação",
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar produto",
        variant: "destructive",
      });
    }
  };

  const getAnalisesProduto = async (produtoId: string): Promise<AnaliseProduto[]> => {
    try {
      const { data, error } = await supabase
        .from('analises_produto')
        .select('*')
        .eq('produto_id', produtoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return {
    produtos,
    loading,
    addProduto,
    getAnalisesProduto,
    refetch: fetchProdutos
  };
}

