export function formatMoney(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`
  }
}

export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.-]/g, "").trim()
  if (cleaned === "" || cleaned === "-" || cleaned === ".") {
    return null
  }
  const value = Number(cleaned)
  if (!Number.isFinite(value)) {
    return null
  }
  return value
}

export function percentOfAsk(offer: number, ask: number): number | null {
  if (ask <= 0) {
    return null
  }
  return (offer / ask) * 100
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function currencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).formatToParts(0)
    return parts.find((part) => part.type === "currency")?.value ?? currency
  } catch {
    return currency
  }
}
