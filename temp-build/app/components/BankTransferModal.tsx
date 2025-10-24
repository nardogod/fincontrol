"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  ArrowRightLeft,
  Building,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { createClient } from "@/app/lib/supabase/client";
import type { TAccount } from "@/app/lib/types";
import { formatCurrency } from "@/app/lib/utils";

interface BankTransferModalProps {
  accounts: TAccount[];
  onTransferComplete?: () => void;
}

function BankTransferModalComponent({
  accounts,
  onTransferComplete,
}: BankTransferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: "",
    toBankName: "",
    toAccountNumber: "",
    toAccountHolder: "",
    amount: "",
    description: "",
    transferType: "pix", // pix, ted, doc
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const supabase = createClient();

  const transferTypes = [
    { value: "pix", label: "PIX", description: "Transferência instantânea" },
    { value: "ted", label: "TED", description: "Transferência eletrônica" },
    { value: "doc", label: "DOC", description: "Documento de ordem de crédito" },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = "Selecione a conta de origem";
    }

    if (!formData.toBankName.trim()) {
      newErrors.toBankName = "Nome do banco é obrigatório";
    }

    if (!formData.toAccountNumber.trim()) {
      newErrors.toAccountNumber = "Número da conta é obrigatório";
    }

    if (!formData.toAccountHolder.trim()) {
      newErrors.toAccountHolder = "Nome do titular é obrigatório";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valor deve ser maior que zero";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Buscar usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const amount = parseFloat(formData.amount);
      const fromAccount = accounts.find((acc) => acc.id === formData.fromAccountId);

      if (!fromAccount) {
        throw new Error("Conta de origem não encontrada");
      }

      // Criar transação de saída (transferência bancária)
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          account_id: formData.fromAccountId,
          type: "expense",
          amount: amount,
          description: `Transferência ${formData.transferType.toUpperCase()} para ${formData.toBankName} - ${formData.toAccountHolder}`,
          transaction_date: new Date().toISOString().split("T")[0],
          created_via: "bank_transfer",
          user_id: user.id,
        });

      if (transactionError) {
        throw transactionError;
      }

      toast({
        title: "Transferência bancária agendada!",
        description: `Transferência de ${formatCurrency(amount)} para ${formData.toBankName} foi processada.`,
      });

      // Reset form
      setFormData({
        fromAccountId: "",
        toBankName: "",
        toAccountNumber: "",
        toAccountHolder: "",
        amount: "",
        description: "",
        transferType: "pix",
      });
      setErrors({});
      setIsOpen(false);
      onTransferComplete?.();
    } catch (error) {
      console.error("Erro ao processar transferência:", error);
      toast({
        variant: "destructive",
        title: "Erro na transferência",
        description: "Não foi possível processar a transferência. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Building className="h-4 w-4" />
          Transferência Bancária
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transferência Bancária
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Transferência */}
          <div>
            <Label className="text-sm font-medium">Tipo de Transferência</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {transferTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-colors ${
                    formData.transferType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleInputChange("transferType", type.value)}
                >
                  <CardContent className="p-3">
                    <div className="text-center">
                      <CreditCard className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Conta de Origem */}
          <div>
            <Label htmlFor="fromAccount">Conta de Origem</Label>
            <select
              id="fromAccount"
              value={formData.fromAccountId}
              onChange={(e) => handleInputChange("fromAccountId", e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione a conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.type}
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.fromAccountId}</p>
            )}
          </div>

          {/* Dados do Destinatário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="toBankName">Nome do Banco</Label>
              <Input
                id="toBankName"
                value={formData.toBankName}
                onChange={(e) => handleInputChange("toBankName", e.target.value)}
                placeholder="Ex: Banco do Brasil"
              />
              {errors.toBankName && (
                <p className="text-red-500 text-sm mt-1">{errors.toBankName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="toAccountNumber">Número da Conta</Label>
              <Input
                id="toAccountNumber"
                value={formData.toAccountNumber}
                onChange={(e) => handleInputChange("toAccountNumber", e.target.value)}
                placeholder="Ex: 12345-6"
              />
              {errors.toAccountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.toAccountNumber}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="toAccountHolder">Nome do Titular</Label>
            <Input
              id="toAccountHolder"
              value={formData.toAccountHolder}
              onChange={(e) => handleInputChange("toAccountHolder", e.target.value)}
              placeholder="Nome completo do titular"
            />
            {errors.toAccountHolder && (
              <p className="text-red-500 text-sm mt-1">{errors.toAccountHolder}</p>
            )}
          </div>

          {/* Valor e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor da Transferência</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Ex: Pagamento de serviços"
              />
            </div>
          </div>

          {/* Resumo da Transferência */}
          {formData.fromAccountId && formData.amount && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Resumo da Transferência</span>
                </div>
                <div className="text-sm text-blue-700">
                  <p>
                    <strong>De:</strong> {accounts.find((acc) => acc.id === formData.fromAccountId)?.name}
                  </p>
                  <p>
                    <strong>Para:</strong> {formData.toBankName} - {formData.toAccountHolder}
                  </p>
                  <p>
                    <strong>Valor:</strong> {formatCurrency(parseFloat(formData.amount) || 0)}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {transferTypes.find((t) => t.value === formData.transferType)?.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso Importante */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Aviso Importante:</p>
                  <p>
                    Esta é uma simulação de transferência bancária. Em um sistema real, 
                    esta operação seria processada através de APIs bancárias seguras.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.fromAccountId || !formData.amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Processando..." : "Confirmar Transferência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Export com carregamento dinâmico para evitar problemas de hidratação
const BankTransferModal = dynamic(() => Promise.resolve(BankTransferModalComponent), {
  ssr: false,
  loading: () => (
    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" disabled>
      <Building className="h-4 w-4" />
      Transferência Bancária
    </Button>
  ),
});

export default BankTransferModal;
