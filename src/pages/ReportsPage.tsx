import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"
import { formatAmount } from "@/lib/currency"
import {
  filterTransactionsByPeriod,
  sumIncome,
  sumExpense,
  aggregateByCategory,
  aggregateByCounterparty,
  getMonthName,
} from "@/lib/reportUtils"

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const MONTH_OPTIONS = Object.entries({
  1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель", 5: "Май", 6: "Июнь",
  7: "Июль", 8: "Август", 9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь",
}).map(([value, label]) => ({ value, label }))

export function ReportsPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const categories = useCategoriesStore((s) => s.categories)
  const counterparties = useCounterpartiesStore((s) => s.counterparties)

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const filteredTxs = useMemo(
    () => filterTransactionsByPeriod(transactions, year, month),
    [transactions, year, month]
  )

  const totalIncome = useMemo(() => sumIncome(filteredTxs), [filteredTxs])
  const totalExpense = useMemo(() => sumExpense(filteredTxs), [filteredTxs])
  const profit = totalIncome - totalExpense

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—"
  const getCounterpartyName = (id: string) =>
    counterparties.find((c) => c.id === id)?.name ?? "—"

  const byCategory = useMemo(
    () => aggregateByCategory(filteredTxs, getCategoryName),
    [filteredTxs, categories]
  )

  const byCounterparty = useMemo(
    () => aggregateByCounterparty(filteredTxs, getCounterpartyName),
    [filteredTxs, counterparties]
  )

  const incomeByCat = byCategory.filter((c) => c.type === "income").sort((a, b) => b.amount - a.amount)
  const expenseByCat = byCategory.filter((c) => c.type === "expense").sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Отчёты</h1>
          <p className="text-muted-foreground">
            Управленческие отчёты по доходам и расходам
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Доходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalIncome, "UZS")}
            </div>
            <p className="text-xs text-muted-foreground">
              {getMonthName(month)} {year}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(totalExpense, "UZS")}
            </div>
            <p className="text-xs text-muted-foreground">
              {getMonthName(month)} {year}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Результат</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatAmount(profit, "UZS")}
            </div>
            <p className="text-xs text-muted-foreground">
              {getMonthName(month)} {year}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pl">Доходы и расходы</TabsTrigger>
          <TabsTrigger value="categories">По категориям</TabsTrigger>
          <TabsTrigger value="counterparties">По контрагентам</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Доходы по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeByCat.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нет доходов за период
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeByCat.map((c) => (
                        <TableRow key={c.categoryId}>
                          <TableCell>
                            <Link
                              to={`/transactions?category=${c.categoryId}`}
                              className="hover:underline"
                            >
                              {c.categoryName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatAmount(c.amount, "UZS")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Расходы по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseByCat.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нет расходов за период
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseByCat.map((c) => (
                        <TableRow key={c.categoryId}>
                          <TableCell>
                            <Link
                              to={`/transactions?category=${c.categoryId}`}
                              className="hover:underline"
                            >
                              {c.categoryName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatAmount(c.amount, "UZS")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сводка по категориям</CardTitle>
              <p className="text-sm text-muted-foreground">
                {getMonthName(month)} {year}
              </p>
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет операций за период
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Категория</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategory
                      .sort((a, b) => b.amount - a.amount)
                      .map((c) => (
                        <TableRow key={`${c.categoryId}-${c.type}`}>
                          <TableCell>
                            <Link
                              to={`/transactions?category=${c.categoryId}`}
                              className="hover:underline"
                            >
                              {c.categoryName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {c.type === "income" ? "Доход" : "Расход"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              c.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {c.type === "income" ? "+" : "−"}
                            {formatAmount(c.amount, "UZS")}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counterparties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сводка по контрагентам</CardTitle>
              <p className="text-sm text-muted-foreground">
                {getMonthName(month)} {year}
              </p>
            </CardHeader>
            <CardContent>
              {byCounterparty.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет операций за период
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Контрагент</TableHead>
                      <TableHead className="text-right">Поступления</TableHead>
                      <TableHead className="text-right">Выплаты</TableHead>
                      <TableHead className="text-right">Итого</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCounterparty
                      .filter(
                        (c) => c.income > 0 || c.expense > 0
                      )
                      .map((c) => {
                        const total = c.income - c.expense
                        return (
                          <TableRow key={c.counterpartyId}>
                            <TableCell>
                              <Link
                                to={`/transactions?counterparty=${c.counterpartyId}`}
                                className="hover:underline"
                              >
                                {c.counterpartyName}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatAmount(c.income, "UZS")}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatAmount(c.expense, "UZS")}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                total >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {total >= 0 ? "+" : ""}
                              {formatAmount(total, "UZS")}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
