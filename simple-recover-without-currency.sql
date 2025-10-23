-- Script simples para recuperar conta principal (sem currency)
-- Execute este script no Supabase SQL Editor

WITH user_data AS (
    SELECT id, email, full_name 
    FROM public.users 
    WHERE email = 'nardogomes@live.com'
),
new_account AS (
    INSERT INTO public.accounts (
        user_id,
        name,
        type,
        color,
        icon,
        description,
        is_active
    )
    SELECT 
        id,
        'Conta Principal',
        'principal',
        '#3B82F6',
        '🏦',
        'Conta principal recuperada',
        true
    FROM user_data
    RETURNING id, user_id
),
new_member AS (
    INSERT INTO public.account_members (
        account_id,
        user_id,
        role
    )
    SELECT 
        id,
        user_id,
        'owner'
    FROM new_account
    RETURNING account_id
)
INSERT INTO public.categories (
    account_id,
    name,
    icon,
    color,
    type,
    is_default
)
SELECT 
    na.id,
    category_name,
    category_icon,
    category_color,
    category_type,
    true
FROM new_account na
CROSS JOIN (
    VALUES 
    ('Alimentação', '🍽️', '#10B981', 'expense'),
    ('Transporte', '🚗', '#3B82F6', 'expense'),
    ('Saúde', '🏥', '#EF4444', 'expense'),
    ('Educação', '📚', '#8B5CF6', 'expense'),
    ('Lazer', '🎬', '#F59E0B', 'expense'),
    ('Salário', '💰', '#10B981', 'income'),
    ('Freelance', '💼', '#3B82F6', 'income'),
    ('Investimentos', '📈', '#8B5CF6', 'income')
) AS categories(category_name, category_icon, category_color, category_type);

-- Verificar se foi criado corretamente
SELECT 
    a.id as account_id,
    a.name as account_name,
    a.type as account_type,
    u.email as user_email,
    COUNT(am.id) as member_count,
    COUNT(c.id) as category_count
FROM public.accounts a
JOIN public.users u ON a.user_id = u.id
LEFT JOIN public.account_members am ON a.id = am.account_id
LEFT JOIN public.categories c ON a.id = c.account_id
WHERE u.email = 'nardogomes@live.com' 
AND a.type = 'principal'
GROUP BY a.id, a.name, a.type, u.email;
