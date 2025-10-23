-- Script para verificar os tipos permitidos na tabela accounts
-- Execute este script no Supabase SQL Editor

-- Verificar a constraint da tabela accounts
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.accounts'::regclass 
AND contype = 'c';

-- Verificar os tipos existentes na tabela
SELECT DISTINCT type, COUNT(*) as count
FROM public.accounts 
GROUP BY type
ORDER BY type;
