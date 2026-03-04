import { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUzs } from "@/lib/currency"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { calculateStartupMetrics } from "@/lib/metrics"
import { getMonthName } from "@/lib/reportUtils"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const MONTH_OPTIONS = Object.entries({
  1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель", 5: "Май", 6: "Июнь",
  7: "Июль", 8: "Август", 9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь",
}).map(([value, label]) => ({ value, label }))

export function DashboardPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const categories = useCategoriesStore((s) => s.categories)

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)

  const recurringCategoryIds = useMemo(
    () => categories.filter((c) => c.recurring && c.type === "income").map((c) => c.id),
    [categories]
  )

  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts])

  const metrics = useMemo(
    () =>
      calculateStartupMetrics(
        transactions,
        accountIds,
        recurringCategoryIds,
        year,
        month
      ),
    [transactions, accountIds, recurringCategoryIds, year, month]
  )

  const periodLabel = `${getMonthName(month)} ${year}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Главная</h1>
          <p className="text-muted-foreground">
            Обзор финансового состояния компании
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Ключевые метрики</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl font-bold ${
                  metrics.cashflow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatUzs(metrics.cashflow)}
              </div>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl font-bold ${
                  metrics.pl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatUzs(metrics.pl)}
              </div>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {formatUzs(metrics.mrr)}
              </div>
              <p className="text-xs text-muted-foreground">
                {recurringCategoryIds.length > 0
                  ? "Подписки за месяц"
                  : "Отметьте категории в настройках"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {formatUzs(metrics.arr)}
              </div>
              <p className="text-xs text-muted-foreground">MRR × 12</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Burn rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatUzs(metrics.burnRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                Расходы за месяц
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Runway</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {metrics.runway != null
                  ? `${metrics.runway} мес.`
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                Хватит на месяцев
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Баланс</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatUzs(metrics.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">По всем счетам</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Счета</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground">Активных счетов</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
