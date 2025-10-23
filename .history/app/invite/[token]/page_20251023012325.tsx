"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useToast } from "@/app/hooks/use-toast";
import { Check, X, Mail, Building, User } from "lucide-react";

interface InviteData {
  id: string;
  accountName: string;
  inviterName: string;
  role: string;
  status: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    loadInviteData();
  }, []);

  const loadInviteData = async () => {
    try {
      setIsLoading(true);
      
      console.log("🔍 Buscando convite com token:", params.token);
      
      // Primeiro, tentar buscar do banco de dados
      try {
        const { data: dbInvite, error: dbError } = await supabase
          .from("account_invites")
          .select(`
            *,
            account:accounts(
              id,
              name,
              description,
              icon,
              type
            ),
            inviter:auth.users!account_invites_invited_by_fkey(
              id,
              email,
              user_metadata
            )
          `)
          .eq("token", params.token)
          .eq("status", "pending")
          .single();

        if (dbInvite && !dbError) {
          console.log("✅ Convite encontrado no banco:", dbInvite);
          setInviteData({
            id: dbInvite.id,
            accountName: dbInvite.account?.name || "Conta",
            inviterName: dbInvite.inviter?.user_metadata?.full_name || 
                        dbInvite.inviter?.email?.split('@')[0] || 
                        "Usuário",
            role: dbInvite.role,
            status: dbInvite.status
          });
          return;
        }
      } catch (dbError) {
        console.log("🔄 Banco não disponível, usando localStorage");
      }
      
      // Fallback: buscar no localStorage
      const emailInvites = JSON.parse(localStorage.getItem("email_invites") || "[]");
      console.log("📧 Convites disponíveis no localStorage:", emailInvites);
      
      const invite = emailInvites.find((inv: any) => 
        inv.inviteLink.includes(params.token as string) || 
        inv.id === params.token ||
        inv.token === params.token
      );
      
      if (invite) {
        console.log("✅ Convite encontrado no localStorage:", invite);
        setInviteData({
          id: invite.id,
          accountName: invite.accountName,
          inviterName: invite.inviterName,
          role: invite.role,
          status: invite.status
        });
      } else {
        console.log("❌ Convite não encontrado");
        toast({
          variant: "destructive",
          title: "Convite não encontrado",
          description: "Este convite pode ter expirado ou já foi processado.",
        });
      }
    } catch (error) {
      console.error("Error loading invite:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o convite.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!inviteData) return;
    
    try {
      setIsResponding(true);
      
      // Verificar se usuário está logado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          variant: "destructive",
          title: "Login necessário",
          description: "Você precisa estar logado para aceitar o convite.",
        });
        router.push("/login");
        return;
      }

      console.log("✅ Aceitando convite...");
      
      // Atualizar status do convite
      const emailInvites = JSON.parse(localStorage.getItem("email_invites") || "[]");
      const inviteIndex = emailInvites.findIndex((inv: any) => inv.id === inviteData.id);
      
      if (inviteIndex !== -1) {
        emailInvites[inviteIndex].status = "accepted";
        localStorage.setItem("email_invites", JSON.stringify(emailInvites));
        console.log("✅ Status do convite atualizado");
      }
      
      // Simular adição à conta (em produção, seria real)
      const accountMembers = JSON.parse(localStorage.getItem("account_members") || "[]");
      const newMember = {
        id: `member_${Date.now()}`,
        account_id: `account_${Date.now()}`,
        account_name: inviteData.accountName,
        user_id: userData.user.id,
        user_email: userData.user.email,
        role: inviteData.role,
        created_at: new Date().toISOString()
      };
      
      accountMembers.push(newMember);
      localStorage.setItem("account_members", JSON.stringify(accountMembers));
      console.log("✅ Membro adicionado à conta:", newMember);
      
      toast({
        title: "Convite aceito!",
        description: `Você agora faz parte da conta "${inviteData.accountName}".`,
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aceitar o convite.",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    if (!inviteData) return;
    
    try {
      setIsResponding(true);
      
      // Atualizar status do convite
      const emailInvites = JSON.parse(localStorage.getItem("email_invites") || "[]");
      const inviteIndex = emailInvites.findIndex((inv: any) => inv.id === inviteData.id);
      
      if (inviteIndex !== -1) {
        emailInvites[inviteIndex].status = "rejected";
        localStorage.setItem("email_invites", JSON.stringify(emailInvites));
        
        toast({
          title: "Convite rejeitado",
          description: "O convite foi rejeitado com sucesso.",
        });
        
        // Redirecionar para o dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error rejecting invite:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar o convite.",
      });
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Convite não encontrado</h2>
            <p className="text-gray-600 mb-4">Este convite pode ter expirado ou já foi processado.</p>
            <Button onClick={() => router.push("/dashboard")}>
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteData.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {inviteData.status === "accepted" ? "Convite já aceito" : "Convite rejeitado"}
            </h2>
            <p className="text-gray-600 mb-4">
              Este convite já foi processado.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Convite para Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Você foi convidado para participar da conta
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{inviteData.accountName}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-2">
                <User className="h-4 w-4" />
                <span>Como {inviteData.role === 'owner' ? 'Proprietário' : 'Membro'}</span>
              </div>
              <div className="text-xs text-gray-600">
                Convidado por: <strong>{inviteData.inviterName}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">O que você pode fazer:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Visualizar transações da conta</li>
              <li>• Adicionar novas transações</li>
              <li>• Ver relatórios e gráficos</li>
              <li>• Gerenciar categorias</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isResponding}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isResponding ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Aceitar
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isResponding}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
