import type { Transaction } from "@/types"
import {
  filterTransactionsByPeriod,
  sumIncome,
  sumExpense,
} from "./reportUtils"
import { calculateAccountBalance } from "./accountBalance"

export interface StartupMetrics {
  cashflow: number
  pl: number
  mrr: number
  arr: number
  burnRate: number
  runway: number | null
  totalBalance: number
}

export function calculateStartupMetrics(
  transactions: Transaction[],
  accountIds: string[],
  recurringCategoryIds: string[],
  year: number,
  month: number
): StartupMetrics {
  const txs = filterTransactionsByPeriod(transactions, year, month)
  const income = sumIncome(txs)
  const expense = sumExpense(txs)
  const cashflow = income - expense
  const pl = cashflow

  const mrr = txs
    .filter(
      (t) =>
        t.type === "income" &&
        t.categoryId &&
        recurringCategoryIds.includes(t.categoryId)
    )
    .reduce((s, t) => s + t.amount, 0)

  const arr = mrr * 12
  const burnRate = expense

  const totalBalance = accountIds.reduce(
    (sum, accId) =>
      sum + calculateAccountBalance(accId, transactions),
    0
  )

  const runway =
    burnRate > 0 ? Math.floor(totalBalance / burnRate) : null

  return {
    cashflow,
    pl,
    mrr,
    arr,
    burnRate,
    runway,
    totalBalance,
  }
}
