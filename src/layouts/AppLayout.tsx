import { useState, useEffect } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { ArrowDownLeft, ArrowUpRight, LogOut, Settings, HelpCircle } from "lucide-react"
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
import { OnboardingDialog } from "@/components/OnboardingDialog"
import { useProfileStore } from "@/stores/useProfileStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog"
import type { TransactionFormValues } from "@/features/transactions/transactionFormSchema"
import { calculateAccountBalance } from "@/lib/accountBalance"
import { formatAmount, formatCompact } from "@/lib/currency"
import { getSystemCurrency } from "@/stores/useSettingsStore"

function useDisplayName() {
  const { user } = useAuth()
  const profile = useProfileStore((s) => s.profile)
  if (!user) return "Пользователь"
  const full = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  return full || user.username
}

const ONBOARDING_KEY = (uid: string) => `finstan-onboarding-shown-${uid}`

export function AppLayout() {
  const { user, refreshProfile } = useAuth()
  const displayName = useDisplayName()
  const navigate = useNavigate()
  const loadProfile = useProfileStore((s) => s.load)
  const [quickAddType, setQuickAddType] = useState<"income" | "expense" | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])
  useEffect(() => {
    if (user?.uid) loadProfile(user.uid)
  }, [user?.uid])
  useEffect(() => {
    if (!user?.uid) return
    if (!localStorage.getItem(ONBOARDING_KEY(user.uid))) {
      setOnboardingOpen(true)
    }
  }, [user?.uid])

  const handleLogout = () => {
    clearToken()
    navigate("/login", { replace: true })
    window.location.reload()
  }
  const addTransaction = useTransactionsStore((s) => s.addTransaction)
  const accounts = useAccountsStore((s) => s.accounts)
  const transactions = useTransactionsStore((s) => s.transactions)

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
      currency: getSystemCurrency(),
      amount: 0,
      accountId: primaryAccountId,
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar onOpenOnboarding={() => setOnboardingOpen(true)} />
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
            <div className="flex items-center gap-1 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => setOnboardingOpen(true)}
                  >
                    <HelpCircle className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Инструкция</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {displayName}
                    <Settings className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/app/settings">Настройки</Link>
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

      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={() => user?.uid && localStorage.setItem(ONBOARDING_KEY(user.uid), "1")}
      />
    </SidebarProvider>
  )
}
