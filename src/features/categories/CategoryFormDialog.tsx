import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CategoryForm } from "./CategoryForm"
import type { CategoryFormValues } from "./categoryFormSchema"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<CategoryFormValues>
  onSubmit: (values: CategoryFormValues) => void
  title?: string
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title = "Новая категория",
}: CategoryFormDialogProps) {
  const handleSubmit = (values: CategoryFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <CategoryForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
