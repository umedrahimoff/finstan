import type { PlannedPayment } from "@/types"

export const mockPlannedPayments: PlannedPayment[] = [
  {
    id: "pp-1",
    date: "2025-03-10",
    amount: 500000,
    currency: "UZS",
    type: "income",
    title: "Ожидаемая оплата от клиента",
    counterpartyId: "cp-1",
  },
  {
    id: "pp-2",
    date: "2025-03-15",
    amount: 300000,
    currency: "UZS",
    type: "expense",
    title: "Аренда офиса",
    categoryId: "cat-4",
    recurrence: "monthly",
    repeatUntil: "2025-12-31",
  },
  {
    id: "pp-3",
    date: "2025-03-20",
    amount: 800000,
    currency: "UZS",
    type: "expense",
    title: "Зарплаты",
    categoryId: "cat-3",
  },
  {
    id: "pp-4",
    date: "2025-03-25",
    amount: 1200000,
    currency: "UZS",
    type: "income",
    title: "Доход по договору",
    counterpartyId: "cp-1",
  },
]
