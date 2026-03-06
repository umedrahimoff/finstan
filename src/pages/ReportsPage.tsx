import { useState, useMemo, useEffect } from "react"
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
import { getSystemCurrency } from "@/stores/useSettingsStore"
import {
  filterTransactionsByPeriod,
  sumIncome,
  sumExpense,
  aggregateByCategory,
  aggregateByCounterparty,
  getMonthName,
  getAvailablePeriods,
  getMonthOptionsForYear,
} from "@/lib/reportUtils"
import { TablePagination } from "@/components/TablePagination"

const currentYear = new Date().getFullYear()
const PAGE_SIZE = 15
const currentMonth = new Date().getMonth() + 1

export function ReportsPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const categories = useCategoriesStore((s) => s.categories)
  const counterparties = useCounterpartiesStore((s) => s.counterparties)

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [pagePlIncome, setPagePlIncome] = useState(1)
  const [pagePlExpense, setPagePlExpense] = useState(1)
  const [pageCat, setPageCat] = useState(1)
  const [pageCp, setPageCp] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const availablePeriods = useMemo(
    () => getAvailablePeriods(transactions),
    [transactions]
  )
  const yearOptions = availablePeriods.years
  const monthOptions = useMemo(
    () => getMonthOptionsForYear(availablePeriods.monthsByYear, year),
    [availablePeriods.monthsByYear, year]
  )

  useEffect(() => {
    if (yearOptions.length === 0) return
    const monthsForYear = availablePeriods.monthsByYear[year] ?? []
    if (!yearOptions.includes(year) || !monthsForYear.includes(month)) {
      const y = yearOptions[0]
      const m = availablePeriods.monthsByYear[y]?.[0] ?? currentMonth
      setYear(y)
      setMonth(m)
    }
  }, [availablePeriods, year, month, yearOptions])

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
  const byCategorySorted = useMemo(
    () => [...byCategory].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    [byCategory]
  )
  const byCounterpartyFiltered = useMemo(
    () => byCounterparty.filter((c) => c.income > 0 || c.expense > 0),
    [byCounterparty]
  )


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
          <Select
            value={
              monthOptions.some((o) => o.value === String(month))
                ? String(month)
                : ""
            }
            onValueChange={(v) => setMonth(Number(v))}
            disabled={monthOptions.length === 0}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={monthOptions.length === 0 ? "Нет данных" : "Месяц"} />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={yearOptions.includes(year) ? String(year) : ""}
            onValueChange={(v) => {
              const y = Number(v)
              setYear(y)
              const months = availablePeriods.monthsByYear[y] ?? []
              if (!months.includes(month)) setMonth(months[0] ?? month)
            }}
            disabled={yearOptions.length === 0}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={yearOptions.length === 0 ? "Нет данных" : "Год"} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
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
              {formatAmount(totalIncome, getSystemCurrency())}
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
              {formatAmount(totalExpense, getSystemCurrency())}
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
              {formatAmount(profit, getSystemCurrency())}
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
                  <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeByCat.slice((pagePlIncome - 1) * pageSize, pagePlIncome * pageSize).map((c) => (
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
                            {formatAmount(c.amount, getSystemCurrency())}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={pagePlIncome}
                    totalPages={Math.ceil(incomeByCat.length / pageSize) || 1}
                    totalItems={incomeByCat.length}
                    pageSize={pageSize}
                    onPageChange={setPagePlIncome}
                    onPageSizeChange={(s) => { setPageSize(s); setPagePlIncome(1) }}
                  />
                  </>
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
                  <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Категория</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseByCat.slice((pagePlExpense - 1) * pageSize, pagePlExpense * pageSize).map((c) => (
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
                            {formatAmount(c.amount, getSystemCurrency())}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={pagePlExpense}
                    totalPages={Math.ceil(expenseByCat.length / pageSize) || 1}
                    totalItems={expenseByCat.length}
                    pageSize={pageSize}
                    onPageChange={setPagePlExpense}
                    onPageSizeChange={(s) => { setPageSize(s); setPagePlExpense(1) }}
                  />
                  </>
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
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Категория</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategorySorted
                      .slice((pageCat - 1) * pageSize, pageCat * pageSize)
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
                            {formatAmount(c.amount, getSystemCurrency())}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={pageCat}
                  totalPages={Math.ceil(byCategorySorted.length / pageSize) || 1}
                  totalItems={byCategorySorted.length}
                  pageSize={pageSize}
                  onPageChange={setPageCat}
                  onPageSizeChange={(s) => { setPageSize(s); setPageCat(1) }}
                />
                </>
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
                <>
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
                    {byCounterpartyFiltered
                      .slice((pageCp - 1) * pageSize, pageCp * pageSize)
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
                              {formatAmount(c.income, getSystemCurrency())}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatAmount(c.expense, getSystemCurrency())}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                total >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {total >= 0 ? "+" : ""}
                              {formatAmount(total, getSystemCurrency())}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
                <TablePagination
                  page={pageCp}
                  totalPages={Math.ceil(byCounterpartyFiltered.length / pageSize) || 1}
                  totalItems={byCounterpartyFiltered.length}
                  pageSize={pageSize}
                  onPageChange={setPageCp}
                  onPageSizeChange={(s) => { setPageSize(s); setPageCp(1) }}
                />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
