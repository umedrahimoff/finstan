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
import type { PlannedPaymentFormValues } from "./plannedPaymentFormSchema"
import { plannedPaymentFormSchema } from "./plannedPaymentFormSchema"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"

import { CURRENCIES } from "@/lib/currencies"
import { getSystemCurrency } from "@/stores/useSettingsStore"
const NONE_VALUE = "__none__"

interface PlannedPaymentFormProps {
  defaultValues?: Partial<PlannedPaymentFormValues>
  onSubmit: (values: PlannedPaymentFormValues) => void
  onCancel: () => void
  onDelete?: () => void
  /** Подтвердить платёж и добавить в операции (показывается при редактировании) */
  onConfirm?: (values: PlannedPaymentFormValues) => void
  /** Кнопка подтверждения отключена (уже добавлено в операции) */
  confirmDisabled?: boolean
}

export function PlannedPaymentForm({
  defaultValues,
  onSubmit,
  onCancel,
  onDelete,
  onConfirm,
  confirmDisabled = false,
}: PlannedPaymentFormProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const primaryAccountId = accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? ""
  const categories = useCategoriesStore((s) => s.categories)
  const addCategory = useCategoriesStore((s) => s.addCategory)
  const counterparties = useCounterpartiesStore((s) => s.counterparties)
  const addCounterparty = useCounterpartiesStore((s) => s.addCounterparty)

  const form = useForm<PlannedPaymentFormValues>({
    resolver: zodResolver(plannedPaymentFormSchema),
    defaultValues: {
      date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
      amount: defaultValues?.amount ?? 0,
      currency: defaultValues?.currency ?? getSystemCurrency(),
      type: defaultValues?.type ?? "expense",
      title: defaultValues?.title ?? "",
      accountId: defaultValues?.accountId ?? primaryAccountId,
      categoryId: defaultValues?.categoryId ?? "",
      counterpartyId: defaultValues?.counterpartyId ?? "",
      recurrence: defaultValues?.recurrence ?? "none",
      repeatUntil: defaultValues?.repeatUntil ?? "",
    },
  })

  const type = form.watch("type")
  const recurrence = form.watch("recurrence")
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
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Доход</SelectItem>
                    <SelectItem value="expense">Расход</SelectItem>
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
                  value={field.value}
                  defaultValue={field.value}
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
              <FormLabel>Счёт</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === NONE_VALUE ? "" : v)}
                value={field.value || NONE_VALUE}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Не выбрано</SelectItem>
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
                      const existing = categoryItems.find(
                        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Повторять</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Разовый</SelectItem>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                    <SelectItem value="yearly">Ежегодно</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {recurrence && recurrence !== "none" && (
            <FormField
              control={form.control}
              name="repeatUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Повторять до</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="title"
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
        <div className="flex flex-col gap-3 pt-4">
          {onConfirm && (
            <>
              <Button
                type="button"
                disabled={confirmDisabled}
                onClick={() => {
                  if (confirmDisabled) return
                  const values = form.getValues()
                  if (!values.accountId) {
                    form.setError("accountId", { message: "Укажите счёт для добавления в операции" })
                    return
                  }
                  onConfirm(values)
                }}
              >
                {confirmDisabled ? "Уже добавлено в операции" : "Подтвердить и добавить в операции"}
              </Button>
              {confirmDisabled && (
                <p className="text-sm text-muted-foreground">
                  Операция по этому платежу уже существует
                </p>
              )}
            </>
          )}
          <div className="flex justify-between items-center">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                Удалить
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
