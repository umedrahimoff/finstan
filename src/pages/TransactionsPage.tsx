import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Copy, Trash2, Plus, CheckSquare, Square, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useProjectsStore } from "@/stores/useProjectsStore"
import { formatAmount } from "@/lib/currency"
import { toExcel, toCSV } from "@/lib/exportData"
import type { Transaction, TransactionType } from "@/types"
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog"
import type { TransactionFormValues } from "@/features/transactions/transactionFormSchema"
import { TablePagination } from "@/components/TablePagination"

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Доход",
  expense: "Расход",
  transfer: "Перевод",
}

function getAccountName(id: string, accounts: { id: string; name: string }[]) {
  return accounts.find((a) => a.id === id)?.name ?? id
}

function getCategoryName(id: string, categories: { id: string; name: string }[]) {
  return categories.find((c) => c.id === id)?.name ?? "—"
}

function getCounterpartyName(id: string, counterparties: { id: string; name: string }[]) {
  return counterparties.find((c) => c.id === id)?.name ?? "—"
}

function getProjectName(id: string, projects: { id: string; name: string }[]) {
  return projects.find((p) => p.id === id)?.name ?? "—"
}

export function TransactionsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const categories = useCategoriesStore((s) => s.categories)
  const counterparties = useCounterpartiesStore((s) => s.counterparties)
  const projects = useProjectsStore((s) => s.projects)
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  } = useTransactionsStore()

  const [searchParams] = useSearchParams()
  const accountFromUrl = searchParams.get("account")
  const categoryFromUrl = searchParams.get("category")
  const counterpartyFromUrl = searchParams.get("counterparty")
  const projectFromUrl = searchParams.get("project")

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [accountFilter, setAccountFilter] = useState<string>(accountFromUrl ?? "all")
  const [categoryFilter, setCategoryFilter] = useState<string>(categoryFromUrl ?? "all")
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>(
    counterpartyFromUrl ?? "all"
  )
  const [projectFilter, setProjectFilter] = useState<string>(
    projectFromUrl ?? "all"
  )

  useEffect(() => {
    if (accountFromUrl) setAccountFilter(accountFromUrl)
  }, [accountFromUrl])
  useEffect(() => {
    if (categoryFromUrl) setCategoryFilter(categoryFromUrl)
  }, [categoryFromUrl])
  useEffect(() => {
    if (counterpartyFromUrl) setCounterpartyFilter(counterpartyFromUrl)
  }, [counterpartyFromUrl])
  useEffect(() => {
    if (projectFromUrl) setProjectFilter(projectFromUrl)
  }, [projectFromUrl])
  useEffect(() => {
    setPageIndex(0)
  }, [globalFilter, typeFilter, accountFilter, categoryFilter, counterpartyFilter, projectFilter])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <button
            type="button"
            className="flex items-center justify-center"
            onClick={() =>
              table.getIsAllPageRowsSelected()
                ? table.toggleAllPageRowsSelected(false)
                : table.toggleAllPageRowsSelected(true)
            }
          >
            {table.getIsAllPageRowsSelected() ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4 text-muted-foreground" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              row.toggleSelected(!row.getIsSelected())
            }}
          >
            {row.getIsSelected() ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4 text-muted-foreground" />
            )}
          </button>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Дата
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => row.getValue("date"),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Тип
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span
            className={
              row.getValue("type") === "income"
                ? "text-green-600"
                : row.getValue("type") === "expense"
                  ? "text-red-600"
                  : "text-blue-600"
            }
          >
            {TYPE_LABELS[row.getValue("type") as TransactionType]}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Сумма
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as TransactionType
          const amount = row.getValue("amount") as number
          const currency = row.getValue("currency") as string
          return (
            <span
              className={
                type === "income"
                  ? "text-green-600"
                  : type === "expense"
                    ? "text-red-600"
                    : ""
              }
            >
              {type === "expense" ? "-" : type === "income" ? "+" : ""}
              {formatAmount(amount, currency)}
            </span>
          )
        },
      },
      {
        accessorKey: "accountId",
        header: "Счёт",
        cell: ({ row }) => getAccountName(row.getValue("accountId"), accounts),
      },
      {
        id: "category",
        header: "Категория",
        cell: ({ row }) => {
          const type = row.original.type
          if (type === "transfer") return "—"
          return getCategoryName(row.original.categoryId ?? "", categories)
        },
      },
      {
        id: "counterparty",
        header: "Контрагент",
        cell: ({ row }) => {
          const type = row.original.type
          if (type === "transfer") return "—"
          const name = getCounterpartyName(row.original.counterpartyId ?? "", counterparties)
          return <span className="block max-w-[120px] truncate" title={name}>{name}</span>
        },
      },
      {
        id: "project",
        header: "Проект",
        cell: ({ row }) =>
          getProjectName(row.original.projectId ?? "", projects),
      },
      {
        accessorKey: "comment",
        header: "Комментарий",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block">
            {row.getValue("comment") || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingTx(row.original)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="mr-2 size-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => duplicateTransaction(row.original.id)}
              >
                <Copy className="mr-2 size-4" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletingTx(row.original)}
              >
                <Trash2 className="mr-2 size-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [duplicateTransaction, accounts, categories, counterparties, projects]
  )

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter)
    }
    if (accountFilter !== "all") {
      result = result.filter(
        (t) => t.accountId === accountFilter || t.toAccountId === accountFilter
      )
    }
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categoryId === categoryFilter)
    }
    if (counterpartyFilter !== "all") {
      result = result.filter((t) => t.counterpartyId === counterpartyFilter)
    }
    if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter)
    }
    if (globalFilter) {
      const search = globalFilter.toLowerCase()
      result = result.filter((tx) => {
        const str = [
          tx.date,
          TYPE_LABELS[tx.type],
        tx.amount.toString(),
        getAccountName(tx.accountId, accounts),
          tx.type !== "transfer" ? getCategoryName(tx.categoryId ?? "", categories) : "",
          tx.type !== "transfer" ? getCounterpartyName(tx.counterpartyId ?? "", counterparties) : "",
          getProjectName(tx.projectId ?? "", projects),
          tx.comment ?? "",
        ].join(" ")
        return str.toLowerCase().includes(search)
      })
    }
    return result
  }, [transactions, globalFilter, typeFilter, accountFilter, categoryFilter, counterpartyFilter, projectFilter, categories, counterparties, projects])

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting, rowSelection, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const prev = { pageIndex, pageSize }
      const next = typeof updater === "function" ? updater(prev) : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  })

  const sortedRows = table.getRowModel().rows
  const totalRows = filteredTransactions.length
  const totalPages = Math.ceil(totalRows / pageSize) || 1
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleCreate = () => {
    setEditingTx(null)
    setDialogOpen(true)
  }

  const handleSubmit = (values: TransactionFormValues) => {
    if (editingTx) {
      updateTransaction(editingTx.id, values)
    } else {
      addTransaction(values)
    }
    setEditingTx(null)
  }

  const handleDeleteConfirm = () => {
    if (deletingTx) {
      deleteTransaction(deletingTx.id)
      setDeletingTx(null)
    }
  }

  const handleBatchDeleteConfirm = () => {
    selectedRows.forEach((row) => deleteTransaction(row.original.id))
    table.toggleAllPageRowsSelected(false)
    setDeletingBatch(false)
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleExportExcel = () => {
    const blob = toExcel(filteredTransactions, accounts, categories, counterparties, projects)
    downloadBlob(blob, `операции-${dateStr}.xlsx`)
  }
  const handleExportCSV = () => {
    const csv = toCSV(filteredTransactions, accounts, categories, counterparties, projects)
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `операции-${dateStr}.csv`)
  }

  const formDefaultValues = editingTx
    ? {
        date: editingTx.date,
        type: editingTx.type,
        amount: editingTx.amount,
        currency: editingTx.currency,
        accountId: editingTx.accountId,
        toAccountId: editingTx.toAccountId ?? "",
        categoryId: editingTx.categoryId ?? "",
        counterpartyId: editingTx.counterpartyId ?? "",
        projectId: editingTx.projectId ?? "",
        comment: editingTx.comment ?? "",
      }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Операции</h1>
          <p className="text-muted-foreground">
            Учёт поступлений, расходов и переводов
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Добавить операцию
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Поиск по операциям..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Счёт" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все счета</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Контрагент" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все контрагенты</SelectItem>
            {counterparties.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Проект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все проекты</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Экспорт операций">
              <Download className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel} disabled={filteredTransactions.length === 0}>
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} disabled={filteredTransactions.length === 0}>
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-4 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            Выбрано: {selectedCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingBatch(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Удалить выбранные
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.toggleAllPageRowsSelected(false)}
          >
            Снять выбор
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === "counterparty" ? "w-[120px] max-w-[120px]" : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Операций не найдено
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={row.original.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === "counterparty" ? "max-w-[120px]" : undefined}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={pageIndex + 1}
        totalPages={totalPages}
        totalItems={totalRows}
        pageSize={pageSize}
        onPageChange={(p) => setPageIndex(p - 1)}
        onPageSizeChange={setPageSize}
      />

      <TransactionFormDialog
        key={editingTx?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingTx(null)
        }}
        defaultValues={formDefaultValues}
        onSubmit={handleSubmit}
        title={editingTx ? "Редактирование операции" : "Новая операция"}
      />

      <AlertDialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && setDeletingTx(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить операцию?</AlertDialogTitle>
            <AlertDialogDescription>
              Операция будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingBatch}
        onOpenChange={(open) => !open && setDeletingBatch(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные операции?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено операций: {selectedCount}. Действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
