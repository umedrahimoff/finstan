import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const eq = l.indexOf("=")
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()]
    })
)

const url = env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL not found in .env")
  process.exit(1)
}

const username = process.argv[2] || "admin"
const password = process.argv[3] || "admin123"

const sql = neon(url)

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  const hash = await bcrypt.hash(password, 10)
  const id = crypto.randomUUID()
  await sql`
    INSERT INTO app_users (id, username, password_hash)
    VALUES (${id}, ${username}, ${hash})
    ON CONFLICT (username) DO NOTHING
  `
  console.log("Готово!")
  console.log("Логин:", username)
  console.log("Пароль:", password)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
