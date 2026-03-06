import { z } from "zod"

export const COUNTERPARTY_TYPES = [
  { value: "client", label: "Клиент" },
  { value: "supplier", label: "Поставщик" },
  { value: "partner", label: "Партнёр" },
] as const

export const counterpartyFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  type: z.enum(["client", "supplier", "partner"]),
  inn: z.string().optional(),
  country: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.union([z.string().email("Некорректный email"), z.literal("")]).optional(),
})

export type CounterpartyFormValues = z.infer<typeof counterpartyFormSchema>
