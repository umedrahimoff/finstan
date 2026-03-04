import { create } from "zustand"
import type { Account } from "@/types"
import { mockAccounts } from "@/data/mock"

interface AccountsState {
  accounts: Account[]
  addAccount: (acc: Omit<Account, "id" | "balance">) => Account
  updateAccount: (id: string, acc: Partial<Omit<Account, "id">>) => void
  deleteAccount: (id: string) => void
}

function generateId() {
  return "acc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: mockAccounts,
  addAccount: (acc) => {
    const id = generateId()
    const newAcc = { ...acc, id, balance: 0 }
    set((state) => ({ accounts: [...state.accounts, newAcc] }))
    return newAcc
  },
  updateAccount: (id, acc) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...acc } : a
      ),
    })),
  deleteAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    })),
}))
