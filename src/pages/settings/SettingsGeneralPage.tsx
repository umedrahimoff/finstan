import { useState, useEffect, useMemo } from "react"
import { Moon, Sun, Monitor, Banknote } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme"
import { CURRENCIES } from "@/lib/currencies"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor },
]

function useHasAnyData(): boolean {
  const byCompany = useCompanyDataStore((s) => s.byCompany)
  return useMemo(() => {
    for (const data of Object.values(byCompany)) {
      if (
        (data.transactions?.length ?? 0) > 0 ||
        (data.accounts?.length ?? 0) > 0 ||
        (data.budgets?.length ?? 0) > 0 ||
        (data.plannedPayments?.length ?? 0) > 0
      ) {
        return true
      }
    }
    return false
  }, [byCompany])
}

export function SettingsGeneralPage() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme())
  const systemCurrency = useSettingsStore((s) => s.systemCurrency)
  const setSystemCurrency = useSettingsStore((s) => s.setSystemCurrency)
  const hasData = useHasAnyData()

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const handleThemeChange = (value: string) => {
    const t = value as Theme
    setTheme(t)
    setStoredTheme(t)
  }

  const handleCurrencyChange = (value: string) => {
    setSystemCurrency(value as (typeof CURRENCIES)[number]["value"])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Общие</h2>
        <p className="text-sm text-muted-foreground">
          Внешний вид и базовые настройки
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Валюта системы</CardTitle>
          <CardDescription>
            {hasData
              ? "Валюта заблокирована — в системе есть данные или операции"
              : "Валюта по умолчанию для новых счетов и операций. Можно изменить только при отсутствии данных."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="currency" className="min-w-[80px]">
              Валюта
            </Label>
            <Select
              value={systemCurrency}
              onValueChange={handleCurrencyChange}
              disabled={hasData}
            >
              <SelectTrigger id="currency" className="w-[240px]">
                <span className="flex items-center gap-2">
                  <Banknote className="size-4" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Внешний вид</CardTitle>
          <CardDescription>Выберите тему оформления</CardDescription>
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
    </div>
  )
}
