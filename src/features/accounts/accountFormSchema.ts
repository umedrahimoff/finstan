import { z } from "zod"

export const ACCOUNT_TYPES = [
  { value: "bank", label: "Банковский счёт" },
  { value: "cash", label: "Наличные" },
  { value: "ewallet", label: "Электронный кошелёк" },
  { value: "project", label: "Счёт проекта" },
] as const

export const accountFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  type: z.enum(["bank", "cash", "ewallet", "project"]),
  currency: z.string().min(1, "Укажите валюту"),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>
