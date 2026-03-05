import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const hasDb = !!process.env.DATABASE_URL
    if (!hasDb) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL not set" })
    }
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)
    await sql`SELECT 1`
    return res.status(200).json({ ok: true, db: true, env: { db: hasDb } })
  } catch (err) {
    console.error("Health:", err)
    return res.status(500).json({ ok: false, error: String((err as Error).message) })
  }
}
