"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { MessageCircle, Send, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  processed: boolean;
  result?: string;
  error?: string;
}

interface WhatsAppChatProps {
  accounts: any[];
  categories: any[];
  onTransactionCreated?: () => void;
}

export default function WhatsAppChat({
  accounts,
  categories,
  onTransactionCreated,
}: WhatsAppChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Parser de mensagens do WhatsApp
  const parseMessage = (text: string) => {
    const lowerText = text.toLowerCase();
    console.log("Parsing text:", lowerText);

    // Padrões mais específicos para despesas
    const expensePatterns = [
      // "gasto mercado 102" -> type: expense, category: mercado, amount: 102
      /(?:gasto|despesa|saída|saida)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/i,
      // "compras mercado 102" -> type: expense, category: mercado, amount: 102
      /(?:compras|mercado|transporte|lazer|saúde|saude)\s+(\d+(?:[.,]\d+)?)/i,
    ];

    // Padrões mais específicos para receitas
    const incomePatterns = [
      // "receita salário 5000" -> type: income, category: salário, amount: 5000
      /(?:receita|entrada)\s+(\w+)\s+(\d+(?:[.,]\d+)?)/i,
      // "salário 5000" -> type: income, category: salário, amount: 5000
      /(?:salário|salario|freelance|investimento)\s+(\d+(?:[.,]\d+)?)/i,
    ];

    // Tentar padrões de despesa primeiro
    for (const pattern of expensePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        console.log("Expense pattern match:", match);
        const amount = parseFloat(match[2] || match[1].replace(",", "."));
        const category = match[1];
        console.log("Extracted - amount:", amount, "category:", category);

        if (!isNaN(amount)) {
          return {
            type: "expense" as const,
            amount,
            category: category.toLowerCase(),
            description: text,
          };
        }
      }
    }

    // Tentar padrões de receita
    for (const pattern of incomePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        console.log("Income pattern match:", match);
        const amount = parseFloat(match[2] || match[1].replace(",", "."));
        const category = match[1];
        console.log("Extracted - amount:", amount, "category:", category);

        if (!isNaN(amount)) {
          return {
            type: "income" as const,
            amount,
            category: category.toLowerCase(),
            description: text,
          };
        }
      }
    }

    console.log("No pattern matched");
    return null;
  };

  // Mapear categoria para ID
  const findCategoryId = (categoryName: string, type: "income" | "expense") => {
    console.log("Looking for category:", categoryName, "type:", type);

    // Mapear palavras-chave para categorias
    const categoryMappings: { [key: string]: string[] } = {
      mercado: ["mercado", "compras", "supermercado"],
      transporte: ["transporte", "gasolina", "uber", "taxi"],
      lazer: ["lazer", "cinema", "restaurante", "bar"],
      saúde: ["saúde", "saude", "farmacia", "medico"],
      salário: ["salário", "salario", "salario"],
      freelance: ["freelance", "freela"],
      investimento: ["investimento", "renda"],
    };

    // Encontrar categoria por mapeamento
    for (const [key, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some((keyword) => categoryName.includes(keyword))) {
        const category = categories.find(
          (cat) => cat.name.toLowerCase().includes(key) && cat.type === type
        );
        if (category) {
          console.log("Found category by mapping:", category);
          return category.id;
        }
      }
    }

    // Fallback: buscar por nome exato
    const category = categories.find(
      (cat) =>
        cat.name.toLowerCase().includes(categoryName) && cat.type === type
    );

    if (category) {
      console.log("Found category by name:", category);
      return category.id;
    }

    // Fallback: primeira categoria do tipo
    const fallbackCategory = categories.find((cat) => cat.type === type);
    console.log("Using fallback category:", fallbackCategory);
    return fallbackCategory?.id;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date(),
      processed: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsProcessing(true);

    try {
      // Parsear mensagem
      const parsed = parseMessage(message);
      console.log("Parsed message:", parsed);

      if (!parsed) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  processed: true,
                  error:
                    "Não consegui entender a mensagem. Use: 'gasto mercado 100' ou 'receita salário 5000'",
                }
              : msg
          )
        );
        return;
      }

      // Encontrar categoria
      const categoryId = findCategoryId(parsed.category, parsed.type);
      console.log(
        "Category ID found:",
        categoryId,
        "for category:",
        parsed.category,
        "type:",
        parsed.type
      );
      console.log("Available categories:", categories);

      if (!categoryId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? { ...msg, processed: true, error: "Categoria não encontrada" }
              : msg
          )
        );
        return;
      }

      // Buscar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Criar transação
      console.log("Creating transaction with data:", {
        type: parsed.type,
        amount: parsed.amount,
        category_id: categoryId,
        account_id: accounts[0]?.id,
        description: parsed.description,
        transaction_date: new Date().toISOString().split("T")[0],
        created_via: "whatsapp",
        user_id: currentUser?.id,
      });

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          type: parsed.type,
          amount: parsed.amount,
          category_id: categoryId,
          account_id: accounts[0]?.id, // Usar primeira conta
          description: parsed.description,
          transaction_date: new Date().toISOString().split("T")[0],
          created_via: "whatsapp",
          user_id: currentUser?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Atualizar mensagem com sucesso
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                processed: true,
                result: `✅ Transação criada: ${
                  parsed.type === "income" ? "Receita" : "Despesa"
                } de ${parsed.amount.toFixed(2)} kr`,
              }
            : msg
        )
      );

      toast({
        title: "Transação criada!",
        description: `WhatsApp: ${
          parsed.type === "income" ? "Receita" : "Despesa"
        } de ${parsed.amount.toFixed(2)} kr`,
      });

      // Notificar componente pai
      onTransactionCreated?.();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, processed: true, error: "Erro ao criar transação" }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
      setMessage("");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de mensagem */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: gasto mercado 100"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || !message.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Histórico de mensagens */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{msg.text}</p>
                  <p className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                  {msg.processed && (
                    <div className="mt-2 flex items-center gap-1">
                      {msg.result ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            {msg.result}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">
                            {msg.error}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exemplos */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Exemplos:</p>
          <p>• gasto mercado 150</p>
          <p>• receita salário 5000</p>
          <p>• despesa transporte 50</p>
        </div>
      </CardContent>
    </Card>
  );
}
