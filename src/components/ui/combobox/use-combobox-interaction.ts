// ─── use-combobox-interaction.ts ──────────────────────────────────────────────
// The interaction brain for a single-select combobox.
// Owns: inputValue, isOpen, derived item list, keyboard interceptor.
// Emits only clean intent callbacks — no data mutations, no toasts.

import { useCallback, useMemo, useRef, useState } from "react"
import { buildItemsForView, normalizeLabel } from "./helpers"
import type { ComboboxItem } from "./types"

interface UseSingleComboboxInteractionOptions {
  items: ComboboxItem[]
  onChange: (value: string) => void
  onCreateIntent?: (label: string) => void
  value: string
}

export interface SingleComboboxInteraction {
  // Keyboard interceptor to wire into <Combobox.Input onKeyDown>
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  // State
  inputValue: string
  // Stable callbacks for Base UI
  isItemEqualToValue: (a: ComboboxItem, b: ComboboxItem) => boolean
  isOpen: boolean
  itemsForView: ComboboxItem[]
  itemToStringLabel: (item: ComboboxItem) => string
  itemToStringValue: (item: ComboboxItem) => string
  onInputValueChange: (v: string) => void
  onItemHighlighted: (item: ComboboxItem | undefined) => void
  onOpenChange: (open: boolean) => void
  onValueChange: (item: ComboboxItem | null) => void
  selectedItem: ComboboxItem | null
}

export function useSingleComboboxInteraction({
  items,
  value,
  onChange,
  onCreateIntent,
}: UseSingleComboboxInteractionOptions): SingleComboboxInteraction {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const highlightedRef = useRef<ComboboxItem | undefined>(undefined)

  const selectedItem = useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  )

  const itemsForView = useMemo(
    () => buildItemsForView(items, inputValue, !!onCreateIntent),
    [items, inputValue, onCreateIntent]
  )

  const isItemEqualToValue = useCallback(
    (a: ComboboxItem, b: ComboboxItem) => a.value === b.value,
    []
  )
  const itemToStringLabel = useCallback((item: ComboboxItem) => item.label, [])
  const itemToStringValue = useCallback((item: ComboboxItem) => item.value, [])

  const onItemHighlighted = useCallback((item: ComboboxItem | undefined) => {
    highlightedRef.current = item
  }, [])

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setInputValue("")
    }
  }, [])
  const onInputValueChange = useCallback((v: string) => setInputValue(v), [])

  const onValueChange = useCallback(
    (val: ComboboxItem | null) => {
      if (!val) {
        onChange("")
        setInputValue("")
        return
      }
      if (val.creatable) {
        onCreateIntent?.(val.creatable)
        setInputValue("")
        setIsOpen(false)
        return
      }
      setInputValue("")
      onChange(val.value)
      setIsOpen(false)
    },
    [onChange, onCreateIntent]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Cmd/Ctrl+Enter always closes, regardless of state
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        setIsOpen(false)
        return
      }

      if (e.key !== "Enter") {
        return
      }

      if (highlightedRef.current) {
        e.preventDefault()
        return
      }

      const trimmed = inputValue.trim()
      if (!(trimmed && onCreateIntent)) {
        return
      }

      const lowered = normalizeLabel(trimmed)
      const exactExists = items.some(
        (item) => normalizeLabel(item.label) === lowered
      )
      if (exactExists) {
        return
      }

      e.preventDefault()
      onCreateIntent(trimmed)
      setInputValue("")
      setIsOpen(false)
    },
    [inputValue, items, onCreateIntent]
  )

  return {
    inputValue,
    isOpen,
    itemsForView,
    selectedItem,
    isItemEqualToValue,
    itemToStringLabel,
    itemToStringValue,
    onInputValueChange,
    onItemHighlighted,
    onOpenChange,
    onValueChange,
    handleInputKeyDown,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-select variant
// ─────────────────────────────────────────────────────────────────────────────

interface UseMultiComboboxInteractionOptions {
  items: ComboboxItem[]
  onChange: (values: string[]) => void
  onCreateIntent?: (label: string) => void
  values: string[]
}

export interface MultiComboboxInteraction {
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  inputValue: string
  isItemEqualToValue: (a: ComboboxItem, b: ComboboxItem) => boolean
  isOpen: boolean
  itemsForView: ComboboxItem[]
  itemToStringLabel: (item: ComboboxItem) => string
  itemToStringValue: (item: ComboboxItem) => string
  onInputValueChange: (v: string) => void
  onItemHighlighted: (item: ComboboxItem | undefined) => void
  onOpenChange: (open: boolean) => void
  onValueChange: (items: ComboboxItem[]) => void
  selectedItems: ComboboxItem[]
}

export function useMultiComboboxInteraction({
  items,
  values,
  onChange,
  onCreateIntent,
}: UseMultiComboboxInteractionOptions): MultiComboboxInteraction {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const highlightedRef = useRef<ComboboxItem | undefined>(undefined)

  const selectedItems = useMemo(
    () =>
      values
        .map((v) => items.find((item) => item.value === v))
        .filter((item): item is ComboboxItem => !!item),
    [items, values]
  )

  const itemsForView = useMemo(
    () => buildItemsForView(items, inputValue, !!onCreateIntent),
    [items, inputValue, onCreateIntent]
  )

  const isItemEqualToValue = useCallback(
    (a: ComboboxItem, b: ComboboxItem) => a.value === b.value,
    []
  )
  const itemToStringLabel = useCallback((item: ComboboxItem) => item.label, [])
  const itemToStringValue = useCallback((item: ComboboxItem) => item.value, [])

  const onItemHighlighted = useCallback((item: ComboboxItem | undefined) => {
    highlightedRef.current = item
  }, [])

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setInputValue("")
    }
  }, [])
  const onInputValueChange = useCallback((v: string) => setInputValue(v), [])

  const onValueChange = useCallback(
    (val: ComboboxItem[]) => {
      const creatable = val.find((v) => v.creatable)
      if (creatable) {
        const name = creatable.creatable ?? ""
        const clean = val.filter((v) => !v.creatable).map((v) => v.value)
        onCreateIntent?.(name)
        onChange([...clean, name])
        setInputValue("")
        return
      }
      onChange(val.map((v) => v.value))
      setInputValue("")
    },
    [onChange, onCreateIntent]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        setIsOpen(false)
        return
      }

      if (e.key !== "Enter") {
        return
      }

      if (highlightedRef.current) {
        e.preventDefault()
        return
      }

      const trimmed = inputValue.trim()
      if (!(trimmed && onCreateIntent)) {
        return
      }

      const lowered = normalizeLabel(trimmed)
      const exactExists = items.some(
        (item) => normalizeLabel(item.label) === lowered
      )
      if (exactExists) {
        return
      }

      e.preventDefault()
      onCreateIntent(trimmed)
      onChange([...values, trimmed])
      setInputValue("")
    },
    [inputValue, items, values, onChange, onCreateIntent]
  )

  return {
    inputValue,
    isOpen,
    itemsForView,
    selectedItems,
    isItemEqualToValue,
    itemToStringLabel,
    itemToStringValue,
    onInputValueChange,
    onItemHighlighted,
    onOpenChange,
    onValueChange,
    handleInputKeyDown,
  }
}
