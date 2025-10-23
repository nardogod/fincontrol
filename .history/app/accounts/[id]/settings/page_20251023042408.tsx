"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import AccountForecastSettings from "@/app/components/AccountForecastSettings";
import InviteLinkDisplay from "@/app/components/InviteLinkDisplay";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  ArrowLeft,
  Trash2,
  UserPlus,
  Users,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import type { TAccount } from "@/app/lib/types";

// Using TAccount type from lib/types.ts

interface AccountMember {
  id: string;
  user_id: string;
  role: string;
  user: {
    full_name: string;
    email: string;
  };
}

const predefinedColors = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

export default function AccountSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [account, setAccount] = useState<TAccount | null>(null);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "personal",
    color: "#3B82F6",
    description: "",
  });

  const [inviteData, setInviteData] = useState({
    email: "",
    role: "member",
  });
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");

  const accountId = params.id as string;

  useEffect(() => {
    loadAccountData();
  }, [accountId]);

  const loadAccountData = async () => {
    try {
      setIsLoading(true);

      // Load account
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (accountError) throw accountError;
      setAccount(accountData as TAccount);
      setFormData({
        name: accountData.name,
        type: accountData.type,
        color: accountData.color,
        description: accountData.description || "",
      });

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from("account_members")
        .select(
          `
          *,
          user:users(full_name, email)
        `
        )
        .eq("account_id", accountId);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error loading account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da conta.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("accounts")
        .update({
          name: formData.name,
          type: formData.type,
          color: formData.color,
          description: formData.description || null,
        })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Conta atualizada!",
        description: "As configurações foram salvas com sucesso.",
      });

      // Reload data
      await loadAccountData();
    } catch (error) {
      console.error("Error saving account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      console.log("Attempting to delete account:", accountId);
      console.log("Current user:", user.id);
      console.log("Account owner:", account?.user_id);

      // Verify ownership
      if (account?.user_id !== user.id) {
        throw new Error("Você não tem permissão para excluir esta conta");
      }

      // Check if this is the main account (principal)
      if (account?.type === "principal") {
        throw new Error("Não é possível excluir a conta principal. Esta conta é necessária para o funcionamento do sistema.");
      }

      // Check if this is the user's first account (fallback protection)
      const { data: userAccounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (userAccounts && userAccounts.length === 1 && userAccounts[0].id === accountId) {
        throw new Error("Não é possível excluir sua única conta. Crie outra conta antes de excluir esta.");
      }

      // Save account to deleted_accounts table before deletion
      console.log("Saving account to deleted_accounts...");
      const { error: saveDeletedError } = await supabase
        .from("deleted_accounts")
        .insert({
          original_account_id: accountId,
          user_id: user.id,
          name: account.name,
          type: account.type,
          color: account.color,
          icon: account.icon,
          currency: account.currency || 'kr',
          description: account.description,
          can_recover: true,
          recovery_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (saveDeletedError) {
        console.error("Error saving to deleted_accounts:", saveDeletedError);
        // Continue with deletion even if this fails
      }

      // Delete account (CASCADE will handle related records)
      console.log("Deleting account...");
      const { data, error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", user.id) // Extra security check
        .select();

      if (error) {
        console.error("Error deleting account:", error);
        throw error;
      }

      console.log("Account deleted successfully:", data);

      toast({
        title: "Conta excluída!",
        description: "A conta foi removida com sucesso.",
      });

      router.push("/accounts");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível excluir a conta: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleInviteUser = async () => {
    try {
      console.log("🔍 Tentando enviar convite para:", inviteData.email);
      
      // Validar email
      if (!inviteData.email || !inviteData.email.includes("@")) {
        toast({
          variant: "destructive",
          title: "Email inválido",
          description: "Por favor, insira um email válido.",
        });
        return;
      }

      // Gerar token único para o convite
      const inviteToken = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteLink = `${window.location.origin}/invite/${inviteToken}`;
      
      console.log("🔗 Token gerado:", inviteToken);
      console.log("🔗 Link gerado:", inviteLink);

      // Buscar dados do usuário atual e da conta
      const { data: userData } = await supabase.auth.getUser();
      const inviterName = userData.user?.user_metadata?.full_name || "Usuário";
      const accountName = account?.name || "Conta";

      // Sistema direto: adicionar usuário diretamente à conta
      try {
        // Primeiro, buscar o usuário pelo email
        const { data: invitedUser, error: userError } = await supabase
          .from("users")
          .select("id, email, full_name")
          .eq("email", inviteData.email)
          .single();

        if (userError || !invitedUser) {
          console.log("❌ Usuário não encontrado:", userError);
          toast({
            variant: "destructive",
            title: "Usuário não encontrado",
            description: "Não foi possível encontrar um usuário com este email.",
          });
          return;
        }

        // Verificar se o usuário já é membro da conta
        const { data: existingMember, error: memberCheckError } = await supabase
          .from("account_members")
          .select("*")
          .eq("account_id", accountId)
          .eq("user_id", invitedUser.id)
          .single();

        if (existingMember && !memberCheckError) {
          toast({
            variant: "destructive",
            title: "Usuário já é membro",
            description: "Este usuário já faz parte desta conta.",
          });
          return;
        }

        // Adicionar usuário diretamente como membro da conta
        const { data: newMember, error: memberError } = await supabase
          .from("account_members")
          .insert({
            account_id: accountId,
            user_id: invitedUser.id,
            role: inviteData.role
          })
          .select()
          .single();

        if (memberError) {
          console.log("❌ Erro ao adicionar membro:", memberError);
          throw memberError;
        }

        console.log("✅ Usuário adicionado diretamente à conta:", newMember);
        
        toast({
          title: "Usuário adicionado!",
          description: `${invitedUser.full_name || invitedUser.email} foi adicionado à conta.`,
        });

        // Fechar o modal
        setShowInviteDialog(false);
        setInviteData({ email: "", role: "member" });
        return;

      } catch (dbError) {
        console.log("🔄 Banco não disponível, usando localStorage");
        
        // Fallback: salvar no localStorage para processamento posterior
        const invites = JSON.parse(localStorage.getItem("account_invites") || "[]");
        const newInvite = {
          id: `local_${Date.now()}`,
          account_id: accountId,
          invited_email: inviteData.email,
          role: inviteData.role,
          status: "pending",
          token: inviteToken,
          created_at: new Date().toISOString(),
        };
        
        invites.push(newInvite);
        localStorage.setItem("account_invites", JSON.stringify(invites));
        console.log("✅ Convite salvo no localStorage:", newInvite);
      }

      // Se chegou aqui, é porque usou o fallback localStorage
      // Enviar email de convite apenas no fallback
      const { sendInviteEmail } = await import("@/app/lib/email-service");
      await sendInviteEmail({
        to: inviteData.email,
        accountName,
        inviterName,
        inviteLink,
        role: inviteData.role === "owner" ? "Proprietário" : "Membro"
      });

      console.log("✅ Email de convite enviado (fallback)");

      // Mostrar o link do convite para demonstração
      setGeneratedInviteLink(inviteLink);
      setShowInviteLink(true);
      setShowInviteDialog(false);
      setInviteData({ email: "", role: "member" });
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o convite.",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("account_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Membro removido!",
        description: "O membro foi removido da conta.",
      });

      await loadAccountData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o membro.",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </SidebarWrapper>
    );
  }

  if (!account) {
    return (
      <SidebarWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Conta não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              A conta que você está procurando não existe.
            </p>
            <Button onClick={() => router.push("/accounts")}>
              Voltar para Contas
            </Button>
          </div>
        </div>
      </SidebarWrapper>
    );
  }

  return (
    <SidebarWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/accounts")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Configurações da Conta
                </h1>
                <p className="mt-1 text-sm text-slate-600">{account.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo da Conta</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Pessoal</SelectItem>
                      <SelectItem value="shared">Compartilhada</SelectItem>
                      <SelectItem value="business">Empresa</SelectItem>
                      <SelectItem value="vehicle">Veículo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cor da Conta</Label>
                  <div className="flex gap-2 flex-wrap">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-8 w-8 rounded-full border-2 ${
                          formData.color === color
                            ? "border-gray-800"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrição opcional"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros ({members.length})
                  </CardTitle>
                  <Dialog
                    open={showInviteDialog}
                    onOpenChange={setShowInviteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Convidar Usuário</DialogTitle>
                        <DialogDescription>
                          Envie um convite para adicionar um usuário à conta.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteData.email}
                            onChange={(e) =>
                              setInviteData({
                                ...inviteData,
                                email: e.target.value,
                              })
                            }
                            placeholder="usuario@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Função</Label>
                          <Select
                            value={inviteData.role}
                            onValueChange={(value) =>
                              setInviteData({ ...inviteData, role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="owner">
                                Proprietário
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleInviteUser}>
                          Enviar Convite
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.user?.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {member.user?.full_name || "Usuário"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {member.role === "owner" ? "Proprietário" : "Membro"}
                        </span>
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Settings */}
          <div className="mt-6">
            <AccountForecastSettings
              account={account}
              onSettingsUpdated={() => {
                // Recarregar dados se necessário
                console.log("Configurações de previsão atualizadas");
              }}
            />
          </div>

          {/* Danger Zone */}
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-800">Excluir Conta</h3>
                  <p className="text-sm text-red-600">
                    {account?.type === "principal" 
                      ? "A conta principal não pode ser excluída. Esta conta é necessária para o funcionamento do sistema."
                      : "Esta ação não pode ser desfeita. Todas as transações serão perdidas."
                    }
                  </p>
                </div>
                <Dialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={account?.type === "principal"}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {account?.type === "principal" ? "Não Disponível" : "Excluir Conta"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Exclusão</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir a conta "{account.name}"?
                        Esta ação não pode ser desfeita e todas as transações
                        serão perdidas.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Excluindo..." : "Excluir Conta"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Link do Convite */}
      {showInviteLink && (
        <InviteLinkDisplay
          inviteLink={generatedInviteLink}
          email={inviteData.email}
          onClose={() => setShowInviteLink(false)}
        />
      )}
    </SidebarWrapper>
  );
}
