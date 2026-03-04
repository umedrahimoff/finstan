import { create } from "zustand"
import type { Counterparty } from "@/types"
import { mockCounterparties } from "@/data/mock"

function generateId(prefix: string) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

interface CounterpartiesState {
  counterparties: Counterparty[]
  addCounterparty: (cp: Omit<Counterparty, "id">) => Counterparty
  updateCounterparty: (id: string, cp: Partial<Omit<Counterparty, "id">>) => void
  deleteCounterparty: (id: string) => void
}

export const useCounterpartiesStore = create<CounterpartiesState>((set) => ({
  counterparties: mockCounterparties,
  addCounterparty: (cp) => {
    const id = generateId("cp")
    const newCp = { ...cp, id }
    set((state) => ({ counterparties: [...state.counterparties, newCp] }))
    return newCp
  },
  updateCounterparty: (id, cp) =>
    set((state) => ({
      counterparties: state.counterparties.map((c) =>
        c.id === id ? { ...c, ...cp } : c
      ),
    })),
  deleteCounterparty: (id) =>
    set((state) => ({
      counterparties: state.counterparties.filter((c) => c.id !== id),
    })),
}))
