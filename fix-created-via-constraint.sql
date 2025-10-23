-- Script para adicionar 'chat' aos valores permitidos em created_via
-- Execute no Supabase SQL Editor

-- Primeiro, remover a constraint existente
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_created_via_check;

-- Adicionar a nova constraint com 'chat' incluído
ALTER TABLE public.transactions ADD CONSTRAINT transactions_created_via_check
CHECK (created_via IN ('web', 'whatsapp', 'email', 'api', 'chat'));

-- Verificar se a constraint foi aplicada
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'transactions_created_via_check';
