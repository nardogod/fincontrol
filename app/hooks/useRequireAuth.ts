"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import { redirectToLogin } from "@/app/lib/auth-helpers";

interface UseRequireAuthOptions {
  redirectTo?: string;
  onUnauthenticated?: () => void;
}

/**
 * Hook para proteger componentes que requerem autenticação
 * Redireciona automaticamente para login se não autenticado
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      if (options.onUnauthenticated) {
        options.onUnauthenticated();
      } else {
        const redirectPath = options.redirectTo || pathname;
        redirectToLogin(redirectPath);
      }
    }
  }, [user, loading, router, pathname, options]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}

/**
 * Hook para obter usuário autenticado com tratamento de erro
 * Tenta refresh antes de falhar e redireciona se necessário
 */
export function useAuthenticatedUser() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const ensureAuthenticated = async (): Promise<typeof user> => {
    if (user) {
      return user;
    }

    // Tenta refresh
    await refreshUser();

    if (!user) {
      redirectToLogin(pathname);
      return null;
    }

    return user;
  };

  return {
    user,
    loading,
    ensureAuthenticated,
  };
}

