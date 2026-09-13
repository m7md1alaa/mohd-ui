// ─── helpers.ts ───────────────────────────────────────────────────────────────
// Pure functions that operate on ComboboxItem arrays.
// No React, no side-effects.

import type { ComboboxItem } from "./types"

/**
 * Canonical normalization for combobox label matching.
 * NFKD decomposition handles homoglyphs (e.g. ℌ → H).
 * Strips zero-width and variation-selector chars that aren't visible.
 */
export function normalizeLabel(input: string): string {
  return input
    .trim()
    .normalize("NFKD")
    .replace(/[​-‍︀-️]/g, "")
    .toLocaleLowerCase()
}

/**
 * Renders a label for display, guarding against empty values and long strings.
 * Falls back to "Untitled" for empty/whitespace-only labels.
 * Truncates with ellipsis when exceeding `maxLength` (default: no truncation).
 */
export function formatItemLabel(label: string, maxLength?: number): string {
  const trimmed = label.trim()
  if (!trimmed) {
    return "Untitled"
  }
  if (maxLength && trimmed.length > maxLength) {
    return `${trimmed.slice(0, maxLength)}…`
  }
  return trimmed
}

/**
 * Build the item list for the combobox view.
 * - When inputValue is non-empty: filter items whose normalized label contains the query
 * - When inputValue is empty: show all items (no filter)
 * - Optionally appends a "create new" sentinel when the typed text has no exact match
 *
 * This replaces Base UI's built-in filter (which is disabled via filter={() => true})
 * so that filtering and creatable logic use consistent normalizeLabel matching.
 */
export function buildItemsForView(
  items: ComboboxItem[],
  inputValue: string,
  hasOnCreate: boolean
): ComboboxItem[] {
  const trimmed = inputValue.trim()
  const lowered = normalizeLabel(trimmed)

  const filtered = trimmed
    ? items.filter((item) => normalizeLabel(item.label).includes(lowered))
    : items

  if (!hasOnCreate || trimmed === "") {
    return filtered
  }

  const exactExists = filtered.some(
    (item) => normalizeLabel(item.label) === lowered
  )

  if (exactExists) {
    return filtered
  }

  return [
    ...filtered,
    {
      creatable: trimmed,
      label: trimmed,
      value: `__create__:${lowered}`,
    },
  ]
}

/** Resolve the id to pass to onDeleteIntent. */
export function resolveDeleteId(item: ComboboxItem): string | undefined {
  return item.id ?? (item.isSystem ? undefined : item.value)
}

/** Normalise the mixed error array the public API accepts. */
export function normalizeErrors(
  error: Array<{ message?: string } | string | undefined> | undefined
): Array<{ message?: string } | undefined> {
  return error?.map((e) => (typeof e === "string" ? { message: e } : e)) ?? []
}
