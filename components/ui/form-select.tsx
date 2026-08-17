import { cn } from "@/lib/utils"

export function FormSelect({
  id,
  name,
  label,
  defaultValue,
  value,
  onChange,
  placeholder,
  options,
  disabled,
  required,
}: {
  id: string
  name?: string
  label: string
  defaultValue?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  options: readonly string[] | readonly { value: string; label: string }[]
  disabled?: boolean
  required?: boolean
}) {
  const selectProps =
    value !== undefined
      ? { value, onChange }
      : { defaultValue: defaultValue ?? "" }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        {...selectProps}
        className={cn(
          "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value
          const labelText = typeof option === "string" ? option : option.label
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          )
        })}
      </select>
    </div>
  )
}
