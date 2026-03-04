import type {
  Transaction,
  Account,
  Category,
  Counterparty,
  Budget,
  PlannedPayment,
  Project,
} from "@/types"
import {
  mockAccounts,
  mockCategories,
  mockCounterparties,
  mockTransactions,
} from "@/data/mock"
import { mockBudgets } from "@/data/mockBudgets"
import { mockPlannedPayments } from "@/data/mockPlannedPayments"
import { mockProjects } from "@/data/mockProjects"

const DEFAULT_COMPANY_ID = "default"

export const defaultCompanyData = {
  accounts: mockAccounts,
  categories: mockCategories,
  counterparties: mockCounterparties,
  transactions: mockTransactions,
  budgets: mockBudgets,
  plannedPayments: mockPlannedPayments,
  projects: mockProjects,
} as const

export function getInitialCompanyData(companyId: string): CompanyData {
  if (companyId === DEFAULT_COMPANY_ID) {
    return {
      accounts: [...defaultCompanyData.accounts],
      categories: [...defaultCompanyData.categories],
      counterparties: [...defaultCompanyData.counterparties],
      transactions: [...defaultCompanyData.transactions],
      budgets: [...defaultCompanyData.budgets],
      plannedPayments: [...defaultCompanyData.plannedPayments],
      projects: [...defaultCompanyData.projects],
    }
  }
  return getEmptyCompanyData()
}

/** Пустые данные для сброса (очистка до нуля) */
export function getEmptyCompanyData(): CompanyData {
  return {
    accounts: [],
    categories: [],
    counterparties: [],
    transactions: [],
    budgets: [],
    plannedPayments: [],
    projects: [],
  }
}

export type CompanyData = {
  accounts: Account[]
  categories: Category[]
  counterparties: Counterparty[]
  transactions: Transaction[]
  budgets: Budget[]
  plannedPayments: PlannedPayment[]
  projects: Project[]
}
