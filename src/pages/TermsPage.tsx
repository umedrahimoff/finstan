import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                F
              </div>
              <span className="text-xl font-semibold">Finstan</span>
            </Link>
            <Link to="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Условия использования</h1>
        <p className="mt-2 text-muted-foreground">Последнее обновление: март 2025</p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Принятие условий</h2>
            <p className="mt-2">
              Используя сервис Finstan, вы соглашаетесь с настоящими условиями. Если вы не согласны с какими-либо пунктами, пожалуйста, не пользуйтесь сервисом.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Описание сервиса</h2>
            <p className="mt-2">
              Finstan — бесплатный веб-сервис для учёта доходов и расходов, предназначенный для стартапов и малого бизнеса. Сервис предоставляет возможность ведения финансовой отчётности, учёта контрагентов, бюджетов и проектов.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Регистрация и учётная запись</h2>
            <p className="mt-2">
              Для использования сервиса необходимо создать учётную запись. Вы несёте ответственность за сохранение конфиденциальности логина и пароля. Запрещается передавать доступ к учётной записи третьим лицам.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Использование сервиса</h2>
            <p className="mt-2">
              Вы обязуетесь использовать сервис только в законных целях. Запрещается загружать данные, нарушающие права третьих лиц или законодательство. Мы оставляем за собой право приостановить или удалить учётную запись при нарушении условий.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Бесплатный сервис, без ответственности</h2>
            <p className="mt-2">
              Сервис полностью бесплатен. Мы не несём никакой ответственности за использование Finstan. Вы пользуетесь сервисом на свой страх и риск. Решения, принятые на основе данных в сервисе, — ваша зона ответственности.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. «Как есть»</h2>
            <p className="mt-2">
              Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу, точность данных и не несём ответственности за любые убытки, прямые или косвенные, возникшие в результате использования или невозможности использования сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Изменения</h2>
            <p className="mt-2">
              Мы можем изменять условия использования. О существенных изменениях будет сообщено на сайте. Продолжение использования сервиса после внесения изменений означает ваше согласие с новыми условиями.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Контакты</h2>
            <p className="mt-2">
              По вопросам, связанным с условиями использования, обращайтесь:{" "}
              <a href="https://stanbase.tech" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                Stanbase
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← На главную
          </Link>
        </div>
      </footer>
    </div>
  )
}
