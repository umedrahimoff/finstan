import { useState } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"
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

export function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects)
  const transactions = useTransactionsStore((s) => s.transactions)
  const { addProject, updateProject, deleteProject } = useProjectsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Сумма по операциям</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Проектов пока нет. Добавьте первый проект.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((prj) => {
                const total = getProjectTotal(prj.id)
                return (
                  <TableRow key={prj.id}>
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
    </div>
  )
}
