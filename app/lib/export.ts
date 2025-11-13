import type { TTransaction, TCategory, TAccount } from "./types";
import ExcelJS from "exceljs";

/**
 * Transaction with relations for export
 */
interface ExportTransaction extends TTransaction {
  category: TCategory | null;
  account: TAccount;
}

/**
 * Export transactions to CSV format (Brazilian format with comma as decimal separator)
 * Downloads file automatically to user's browser
 *
 * @param transactions - Array of transactions with relations
 * @param startDate - Start date of export period
 * @param endDate - End date of export period
 * @param accountName - Name of the account being exported
 *
 * @example
 * exportToCSV(transactions, '2024-01-01', '2024-01-31', 'Pamela')
 */
export function exportToCSV(
  transactions: ExportTransaction[],
  startDate: string,
  endDate: string,
  accountName: string
): void {
  console.log(`📊 exportToCSV - Iniciando exportação: ${accountName}`);
  console.log(`📊 exportToCSV - Transações recebidas: ${transactions.length}`);

  // Permitir exportar mesmo sem transações (apenas cabeçalho)
  // Isso facilita o trabalho no pandas depois

  // Sort transactions by date (newest first, like the example)
  const sortedTransactions =
    transactions && transactions.length > 0
      ? [...transactions].sort((a, b) => {
          return (
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime()
          );
        })
      : [];

  // CSV Headers (exactly as in the example)
  const headers = [
    "Data",
    "Tipo",
    "Categoria",
    "Conta",
    "Valor (SEK)",
    "Descrição",
  ];

  // Convert transactions to CSV rows
  const rows = sortedTransactions.map((transaction) => {
    const accountName = transaction.account?.name || "Sem conta";
    const categoryName = transaction.category?.name || "Sem categoria";

    return [
      formatDateForCSV(transaction.transaction_date), // YYYY-MM-DD format
      transaction.type === "income" ? "Entrada" : "Saída",
      categoryName,
      accountName,
      formatNumberForCSV(transaction.amount), // Format with comma as decimal separator
      escapeCSVField(transaction.description || ""),
    ];
  });

  // Build CSV content
  // Usar ponto e vírgula (;) como separador de colunas
  // pois os valores usam vírgula (,) como separador decimal
  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  // Create blob with BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Generate filename
  const filename = `FinControl_${accountName.replace(
    /\s+/g,
    "_"
  )}_${startDate}_${endDate}.csv`;

  console.log(`📊 exportToCSV - Arquivo gerado: ${filename}`);
  console.log(`📊 exportToCSV - Tamanho do blob: ${blob.size} bytes`);

  // Trigger download
  try {
    downloadBlob(blob, filename);
    console.log(`✅ exportToCSV - Download iniciado: ${filename}`);
  } catch (error) {
    console.error(`❌ exportToCSV - Erro ao fazer download:`, error);
    throw error;
  }
}

/**
 * Export transactions to TXT format (same structure as CSV but .txt extension)
 * Downloads file automatically to user's browser
 *
 * @param transactions - Array of transactions with relations
 * @param startDate - Start date of export period
 * @param endDate - End date of export period
 * @param accountName - Name of the account being exported
 */
export function exportToTXT(
  transactions: ExportTransaction[],
  startDate: string,
  endDate: string,
  accountName: string
): void {
  // Sort transactions by date (newest first, like the example)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return (
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
    );
  });

  // TXT Headers (same as CSV)
  const headers = [
    "Data",
    "Tipo",
    "Categoria",
    "Conta",
    "Valor (SEK)",
    "Descrição",
  ];

  // Convert transactions to TXT rows
  const rows = sortedTransactions.map((transaction) => {
    const accountName = transaction.account?.name || "Sem conta";
    const categoryName = transaction.category?.name || "Sem categoria";

    return [
      formatDateForCSV(transaction.transaction_date),
      transaction.type === "income" ? "Entrada" : "Saída",
      categoryName,
      accountName,
      formatNumberForCSV(transaction.amount),
      escapeCSVField(transaction.description || ""),
    ];
  });

  // Build TXT content (same format as CSV)
  const txtContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob
  const blob = new Blob([txtContent], {
    type: "text/plain;charset=utf-8;",
  });

  // Generate filename
  const filename = `FinControl_${accountName.replace(
    /\s+/g,
    "_"
  )}_${startDate}_${endDate}.txt`;

  console.log(`📊 exportToTXT - Arquivo gerado: ${filename}`);
  console.log(`📊 exportToTXT - Tamanho do blob: ${blob.size} bytes`);

  // Trigger download
  try {
    downloadBlob(blob, filename);
    console.log(`✅ exportToTXT - Download iniciado: ${filename}`);
  } catch (error) {
    console.error(`❌ exportToTXT - Erro ao fazer download:`, error);
    throw error;
  }
}

