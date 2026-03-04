import { z } from "zod"

export const COUNTERPARTY_TYPES = [
  { value: "client", label: "Клиент" },
  { value: "supplier", label: "Поставщик" },
  { value: "partner", label: "Партнёр" },
] as const

export const counterpartyFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  type: z.enum(["client", "supplier", "partner"]),
})

export type CounterpartyFormValues = z.infer<typeof counterpartyFormSchema>
