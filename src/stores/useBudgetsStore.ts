import { create } from "zustand"
import type { Budget } from "@/types"
import { mockBudgets } from "@/data/mockBudgets"

function generateId() {
  return "b-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

interface BudgetsState {
  budgets: Budget[]
  addBudget: (b: Omit<Budget, "id">) => Budget
  updateBudget: (id: string, b: Partial<Omit<Budget, "id">>) => void
  deleteBudget: (id: string) => void
}

export const useBudgetsStore = create<BudgetsState>((set) => ({
  budgets: mockBudgets,
  addBudget: (b) => {
    const id = generateId()
    const newBudget = { ...b, id }
    set((state) => ({ budgets: [...state.budgets, newBudget] }))
    return newBudget
  },
  updateBudget: (id, b) =>
    set((state) => ({
      budgets: state.budgets.map((x) => (x.id === id ? { ...x, ...b } : x)),
    })),
  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((x) => x.id !== id),
    })),
}))
