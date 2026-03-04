import type { Transaction, Account, Category, Counterparty } from "@/types"

export const mockAccounts: Account[] = [
  { id: "acc-1", name: "Основной счёт", type: "bank", currency: "UZS", balance: 5000000 },
  { id: "acc-2", name: "Касса", type: "cash", currency: "UZS", balance: 1200000 },
  { id: "acc-3", name: "Payme", type: "ewallet", currency: "UZS", balance: 800000 },
]

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Продажи", type: "income" },
  { id: "cat-2", name: "Услуги", type: "income", recurring: true },
  { id: "cat-3", name: "Зарплата", type: "expense" },
  { id: "cat-4", name: "Аренда", type: "expense" },
  { id: "cat-5", name: "Маркетинг", type: "expense" },
  { id: "cat-6", name: "Налоги", type: "expense" },
]

export const mockCounterparties: Counterparty[] = [
  { id: "cp-1", name: "ООО Клиент А", type: "client" },
  { id: "cp-2", name: "ИП Поставщик Б", type: "supplier" },
  { id: "cp-3", name: "Банк", type: "partner" },
]

export const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    date: "2025-03-01",
    amount: 2500000,
    currency: "UZS",
    type: "income",
    accountId: "acc-1",
    categoryId: "cat-1",
    counterpartyId: "cp-1",
    projectId: "prj-1",
    comment: "Оплата за товар",
  },
  {
    id: "tx-2",
    date: "2025-03-02",
    amount: 500000,
    currency: "UZS",
    type: "expense",
    accountId: "acc-1",
    categoryId: "cat-3",
    counterpartyId: "cp-2",
    comment: "Зарплата сотруднику",
  },
  {
    id: "tx-3",
    date: "2025-03-03",
    amount: 300000,
    currency: "UZS",
    type: "transfer",
    accountId: "acc-1",
    toAccountId: "acc-2",
    comment: "Перевод в кассу",
  },
  {
    id: "tx-4",
    date: "2025-03-04",
    amount: 1500000,
    currency: "UZS",
    type: "income",
    accountId: "acc-2",
    categoryId: "cat-2",
    counterpartyId: "cp-1",
    projectId: "prj-2",
    comment: "Оплата услуг",
  },
  {
    id: "tx-5",
    date: "2025-03-04",
    amount: 200000,
    currency: "UZS",
    type: "expense",
    accountId: "acc-1",
    categoryId: "cat-5",
    comment: "Реклама",
  },
]
