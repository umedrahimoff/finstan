import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/providers/AuthProvider"
import {
  getAllUsers,
  getAllInvites,
  createInvite,
  deleteInviteById,
  setUserRole,
  type AppUser,
  type UserInvite,
  type UserRole,
} from "@/lib/userRoles"
import { Users, UserPlus, Trash2 } from "lucide-react"

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  moderator: "Модератор",
}

const ROLE_OPTIONS: { value: UserRole | "none"; label: string; desc: string }[] = [
  { value: "none", label: "Без роли", desc: "Обычный доступ, без прав управления" },
  { value: "moderator", label: "Модератор", desc: "Может управлять пользователями (кроме администратора)" },
]

export function SettingsUsersPage() {
  const { user, role } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [invites, setInvites] = useState<UserInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createEmail, setCreateEmail] = useState("")
  const [createRole, setCreateRole] = useState<UserRole | "none">("none")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const loadData = () => {
    Promise.all([getAllUsers(), getAllInvites()])
      .then(([list, invs]) => {
        setUsers(list)
        setInvites(invs)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateInvite = async () => {
    if (!user) return
    setCreating(true)
    setCreateError("")
    try {
      await createInvite(
        createEmail,
        createRole === "none" ? null : createRole,
        user.uid
      )
      setCreateEmail("")
      setCreateRole("none")
      setCreateOpen(false)
      loadData()
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!user) return
    try {
      await deleteInviteById(inviteId, user.uid)
      loadData()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleSetRole = async (targetUid: string, newRole: UserRole | null) => {
    if (!user) return
    setUpdating(targetUid)
    setError("")
    try {
      await setUserRole(targetUid, newRole, user.uid)
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUid ? { ...u, role: newRole } : u
        )
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUpdating(null)
    }
  }

  const isAdmin = role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Пользователи</h2>
        <p className="text-sm text-muted-foreground">
          Добавьте пользователя по email — он сможет войти через Google. Без приглашения вход запрещён.
          Администратор по умолчанию: thisisumed@gmail.com
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Пользователи</CardTitle>
            <CardDescription>
              Роли: Администратор (один, не удаляется), Модератор (назначается администратором)
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              Добавить пользователя
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground">
              Только администратор может управлять пользователями.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium">Нет пользователей</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Добавьте пользователя по email — после приглашения он сможет войти через Google.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <p className="mb-4 text-sm text-destructive">{error}</p>
              )}
              {invites.length > 0 && (
                <div className="mb-4 rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium">Ожидают входа</p>
                  <div className="space-y-2">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span>{inv.email}</span>
                        <span className="text-muted-foreground">
                          {inv.role ? ROLE_LABELS[inv.role] : "Без роли"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInvite(inv.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead className="w-[200px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell>{u.displayName ?? "—"}</TableCell>
                      <TableCell>
                        {u.role ? ROLE_LABELS[u.role] : "—"}
                      </TableCell>
                      <TableCell>
                        {u.role === "admin" ? (
                          <span className="text-sm text-muted-foreground">
                            Нельзя изменить
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={u.role === "moderator" ? "default" : "outline"}
                              disabled={updating === u.uid}
                              onClick={() =>
                                handleSetRole(u.uid, u.role === "moderator" ? null : "moderator")
                              }
                            >
                              {updating === u.uid ? "..." : "Модератор"}
                            </Button>
                            {u.role === "moderator" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updating === u.uid}
                                onClick={() => handleSetRole(u.uid, null)}
                              >
                                Снять роль
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
            <DialogDescription>
              Укажите email. Пользователь сможет войти через Google только после приглашения. При первом входе ему будет назначена выбранная роль.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={createRole}
                onValueChange={(v) => setCreateRole(v as UserRole | "none")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_OPTIONS.find((o) => o.value === createRole)?.desc}
              </p>
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateInvite} disabled={creating}>
              {creating ? "Создание..." : "Создать приглашение"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
