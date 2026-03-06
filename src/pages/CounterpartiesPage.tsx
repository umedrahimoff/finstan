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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { formatAmount } from "@/lib/currency"
import { COUNTERPARTY_TYPES } from "@/features/counterparties/counterpartyFormSchema"
import { CounterpartyFormDialog } from "@/features/counterparties/CounterpartyFormDialog"
import type { CounterpartyFormValues } from "@/features/counterparties/counterpartyFormSchema"

function getCounterpartyTypeLabel(type: string) {
  return COUNTERPARTY_TYPES.find((t) => t.value === type)?.label ?? type
}

export function CounterpartiesPage() {
  const counterparties = useCounterpartiesStore((s) => s.counterparties)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addCounterparty, updateCounterparty, deleteCounterparty } =
    useCounterpartiesStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCounterparty, setEditingCounterparty] = useState<{
    id: string
    name: string
    type: string
    inn?: string
    country?: string
    contactName?: string
    contactPhone?: string
    contactEmail?: string
  } | null>(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"all" | "client" | "supplier" | "partner">("all")

  const filteredCounterparties =
    typeFilter === "all"
      ? counterparties
      : counterparties.filter((c) => c.type === typeFilter)

  const getCounterpartyTotal = (counterpartyId: string) => {
    return transactions.reduce((sum, tx) => {
      if (tx.counterpartyId !== counterpartyId) return sum
      if (tx.type === "income") return sum + tx.amount
      if (tx.type === "expense") return sum - tx.amount
      return sum
    }, 0)
  }

  const handleCreate = () => {
    setEditingCounterparty(null)
    setDialogOpen(true)
  }

  const handleSubmit = (values: CounterpartyFormValues) => {
    const cleaned = {
      ...values,
      inn: values.inn?.trim() || undefined,
      country: values.country?.trim() || undefined,
      contactName: values.contactName?.trim() || undefined,
      contactPhone: values.contactPhone?.trim() || undefined,
      contactEmail: values.contactEmail?.trim() || undefined,
    }
    if (editingCounterparty) {
      updateCounterparty(editingCounterparty.id, cleaned)
    } else {
      addCounterparty(cleaned)
    }
    setEditingCounterparty(null)
    setDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingCounterparty) {
      deleteCounterparty(deletingCounterparty.id)
      setDeletingCounterparty(null)
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
    if (selectedIds.size === filteredCounterparties.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCounterparties.map((c) => c.id)))
    }
  }

  const handleBatchDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteCounterparty(id))
    setSelectedIds(new Set())
    setDeletingBatch(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Контрагенты</h1>
          <p className="text-muted-foreground">
            Клиенты, поставщики и партнёры
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Добавить контрагента
        </Button>
      </div>

      <Tabs
        value={typeFilter}
        onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="client">Клиенты</TabsTrigger>
          <TabsTrigger value="supplier">Поставщики</TabsTrigger>
          <TabsTrigger value="partner">Партнёры</TabsTrigger>
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
                  {selectedIds.size === filteredCounterparties.length && filteredCounterparties.length > 0 ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>ИНН</TableHead>
              <TableHead>Страна</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead className="text-right">Сумма по операциям</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCounterparties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Контрагентов пока нет. Добавьте первого контрагента.
                </TableCell>
              </TableRow>
            ) : (
              filteredCounterparties.map((cp) => {
                const total = getCounterpartyTotal(cp.id)
                return (
                  <TableRow key={cp.id}>
                    <TableCell className="w-[40px]">
                      <button
                        type="button"
                        className="flex items-center justify-center"
                        onClick={() => toggleSelect(cp.id)}
                      >
                        {selectedIds.has(cp.id) ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/transactions?counterparty=${cp.id}`}
                        className="font-medium hover:underline"
                      >
                        {cp.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {getCounterpartyTypeLabel(cp.type)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cp.inn ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cp.country ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                      {[cp.contactName, cp.contactPhone, cp.contactEmail]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        total >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(Math.abs(total), "UZS")}
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
                              setEditingCounterparty(cp)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingCounterparty(cp)}
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

      <CounterpartyFormDialog
        key={editingCounterparty?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCounterparty(null)
        }}
        defaultValues={
          editingCounterparty
            ? {
                name: editingCounterparty.name,
                type: editingCounterparty.type as CounterpartyFormValues["type"],
                inn: editingCounterparty.inn ?? "",
                country: editingCounterparty.country ?? "",
                contactName: editingCounterparty.contactName ?? "",
                contactPhone: editingCounterparty.contactPhone ?? "",
                contactEmail: editingCounterparty.contactEmail ?? "",
              }
            : undefined
        }
        onSubmit={handleSubmit}
        title={
          editingCounterparty
            ? "Редактирование контрагента"
            : "Новый контрагент"
        }
      />

      <AlertDialog
        open={!!deletingCounterparty}
        onOpenChange={(open) => !open && setDeletingCounterparty(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить контрагента?</AlertDialogTitle>
            <AlertDialogDescription>
              Контрагент &quot;{deletingCounterparty?.name}&quot; будет удалён.
              Операции с этим контрагентом останутся в истории.
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
            <AlertDialogTitle>Удалить выбранных контрагентов?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено контрагентов: {selectedIds.size}. Операции останутся в истории.
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
