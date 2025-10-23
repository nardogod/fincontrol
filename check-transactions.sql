-- Check if transactions exist in the database
-- Run this in Supabase SQL Editor

-- Check total count of transactions
SELECT COUNT(*) as total_transactions FROM public.transactions;

-- Check transactions by user (replace with your user_id)
-- First, get your user_id from auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then check transactions for a specific user (replace 'YOUR_USER_ID' with actual ID)
SELECT 
    t.id, 
    t.type, 
    t.amount, 
    t.description, 
    t.transaction_date,
    t.created_via,
    a.name as account_name,
    a.user_id as account_owner,
    c.name as category_name
FROM public.transactions t
LEFT JOIN public.accounts a ON t.account_id = a.id
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE a.user_id = 'YOUR_USER_ID'  -- Replace with your actual user_id
ORDER BY t.transaction_date DESC;

-- Check all accounts
SELECT id, name, type, user_id, is_active, created_at 
FROM public.accounts 
ORDER BY created_at DESC;

-- Check if there are any transactions at all
SELECT 
    t.id, 
    t.type, 
    t.amount, 
    t.description, 
    t.transaction_date,
    a.name as account_name,
    a.user_id as account_owner
FROM public.transactions t
LEFT JOIN public.accounts a ON t.account_id = a.id
ORDER BY t.transaction_date DESC
LIMIT 20;
