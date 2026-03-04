import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/AuthProvider"
import { ensureUserDoc, updateUserProfile } from "@/lib/userRoles"

function parseDisplayName(displayName: string | null): [string, string] {
  if (!displayName?.trim()) return ["", ""]
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], ""]
  return [parts[0], parts.slice(1).join(" ")]
}

export function SettingsProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? "")
      setLastName(profile.lastName ?? "")
      setPhone(profile.phone ?? "")
    } else if (user) {
      const [first, last] = parseDisplayName(user.displayName)
      setFirstName(first)
      setLastName(last)
    }
  }, [profile, user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError("")
    try {
      await ensureUserDoc(
        user.uid,
        user.email ?? null,
        user.displayName ?? null,
        user.photoURL ?? null
      )
      await updateUserProfile(user.uid, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
      })
      await refreshProfile()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="text-sm text-muted-foreground">
          Имя, почта и другие данные вашего аккаунта
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Личные данные</CardTitle>
          <CardDescription>
            Редактируйте имя, фамилию и контактные данные
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Почта</Label>
                <Input
                  id="email"
                  value={user.email ?? ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Почта привязана к аккаунту Google и не редактируется
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
