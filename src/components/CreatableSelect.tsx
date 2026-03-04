import { useState } from "react"
import { CheckIcon, PlusIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  name: string
}

interface CreatableSelectProps {
  value: string
  onChange: (value: string) => void
  items: Item[]
  onCreate: (name: string) => string
  placeholder?: string
  createLabel?: string
  emptyLabel?: string
  allowEmpty?: boolean
  className?: string
}

export function CreatableSelect({
  value,
  onChange,
  items,
  onCreate,
  placeholder = "Поиск...",
  createLabel = "Создать",
  emptyLabel = "Не выбрано",
  allowEmpty = true,
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const selectedItem = items.find((i) => i.id === value)
  const displayValue = selectedItem?.name ?? ""

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase().trim())
  )
  const exactMatch = items.some(
    (i) => i.name.toLowerCase() === search.toLowerCase().trim()
  )
  const canCreate = search.trim().length > 0 && !exactMatch

  const handleSelect = (id: string) => {
    onChange(id)
    setSearch("")
    setOpen(false)
  }

  const handleCreate = () => {
    const name = search.trim()
    if (!name) return
    const newId = onCreate(name)
    onChange(newId)
    setSearch("")
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Input
          role="combobox"
          aria-expanded={open}
          value={open ? search : displayValue}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => {
            setOpen(true)
            if (!displayValue) setSearch("")
            else setSearch(displayValue)
          }}
          placeholder={placeholder}
          className={cn("cursor-pointer", className)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder}
          />
          <CommandList>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="__empty__"
                  onSelect={() => handleSelect("")}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {emptyLabel}
                </CommandItem>
              )}
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item.id)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
              {canCreate && (
                <CommandItem onSelect={handleCreate} value="__create__">
                  <PlusIcon className="mr-2 size-4" />
                  {createLabel}: &quot;{search.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
