// ─── types.ts ───────────────────────────────────────────────────────────────
// Shared types for the combobox module.

export interface ComboboxItem {
  /** Stable id, if different from `value` (e.g. a database id). */
  id?: string
  /** Unique value used for selection/equality. */
  value: string
  /** Display label. */
  label: string
  /** Present on the synthetic "create new" row appended while typing. */
  creatable?: string
  /** Marks an item that the caller doesn't want edited/deleted inline. */
  isSystem?: boolean
}

export interface ComboboxProps {
  items: ComboboxItem[]
  /** Selected value (matches `ComboboxItem.value`), or "" for none. */
  value: string
  onChange: (value: string) => void
  /** Called when the user commits a typed value that has no matching item. */
  onCreateIntent?: (label: string) => void
  onEditIntent?: (item: ComboboxItem) => void
  onDeleteIntent?: (id: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  error?: Array<{ message?: string } | string | undefined>
}

export interface MultiComboboxProps {
  items: ComboboxItem[]
  values: string[]
  onChange: (values: string[]) => void
  onCreateIntent?: (label: string) => void
  onEditIntent?: (item: ComboboxItem) => void
  onDeleteIntent?: (id: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  error?: Array<{ message?: string } | string | undefined>
}
