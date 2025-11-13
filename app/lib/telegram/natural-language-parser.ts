/**
 * Natural Language Parser for Telegram Bot
 * Processa mensagens em linguagem natural e extrai informações de transações
 */

interface ParsedTransaction {
  type: "expense" | "income" | null;
  amount: number | null;
  currency?: string;
  category: string | null;
  account: string | null;
  description: string;
  confidence: number; // 0-1
  missingFields: string[]; // Campos que faltam
}

interface ParseContext {
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; type: "expense" | "income" }>;
}

/**
 * Mapeamento de palavras-chave para categorias
 */
const categoryMappings: { [key: string]: string[] } = {
  mercado: ["mercado", "supermercado", "compras", "feira"],
  alimentação: [
    "alimentação",
    "alimentacao",
    "comida",
    "restaurante",
    "lanche",
    "café",
    "cafe",
  ],
  transporte: [
    "transporte",
    "uber",
    "taxi",
    "gasolina",
    "combustível",
    "combustivel",
  ],
  utilidades: [
    "luz",
    "água",
    "agua",
    "internet",
    "telefone",
    "conta",
    "contas",
    "fatura",
  ],
  lazer: ["lazer", "cinema", "bar", "show", "evento"],
  saúde: [
    "saúde",
    "saude",
    "farmacia",
    "farmacia",
    "médico",
    "medico",
    "hospital",
  ],
  salário: ["salário", "salario", "salario"],
  freelance: ["freelance", "freela", "trabalho extra"],
  investimento: ["investimento", "renda", "dividendos"],
  outros: ["outros", "diversos", "geral"],
};

/**
 * Palavras-chave para identificar tipo de transação
 */
const expenseKeywords = [
  "gastei",
  "gasto",
  "gastar",
  "paguei",
  "pague",
  "pagar",
  "comprei",
  "comprar",
  "saída",
  "saida",
  "despesa",
  "fatura",
  "conta",
  "contas",
];

const incomeKeywords = [
  "recebi",
  "receba",
  "receber",
  "entrada",
  "ganhei",
  "ganhar",
  "salário",
  "salario",
  "freelance",
  "freela",
  "investimento",
];

/**
 * Extrai valor numérico de uma string
 */
function extractAmount(text: string): {
  amount: number | null;
  currency?: string;
  remainingText: string;
} {
  // Padrões: "15", "15.50", "15,50", "R$ 15", "15 reais", "15 sek", "15 BRL"
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:sek|kr|reais?|brl|r\$\s*)?/i,
    /(?:r\$\s*|sek\s*|kr\s*)?(\d+(?:[.,]\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(",", ".");
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0) {
        // Detectar moeda
        const currencyMatch = text.match(/(?:sek|kr|reais?|brl|r\$)/i);
        const currency = currencyMatch
          ? currencyMatch[0].toLowerCase().includes("sek") ||
            currencyMatch[0].toLowerCase().includes("kr")
            ? "kr"
            : "brl"
          : undefined;

        return {
          amount,
          currency,
          remainingText: text.replace(pattern, "").trim(),
        };
      }
    }
  }

  return { amount: null, remainingText: text };
}

/**
 * Identifica o tipo de transação (receita/despesa)
 */
function identifyType(text: string): "expense" | "income" | null {
  const lowerText = text.toLowerCase();

  // Verificar palavras-chave de receita PRIMEIRO (mais específicas)
  // para evitar falsos positivos com palavras como "conta" que podem aparecer em ambos
  for (const keyword of incomeKeywords) {
    // Verificar palavra completa ou no início da frase para evitar falsos positivos
    const regex = new RegExp(`\\b${keyword}\\b|^${keyword}\\s+`, "i");
    if (regex.test(lowerText)) {
      return "income";
    }
  }

  // Depois verificar palavras-chave de despesa
  for (const keyword of expenseKeywords) {
    // Verificar palavra completa ou no início da frase para evitar falsos positivos
    const regex = new RegExp(`\\b${keyword}\\b|^${keyword}\\s+`, "i");
    if (regex.test(lowerText)) {
      return "expense";
    }
  }

  return null;
}

