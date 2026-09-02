-- Script SQL para executar no Supabase SQL Editor
-- Acesse: https://supabase.com/dashboard/project/_/sql

-- 1. Criação da tabela para armazenar o cronograma e dados de cada usuário
CREATE TABLE IF NOT EXISTS public.user_schedules (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilitação de Row Level Security (RLS)
ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS) - Cada usuário só acessa seus próprios dados

-- Permitir leitura apenas dos próprios dados
DROP POLICY IF EXISTS "Usuários podem visualizar apenas seu próprio cronograma" ON public.user_schedules;
CREATE POLICY "Usuários podem visualizar apenas seu próprio cronograma" 
  ON public.user_schedules 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Permitir inserção apenas para seu próprio ID
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio cronograma" ON public.user_schedules;
CREATE POLICY "Usuários podem inserir seu próprio cronograma" 
  ON public.user_schedules 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Permitir atualização apenas do próprio cronograma
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio cronograma" ON public.user_schedules;
CREATE POLICY "Usuários podem atualizar seu próprio cronograma" 
  ON public.user_schedules 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Permitir exclusão apenas do próprio cronograma
DROP POLICY IF EXISTS "Usuários podem excluir seu próprio cronograma" ON public.user_schedules;
CREATE POLICY "Usuários podem excluir seu próprio cronograma" 
  ON public.user_schedules 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Função para atualizar automaticamente a coluna updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_schedules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
