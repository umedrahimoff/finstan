export type TransactionType = "income" | "expense" | "transfer"

export interface Transaction {
  id: string
  date: string
  amount: number
  currency: string
  type: TransactionType
  accountId: string
  toAccountId?: string
  categoryId?: string
  counterpartyId?: string
  projectId?: string
  comment?: string
}

export interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  parentId?: string
  /** Учитывать в MRR (для подписок) */
  recurring?: boolean
}

export interface Counterparty {
  id: string
  name: string
  type: string
}

export type PlannedPaymentType = "income" | "expense"

export interface PlannedPayment {
  id: string
  date: string
  amount: number
  currency: string
  type: PlannedPaymentType
  title: string
  accountId?: string
  categoryId?: string
  counterpartyId?: string
}

export interface Budget {
  id: string
  categoryId: string
  year: number
  month: number
  amount: number
  currency: string
}

export interface Project {
  id: string
  name: string
}
