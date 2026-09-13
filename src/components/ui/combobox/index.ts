// ─── index.ts ─────────────────────────────────────────────────────────────────
// Public API for the combobox module.
// Uses the Compound Components pattern (Dot Notation) for a clean namespace.
//
// Usage:
//   import { Combobox } from "@/components/ui/combobox"
//   <Combobox.Single ... />
//   <Combobox.Multi ... />
//
// Types are exported separately:
//   import type { ComboboxItem, ComboboxProps, MultiComboboxProps } from "..";

import { MultiCombobox } from "./multi-combobox"
import { SingleCombobox } from "./single-combobox"
import type { ComboboxItem, ComboboxProps, MultiComboboxProps } from "./types"

export const Combobox = {
  Single: SingleCombobox,
  Multi: MultiCombobox,
}

export type { ComboboxItem, ComboboxProps, MultiComboboxProps }
