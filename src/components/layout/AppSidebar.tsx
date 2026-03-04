import { Link, useLocation, useNavigate } from "react-router-dom"
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
  LogOut,
} from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
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
} from "@/components/ui/sidebar"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Главная" },
  { to: "/transactions", icon: Repeat, label: "Операции" },
  { to: "/accounts", icon: Wallet, label: "Счета" },
  { to: "/categories", icon: FolderTree, label: "Категории" },
  { to: "/counterparties", icon: Users, label: "Контрагенты" },
  { to: "/calendar", icon: Calendar, label: "Платежный календарь" },
  { to: "/budgets", icon: PiggyBank, label: "Бюджеты" },
  { to: "/reports", icon: FileText, label: "Отчеты" },
  { to: "/analytics", icon: BarChart3, label: "Аналитика" },
  { to: "/projects", icon: FolderKanban, label: "Проекты" },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut(auth)
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            F
          </div>
          <span className="font-semibold">Finstan</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
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
                <SidebarMenuButton asChild>
                  <Link to="/settings">
                    <Settings className="size-4" />
                    <span>Настройки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="size-4" />
                  <span>Выйти</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
