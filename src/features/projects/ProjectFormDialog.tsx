import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectForm } from "./ProjectForm"
import type { ProjectFormValues } from "./projectFormSchema"

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<ProjectFormValues>
  onSubmit: (values: ProjectFormValues) => void
  title?: string
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title = "Новый проект",
}: ProjectFormDialogProps) {
  const handleSubmit = (values: ProjectFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
