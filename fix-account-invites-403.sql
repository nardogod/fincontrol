-- Corrigir 403 em account_invites: convidado deve poder ver convites para seu email
-- Execute no Supabase SQL Editor

-- 1. Remover políticas antigas (nomes de create-invites e fix-invites)
DROP POLICY IF EXISTS "Invited users can view their invites" ON public.account_invites;
DROP POLICY IF EXISTS "Users can view invites for their email" ON public.account_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON public.account_invites;
DROP POLICY IF EXISTS "Users can view invites they created" ON public.account_invites;

-- 2. Política SELECT: usuário vê apenas linhas onde invited_email = seu email (do JWT)
CREATE POLICY "Invited users can view their invites"
  ON public.account_invites
  FOR SELECT
  USING (invited_email = (auth.jwt() ->> 'email'));

-- 3. Garantir política de UPDATE para aceitar/recusar (se não existir)
DROP POLICY IF EXISTS "Users can update invites for their email" ON public.account_invites;
DROP POLICY IF EXISTS "Invited users can update invite status" ON public.account_invites;
CREATE POLICY "Invited users can update invite status"
  ON public.account_invites
  FOR UPDATE
  USING (invited_email = (auth.jwt() ->> 'email'));

-- 4. Garantir políticas de INSERT/DELETE para donos da conta (se não existir)
DROP POLICY IF EXISTS "Account owners can create invites" ON public.account_invites;
DROP POLICY IF EXISTS "Account members can create invites" ON public.account_invites;
CREATE POLICY "Account owners or members can create invites"
  ON public.account_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_invites.account_id
      AND (a.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.account_members m WHERE m.account_id = a.id AND m.user_id = auth.uid()))
    )
  );

-- Confirmação
SELECT 'Políticas account_invites atualizadas. 403 deve parar.' AS status;
