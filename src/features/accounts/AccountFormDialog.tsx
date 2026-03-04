import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AccountForm } from "./AccountForm"
import type { AccountFormValues } from "./accountFormSchema"

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<AccountFormValues>
  onSubmit: (values: AccountFormValues) => void
  title?: string
}

export function AccountFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title = "Новый счёт",
}: AccountFormDialogProps) {
  const handleSubmit = (values: AccountFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <AccountForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
