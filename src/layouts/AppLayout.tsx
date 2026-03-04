import { useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { ArrowDownLeft, ArrowUpRight, LogOut, User } from "lucide-react"
import { clearToken } from "@/api/client"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/AuthProvider"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog"
import type { TransactionFormValues } from "@/features/transactions/transactionFormSchema"
import { calculateAccountBalance } from "@/lib/accountBalance"
import { formatAmount, formatCompact } from "@/lib/currency"

export function AppLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [quickAddType, setQuickAddType] = useState<"income" | "expense" | null>(null)
  const addTransaction = useTransactionsStore((s) => s.addTransaction)
  const accounts = useAccountsStore((s) => s.accounts)
  const transactions = useTransactionsStore((s) => s.transactions)

  const handleLogout = () => {
    clearToken()
    navigate("/login", { replace: true })
    window.location.reload()
  }

  const handleQuickAddSubmit = (values: TransactionFormValues) => {
    addTransaction(values)
    setQuickAddType(null)
  }

  const primaryAccountId = accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id ?? ""
  const getQuickAddDefaults = (): Partial<TransactionFormValues> | undefined => {
    if (!quickAddType) return undefined
    return {
      type: quickAddType,
      date: new Date().toISOString().slice(0, 10),
      currency: "UZS",
      amount: 0,
      accountId: primaryAccountId,
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {accounts.length === 0 ? (
                <span className="text-sm text-muted-foreground px-2">
                  Нет счетов
                </span>
              ) : (
              accounts.map((acc) => {
                const balance = calculateAccountBalance(acc.id, transactions)
                return (
                  <Tooltip key={acc.id}>
                    <TooltipTrigger asChild>
                        <Link
                          to={`/transactions?account=${acc.id}`}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-muted/80"
                        >
                          <span className="text-muted-foreground truncate max-w-[100px]">
                            {acc.name}
                          </span>
                          <span
                            className={`font-medium tabular-nums ${
                              balance >= 0 ? "text-foreground" : "text-destructive"
                            }`}
                          >
                            {formatCompact(balance, acc.currency)}
                          </span>
                        </Link>
                      </TooltipTrigger>
                    <TooltipContent>
                      <p>{acc.name}</p>
                      <p className="font-medium">{formatAmount(balance, acc.currency)}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })
              )}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                onClick={() => setQuickAddType("income")}
              >
                <ArrowDownLeft className="mr-1.5 size-4" />
                Доход
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setQuickAddType("expense")}
              >
                <ArrowUpRight className="mr-1.5 size-4" />
                Расход
              </Button>
            </div>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {(profile?.photoURL ?? user?.photoURL) ? (
                      <img
                        src={profile?.photoURL ?? user?.photoURL ?? ""}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings/profile">Профиль</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Настройки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>

      {quickAddType && (
        <TransactionFormDialog
          key={quickAddType}
          open={true}
          onOpenChange={(open) => !open && setQuickAddType(null)}
          defaultValues={getQuickAddDefaults()}
          onSubmit={handleQuickAddSubmit}
          title={quickAddType === "income" ? "Быстрый доход" : "Быстрый расход"}
        />
      )}
    </SidebarProvider>
  )
}
