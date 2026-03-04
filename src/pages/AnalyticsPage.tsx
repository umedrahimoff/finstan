import { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import {
  filterTransactionsByPeriod,
  aggregateByCategory,
  getMonthlySummaries,
  getMonthName,
} from "@/lib/reportUtils"

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const MONTH_OPTIONS = Object.entries({
  1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель", 5: "Май", 6: "Июнь",
  7: "Июль", 8: "Август", 9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь",
}).map(([value, label]) => ({ value, label }))

const CHART_COLORS = [
  "#16a34a", "#2563eb", "#7c3aed", "#ea580c", "#dc2626",
  "#0891b2", "#ca8a04", "#db2777",
]

function formatChartValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function AnalyticsPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const categories = useCategoriesStore((s) => s.categories)

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—"

  const filteredTxs = useMemo(
    () => filterTransactionsByPeriod(transactions, year, month),
    [transactions, year, month]
  )

  const byCategory = useMemo(
    () => aggregateByCategory(filteredTxs, getCategoryName),
    [filteredTxs, categories]
  )

  const monthlyData = useMemo(
    () => getMonthlySummaries(transactions, year, getMonthName),
    [transactions, year]
  )

  const incomePieData = useMemo(
    () =>
      byCategory
        .filter((c) => c.type === "income" && c.amount > 0)
        .map((c, i) => ({
          name: c.categoryName,
          value: c.amount,
          color: CHART_COLORS[i % CHART_COLORS.length],
        })),
    [byCategory]
  )

  const expensePieData = useMemo(
    () =>
      byCategory
        .filter((c) => c.type === "expense" && c.amount > 0)
        .map((c, i) => ({
          name: c.categoryName,
          value: c.amount,
          color: CHART_COLORS[i % CHART_COLORS.length],
        })),
    [byCategory]
  )

  const barChartData = useMemo(
    () =>
      monthlyData.map((d) => ({
        month: d.label,
        income: d.income,
        expense: d.expense,
        profit: d.profit,
      })),
    [monthlyData]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground">
            Визуальный анализ финансовых данных
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

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Структура</TabsTrigger>
          <TabsTrigger value="dynamics">Динамика</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Распределение по категориям за {getMonthName(month)} {year}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Доходы по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                {incomePieData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Нет данных за период
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {incomePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) =>
                          (v ?? 0).toLocaleString("uz-UZ") + " UZS"
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Расходы по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                {expensePieData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Нет данных за период
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {expensePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) =>
                          (v ?? 0).toLocaleString("uz-UZ") + " UZS"
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Динамика доходов и расходов по месяцам за {year} год
          </p>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Доходы и расходы по месяцам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatChartValue}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) =>
                      (v ?? 0).toLocaleString("uz-UZ") + " UZS"
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Доходы"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Расходы"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
