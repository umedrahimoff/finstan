import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

const sql = neon(url)

export { sql }
