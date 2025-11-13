"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { parseCSV, csvRowToTransaction } from "@/app/lib/import";
import type { TAccount, TCategory } from "@/app/lib/types";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface CSVImportDialogProps {
  accounts: TAccount[];
  categories: TCategory[];
  onSuccess?: () => void;
}

export default function CSVImportDialog({
  accounts,
  categories,
  onSuccess,
}: CSVImportDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{
    valid: number;
    invalid: number;
    errors: Array<{ row: number; errors: string[] }>;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV",
      });
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // Validate rows
      const validationResults = rows.map((row, index) => {
        const transaction = csvRowToTransaction(row, accounts, categories);
        return {
          row: index + 2, // +2 because CSV is 1-indexed and has header
          transaction,
          errors: transaction.errors,
        };
      });

      const valid = validationResults.filter((r) => r.errors.length === 0);
      const invalid = validationResults.filter((r) => r.errors.length > 0);

      setPreview({
        valid: valid.length,
        invalid: invalid.length,
        errors: invalid.map((r) => ({
          row: r.row,
          errors: r.errors,
        })),
      });

      if (valid.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhuma transação válida",
          description: "Todas as linhas contêm erros. Verifique o arquivo CSV.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao processar CSV:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar CSV",
        description: error.message || "Formato de arquivo inválido",
      });
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0] || !preview || preview.valid === 0) {
      return;
    }

    setIsLoading(true);

    try {
      const file = fileInputRef.current.files[0];
      const text = await file.text();
      const rows = parseCSV(text);

      // Filter and convert valid rows
      const transactions = rows
        .map((row) => csvRowToTransaction(row, accounts, categories))
        .filter((t) => t.errors.length === 0)
        .map((t) => ({
          type: t.type,
          amount: t.amount,
          category_id: t.category_id,
          account_id: t.account_id,
          transaction_date: t.transaction_date,
          description: t.description || null,
        }));

      if (transactions.length === 0) {
        throw new Error("Nenhuma transação válida para importar");
      }

      // Insert transactions
      const { error } = await supabase.from("transactions").insert(transactions);

      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${transactions.length} transação(ões) importada(s) com sucesso.`,
      });

      setIsOpen(false);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao importar:", error);
      toast({
        variant: "destructive",
        title: "Erro ao importar",
        description: error.message || "Não foi possível importar as transações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Transações do CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV no formato exportado pelo sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-gray-500">
              Formato esperado: Data; Tipo; Categoria; Conta; Valor (SEK); Descrição
            </p>
          </div>

          {preview && (
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{preview.valid} válida(s)</span>
                </div>
                {preview.invalid > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{preview.invalid} inválida(s)</span>
                  </div>
                )}
              </div>

              {preview.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Erros encontrados:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600">
                        <strong>Linha {error.row}:</strong> {error.errors.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!preview || preview.valid === 0 || isLoading}
            >
              {isLoading ? "Importando..." : `Importar ${preview?.valid || 0} Transação(ões)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

