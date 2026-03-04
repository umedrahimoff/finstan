import type { Account, Budget, Category, Counterparty, PlannedPayment, Project, Transaction } from "@/types"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"

type TransactionsState = {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, "id">) => void
  updateTransaction: (id: string, tx: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  duplicateTransaction: (id: string) => void
}

export function useTransactionsStore(): TransactionsState
export function useTransactionsStore<T>(selector: (s: TransactionsState) => T): T
export function useTransactionsStore<T>(selector?: (s: TransactionsState) => T): T | TransactionsState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const transactions = useCompanyDataStore((s) => s.getTransactions(companyId))
  const addTransaction = useCompanyDataStore((s) => s.addTransaction)
  const updateTransaction = useCompanyDataStore((s) => s.updateTransaction)
  const deleteTransaction = useCompanyDataStore((s) => s.deleteTransaction)
  const duplicateTransaction = useCompanyDataStore((s) => s.duplicateTransaction)
  const state: TransactionsState = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  }
  if (selector) return selector(state) as T
  return state
}

type AccountsState = {
  accounts: Account[]
  addAccount: (acc: Omit<Account, "id" | "balance">) => Account
  updateAccount: (id: string, acc: Partial<Omit<Account, "id">>) => void
  deleteAccount: (id: string) => void
}

export function useAccountsStore(): AccountsState
export function useAccountsStore<T>(selector: (s: AccountsState) => T): T
export function useAccountsStore<T>(selector?: (s: AccountsState) => T): T | AccountsState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const accounts = useCompanyDataStore((s) => s.getAccounts(companyId))
  const addAccount = useCompanyDataStore((s) => s.addAccount)
  const updateAccount = useCompanyDataStore((s) => s.updateAccount)
  const deleteAccount = useCompanyDataStore((s) => s.deleteAccount)
  const state = { accounts, addAccount, updateAccount, deleteAccount }
  if (selector) return selector(state) as T
  return state
}

type CategoriesState = {
  categories: Category[]
  addCategory: (cat: Omit<Category, "id">) => Category
  updateCategory: (id: string, cat: Partial<Omit<Category, "id">>) => void
  deleteCategory: (id: string) => void
}

export function useCategoriesStore(): CategoriesState
export function useCategoriesStore<T>(selector: (s: CategoriesState) => T): T
export function useCategoriesStore<T>(selector?: (s: CategoriesState) => T): T | CategoriesState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const categories = useCompanyDataStore((s) => s.getCategories(companyId))
  const addCategory = useCompanyDataStore((s) => s.addCategory)
  const updateCategory = useCompanyDataStore((s) => s.updateCategory)
  const deleteCategory = useCompanyDataStore((s) => s.deleteCategory)
  const state = { categories, addCategory, updateCategory, deleteCategory }
  if (selector) return selector(state) as T
  return state
}

type CounterpartiesState = {
  counterparties: Counterparty[]
  addCounterparty: (cp: Omit<Counterparty, "id">) => Counterparty
  updateCounterparty: (id: string, cp: Partial<Omit<Counterparty, "id">>) => void
  deleteCounterparty: (id: string) => void
}

export function useCounterpartiesStore(): CounterpartiesState
export function useCounterpartiesStore<T>(selector: (s: CounterpartiesState) => T): T
export function useCounterpartiesStore<T>(selector?: (s: CounterpartiesState) => T): T | CounterpartiesState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const counterparties = useCompanyDataStore((s) => s.getCounterparties(companyId))
  const addCounterparty = useCompanyDataStore((s) => s.addCounterparty)
  const updateCounterparty = useCompanyDataStore((s) => s.updateCounterparty)
  const deleteCounterparty = useCompanyDataStore((s) => s.deleteCounterparty)
  const state = { counterparties, addCounterparty, updateCounterparty, deleteCounterparty }
  if (selector) return selector(state) as T
  return state
}

type BudgetsState = {
  budgets: Budget[]
  addBudget: (b: Omit<Budget, "id">) => Budget
  updateBudget: (id: string, b: Partial<Omit<Budget, "id">>) => void
  deleteBudget: (id: string) => void
}

export function useBudgetsStore(): BudgetsState
export function useBudgetsStore<T>(selector: (s: BudgetsState) => T): T
export function useBudgetsStore<T>(selector?: (s: BudgetsState) => T): T | BudgetsState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const budgets = useCompanyDataStore((s) => s.getBudgets(companyId))
  const addBudget = useCompanyDataStore((s) => s.addBudget)
  const updateBudget = useCompanyDataStore((s) => s.updateBudget)
  const deleteBudget = useCompanyDataStore((s) => s.deleteBudget)
  const state = { budgets, addBudget, updateBudget, deleteBudget }
  if (selector) return selector(state) as T
  return state
}

type PlannedPaymentsState = {
  plannedPayments: PlannedPayment[]
  addPlannedPayment: (pp: Omit<PlannedPayment, "id">) => void
  updatePlannedPayment: (id: string, pp: Partial<Omit<PlannedPayment, "id">>) => void
  deletePlannedPayment: (id: string) => void
}

export function usePlannedPaymentsStore(): PlannedPaymentsState
export function usePlannedPaymentsStore<T>(selector: (s: PlannedPaymentsState) => T): T
export function usePlannedPaymentsStore<T>(selector?: (s: PlannedPaymentsState) => T): T | PlannedPaymentsState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const plannedPayments = useCompanyDataStore((s) => s.getPlannedPayments(companyId))
  const addPlannedPayment = useCompanyDataStore((s) => s.addPlannedPayment)
  const updatePlannedPayment = useCompanyDataStore((s) => s.updatePlannedPayment)
  const deletePlannedPayment = useCompanyDataStore((s) => s.deletePlannedPayment)
  const state = { plannedPayments, addPlannedPayment, updatePlannedPayment, deletePlannedPayment }
  if (selector) return selector(state) as T
  return state
}

type ProjectsState = {
  projects: Project[]
  addProject: (p: Omit<Project, "id">) => Project
  updateProject: (id: string, p: Partial<Omit<Project, "id">>) => void
  deleteProject: (id: string) => void
}

export function useProjectsStore(): ProjectsState
export function useProjectsStore<T>(selector: (s: ProjectsState) => T): T
export function useProjectsStore<T>(selector?: (s: ProjectsState) => T): T | ProjectsState {
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const projects = useCompanyDataStore((s) => s.getProjects(companyId))
  const addProject = useCompanyDataStore((s) => s.addProject)
  const updateProject = useCompanyDataStore((s) => s.updateProject)
  const deleteProject = useCompanyDataStore((s) => s.deleteProject)
  const state = { projects, addProject, updateProject, deleteProject }
  if (selector) return selector(state) as T
  return state
}
