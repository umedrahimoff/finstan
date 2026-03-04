import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  parseISO,
  startOfDay,
  format,
} from "date-fns"
import type { PlannedPayment, RecurrenceType } from "@/types"
import { formatAmount } from "@/lib/currency"

export function getRecurrenceDates(
  startDate: Date,
  recurrence: RecurrenceType,
  repeatUntil: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  maxCount = 500
): Date[] {
  if (recurrence === "none") {
    const d = startOfDay(startDate)
    if (!isBefore(d, rangeStart) && !isAfter(d, rangeEnd)) return [d]
    return []
  }
  const add = {
    daily: addDays,
    weekly: addWeeks,
    monthly: addMonths,
    yearly: addYears,
  }[recurrence] as (d: Date, n: number) => Date
  const end = repeatUntil ? startOfDay(repeatUntil) : rangeEnd
  const dates: Date[] = []
  let current = startOfDay(startDate)
  let count = 0
  while (
    !isAfter(current, end) &&
    !isAfter(current, rangeEnd) &&
    count < maxCount
  ) {
    if (!isBefore(current, rangeStart)) {
      dates.push(current)
    }
    current = add(current, 1)
    count++
  }
  return dates
}

export function plannedPaymentToEvents(
  pp: PlannedPayment,
  rangeStart: Date,
  rangeEnd: Date
): { id: string; title: string; start: Date; end: Date; resource: PlannedPayment }[] {
  const recurrence = pp.recurrence ?? "none"
  const startDate = parseISO(pp.date)
  const repeatUntil = pp.repeatUntil ? parseISO(pp.repeatUntil) : null
  const dates = getRecurrenceDates(startDate, recurrence, repeatUntil, rangeStart, rangeEnd)
  const sign = pp.type === "income" ? "+" : "−"
  const title = `${pp.title} ${sign}${formatAmount(pp.amount, pp.currency)}`
  return dates.map((d, i) => ({
    id: `${pp.id}-${i}-${format(d, "yyyy-MM-dd")}`,
    title,
    start: d,
    end: d,
    resource: pp,
  }))
}
