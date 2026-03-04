import { create } from "zustand"

interface AppState {
  dateRange: { from: Date; to: Date } | null
  setDateRange: (range: { from: Date; to: Date } | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  dateRange: null,
  setDateRange: (dateRange) => set({ dateRange }),
}))
