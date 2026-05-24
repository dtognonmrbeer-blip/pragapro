-- =====================================================
--  AgroMapa Pro — Setup Supabase (versão completa)
--  Execute TUDO isso de uma vez no SQL Editor:
--  Supabase Dashboard → SQL Editor → New Query
--  Cole tudo abaixo e clique em RUN
-- =====================================================

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id           TEXT PRIMARY KEY,
  pest_id      TEXT NOT NULL,
  pest_name    TEXT NOT NULL,
  pest_icon    TEXT,
  pest_cat     TEXT,
  severity     TEXT,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  notes        TEXT,
  photo        TEXT,
  tecnico      TEXT NOT NULL,
  fazenda      TEXT,
  quadra       TEXT,
  talhao       TEXT,
  area_ha      TEXT,
  variedade    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROW LEVEL SECURITY — todos leem e escrevem (sem login)
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_publica"  ON public.ocorrencias;
DROP POLICY IF EXISTS "insercao_publica" ON public.ocorrencias;
DROP POLICY IF EXISTS "delecao_publica"  ON public.ocorrencias;

CREATE POLICY "leitura_publica"  ON public.ocorrencias FOR SELECT TO anon USING (true);
CREATE POLICY "insercao_publica" ON public.ocorrencias FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "delecao_publica"  ON public.ocorrencias FOR DELETE TO anon USING (true);

-- 3. HABILITAR REALTIME (via SQL — sem precisar do painel Replication)
ALTER TABLE public.ocorrencias REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencias;

-- 4. CONFIRMAR QUE DEU CERTO
SELECT 'Tabela criada com sucesso! Total de registros: ' || COUNT(*)::text
FROM public.ocorrencias;