/**
 * Identifica categoria por palavras-chave
 */
function identifyCategory(
  text: string,
  type: "expense" | "income"
): string | null {
  const lowerText = text.toLowerCase();

  // Buscar em mapeamentos
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Identifica conta por nome
 */
function identifyAccount(
  text: string,
  accounts: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const lowerText = text.toLowerCase();

  // Padrões melhorados baseados nos exemplos:
  // "da conta X", "conta X", "na conta X", "conta X" no final
  const accountPatterns = [
    /(?:da\s+conta|conta|na\s+conta)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+(?:\s+\w+)?)\s+(?:conta|da\s+conta)$/i, // "conta pessoal" no final
  ];

  for (const pattern of accountPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const accountName = match[1].toLowerCase().trim();

      // Buscar conta que contenha ou seja contida no nome
      const foundAccount = accounts.find((acc) => {
        const accNameLower = acc.name.toLowerCase();
        return (
          accNameLower.includes(accountName) ||
          accountName.includes(accNameLower) ||
          accNameLower === accountName
        );
      });

      if (foundAccount) {
        return foundAccount;
      }
    }
  }

  // Tentar buscar diretamente por nome da conta no texto (mais flexível)
  for (const account of accounts) {
    const accountNameLower = account.name.toLowerCase();
    const accountWords = accountNameLower.split(/\s+/);

    // Verificar se todas as palavras da conta estão no texto
    const allWordsFound = accountWords.every(
      (word) => word.length > 2 && lowerText.includes(word)
    );

    if (allWordsFound || lowerText.includes(accountNameLower)) {
      return account;
    }
  }

  return null;
}

/**
 * Extrai descrição do texto
 */
