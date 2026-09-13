// ─── single-combobox.tsx ──────────────────────────────────────────────────────
// Public-facing single-select combobox.
// Calls useComboboxInteraction for all logic.
// Assembles visual layer components. No business logic, no data mutations.

import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { normalizeErrors } from "./helpers"
import { DesktopInputShell } from "./input-shell"
import {
  DesktopCreatableItem,
  DesktopRegularItem,
} from "./item-visuals.desktop"
import { MobileCreatableItem, MobileRegularItem } from "./item-visuals.mobile"
import {
  DesktopPopoverShell,
  MobileDrawerShell,
} from "./responsive-dropdown-shell"
import type { ComboboxItem, ComboboxProps } from "./types"
import { useSingleComboboxInteraction } from "./use-combobox-interaction"

export function SingleCombobox({
  items,
  value,
  onChange,
  onCreateIntent,
  onEditIntent,
  onDeleteIntent,
  placeholder = "Select or type...",
  label,
  disabled = false,
  className,
  error,
}: ComboboxProps) {
  const isMobile = useIsMobile()

  const {
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
  } = useSingleComboboxInteraction({ items, value, onChange, onCreateIntent })

  const hasError = !!error && error.length > 0
  const normalizedErrors = normalizeErrors(error)

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        // biome-ignore lint/a11y/noLabelWithoutControl: label is associated via Combobox.Root
        <label className="mb-1.5 block font-medium text-[13px] text-foreground/80">
          {label}
        </label>
      )}

      <Combobox.Root<ComboboxItem>
        disabled={disabled}
        filter={() => true}
        inputValue={inputValue}
        isItemEqualToValue={isItemEqualToValue}
        items={itemsForView}
        itemToStringLabel={itemToStringLabel}
        itemToStringValue={itemToStringValue}
        onInputValueChange={onInputValueChange}
        onItemHighlighted={onItemHighlighted}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        open={isOpen}
        value={selectedItem}
      >
        {isMobile ? (
          <>
            {/* Mobile: read-only trigger button that opens the sheet */}
            <Combobox.Trigger
              className={cn(
                "group flex min-h-9 w-full items-center rounded-lg border border-input bg-input/30",
                "transition-all focus-within:ring-[3px] focus-within:ring-ring/30",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                hasError &&
                  "border-destructive focus-within:ring-destructive/30"
              )}
              render={<button type="button" />}
            >
              <span
                className={cn(
                  "flex-1 px-3 text-start text-sm outline-none",
                  !selectedItem && "text-muted-foreground"
                )}
              >
                {selectedItem ? selectedItem.label : placeholder}
              </span>

              {selectedItem && (
                // biome-ignore lint/a11y/useSemanticElements: <explanation>
                <div
                  className="me-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation()
                      onChange("")
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </div>
              )}

              <div className="flex h-full w-8 shrink-0 items-center justify-center rounded-e-lg text-muted-foreground transition-colors hover:text-foreground">
                <ChevronDownIcon
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </Combobox.Trigger>

            <MobileDrawerShell
              onInputKeyDown={handleInputKeyDown}
              onOpenChange={onOpenChange}
              open={isOpen}
              placeholder={placeholder}
              sheetHeight="80vh"
            >
              {(item: ComboboxItem) =>
                item.creatable ? (
                  <MobileCreatableItem item={item} key={item.value} />
                ) : (
                  <MobileRegularItem
                    isSelected={item.value === value}
                    item={item}
                    key={item.value}
                    onDeleteIntent={onDeleteIntent}
                    onEditIntent={onEditIntent}
                  />
                )
              }
            </MobileDrawerShell>
          </>
        ) : (
          <>
            <DesktopInputShell
              error={hasError}
              onInputKeyDown={handleInputKeyDown}
              placeholder={placeholder}
            />
            <DesktopPopoverShell>
              {(item: ComboboxItem) =>
                item.creatable ? (
                  <DesktopCreatableItem item={item} key={item.value} />
                ) : (
                  <DesktopRegularItem
                    item={item}
                    key={item.value}
                    onDeleteIntent={onDeleteIntent}
                    onEditIntent={onEditIntent}
                  />
                )
              }
            </DesktopPopoverShell>
          </>
        )}
      </Combobox.Root>

      {hasError && (
        <p className="mt-1.5 text-destructive text-xs">
          {normalizedErrors.find((e) => e?.message)?.message}
        </p>
      )}
    </div>
  )
}
