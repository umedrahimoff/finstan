import { useState, useEffect } from "react"
import { UserPlus, MoreHorizontal, Pencil, Trash2, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  frozen?: boolean
}

const ROLES = [
  { value: "user", label: "Пользователь" },
  { value: "moderator", label: "Модератор" },
  { value: "admin", label: "Админ" },
] as const

function getRoleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

export function SettingsUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null)
  const [freezeUser, setFreezeUser] = useState<AppUser | null>(null)
  const [formUsername, setFormUsername] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<"user" | "moderator" | "admin">("user")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const canManage = user?.role === "admin" || user?.role === "moderator"
  const canCreateAdmin = user?.role === "admin"

  const displayUsers = (() => {
    const fromApi = users
    if (!user) return fromApi
    const currentInList = fromApi.some((u) => u.id === user.uid)
    if (!currentInList) {
      return [
        { id: user.uid, username: user.username, role: user.role, frozen: false },
        ...fromApi,
      ]
    }
    return fromApi
  })()

  const loadUsers = () => {
    apiFetch<AppUser[]>("/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) return
    loadUsers()
  }, [user])

  const resetForm = () => {
    setFormUsername("")
    setFormPassword("")
    setFormRole("user")
    setFormError("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormLoading(true)
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword,
          role: formRole,
        }),
      })
      resetForm()
      setCreateOpen(false)
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setFormError("")
    setFormLoading(true)
    try {
      const body: { id: string; username?: string; password?: string; role?: string } = {
        id: editUser.id,
      }
      if (formUsername.trim() !== editUser.username) body.username = formUsername.trim()
      if (formPassword) body.password = formPassword
      if (formRole !== editUser.role) body.role = formRole
      await apiFetch("/users", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      resetForm()
      setEditUser(null)
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      await apiFetch(`/users?id=${encodeURIComponent(deleteUser.id)}`, {
        method: "DELETE",
      })
      setDeleteUser(null)
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const handleFreeze = async () => {
    if (!freezeUser) return
    try {
      await apiFetch("/users", {
        method: "PATCH",
        body: JSON.stringify({ id: freezeUser.id, frozen: !freezeUser.frozen }),
      })
      setFreezeUser(null)
      loadUsers()
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const openEdit = (u: AppUser) => {
    setEditUser(u)
    setFormUsername(u.username)
    setFormPassword("")
    setFormRole((u.role as "user" | "moderator" | "admin") || "user")
    setFormError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Пользователи</h2>
          <p className="text-sm text-muted-foreground">
            Управление пользователями, ролями и блокировкой
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateOpen(true) }}
          className="shrink-0"
        >
          <UserPlus className="mr-2 size-4" />
          Добавить пользователя
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Логин</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Пользователей пока нет
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{getRoleLabel(u.role)}</TableCell>
                        <TableCell>
                          {u.frozen ? (
                            <span className="inline-flex items-center gap-1.5 text-destructive text-sm">
                              <Ban className="size-3.5" />
                              Заблокирован
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-green-600 text-sm">
                              <CheckCircle className="size-3.5" />
                              Активен
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="w-[50px]">
                          {canManage && u.id !== user?.uid ? (
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
                                  <DropdownMenuItem
                                    onClick={() => setFreezeUser(u)}
                                    disabled={u.id === user?.uid}
                                  >
                                    {u.frozen ? (
                                      <>
                                        <CheckCircle className="mr-2 size-4" />
                                        Разблокировать
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="mr-2 size-4" />
                                        Заблокировать
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteUser(u)}
                                    disabled={u.id === user?.uid}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Удалить
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : u.id === user?.uid ? (
                              <div className="flex size-8 items-center justify-center">
                                <span className="text-xs text-muted-foreground">Вы</span>
                              </div>
                            ) : (
                              <div className="size-8" />
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">Логин</Label>
              <Input
                id="create-username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="user1"
                minLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Пароль</Label>
              <Input
                id="create-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="••••••••"
                minLength={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={formRole}
                onValueChange={(v) => setFormRole(v as "user" | "moderator" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  {canCreateAdmin && <SelectItem value="admin">Админ</SelectItem>}
                </SelectContent>
              </Select>
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

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Логин</Label>
              <Input
                id="edit-username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="user1"
                minLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Новый пароль</Label>
              <Input
                id="edit-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={formRole}
                onValueChange={(v) => setFormRole(v as "user" | "moderator" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  {canCreateAdmin && editUser?.id !== user?.uid && (
                    <SelectItem value="admin">Админ</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь &quot;{deleteUser?.username}&quot; будет удалён. Данные, связанные с ним, останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Freeze confirm */}
      <AlertDialog open={!!freezeUser} onOpenChange={(o) => !o && setFreezeUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {freezeUser?.frozen ? "Разблокировать пользователя?" : "Заблокировать пользователя?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {freezeUser?.frozen
                ? `Пользователь "${freezeUser?.username}" снова сможет войти в систему.`
                : `Пользователь "${freezeUser?.username}" не сможет войти до разблокировки.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleFreeze}>
              {freezeUser?.frozen ? "Разблокировать" : "Заблокировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
