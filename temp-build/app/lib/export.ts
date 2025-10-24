import type { TTransaction, TCategory, TAccount } from "./types";

/**
 * Transaction with relations for export
 */
interface ExportTransaction extends TTransaction {
  category: TCategory | null;
  account: TAccount;
}

/**
 * Export transactions to CSV format
 * Downloads file automatically to user's browser
 *
 * @param transactions - Array of transactions with relations
 * @param startDate - Start date of export period
 * @param endDate - End date of export period
 *
 * @example
 * exportToCSV(transactions, '2024-01-01', '2024-01-31')
 */
export function exportToCSV(
  transactions: ExportTransaction[],
  startDate: string,
  endDate: string
): void {
  // CSV Headers
  const headers = [
    "Data",
    "Tipo",
    "Categoria",
    "Conta",
    "Valor (SEK)",
    "Descrição",
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map((transaction) => {
    return [
      formatDateForCSV(transaction.transaction_date),
      transaction.type === "income" ? "Entrada" : "Saída",
      transaction.category?.name || "Sem categoria",
      transaction.account.name,
      formatNumberForCSV(transaction.amount),
      escapeCSVField(transaction.description || ""),
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob with BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Generate filename
  const filename = `fincontrol_${startDate}_${endDate}.csv`;

  // Trigger download
  downloadBlob(blob, filename);
}

/**
 * Format date for CSV (YYYY-MM-DD)
 */
function formatDateForCSV(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

/**
 * Format number for CSV (use comma as decimal separator for Excel compatibility)
 */
function formatNumberForCSV(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCSVField(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
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
