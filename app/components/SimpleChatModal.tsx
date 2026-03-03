"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import { getCurrentUserWithRefresh, redirectToLogin, isAuthError } from "@/app/lib/auth-helpers";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { getCategoryDisplayName, tTransactions } from "@/app/lib/i18n";
import {
  X,
  Send,
  MessageCircle,
  Home,
  Users,
  Building,
  Car,
} from "lucide-react";

interface SimpleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  onTransactionCreated?: () => void;
}

export default function SimpleChatModal({
  isOpen,
  onClose,
  accounts,
  categories,
  onTransactionCreated,
}: SimpleChatModalProps) {
  const { language } = useLanguage();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const { toast } = useToast();
  const supabase = createClient();

  // Função para obter ícone da conta
  const getAccountIcon = (type: string) => {
    switch (type) {
      case "personal":
        return <Home className="h-4 w-4" />;
      case "shared":
        return <Users className="h-4 w-4" />;
      case "business":
        return <Building className="h-4 w-4" />;
      case "vehicle":
        return <Car className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  // Definir conta padrão quando accounts mudarem
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Carregar transações recentes
  const loadRecentTransactions = async () => {
    try {
      console.log("🔄 Carregando transações no SimpleChat...");
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(
          `
          id, type, amount, description, transaction_date, created_via,
          category:categories(name, icon),
          account:accounts(name, icon),
          user:users(full_name)
        `
        )
        .order("transaction_date", { ascending: false })
        .limit(10);

      console.log("Transações encontradas:", transactions);
      if (error) {
        console.error("Erro ao buscar transações:", error);
        setRecentTransactions([]);
      } else {
        setRecentTransactions(transactions || []);
      }
    } catch (error) {
      console.error("Erro geral:", error);
      setRecentTransactions([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecentTransactions();
    }
  }, [isOpen]);

  // Parser melhorado de mensagens
  const parseMessage = (text: string) => {
    const lowerText = text.toLowerCase();

    // Detectar conta na mensagem (ex: "na conta casa", "conta trabalho")
    let accountId = selectedAccountId;
    for (const account of accounts) {
      if (
        lowerText.includes(`conta ${account.name.toLowerCase()}`) ||
        lowerText.includes(`na conta ${account.name.toLowerCase()}`)
      ) {
        accountId = account.id;
        break;
      }
    }

    // Padrão: "gasto mercado 100" ou "receita salário 5000"
    const expenseMatch = lowerText.match(
      /(?:gasto|despesa)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/
    );
    const incomeMatch = lowerText.match(
      /(?:receita|entrada)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/
    );

    if (expenseMatch) {
      return {
        type: "expense",
        amount: parseFloat(expenseMatch[2].replace(",", ".")),
        category: expenseMatch[1],
        description: text,
        accountId: accountId,
      };
    }

    if (incomeMatch) {
      return {
        type: "income",
        amount: parseFloat(incomeMatch[2].replace(",", ".")),
        category: incomeMatch[1],
        description: text,
        accountId: accountId,
      };
    }

    return null;
  };

  // Encontrar categoria
  const findCategoryId = (categoryName: string, type: "income" | "expense") => {
    const categoryMappings: { [key: string]: string[] } = {
      mercado: ["mercado", "compras", "supermercado"],
      transporte: ["transporte", "gasolina", "uber", "taxi"],
      lazer: ["lazer", "cinema", "restaurante", "restaurant", "bar"],
      saúde: ["saúde", "saude", "farmacia", "medico"],
      salário: ["salário", "salario"],
      freelance: ["freelance", "freela"],
    };

    for (const [key, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some((keyword) => categoryName.includes(keyword))) {
        const category = categories.find(
          (cat) => cat.name.toLowerCase().includes(key) && cat.type === type
        );
        if (category) return category.id;
      }
    }

    return categories.find((cat) => cat.type === type)?.id;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsProcessing(true);
    console.log("📤 Enviando mensagem:", message);
    console.log("📊 Dados disponíveis:", {
      accounts: accounts?.length,
      categories: categories?.length,
      selectedAccountId,
      message,
    });

    try {
      const parsed = parseMessage(message);
      console.log("📝 Mensagem parseada:", parsed);

      if (!parsed) {
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "Formato não reconhecido. Use: 'gasto mercado 100' ou 'receita salário 5000'",
        });
        setIsProcessing(false);
        return;
      }

      const categoryId = findCategoryId(
        parsed.category,
        parsed.type as "income" | "expense"
      );
      console.log("🔍 Buscando categoria:", {
        categoryName: parsed.category,
        type: parsed.type,
        categoryId,
        availableCategories: categories.map((c) => ({
          name: c.name,
          type: c.type,
          id: c.id,
        })),
      });

      if (!categoryId) {
        console.error("❌ Categoria não encontrada!");
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Categoria "${
            parsed.category
          }" não encontrada. Categorias disponíveis: ${categories
            .map((c) => c.name)
            .join(", ")}`,
        });
        setIsProcessing(false);
        return;
      }

      if (!accounts || accounts.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Nenhuma conta encontrada.",
        });
        setIsProcessing(false);
        return;
      }

      // Buscar usuário atual com tentativa de refresh
      const currentUser = await getCurrentUserWithRefresh();
      
      if (!currentUser) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Sua sessão expirou. Faça login novamente.",
        });
        redirectToLogin();
        return;
      }
      
      const transactionData = {
        type: parsed.type,
        amount: parsed.amount,
        category_id: categoryId,
        account_id: parsed.accountId || selectedAccountId,
        description: parsed.description,
        transaction_date: new Date().toISOString().split("T")[0],
        created_via: "chat",
        user_id: currentUser.id,
      };

      console.log("💾 Dados da transação:", transactionData);

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      console.log("💾 Resultado da inserção:");
      console.log("  - Transaction:", transaction);
      console.log("  - Error:", error);

      if (error) {
        console.error("❌ ERRO COMPLETO:", JSON.stringify(error, null, 2));
        console.error("❌ Erro ao inserir transação:", error);
        console.error("❌ Detalhes do erro:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      toast({
        title: "Transação criada!",
        description: `${
          parsed.type === "income" ? "Receita" : "Despesa"
        } de ${parsed.amount.toFixed(2)} kr registrada!`,
      });

      setMessage("");
      await loadRecentTransactions();

      // Forçar atualização da página para mostrar dados atualizados
      if (onTransactionCreated) {
        onTransactionCreated();
      } else {
        // Fallback: recarregar página
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      
      if (isAuthError(error)) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Sua sessão expirou. Faça login novamente.",
        });
        redirectToLogin();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível criar a transação.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <MessageCircle size={24} />
              <h2 className="text-xl font-bold">FinControl Chat</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Seleção de Conta */}
          {accounts && accounts.length > 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Conta padrão:
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-2 rounded-lg border-0 bg-white/90 text-gray-800 focus:ring-2 focus:ring-white/50"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.icon} {account.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              📋 Últimas 5 transações:
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {transaction.type === "income" ? "💰" : "💸"}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        {getCategoryDisplayName(transaction.category?.name, language) || tTransactions.noCategory[language]}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {getAccountIcon(
                          transaction.account?.type || "personal"
                        )}
                        {transaction.account?.name} •{" "}
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString("pt-BR")}
                        {transaction.created_via === "chat" && (
                          <span className="bg-green-100 text-green-700 px-1 rounded text-xs">
                            chat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {transaction.amount.toFixed(2)} kr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 bg-gray-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              💬 Digite sua transação:
            </h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                📝 Exemplos:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  •{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    gasto mercado 100
                  </span>{" "}
                  - Despesa de 100 kr em mercado
                </p>
                <p>
                  •{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    receita salário 5000
                  </span>{" "}
                  - Receita de 5000 kr de salário
                </p>
                <p>
                  •{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    gasto restaurante 250 na conta casa
                  </span>{" "}
                  - Especificar conta
                </p>
                <p>
                  •{" "}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    receita freelance 1200
                  </span>{" "}
                  - Receita de freelance
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: gasto mercado 100"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isProcessing}
              className="flex-1 text-lg"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !message.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6"
            >
              <Send size={18} />
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              Processando transação...
            </div>
          )}

          {selectedAccountId && (
            <div className="mt-3 text-xs text-gray-500">
              💡 Conta padrão:{" "}
              {accounts.find((a) => a.id === selectedAccountId)?.icon}{" "}
              {accounts.find((a) => a.id === selectedAccountId)?.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
