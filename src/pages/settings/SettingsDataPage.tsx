import { useMemo, useState } from "react"
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
import { useCompanyStore } from "@/stores/useCompanyStore"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"

export function SettingsDataPage() {
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const allCompanies = useCompanyStore((s) => s.companies)
  const companies = useMemo(
    () => allCompanies.filter((c) => !c.archived),
    [allCompanies]
  )
  const resetCompanyDataBatch = useCompanyDataStore((s) => s.resetCompanyDataBatch)

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

  const handleExportData = () => {
    const companyId = useCompanyStore.getState().currentCompanyId ?? "default"
    const ds = useCompanyDataStore.getState()
    const data = {
      transactions: ds.getTransactions(companyId),
      accounts: ds.getAccounts(companyId),
      categories: ds.getCategories(companyId),
      counterparties: ds.getCounterparties(companyId),
      budgets: ds.getBudgets(companyId),
      plannedPayments: ds.getPlannedPayments(companyId),
      projects: ds.getProjects(companyId),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finstan-backup-${new Date().toISOString().slice(0, 10)}.json`
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
              <Button variant="outline" onClick={handleExportData}>
                Экспорт данных
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleOpenReset}
              >
                Очистить данные
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Экспорт сохраняет все операции, счета, категории, контрагентов,
              бюджеты, запланированные платежи и проекты в JSON-файл.
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить данные</AlertDialogTitle>
            <AlertDialogDescription>
              Выберите компании, данные которых нужно сбросить к начальным значениям.
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
    </>
  )
}
