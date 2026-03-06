import { useState, useEffect, useMemo } from "react"
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
import { TablePagination } from "@/components/TablePagination"
import { useCompanyStore } from "@/stores/useCompanyStore"

interface AppUser {
  id: string
  username: string
  role: string
  frozen?: boolean
  companyIds?: string[]
}

const ROLES = [
  { value: "moderator", label: "Модератор" },
  { value: "admin", label: "Админ" },
] as const

function getRoleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

export function SettingsUsersPage() {
  const { user, refreshProfile } = useAuth()
  const companies = useCompanyStore((s) => s.companies).filter((c) => !c.archived)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null)
  const [freezeUser, setFreezeUser] = useState<AppUser | null>(null)
  const [formUsername, setFormUsername] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<"moderator" | "admin">("moderator")
  const [formCompanyIds, setFormCompanyIds] = useState<Set<string>>(new Set())
  const [formAllCompanies, setFormAllCompanies] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const canManage = user?.role === "admin" || user?.role === "moderator"
  const canCreateAdmin = user?.role === "admin"

  const displayUsers = useMemo(() => {
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
  }, [users, user])

  const paginatedUsers = useMemo(
    () => displayUsers.slice((page - 1) * pageSize, page * pageSize),
    [displayUsers, page, pageSize]
  )

  const loadUsers = () => {
    apiFetch<AppUser[]>("/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    if (!user) return
    loadUsers()
  }, [user])

  const resetForm = () => {
    setFormUsername("")
    setFormPassword("")
    setFormRole("moderator")
    setFormCompanyIds(new Set())
    setFormAllCompanies(true)
    setFormError("")
  }

  const getCompanyIdsToSend = () => {
    if (formAllCompanies || companies.length <= 1) return companies.map((c) => c.id)
    return Array.from(formCompanyIds)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormLoading(true)
    try {
      const companyIds = getCompanyIdsToSend()
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword,
          role: formRole,
          companyIds,
          companies: companies.map((c) => ({ id: c.id, name: c.name })),
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
      const body: { id: string; username?: string; password?: string; role?: string; companyIds?: string[] } = {
        id: editUser.id,
      }
      if (formUsername.trim() !== editUser.username) body.username = formUsername.trim()
      if (formPassword) body.password = formPassword
      if (formRole !== editUser.role) body.role = formRole
      body.companyIds = getCompanyIdsToSend()
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
      await apiFetch(`/users/${encodeURIComponent(deleteUser.id)}`, {
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
    setFormRole((u.role === "admin" ? "admin" : "moderator"))
    const ids = u.companyIds ?? []
    setFormCompanyIds(new Set(ids))
    setFormAllCompanies(ids.length >= companies.length || companies.length <= 1)
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
                    <TableHead>Компании</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Пользователей пока нет
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{getRoleLabel(u.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={(u.companyIds ?? []).map((id) => companies.find((c) => c.id === id)?.name ?? id).join(", ")}>
                          {u.id === user?.uid
                            ? "Все ваши"
                            : (u.companyIds ?? []).length >= companies.length
                              ? "Все"
                              : (u.companyIds ?? []).map((id) => companies.find((c) => c.id === id)?.name ?? id).join(", ") || "—"}
                        </TableCell>
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
                                    onClick={() => { setFormError(""); setDeleteUser(u) }}
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

      {!loading && displayUsers.length > 0 && (
        <TablePagination
          page={page}
          totalPages={Math.ceil(displayUsers.length / pageSize) || 1}
          totalItems={displayUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
        />
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
                onValueChange={(v) => setFormRole(v as "moderator" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  {canCreateAdmin && <SelectItem value="admin">Админ</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label>Доступ к компаниям</Label>
                {companies.length === 1 ? (
                  <p className="text-sm text-muted-foreground">
                    {companies[0].name} (автоматически)
                  </p>
                ) : (
                  <div className="space-y-2 rounded-md border p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAllCompanies}
                        onChange={(e) => {
                          setFormAllCompanies(e.target.checked)
                          if (e.target.checked) setFormCompanyIds(new Set())
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Все компании</span>
                    </label>
                    {!formAllCompanies && (
                      <div className="flex flex-col gap-1.5 pl-6">
                        {companies.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formCompanyIds.has(c.id)}
                              onChange={(e) => {
                                setFormCompanyIds((prev) => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(c.id)
                                  else next.delete(c.id)
                                  return next
                                })
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
                onValueChange={(v) => setFormRole(v as "moderator" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  {canCreateAdmin && editUser?.id !== user?.uid && (
                    <SelectItem value="admin">Админ</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label>Доступ к компаниям</Label>
                {companies.length === 1 ? (
                  <p className="text-sm text-muted-foreground">{companies[0].name}</p>
                ) : (
                  <div className="space-y-2 rounded-md border p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAllCompanies}
                        onChange={(e) => {
                          setFormAllCompanies(e.target.checked)
                          if (e.target.checked) setFormCompanyIds(new Set())
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Все компании</span>
                    </label>
                    {!formAllCompanies && (
                      <div className="flex flex-col gap-1.5 pl-6">
                        {companies.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formCompanyIds.has(c.id)}
                              onChange={(e) => {
                                setFormCompanyIds((prev) => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(c.id)
                                  else next.delete(c.id)
                                  return next
                                })
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) { setDeleteUser(null); setFormError("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь &quot;{deleteUser?.username}&quot; будет удалён. Данные, связанные с ним, останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && <p className="px-6 text-sm text-destructive">{formError}</p>}
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
