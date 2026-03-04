import { useState, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import {
  getStoredTheme,
  setStoredTheme,
  type Theme,
} from "@/lib/theme"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { useAccountsStore } from "@/stores/useAccountsStore"
import { useCategoriesStore } from "@/stores/useCategoriesStore"
import { useCounterpartiesStore } from "@/stores/useCounterpartiesStore"
import { useBudgetsStore } from "@/stores/useBudgetsStore"
import { usePlannedPaymentsStore } from "@/stores/usePlannedPaymentsStore"
import { useProjectsStore } from "@/stores/useProjectsStore"

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor },
]

export function SettingsPage() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme())
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // We need to check - do the stores have a way to reset? Let me check the store structure.

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const handleThemeChange = (value: string) => {
    const t = value as Theme
    setTheme(t)
    setStoredTheme(t)
  }

  const handleExportData = () => {
    const data = {
      transactions: useTransactionsStore.getState().transactions,
      accounts: useAccountsStore.getState().accounts,
      categories: useCategoriesStore.getState().categories,
      counterparties: useCounterpartiesStore.getState().counterparties,
      budgets: useBudgetsStore.getState().budgets,
      plannedPayments: usePlannedPaymentsStore.getState().plannedPayments,
      projects: useProjectsStore.getState().projects,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finstan-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    window.location.reload()
    setResetDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Общие настройки приложения
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Внешний вид</CardTitle>
            <CardDescription>
              Выберите тему оформления
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="theme" className="min-w-[80px]">
                Тема
              </Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className="size-4" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Данные</CardTitle>
            <CardDescription>
              Экспорт и сброс данных
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleExportData}>
                Экспорт данных
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setResetDialogOpen(true)}
              >
                Сбросить все данные
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Экспорт сохраняет все операции, счета, категории, контрагентов,
              бюджеты, запланированные платежи и проекты в JSON-файл.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Метрики для стартапа</CardTitle>
            <CardDescription>
              MRR считается по категориям доходов с флагом «Учитывать в MRR».
              Отредактируйте категорию и отметьте галочку для подписок.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">О приложении</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Finstan — система управления финансами бизнеса. Версия 0.1.0
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Все данные будут удалены и восстановлены к начальным значениям.
              Страница будет перезагружена. Рекомендуется сначала экспортировать
              данные для резервной копии.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Сбросить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
