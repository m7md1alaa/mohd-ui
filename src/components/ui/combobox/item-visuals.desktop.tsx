// ─── item-visuals.desktop.tsx ─────────────────────────────────────────────────
// Purely presentational desktop list row components.
// Zero state. Zero business logic. Only renders Base UI nodes + icons.

import { Combobox } from "@base-ui/react/combobox"
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatItemLabel, resolveDeleteId } from "./helpers"
import type { ComboboxItem } from "./types"

// ─── Creatable sentinel row ────────────────────────────────────────────────────

export function DesktopCreatableItem({ item }: { item: ComboboxItem }) {
  return (
    <Combobox.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2.5",
        "rounded-xl py-2 ps-2.5 pe-2.5 text-sm outline-none",
        "text-emerald-600 dark:text-emerald-400",
        "transition-colors data-highlighted:bg-emerald-500/10"
      )}
      value={item}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
        <PlusIcon className="h-3 w-3" />
      </span>
      <span>
        New:{" "}
        <span className="font-semibold">
          {formatItemLabel(item.creatable ?? "", 60)}
        </span>
      </span>
    </Combobox.Item>
  )
}

// ─── Regular item row ─────────────────────────────────────────────────────────

export function DesktopRegularItem({
  item,
  onEditIntent,
  onDeleteIntent,
}: {
  item: ComboboxItem
  onEditIntent?: (item: ComboboxItem) => void
  onDeleteIntent?: (id: string) => void
}) {
  const canEdit = !item.isSystem && !!onEditIntent
  const deleteId = resolveDeleteId(item)
  const canDelete = !item.isSystem && !!onDeleteIntent && !!deleteId

  return (
    <Combobox.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2.5",
        "rounded-xl py-2 ps-9 text-foreground text-sm outline-none",
        canEdit || canDelete ? "pe-[4.5rem]" : "pe-2.5",
        "transition-colors",
        "data-[highlighted]:bg-foreground/10 data-[highlighted]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
      value={item}
    >
      <Combobox.ItemIndicator className="absolute start-2.5 flex h-4 w-4 items-center justify-center">
        <CheckIcon className="h-3.5 w-3.5" />
      </Combobox.ItemIndicator>

      <span className="truncate">{formatItemLabel(item.label, 60)}</span>

      {canEdit && (
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                className="absolute end-8 size-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditIntent(item)
                }}
                size="icon-xs"
                variant="ghost"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          />
          <TooltipContent side="top">Edit</TooltipContent>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                className="absolute end-2 size-6"
                onClick={(e) => {
                  e.stopPropagation()
                  if (deleteId) {
                    onDeleteIntent(deleteId)
                  }
                }}
                size="icon-xs"
                variant="ghost"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          />
          <TooltipContent side="top">Delete</TooltipContent>
        </Tooltip>
      )}
    </Combobox.Item>
  )
}
