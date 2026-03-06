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
      const body = req.body as { byCompany?: ByCompany; companies?: { id: string; name: string; archived?: boolean }[] }
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
