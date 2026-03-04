import * as XLSX from "xlsx"

export interface ExportRURow {
  date: string
  amount: number
  type: "income" | "expense" | "transfer"
  fromAccount: string
  toAccount: string
  category: string
  counterparty: string
  comment: string
}

function excelDateToISO(serial: number): string {
  const date = XLSX.SSF.parse_date_code(serial)
  if (!date) return ""
  const y = date.y
  const m = String(date.m).padStart(2, "0")
  const d = String(date.d).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseExportRU(buffer: ArrayBuffer): { rows: ExportRURow[]; errors: string[] } {
  const errors: string[] = []
  const wb = XLSX.read(buffer, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

  if (data.length < 2) {
    return { rows: [], errors: ["Файл пуст или содержит только заголовок"] }
  }

  const headerRow = data[0]
  const colIndex: Record<string, number> = {}
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] ?? "").trim()
    if (h) colIndex[h] = i
  }

  const get = (row: string[], name: string): string =>
    String(row[colIndex[name] ?? -1] ?? "").trim()
  const getNum = (row: string[], name: string): number => {
    const v = row[colIndex[name] ?? -1]
    if (typeof v === "number") return v
    const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."))
    return isNaN(n) ? 0 : n
  }

  const hasDate = colIndex["Дата платежа"] !== undefined || colIndex["Дата начисления"] !== undefined
  const hasAmount = colIndex["Сумма в валюте счета"] !== undefined || colIndex["Сумма в валюте компании"] !== undefined

  if (!hasDate || !hasAmount) {
    return {
      rows: [],
      errors: ["Не найдены колонки: Дата платежа, Сумма в валюте счета"],
    }
  }

  const rows: ExportRURow[] = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row)) continue

    const dateSerial = getNum(row, "Дата платежа") || getNum(row, "Дата начисления")
    const amount = getNum(row, "Сумма в валюте счета") || getNum(row, "Сумма в валюте компании")
    const fromAccount = get(row, "Со счета")
    const toAccount = get(row, "На счет")

    if (!amount) continue

    let type: "income" | "expense" | "transfer" = "expense"
    if (!fromAccount && toAccount) type = "income"
    else if (fromAccount && toAccount) type = "transfer"

    const date = dateSerial ? excelDateToISO(dateSerial) : ""

    rows.push({
      date,
      amount: Math.abs(amount),
      type,
      fromAccount,
      toAccount,
      category: get(row, "Категория"),
      counterparty: get(row, "Контрагент"),
      comment: get(row, "Комментарий"),
    })
  }

  return { rows, errors }
}
