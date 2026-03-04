import { create } from "zustand"
import type { Transaction } from "@/types"
import { mockTransactions } from "@/data/mock"

interface TransactionsState {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, "id">) => void
  updateTransaction: (id: string, tx: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  duplicateTransaction: (id: string) => void
}

function generateId() {
  return "tx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: mockTransactions,
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [
        { ...tx, id: generateId() },
        ...state.transactions,
      ],
    })),
  updateTransaction: (id, tx) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...tx } : t
      ),
    })),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
  duplicateTransaction: (id) =>
    set((state) => {
      const original = state.transactions.find((t) => t.id === id)
      if (!original) return state
      const { id: _, ...rest } = original
      return {
        transactions: [{ ...rest, id: generateId() }, ...state.transactions],
      }
    }),
}))
