import { Link, Outlet, useLocation } from "react-router-dom"
import { User, Users, Palette, Database, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"

const subSections = [
  { to: "/app/settings/profile", icon: User, label: "Профиль" },
  { to: "/app/settings/users", icon: Users, label: "Пользователи", hideForGlobalAdmin: true },
  { to: "/app/settings/general", icon: Palette, label: "Общие" },
  { to: "/app/settings/data", icon: Database, label: "Данные", hideForGlobalAdmin: true },
  { to: "/app/settings/about", icon: Info, label: "О приложении" },
]

export function SettingsLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const isGlobalAdmin = user?.isGlobalAdmin === true
  const visibleSections = subSections.filter((s) => !(isGlobalAdmin && (s as { hideForGlobalAdmin?: boolean }).hideForGlobalAdmin))

  return (
    <div className="flex gap-8">
      <nav className="w-48 shrink-0 space-y-1">
        <p className="mb-3 px-2 text-xs font-medium text-muted-foreground">
          Подразделы
        </p>
        {visibleSections.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              location.pathname === item.to
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
