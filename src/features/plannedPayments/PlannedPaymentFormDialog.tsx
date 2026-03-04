import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlannedPaymentForm } from "./PlannedPaymentForm"
import type { PlannedPaymentFormValues } from "./plannedPaymentFormSchema"

interface PlannedPaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<PlannedPaymentFormValues>
  onSubmit: (values: PlannedPaymentFormValues) => void
  onDelete?: () => void
  title?: string
}

export function PlannedPaymentFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  onDelete,
  title = "Запланировать платёж",
}: PlannedPaymentFormDialogProps) {
  const handleSubmit = (values: PlannedPaymentFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PlannedPaymentForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          onDelete={onDelete ? handleDelete : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}
