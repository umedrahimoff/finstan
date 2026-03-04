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
  /** Ссылка на запланированный платёж при подтверждении из календаря */
  plannedPaymentId?: string
}

export interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  /** Основной счёт компании (по умолчанию в формах) */
  isPrimary?: boolean
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

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"

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
  /** Повторение: none = разовый */
  recurrence?: RecurrenceType
  /** Дата окончания повторения (YYYY-MM-DD) */
  repeatUntil?: string
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
