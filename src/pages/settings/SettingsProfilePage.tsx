import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/AuthProvider"
import { useProfileStore } from "@/stores/useProfileStore"
import type { UserProfile } from "@/lib/profileStorage"

export function SettingsProfilePage() {
  const { user } = useAuth()
  const { profile, load, save } = useProfileStore()
  const [local, setLocal] = useState<UserProfile>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      load(user.uid)
    }
  }, [user?.uid, load])

  useEffect(() => {
    setLocal(profile)
  }, [profile])

  const handleChange = (field: keyof UserProfile, value: string) => {
    setLocal((p) => ({ ...p, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.uid) {
      save(user.uid, local)
      setSaved(true)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="text-sm text-muted-foreground">
          Имя, контакты и другие данные
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Данные пользователя
          </CardTitle>
          <CardDescription>Логин: {user.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  value={local.firstName ?? ""}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Иван"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={local.lastName ?? ""}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Иванов"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Почта</Label>
              <Input
                id="email"
                type="email"
                value={local.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="ivan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={local.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+7 999 123-45-67"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Сохранить</Button>
              {saved && (
                <span className="text-sm text-muted-foreground">Сохранено</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
