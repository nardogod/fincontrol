"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Copy, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

interface InviteLinkDisplayProps {
  inviteLink: string;
  email: string;
  onClose: () => void;
}

export default function InviteLinkDisplay({ inviteLink, email, onClose }: InviteLinkDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar o link.",
      });
    }
  };

  const handleOpenLink = () => {
    window.open(inviteLink, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Convite Enviado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              O convite foi enviado para <strong>{email}</strong>
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Link do convite:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 text-xs bg-white border rounded px-2 py-1"
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? "✓" : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleOpenLink}
              className="flex-1"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Testar Link
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p><strong>Para demonstração:</strong></p>
            <p>1. Copie o link acima</p>
            <p>2. Abra em nova aba</p>
            <p>3. Faça login com o email convidado</p>
            <p>4. Aceite o convite</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
