import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getAuth(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload
}

async function getAuthWithRole(req: VercelRequest, sql: { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> }) {
  const auth = await getAuth(req)
  if (!auth) return null
  const rows = await sql`SELECT role FROM app_users WHERE id = ${auth.uid} AND frozen = false LIMIT 1`
  const row = rows[0] as { role: string } | undefined
  return row ? { ...auth, role: row.role ?? "moderator" } : null
}

function canManage(auth: { role?: string }) {
  const r = auth.role ?? "moderator"
  return r === "admin" || r === "moderator"
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const auth = req.method === "GET"
    ? await getAuth(req)
    : await getAuthWithRole(req, sql as { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> })
  if (!auth) return res.status(401).json({ error: "Войдите в систему" })

  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT id, username, role, frozen FROM app_users ORDER BY username`
      return res.status(200).json(rows)
    } catch (err) {
      console.error("Users list:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  if (req.method === "POST") {
    if (!canManage(auth)) return res.status(403).json({ error: "Только админ или модератор может добавлять пользователей" })
    try {
      const { username, password, role } = (req.body ?? {}) as {
        username?: string
        password?: string
        role?: string
      }
      const u = (username ?? "").trim()
      const p = password ?? ""
      const r = (role ?? "moderator") === "admin" ? "admin" : "moderator"
      if (!u || u.length < 2) return res.status(400).json({ error: "Логин минимум 2 символа" })
      if (!p || p.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" })
      if (auth.role !== "admin" && r === "admin") {
        return res.status(403).json({ error: "Только админ может создавать админов" })
      }
      const bcrypt = (await import("bcryptjs")).default
      const existing = await sql`SELECT id FROM app_users WHERE username = ${u} LIMIT 1`
      if (existing.length > 0) return res.status(400).json({ error: "Логин уже занят" })
      const hash = await bcrypt.hash(p, 10)
      const id = crypto.randomUUID()
      await sql`INSERT INTO app_users (id, username, password_hash, role) VALUES (${id}, ${u}, ${hash}, ${r})`
      return res.status(200).json({ id, username: u, role: r, frozen: false })
    } catch (err) {
      console.error("User add:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  if (req.method === "PATCH") {
    if (!canManage(auth)) return res.status(403).json({ error: "Нет прав" })
    try {
      const { id, username, password, role, frozen } = (req.body ?? {}) as {
        id?: string
        username?: string
        password?: string
        role?: string
        frozen?: boolean
      }
      if (!id) return res.status(400).json({ error: "Укажите id пользователя" })
      const existing = await sql`SELECT id, role FROM app_users WHERE id = ${id} LIMIT 1`
      const target = existing[0] as { id: string; role: string } | undefined
      if (!target) return res.status(404).json({ error: "Пользователь не найден" })
      if (target.role === "admin" && auth.role !== "admin") {
        return res.status(403).json({ error: "Нельзя редактировать админа" })
      }
      let updated = false
      if (username !== undefined) {
        const u = username.trim()
        if (u.length < 2) return res.status(400).json({ error: "Логин минимум 2 символа" })
        const dup = await sql`SELECT id FROM app_users WHERE username = ${u} AND id != ${id} LIMIT 1`
        if (dup.length > 0) return res.status(400).json({ error: "Логин уже занят" })
        await sql`UPDATE app_users SET username = ${u} WHERE id = ${id}`
        updated = true
      }
      if (password !== undefined && password !== "") {
        if (password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" })
        const bcrypt = (await import("bcryptjs")).default
        const hash = await bcrypt.hash(password, 10)
        await sql`UPDATE app_users SET password_hash = ${hash} WHERE id = ${id}`
        updated = true
      }
      if (role !== undefined) {
        const r = role === "admin" ? "admin" : "moderator"
        if (r === "admin" && auth.role !== "admin") return res.status(403).json({ error: "Только админ может назначать админа" })
        if (target.role === "admin" && auth.uid === id) return res.status(400).json({ error: "Нельзя понизить свою роль" })
        await sql`UPDATE app_users SET role = ${r} WHERE id = ${id}`
        updated = true
      }
      if (frozen !== undefined) {
        if (target.role === "admin" && auth.uid === id) return res.status(400).json({ error: "Нельзя заблокировать себя" })
        await sql`UPDATE app_users SET frozen = ${frozen === true} WHERE id = ${id}`
        updated = true
      }
      if (!updated) return res.status(400).json({ error: "Нет изменений" })
      const rows = await sql`SELECT id, username, role, frozen FROM app_users WHERE id = ${id}`
      return res.status(200).json(rows[0])
    } catch (err) {
      console.error("User update:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
