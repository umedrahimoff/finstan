import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Wallet,
  Users,
  FolderKanban,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  Zap,
} from "lucide-react"
import { HeroFinanceBg } from "@/components/HeroFinanceBg"

const FEATURES = [
  {
    icon: Wallet,
    title: "Один счёт — вся картина",
    desc: "Доходы, расходы, переводы между счетами. Видите, куда уходят деньги и откуда приходят.",
  },
  {
    icon: BarChart3,
    title: "Бюджеты и контроль",
    desc: "Планируйте траты по категориям. Не выходите за рамки — видите лимиты в реальном времени.",
  },
  {
    icon: Users,
    title: "Контрагенты",
    desc: "Клиенты, поставщики, подрядчики. ИНН, контакты — всё в одном месте.",
  },
  {
    icon: FolderKanban,
    title: "Проекты",
    desc: "Доходы и расходы по проектам. Понятно, какой проект приносит, какой съедает бюджет.",
  },
  {
    icon: Calendar,
    title: "Планирование",
    desc: "Запланированные платежи, повторяющиеся — аренда, подписки. Ничего не забудете.",
  },
  {
    icon: FileSpreadsheet,
    title: "Отчёты и аналитика",
    desc: "По категориям, по контрагентам, по периодам. Экспорт, графики — всё для решений.",
  },
]

export function LandingPage() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (user) return <Navigate to="/app" replace />
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b bg-muted/50">
        <HeroFinanceBg />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                F
              </div>
              <span className="text-xl font-semibold">Finstan</span>
            </div>
            <Link to="/login">
              <Button>Войти</Button>
            </Link>
          </nav>
          <div className="mx-auto max-w-3xl py-24 text-center sm:py-32">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Финансы стартапа — без хаоса
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Учёт доходов и расходов, бюджеты, контрагенты, проекты. Всё в одном месте. 
              Понятно, быстро, бесплатно.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="min-w-[200px]">
                  Начать бесплатно
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">Без карты, без подписок</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stanbase */}
      <section className="border-b bg-primary/5 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-muted-foreground">
            Бесплатная инициатива от{" "}
            <a href="https://stanbase.tech" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline hover:no-underline">
              Stanbase
            </a>{" "}
            для стартапов на начальных этапах — контролируйте финансы с самого начала.
          </p>
        </div>
      </section>

      {/* Зачем стартапам */}
      <section className="border-b bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Зачем стартапам Finstan?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              На старте каждая копейка важна. Не тратьте время на таблицы и хаос в заметках — 
              держите финансы под контролем с первого дня.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Импорт */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="size-4" />
                Импорт
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Загрузите выписки из банка
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Загружаете выписку из банка — операции подтягиваются автоматически. 
                Не нужно вводить вручную.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Аналитика"
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Команда */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"
                alt="Команда"
                className="rounded-2xl border border-border shadow-xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Команда и роли
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Добавьте сооснователя. Модератор ведёт учёт, админ управляет пользователями и правами. 
                Всё в одном аккаунте.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Бесплатно */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 px-8 py-16 text-center sm:px-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
              <TrendingUp className="size-4" />
              100% бесплатно
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Никаких ограничений
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Нет подписок, нет лимитов на операции, нет скрытых платежей. 
              Просто начните — и пользуйтесь.
            </p>
            <Link to="/login" className="mt-8 inline-block">
              <Button size="lg" className="min-w-[220px]">
                Начать бесплатно
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  F
                </div>
                <span className="font-semibold">Finstan</span>
              </Link>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <Link to="/terms" className="hover:text-foreground">Условия использования</Link>
                <Link to="/privacy" className="hover:text-foreground">Политика конфиденциальности</Link>
              </div>
            </div>
            <Link to="/login">
              <Button variant="outline">Войти</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
