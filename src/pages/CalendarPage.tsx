import { useState, useMemo } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ru } from "date-fns/locale"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlannedPaymentsStore } from "@/stores/usePlannedPaymentsStore"
import { formatAmount } from "@/lib/currency"
import type { PlannedPayment } from "@/types"
import { PlannedPaymentFormDialog } from "@/features/plannedPayments/PlannedPaymentFormDialog"
import type { PlannedPaymentFormValues } from "@/features/plannedPayments/plannedPaymentFormSchema"
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

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: PlannedPayment
}

function plannedPaymentToEvent(pp: PlannedPayment): CalendarEvent {
  const date = new Date(pp.date + "T12:00:00")
  const sign = pp.type === "income" ? "+" : "−"
  const title = `${pp.title} ${sign}${formatAmount(pp.amount, pp.currency)}`
  return {
    id: pp.id,
    title,
    start: date,
    end: date,
    resource: pp,
  }
}

export function CalendarPage() {
  const plannedPayments = usePlannedPaymentsStore((s) => s.plannedPayments)
  const { addPlannedPayment, updatePlannedPayment, deletePlannedPayment } =
    usePlannedPaymentsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [date, setDate] = useState(() => new Date())
  const [view, setView] = useState<View>("month")

  const events = useMemo(
    () => plannedPayments.map(plannedPaymentToEvent),
    [plannedPayments]
  )

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start)
    setEditingPayment(null)
    setDialogOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setEditingPayment(event.resource)
    setSelectedDate(null)
    setDialogOpen(true)
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

  const formDefaultValues = editingPayment
    ? {
        date: editingPayment.date,
        amount: editingPayment.amount,
        currency: editingPayment.currency,
        type: editingPayment.type,
        title: editingPayment.title,
        accountId: editingPayment.accountId ?? "",
        categoryId: editingPayment.categoryId ?? "",
        counterpartyId: editingPayment.counterpartyId ?? "",
      }
    : selectedDate
      ? {
          date: selectedDate.toISOString().slice(0, 10),
          amount: 0,
          currency: "UZS",
          type: "expense" as const,
          title: "",
          accountId: "",
          categoryId: "",
          counterpartyId: "",
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
            setSelectedDate(null)
          }
        }}
        defaultValues={formDefaultValues}
        onSubmit={handleSubmit}
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
