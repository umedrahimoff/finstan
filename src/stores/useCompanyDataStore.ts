import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Transaction,
  Account,
  Category,
  Counterparty,
  Budget,
  PlannedPayment,
  Project,
} from "@/types"
import { defaultCompanyData, getEmptyCompanyData, getInitialCompanyData } from "@/data/defaultCompanyData"
import { useCompanyStore } from "@/stores/useCompanyStore"

export type CompanyData = {
  accounts: Account[]
  categories: Category[]
  counterparties: Counterparty[]
  transactions: Transaction[]
  budgets: Budget[]
  plannedPayments: PlannedPayment[]
  projects: Project[]
}

type ByCompany = Record<string, CompanyData>

function generateId(prefix: string) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

function getCompanyId() {
  return useCompanyStore.getState().currentCompanyId ?? "default"
}

function getOrInitCompany(state: { byCompany: ByCompany }, companyId: string): CompanyData {
  if (state.byCompany[companyId]) return state.byCompany[companyId]
  return getInitialCompanyData(companyId)
}

interface CompanyDataState {
  byCompany: ByCompany
  // Getters (used via selectors with companyId)
  getAccounts: (companyId: string) => Account[]
  getCategories: (companyId: string) => Category[]
  getCounterparties: (companyId: string) => Counterparty[]
  getTransactions: (companyId: string) => Transaction[]
  getBudgets: (companyId: string) => Budget[]
  getPlannedPayments: (companyId: string) => PlannedPayment[]
  getProjects: (companyId: string) => Project[]
  // Actions
  addAccount: (acc: Omit<Account, "id" | "balance">) => Account
  updateAccount: (id: string, acc: Partial<Omit<Account, "id">>) => void
  setPrimaryAccount: (id: string) => void
  deleteAccount: (id: string) => void
  addCategory: (cat: Omit<Category, "id">) => Category
  updateCategory: (id: string, cat: Partial<Omit<Category, "id">>) => void
  deleteCategory: (id: string) => void
  addCounterparty: (cp: Omit<Counterparty, "id">) => Counterparty
  updateCounterparty: (id: string, cp: Partial<Omit<Counterparty, "id">>) => void
  deleteCounterparty: (id: string) => void
  addTransaction: (tx: Omit<Transaction, "id">) => void
  addTransactionsBatch: (txs: Omit<Transaction, "id">[]) => void
  updateTransaction: (id: string, tx: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  duplicateTransaction: (id: string) => void
  addBudget: (b: Omit<Budget, "id">) => Budget
  updateBudget: (id: string, b: Partial<Omit<Budget, "id">>) => void
  deleteBudget: (id: string) => void
  addPlannedPayment: (pp: Omit<PlannedPayment, "id">) => void
  updatePlannedPayment: (id: string, pp: Partial<Omit<PlannedPayment, "id">>) => void
  deletePlannedPayment: (id: string) => void
  addProject: (p: Omit<Project, "id">) => Project
  updateProject: (id: string, p: Partial<Omit<Project, "id">>) => void
  deleteProject: (id: string) => void
  initCompanyIfNeeded: (companyId: string) => void
  removeCompanyData: (companyId: string) => void
  resetCompanyData: (companyId: string) => void
  resetCompanyDataBatch: (companyIds: string[]) => void
}

export const useCompanyDataStore = create<CompanyDataState>()(
  persist(
    (set, get) => ({
      byCompany: {
        default: { ...defaultCompanyData },
      },

      getAccounts: (companyId) =>
        get().byCompany[companyId]?.accounts ?? getInitialCompanyData(companyId).accounts,
      getCategories: (companyId) =>
        get().byCompany[companyId]?.categories ?? getInitialCompanyData(companyId).categories,
      getCounterparties: (companyId) =>
        get().byCompany[companyId]?.counterparties ?? getInitialCompanyData(companyId).counterparties,
      getTransactions: (companyId) =>
        get().byCompany[companyId]?.transactions ?? getInitialCompanyData(companyId).transactions,
      getBudgets: (companyId) =>
        get().byCompany[companyId]?.budgets ?? getInitialCompanyData(companyId).budgets,
      getPlannedPayments: (companyId) =>
        get().byCompany[companyId]?.plannedPayments ?? getInitialCompanyData(companyId).plannedPayments,
      getProjects: (companyId) =>
        get().byCompany[companyId]?.projects ?? getInitialCompanyData(companyId).projects,

      initCompanyIfNeeded: (companyId) => {
        const state = get()
        if (!state.byCompany[companyId]) {
          set((s) => ({
            byCompany: {
              ...s.byCompany,
              [companyId]: getInitialCompanyData(companyId),
            },
          }))
        }
      },

      removeCompanyData: (companyId) => {
        set((state) => {
          const { [companyId]: _, ...rest } = state.byCompany
          return { byCompany: rest }
        })
      },

      resetCompanyData: (companyId) => {
        set((state) => ({
          byCompany: {
            ...state.byCompany,
            [companyId]: getEmptyCompanyData(),
          },
        }))
      },

      resetCompanyDataBatch: (companyIds) => {
        set((state) => {
          const next = { ...state.byCompany }
          for (const id of companyIds) {
            next[id] = getEmptyCompanyData()
          }
          return { byCompany: next }
        })
      },

      addAccount: (acc) => {
        const companyId = getCompanyId()
        const id = generateId("acc")
        const data = get().byCompany[companyId] ?? getInitialCompanyData(companyId)
        const isFirst = data.accounts.length === 0
        const newAcc = { ...acc, id, balance: 0, isPrimary: isFirst }
        set((state) => {
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                accounts: [...data.accounts, newAcc],
              },
            },
          }
        })
        return newAcc
      },
      updateAccount: (id, acc) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                accounts: data.accounts.map((a) =>
                  a.id === id ? { ...a, ...acc } : a
                ),
              },
            },
          }
        }),
      setPrimaryAccount: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                accounts: data.accounts.map((a) => ({
                  ...a,
                  isPrimary: a.id === id,
                })),
              },
            },
          }
        }),
      deleteAccount: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                accounts: data.accounts.filter((a) => a.id !== id),
              },
            },
          }
        }),

      addCategory: (cat) => {
        const companyId = getCompanyId()
        const id = generateId("cat")
        const newCat = { ...cat, id }
        set((state) => {
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                categories: [...data.categories, newCat],
              },
            },
          }
        })
        return newCat
      },
      updateCategory: (id, cat) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                categories: data.categories.map((c) =>
                  c.id === id ? { ...c, ...cat } : c
                ),
              },
            },
          }
        }),
      deleteCategory: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                categories: data.categories.filter((c) => c.id !== id),
              },
            },
          }
        }),

      addCounterparty: (cp) => {
        const companyId = getCompanyId()
        const id = generateId("cp")
        const newCp = { ...cp, id }
        set((state) => {
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                counterparties: [...data.counterparties, newCp],
              },
            },
          }
        })
        return newCp
      },
      updateCounterparty: (id, cp) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                counterparties: data.counterparties.map((c) =>
                  c.id === id ? { ...c, ...cp } : c
                ),
              },
            },
          }
        }),
      deleteCounterparty: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                counterparties: data.counterparties.filter((c) => c.id !== id),
              },
            },
          }
        }),

      addTransaction: (tx) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          const id = generateId("tx")
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                transactions: [{ ...tx, id }, ...data.transactions],
              },
            },
          }
        }),
      addTransactionsBatch: (txs) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          const newTxs = txs.map((tx) => ({ ...tx, id: generateId("tx") }))
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                transactions: [...newTxs, ...data.transactions],
              },
            },
          }
        }),
      updateTransaction: (id, tx) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                transactions: data.transactions.map((t) =>
                  t.id === id ? { ...t, ...tx } : t
                ),
              },
            },
          }
        }),
      deleteTransaction: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                transactions: data.transactions.filter((t) => t.id !== id),
              },
            },
          }
        }),
      duplicateTransaction: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          const original = data.transactions.find((t) => t.id === id)
          if (!original) return state
          const { id: _, ...rest } = original
          const newId = generateId("tx")
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                transactions: [{ ...rest, id: newId }, ...data.transactions],
              },
            },
          }
        }),

      addBudget: (b) => {
        const companyId = getCompanyId()
        const id = generateId("b")
        const newBudget = { ...b, id }
        set((state) => {
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                budgets: [...data.budgets, newBudget],
              },
            },
          }
        })
        return newBudget
      },
      updateBudget: (id, b) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                budgets: data.budgets.map((x) => (x.id === id ? { ...x, ...b } : x)),
              },
            },
          }
        }),
      deleteBudget: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                budgets: data.budgets.filter((x) => x.id !== id),
              },
            },
          }
        }),

      addPlannedPayment: (pp) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          const id = generateId("pp")
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                plannedPayments: [{ ...pp, id }, ...data.plannedPayments],
              },
            },
          }
        }),
      updatePlannedPayment: (id, pp) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                plannedPayments: data.plannedPayments.map((p) =>
                  p.id === id ? { ...p, ...pp } : p
                ),
              },
            },
          }
        }),
      deletePlannedPayment: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                plannedPayments: data.plannedPayments.filter((p) => p.id !== id),
              },
            },
          }
        }),

      addProject: (p) => {
        const companyId = getCompanyId()
        const id = generateId("prj")
        const newProject = { ...p, id }
        set((state) => {
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                projects: [...data.projects, newProject],
              },
            },
          }
        })
        return newProject
      },
      updateProject: (id, p) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                projects: data.projects.map((x) => (x.id === id ? { ...x, ...p } : x)),
              },
            },
          }
        }),
      deleteProject: (id) =>
        set((state) => {
          const companyId = getCompanyId()
          const data = getOrInitCompany(state, companyId)
          return {
            byCompany: {
              ...state.byCompany,
              [companyId]: {
                ...data,
                projects: data.projects.filter((x) => x.id !== id),
              },
            },
          }
        }),
    }),
    {
      name: "finstan-company-data",
      partialize: (state) => ({ byCompany: state.byCompany }),
      merge: (persisted, current) =>
        persisted && typeof persisted === "object" && "byCompany" in persisted
          ? { ...current, byCompany: (persisted as { byCompany: ByCompany }).byCompany }
          : { ...current, ...(persisted as Partial<CompanyDataState>) },
    }
  )
)
