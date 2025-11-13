-- Script para criar categorias padrão
-- Execute este script no Supabase SQL Editor

-- Criar categorias "Balanço", "Mensalidades" e "Dívidas"
INSERT INTO public.categories (name, icon, color, type, is_default)
VALUES 
  ('Balanço', '⚖️', '#6366F1', 'expense', true),
  ('Mensalidades', '📅', '#8B5CF6', 'expense', true),
  ('Dívidas', '💳', '#EF4444', 'expense', true)
ON CONFLICT DO NOTHING;

-- Mensagem de sucesso
SELECT 'Categorias criadas com sucesso! 🎉' as message;

