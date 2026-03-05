import type { VercelRequest, VercelResponse } from "@vercel/node"
import bcrypt from "bcryptjs"
import { sql } from "../../lib/db"
import { createToken } from "../../lib/jwt"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    const { username, password } = req.body as { username?: string; password?: string }
    const u = (username ?? "").trim().toLowerCase()
    const p = password ?? ""

    if (!u || u.length < 2) {
      return res.status(400).json({ error: "Логин минимум 2 символа" })
    }
    if (!p || p.length < 4) {
      return res.status(400).json({ error: "Пароль минимум 4 символа" })
    }

    const existing = await sql`SELECT id FROM app_users WHERE username = ${u} LIMIT 1`
    if (existing.length > 0) {
      return res.status(400).json({ error: "Этот логин уже занят" })
    }

    const hash = await bcrypt.hash(p, 10)
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO app_users (id, username, password_hash)
      VALUES (${id}, ${u}, ${hash})
    `

    const token = await createToken({ uid: id, username: u })
    return res.status(200).json({ token })
  } catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ error: "Ошибка сервера. Попробуйте позже." })
  }
}
