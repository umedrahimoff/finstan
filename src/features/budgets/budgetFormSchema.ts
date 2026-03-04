import { z } from "zod"

export const budgetFormSchema = z.object({
  categoryId: z
    .string()
    .refine((v) => v && v !== "__none__", "Выберите категорию"),
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().min(1, "Укажите валюту"),
})

export type BudgetFormValues = z.infer<typeof budgetFormSchema>

export const MONTH_NAMES: Record<number, string> = {
  1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель", 5: "Май", 6: "Июнь",
  7: "Июль", 8: "Август", 9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь",
}
