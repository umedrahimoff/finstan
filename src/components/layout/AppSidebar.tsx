import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  FolderTree,
  Users,
  Calendar,
  PiggyBank,
  BarChart3,
  FileText,
  Settings,
  FolderKanban,
  ChevronDown,
  Building2,
  Plus,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Главная" },
  { to: "/app/transactions", icon: Repeat, label: "Операции" },
  { to: "/app/accounts", icon: Wallet, label: "Счета" },
  { to: "/app/categories", icon: FolderTree, label: "Категории" },
  { to: "/app/counterparties", icon: Users, label: "Контрагенты" },
  { to: "/app/calendar", icon: Calendar, label: "Платежный календарь" },
  { to: "/app/budgets", icon: PiggyBank, label: "Бюджеты" },
  { to: "/app/reports", icon: FileText, label: "Отчеты" },
  { to: "/app/analytics", icon: BarChart3, label: "Аналитика" },
  { to: "/app/projects", icon: FolderKanban, label: "Проекты" },
]

export function AppSidebar() {
  const location = useLocation()
  const { state: sidebarState } = useSidebar()
  const companies = useCompanyStore((s) => s.companies)
  const currentCompanyId = useCompanyStore((s) => s.currentCompanyId)
  const setCurrentCompany = useCompanyStore((s) => s.setCurrentCompany)
  const addCompany = useCompanyStore((s) => s.addCompany)
  const updateCompany = useCompanyStore((s) => s.updateCompany)
  const archiveCompany = useCompanyStore((s) => s.archiveCompany)
  const unarchiveCompany = useCompanyStore((s) => s.unarchiveCompany)
  const deleteCompany = useCompanyStore((s) => s.deleteCompany)
  const initCompanyIfNeeded = useCompanyDataStore((s) => s.initCompanyIfNeeded)
  const removeCompanyData = useCompanyDataStore((s) => s.removeCompanyData)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [nameValue, setNameValue] = useState("")

  const activeCompanies = companies.filter((c) => !c.archived)
  const archivedCompanies = companies.filter((c) => c.archived)
  const currentCompany =
    companies.find((c) => c.id === currentCompanyId) ?? activeCompanies[0]
  const canDelete = activeCompanies.length > 1

  const handleCreateCompany = () => {
    const name = nameValue.trim() || "Новая компания"
    const company = addCompany(name)
    initCompanyIfNeeded(company.id)
    setNameValue("")
    setCreateOpen(false)
  }

  const handleEditCompany = () => {
    if (!currentCompany) return
    updateCompany(currentCompany.id, { name: nameValue.trim() || currentCompany.name })
    setNameValue("")
    setEditOpen(false)
  }

  const handleArchiveCompany = () => {
    if (!currentCompany) return
    archiveCompany(currentCompany.id)
    setArchiveOpen(false)
  }

  const handleDeleteCompany = () => {
    if (!currentCompany || !canDelete) return
    removeCompanyData(currentCompany.id)
    deleteCompany(currentCompany.id)
    setDeleteOpen(false)
  }

  const openEdit = () => {
    setNameValue(currentCompany?.name ?? "")
    setEditOpen(true)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            F
          </div>
          <span className="font-semibold group-data-[collapsible=icon]:hidden">Finstan</span>
        </div>
      </SidebarHeader>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Новая компания</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Название"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCompany()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-1 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleCreateCompany}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Редактировать</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Название"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditCompany()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-1 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleEditCompany}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Архивировать компанию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{currentCompany?.name}» будет скрыта из списка. Данные сохранятся, компанию можно восстановить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCompany}>
              Архивировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить компанию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{currentCompany?.name}» и все её данные будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Компания</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between">
                          <span className="flex items-center gap-2 truncate">
                            <Building2 className="size-4 shrink-0" />
                            {currentCompany?.name ?? "Компания"}
                          </span>
                          <ChevronDown className="size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" hidden={sidebarState !== "collapsed"}>
                      {currentCompany?.name ?? "Компания"}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {activeCompanies.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => setCurrentCompany(c.id)}
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                    {archivedCompanies.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        {archivedCompanies.map((c) => (
                          <DropdownMenuItem
                            key={c.id}
                            onClick={() => {
                              unarchiveCompany(c.id)
                              setCurrentCompany(c.id)
                            }}
                            className="text-muted-foreground"
                          >
                            <Archive className="mr-2 size-4 opacity-50" />
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setNameValue(""); setCreateOpen(true) }}>
                      <Plus className="mr-2 size-4" />
                      Создать
                    </DropdownMenuItem>
                    {currentCompany && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={openEdit}>
                          <Pencil className="mr-2 size-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
                          <Archive className="mr-2 size-4" />
                          Архивировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteOpen(true)}
                          disabled={!canDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Удалить
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Система</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/app/settings")} tooltip="Настройки">
                  <Link to="/app/settings">
                    <Settings className="size-4" />
                    <span>Настройки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
