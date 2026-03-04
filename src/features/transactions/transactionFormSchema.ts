import { z } from "zod"

export const transactionFormSchema = z.object({
  date: z.string().min(1, "Укажите дату"),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().min(1, "Укажите валюту"),
  accountId: z.string().min(1, "Выберите счёт"),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  counterpartyId: z.string().optional(),
  projectId: z.string().optional(),
  comment: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === "transfer") {
      return !!data.toAccountId && data.toAccountId !== data.accountId
    }
    return true
  },
  { message: "Для перевода выберите счёт назначения", path: ["toAccountId"] }
)

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
