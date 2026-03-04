import { z } from "zod"

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  type: z.enum(["income", "expense"]),
  recurring: z.boolean().optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
