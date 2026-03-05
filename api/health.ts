import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sql } from "../lib/db"

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await sql`SELECT 1`
    return res.status(200).json({ ok: true, db: true })
  } catch (err) {
    console.error("Health check:", err)
    return res.status(500).json({ ok: false, db: false, error: String((err as Error).message) })
  }
}
