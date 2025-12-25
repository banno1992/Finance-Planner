const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  INR: "₹",
  JPY: "¥"
};

export function formatCurrency(value: number, currency: string = "USD"): string {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${value.toLocaleString()}`;
}

export function getCurrencySymbol(currency: string = "USD"): string {
  return CURRENCY_SYMBOLS[currency] || "$";
}
