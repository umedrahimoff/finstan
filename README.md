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
cp .env.example .env
# Заполните переменные Firebase в .env
npm run dev
```

## Firebase Auth

1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Включите Authentication → Sign-in method: Email/Password и Google
3. Скопируйте конфиг в `.env` из `.env.example`
4. Для Google Sign-In добавьте домен в Authorized domains (localhost для разработки)

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
