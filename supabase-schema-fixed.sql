-- FinControl Database Schema - FIXED VERSION
-- Execute this SQL in your Supabase SQL Editor

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('personal', 'shared', 'business', 'vehicle')) DEFAULT 'personal',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '🏦',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_members table
CREATE TABLE public.account_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  budget_limit DECIMAL(10,2),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_via TEXT CHECK (created_via IN ('web', 'whatsapp', 'email', 'api')) DEFAULT 'web',
  attachment_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  planned_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, category_id, month_year)
);

-- Create export_history table
CREATE TABLE public.export_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  format TEXT CHECK (format IN ('pdf', 'excel', 'csv', 'json')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_url TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_phones table
CREATE TABLE public.user_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create views
CREATE VIEW public.monthly_summary AS
SELECT 
  a.id as account_id,
  a.name as account_name,
  TO_CHAR(t.transaction_date, 'YYYY-MM') as month_year,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_balance,
  COUNT(t.id) as transaction_count
FROM public.accounts a
LEFT JOIN public.transactions t ON a.id = t.account_id
GROUP BY a.id, a.name, TO_CHAR(t.transaction_date, 'YYYY-MM');

CREATE VIEW public.category_spending AS
SELECT 
  a.id as account_id,
  a.name as account_name,
  c.id as category_id,
  c.name as category_name,
  c.icon,
  c.color,
  COALESCE(SUM(t.amount), 0) as total_spent,
  COUNT(t.id) as transaction_count,
  TO_CHAR(t.transaction_date, 'YYYY-MM') as month_year
FROM public.accounts a
LEFT JOIN public.categories c ON a.id = c.account_id
LEFT JOIN public.transactions t ON c.id = t.category_id AND t.type = 'expense'
GROUP BY a.id, a.name, c.id, c.name, c.icon, c.color, TO_CHAR(t.transaction_date, 'YYYY-MM');

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Accounts policies
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (
    user_id = auth.uid() OR 
    id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (user_id = auth.uid());

-- Account members policies
CREATE POLICY "Users can view account members" ON public.account_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create account members" ON public.account_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- Categories policies
CREATE POLICY "Users can view accessible categories" ON public.categories
  FOR SELECT USING (
    is_default = true OR
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid() OR 
      id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create categories" ON public.categories
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid() OR 
      id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
    )
  );

-- Transactions policies
CREATE POLICY "Users can view accessible transactions" ON public.transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid() OR 
      id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid() OR 
      id IN (SELECT account_id FROM public.account_members WHERE user_id = auth.uid())
    )
  );

-- Insert default categories
INSERT INTO public.categories (name, icon, color, type, is_default) VALUES
-- Income categories
('Salário', '💰', '#10B981', 'income', true),
('Freelance', '💼', '#3B82F6', 'income', true),
('Investimentos', '📈', '#8B5CF6', 'income', true),
('Outros', '💵', '#6B7280', 'income', true),

-- Expense categories
('Alimentação', '🍽️', '#EF4444', 'expense', true),
('Transporte', '🚗', '#F59E0B', 'expense', true),
('Moradia', '🏠', '#8B5CF6', 'expense', true),
('Saúde', '🏥', '#EC4899', 'expense', true),
('Educação', '📚', '#06B6D4', 'expense', true),
('Lazer', '🎮', '#10B981', 'expense', true),
('Roupas', '👕', '#F97316', 'expense', true),
('Outros', '📦', '#6B7280', 'expense', true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default personal account
  INSERT INTO public.accounts (user_id, name, type, color, icon)
  VALUES (NEW.id, 'Conta Principal', 'personal', '#3B82F6', '🏦');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'FinControl database schema created successfully! 🎉' as message;
