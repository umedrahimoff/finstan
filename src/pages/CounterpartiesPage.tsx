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
  } | null>(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState<{
    id: string
    name: string
  } | null>(null)
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
    if (editingCounterparty) {
      updateCounterparty(editingCounterparty.id, values)
    } else {
      addCounterparty(values)
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Сумма по операциям</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCounterparties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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
    </div>
  )
}
