import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "No token" })
  const payload = await verifyToken(token)
  if (!payload) return res.status(401).json({ error: "Invalid token" })
  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    const rows = await sql`SELECT username, role FROM app_users WHERE id = ${payload.uid} AND frozen = false LIMIT 1`
    const row = rows[0] as { username: string; role: string } | undefined
    if (!row) return res.status(401).json({ error: "User not found or blocked" })
    return res.status(200).json({
      uid: payload.uid,
      username: row.username,
      role: row.role ?? "user",
    })
  } catch (err) {
    console.error("Auth me:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
