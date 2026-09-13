// ─── responsive-dropdown-shell.tsx ────────────────────────────────────────────
// Abstracts the mobile-sheet / desktop-popover split.
// Zero business logic, zero data knowledge.

import { Combobox } from "@base-ui/react/combobox"
import { type ReactNode, useCallback, useRef } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { MobileSearchBar } from "./input-shell"
import { MobileEmptyState } from "./item-visuals.mobile"
import type { ComboboxItem } from "./types"
import { useVisualViewportHeight } from "./use-visual-viewport"

// ─── Desktop popover shell ────────────────────────────────────────────────────

export function DesktopPopoverShell({
  children,
}: {
  children: (item: ComboboxItem) => ReactNode
}) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner
        align="start"
        className="z-50 w-(--anchor-width) min-w-45"
        side="bottom"
        sideOffset={6}
      >
        <Combobox.Popup
          className={cn(
            // Shape & layering
            "relative isolate z-50 overflow-hidden rounded-2xl",
            // Glassmorphism surface
            "bg-popover/70 shadow-lg ring-1 ring-foreground/5",
            // The blur layer lives on a pseudo-element so it doesn't clip children
            "before:pointer-events-none before:absolute before:inset-0 before:-z-10",
            "before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150",
            // Entry / exit animations
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "origin-top transition-[opacity,transform] duration-100"
          )}
        >
          <Combobox.List className="no-scrollbar max-h-60 overflow-y-auto overscroll-contain p-1">
            {children}
          </Combobox.List>
          <Combobox.Empty className="flex w-full items-center justify-center py-3 text-center text-muted-foreground text-sm">
            No results found
          </Combobox.Empty>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  )
}

// ─── Mobile sheet shell ───────────────────────────────────────────────────────

export function MobileDrawerShell({
  open,
  onOpenChange,
  placeholder,
  onInputKeyDown,
  children,
  sheetHeight = "80vh",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder: string
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Render function — same signature as Combobox.List children. */
  children: (item: ComboboxItem) => ReactNode
  sheetHeight?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { height: vpHeight, isAndroid, keyboardHeight } =
    useVisualViewportHeight()

  const computedHeight = vpHeight ? `${vpHeight}px` : sheetHeight
  const keyboardOffset = isAndroid ? keyboardHeight : 0

  const initialFocus = useCallback(
    () => (isAndroid ? false : inputRef.current),
    [isAndroid]
  )

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex flex-col gap-0 overflow-hidden p-0"
        initialFocus={initialFocus}
        showCloseButton={false}
        side="bottom"
        style={{ height: computedHeight, marginBottom: keyboardOffset }}
      >
        <MobileSearchBar
          onInputKeyDown={onInputKeyDown}
          placeholder={placeholder}
          ref={inputRef}
        />

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-2 outline-none" data-slot="mobile-combobox-list">
            <Combobox.List className="flex flex-col gap-1">
              {children}
            </Combobox.List>

            <Combobox.Empty>
              <MobileEmptyState />
            </Combobox.Empty>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
