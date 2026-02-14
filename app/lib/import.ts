import type { TAccount, TCategory } from "./types";

/**
 * CSV Row structure matching export format
 */
interface CSVRow {
  Data: string; // YYYY-MM-DD
  Tipo: string; // "Entrada" or "Saída"
  Categoria: string; // Category name
  Conta: string; // Account name
  "Valor (SEK)": string; // Number with comma as decimal separator
  Descrição: string;
}

/**
 * Parse CSV content and return array of transaction data
 * Matches the export format: semicolon separator, comma decimal
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV deve conter pelo menos cabeçalho e uma linha de dados");
  }

  // Remove BOM if present
  const firstLine = lines[0].replace(/^\uFEFF/, "");
  
  // Parse header
  const headers = firstLine.split(";").map((h) => h.trim());
  
  // Validate headers (colunas obrigatórias; colunas extras como ID, Valor_sinalizado são ignoradas)
  const expectedHeaders = ["Data", "Tipo", "Categoria", "Conta", "Valor (SEK)", "Descrição"];
  const hasAllHeaders = expectedHeaders.every((h) => headers.includes(h));

  if (!hasAllHeaders) {
    throw new Error(
      `Cabeçalhos inválidos. Esperado: ${expectedHeaders.join(", ")}`
    );
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    if (values.length !== headers.length) {
      console.warn(`Linha ${i + 1} ignorada: número de colunas incorreto`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    rows.push(row as CSVRow);
  }

  return rows;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      // Field separator
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Convert CSV row to transaction data
 */
export function csvRowToTransaction(
  row: CSVRow,
  accounts: TAccount[],
  categories: TCategory[]
): {
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  account_id: string | null;
  transaction_date: string;
  description: string;
  errors: string[];
} {
  const errors: string[] = [];

  // Parse type
  const type = row.Tipo === "Entrada" ? "income" : "expense";
  if (row.Tipo !== "Entrada" && row.Tipo !== "Saída") {
    errors.push(`Tipo inválido: ${row.Tipo}. Deve ser "Entrada" ou "Saída"`);
  }

  // Parse amount (convert comma to dot)
  const amountStr = row["Valor (SEK)"].replace(",", ".");
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    errors.push(`Valor inválido: ${row["Valor (SEK)"]}`);
  }

  // Find account by name
  const account = accounts.find(
    (a) => a.name.toLowerCase() === row.Conta.toLowerCase()
  );
  if (!account) {
    errors.push(`Conta não encontrada: ${row.Conta}`);
  }

  // Find category by name
  const category = categories.find(
    (c) => c.name.toLowerCase() === row.Categoria.toLowerCase()
  );
  if (!category) {
    errors.push(`Categoria não encontrada: ${row.Categoria}`);
  }

  // Validate date (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(row.Data)) {
    errors.push(`Data inválida: ${row.Data}. Use formato YYYY-MM-DD`);
  }

  return {
    type,
    amount,
    category_id: category?.id || null,
    account_id: account?.id || null,
    transaction_date: row.Data,
    description: row.Descrição || "",
    errors,
  };
}

