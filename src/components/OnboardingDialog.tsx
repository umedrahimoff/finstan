import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  Repeat,
  FolderTree,
  Users,
  PiggyBank,
  FileText,
  Calendar,
  BarChart3,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const steps = [
  {
    icon: Wallet,
    title: "Счета",
    text: "Создайте счёт (банк, касса, электронный кошелёк) — все операции привязываются к счёту. Баланс считается автоматически.",
  },
  {
    icon: Repeat,
    title: "Операции",
    text: "Добавляйте доходы, расходы и переводы между счетами. Кнопки «Доход» и «Расход» в шапке — для быстрого ввода.",
  },
  {
    icon: FolderTree,
    title: "Категории",
    text: "Создайте категории для группировки расходов (зарплата, аренда, маркетинг). Это нужно для отчётов и бюджетирования.",
  },
  {
    icon: Users,
    title: "Контрагенты",
    text: "Укажите клиентов, поставщиков и партнёров. При вводе операции можно выбрать контрагента.",
  },
  {
    icon: PiggyBank,
    title: "Бюджеты",
    text: "Задайте лимиты по категориям на месяц. Система покажет, сколько осталось.",
  },
  {
    icon: FileText,
    title: "Отчёты",
    text: "Смотрите доходы и расходы по периодам, категориям и контрагентам.",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    text: "Графики и сводки по движению денег.",
  },
  {
    icon: Calendar,
    title: "Платежный календарь",
    text: "Создайте запланированные платежи — они покажутся в календаре и при подтверждении станут операциями.",
  },
  {
    icon: FolderKanban,
    title: "Проекты",
    text: "Группируйте операции по проектам для учёта по направлениям.",
  },
]

interface OnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function OnboardingDialog({
  open,
  onOpenChange,
  onComplete,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) onComplete?.()
  }

  const current = steps[step]
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  const handleNext = () => {
    if (isLast) {
      handleClose(false)
    } else {
      setStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    if (isFirst) return
    setStep((s) => s - 1)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Как пользоваться Finstan</span>
            <span className="text-sm font-normal text-muted-foreground">
              {step + 1} из {steps.length}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {current && (
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <current.icon className="size-6 text-muted-foreground" />
              </div>
              <div
                key={step}
                className="min-w-0 flex-1 animate-in fade-in-0 duration-200"
              >
                <h4 className="font-medium">{current.title}</h4>
                <p className="text-sm text-muted-foreground mt-2">{current.text}</p>
              </div>
            </div>
          )}
          {isLast && (
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Совет:</strong> для быстрого старта нажмите «Загрузить демо» в Настройки → Данные.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={isFirst}
          >
            <ChevronLeft className="size-4" />
            Назад
          </Button>
          <Button onClick={handleNext}>
            {isLast ? "Понятно" : "Далее"}
            {!isLast && <ChevronRight className="ml-1 size-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
