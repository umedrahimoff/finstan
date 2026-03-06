import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getAuth(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload
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
      const rows = await sql`SELECT data FROM user_data WHERE user_id = ${auth.uid} LIMIT 1`
      const data = rows[0]?.data ?? {}
      return res.status(200).json(data)
    }

    if (req.method === "PUT") {
      const body = req.body
      if (!body || typeof body !== "object") {
        return res.status(400).json({ error: "Invalid body" })
      }
      await sql`
        INSERT INTO user_data (user_id, data)
        VALUES (${auth.uid}, ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data
      `
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err) {
    console.error("Data API:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