function extractDescription(
  text: string,
  amount: number | null,
  category: string | null,
  account: string | null
): string {
  let description = text.trim();

  // Remover valor (mais preciso)
  if (amount) {
    // Remover padrões como "15 sek", "15 kr", "R$ 15", "15 reais"
    description = description
      .replace(
        new RegExp(`\\d+(?:[.,]\\d+)?\\s*(?:sek|kr|reais?|brl|r\\$)?`, "gi"),
        ""
      )
      .trim();
  }

  // Remover palavras-chave de tipo (apenas no início)
  const typeKeywords = [...expenseKeywords, ...incomeKeywords];
  for (const keyword of typeKeywords) {
    const regex = new RegExp(`^${keyword}\\s+`, "gi");
    description = description.replace(regex, "").trim();
  }

  // Remover referências de conta (mais flexível)
  description = description
    .replace(/(?:da\s+conta|conta|na\s+conta)\s+\w+(?:\s+\w+)?/gi, "")
    .trim();
  if (account) {
    const accountWords = account.toLowerCase().split(/\s+/);
    for (const word of accountWords) {
      if (word.length > 2) {
        description = description
          .replace(new RegExp(`\\b${word}\\b`, "gi"), "")
          .trim();
      }
    }
  }

  // Remover referências de categoria conhecidas (apenas se for palavra completa)
  if (category) {
    const keywords = categoryMappings[category] || [];
    for (const keyword of keywords) {
      // Remover apenas se for palavra completa
      description = description
        .replace(new RegExp(`\\b${keyword}\\b`, "gi"), "")
        .trim();
    }
  }

  // Limpar espaços extras e pontuação desnecessária
  description = description.replace(/\s+/g, " ").trim();
  description = description.replace(/^[,\s]+|[,\s]+$/g, "").trim();

  // Se sobrou algo útil, usar; senão usar categoria ou tipo como descrição
  if (description && description.length > 1) {
    return description;
  }

  // Fallback: usar categoria ou tipo
  if (category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  return "Transação";
}

/**
 * Parse principal - processa mensagem em linguagem natural
 */
export function parseNaturalLanguage(
  text: string,
  context: ParseContext
): ParsedTransaction {
  const originalText = text.trim();
  const lowerText = originalText.toLowerCase();

  // Se começar com /, não é linguagem natural
  if (originalText.startsWith("/")) {
    return {
      type: null,
      amount: null,
      category: null,
      account: null,
      description: originalText,
      confidence: 0,
      missingFields: ["type", "amount"],
    };
  }

  // Extrair valor
  const { amount, currency, remainingText } = extractAmount(originalText);

  // Identificar tipo
  const type = identifyType(originalText);

  // Identificar categoria (se tipo identificado)
  const category = type ? identifyCategory(originalText, type) : null;

  // Identificar conta
  const account = identifyAccount(originalText, context.accounts);

  // Extrair descrição
  const description = extractDescription(
    originalText,
    amount,
    category,
    account?.name || null
  );

  // Calcular confiança
  let confidence = 0;
  let missingFields: string[] = [];

  if (amount && amount > 0) confidence += 0.4;
  else missingFields.push("amount");

  if (type) confidence += 0.3;
  else missingFields.push("type");

  if (category) confidence += 0.2;
  else if (type) missingFields.push("category");

  if (account) confidence += 0.1;
  else if (context.accounts.length > 1) missingFields.push("account");

  return {
    type,
    amount,
    currency,
    category,
    account: account?.name || null,
    description,
    confidence,
    missingFields,
  };
}

/**
 * Formata mensagem de confirmação
 */
export function formatConfirmationMessage(
  parsed: ParsedTransaction,
  accountId: string | null
): string {
  const typeText =
    parsed.type === "expense"
      ? "despesa"
      : parsed.type === "income"
      ? "receita"
      : "transação";
  const amountText = parsed.amount
    ? `${parsed.amount.toFixed(2).replace(".", ",")} ${
        parsed.currency === "kr" ? "kr" : "R$"
      }`
    : "[valor não identificado]";
  const categoryText = parsed.category || "Outros";
  const accountText = parsed.account || "[conta não especificada]";

  return `✅ Ok, devo registrar ${typeText} de ${amountText} na categoria "${categoryText}" na conta "${accountText}"?`;
}

/**
 * Gera mensagem de ajuda quando não entende
 */
export function generateHelpMessage(context: ParseContext): string {
  const accountNames = context.accounts
    .map((acc) => `• ${acc.name}`)
    .join("\n");
  const expenseCategories = context.categories
    .filter((cat) => cat.type === "expense")
    .map((cat) => `• ${cat.name}`)
    .join("\n");
  const incomeCategories = context.categories
    .filter((cat) => cat.type === "income")
    .map((cat) => `• ${cat.name}`)
    .join("\n");

  return (
    `❓ *Não entendi sua mensagem*\n\n` +
    `*Como usar:*\n` +
    `Envie sua transação de forma simples:\n\n` +
    `*Exemplos de despesas:*\n` +
    `• "gastei 15 sek da conta casa no mercado"\n` +
    `• "gasto 15 mercado conta pessoal"\n` +
    `• "Gasto café 98 da conta pessoal"\n` +
    `• "Gasto internet 125 da conta pessoal"\n\n` +
    `*Exemplos de receitas:*\n` +
    `• "receita 5000 salario conta principal"\n` +
    `• "recebi 200 freelance conta pessoal"\n\n` +
    `*Suas contas disponíveis:*\n${
      accountNames || "Nenhuma conta encontrada"
    }\n\n` +
    `*Categorias de despesa:*\n${
      expenseCategories || "Nenhuma categoria encontrada"
    }\n\n` +
    `*Categorias de receita:*\n${
      incomeCategories || "Nenhuma categoria encontrada"
    }\n\n` +
    `💡 *Dica:* Se não especificar a conta e tiver várias, eu vou perguntar qual usar.`
  );
}
