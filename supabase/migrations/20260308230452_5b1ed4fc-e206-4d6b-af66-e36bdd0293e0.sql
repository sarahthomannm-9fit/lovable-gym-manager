
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'musculacao',
  status TEXT NOT NULL DEFAULT 'funcionando',
  data_aquisicao DATE DEFAULT CURRENT_DATE,
  custo NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users" ON public.equipamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
