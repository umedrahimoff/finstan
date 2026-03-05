import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const username = process.argv[2] || "admin"
const password = process.argv[3] || "admin123"

const sql = neon(url)
const hash = await bcrypt.hash(password, 10)
await sql`
  INSERT INTO app_users (username, password_hash)
  VALUES (${username}, ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
`
console.log(`User "${username}" ready`)
