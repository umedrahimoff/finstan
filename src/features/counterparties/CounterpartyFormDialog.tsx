import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CounterpartyForm } from "./CounterpartyForm"
import type { CounterpartyFormValues } from "./counterpartyFormSchema"

interface CounterpartyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<CounterpartyFormValues>
  onSubmit: (values: CounterpartyFormValues) => void
  title?: string
}

export function CounterpartyFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title = "Новый контрагент",
}: CounterpartyFormDialogProps) {
  const handleSubmit = (values: CounterpartyFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <CounterpartyForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
