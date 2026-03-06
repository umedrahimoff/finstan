/** Разделитель тысяч — пробел для читаемости (5 000 002) */
function formatWithSpaces(n: number): string {
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")
}

export function formatUzs(amount: number): string {
  return formatWithSpaces(amount) + " UZS"
}

export function formatAmount(amount: number, currency: string = "UZS"): string {
  return formatWithSpaces(amount) + " " + currency
}

/** Форматирование для поля ввода (с пробелами) */
export function formatAmountForInput(amount: number): string {
  if (!amount || isNaN(amount)) return ""
  return formatWithSpaces(amount)
}

/** Парсинг из строки (убирает пробелы и прочие не-цифры) */
export function parseAmountFromInput(s: string): number {
  const digits = String(s).replace(/\D/g, "")
  const num = parseInt(digits, 10)
  return isNaN(num) ? 0 : num
}

/** Компактный формат для заголовков (5M, 1.2K) */
export function formatCompact(amount: number, currency: string = "UZS"): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "−" : ""
  let val: string
  if (abs >= 1_000_000) val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  else if (abs >= 1_000) val = (abs / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  else val = formatWithSpaces(abs)
  return sign + val + " " + currency
}
