-- Script para recuperar conta principal do usuário nardogomes@live.com
-- Execute este script no Supabase SQL Editor

-- 1. Buscar o ID do usuário pelo email
DO $$
DECLARE
    user_id_var UUID;
    new_account_id UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO user_id_var 
    FROM public.users 
    WHERE email = 'nardogomes@live.com';
    
    -- Verificar se o usuário existe
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'Usuário com email nardogomes@live.com não encontrado';
    END IF;
    
    RAISE NOTICE 'Usuário encontrado com ID: %', user_id_var;
    
    -- 2. Criar nova conta principal
    INSERT INTO public.accounts (
        id,
        user_id,
        name,
        type,
        color,
        icon,
        currency,
        description,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        user_id_var,
        'Conta Principal',
        'principal',
        '#3B82F6',
        '🏦',
        'kr',
        'Conta principal recuperada',
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO new_account_id;
    
    RAISE NOTICE 'Conta principal criada com ID: %', new_account_id;
    
    -- 3. Adicionar usuário como owner da conta
    INSERT INTO public.account_members (
        id,
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        gen_random_uuid(),
        new_account_id,
        user_id_var,
        'owner',
        NOW()
    );
    
    RAISE NOTICE 'Usuário adicionado como owner da conta';
    
    -- 4. Criar categorias padrão para a conta
    INSERT INTO public.categories (
        id,
        account_id,
        name,
        icon,
        color,
        type,
        is_default,
        created_at,
        updated_at
    ) VALUES 
    (gen_random_uuid(), new_account_id, 'Alimentação', '🍽️', '#10B981', 'expense', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Transporte', '🚗', '#3B82F6', 'expense', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Saúde', '🏥', '#EF4444', 'expense', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Educação', '📚', '#8B5CF6', 'expense', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Lazer', '🎬', '#F59E0B', 'expense', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Salário', '💰', '#10B981', 'income', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Freelance', '💼', '#3B82F6', 'income', true, NOW(), NOW()),
    (gen_random_uuid(), new_account_id, 'Investimentos', '📈', '#8B5CF6', 'income', true, NOW(), NOW());
    
    RAISE NOTICE 'Categorias padrão criadas';
    
    -- 5. Verificar se tudo foi criado corretamente
    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Conta criada: %', (SELECT name FROM public.accounts WHERE id = new_account_id);
    RAISE NOTICE 'Membro adicionado: %', (SELECT COUNT(*) FROM public.account_members WHERE account_id = new_account_id);
    RAISE NOTICE 'Categorias criadas: %', (SELECT COUNT(*) FROM public.categories WHERE account_id = new_account_id);
    
END $$;
