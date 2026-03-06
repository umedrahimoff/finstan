import { useState, useEffect } from "react"
import { UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/api/client"

interface TenantUser {
  id: string
  username: string
  role: string
  tenant_id: string
  created_at?: string
}

export function ManagementPage() {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [formUsername, setFormUsername] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const loadUsers = () => {
    apiFetch<TenantUser[]>("/management/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormLoading(true)
    try {
      await apiFetch("/management/users", {
        method: "POST",
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword,
        }),
      })
      setFormUsername("")
      setFormPassword("")
      setCreateOpen(false)
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление</h1>
          <p className="text-muted-foreground">
            Создание организаций. Каждый пользователь может создать свою компанию при первом входе.
          </p>
        </div>
        <Button onClick={() => { setFormError(""); setCreateOpen(true) }}>
          <UserPlus className="mr-2 size-4" />
          Создать организацию
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Созданные организации
          </CardTitle>
          <CardDescription>
            Пользователи, которые могут войти и создать свою компанию. У каждого свои настройки и пользователи.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Организаций пока нет. Создайте первого пользователя — он сможет войти и создать свою компанию.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логин</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.role === "admin" ? "Админ" : u.role}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); setFormError("") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новая организация</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Создайте пользователя. Он сможет войти, создать свою компанию и управлять своими пользователями в настройках.
            </p>
            <div className="space-y-2">
              <Label htmlFor="mgmt-username">Логин</Label>
              <Input
                id="mgmt-username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="org_admin"
                minLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgmt-password">Пароль</Label>
              <Input
                id="mgmt-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="••••••••"
                minLength={4}
                required
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "..." : "Создать"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
