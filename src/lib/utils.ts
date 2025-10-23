import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 *
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': isActive })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value to Swedish Krona (SEK)
 *
 * @example
 * formatCurrency(1234.56) // "1 234,56 kr"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date to Swedish format (YYYY-MM-DD)
 *
 * @example
 * formatDate(new Date()) // "2024-10-18"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sv-SE").format(dateObj);
}

/**
 * Format date to relative time (ex: "há 2 dias")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 86400000)) // "há 1 dia"
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600)
    return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400)
    return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800)
    return `há ${Math.floor(diffInSeconds / 86400)} dias`;

  return formatDate(dateObj);
}

/**
 * Get month name from month number (1-12)
 *
 * @example
 * getMonthName(10) // "Outubro"
 */
export function getMonthName(month: number): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[month - 1] || "";
}

/**
 * Get short month name (3 letters)
 *
 * @example
 * getShortMonthName(10) // "Out"
 */
export function getShortMonthName(month: number): string {
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return months[month - 1] || "";
}

/**
 * Calculate percentage
 *
 * @example
 * calculatePercentage(25, 100) // 25
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Truncate text with ellipsis
 *
 * @example
 * truncateText('Lorem ipsum dolor sit amet', 10) // "Lorem ipsu..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Debounce function
 * Delays execution until after specified wait time
 *
 * @example
 * const debouncedSearch = debounce((query) => search(query), 500)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate random ID (UUID v4 simplified)
 * NOTE: Use crypto.randomUUID() or UUID library for production
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
