import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../lib/jwt.js"

function uuid() {
  return crypto.randomUUID()
}

async function seedDemoForUser(sql: Awaited<ReturnType<typeof import("@neondatabase/serverless").neon>>, userId: string) {
  const companyId = "demo"

  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      archived BOOLEAN NOT NULL DEFAULT false
    )
  `.catch(() => {})
  await sql`
    CREATE TABLE IF NOT EXISTS user_companies (
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, company_id)
    )
  `.catch(() => {})

  await sql`
    INSERT INTO companies (id, name, owner_user_id, archived)
    VALUES (${companyId}, 'Демо', ${userId}, false)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, owner_user_id = EXCLUDED.owner_user_id
  `.catch(() => {})
  await sql`
    INSERT INTO user_companies (user_id, company_id)
    VALUES (${userId}, ${companyId})
    ON CONFLICT (user_id, company_id) DO NOTHING
  `.catch(() => {})

  await sql`DELETE FROM transactions WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM budgets WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM planned_payments WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM accounts WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM categories WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM counterparties WHERE user_id = ${userId} AND company_id = ${companyId}`
  await sql`DELETE FROM projects WHERE user_id = ${userId} AND company_id = ${companyId}`

  const acc1 = uuid()
  const acc2 = uuid()
  const acc3 = uuid()
  await sql`
    INSERT INTO accounts (id, user_id, company_id, name, type, currency, balance, is_primary)
    VALUES
      (${acc1}, ${userId}, ${companyId}, 'Основной счёт', 'bank', 'UZS', 0, true),
      (${acc2}, ${userId}, ${companyId}, 'Касса', 'cash', 'UZS', 0, false),
      (${acc3}, ${userId}, ${companyId}, 'Payme', 'ewallet', 'UZS', 0, false)
  `

  const catIds = Array.from({ length: 6 }, () => uuid())
  await sql`
    INSERT INTO categories (id, user_id, company_id, name, type, parent_id, recurring)
    VALUES
      (${catIds[0]}, ${userId}, ${companyId}, 'Продажи', 'income', null, false),
      (${catIds[1]}, ${userId}, ${companyId}, 'Услуги', 'income', null, true),
      (${catIds[2]}, ${userId}, ${companyId}, 'Зарплата', 'expense', null, false),
      (${catIds[3]}, ${userId}, ${companyId}, 'Аренда', 'expense', null, false),
      (${catIds[4]}, ${userId}, ${companyId}, 'Маркетинг', 'expense', null, false),
      (${catIds[5]}, ${userId}, ${companyId}, 'Налоги', 'expense', null, false)
  `

  const cpIds = Array.from({ length: 6 }, () => uuid())
  await sql`
    INSERT INTO counterparties (id, user_id, company_id, name, type)
    VALUES
      (${cpIds[0]}, ${userId}, ${companyId}, 'ООО Клиент А', 'client'),
      (${cpIds[1]}, ${userId}, ${companyId}, 'ИП Поставщик Б', 'supplier'),
      (${cpIds[2]}, ${userId}, ${companyId}, 'Банк', 'partner'),
      (${cpIds[3]}, ${userId}, ${companyId}, 'ТОО Контрагент В', 'client'),
      (${cpIds[4]}, ${userId}, ${companyId}, 'Фрилансер Г', 'supplier'),
      (${cpIds[5]}, ${userId}, ${companyId}, 'Арендодатель', 'partner')
  `

  const prj1 = uuid()
  const prj2 = uuid()
  await sql`
    INSERT INTO projects (id, user_id, company_id, name)
    VALUES
      (${prj1}, ${userId}, ${companyId}, 'Сайт компании'),
      (${prj2}, ${userId}, ${companyId}, 'Мобильное приложение')
  `

  const baseDate = new Date()
  const amounts = [250000, 500000, 1500000, 300000, 200000, 800000, 1200000, 450000, 600000, 350000]
  for (let i = 0; i < 25; i++) {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - (24 - i))
    const date = d.toISOString().slice(0, 10)
    const amt = amounts[i % amounts.length]
    let type: string
    let categoryId: string | null
    let counterpartyId: string | null
    let projectId: string | null
    let comment: string
    if (i % 5 === 0) {
      type = "income"
      categoryId = i % 2 ? catIds[0] : catIds[1]
      counterpartyId = cpIds[i % 3]
      projectId = i % 2 ? prj1 : prj2
      comment = `Доход #${i + 1}`
    } else if (i % 5 === 1) {
      type = "transfer"
      categoryId = null
      counterpartyId = null
      projectId = null
      comment = `Перевод в кассу #${i + 1}`
    } else {
      type = "expense"
      categoryId = catIds[2 + (i % 4)]
      counterpartyId = cpIds[(i % 4) + 2]
      projectId = i % 3 === 0 ? prj1 : null
      comment = `Расход #${i + 1}`
    }
    const id = uuid()
    await sql`
      INSERT INTO transactions (id, user_id, company_id, date, amount, currency, type, account_id, to_account_id, category_id, counterparty_id, project_id, comment, planned_payment_id)
      VALUES (${id}, ${userId}, ${companyId}, ${date}, ${amt}, 'UZS', ${type}, ${acc1}, ${type === "transfer" ? acc2 : null}, ${categoryId}, ${counterpartyId}, ${projectId}, ${comment}, null)
    `
  }

  const year = baseDate.getFullYear()
  const month = baseDate.getMonth() + 1
  await sql`
    INSERT INTO budgets (id, user_id, company_id, category_id, year, month, amount, currency)
    VALUES
      (${uuid()}, ${userId}, ${companyId}, ${catIds[2]}, ${year}, ${month}, 2000000, 'UZS'),
      (${uuid()}, ${userId}, ${companyId}, ${catIds[3]}, ${year}, ${month}, 500000, 'UZS'),
      (${uuid()}, ${userId}, ${companyId}, ${catIds[4]}, ${year}, ${month}, 500000, 'UZS')
  `

  const ppDate = new Date(baseDate)
  ppDate.setDate(ppDate.getDate() + 7)
  const ppDateStr = ppDate.toISOString().slice(0, 10)
  await sql`
    INSERT INTO planned_payments (id, user_id, company_id, date, amount, currency, type, title, account_id, category_id, counterparty_id, recurrence, repeat_until)
    VALUES
      (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 500000, 'UZS', 'income', 'Ожидаемая оплата', ${acc1}, null, ${cpIds[0]}, 'none', null),
      (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 300000, 'UZS', 'expense', 'Аренда', ${acc1}, ${catIds[3]}, null, 'monthly', '2025-12-31'),
      (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 800000, 'UZS', 'expense', 'Зарплаты', ${acc1}, ${catIds[2]}, null, 'none', null)
  `

  for (const acc of [acc1, acc2, acc3]) {
    const rows = await sql`
      SELECT COALESCE(SUM(
        CASE WHEN type = 'income' AND account_id = ${acc} THEN amount
             WHEN type = 'expense' AND account_id = ${acc} THEN -amount
             WHEN type = 'transfer' AND account_id = ${acc} THEN -amount
             WHEN type = 'transfer' AND to_account_id = ${acc} THEN amount
             ELSE 0 END
      ), 0) as bal
      FROM transactions WHERE user_id = ${userId} AND company_id = ${companyId}
    `
    const balance = Number(rows[0]?.bal ?? 0)
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${acc}`
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "Войдите в систему" })

  const payload = await verifyToken(token)
  if (!payload) return res.status(401).json({ error: "Недействительный токен" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    await seedDemoForUser(sql, payload.uid)

    return res.status(200).json({
      ok: true,
      message: "Демо-данные загружены",
      companyId: "demo",
      counts: { accounts: 3, categories: 6, counterparties: 6, projects: 2, transactions: 25, budgets: 3, plannedPayments: 3 },
    })
  } catch (err) {
    console.error("Seed demo:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
