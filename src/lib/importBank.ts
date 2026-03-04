/** Строка банковской выписки */
export interface BankRow {
  docDate: string
  processDate: string
  docNumber: string
  accountName: string
  inn: string
  accountNumber: string
  mfo: string
  debit: number
  credit: number
  purpose: string
}

function parseNumber(s: string): number {
  const cleaned = String(s ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function parseDate(s: string): string {
  const str = String(s ?? "").trim()
  if (!str) return ""
  const m = str.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/)
  if (m) {
    const [, d, mon, y] = m
    const year = y.length === 2 ? "20" + y : y
    return `${year}-${mon.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return str
}

function parseFullCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === delimiter) {
      currentRow.push(current.trim().replace(/\s+/g, " "))
      current = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      currentRow.push(current.trim().replace(/\s+/g, " "))
      current = ""
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
    } else {
      current += c
    }
  }
  if (current.length > 0 || currentRow.length > 0) {
    currentRow.push(current.trim().replace(/\s+/g, " "))
    if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow)
  }
  return rows
}

function normalizeHeader(h: string): string {
  return h.replace(/\s+/g, " ").replace(/^["']|["']$/g, "").trim()
}

export function parseBankCsv(text: string): { rows: BankRow[]; errors: string[] } {
  const errors: string[] = []
  const delimiter = ";"
  const allRows = parseFullCsv(text, delimiter)

  let headerRowIndex = -1
  let colIndex: Record<string, number> = {}

  for (let i = 0; i < allRows.length; i++) {
    const cells = allRows[i]
    const normalized = cells.map(normalizeHeader)
    const joined = normalized.join(" ")
    if (
      joined.includes("Дата документа") ||
      joined.includes("Обороты по дебету") ||
      joined.includes("№ док")
    ) {
      headerRowIndex = i
      for (let j = 0; j < normalized.length; j++) {
        const h = normalized[j]
        if (h) colIndex[h] = j
      }
      if (colIndex["Дата документа"] === undefined) {
        const idx = normalized.findIndex((n) => n.includes("Дата") && n.includes("документа"))
        if (idx >= 0) colIndex["Дата документа"] = idx
      }
      if (colIndex["Дата обработки"] === undefined) {
        const idx = normalized.findIndex((n) => n.includes("Дата") && n.includes("обработки"))
        if (idx >= 0) colIndex["Дата обработки"] = idx
      }
      if (colIndex["Обороты по дебету"] === undefined) {
        const idx = normalized.findIndex((n) => n.includes("Обороты") && n.includes("дебету"))
        if (idx >= 0) colIndex["Обороты по дебету"] = idx
      }
      if (colIndex["Обороты по кредиту"] === undefined) {
        const idx = normalized.findIndex((n) => n.includes("Обороты") && n.includes("кредиту"))
        if (idx >= 0) colIndex["Обороты по кредиту"] = idx
      }
      if (colIndex["Назначение платежа"] === undefined) {
        const idx = normalized.findIndex((n) => n.includes("Назначение") && n.includes("платежа"))
        if (idx >= 0) colIndex["Назначение платежа"] = idx
      }
      break
    }
  }

  if (headerRowIndex < 0) {
    return {
      rows: [],
      errors: ["Не найдена строка заголовков с колонками Дата документа, Обороты по дебету/кредиту"],
    }
  }

  const hasRequired =
    (colIndex["Дата документа"] !== undefined ||
      colIndex["Дата обработки"] !== undefined) &&
    (colIndex["Обороты по дебету"] !== undefined ||
      colIndex["Обороты по кредиту"] !== undefined)

  if (!hasRequired) {
    return {
      rows: [],
      errors: ["Не найдены обязательные колонки: Дата документа, Обороты по дебету/кредиту"],
    }
  }

  const findCol = (key: string): number | undefined => {
    if (colIndex[key] !== undefined) return colIndex[key]
    const k = key.toLowerCase()
    for (const [h, idx] of Object.entries(colIndex)) {
      if (h.toLowerCase().includes(k) || k.split(" ").every((w) => h.toLowerCase().includes(w)))
        return idx
    }
    return undefined
  }

  const getCol = (cells: string[], name: string): string => {
    const idx = findCol(name)
    return idx !== undefined ? (cells[idx] ?? "").trim() : ""
  }

  const rows: BankRow[] = []
  for (let i = headerRowIndex + 1; i < allRows.length; i++) {
    const cells = allRows[i]
    const debit = parseNumber(getCol(cells, "Обороты по дебету"))
    const credit = parseNumber(getCol(cells, "Обороты по кредиту"))

    if (debit === 0 && credit === 0) continue

    const docDate = parseDate(
      getCol(cells, "Дата документа") || getCol(cells, "Дата обработки")
    )

    if (!docDate) continue

    rows.push({
      docDate,
      processDate: parseDate(getCol(cells, "Дата обработки")),
      docNumber: getCol(cells, "№ док"),
      accountName: getCol(cells, "Наименование счёта"),
      inn: getCol(cells, "ИНН"),
      accountNumber: getCol(cells, "№ счёта"),
      mfo: getCol(cells, "МФО"),
      debit,
      credit,
      purpose: getCol(cells, "Назначение платежа"),
    })
  }

  return { rows, errors }
}
