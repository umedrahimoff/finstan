import { useState, useEffect } from "react"
import { Users, UserPlus, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/providers/AuthProvider"
import { apiFetch } from "@/api/client"

interface AppUser {
  id: string
  username: string
  role: string
}

export function SettingsUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"moderator" | "admin">("moderator")
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState("")

  const canAdd = user?.role === "admin" || user?.role === "moderator"

  useEffect(() => {
    if (!user) return
    apiFetch<AppUser[]>("/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [user])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setAddLoading(true)
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password, role }),
      })
      setUsername("")
      setPassword("")
      const list = await apiFetch<AppUser[]>("/users")
      setUsers(list)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Пользователи</h2>
        <p className="text-sm text-muted-foreground">
          Управление пользователями и добавление модераторов
        </p>
      </div>

      {canAdd && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="size-4" />
            Добавить модератора
          </CardTitle>
          <CardDescription>
            Создайте нового пользователя с ролью модератор или админ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-username">Логин</Label>
                <Input
                  id="new-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="moderator1"
                  minLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={4}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "moderator" | "admin")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={addLoading}>
              {addLoading ? "..." : "Добавить"}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Список пользователей
          </CardTitle>
          <CardDescription>Все пользователи системы</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="font-medium">{u.username}</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Shield className="size-3.5" />
                    {u.role === "admin" ? "Админ" : u.role === "moderator" ? "Модератор" : "Пользователь"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
