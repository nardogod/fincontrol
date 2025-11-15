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

  // Primeiro, tenta obter a sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Error getting session:", sessionError);
  }

  // Se há sessão, tenta obter o usuário
  if (session) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Se não há erro e há usuário, retorna
    if (!userError && user) {
      return user;
    }

    // Se há erro relacionado a refresh, tenta refresh
    if (userError && (userError.message.includes("refresh") || userError.message.includes("expired") || userError.message.includes("JWT"))) {
      console.log("Session expired, attempting refresh...");
      // Tenta refresh explícito
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && refreshedSession?.user) {
        console.log("Session refreshed successfully");
        return refreshedSession.user;
      }
      
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
      }
    }

    // Se há erro mas não é de refresh, loga e retorna null
    if (userError) {
      console.error("Error getting user:", userError);
      console.error("Error details:", {
        message: userError.message,
        status: userError.status,
      });
    }
  } else {
    console.warn("No session found");
  }

  return null;
}

/**
 * Verifica se o erro é de autenticação
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = (error.message ?? "").toLowerCase();
  const errorCode = String(error.code ?? "").toLowerCase();
  
  return (
    // Mensagens explícitas de autenticação
    errorMessage.includes("authentication") ||
    errorMessage.includes("not authenticated") ||
    errorMessage.includes("unauthorized") ||
    // Tokens / JWT expirados ou inválidos
    errorMessage.includes("jwt") ||
    errorMessage.includes("token") ||
    errorMessage.includes("expired") ||
    errorMessage.includes("invalid") ||
    // Códigos HTTP / PostgREST relacionados a auth
    errorCode === "401" ||
    errorCode === "pgrst301"
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

