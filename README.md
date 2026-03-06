# Finstan — учёт финансов

## Стек

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand — состояние
- React Hook Form + Zod — формы
- TanStack Table — таблицы
- Recharts — графики
- react-big-calendar — календарь
- date-fns — даты

## Запуск

```bash
npm install
npm run dev
```

## Авторизация

Только вход (логин + пароль), без регистрации.

1. Выполни `scripts/init-neon.sql` в Neon SQL Editor
2. Создай пользователя: `npm run seed` (admin/admin123) или `npm run seed -- admin mypass admin`
3. Seed создаёт таблицы app_users и user_data (данные хранятся в Neon)
3. В Vercel: `DATABASE_URL`, `JWT_SECRET`
