import { useState, useMemo } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { format, parse, startOfWeek, endOfWeek, getDay, startOfMonth, endOfMonth, startOfDay } from "date-fns"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { ru } from "date-fns/locale"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlannedPaymentsStore } from "@/stores/usePlannedPaymentsStore"
import type { PlannedPayment } from "@/types"
import { PlannedPaymentFormDialog } from "@/features/plannedPayments/PlannedPaymentFormDialog"
import type { PlannedPaymentFormValues } from "@/features/plannedPayments/plannedPaymentFormSchema"
import { plannedPaymentToEvents } from "@/lib/recurrence"
import { getSystemCurrency } from "@/stores/useSettingsStore"
import "react-big-calendar/lib/css/react-big-calendar.css"

const locales = { "ru": ru }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date, options?: { locale?: object }) =>
    startOfWeek(date, { weekStartsOn: 1, ...options }),
  getDay,
  locales,
})

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: PlannedPayment
}

function getRangeFromView(date: Date, view: View): { start: Date; end: Date } {
  if (view === "month") {
    return { start: startOfMonth(date), end: endOfMonth(date) }
  }
  if (view === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    }
  }
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  end.setMonth(end.getMonth() + 2)
  return { start, end }
}

export function CalendarPage() {
  const plannedPayments = usePlannedPaymentsStore((s) => s.plannedPayments)
  const { addPlannedPayment, updatePlannedPayment, deletePlannedPayment } =
    usePlannedPaymentsStore()
  const accounts = useAccountsStore((s) => s.accounts)
  const primaryAccountId = accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? ""
  const addTransaction = useCompanyDataStore((s) => s.addTransaction)
  const getTransactions = useCompanyDataStore((s) => s.getTransactions)
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null)
  /** Дата экземпляра при клике на повторяющийся платёж */
  const [instanceDate, setInstanceDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [date, setDate] = useState(() => new Date())
  const [view, setView] = useState<View>("month")

  const events = useMemo(() => {
    const { start, end } = getRangeFromView(date, view)
    return plannedPayments.flatMap((pp) =>
      plannedPaymentToEvents(pp, startOfDay(start), startOfDay(end))
    )
  }, [plannedPayments, date, view])

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start)
    setEditingPayment(null)
    setInstanceDate(null)
    setDialogOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setEditingPayment(event.resource)
    setInstanceDate(event.start)
    setSelectedDate(null)
    setDialogOpen(true)
  }

  const handleConfirm = (values: PlannedPaymentFormValues) => {
    if (!editingPayment) return
    const txDate = instanceDate ? format(instanceDate, "yyyy-MM-dd") : values.date
    const transactions = getTransactions(companyId)
    const alreadyAdded = transactions.some(
      (t) => t.plannedPaymentId === editingPayment.id && t.date === txDate
    )
    if (alreadyAdded) {
      setDialogOpen(false)
      setEditingPayment(null)
      setInstanceDate(null)
      return
    }
    addTransaction({
      date: txDate,
      amount: values.amount,
      currency: values.currency,
      type: values.type,
      accountId: values.accountId!,
      categoryId: values.categoryId || undefined,
      counterpartyId: values.counterpartyId || undefined,
      comment: values.title,
      plannedPaymentId: editingPayment.id,
    })
    setEditingPayment(null)
    setInstanceDate(null)
    setDialogOpen(false)
  }

  const handleSubmit = (values: PlannedPaymentFormValues) => {
    const payload = {
      date: values.date,
      amount: values.amount,
      currency: values.currency,
      type: values.type,
      title: values.title,
      accountId: values.accountId || undefined,
      categoryId: values.categoryId || undefined,
      counterpartyId: values.counterpartyId || undefined,
      recurrence: values.recurrence && values.recurrence !== "none" ? values.recurrence : undefined,
      repeatUntil: values.repeatUntil || undefined,
    }
    if (editingPayment) {
      updatePlannedPayment(editingPayment.id, payload)
    } else {
      addPlannedPayment(payload)
    }
    setEditingPayment(null)
    setSelectedDate(null)
    setDialogOpen(false)
  }

  const txDateForConfirm = editingPayment
    ? (instanceDate ? format(instanceDate, "yyyy-MM-dd") : editingPayment.date)
    : ""
  const alreadyConfirmed =
    !!editingPayment &&
    !!txDateForConfirm &&
    getTransactions(companyId).some(
      (t) => t.plannedPaymentId === editingPayment.id && t.date === txDateForConfirm
    )

  const formDefaultValues = editingPayment
    ? {
        date: editingPayment.date,
        amount: editingPayment.amount,
        currency: editingPayment.currency,
        type: editingPayment.type,
        title: editingPayment.title,
        accountId: editingPayment.accountId ?? primaryAccountId,
        categoryId: editingPayment.categoryId ?? "",
        counterpartyId: editingPayment.counterpartyId ?? "",
        recurrence: editingPayment.recurrence ?? "none",
        repeatUntil: editingPayment.repeatUntil ?? "",
      }
    : selectedDate
      ? {
          date: format(selectedDate, "yyyy-MM-dd"),
          amount: 0,
          currency: getSystemCurrency(),
          type: "expense" as const,
          title: "",
          accountId: primaryAccountId,
          categoryId: "",
          counterpartyId: "",
          recurrence: "none" as const,
          repeatUntil: "",
        }
      : undefined

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.resource.type === "income" ? "#16a34a" : "#dc2626",
    },
  })

  const messages = {
    today: "Сегодня",
    previous: "Назад",
    next: "Вперёд",
    month: "Месяц",
    week: "Неделя",
    day: "День",
    agenda: "Повестка",
    date: "Дата",
    time: "Время",
    event: "Событие",
    noEventsInRange: "Нет запланированных платежей",
    showMore: (total: number) => `+${total} ещё`,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Платежный календарь</h1>
          <p className="text-muted-foreground">
            Планирование платежей и поступлений
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedDate(new Date())
            setEditingPayment(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Запланировать платёж
        </Button>
      </div>

      <div className="rounded-md border bg-card p-4" style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          culture="ru"
          date={date}
          onNavigate={setDate}
          view={view}
          onView={setView}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={messages}
          views={["month", "week", "agenda"] as View[]}
        />
      </div>

      <PlannedPaymentFormDialog
        key={editingPayment?.id ?? selectedDate?.toISOString() ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingPayment(null)
            setInstanceDate(null)
            setSelectedDate(null)
          }
        }}
        defaultValues={formDefaultValues}
        onSubmit={handleSubmit}
        onConfirm={editingPayment && !alreadyConfirmed ? handleConfirm : undefined}
        confirmDisabled={alreadyConfirmed}
        onDelete={
          editingPayment
            ? () => {
                deletePlannedPayment(editingPayment.id)
                setEditingPayment(null)
              }
            : undefined
        }
        title={
          editingPayment ? "Редактировать платёж" : "Запланировать платёж"
        }
      />
    </div>
  )
}
