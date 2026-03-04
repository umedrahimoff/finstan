import { useState } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"
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
import { useBudgetsStore } from "@/stores/useBudgetsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { formatAmount } from "@/lib/currency"
import { BudgetFormDialog } from "@/features/budgets/BudgetFormDialog"
import { MONTH_NAMES } from "@/features/budgets/budgetFormSchema"
import type { BudgetFormValues } from "@/features/budgets/budgetFormSchema"
import type { Budget } from "@/types"

function getSpentForBudget(
  budget: Budget,
  transactions: { categoryId?: string; type: string; amount: number; date: string }[]
): number {
  const [year, month] = [budget.year, budget.month]
  return transactions.reduce((sum, tx) => {
    if (tx.categoryId !== budget.categoryId || tx.type !== "expense") return sum
    const [txYear, txMonth] = tx.date.split("-").map(Number)
    if (txYear !== year || txMonth !== month) return sum
    return sum + tx.amount
  }, 0)
}

export function BudgetsPage() {
  const budgets = useBudgetsStore((s) => s.budgets)
  const categories = useCategoriesStore((s) => s.categories)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addBudget, updateBudget, deleteBudget } = useBudgetsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—"

  const handleSubmit = (values: BudgetFormValues) => {
    const payload = {
      categoryId: values.categoryId,
      year: values.year,
      month: values.month,
      amount: values.amount,
      currency: values.currency,
    }
    if (editingBudget) {
      updateBudget(editingBudget.id, payload)
    } else {
      addBudget(payload)
    }
    setEditingBudget(null)
    setDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingBudget) {
      deleteBudget(deletingBudget.id)
      setDeletingBudget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Бюджеты</h1>
          <p className="text-muted-foreground">
            Планирование и контроль расходов по категориям
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Добавить бюджет
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Категория</TableHead>
              <TableHead>Период</TableHead>
              <TableHead className="text-right">Лимит</TableHead>
              <TableHead className="text-right">Потрачено</TableHead>
              <TableHead className="min-w-[120px]">Использование</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Бюджетов пока нет. Добавьте первый бюджет по категории расходов.
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((budget) => {
                const spent = getSpentForBudget(budget, transactions)
                const pct = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0
                const over = spent > budget.amount
                return (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <Link
                        to={`/transactions?category=${budget.categoryId}`}
                        className="font-medium hover:underline"
                      >
                        {getCategoryName(budget.categoryId)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[budget.month]} {budget.year}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(budget.amount, budget.currency)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        over ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {formatAmount(spent, budget.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-colors ${
                            over ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
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
                              setEditingBudget(budget)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingBudget(budget)}
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

      <BudgetFormDialog
        key={editingBudget?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingBudget(null)
        }}
        defaultValues={
          editingBudget
            ? {
                categoryId: editingBudget.categoryId,
                year: editingBudget.year,
                month: editingBudget.month,
                amount: editingBudget.amount,
                currency: editingBudget.currency,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        title={editingBudget ? "Редактировать бюджет" : "Новый бюджет"}
      />

      <AlertDialog
        open={!!deletingBudget}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бюджет?</AlertDialogTitle>
            <AlertDialogDescription>
              Бюджет по категории &quot;{deletingBudget && getCategoryName(deletingBudget.categoryId)}&quot; за {deletingBudget && MONTH_NAMES[deletingBudget.month]} {deletingBudget?.year} будет удалён.
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
    </div>
  )
}
