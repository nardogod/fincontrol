"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import type { TAccountInvite, TAccountInviteInsert, TAccountInviteUpdate } from "@/app/lib/types";

export function useInvites() {
  const [invites, setInvites] = useState<TAccountInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Carregar convites pendentes do usuário atual
  const loadInvites = async () => {
    try {
      setIsLoading(true);
      
      // Buscar convites onde o usuário é o convidado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) return;

      try {
        // Tentar buscar do banco de dados
        const { data, error } = await supabase
          .from("account_invites")
          .select(`
            *,
            account:accounts(
              id,
              name,
              description,
              icon,
              type
            )
          `)
          .eq("invited_email", userData.user.email)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setInvites(data || []);
        console.log("✅ Convites carregados do banco de dados");
      } catch (dbError) {
        console.log("🔄 Carregando convites do localStorage");
        
        // Fallback: carregar do localStorage
        const localInvites = JSON.parse(localStorage.getItem("account_invites") || "[]");
        const userInvites = localInvites.filter(
          (invite: any) => invite.invited_email === userData.user.email && invite.status === "pending"
        );
        setInvites(userInvites);
        console.log("✅ Convites carregados do localStorage");
      }
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar convite
  const sendInvite = async (inviteData: TAccountInviteInsert) => {
    try {
      const { data, error } = await supabase
        .from("account_invites")
        .insert(inviteData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error sending invite:", error);
      throw error;
    }
  };

  // Responder ao convite (aceitar/rejeitar)
  const respondToInvite = async (inviteId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("account_invites")
        .update({ status })
        .eq("id", inviteId);

      if (error) throw error;

      // Se aceitou, adicionar como membro da conta
      if (status === "accepted") {
        const invite = invites.find(inv => inv.id === inviteId);
        if (invite) {
          const { error: memberError } = await supabase
            .from("account_members")
            .insert({
              account_id: invite.account_id,
              role: invite.role
            });

          if (memberError) throw memberError;
        }
      }

      // Recarregar convites
      await loadInvites();
    } catch (error) {
      console.error("Error responding to invite:", error);
      throw error;
    }
  };

  // Carregar convites na inicialização
  useEffect(() => {
    loadInvites();
  }, []);

  return {
    invites,
    isLoading,
    loadInvites,
    sendInvite,
    respondToInvite,
  };
}
