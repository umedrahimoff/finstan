import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getAuth(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload
}

function canManage(auth: { role?: string }) {
  const r = auth.role ?? "user"
  return r === "admin" || r === "moderator"
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuth(req)
  if (!auth) return res.status(401).json({ error: "Войдите в систему" })

  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })

  if (req.method === "GET") {
    try {
      const { neon } = await import("@neondatabase/serverless")
      const sql = neon(url)
      const rows = await sql`SELECT id, username, role FROM app_users ORDER BY username`
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
      const { neon } = await import("@neondatabase/serverless")
      const sql = neon(url)
      const existing = await sql`SELECT id FROM app_users WHERE username = ${u} LIMIT 1`
      if (existing.length > 0) return res.status(400).json({ error: "Логин уже занят" })
      const hash = await bcrypt.hash(p, 10)
      const id = crypto.randomUUID()
      await sql`INSERT INTO app_users (id, username, password_hash, role) VALUES (${id}, ${u}, ${hash}, ${r})`
      return res.status(200).json({ id, username: u, role: r })
    } catch (err) {
      console.error("User add:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
