import { createClient } from "@/app/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Tenta fazer refresh da sessão antes de falhar
 * @returns Usuário autenticado ou null
 */
export async function tryRefreshSession(): Promise<User | null> {
  const supabase = createClient();

  // Primeiro, tenta obter a sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    return null;
  }

  // Se há sessão, tenta refresh
  if (session) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!userError && user) {
      return user;
    }
  }

  return null;
}

/**
 * Obtém o usuário atual com tentativa de refresh
 * @returns Usuário autenticado ou null
 */
export async function getCurrentUserWithRefresh(): Promise<User | null> {
  const supabase = createClient();

  // Tenta obter usuário
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Se não há erro e há usuário, retorna
  if (!userError && user) {
    return user;
  }

  // Se há erro relacionado a refresh, tenta refresh
  if (userError && (userError.message.includes("refresh") || userError.message.includes("expired"))) {
    console.log("Session expired, attempting refresh...");
    return await tryRefreshSession();
  }

  // Se há erro mas não é de refresh, retorna null
  if (userError) {
    console.error("Error getting user:", userError);
  }

  return null;
}

/**
 * Verifica se o erro é de autenticação
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code?.toLowerCase() || "";
  
  return (
    errorMessage.includes("authentication") ||
    errorMessage.includes("not authenticated") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("session") ||
    errorCode === "401" ||
    errorCode === "PGRST301"
  );
}

/**
 * Redireciona para login com mensagem
 */
export function redirectToLogin(redirectPath?: string) {
  if (typeof window === "undefined") return;
  
  const loginUrl = redirectPath 
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";
  
  window.location.href = loginUrl;
}

