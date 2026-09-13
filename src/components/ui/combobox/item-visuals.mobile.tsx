// ─── item-visuals.mobile.tsx ──────────────────────────────────────────────────
// Purely presentational mobile list row components.
// Rows are HIG-compliant (48px min, text-base, font-medium).
// Edit / delete surface through a bottom sheet action menu, not inline icons.
// The only local state is the action-sheet open/close toggle.

import { Combobox } from "@base-ui/react/combobox"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  CheckIcon,
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { formatItemLabel, resolveDeleteId } from "./helpers"
import type { ComboboxItem } from "./types"

// ─── Creatable sentinel row ────────────────────────────────────────────────────

export function MobileCreatableItem({ item }: { item: ComboboxItem }) {
  return (
    <Combobox.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-3",
        "min-h-[48px] rounded-xl px-4 py-3 text-base outline-none",
        "text-emerald-600 dark:text-emerald-400",
        "transition-colors data-[highlighted]:bg-emerald-500/10"
      )}
      value={item}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
        <PlusIcon className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium">
        New:{" "}
        <span className="font-semibold">
          {formatItemLabel(item.creatable ?? "")}
        </span>
      </span>
    </Combobox.Item>
  )
}

// ─── Regular item row ─────────────────────────────────────────────────────────

export function MobileRegularItem({
  item,
  isSelected,
  onEditIntent,
  onDeleteIntent,
}: {
  item: ComboboxItem
  isSelected: boolean
  onEditIntent?: (item: ComboboxItem) => void
  onDeleteIntent?: (id: string) => void
}) {
  const [actionSheetOpen, setActionSheetOpen] = useState(false)

  const canEdit = !item.isSystem && !!onEditIntent
  const deleteId = resolveDeleteId(item)
  const canDelete = !item.isSystem && !!onDeleteIntent && !!deleteId
  const hasActions = canEdit || canDelete

  return (
    <>
      <Combobox.Item
        className={cn(
          "relative flex cursor-default select-none items-center gap-3",
          // 48px min — HIG compliant
          "min-h-[48px] rounded-xl px-4 py-3 outline-none",
          "font-medium text-base text-foreground",
          "transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          hasActions ? "pe-12" : "pe-4"
        )}
        value={item}
      >
        {/* checkmark always in the DOM, invisible when not selected */}
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center",
            isSelected ? "text-primary" : "text-transparent"
          )}
        >
          <CheckIcon className="h-4 w-4" />
        </span>

        <span className="flex-1 truncate">{formatItemLabel(item.label)}</span>

        {/* button — large enough to tap without hitting the row */}
        {hasActions && (
          <button
            className={cn(
              "absolute end-3 flex h-8 w-8 items-center justify-center",
              "rounded-lg text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setActionSheetOpen(true)
            }}
            type="button"
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </button>
        )}
      </Combobox.Item>

      {/* Bottom-sheet action menu */}
      {hasActions && (
        <Sheet onOpenChange={setActionSheetOpen} open={actionSheetOpen}>
          <SheetContent side="bottom" showCloseButton={false}>
            <SheetHeader className="pb-0">
              <SheetTitle className="truncate text-center font-medium text-muted-foreground text-sm">
                {formatItemLabel(item.label)}
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-1 p-2">
              {canEdit && (
                <button
                  className={cn(
                    "flex min-h-[52px] w-full items-center gap-3 rounded-xl px-4",
                    "font-medium text-base text-foreground",
                    "transition-colors hover:bg-accent active:bg-accent/80"
                  )}
                  onClick={() => {
                    setActionSheetOpen(false)
                    onEditIntent(item)
                  }}
                  type="button"
                >
                  <PencilIcon className="h-5 w-5 text-muted-foreground" />
                  Edit
                </button>
              )}

              {canDelete && deleteId && (
                <button
                  className={cn(
                    "flex min-h-[52px] w-full items-center gap-3 rounded-xl px-4",
                    "font-medium text-base text-destructive",
                    "transition-colors hover:bg-destructive/10 active:bg-destructive/20"
                  )}
                  onClick={() => {
                    setActionSheetOpen(false)
                    onDeleteIntent(deleteId)
                  }}
                  type="button"
                >
                  <TrashIcon className="h-5 w-5" />
                  Delete
                </button>
              )}
            </div>

            {/* Safe-area spacer */}
            <div className="h-[max(env(safe-area-inset-bottom,0px),16px)]" />
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────

export function MobileEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="h-6 w-6" />
      </div>
      <p className="font-medium text-base">No results found</p>
    </div>
  )
}
