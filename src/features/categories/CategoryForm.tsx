import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CategoryFormValues } from "./categoryFormSchema"
import { categoryFormSchema } from "./categoryFormSchema"

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>
  onSubmit: (values: CategoryFormValues) => void
  onCancel: () => void
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "expense",
      recurring: defaultValues?.recurring ?? false,
    },
  })

  const handleSubmit = (values: CategoryFormValues) => {
    try {
      onSubmit(values)
    } catch (e) {
      if (e instanceof Error) form.setError("name", { message: e.message })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="Зарплата" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === "income" || field.value === "both"}
                    onChange={(e) => {
                      const isIncome = e.target.checked
                      const isExpense = field.value === "expense" || field.value === "both"
                      if (!isIncome && !isExpense) return
                      field.onChange(isIncome && isExpense ? "both" : isIncome ? "income" : "expense")
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>Доход</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === "expense" || field.value === "both"}
                    onChange={(e) => {
                      const isExpense = e.target.checked
                      const isIncome = field.value === "income" || field.value === "both"
                      if (!isIncome && !isExpense) return
                      field.onChange(isIncome && isExpense ? "both" : isIncome ? "income" : "expense")
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>Расход</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Выберите один или оба типа — категория появится в выбранных разделах
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        {(form.watch("type") === "income" || form.watch("type") === "both") && (
          <FormField
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal cursor-pointer">
                    Учитывать в MRR (подписки)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Form>
  )
}
