import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a numeric P/L value as a display string, e.g. 250 → "+$250", -90 → "-$90", null → "Pending". */
export function formatPnl(pnl: number | null): string {
  if (pnl === null) return "Pending";
  if (pnl === 0) return "$0";
  const abs = Math.abs(pnl).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return pnl > 0 ? `+$${abs}` : `-$${abs}`;
}

/** Format a numeric R-multiple as a display string, e.g. 1.8 → "+1.8R", -0.7 → "-0.7R", null → "Pending". */
export function formatR(r: number | null): string {
  if (r === null) return "Pending";
  if (r === 0) return "0.0R";
  const sign = r > 0 ? "+" : "";
  return `${sign}${r.toFixed(1)}R`;
}

/** Format a numeric price with two decimal places and thousands separators, e.g. 21450.25 → "21,450.25". */
export function formatPrice(price: number): string {
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a whole-number dollar amount with a leading $ sign, e.g. 101 → "$101". */
export function formatCurrency(amount: number): string {
  return "$" + Math.abs(Math.round(amount)).toLocaleString("en-US");
}
