import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/providers/AuthProvider"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"
import { apiFetch } from "@/api/client"
import { parseBankCsv, type BankRow } from "@/lib/importBank"
import { parseExportRU, type ExportRURow } from "@/lib/importExportRU"
import { toCSV } from "@/lib/exportData"
import { formatAmount } from "@/lib/currency"
import { getSystemCurrency } from "@/stores/useSettingsStore"

export function SettingsDataPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [importFormat, setImportFormat] = useState<"kapitalbank" | "exportru">("kapitalbank")
  const [importBankRows, setImportBankRows] = useState<BankRow[]>([])
  const [importExportRURows, setImportExportRURows] = useState<ExportRURow[]>([])
  const [importError, setImportError] = useState("")
  const [importAccountId, setImportAccountId] = useState("")
  const [importing, setImporting] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [demoError, setDemoError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const allCompanies = useCompanyStore((s) => s.companies)
  const companies = useMemo(
    () => allCompanies.filter((c) => !c.archived),
    [allCompanies]
  )
  const companyId = useCompanyStore((s) => s.currentCompanyId) ?? "default"
  const accounts = useCompanyDataStore((s) => s.getAccounts(companyId))
  const counterparties = useCompanyDataStore((s) => s.getCounterparties(companyId))
  const resetCompanyDataBatch = useCompanyDataStore((s) => s.resetCompanyDataBatch)
  const addTransactionsBatch = useCompanyDataStore((s) => s.addTransactionsBatch)
  const addCounterparty = useCompanyDataStore((s) => s.addCounterparty)

  const primaryAccount = useMemo(
    () => accounts.find((a) => a.isPrimary) ?? accounts[0],
    [accounts]
  )

  useEffect(() => {
    if (importDialogOpen && primaryAccount && !importAccountId) {
      setImportAccountId(primaryAccount.id)
    }
  }, [importDialogOpen, primaryAccount, importAccountId])

  useEffect(() => {
    if (importDialogOpen && accounts.length > 0 && !importAccountId) {
      const acc = accounts.find((a) => a.isPrimary) ?? accounts[0]
      if (acc) setImportAccountId(acc.id)
    }
  }, [importDialogOpen, accounts, importAccountId])

  const handleOpenReset = () => {
    setSelectedCompanyIds(new Set(companies.map((c) => c.id)))
    setResetDialogOpen(true)
  }

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleReset = () => {
    resetCompanyDataBatch(Array.from(selectedCompanyIds))
    setResetDialogOpen(false)
    const byCompany = useCompanyDataStore.getState().byCompany
    try {
      localStorage.setItem(
        "finstan-company-data",
        JSON.stringify({ state: { byCompany }, version: 0 })
      )
    } catch (_) {}
    setTimeout(() => window.location.reload(), 50)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImportError("")
    setImportBankRows([])
    setImportExportRURows([])
    if (importFormat === "exportru") {
      const reader = new FileReader()
      reader.onload = () => {
        const buf = reader.result
        if (!(buf instanceof ArrayBuffer)) return
        const { rows, errors } = parseExportRU(buf)
        if (errors.length > 0) {
          setImportError(errors.join(". "))
        } else {
          setImportExportRURows(rows)
          if (primaryAccount && !importAccountId) setImportAccountId(primaryAccount.id)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result ?? "")
        const { rows, errors } = parseBankCsv(text)
        if (errors.length > 0) {
          setImportError(errors.join(". "))
        } else {
          setImportBankRows(rows)
          if (primaryAccount && !importAccountId) setImportAccountId(primaryAccount.id)
        }
      }
      reader.readAsText(file, "UTF-8")
    }
  }

  const sanitizeCounterpartyName = (s: string): string =>
    (s ?? "").replace(/[^\d-]/g, "").trim()

  const exportRUImportable = importExportRURows.filter((r) => r.type !== "transfer" && r.date)
  const effectiveAccountId = importAccountId || primaryAccount?.id
  const handleImport = () => {
    const bankCount = importBankRows.filter((r) => r.debit > 0 || r.credit > 0).length
    const exportRUCount = exportRUImportable.length
    const totalCount = importFormat === "kapitalbank" ? bankCount : exportRUCount
    if (totalCount === 0 || !effectiveAccountId) return
    setImporting(true)
    const nameToCpId = new Map<string, string>()
    for (const cp of counterparties) {
      const s = sanitizeCounterpartyName(cp.name)
      if (s) nameToCpId.set(s, cp.id)
      const t = cp.name.trim()
      if (t) nameToCpId.set(t, cp.id)
    }
    const getOrCreateCounterpartyId = (name: string, sanitize: boolean): string | undefined => {
      const key = sanitize ? sanitizeCounterpartyName(name) : name.trim()
      if (!key) return undefined
      let id = nameToCpId.get(key)
      if (!id) {
        try {
          const cp = addCounterparty({ name: sanitize ? key : name.trim(), type: "client" })
          id = cp.id
        } catch {
          const existing = counterparties.find(
            (c) => c.name.toLowerCase().trim() === (sanitize ? key : name.trim()).toLowerCase()
          )
          id = existing?.id
        }
        if (id) nameToCpId.set(key, id)
      }
      return id
    }
    type TxItem = { date: string; amount: number; type: "income" | "expense"; comment: string; counterpartyId?: string }
    let txs: TxItem[]
    if (importFormat === "kapitalbank") {
      txs = importBankRows.flatMap((r) => {
        const cpName = sanitizeCounterpartyName(r.accountName) || sanitizeCounterpartyName(r.accountNumber)
        const counterpartyId = cpName ? getOrCreateCounterpartyId(cpName, true) : undefined
        const items: TxItem[] = []
        if (r.debit > 0) {
          items.push({
            date: r.docDate || r.processDate,
            amount: r.debit,
            type: "expense",
            comment: r.purpose || `${r.docNumber} ${r.accountName}`.trim(),
            counterpartyId,
          })
        }
        if (r.credit > 0) {
          items.push({
            date: r.docDate || r.processDate,
            amount: r.credit,
            type: "income",
            comment: r.purpose || `${r.docNumber} ${r.accountName}`.trim(),
            counterpartyId,
          })
        }
        return items
      })
    } else {
      txs = importExportRURows
        .filter((r) => r.type !== "transfer" && r.date)
        .map((r) => ({
          date: r.date,
          amount: r.amount,
          type: r.type as "income" | "expense",
          comment: [r.comment, r.counterparty, r.category].filter(Boolean).join(" · ") || r.counterparty || "—",
          counterpartyId: r.counterparty ? getOrCreateCounterpartyId(r.counterparty, false) : undefined,
        }))
    }
    addTransactionsBatch(
      txs.map((t) => ({
        date: t.date,
        amount: t.amount,
        currency: getSystemCurrency(),
        type: t.type,
        accountId: effectiveAccountId,
        counterpartyId: t.counterpartyId,
        comment: t.comment,
      }))
    )
    setImporting(false)
    setImportDialogOpen(false)
    setImportBankRows([])
    setImportExportRURows([])
  }

  const handleLoadDemo = async () => {
    setDemoError("")
    setLoadingDemo(true)
    try {
      await apiFetch("/data", { method: "PUT", body: JSON.stringify({ action: "seed-demo" }) })
      const res = await apiFetch<{ byCompany?: Record<string, unknown>; companies?: { id: string; name: string; archived?: boolean }[] }>("/data")
      if (res?.companies?.length) {
        useCompanyStore.getState().setCompaniesFromServer(res.companies)
      }
      if (res?.byCompany && Object.keys(res.byCompany).length > 0) {
        useCompanyDataStore.getState().setByCompanyFromServer(res.byCompany as never)
        useCompanyStore.getState().ensureCompany("demo", "Демо")
        useCompanyStore.getState().setCurrentCompany("demo")
      }
      window.location.reload()
    } catch (e) {
      setDemoError((e as Error).message || "Ошибка загрузки демо")
    } finally {
      setLoadingDemo(false)
    }
  }

  const handleExportCSV = () => {
    const cid = useCompanyStore.getState().currentCompanyId ?? "default"
    const ds = useCompanyDataStore.getState()
    const { transactions, accounts, categories, counterparties, projects } = {
      transactions: ds.getTransactions(cid),
      accounts: ds.getAccounts(cid),
      categories: ds.getCategories(cid),
      counterparties: ds.getCounterparties(cid),
      projects: ds.getProjects(cid),
    }
    const csv = toCSV(transactions, accounts, categories, counterparties, projects)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finstan-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Данные</h2>
          <p className="text-sm text-muted-foreground">
            Экспорт и сброс данных приложения
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Данные</CardTitle>
            <CardDescription>Экспорт и сброс данных</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={handleLoadDemo}
                disabled={loadingDemo}
              >
                {loadingDemo ? "Загрузка..." : "Загрузить демо"}
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                Экспорт CSV
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                Импорт данных
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleOpenReset}
                >
                  Очистить данные
                </Button>
              )}
            </div>
            {demoError && <p className="text-sm text-destructive">{demoError}</p>}
            <p className="text-sm text-muted-foreground">
              Демо: 25 операций, 3 счёта, 6 категорий, бюджеты. Экспорт — CSV. Импорт — Капиталбанк (CSV) или ExportRU (xlsx).
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить данные</AlertDialogTitle>
            <AlertDialogDescription>
              Выберите компании — все операции, счета, категории и прочие данные будут полностью удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-4">
            {companies.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selectedCompanyIds.has(c.id)}
                  onChange={() => toggleCompany(c.id)}
                  className="size-4 rounded border-input"
                />
                <span className="font-medium">{c.name}</span>
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={selectedCompanyIds.size === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open)
          if (!open) {
            setImportBankRows([])
            setImportExportRURows([])
            setImportError("")
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Импорт данных</DialogTitle>
            <DialogDescription>
              Выберите формат и загрузите файл.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-auto">
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={importFormat}
                onValueChange={(v: "kapitalbank" | "exportru") => {
                  setImportFormat(v)
                  setImportBankRows([])
                  setImportExportRURows([])
                  setImportError("")
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kapitalbank">Капиталбанк (CSV)</SelectItem>
                  <SelectItem value="exportru">ExportRU (xlsx)</SelectItem>
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept={importFormat === "exportru" ? ".xlsx,.xls" : ".csv,.txt"}
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Выбрать файл
              </Button>
              {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала создайте счёт в разделе «Счета».
              </p>
            ) : (
                <Select
                  value={importAccountId || primaryAccount?.id || ""}
                  onValueChange={setImportAccountId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Счёт для операций" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
            {importFormat === "kapitalbank" && importBankRows.length > 0 && (
              <div className="border rounded-md max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Контрагент</TableHead>
                      <TableHead>Дебет</TableHead>
                      <TableHead>Кредит</TableHead>
                      <TableHead className="max-w-[200px] truncate">Назначение</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importBankRows.slice(0, 50).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.docDate || r.processDate}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={r.accountName}>
                          {r.accountName || "—"}
                        </TableCell>
                        <TableCell>{r.debit ? formatAmount(r.debit, getSystemCurrency()) : "—"}</TableCell>
                        <TableCell>{r.credit ? formatAmount(r.credit, getSystemCurrency()) : "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={r.purpose}>
                          {r.purpose || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {importBankRows.length > 50 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Показано 50 из {importBankRows.length}. Будет импортировано: {importBankRows.filter((r) => r.debit > 0 || r.credit > 0).length} операций.
                  </p>
                )}
              </div>
            )}
            {importFormat === "exportru" && importExportRURows.length > 0 && (
              <div className="border rounded-md max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Контрагент</TableHead>
                      <TableHead className="max-w-[200px] truncate">Комментарий</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importExportRURows
                      .filter((r) => r.type !== "transfer")
                      .slice(0, 50)
                      .map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.type === "income" ? "Доход" : "Расход"}</TableCell>
                          <TableCell>{formatAmount(r.amount, getSystemCurrency())}</TableCell>
                          <TableCell className="max-w-[150px] truncate" title={r.counterparty}>
                            {r.counterparty || "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={r.comment}>
                            {r.comment || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {importExportRURows.filter((r) => r.type !== "transfer").length > 50 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Показано 50 из {importExportRURows.filter((r) => r.type !== "transfer").length}. Будет импортировано: {importExportRURows.filter((r) => r.type !== "transfer").length} операций.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                (importFormat === "kapitalbank"
                  ? importBankRows.filter((r) => r.debit > 0 || r.credit > 0).length === 0
                  : exportRUImportable.length === 0) ||
                !effectiveAccountId ||
                importing
              }
            >
              {importing
                ? "Импорт..."
                : `Импортировать (${
                    importFormat === "kapitalbank"
                      ? importBankRows.filter((r) => r.debit > 0 || r.credit > 0).length
                      : exportRUImportable.length
                  })`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
