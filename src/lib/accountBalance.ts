import type { Transaction } from "@/types"

export function calculateAccountBalance(
  accountId: string,
  transactions: Transaction[]
): number {
  return transactions.reduce((sum, tx) => {
    if (tx.type === "income" && tx.accountId === accountId) return sum + tx.amount
    if (tx.type === "expense" && tx.accountId === accountId) return sum - tx.amount
    if (tx.type === "transfer") {
      if (tx.accountId === accountId) return sum - tx.amount
      if (tx.toAccountId === accountId) return sum + tx.amount
    }
    return sum
  }, 0)
}
