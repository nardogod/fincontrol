"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  processed?: boolean;
  result?: string;
  error?: string;
  transactionId?: string;
  type?: "transaction" | "command" | "response";
}

interface FloatingChatProps {
  accounts: any[];
  categories: any[];
  onTransactionCreated?: () => void;
}

export default function FloatingChat({
  accounts,
  categories,
  onTransactionCreated,
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id || null
  );
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null
  );
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens salvas
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat-messages");
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(parsed);
      setShowWelcome(parsed.length === 0);
    }
  }, []);

  // Carregar transações recentes
  const loadRecentTransactions = async () => {
    console.log("🔄 Carregando transações recentes...");
    console.log("Accounts disponíveis:", accounts);

    try {
      // Primeiro, tentar buscar todas as transações (sem filtro)
      console.log("1. Tentando buscar todas as transações...");
      const { data: allTransactions, error: allError } = await supabase
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

      console.log("Resultado da busca sem filtro:", {
        allTransactions,
        allError,
      });

      if (allError) {
        console.error("❌ Erro ao buscar todas as transações:", allError);
        setRecentTransactions([]);
        return;
      }

      if (allTransactions && allTransactions.length > 0) {
        console.log("✅ Transações encontradas:", allTransactions.length);
        setRecentTransactions(allTransactions);
        return;
      }

      // Se não encontrou transações, tentar com filtro de contas
      if (accounts && accounts.length > 0) {
        console.log("2. Tentando buscar com filtro de contas...");
        const accountIds = accounts.map((acc) => acc.id);
        console.log("Account IDs para filtrar:", accountIds);

        const { data: filteredTransactions, error: filteredError } =
          await supabase
            .from("transactions")
            .select(
              `
            id, type, amount, description, transaction_date, created_via,
            category:categories(name, icon),
            account:accounts(name, icon),
            user:users(full_name)
          `
            )
            .in("account_id", accountIds)
            .order("transaction_date", { ascending: false })
            .limit(10);

        console.log("Resultado da busca com filtro:", {
          filteredTransactions,
          filteredError,
        });

        if (filteredError) {
          console.error(
            "❌ Erro ao buscar transações filtradas:",
            filteredError
          );
        } else {
          console.log(
            "✅ Transações filtradas encontradas:",
            filteredTransactions?.length || 0
          );
          setRecentTransactions(filteredTransactions || []);
        }
      } else {
        console.log("⚠️ Nenhuma conta disponível para filtrar");
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error("❌ Erro geral ao carregar transações:", error);
      setRecentTransactions([]);
    }
  };

  // Carregar transações quando o chat abrir
  useEffect(() => {
    if (isOpen) {
      console.log("🚀 Chat aberto, carregando transações...");
      loadRecentTransactions();
    }
  }, [isOpen, accounts]);

  // Log quando recentTransactions mudar
  useEffect(() => {
    console.log("📊 Estado recentTransactions atualizado:", recentTransactions);
    console.log("📊 Número de transações:", recentTransactions.length);
  }, [recentTransactions]);

  // Salvar mensagens
  const saveMessages = (newMessages: ChatMessage[]) => {
    localStorage.setItem("chat-messages", JSON.stringify(newMessages));
  };

  // Processar comandos especiais
  const processCommand = async (text: string): Promise<ChatMessage | null> => {
    const lowerText = text.toLowerCase().trim();

    // Comando: listar transações
    if (
      lowerText === "histórico" ||
      lowerText === "historico" ||
      lowerText === "listar"
    ) {
      if (recentTransactions.length === 0) {
        return {
          id: Date.now().toString(),
          text: "📋 Nenhuma transação recente encontrada.",
          isUser: false,
          timestamp: new Date(),
          type: "response",
        };
      }

      const transactionsList = recentTransactions
        .slice(0, 5)
        .map((t, index) => {
          const emoji = t.type === "income" ? "💰" : "💸";
          const amount = t.amount.toFixed(2);
          const date = new Date(t.transaction_date).toLocaleDateString("pt-BR");
          return `${index + 1}. ${emoji} ${amount} kr - ${
            t.category?.name || "Sem categoria"
          } (${date})`;
        })
        .join("\n");

      return {
        id: Date.now().toString(),
        text: `📋 **Últimas 5 transações:**\n\n${transactionsList}\n\n💡 Use "editar 1" para editar a primeira transação`,
        isUser: false,
        timestamp: new Date(),
        type: "response",
      };
    }

    // Comando: editar transação
    const editMatch = lowerText.match(/editar\s+(\d+)/);
    if (editMatch) {
      const index = parseInt(editMatch[1]) - 1;
      if (index >= 0 && index < recentTransactions.length) {
        const transaction = recentTransactions[index];
        return {
          id: Date.now().toString(),
          text: `✏️ **Editando transação ${index + 1}:**\n\n${
            transaction.type === "income" ? "💰" : "💸"
          } ${transaction.amount} kr - ${
            transaction.category?.name || "Sem categoria"
          }\n\n💡 Digite: "novo valor 150" ou "nova categoria mercado"`,
          isUser: false,
          timestamp: new Date(),
          type: "response",
          transactionId: transaction.id,
        };
      } else {
        return {
          id: Date.now().toString(),
          text: "❌ Transação não encontrada. Use 'listar' para ver as transações disponíveis.",
          isUser: false,
          timestamp: new Date(),
          type: "response",
        };
      }
    }

    // Comando: deletar transação
    const deleteMatch = lowerText.match(/deletar\s+(\d+)/);
    if (deleteMatch) {
      const index = parseInt(deleteMatch[1]) - 1;
      if (index >= 0 && index < recentTransactions.length) {
        const transaction = recentTransactions[index];
        try {
          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", transaction.id);

          if (error) throw error;

          // Recarregar transações
          await loadRecentTransactions();
          onTransactionCreated?.();

          return {
            id: Date.now().toString(),
            text: `🗑️ Transação ${index + 1} deletada com sucesso!`,
            isUser: false,
            timestamp: new Date(),
            type: "response",
          };
        } catch (error) {
          return {
            id: Date.now().toString(),
            text: "❌ Erro ao deletar transação. Tente novamente.",
            isUser: false,
            timestamp: new Date(),
            type: "response",
          };
        }
      } else {
        return {
          id: Date.now().toString(),
          text: "❌ Transação não encontrada. Use 'listar' para ver as transações disponíveis.",
          isUser: false,
          timestamp: new Date(),
          type: "response",
        };
      }
    }

    return null;
  };

  // Função para editar transação
  const handleEditTransaction = (transaction: any, index: number) => {
    setEditingTransaction(transaction);
    setEditValue(transaction.amount.toString());

    // Adicionar mensagem de instrução
    const instructionMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `✏️ **Editando transação ${index + 1}:**\n\n${
        transaction.type === "income" ? "💰" : "💸"
      } ${transaction.amount} kr - ${
        transaction.category?.name || "Sem categoria"
      }\n\n💡 Digite o novo valor e pressione Enter`,
      isUser: false,
      timestamp: new Date(),
      type: "response",
      transactionId: transaction.id,
    };

    const newMessages = [...messages, instructionMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (!editingTransaction || !editValue.trim()) return;

    const newAmount = parseFloat(editValue.replace(",", "."));
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor inválido. Digite um número maior que zero.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ amount: newAmount })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      // Recarregar transações
      await loadRecentTransactions();
      onTransactionCreated?.();

      // Adicionar mensagem de sucesso
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `✅ Transação atualizada! Novo valor: ${newAmount.toFixed(2)} kr`,
        isUser: false,
        timestamp: new Date(),
        type: "response",
      };

      const newMessages = [...messages, successMessage];
      setMessages(newMessages);
      saveMessages(newMessages);

      toast({
        title: "Transação atualizada!",
        description: `Valor alterado para ${newAmount.toFixed(2)} kr`,
      });

      // Limpar edição
      setEditingTransaction(null);
      setEditValue("");
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a transação.",
      });
    }
  };

  // Parser de mensagens (mesmo do WhatsApp)
  const parseMessage = (text: string) => {
    const lowerText = text.toLowerCase();
    console.log("Parsing text:", lowerText);

    // Detectar especificação de conta
    let accountId = selectedAccountId;
    let cleanText = text;

    // Padrões para detectar conta: "na conta casa", "conta pessoal", etc.
    const accountPatterns = [
      /(?:na\s+conta|conta)\s+(\w+)/i,
      /(?:usando|com)\s+a\s+conta\s+(\w+)/i,
    ];

    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const accountName = match[1].toLowerCase();
        const foundAccount = accounts.find(
          (acc) =>
            acc.name.toLowerCase().includes(accountName) ||
            accountName.includes(acc.name.toLowerCase())
        );
        if (foundAccount) {
          accountId = foundAccount.id;
          cleanText = text.replace(pattern, "").trim();
          console.log(
            "Account specified:",
            foundAccount.name,
            "ID:",
            accountId
          );
        }
      }
    }

    // Padrões mais específicos para despesas
    const expensePatterns = [
      /(?:gasto|despesa|saída|saida)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/i,
      /(?:compras|mercado|transporte|lazer|saúde|saude|restaurant|restaurante)\s+(\d+(?:[.,]\d+)?)/i,
      // Comando "gasto" para despesas
      /(?:gasto|gastar)\s+(\d+(?:[.,]\d+)?)\s+(\w+)/i,
      /(?:gasto|gastar)\s+(\d+(?:[.,]\d+)?)/i,
    ];

    // Padrões mais específicos para receitas
    const incomePatterns = [
      /(?:receita|entrada)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/i,
      /(?:salário|salario|freelance|investimento)\s+(\d+(?:[.,]\d+)?)/i,
      // Comando "add" para adicionar dinheiro
      /(?:add|adicionar)\s+(\d+(?:[.,]\d+)?)\s+(\w+)/i,
      /(?:add|adicionar)\s+(\d+(?:[.,]\d+)?)/i,
    ];

    // Usar cleanText para parsing
    const cleanLowerText = cleanText.toLowerCase();

    // Tentar padrões de despesa primeiro
    for (const pattern of expensePatterns) {
      const match = cleanLowerText.match(pattern);
      if (match) {
        console.log("Expense pattern match:", match);
        let amount, category;

        // Para padrões com categoria: "gasto 100 mercado"
        if (match[2]) {
          amount = parseFloat(match[1].replace(",", "."));
          category = match[2];
        }
        // Para padrões sem categoria: "gasto 100"
        else {
          amount = parseFloat(match[1].replace(",", "."));
          category = "geral"; // categoria padrão
        }

        console.log("Extracted - amount:", amount, "category:", category);

        if (!isNaN(amount)) {
          return {
            type: "expense" as const,
            amount,
            category: category.toLowerCase(),
            description: cleanText,
            accountId,
          };
        }
      }
    }

    // Tentar padrões de receita
    for (const pattern of incomePatterns) {
      const match = cleanLowerText.match(pattern);
      if (match) {
        console.log("Income pattern match:", match);
        let amount, category;

        // Para padrões com categoria: "add 1000 freelancer"
        if (match[2]) {
          amount = parseFloat(match[1].replace(",", "."));
          category = match[2];
        }
        // Para padrões sem categoria: "add 1000"
        else {
          amount = parseFloat(match[1].replace(",", "."));
          category = "salário"; // categoria padrão
        }

        console.log("Extracted - amount:", amount, "category:", category);

        if (!isNaN(amount)) {
          return {
            type: "income" as const,
            amount,
            category: category.toLowerCase(),
            description: cleanText,
            accountId,
          };
        }
      }
    }

    return null;
  };

  // Mapear categoria para ID
  const findCategoryId = (categoryName: string, type: "income" | "expense") => {
    const categoryMappings: { [key: string]: string[] } = {
      mercado: ["mercado", "compras", "supermercado"],
      transporte: ["transporte", "gasolina", "uber", "taxi"],
      lazer: ["lazer", "cinema", "restaurante", "restaurant", "bar"],
      saúde: ["saúde", "saude", "farmacia", "medico"],
      salário: ["salário", "salario", "salario"],
      freelance: ["freelance", "freela"],
      investimento: ["investimento", "renda"],
      geral: ["geral", "outros", "diversos"],
    };

    // Encontrar categoria por mapeamento
    for (const [key, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some((keyword) => categoryName.includes(keyword))) {
        const category = categories.find(
          (cat) => cat.name.toLowerCase().includes(key) && cat.type === type
        );
        if (category) return category.id;
      }
    }

    // Fallback
    return categories.find((cat) => cat.type === type)?.id;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setMessage("");
    setIsProcessing(true);
    setShowWelcome(false);

    try {
      // Se estiver editando uma transação, processar edição
      if (editingTransaction) {
        const newAmount = parseFloat(message.replace(",", "."));
        if (!isNaN(newAmount) && newAmount > 0) {
          setEditValue(message);
          await handleSaveEdit();
          setIsProcessing(false);
          return;
        } else {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            text: "❌ Valor inválido. Digite um número maior que zero.",
            isUser: false,
            timestamp: new Date(),
            type: "response",
          };
          const updatedMessages = [...newMessages, errorMessage];
          setMessages(updatedMessages);
          saveMessages(updatedMessages);
          setIsProcessing(false);
          return;
        }
      }

      // Primeiro, verificar se é um comando
      const commandResponse = await processCommand(message);
      if (commandResponse) {
        const updatedMessages = [...newMessages, commandResponse];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
        setIsProcessing(false);
        return;
      }

      // Se não for comando, tentar parsear como transação
      console.log("🔍 Tentando parsear mensagem:", message);
      const parsed = parseMessage(message);
      console.log("📝 Mensagem parseada:", parsed);

      if (!parsed) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Não consegui entender. Use:\n• 'gasto restaurant 100'\n• 'receita salário 5000'\n• 'listar' - ver histórico\n• 'editar 1' - editar transação\n• 'deletar 1' - deletar transação",
          isUser: false,
          timestamp: new Date(),
          processed: true,
          error: "Formato não reconhecido",
        };

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
        return;
      }

      // Encontrar categoria
      console.log(
        "🔍 Buscando categoria:",
        parsed.category,
        "tipo:",
        parsed.type
      );
      console.log("📊 Categorias disponíveis:", categories);
      const categoryId = findCategoryId(parsed.category, parsed.type);
      console.log("🎯 ID da categoria encontrada:", categoryId);

      if (!categoryId) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Categoria não encontrada. Tente: mercado, transporte, lazer, etc.",
          isUser: false,
          timestamp: new Date(),
          processed: true,
          error: "Categoria não encontrada",
        };

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
        return;
      }

      // Verificar se há contas disponíveis
      if (!accounts || accounts.length === 0) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "❌ Nenhuma conta encontrada. Crie uma conta primeiro em /accounts",
          isUser: false,
          timestamp: new Date(),
          processed: true,
          error: "Nenhuma conta disponível",
        };

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
        return;
      }

      // Usar conta especificada ou primeira disponível
      const targetAccountId = parsed.accountId || accounts[0].id;
      const targetAccount = accounts.find((acc) => acc.id === targetAccountId);

      // Criar transação
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          type: parsed.type,
          amount: parsed.amount,
          category_id: categoryId,
          account_id: targetAccountId,
          description: parsed.description,
          transaction_date: new Date().toISOString().split("T")[0],
          created_via: "chat",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao criar transação:", error);
        throw error;
      }

      console.log("✅ Transação criada com sucesso:", transaction);

      // Resposta de sucesso
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `✅ ${
          parsed.type === "income" ? "Receita" : "Despesa"
        } de ${parsed.amount.toFixed(2)} kr registrada na conta ${
          targetAccount?.name || "Principal"
        }!`,
        isUser: false,
        timestamp: new Date(),
        processed: true,
        result: "Transação criada com sucesso",
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      // Recarregar transações recentes
      await loadRecentTransactions();

      toast({
        title: "Transação criada!",
        description: `Chat: ${
          parsed.type === "income" ? "Receita" : "Despesa"
        } de ${parsed.amount.toFixed(2)} kr`,
      });

      onTransactionCreated?.();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "❌ Erro ao registrar transação. Tente novamente.",
        isUser: false,
        timestamp: new Date(),
        processed: true,
        error: "Erro no servidor",
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
    localStorage.removeItem("chat-messages");
  };

  console.log("🎯 FloatingChat renderizando...", {
    isOpen,
    accounts: accounts?.length,
  });

  return (
    <>
      {/* Botão flutuante do chat */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-[9999] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-green-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-medium">FinControl Chat</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={clearChat}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-green-600"
                >
                  Limpar
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-green-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Account Selector */}
            {accounts.length > 1 && (
              <div className="text-xs">
                <span className="text-green-100">Conta padrão:</span>
                <select
                  value={selectedAccountId || ""}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="ml-1 bg-green-600 text-white border-none rounded px-1 py-0.5 text-xs"
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {showWelcome && (
              <div className="text-center text-gray-500 text-sm">
                <Bot className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Olá! Digite sua transação ou comando:</p>
                <div className="text-xs mt-2 space-y-1">
                  <p className="font-medium text-gray-700">💸 Transações:</p>
                  <p>• gasto restaurant 100</p>
                  <p>• receita salário 5000</p>
                  {accounts.length > 1 && (
                    <p>• gasto mercado 50 na conta casa</p>
                  )}
                  <p className="font-medium text-gray-700 mt-2">📋 Comandos:</p>
                  <p>• listar - ver histórico</p>
                  <p>• editar 1 - editar transação</p>
                  <p>• deletar 1 - deletar transação</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.isUser
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.isUser ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    <span className="text-xs opacity-70">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-line text-sm">
                    {msg.text.split("\n").map((line, index) => (
                      <div key={index}>
                        {line.includes("**") ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: line.replace(
                                /\*\*(.*?)\*\*/g,
                                "<strong>$1</strong>"
                              ),
                            }}
                          />
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3" />
                    <span>Processando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Recent Transactions List */}
          {(() => {
            console.log("🎨 Renderizando lista de transações...");
            console.log(
              "🎨 recentTransactions.length:",
              recentTransactions.length
            );
            console.log("🎨 recentTransactions:", recentTransactions);
            return null;
          })()}

          {/* Debug message when no transactions */}
          {recentTransactions.length === 0 && (
            <div className="border-t bg-yellow-50 p-3 text-xs text-yellow-700">
              🔍 Debug: Nenhuma transação encontrada. Verifique o console para
              logs.
            </div>
          )}

          {recentTransactions.length > 0 && (
            <div className="border-t bg-gray-50 p-3 max-h-32 overflow-y-auto">
              <div className="text-xs font-medium text-gray-600 mb-2">
                📋 Últimas 5 transações:
              </div>
              <div className="space-y-1">
                {recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between bg-white p-2 rounded text-xs border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {transaction.type === "income" ? "💰" : "💸"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {transaction.category?.name || "Sem categoria"}
                        </div>
                        <div className="text-gray-500 truncate">
                          {transaction.account?.name} •{" "}
                          {new Date(
                            transaction.transaction_date
                          ).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {transaction.amount.toFixed(2)} kr
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                        onClick={() =>
                          handleEditTransaction(transaction, index)
                        }
                      >
                        ✏️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            {editingTransaction && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">
                    ✏️ Editando:{" "}
                    {editingTransaction.category?.name || "Sem categoria"} -{" "}
                    {editingTransaction.amount} kr
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setEditingTransaction(null);
                      setEditValue("");
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  editingTransaction
                    ? "Digite o novo valor..."
                    : "Ex: gasto restaurant 100"
                }
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isProcessing || !message.trim()}
                size="icon"
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
