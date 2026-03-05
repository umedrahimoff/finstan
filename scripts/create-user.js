import bcrypt from "bcryptjs"
import crypto from "crypto"

const username = process.argv[2] || "admin"
const password = process.argv[3] || "admin123"
const id = crypto.randomUUID()

bcrypt.hash(password, 10).then((hash) => {
  console.log("-- Выполни в Neon SQL Editor:")
  console.log(`INSERT INTO app_users (id, username, password_hash) VALUES ('${id}', '${username}', '${hash}') ON CONFLICT (username) DO NOTHING;`)
  console.log("")
  console.log("Логин:", username)
  console.log("Пароль:", password)
})
