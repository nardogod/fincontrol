-- Script simples para recuperar conta principal
-- Execute este script no Supabase SQL Editor

-- 1. Buscar o ID do usuário
SELECT id, email, full_name FROM public.users WHERE email = 'nardogomes@live.com';

-- 2. Criar conta principal (substitua USER_ID_AQUI pelo ID retornado acima)
INSERT INTO public.accounts (
    user_id,
    name,
    type,
    color,
    icon,
    currency,
    description,
    is_active
) VALUES (
    'USER_ID_AQUI', -- Substitua pelo ID do usuário
    'Conta Principal',
    'principal',
    '#3B82F6',
    '🏦',
    'kr',
    'Conta principal recuperada',
    true
);

-- 3. Adicionar usuário como owner (substitua ACCOUNT_ID_AQUI pelo ID da conta criada)
INSERT INTO public.account_members (
    account_id,
    user_id,
    role
) VALUES (
    'ACCOUNT_ID_AQUI', -- Substitua pelo ID da conta criada
    'USER_ID_AQUI', -- Substitua pelo ID do usuário
    'owner'
);

-- 4. Criar categorias padrão (substitua ACCOUNT_ID_AQUI pelo ID da conta criada)
INSERT INTO public.categories (
    account_id,
    name,
    icon,
    color,
    type,
    is_default
) VALUES 
('ACCOUNT_ID_AQUI', 'Alimentação', '🍽️', '#10B981', 'expense', true),
('ACCOUNT_ID_AQUI', 'Transporte', '🚗', '#3B82F6', 'expense', true),
('ACCOUNT_ID_AQUI', 'Saúde', '🏥', '#EF4444', 'expense', true),
('ACCOUNT_ID_AQUI', 'Educação', '📚', '#8B5CF6', 'expense', true),
('ACCOUNT_ID_AQUI', 'Lazer', '🎬', '#F59E0B', 'expense', true),
('ACCOUNT_ID_AQUI', 'Salário', '💰', '#10B981', 'income', true),
('ACCOUNT_ID_AQUI', 'Freelance', '💼', '#3B82F6', 'income', true),
('ACCOUNT_ID_AQUI', 'Investimentos', '📈', '#8B5CF6', 'income', true);
