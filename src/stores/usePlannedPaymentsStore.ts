import { create } from "zustand"
import type { PlannedPayment } from "@/types"
import { mockPlannedPayments } from "@/data/mockPlannedPayments"

function generateId() {
  return "pp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

interface PlannedPaymentsState {
  plannedPayments: PlannedPayment[]
  addPlannedPayment: (pp: Omit<PlannedPayment, "id">) => void
  updatePlannedPayment: (id: string, pp: Partial<Omit<PlannedPayment, "id">>) => void
  deletePlannedPayment: (id: string) => void
}

export const usePlannedPaymentsStore = create<PlannedPaymentsState>((set) => ({
  plannedPayments: mockPlannedPayments,
  addPlannedPayment: (pp) =>
    set((state) => ({
      plannedPayments: [{ ...pp, id: generateId() }, ...state.plannedPayments],
    })),
  updatePlannedPayment: (id, pp) =>
    set((state) => ({
      plannedPayments: state.plannedPayments.map((p) =>
        p.id === id ? { ...p, ...pp } : p
      ),
    })),
  deletePlannedPayment: (id) =>
    set((state) => ({
      plannedPayments: state.plannedPayments.filter((p) => p.id !== id),
    })),
}))
