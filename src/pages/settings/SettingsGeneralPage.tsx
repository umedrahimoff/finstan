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
import { getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme"

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor },
]

export function SettingsGeneralPage() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme())

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const handleThemeChange = (value: string) => {
    const t = value as Theme
    setTheme(t)
    setStoredTheme(t)
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
