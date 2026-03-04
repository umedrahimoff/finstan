import { z } from "zod"

export const projectFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
