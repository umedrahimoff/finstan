import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { AmountInput } from "@/components/AmountInput"
import { Label } from "@/components/ui/label"
import {
  BarChart3,
  Wallet,
  Users,
  FolderKanban,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  Zap,
  Calculator,
  Target,
  AlertTriangle,
  PiggyBank,
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

function LandingCalculators() {
  const [runwayCash, setRunwayCash] = useState(5000000)
  const [runwayBurn, setRunwayBurn] = useState(400000)
  const [marginRevenue, setMarginRevenue] = useState(1000000)
  const [marginCost, setMarginCost] = useState(600000)
  const [breakevenFixed, setBreakevenFixed] = useState(200000)
  const [breakevenPrice, setBreakevenPrice] = useState(50000)
  const [breakevenCost, setBreakevenCost] = useState(20000)

  const runway = (() => {
    const c = runwayCash || 0
    const b = runwayBurn || 0
    return b > 0 ? (c / b).toFixed(1) : "—"
  })()
  const margin = (() => {
    const r = marginRevenue || 0
    const c = marginCost || 0
    return r > 0 ? (((r - c) / r) * 100).toFixed(0) : "—"
  })()
  const breakeven = (() => {
    const f = breakevenFixed || 0
    const p = breakevenPrice || 0
    const c = breakevenCost || 0
    const unit = p - c
    return unit > 0 ? Math.ceil(f / unit).toLocaleString("ru-RU") : "—"
  })()

  return (
    <section className="border-b py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="landing-animate-fade-up inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Calculator className="size-4" />
            Калькуляторы
          </div>
          <h2 className="landing-animate-fade-up mt-6 text-3xl font-bold tracking-tight sm:text-4xl" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            Посчитайте ключевые метрики
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Runway, маржа, точка безубыточности — базовые расчёты для любого стартапа.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calculator className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Runway</h3>
            <p className="mt-2 text-muted-foreground">Сколько месяцев хватит денег при текущем burn rate</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-muted-foreground">Денег на счету (сум)</Label>
                <AmountInput
                  value={runwayCash}
                  onChange={setRunwayCash}
                  placeholder="5 000 000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Расходы в месяц (сум)</Label>
                <AmountInput
                  value={runwayBurn}
                  onChange={setRunwayBurn}
                  placeholder="400 000"
                  className="mt-1"
                />
              </div>
              <p className="rounded-lg bg-muted px-3 py-2 text-lg font-semibold">
                Runway: {runway} мес.
              </p>
            </div>
          </div>
          <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Маржа</h3>
            <p className="mt-2 text-muted-foreground">Процент прибыли от выручки</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-muted-foreground">Выручка (сум)</Label>
                <AmountInput
                  value={marginRevenue}
                  onChange={setMarginRevenue}
                  placeholder="1 000 000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Себестоимость (сум)</Label>
                <AmountInput
                  value={marginCost}
                  onChange={setMarginCost}
                  placeholder="600 000"
                  className="mt-1"
                />
              </div>
              <p className="rounded-lg bg-muted px-3 py-2 text-lg font-semibold">
                Маржа: {margin}%
              </p>
            </div>
          </div>
          <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Точка безубыточности</h3>
            <p className="mt-2 text-muted-foreground">Сколько единиц продать, чтобы выйти в ноль</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-muted-foreground">Постоянные расходы/мес (сум)</Label>
                <AmountInput
                  value={breakevenFixed}
                  onChange={setBreakevenFixed}
                  placeholder="200 000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Цена за единицу (сум)</Label>
                <AmountInput
                  value={breakevenPrice}
                  onChange={setBreakevenPrice}
                  placeholder="50 000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Переменные затраты/ед (сум)</Label>
                <AmountInput
                  value={breakevenCost}
                  onChange={setBreakevenCost}
                  placeholder="20 000"
                  className="mt-1"
                />
              </div>
              <p className="rounded-lg bg-muted px-3 py-2 text-lg font-semibold">
                Продаж: {breakeven} ед.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Ведите реальный учёт в Finstan — runway, маржу и отчёты считайте по живым данным.
        </p>
      </div>
    </section>
  )
}

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
          <nav className="landing-animate-fade-in flex items-center justify-between">
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
            <h1 className="landing-animate-fade-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Финансы стартапа — без хаоса
            </h1>
            <p className="landing-animate-fade-up mt-6 text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
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

      {/* Почему важно */}
      <section className="border-b bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="landing-animate-fade-up text-3xl font-bold tracking-tight sm:text-4xl">
              Почему стартапам важно вести финансы
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Без учёта денег стартап летит вслепую. Вот что меняется, когда вы контролируете финансы с первого дня.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Видите runway</h3>
              <p className="mt-2 text-muted-foreground">
                Сколько месяцев проживёте на текущих деньгах? Без учёта — догадки. С учётом — точный ответ и время на поиск инвестиций.
              </p>
            </div>
            <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Принимаете решения по цифрам</h3>
              <p className="mt-2 text-muted-foreground">
                Какой проект окупается? Где резать расходы? Данные вместо интуиции — меньше ошибок, больше уверенности.
              </p>
            </div>
            <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PiggyBank className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Готовы к инвесторам</h3>
              <p className="mt-2 text-muted-foreground">
                Due diligence, отчёты, прогнозы — всё под рукой. Не тратите недели на сбор данных, когда приходит запрос.
              </p>
            </div>
            <div className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Масштабируете осознанно</h3>
              <p className="mt-2 text-muted-foreground">
                Понимаете unit-экономику, маржу, точку безубыточности. Растёте не наугад, а с опорой на факты.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Калькуляторы */}
      <LandingCalculators />

      {/* Зачем стартапам */}
      <section className="border-b bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="landing-animate-fade-up text-3xl font-bold tracking-tight sm:text-4xl">
              Всё для учёта в одном месте
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              На старте каждая копейка важна. Не тратьте время на таблицы и хаос в заметках — 
              Finstan даёт полный контроль над финансами с первого дня.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="landing-hover-lift landing-animate-fade-up rounded-xl border bg-card p-6 shadow-sm"
                style={{ animationDelay: `${0.1 * (i + 1)}s`, animationFillMode: "both" }}
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
              <div className="landing-animate-fade-up inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="size-4" />
                Импорт
              </div>
              <h2 className="landing-animate-fade-up mt-6 text-3xl font-bold tracking-tight sm:text-4xl" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
                Загрузите выписки из банка
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Загружаете выписку из банка — операции подтягиваются автоматически. 
                Не нужно вводить вручную.
              </p>
            </div>
            <div className="landing-img-wrap relative overflow-hidden rounded-2xl border border-border shadow-xl">
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
            <div className="landing-img-wrap order-2 lg:order-1 overflow-hidden rounded-2xl border border-border shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80"
                alt="Команда"
                className="h-80 w-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="landing-animate-fade-up text-3xl font-bold tracking-tight sm:text-4xl">
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
          <div className="landing-animate-fade-in rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 px-8 py-16 text-center sm:px-12">
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
