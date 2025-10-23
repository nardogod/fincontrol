"use client";

import { useState, useEffect } from "react";
import { useInvites } from "@/app/hooks/useInvites";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";
import { 
  UserPlus, 
  Check, 
  X, 
  Clock,
  Mail,
  Building
} from "lucide-react";

export default function InviteNotification() {
  const { invites, isLoading, respondToInvite } = useInvites();
  const { toast } = useToast();
  const [isResponding, setIsResponding] = useState<string | null>(null);

  const handleAccept = async (inviteId: string) => {
    try {
      setIsResponding(inviteId);
      await respondToInvite(inviteId, "accepted");
      toast({
        title: "Convite aceito!",
        description: "Você agora faz parte desta conta.",
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aceitar o convite.",
      });
    } finally {
      setIsResponding(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      setIsResponding(inviteId);
      await respondToInvite(inviteId, "rejected");
      toast({
        title: "Convite rejeitado",
        description: "O convite foi rejeitado.",
      });
    } catch (error) {
      console.error("Error rejecting invite:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar o convite.",
      });
    } finally {
      setIsResponding(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <Card key={invite.id} className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">
                  Convite para Conta
                </CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>Convite enviado para: {invite.invited_email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserPlus className="h-4 w-4" />
                <span>Função: {invite.role === "owner" ? "Proprietário" : "Membro"}</span>
              </div>
              {invite.account?.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {invite.account.description}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleAccept(invite.id)}
                disabled={isResponding === invite.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isResponding === invite.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleReject(invite.id)}
                disabled={isResponding === invite.id}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
