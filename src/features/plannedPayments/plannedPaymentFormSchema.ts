import { z } from "zod"

export const plannedPaymentFormSchema = z.object({
  date: z.string().min(1, "Укажите дату"),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().min(1, "Укажите валюту"),
  type: z.enum(["income", "expense"]),
  title: z.string().min(1, "Укажите описание"),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  counterpartyId: z.string().optional(),
})

export type PlannedPaymentFormValues = z.infer<typeof plannedPaymentFormSchema>
