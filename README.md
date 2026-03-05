# Finstan — система управления финансами бизнеса

## Стек

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** — кеш и синхронизация с API
- **Zustand** — клиентское состояние
- **React Hook Form** + **Zod** — формы и валидация
- **TanStack Table** — таблицы
- **Recharts** — графики
- **react-big-calendar** — платежный календарь
- **date-fns** — работа с датами

## Запуск

```bash
npm install
npm run dev
```

Локально API проксируется на production (finstan.vercel.app). Для деплоя нужны переменные в Vercel: `DATABASE_URL`, `JWT_SECRET`.

## Структура проекта

```
src/
├── api/          # API клиент
├── components/
│   ├── layout/   # Layout компоненты (sidebar)
│   └── ui/       # shadcn/ui компоненты
├── hooks/
├── layouts/      # Страничные layout
├── lib/          # Утилиты
├── pages/        # Страницы
├── providers/    # React провайдеры
├── routes/       # Роутинг
├── stores/       # Zustand stores
└── types/        # TypeScript типы
```
