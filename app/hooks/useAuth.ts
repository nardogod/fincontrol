"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getCurrentUserWithRefresh } from "@/app/lib/auth-helpers";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

/**
 * Hook centralizado para gerenciar autenticação
 * Monitora mudanças de autenticação e mantém estado sincronizado
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const refreshUser = async () => {
    try {
      setError(null);
      const currentUser = await getCurrentUserWithRefresh();
      setUser(currentUser);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar usuário inicial
    refreshUser();

    // Listener de mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        setUser(null);
        setLoading(false);
        // Não redirecionar automaticamente aqui para evitar loops
        // O componente que usa o hook pode decidir quando redirecionar
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      } else {
        // Para outros eventos, atualizar usuário baseado na sessão
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    loading,
    error,
    refreshUser,
  };
}

