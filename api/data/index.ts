import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getAuth(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload
}

type ByCompany = Record<string, {
  accounts: unknown[]
  categories: unknown[]
  counterparties: unknown[]
  transactions: unknown[]
  budgets: unknown[]
  plannedPayments: unknown[]
  projects: unknown[]
}>

function rowToAccount(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    currency: r.currency,
    balance: Number(r.balance ?? 0),
    isPrimary: r.is_primary === true,
  }
}

function rowToCategory(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    parentId: r.parent_id ?? undefined,
    recurring: r.recurring === true,
  }
}

function rowToCounterparty(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    inn: r.inn ?? undefined,
    country: r.country ?? undefined,
    contactName: r.contact_name ?? undefined,
    contactPhone: r.contact_phone ?? undefined,
    contactEmail: r.contact_email ?? undefined,
  }
}

function rowToProject(r: Record<string, unknown>) {
  return { id: r.id, name: r.name }
}

function rowToTransaction(r: Record<string, unknown>) {
  return {
    id: r.id,
    date: r.date,
    amount: Number(r.amount ?? 0),
    currency: r.currency,
    type: r.type,
    accountId: r.account_id,
    toAccountId: r.to_account_id ?? undefined,
    categoryId: r.category_id ?? undefined,
    counterpartyId: r.counterparty_id ?? undefined,
    projectId: r.project_id ?? undefined,
    comment: r.comment ?? undefined,
    plannedPaymentId: r.planned_payment_id ?? undefined,
  }
}

function rowToBudget(r: Record<string, unknown>) {
  return {
    id: r.id,
    categoryId: r.category_id,
    year: Number(r.year ?? 0),
    month: Number(r.month ?? 0),
    amount: Number(r.amount ?? 0),
    currency: r.currency,
  }
}

function rowToPlannedPayment(r: Record<string, unknown>) {
  return {
    id: r.id,
    date: r.date,
    amount: Number(r.amount ?? 0),
    currency: r.currency,
    type: r.type,
    title: r.title,
    accountId: r.account_id ?? undefined,
    categoryId: r.category_id ?? undefined,
    counterpartyId: r.counterparty_id ?? undefined,
    recurrence: r.recurrence ?? undefined,
    repeatUntil: r.repeat_until ?? undefined,
  }
}

function uuid() {
  return crypto.randomUUID()
}

