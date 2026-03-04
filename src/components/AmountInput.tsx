import { useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatAmountForInput, parseAmountFromInput } from "@/lib/currency"

interface AmountInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number
  onChange: (value: number) => void
}

export function AmountInput({ value, onChange, ...props }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue =
    value === 0 ? "" : formatAmountForInput(value)

  useEffect(() => {
    const el = inputRef.current
    if (el && document.activeElement === el) {
      el.setSelectionRange(displayValue.length, displayValue.length)
    }
  }, [displayValue])

  return (
    <Input
      ref={inputRef}
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={(e) => onChange(parseAmountFromInput(e.target.value))}
      onFocus={(e) => e.target.select()}
    />
  )
}
