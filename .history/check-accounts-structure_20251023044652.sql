-- Script para verificar a estrutura da tabela accounts
-- Execute este script no Supabase SQL Editor

-- Verificar colunas da tabela accounts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.accounts'::regclass;
