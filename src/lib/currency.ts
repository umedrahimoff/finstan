const UZS_LOCALE = "uz-UZ"

export function formatUzs(amount: number): string {
  return new Intl.NumberFormat(UZS_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " UZS"
}

export function formatAmount(amount: number, currency: string = "UZS"): string {
  return new Intl.NumberFormat(UZS_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " " + currency
}

/** Компактный формат для заголовков (5M, 1.2K) */
export function formatCompact(amount: number, currency: string = "UZS"): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "−" : ""
  let val: string
  if (abs >= 1_000_000) val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  else if (abs >= 1_000) val = (abs / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  else val = abs.toFixed(0)
  return sign + val + " " + currency
}
