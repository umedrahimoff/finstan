import { useState } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Plus, CheckSquare, Square } from "lucide-react"
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
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { calculateAccountBalance } from "@/lib/accountBalance"
import { formatAmount } from "@/lib/currency"
import { ACCOUNT_TYPES } from "@/features/accounts/accountFormSchema"
import { AccountFormDialog } from "@/features/accounts/AccountFormDialog"
import type { AccountFormValues } from "@/features/accounts/accountFormSchema"

function getAccountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type
}

export function AccountsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addAccount, updateAccount, setPrimaryAccount, deleteAccount } = useAccountsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<{ id: string; name: string; type: string; currency: string } | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<{ id: string; name: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingBatch, setDeletingBatch] = useState(false)

  const accountsWithBalance = accounts.map((acc) => ({
    ...acc,
    balance: calculateAccountBalance(acc.id, transactions),
  }))

  const handleCreate = () => {
    setEditingAccount(null)
    setDialogOpen(true)
  }

  const handleSubmit = (values: AccountFormValues) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, values)
    } else {
      addAccount(values)
    }
    setEditingAccount(null)
    setDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingAccount) {
      deleteAccount(deletingAccount.id)
      setDeletingAccount(null)
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
    if (selectedIds.size === accountsWithBalance.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(accountsWithBalance.map((a) => a.id)))
    }
  }

  const handleBatchDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteAccount(id))
    setSelectedIds(new Set())
    setDeletingBatch(false)
  }

  const totalBalance = accountsWithBalance.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Счета</h1>
          <p className="text-muted-foreground">
            Управление счетами компании
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Добавить счёт
        </Button>
      </div>

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
                  {selectedIds.size === accountsWithBalance.length && accountsWithBalance.length > 0 ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Валюта</TableHead>
              <TableHead className="text-right">Баланс</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Счетов пока нет. Добавьте первый счёт.
                </TableCell>
              </TableRow>
            ) : (
              accountsWithBalance.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="w-[40px]">
                    <button
                      type="button"
                      className="flex items-center justify-center"
                      onClick={() => toggleSelect(acc.id)}
                    >
                      {selectedIds.has(acc.id) ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4 text-muted-foreground" />
                      )}
                    </button>
                    </TableCell>
                  <TableCell>
                    <Link
                      to={`/transactions?account=${acc.id}`}
                      className="font-medium hover:underline"
                    >
                      {acc.name}
                      {acc.isPrimary && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(основной)</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>{getAccountTypeLabel(acc.type)}</TableCell>
                  <TableCell>{acc.currency}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      acc.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatAmount(acc.balance, acc.currency)}
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
                          onClick={() => setPrimaryAccount(acc.id)}
                          disabled={acc.isPrimary}
                        >
                          {acc.isPrimary ? "По умолчанию" : "Сделать по умолчанию"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingAccount(acc)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 size-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingAccount(acc)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {accountsWithBalance.length > 0 && (
        <div className="flex justify-end text-sm">
          <span className="text-muted-foreground">Общий баланс: </span>
          <span
            className={`ml-2 font-semibold ${
              totalBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatAmount(totalBalance, "UZS")}
          </span>
        </div>
      )}

      <AccountFormDialog
        key={editingAccount?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingAccount(null)
        }}
        defaultValues={
          editingAccount
            ? {
                name: editingAccount.name,
                type: editingAccount.type as AccountFormValues["type"],
                currency: editingAccount.currency,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        title={editingAccount ? "Редактирование счёта" : "Новый счёт"}
      />

      <AlertDialog
        open={!!deletingAccount}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить счёт?</AlertDialogTitle>
            <AlertDialogDescription>
              Счёт &quot;{deletingAccount?.name}&quot; будет удалён. Операции,
              привязанные к этому счёту, останутся в истории.
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
            <AlertDialogTitle>Удалить выбранные счета?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено счетов: {selectedIds.size}. Операции останутся в истории.
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
