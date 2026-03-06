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
import { AmountInput } from "@/components/AmountInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreatableSelect } from "@/components/CreatableSelect"
import type { TransactionFormValues } from "./transactionFormSchema"
import { transactionFormSchema } from "./transactionFormSchema"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"
import { useProjectsStore } from "@/stores/useProjectsStore"

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormValues>
  onSubmit: (values: TransactionFormValues) => void
  onCancel: () => void
}

const TRANSACTION_TYPES = [
  { value: "income", label: "Доход" },
  { value: "expense", label: "Расход" },
  { value: "transfer", label: "Перевод" },
] as const

const CURRENCIES = [{ value: "UZS", label: "UZS" }]

export function TransactionForm({
  defaultValues,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const primaryAccountId = accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? ""
  const categories = useCategoriesStore((s) => s.categories)
  const addCategory = useCategoriesStore((s) => s.addCategory)
  const counterparties = useCounterpartiesStore((s) => s.counterparties)
  const addCounterparty = useCounterpartiesStore((s) => s.addCounterparty)
  const projects = useProjectsStore((s) => s.projects)
  const addProject = useProjectsStore((s) => s.addProject)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
      type: defaultValues?.type ?? "expense",
      amount: defaultValues?.amount ?? 0,
      currency: defaultValues?.currency ?? "UZS",
      accountId: defaultValues?.accountId ?? primaryAccountId,
      toAccountId: defaultValues?.toAccountId ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      counterpartyId: defaultValues?.counterpartyId ?? "",
      projectId: defaultValues?.projectId ?? "",
      comment: defaultValues?.comment ?? "",
    },
  })

  const type = form.watch("type")
  const categoryItems = categories.filter((c) => c.type === type || c.type === "both")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <AmountInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="1 000 000"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Валюта</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "transfer" ? "Счёт списания" : "Счёт"}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === "transfer" && (
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Счёт зачисления</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите счёт" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== form.getValues("accountId"))
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(type === "income" || type === "expense") && (
          <>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      items={categoryItems}
                      onCreate={(name) => {
                        try {
                          return addCategory({ name, type: "both" }).id
                        } catch {
                          const existing = categories.find(
                            (c) =>
                              c.name.toLowerCase().trim() === name.toLowerCase().trim() &&
                              (c.type === type || c.type === "both")
                          )
                          return existing?.id ?? ""
                        }
                      }}
                      placeholder="Поиск или создание категории..."
                      createLabel="Создать категорию"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="counterpartyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Контрагент</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      items={counterparties}
                      onCreate={(name) => {
                        try {
                          return addCounterparty({ name, type: "client" }).id
                        } catch {
                          const existing = counterparties.find(
                            (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
                          )
                          return existing?.id ?? ""
                        }
                      }}
                      placeholder="Поиск или создание контрагента..."
                      createLabel="Создать контрагента"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Проект</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      items={projects}
                      onCreate={(name) => {
                        try {
                          return addProject({ name }).id
                        } catch {
                          const existing = projects.find(
                            (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
                          )
                          return existing?.id ?? ""
                        }
                      }}
                      placeholder="Поиск или создание проекта..."
                      createLabel="Создать проект"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Комментарий</FormLabel>
              <FormControl>
                <Input placeholder="Комментарий к операции" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
