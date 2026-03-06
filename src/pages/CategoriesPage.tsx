import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Plus, ArrowDownLeft, ArrowUpRight, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { formatAmount } from "@/lib/currency"
import { getSystemCurrency } from "@/stores/useSettingsStore"
import { CategoryFormDialog } from "@/features/categories/CategoryFormDialog"
import type { CategoryFormValues } from "@/features/categories/categoryFormSchema"
import { TablePagination } from "@/components/TablePagination"

function getCategoryTypeIcon(type: string) {
  if (type === "income") return <ArrowDownLeft className="size-4 text-green-600" />
  if (type === "expense") return <ArrowUpRight className="size-4 text-red-600" />
  return <ArrowDownLeft className="size-4 text-muted-foreground" />
}

function getCategoryTypeLabel(type: string) {
  if (type === "income") return "Доход"
  if (type === "expense") return "Расход"
  return "Доход и расход"
}

export function CategoriesPage() {
  const categories = useCategoriesStore((s) => s.categories)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addCategory, updateCategory, deleteCategory } = useCategoriesStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{
    id: string
    name: string
    type: string
    recurring?: boolean
  } | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const filteredCategories =
    typeFilter === "all"
      ? categories
      : typeFilter === "income"
        ? categories.filter((c) => c.type === "income" || c.type === "both")
        : categories.filter((c) => c.type === "expense" || c.type === "both")

  const paginatedCategories = useMemo(
    () => filteredCategories.slice((page - 1) * pageSize, page * pageSize),
    [filteredCategories, page, pageSize]
  )

  useEffect(() => setPage(1), [typeFilter])

  const getCategoryTotal = (categoryId: string) => {
    return transactions.reduce((sum, tx) => {
      if (tx.categoryId !== categoryId) return sum
      if (tx.type === "income") return sum + tx.amount
      if (tx.type === "expense") return sum - tx.amount
      return sum
    }, 0)
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const handleSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, values)
    } else {
      addCategory(values)
    }
    setEditingCategory(null)
    setDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCategories.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedCategories.map((c) => c.id)))
    }
  }

  const handleBatchDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteCategory(id))
    setSelectedIds(new Set())
    setDeletingBatch(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Категории</h1>
          <p className="text-muted-foreground">
            Категории доходов и расходов
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Добавить категорию
        </Button>
      </div>

      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="income">Доходы</TabsTrigger>
          <TabsTrigger value="expense">Расходы</TabsTrigger>
        </TabsList>
      </Tabs>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingBatch(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Удалить выбранные
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Снять выбор
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <button
                  type="button"
                  className="flex items-center justify-center"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.size === paginatedCategories.length && paginatedCategories.length > 0 ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Сумма по операциям</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Категорий пока нет. Добавьте первую категорию.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((cat) => {
                const total = getCategoryTotal(cat.id)
                return (
                  <TableRow key={cat.id}>
                    <TableCell className="w-[40px]">
                      <button
                        type="button"
                        className="flex items-center justify-center"
                        onClick={() => toggleSelect(cat.id)}
                      >
                        {selectedIds.has(cat.id) ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/transactions?category=${cat.id}`}
                        className="font-medium hover:underline"
                      >
                        {cat.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryTypeIcon(cat.type)}
                        {getCategoryTypeLabel(cat.type)}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        total >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(Math.abs(total), getSystemCurrency())}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCategory({
                                ...cat,
                                recurring: cat.recurring,
                              })
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingCategory(cat)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={Math.ceil(filteredCategories.length / pageSize) || 1}
        totalItems={filteredCategories.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s)
          setPage(1)
        }}
      />

      <CategoryFormDialog
        key={editingCategory?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
        defaultValues={
          editingCategory
            ? {
                name: editingCategory.name,
                type: editingCategory.type as CategoryFormValues["type"],
                recurring: editingCategory.recurring,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        title={editingCategory ? "Редактирование категории" : "Новая категория"}
      />

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Категория &quot;{deletingCategory?.name}&quot; будет удалена.
              Операции с этой категорией останутся в истории.
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
            <AlertDialogTitle>Удалить выбранные категории?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено категорий: {selectedIds.size}. Операции останутся в истории.
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
