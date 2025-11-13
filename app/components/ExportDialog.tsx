"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { exportToCSV } from "@/app/lib/export";
import { Download } from "lucide-react";
import type { TAccount } from "@/app/lib/types";

interface ExportDialogProps {
  accounts: TAccount[];
  format: "csv" | "pdf" | "excel" | "json";
}

export default function ExportDialog({ accounts, format }: ExportDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    accounts.map((a) => a.id)
  );

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleExport = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Selecione pelo menos uma conta.",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Fetch transactions for selected period and accounts
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*), account:accounts(*)")
        .in("account_id", selectedAccounts)
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      // Permitir exportar mesmo sem transações (apenas cabeçalho)
      // A separação será feita depois no pandas usando a coluna "Conta"

      console.log(
        "📊 ExportDialog - Transações encontradas:",
        transactions.length
      );
      console.log("📊 ExportDialog - Contas selecionadas:", selectedAccounts.length);

      // Garantir que todas as transações tenham account populado
      (transactions as any[]).forEach((transaction: any) => {
        if (!transaction.account) {
          const account = accounts.find((a) => a.id === transaction.account_id);
          if (account) {
            transaction.account = account;
          }
        }
      });

      // Exportar tudo em um único arquivo CSV
      // A coluna "Conta" permitirá separar depois no pandas
      const accountNames = selectedAccounts
        .map((id) => accounts.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join("_");

      exportToCSV(
        transactions as any,
        startDate,
        endDate,
        accountNames || "Todas_Contas"
      );

      console.log(`✅ ExportDialog - Exportação concluída: 1 arquivo CSV`);

      // Save to export history
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("export_history").insert({
          user_id: userData.user.id,
          format: format as any,
          period_start: startDate,
          period_end: endDate,
        } as any);
      }

      toast({
        title: "Exportação concluída!",
        description: `${transactions.length} transações exportadas em formato CSV.`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Transações</DialogTitle>
          <DialogDescription>
            Configure o período e as contas que deseja exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label>Contas</Label>
            <div className="space-y-2">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    disabled={isExporting}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-xl">{account.icon}</span>
                  <span className="font-medium">{account.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
