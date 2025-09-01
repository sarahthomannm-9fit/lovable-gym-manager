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
  score_viabilidade: number;
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
      
      // Gerar análise automática
      await gerarAnaliseAutomatica(data.id, data);
      
      await fetchProdutos();
      toast({
        title: "Produto Criado",
        description: "Produto cadastrado e análise de campanha gerada automaticamente",
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

  const gerarAnaliseAutomatica = async (produtoId: string, produto: Produto) => {
    try {
      // Definir estratégias baseadas no tipo de produto
      const estrategiasPorTipo = {
        aplicativo_mobile: [
          { estrategia: "App Store Optimization (ASO)", prioridade: "alta", descricao: "Otimizar título, descrição e keywords" },
          { estrategia: "Campanhas de Install", prioridade: "alta", descricao: "Facebook Ads e Google Ads para downloads" },
          { estrategia: "Influencer Marketing", prioridade: "média", descricao: "Parcerias com influencers fitness" }
        ],
        software: [
          { estrategia: "Content Marketing", prioridade: "alta", descricao: "Blog e tutoriais técnicos" },
          { estrategia: "SaaS Trial Strategy", prioridade: "alta", descricao: "Freemium ou trial gratuito" },
          { estrategia: "Webinars e Demos", prioridade: "média", descricao: "Demonstrações online" }
        ],
        servicos: [
          { estrategia: "Local SEO", prioridade: "alta", descricao: "Otimização para busca local" },
          { estrategia: "Programa de Indicação", prioridade: "alta", descricao: "Desconto para indicações" },
          { estrategia: "Depoimentos e Cases", prioridade: "média", descricao: "Social proof" }
        ],
        produtos: [
          { estrategia: "E-commerce Marketing", prioridade: "alta", descricao: "Marketplace e loja própria" },
          { estrategia: "Retargeting", prioridade: "alta", descricao: "Remarketing de carrinho abandonado" },
          { estrategia: "Unboxing Experience", prioridade: "média", descricao: "Experiência de abertura" }
        ]
      };

      // Campanhas sugeridas baseadas no tipo
      const campanhasPorTipo = {
        aplicativo_mobile: [
          {
            nome: "Campanha de Lançamento - App Store",
            canal: "google_ads",
            tipo: "install_campaign",
            orcamento_sugerido: produto.orcamento_marketing ? produto.orcamento_marketing * 0.4 : 2000,
            duracao_dias: 30,
            objetivo: "Conseguir primeiros downloads e reviews"
          },
          {
            nome: "Campanha Social Media - Instagram",
            canal: "instagram",
            tipo: "awareness",
            orcamento_sugerido: produto.orcamento_marketing ? produto.orcamento_marketing * 0.3 : 1500,
            duracao_dias: 45,
            objetivo: "Criar awareness e engajamento"
          }
        ],
        software: [
          {
            nome: "Campanha Google Ads - Keywords",
            canal: "google_ads",
            tipo: "search",
            orcamento_sugerido: produto.orcamento_marketing ? produto.orcamento_marketing * 0.5 : 3000,
            duracao_dias: 60,
            objetivo: "Captar leads qualificados"
          }
        ],
        servicos: [
          {
            nome: "Campanha Local - Google My Business",
            canal: "google",
            tipo: "local",
            orcamento_sugerido: produto.orcamento_marketing ? produto.orcamento_marketing * 0.6 : 2500,
            duracao_dias: 90,
            objetivo: "Aumentar visibilidade local"
          }
        ],
        produtos: [
          {
            nome: "Campanha E-commerce - Facebook",
            canal: "facebook_ads",
            tipo: "conversion",
            orcamento_sugerido: produto.orcamento_marketing ? produto.orcamento_marketing * 0.4 : 2000,
            duracao_dias: 30,
            objetivo: "Vendas diretas"
          }
        ]
      };

      const analise = {
        produto_id: produtoId,
        analise_mercado: {
          nicho: "fitness_tech",
          concorrencia: "média",
          potencial_mercado: "alto",
          sazonalidade: "baixa"
        },
        estrategias_recomendadas: estrategiasPorTipo[produto.tipo] || [],
        campanhas_sugeridas: campanhasPorTipo[produto.tipo] || [],
        metricas_projetadas: {
          alcance_estimado: produto.orcamento_marketing ? produto.orcamento_marketing * 10 : 20000,
          conversao_estimada: "2.5%",
          roi_projetado: "300%",
          tempo_payback: "6 meses"
        },
        score_viabilidade: Math.floor(Math.random() * 30) + 70 // Score entre 70-100
      };

      const { error } = await supabase
        .from('analises_produto')
        .insert(analise);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao gerar análise automática:', error);
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