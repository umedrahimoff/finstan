import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies"

const STORAGE_KEY = "finstan-settings"
const DEFAULT_CURRENCY: CurrencyCode = "UZS"
const VALID_CODES = new Set<string>(CURRENCIES.map((c) => c.value))

function isValidCurrency(c: string | undefined): c is CurrencyCode {
  return !!c && VALID_CODES.has(c)
}

interface SettingsState {
  systemCurrency: CurrencyCode
  setSystemCurrency: (currency: CurrencyCode) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      systemCurrency: DEFAULT_CURRENCY,
      setSystemCurrency: (currency) => set({ systemCurrency: currency }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ systemCurrency: s.systemCurrency }),
    }
  )
)

export function getSystemCurrency(): CurrencyCode {
  const c = useSettingsStore.getState().systemCurrency
  return isValidCurrency(c) ? c : DEFAULT_CURRENCY
}
