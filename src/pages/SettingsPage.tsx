import { SettingsLayout } from "@/layouts/SettingsLayout"

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Общие настройки приложения
        </p>
      </div>
      <SettingsLayout />
    </div>
  )
}
