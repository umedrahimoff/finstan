import { Link, Outlet, useLocation } from "react-router-dom"
import { User, Users, Palette, Database, Info, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const subSections = [
  { to: "/app/settings/profile", icon: User, label: "Профиль" },
  { to: "/app/settings/users", icon: Users, label: "Пользователи" },
  { to: "/app/settings/telegram", icon: MessageCircle, label: "Telegram" },
  { to: "/app/settings/general", icon: Palette, label: "Общие" },
  { to: "/app/settings/data", icon: Database, label: "Данные" },
  { to: "/app/settings/about", icon: Info, label: "О приложении" },
]

export function SettingsLayout() {
  const location = useLocation()
  const visibleSections = subSections

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
      <nav className="flex overflow-x-auto gap-1 sm:flex-col sm:overflow-visible sm:w-48 sm:shrink-0 sm:space-y-1 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <p className="hidden sm:block mb-3 px-2 text-xs font-medium text-muted-foreground shrink-0">
          Подразделы
        </p>
        {visibleSections.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors shrink-0 whitespace-nowrap",
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
