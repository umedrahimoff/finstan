import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Company {
  id: string
  name: string
  archived?: boolean
}

const STORAGE_KEY = "finstan-companies"
const DEFAULT_COMPANY_ID = "default"
const DEFAULT_COMPANY_NAME = "Моя компания"

interface CompanyState {
  companies: Company[]
  currentCompanyId: string | null
  addCompany: (name: string) => Company
  updateCompany: (id: string, data: { name?: string }) => void
  archiveCompany: (id: string) => void
  unarchiveCompany: (id: string) => void
  deleteCompany: (id: string) => void
  setCurrentCompany: (id: string) => void
  ensureDefaultCompany: () => string
  ensureCompany: (id: string, name: string) => void
}

function generateId() {
  return "co-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [{ id: DEFAULT_COMPANY_ID, name: DEFAULT_COMPANY_NAME }],
      currentCompanyId: DEFAULT_COMPANY_ID,

      addCompany: (name) => {
        const id = generateId()
        const company = { id, name }
        set((state) => ({
          companies: [...state.companies, company],
          currentCompanyId: id,
        }))
        return company
      },

      updateCompany: (id, data) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }))
      },

      archiveCompany: (id) => {
        const state = get()
        const nextActive = state.companies.find(
          (c) => c.id !== id && !c.archived
        )
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, archived: true } : c
          ),
          currentCompanyId:
            state.currentCompanyId === id
              ? nextActive?.id ?? state.companies[0]?.id
              : state.currentCompanyId,
        }))
      },

      unarchiveCompany: (id) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, archived: false } : c
          ),
        }))
      },

      deleteCompany: (id) => {
        const state = get()
        const nextActive = state.companies.find(
          (c) => c.id !== id && !c.archived
        )
        if (!nextActive && state.companies.length <= 1) return
        set((s) => ({
          companies: s.companies.filter((c) => c.id !== id),
          currentCompanyId:
            state.currentCompanyId === id
              ? nextActive?.id ?? s.companies[0]?.id
              : state.currentCompanyId,
        }))
      },

      setCurrentCompany: (id) => {
        set({ currentCompanyId: id })
      },

      ensureDefaultCompany: () => {
        const state = get()
        const active = state.companies.filter((c) => !c.archived)
        if (active.length === 0) {
          const company = { id: DEFAULT_COMPANY_ID, name: DEFAULT_COMPANY_NAME }
          set({
            companies: [company],
            currentCompanyId: DEFAULT_COMPANY_ID,
          })
          return DEFAULT_COMPANY_ID
        }
        return state.currentCompanyId ?? active[0].id
      },

      ensureCompany: (id, name) => {
        const state = get()
        if (state.companies.some((c) => c.id === id)) return
        set((s) => ({
          companies: [...s.companies, { id, name }],
        }))
      },
    }),
    { name: STORAGE_KEY }
  )
)
