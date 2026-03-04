import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BudgetForm } from "./BudgetForm"
import type { BudgetFormValues } from "./budgetFormSchema"

interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<BudgetFormValues>
  onSubmit: (values: BudgetFormValues) => void
  title?: string
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title = "Новый бюджет",
}: BudgetFormDialogProps) {
  const handleSubmit = (values: BudgetFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <BudgetForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
