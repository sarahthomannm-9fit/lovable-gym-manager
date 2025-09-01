import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Smartphone, Monitor, Users, Package } from 'lucide-react';
import { useSupabaseProdutos, Produto } from '@/hooks/useSupabaseProdutos';

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addProduto } = useSupabaseProdutos();

  const [formData, setFormData] = useState({
    nome: '',
    tipo: '' as Produto['tipo'],
    descricao: '',
    preco: '',
    target_publico: '',
    orcamento_marketing: ''
  });

  const tiposProduto = [
    { value: 'aplicativo_mobile', label: 'Aplicativo Mobile', icon: Smartphone },
    { value: 'software', label: 'Software/SaaS', icon: Monitor },
    { value: 'servicos', label: 'Serviços', icon: Users },
    { value: 'produtos', label: 'Produtos Físicos', icon: Package }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.tipo) return;

    setLoading(true);
    try {
      const produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'> = {
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao || undefined,
        preco: formData.preco ? parseFloat(formData.preco) : undefined,
        target_publico: formData.target_publico || undefined,
        orcamento_marketing: formData.orcamento_marketing ? parseFloat(formData.orcamento_marketing) : undefined,
        status: 'analise'
      };

      await addProduto(produto);
      setOpen(false);
      setFormData({
        nome: '',
        tipo: '' as Produto['tipo'],
        descricao: '',
        preco: '',
        target_publico: '',
        orcamento_marketing: ''
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: App de Treinos Premium"
              required
            />
          </div>

          <div>
            <Label>Tipo de Produto *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as Produto['tipo'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposProduto.map((tipo) => {
                  const Icon = tipo.icon;
                  return (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o produto e seus benefícios..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="99.90"
              />
            </div>
            <div>
              <Label htmlFor="orcamento">Orçamento Marketing (R$)</Label>
              <Input
                id="orcamento"
                type="number"
                step="0.01"
                value={formData.orcamento_marketing}
                onChange={(e) => setFormData({ ...formData, orcamento_marketing: e.target.value })}
                placeholder="5000.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="target_publico">Público-Alvo</Label>
            <Input
              id="target_publico"
              value={formData.target_publico}
              onChange={(e) => setFormData({ ...formData, target_publico: e.target.value })}
              placeholder="Ex: Pessoas de 25-45 anos interessadas em fitness"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar e Analisar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}