async function handleSeedDemo(sql: Awaited<ReturnType<typeof import("@neondatabase/serverless").neon>>, userId: string) {
  const companyId = "demo"
  await sql`
    CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, archived BOOLEAN NOT NULL DEFAULT false)
  `.catch(() => {})
  await sql`
    CREATE TABLE IF NOT EXISTS user_companies (user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE, PRIMARY KEY (user_id, company_id))
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
    VALUES (${acc1}, ${userId}, ${companyId}, 'Основной счёт', 'bank', 'UZS', 0, true),
      (${acc2}, ${userId}, ${companyId}, 'Касса', 'cash', 'UZS', 0, false),
      (${acc3}, ${userId}, ${companyId}, 'Payme', 'ewallet', 'UZS', 0, false)
  `
  const catIds = Array.from({ length: 6 }, () => uuid())
  await sql`
    INSERT INTO categories (id, user_id, company_id, name, type, parent_id, recurring)
    VALUES (${catIds[0]}, ${userId}, ${companyId}, 'Продажи', 'income', null, false),
      (${catIds[1]}, ${userId}, ${companyId}, 'Услуги', 'income', null, true),
      (${catIds[2]}, ${userId}, ${companyId}, 'Зарплата', 'expense', null, false),
      (${catIds[3]}, ${userId}, ${companyId}, 'Аренда', 'expense', null, false),
      (${catIds[4]}, ${userId}, ${companyId}, 'Маркетинг', 'expense', null, false),
      (${catIds[5]}, ${userId}, ${companyId}, 'Налоги', 'expense', null, false)
  `
  const cpIds = Array.from({ length: 6 }, () => uuid())
  await sql`
    INSERT INTO counterparties (id, user_id, company_id, name, type)
    VALUES (${cpIds[0]}, ${userId}, ${companyId}, 'ООО Клиент А', 'client'),
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
    VALUES (${prj1}, ${userId}, ${companyId}, 'Сайт компании'),
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
    VALUES (${uuid()}, ${userId}, ${companyId}, ${catIds[2]}, ${year}, ${month}, 2000000, 'UZS'),
      (${uuid()}, ${userId}, ${companyId}, ${catIds[3]}, ${year}, ${month}, 500000, 'UZS'),
      (${uuid()}, ${userId}, ${companyId}, ${catIds[4]}, ${year}, ${month}, 500000, 'UZS')
  `
  const ppDate = new Date(baseDate)
  ppDate.setDate(ppDate.getDate() + 7)
  const ppDateStr = ppDate.toISOString().slice(0, 10)
  await sql`
    INSERT INTO planned_payments (id, user_id, company_id, date, amount, currency, type, title, account_id, category_id, counterparty_id, recurrence, repeat_until)
    VALUES (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 500000, 'UZS', 'income', 'Ожидаемая оплата', ${acc1}, null, ${cpIds[0]}, 'none', null),
      (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 300000, 'UZS', 'expense', 'Аренда', ${acc1}, ${catIds[3]}, null, 'monthly', '2025-12-31'),
      (${uuid()}, ${userId}, ${companyId}, ${ppDateStr}, 800000, 'UZS', 'expense', 'Зарплаты', ${acc1}, ${catIds[2]}, null, 'none', null)
  `
  for (const acc of [acc1, acc2, acc3]) {
    const rows = await sql`
      SELECT COALESCE(SUM(CASE WHEN type = 'income' AND account_id = ${acc} THEN amount WHEN type = 'expense' AND account_id = ${acc} THEN -amount WHEN type = 'transfer' AND account_id = ${acc} THEN -amount WHEN type = 'transfer' AND to_account_id = ${acc} THEN amount ELSE 0 END), 0) as bal
      FROM transactions WHERE user_id = ${userId} AND company_id = ${companyId}
    `
    const balance = Number(rows[0]?.bal ?? 0)
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${acc}`
  }
  return { ok: true, message: "Демо-данные загружены", companyId: "demo", counts: { accounts: 3, categories: 6, counterparties: 6, projects: 2, transactions: 25, budgets: 3, plannedPayments: 3 } }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuth(req)
  if (!auth) return res.status(401).json({ error: "Войдите в систему" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)

    if (req.method === "GET") {
      type CompanyRow = { id: string; name: string; archived: boolean; owner_user_id: string }
      let companiesRows: CompanyRow[]
      if (auth.tenantId == null) {
        companiesRows = (await sql`
          SELECT c.id, c.name, c.archived, c.owner_user_id
          FROM companies c
          WHERE c.owner_user_id = ${auth.uid}
        `.catch(() => [])) as CompanyRow[]
      } else {
        companiesRows = (await sql`
          SELECT c.id, c.name, c.archived, c.owner_user_id
          FROM companies c
          JOIN app_users ou ON c.owner_user_id = ou.id
          WHERE ou.tenant_id = ${auth.tenantId}
            AND (c.owner_user_id = ${auth.uid}
              OR c.id IN (SELECT company_id FROM user_companies WHERE user_id = ${auth.uid}))
        `.catch(() => [])) as CompanyRow[]
      }

      const userCompanies = Array.isArray(companiesRows) ? companiesRows : []
      const companyIds = userCompanies.length > 0
        ? userCompanies.map((r: Record<string, unknown>) => r.id as string)
        : ["default"]

      const ownerByCompany = new Map<string, string>()
      for (const r of userCompanies) {
        ownerByCompany.set(r.id as string, (r as { owner_user_id: string }).owner_user_id)
      }
      if (!ownerByCompany.has("default")) ownerByCompany.set("default", auth.uid)

      const byCompany: ByCompany = {}
      for (const cid of companyIds) {
        const ownerId = ownerByCompany.get(cid) ?? auth.uid
        const [accounts, categories, counterparties, projects, transactions, budgets, plannedPayments] = await Promise.all([
          sql`SELECT * FROM accounts WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM categories WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM counterparties WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM projects WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM transactions WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM budgets WHERE user_id = ${ownerId} AND company_id = ${cid}`,
          sql`SELECT * FROM planned_payments WHERE user_id = ${ownerId} AND company_id = ${cid}`,
        ])

        byCompany[cid] = {
          accounts: (accounts as Record<string, unknown>[]).map(rowToAccount),
          categories: (categories as Record<string, unknown>[]).map(rowToCategory),
          counterparties: (counterparties as Record<string, unknown>[]).map(rowToCounterparty),
          projects: (projects as Record<string, unknown>[]).map(rowToProject),
          transactions: (transactions as Record<string, unknown>[]).map(rowToTransaction),
          budgets: (budgets as Record<string, unknown>[]).map(rowToBudget),
          plannedPayments: (plannedPayments as Record<string, unknown>[]).map(rowToPlannedPayment),
        }
      }

      if (Object.keys(byCompany).length === 0) {
        byCompany.default = {
          accounts: [], categories: [], counterparties: [], transactions: [], budgets: [], plannedPayments: [], projects: [],
        }
      }

      const companies = userCompanies.length > 0
        ? userCompanies.map((r: Record<string, unknown>) => ({
            id: r.id,
            name: r.name,
            archived: r.archived === true,
          }))
        : [{ id: "default", name: "Моя компания", archived: false }]

      return res.status(200).json({ byCompany, companies })
    }

    if (req.method === "PUT") {
      const body = req.body as { action?: string; byCompany?: ByCompany; companies?: { id: string; name: string; archived?: boolean }[] }
      if (body?.action === "seed-demo") {
        const result = await handleSeedDemo(sql, auth.uid)
        return res.status(200).json(result)
      }
      if (!body?.byCompany || typeof body.byCompany !== "object") {
        return res.status(400).json({ error: "Invalid body" })
      }

      if (Array.isArray(body.companies)) {
        for (const c of body.companies) {
          if (c?.id && c?.name) {
            await sql`
              INSERT INTO companies (id, name, owner_user_id, archived)
              VALUES (${c.id}, ${c.name}, ${auth.uid}, ${c.archived === true})
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                archived = EXCLUDED.archived
                WHERE companies.owner_user_id = ${auth.uid}
            `.catch(() => {})
          }
        }
      }

      const ownedIds = await sql`
        SELECT id FROM companies WHERE owner_user_id = ${auth.uid}
      `.catch(() => [] as { id: string }[])
      const ownedSet = new Set((ownedIds as { id: string }[]).map((r) => r.id))
      if (ownedSet.size === 0) ownedSet.add("default")

      for (const [companyId, data] of Object.entries(body.byCompany)) {
        if (!ownedSet.has(companyId)) continue
        await sql`DELETE FROM transactions WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM budgets WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM planned_payments WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM accounts WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM categories WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM counterparties WHERE user_id = ${auth.uid} AND company_id = ${companyId}`
        await sql`DELETE FROM projects WHERE user_id = ${auth.uid} AND company_id = ${companyId}`

        for (const a of data.accounts as Record<string, unknown>[]) {
          await sql`
            INSERT INTO accounts (id, user_id, company_id, name, type, currency, balance, is_primary)
            VALUES (${a.id}, ${auth.uid}, ${companyId}, ${a.name}, ${a.type}, ${a.currency}, ${Number(a.balance ?? 0)}, ${a.isPrimary === true})
          `
        }
        for (const c of data.categories as Record<string, unknown>[]) {
          await sql`
            INSERT INTO categories (id, user_id, company_id, name, type, parent_id, recurring)
            VALUES (${c.id}, ${auth.uid}, ${companyId}, ${c.name}, ${c.type}, ${c.parentId ?? null}, ${c.recurring === true})
          `
        }
        for (const cp of data.counterparties as Record<string, unknown>[]) {
          await sql`
            INSERT INTO counterparties (id, user_id, company_id, name, type, inn, country, contact_name, contact_phone, contact_email)
            VALUES (${cp.id}, ${auth.uid}, ${companyId}, ${cp.name}, ${cp.type}, ${cp.inn ?? null}, ${cp.country ?? null}, ${cp.contactName ?? null}, ${cp.contactPhone ?? null}, ${cp.contactEmail ?? null})
          `
        }
        for (const p of data.projects as Record<string, unknown>[]) {
          await sql`
            INSERT INTO projects (id, user_id, company_id, name)
            VALUES (${p.id}, ${auth.uid}, ${companyId}, ${p.name})
          `
        }
        for (const t of data.transactions as Record<string, unknown>[]) {
          await sql`
            INSERT INTO transactions (id, user_id, company_id, date, amount, currency, type, account_id, to_account_id, category_id, counterparty_id, project_id, comment, planned_payment_id)
            VALUES (${t.id}, ${auth.uid}, ${companyId}, ${t.date}, ${Number(t.amount ?? 0)}, ${t.currency}, ${t.type}, ${t.accountId}, ${t.toAccountId ?? null}, ${t.categoryId ?? null}, ${t.counterpartyId ?? null}, ${t.projectId ?? null}, ${t.comment ?? null}, ${t.plannedPaymentId ?? null})
          `
        }
        for (const b of data.budgets as Record<string, unknown>[]) {
          await sql`
            INSERT INTO budgets (id, user_id, company_id, category_id, year, month, amount, currency)
            VALUES (${b.id}, ${auth.uid}, ${companyId}, ${b.categoryId}, ${Number(b.year ?? 0)}, ${Number(b.month ?? 0)}, ${Number(b.amount ?? 0)}, ${b.currency})
          `
        }
        for (const pp of data.plannedPayments as Record<string, unknown>[]) {
          await sql`
            INSERT INTO planned_payments (id, user_id, company_id, date, amount, currency, type, title, account_id, category_id, counterparty_id, recurrence, repeat_until)
            VALUES (${pp.id}, ${auth.uid}, ${companyId}, ${pp.date}, ${Number(pp.amount ?? 0)}, ${pp.currency}, ${pp.type}, ${pp.title}, ${pp.accountId ?? null}, ${pp.categoryId ?? null}, ${pp.counterpartyId ?? null}, ${pp.recurrence ?? null}, ${pp.repeatUntil ?? null})
          `
        }
      }

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err) {
    console.error("Data API:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
