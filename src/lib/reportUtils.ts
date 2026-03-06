import type { Transaction } from "@/types"

const MONTH_NAMES: Record<number, string> = {
  1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель", 5: "Май", 6: "Июнь",
  7: "Июль", 8: "Август", 9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь",
}

export function getMonthName(month: number) {
  return MONTH_NAMES[month] ?? ""
}

export interface AvailablePeriods {
  years: number[]
  monthsByYear: Record<number, number[]>
}

/** Годы и месяцы, в которых есть операции */
export function getAvailablePeriods(transactions: Transaction[]): AvailablePeriods {
  const byYear = new Map<number, Set<number>>()
  for (const tx of transactions) {
    const [y, m] = tx.date.split("-").map(Number)
    if (!byYear.has(y)) byYear.set(y, new Set())
    byYear.get(y)!.add(m)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a)
  const monthsByYear: Record<number, number[]> = {}
  for (const y of years) {
    monthsByYear[y] = Array.from(byYear.get(y)!).sort((a, b) => a - b)
  }
  return { years, monthsByYear }
}

/** Опции месяцев для селекта (только месяцы с данными за год) */
export function getMonthOptionsForYear(
  monthsByYear: Record<number, number[]>,
  year: number
): { value: string; label: string }[] {
  const months = monthsByYear[year] ?? []
  return months.map((m) => ({ value: String(m), label: MONTH_NAMES[m] ?? "" }))
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  return transactions.filter((tx) => {
    const [txYear, txMonth] = tx.date.split("-").map(Number)
    return txYear === year && txMonth === month
  })
}

export function sumIncome(txs: Transaction[]): number {
  return txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)
}

export function sumExpense(txs: Transaction[]): number {
  return txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)
}

export interface CategorySummary {
  categoryId: string
  categoryName: string
  type: "income" | "expense"
  amount: number
}

export function aggregateByCategory(
  txs: Transaction[],
  getCategoryName: (id: string) => string
): CategorySummary[] {
  const map = new Map<string, { type: "income" | "expense"; amount: number }>()
  for (const tx of txs) {
    if (tx.type === "transfer" || !tx.categoryId) continue
    const key = `${tx.categoryId}:${tx.type}`
    const cur = map.get(key) ?? { type: tx.type as "income" | "expense", amount: 0 }
    cur.amount += tx.amount
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([key, { type, amount }]) => {
    const categoryId = key.split(":")[0]
    return {
      categoryId,
      categoryName: getCategoryName(categoryId),
      type,
      amount,
    }
  })
}

export interface CounterpartySummary {
  counterpartyId: string
  counterpartyName: string
  income: number
  expense: number
}

export interface MonthlySummary {
  month: number
  year: number
  label: string
  income: number
  expense: number
  profit: number
}

export function getMonthlySummaries(
  transactions: Transaction[],
  year: number,
  getMonthName: (m: number) => string
): MonthlySummary[] {
  const result: MonthlySummary[] = []
  for (let m = 1; m <= 12; m++) {
    const txs = filterTransactionsByPeriod(transactions, year, m)
    const income = sumIncome(txs)
    const expense = sumExpense(txs)
    result.push({
      month: m,
      year,
      label: getMonthName(m),
      income,
      expense,
      profit: income - expense,
    })
  }
  return result
}

export function aggregateByCounterparty(
  txs: Transaction[],
  getCounterpartyName: (id: string) => string
): CounterpartySummary[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const tx of txs) {
    if (tx.type === "transfer" || !tx.counterpartyId) continue
    const key = tx.counterpartyId
    const cur = map.get(key) ?? { income: 0, expense: 0 }
    if (tx.type === "income") cur.income += tx.amount
    else cur.expense += tx.amount
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([counterpartyId, { income, expense }]) => ({
    counterpartyId,
    counterpartyName: getCounterpartyName(counterpartyId),
    income,
    expense,
  }))
}
