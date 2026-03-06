import * as XLSX from "xlsx"
import type { Transaction, Account, Category, Counterparty, Budget, PlannedPayment, Project } from "@/types"

const TYPE_LABELS = { income: "Доход", expense: "Расход", transfer: "Перевод" } as const

export type ExportRow = {
  Дата: string
  Сумма: number
  Валюта: string
  Тип: string
  Счёт: string
  "Счёт (перевод)": string
  Категория: string
  Контрагент: string
  Проект: string
  Комментарий: string
}

function buildExportRows(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  counterparties: Counterparty[],
  projects: { id: string; name: string }[]
): ExportRow[] {
  const accMap = new Map(accounts.map((a) => [a.id, a.name]))
  const catMap = new Map(categories.map((c) => [c.id, c.name]))
  const cpMap = new Map(counterparties.map((c) => [c.id, c.name]))
  const projMap = new Map(projects.map((p) => [p.id, p.name]))

  return transactions.map((t) => ({
    Дата: t.date,
    Сумма: t.amount,
    Валюта: t.currency,
    Тип: TYPE_LABELS[t.type],
    Счёт: accMap.get(t.accountId) ?? t.accountId,
    "Счёт (перевод)": t.toAccountId ? accMap.get(t.toAccountId) ?? t.toAccountId : "",
    Категория: t.categoryId ? catMap.get(t.categoryId) ?? t.categoryId : "",
    Контрагент: t.counterpartyId ? cpMap.get(t.counterpartyId) ?? t.counterpartyId : "",
    Проект: t.projectId ? projMap.get(t.projectId) ?? t.projectId : "",
    Комментарий: t.comment ?? "",
  }))
}

export function toExcel(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  counterparties: Counterparty[],
  projects: { id: string; name: string }[]
): Blob {
  const rows = buildExportRows(transactions, accounts, categories, counterparties, projects)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Операции")
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" })
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

function escapeCsvCell(s: string): string {
  const str = String(s ?? "")
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const CSV_HEADERS: (keyof ExportRow)[] = [
  "Дата", "Сумма", "Валюта", "Тип", "Счёт", "Счёт (перевод)", "Категория", "Контрагент", "Проект", "Комментарий",
]

export function toCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  counterparties: Counterparty[],
  projects: { id: string; name: string }[] = []
): string {
  const rows = buildExportRows(transactions, accounts, categories, counterparties, projects)
  const lines = [
    CSV_HEADERS.map(escapeCsvCell).join(","),
    ...rows.map((r) => CSV_HEADERS.map((h) => escapeCsvCell(String(r[h]))).join(",")),
  ]
  return "\uFEFF" + lines.join("\r\n")
}

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function toXML(data: {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  counterparties: Counterparty[]
  budgets: Budget[]
  plannedPayments: PlannedPayment[]
  projects: Project[]
  exportedAt: string
}): string {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<finstan-export exportDate=\"" + escapeXml(data.exportedAt) + "\">"]

  parts.push("  <accounts>")
  for (const a of data.accounts) {
    parts.push(`    <account id="${escapeXml(a.id)}" name="${escapeXml(a.name)}" type="${escapeXml(a.type)}" currency="${escapeXml(a.currency)}" balance="${a.balance}"/>`)
  }
  parts.push("  </accounts>")

  parts.push("  <categories>")
  for (const c of data.categories) {
    parts.push(`    <category id="${escapeXml(c.id)}" name="${escapeXml(c.name)}" type="${escapeXml(c.type)}" parentId="${escapeXml(c.parentId ?? "")}"/>`)
  }
  parts.push("  </categories>")

  parts.push("  <counterparties>")
  for (const c of data.counterparties) {
    parts.push(`    <counterparty id="${escapeXml(c.id)}" name="${escapeXml(c.name)}" type="${escapeXml(c.type)}" inn="${escapeXml(c.inn ?? "")}"/>`)
  }
  parts.push("  </counterparties>")

  parts.push("  <projects>")
  for (const p of data.projects) {
    parts.push(`    <project id="${escapeXml(p.id)}" name="${escapeXml(p.name)}"/>`)
  }
  parts.push("  </projects>")

  parts.push("  <transactions>")
  for (const t of data.transactions) {
    const attrs = [
      `id="${escapeXml(t.id)}"`,
      `date="${escapeXml(t.date)}"`,
      `amount="${t.amount}"`,
      `currency="${escapeXml(t.currency)}"`,
      `type="${escapeXml(t.type)}"`,
      `accountId="${escapeXml(t.accountId)}"`,
      t.toAccountId ? `toAccountId="${escapeXml(t.toAccountId)}"` : "",
      t.categoryId ? `categoryId="${escapeXml(t.categoryId)}"` : "",
      t.counterpartyId ? `counterpartyId="${escapeXml(t.counterpartyId)}"` : "",
      t.projectId ? `projectId="${escapeXml(t.projectId)}"` : "",
      t.comment ? `comment="${escapeXml(t.comment)}"` : "",
    ]
      .filter(Boolean)
      .join(" ")
    parts.push(`    <transaction ${attrs}/>`)
  }
  parts.push("  </transactions>")

  parts.push("  <budgets>")
  for (const b of data.budgets) {
    parts.push(`    <budget categoryId="${escapeXml(b.categoryId)}" year="${b.year}" month="${b.month}" amount="${b.amount}" currency="${escapeXml(b.currency)}"/>`)
  }
  parts.push("  </budgets>")

  parts.push("  <plannedPayments>")
  for (const p of data.plannedPayments) {
    parts.push(`    <plannedPayment id="${escapeXml(p.id)}" date="${escapeXml(p.date)}" amount="${p.amount}" currency="${escapeXml(p.currency)}" type="${escapeXml(p.type)}" title="${escapeXml(p.title)}"/>`)
  }
  parts.push("  </plannedPayments>")

  parts.push("</finstan-export>")
  return parts.join("\n")
}
