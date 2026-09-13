// ─── multi-combobox.tsx ───────────────────────────────────────────────────────
// Public-facing multi-select combobox.
// Calls useMultiComboboxInteraction for all logic.
// Fires onEditIntent / onDeleteIntent — the parent owns those side-effects.

import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { formatItemLabel, normalizeErrors } from "./helpers"
import { DesktopChipsInput } from "./input-shell"
import {
  DesktopCreatableItem,
  DesktopRegularItem,
} from "./item-visuals.desktop"
import { MobileCreatableItem, MobileRegularItem } from "./item-visuals.mobile"
import {
  DesktopPopoverShell,
  MobileDrawerShell,
} from "./responsive-dropdown-shell"
import type { ComboboxItem, MultiComboboxProps } from "./types"
import { useMultiComboboxInteraction } from "./use-combobox-interaction"

export function MultiCombobox({
  items,
  values,
  onChange,
  onCreateIntent,
  onEditIntent,
  onDeleteIntent,
  placeholder = "Select or type...",
  label,
  disabled = false,
  className,
  error,
}: MultiComboboxProps) {
  const isMobile = useIsMobile()

  const {
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
  } = useMultiComboboxInteraction({
    items,
    values,
    onChange,
    onCreateIntent,
  })

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

      <Combobox.Root<ComboboxItem, true>
        disabled={disabled}
        filter={() => true}
        inputValue={inputValue}
        isItemEqualToValue={isItemEqualToValue}
        items={itemsForView}
        itemToStringLabel={itemToStringLabel}
        itemToStringValue={itemToStringValue}
        multiple
        onInputValueChange={onInputValueChange}
        onItemHighlighted={onItemHighlighted}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        open={isOpen}
        value={selectedItems}
      >
        {isMobile ? (
          <>
            {/* Mobile: read-only trigger chip-display that opens the sheet */}
            <Combobox.Trigger
              className={cn(
                "group flex min-h-9 w-full items-center rounded-lg border border-input bg-input/30 px-2 py-1",
                "transition-all focus-within:ring-[3px] focus-within:ring-ring/30",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                hasError &&
                  "border-destructive focus-within:ring-destructive/30"
              )}
              render={<button type="button" />}
            >
              <div className="flex flex-1 flex-wrap items-center gap-1 text-start">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <span
                      className="flex max-w-[200px] cursor-default items-center gap-1 truncate rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs"
                      key={item.value}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatItemLabel(item.label)}
                      <div
                        className="ms-0.5 flex items-center justify-center rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onChange(values.filter((v) => v !== item.value))
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation()
                            onChange(values.filter((v) => v !== item.value))
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <XIcon className="h-3 w-3" />
                      </div>
                    </span>
                  ))
                ) : (
                  <span className="px-1 text-muted-foreground text-sm outline-none">
                    {placeholder}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center">
                {selectedItems.length > 0 && (
                  <div
                    className="me-0.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange([])
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation()
                        onChange([])
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="flex h-6 w-8 items-center justify-center rounded-e-lg text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 transition-transform duration-150",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
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
                    isSelected={values.includes(item.value)}
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
            <DesktopChipsInput
              error={hasError}
              onInputKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              renderChips={(inputNode) => (
                <>
                  {selectedItems.map((item) => (
                    <Combobox.Chip
                      aria-label={item.label}
                      className={cn(
                        "flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5",
                        "font-medium text-secondary-foreground text-xs",
                        "max-w-[200px] cursor-default truncate outline-none",
                        "data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground"
                      )}
                      key={item.value}
                    >
                      {formatItemLabel(item.label)}
                      <Combobox.ChipRemove
                        aria-label={`Remove ${item.label}`}
                        className="ms-0.5 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                      >
                        <XIcon className="h-3 w-3" />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  {inputNode}
                </>
              )}
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
