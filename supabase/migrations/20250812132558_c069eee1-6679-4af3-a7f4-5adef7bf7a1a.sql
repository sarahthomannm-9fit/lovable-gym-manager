
-- 1) Função/trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2) Leads (Captação)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nome varchar NOT NULL,
  email varchar,
  telefone varchar,
  fonte text, -- Instagram, Google Ads, Indicação, etc.
  status text NOT NULL DEFAULT 'novo', -- novo | qualificado | contatado | convertido | perdido
  score integer,
  observacoes text
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" 
      ON public.leads
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

DROP TRIGGER IF EXISTS set_timestamp_on_leads ON public.leads;
CREATE TRIGGER set_timestamp_on_leads
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 3) Campanhas de Marketing
CREATE TABLE IF NOT EXISTS public.campanhas_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  titulo text NOT NULL,
  categoria text NOT NULL, -- captacao | comunicacao | conversao | email | promocao
  status text NOT NULL DEFAULT 'ativa', -- ativa | pausada | finalizada
  descricao text,
  data_inicio date,
  data_fim date,
  orcamento numeric,
  alcance integer DEFAULT 0,
  conversoes integer DEFAULT 0,
  canal text, -- whatsapp | email | sms | instagram | facebook | ads | etc.
  segmento jsonb -- critérios/segmentação em JSON
);

ALTER TABLE public.campanhas_marketing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campanhas_marketing'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" 
      ON public.campanhas_marketing
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

DROP TRIGGER IF EXISTS set_timestamp_on_campanhas_marketing ON public.campanhas_marketing;
CREATE TRIGGER set_timestamp_on_campanhas_marketing
BEFORE UPDATE ON public.campanhas_marketing
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4) Promoções
CREATE TABLE IF NOT EXISTS public.promocoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nome text NOT NULL,
  desconto text NOT NULL, -- "50%" | "1 mês grátis" | etc.
  tipo text, -- Captacao | Indicacao | Sazonal | etc.
  status text NOT NULL DEFAULT 'ativa', -- ativa | pausada | finalizada
  valido_ate date,
  usado integer DEFAULT 0,
  limite integer,
  descricao text
);

ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promocoes'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" 
      ON public.promocoes
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

DROP TRIGGER IF EXISTS set_timestamp_on_promocoes ON public.promocoes;
CREATE TRIGGER set_timestamp_on_promocoes
BEFORE UPDATE ON public.promocoes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5) Mensagens de Marketing (logs de envios)
CREATE TABLE IF NOT EXISTS public.mensagens_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  canal text NOT NULL, -- whatsapp | email | sms | instagram | facebook
  titulo text,
  corpo text,
  destinatarios integer DEFAULT 0,
  enviadas integer DEFAULT 0,
  entregues integer,
  lidas integer,
  status text NOT NULL DEFAULT 'enviando', -- enviando | entregue | erro
  enviado_em timestamptz DEFAULT now(),
  aluno_id uuid -- opcional, quando envio individual (sem FK obrigatória)
);

ALTER TABLE public.mensagens_marketing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mensagens_marketing'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" 
      ON public.mensagens_marketing
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;
