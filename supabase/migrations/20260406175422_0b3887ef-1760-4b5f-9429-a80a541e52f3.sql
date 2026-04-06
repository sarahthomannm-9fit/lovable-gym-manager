CREATE TABLE public.anamnese_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  tipo text NOT NULL DEFAULT 'par_q',
  respostas jsonb DEFAULT '{}',
  status text DEFAULT 'pendente',
  preenchido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.anamnese_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write for anamnese by token" ON public.anamnese_respostas FOR ALL USING (true) WITH CHECK (true);