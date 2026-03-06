import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function PrivacyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Политика конфиденциальности</h1>
        <p className="mt-2 text-muted-foreground">Последнее обновление: март 2025</p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Общие положения</h2>
            <p className="mt-2">
              Настоящая политика описывает, какие данные мы собираем при использовании сервиса Finstan и как мы их используем. Мы стремимся соблюдать конфиденциальность пользователей.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Какие данные мы собираем</h2>
            <p className="mt-2">
              При регистрации и использовании сервиса мы собираем: логин (имя пользователя), хеш пароля, данные, которые вы вводите (финансовые операции, счета, категории, контрагенты и т.д.). Мы не собираем платёжные данные, банковские данные или персональные документы.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Цели использования данных</h2>
            <p className="mt-2">
              Данные используются исключительно для: предоставления сервиса, обеспечения безопасности учётной записи, улучшения работы приложения. Мы не передаём ваши данные третьим лицам для маркетинга или рекламы.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Хранение и защита</h2>
            <p className="mt-2">
              Данные хранятся на защищённых серверах. Пароли хранятся в зашифрованном виде (хеш). Мы применяем стандартные меры для защиты от несанкционированного доступа.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Cookies и технические данные</h2>
            <p className="mt-2">
              Используем минимально необходимые технические данные (например, токен сессии) для авторизации. Вы можете удалить данные в браузере — выход из учётной записи очищает сессию.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Ваши права</h2>
            <p className="mt-2">
              Вы можете в любой момент экспортировать свои данные через настройки. Вы можете удалить учётную запись — при этом данные будут удалены. Мы не храним резервные копии персональных данных после удаления.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Изменения политики</h2>
            <p className="mt-2">
              Мы можем обновлять политику конфиденциальности. О существенных изменениях будет сообщено на сайте. Продолжение использования сервиса означает согласие с обновлённой политикой.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Контакты</h2>
            <p className="mt-2">
              По вопросам конфиденциальности:{" "}
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