/**
 * Format date for CSV (YYYY-MM-DD)
 */
function formatDateForCSV(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

/**
 * Format number for CSV (use comma as decimal separator - Brazilian format)
 * Example: 98.00 -> "98,00"
 */
function formatNumberForCSV(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/**
 * Escape CSV field (handle semicolons, commas, newlines and quotes)
 */
function escapeCSVField(field: string): string {
  // If field contains semicolon, comma, newline, or quote, wrap in quotes
  if (
    field.includes(";") ||
    field.includes(",") ||
    field.includes("\n") ||
    field.includes('"')
  ) {
    // Escape quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  // Create temporary link element
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export transactions to Excel format
 * Simple backup format with transactions organized month by month
 *
 * @param transactions - Array of transactions with relations
 * @param startDate - Start date of export period
 * @param endDate - End date of export period
 * @param accountName - Name of the account being exported
 */
export async function exportToExcel(
  transactions: ExportTransaction[],
  startDate: string,
  endDate: string,
  accountName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Transações");

  // Set column widths
  worksheet.columns = [
    { width: 12 }, // Data
    { width: 10 }, // Tipo
    { width: 20 }, // Categoria
    { width: 30 }, // Descrição
    { width: 15 }, // Valor
  ];

  // Header style
  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF1E3A8A" },
    },
    alignment: { horizontal: "center" as const, vertical: "middle" as const },
  };

  // Add header row
  worksheet.addRow(["Data", "Tipo", "Categoria", "Descrição", "Valor"]);
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });
  headerRow.height = 25;

  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return (
      new Date(a.transaction_date).getTime() -
      new Date(b.transaction_date).getTime()
    );
  });

  // Group transactions by month
  const transactionsByMonth = new Map<string, ExportTransaction[]>();

  sortedTransactions.forEach((transaction) => {
    const date = new Date(transaction.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    if (!transactionsByMonth.has(monthLabel)) {
      transactionsByMonth.set(monthLabel, []);
    }
    transactionsByMonth.get(monthLabel)!.push(transaction);
  });

  let currentRow = 2; // Start after header

  // Process each month
  for (const [monthLabel, monthTransactions] of transactionsByMonth.entries()) {
    // Add month separator
    const monthRow = worksheet.addRow([`${monthLabel.toUpperCase()}`]);
    monthRow.eachCell((cell) => {
      cell.style = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9CA3AF" },
        },
        alignment: { horizontal: "left", vertical: "middle" },
      };
    });
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    currentRow++;

    // Add transactions for this month
    let monthIncome = 0;
    let monthExpense = 0;

    monthTransactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const formattedDate = date.toLocaleDateString("pt-BR");
      const type = transaction.type === "income" ? "Receita" : "Despesa";
      const category = transaction.category?.name || "Sem categoria";
      const description = transaction.description || "";
      const amount = Number(transaction.amount);

      if (transaction.type === "income") {
        monthIncome += amount;
      } else {
        monthExpense += amount;
      }

      const row = worksheet.addRow([
        formattedDate,
        type,
        category,
        description,
        amount,
      ]);

      // Format amount cell
      const amountCell = row.getCell(5);
      amountCell.numFmt = "#,##0.00";
      if (transaction.type === "expense") {
        amountCell.font = { color: { argb: "FFEF4444" } };
        amountCell.value = -Math.abs(amount); // Negative for expenses
      } else {
        amountCell.font = { color: { argb: "FF10B981" } };
      }

      currentRow++;
    });

    // Add month totals
    const totalRow = worksheet.addRow([
      "",
      "",
      "TOTAL DO MÊS",
      `Receitas: ${monthIncome.toFixed(2)} | Despesas: ${monthExpense.toFixed(
        2
      )} | Saldo: ${(monthIncome - monthExpense).toFixed(2)}`,
      monthIncome - monthExpense,
    ]);
    totalRow.eachCell((cell) => {
      cell.style = {
        font: { bold: true },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        },
      };
    });
    const totalAmountCell = totalRow.getCell(5);
    totalAmountCell.numFmt = "#,##0.00";
    totalAmountCell.font = { bold: true };
    currentRow++;

    // Add empty row between months
    worksheet.addRow([]);
    currentRow++;
  }

  // Generate filename
  const filename = `FinControl_${accountName.replace(
    /\s+/g,
    "_"
  )}_${startDate}_${endDate}.xlsx`;

  // Create blob and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, filename);
}

/**
 * Calculate summary statistics for export
 */
export function calculateExportSummary(transactions: ExportTransaction[]): {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
} {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach((t) => {
    const categoryName = t.category?.name || "Sem categoria";
    const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };

    categoryMap.set(categoryName, {
      amount: current.amount + Number(t.amount),
      count: current.count + 1,
    });
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense,
    transactionCount: transactions.length,
    categoryBreakdown,
  };
}
