import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Plus, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useProjectsStore } from "@/stores/useProjectsStore"
import { useTransactionsStore } from "@/stores/useTransactionsStore"
import { formatAmount } from "@/lib/currency"
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog"
import type { ProjectFormValues } from "@/features/projects/projectFormSchema"
import type { Project } from "@/types"
import { TablePagination } from "@/components/TablePagination"

export function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addProject, updateProject, deleteProject } = useProjectsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const paginatedProjects = useMemo(
    () => projects.slice((page - 1) * pageSize, page * pageSize),
    [projects, page, pageSize]
  )

  const getProjectTotal = (projectId: string) => {
    return transactions.reduce((sum, tx) => {
      if (tx.projectId !== projectId) return sum
      if (tx.type === "income") return sum + tx.amount
      if (tx.type === "expense") return sum - tx.amount
      return sum
    }, 0)
  }

  const handleSubmit = (values: ProjectFormValues) => {
    if (editingProject) {
      updateProject(editingProject.id, values)
    } else {
      addProject(values)
    }
    setEditingProject(null)
    setDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id)
      setDeletingProject(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProjects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedProjects.map((p) => p.id)))
    }
  }

  const handleBatchDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteProject(id))
    setSelectedIds(new Set())
    setDeletingBatch(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Проекты</h1>
          <p className="text-muted-foreground">
            Учёт операций по проектам
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Добавить проект
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingBatch(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Удалить выбранные
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Снять выбор
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <button
                  type="button"
                  className="flex items-center justify-center"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.size === paginatedProjects.length && paginatedProjects.length > 0 ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Сумма по операциям</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Проектов пока нет. Добавьте первый проект.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((prj) => {
                const total = getProjectTotal(prj.id)
                return (
                  <TableRow key={prj.id}>
                    <TableCell className="w-[40px]">
                      <button
                        type="button"
                        className="flex items-center justify-center"
                        onClick={() => toggleSelect(prj.id)}
                      >
                        {selectedIds.has(prj.id) ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/transactions?project=${prj.id}`}
                        className="font-medium hover:underline"
                      >
                        {prj.name}
                      </Link>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        total >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(Math.abs(total), "UZS")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProject(prj)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingProject(prj)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={Math.ceil(projects.length / pageSize) || 1}
        totalItems={projects.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s)
          setPage(1)
        }}
      />

      <ProjectFormDialog
        key={editingProject?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingProject(null)
        }}
        defaultValues={
          editingProject ? { name: editingProject.name } : undefined
        }
        onSubmit={handleSubmit}
        title={editingProject ? "Редактировать проект" : "Новый проект"}
      />

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект &quot;{deletingProject?.name}&quot; будет удалён.
              Операции с этим проектом останутся в истории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingBatch}
        onOpenChange={(open) => !open && setDeletingBatch(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные проекты?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено проектов: {selectedIds.size}. Операции останутся в истории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
