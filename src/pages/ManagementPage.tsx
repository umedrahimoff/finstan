import { useState, useEffect } from "react"
import { MoreHorizontal, Pencil, Snowflake, Trash2, UserPlus, Users, X } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/api/client"

interface TenantUser {
  id: string
  username: string
  role: string
  tenant_id: string
  frozen?: boolean
  created_at?: string
  last_login_at?: string | null
  transactions?: number
  accounts?: number
  last_activity?: string | null
}

export function ManagementPage() {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [formUsername, setFormUsername] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [editUser, setEditUser] = useState<TenantUser | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [deleteUser, setDeleteUser] = useState<TenantUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const openEdit = (u: TenantUser) => {
    setEditUser(u)
    setEditUsername(u.username)
    setEditPassword("")
    setEditError("")
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditError("")
    setEditLoading(true)
    try {
      const body: { username?: string; password?: string; frozen?: boolean } = {}
      if (editUsername.trim() !== editUser.username) body.username = editUsername.trim()
      if (editPassword) body.password = editPassword
      if (Object.keys(body).length === 0) {
        setEditError("Измените логин или пароль")
        setEditLoading(false)
        return
      }
      await apiFetch(`/management/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      setEditUser(null)
      loadUsers()
    } catch (err) {
      setEditError((err as Error).message)
    } finally {
      setEditLoading(false)
    }
  }

  const handleFreeze = async (u: TenantUser) => {
    try {
      await apiFetch(`/management/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ frozen: !u.frozen }),
      })
      setFormError("")
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleteLoading(true)
    try {
      await apiFetch(`/management/users/${deleteUser.id}`, { method: "DELETE" })
      setDeleteUser(null)
      setFormError("")
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {formError && !createOpen && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span>{formError}</span>
          <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => setFormError("")}>
            <X className="size-4" />
          </Button>
        </div>
      )}
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
                  <TableHead>Статус</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead>Статистика</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.role === "admin" ? "Админ" : u.role}</TableCell>
                    <TableCell>
                      {u.frozen ? (
                        <span className="text-destructive">Заморожена</span>
                      ) : (
                        <span className="text-muted-foreground">Активна</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.transactions ?? 0} опер. · {u.accounts ?? 0} счетов
                      {u.last_activity && (
                        <span className="block text-xs">
                          Последняя: {new Date(u.last_activity).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="mr-2 size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFreeze(u)}>
                            <Snowflake className="mr-2 size-4" />
                            {u.frozen ? "Разморозить" : "Заморозить"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteUser(u)}>
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); setEditError("") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать организацию</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Логин</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="org_admin"
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Новый пароль (оставьте пустым, чтобы не менять)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="••••••••"
                minLength={4}
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить организацию?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут удалены пользователь {deleteUser?.username} и вся организация со всеми данными. Это нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? "..." : "Удалить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
