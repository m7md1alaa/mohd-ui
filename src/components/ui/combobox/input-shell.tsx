// ─── input-shell.tsx ──────────────────────────────────────────────────────────
// Purely visual input wrappers. Accept callbacks from the interaction layer,
// render Base UI input nodes and icons. Zero state. Zero logic.

import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"
import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ─── Desktop: single-select trigger + text input ──────────────────────────────

export function DesktopInputShell({
  placeholder,
  children,
  error = false,
  onInputKeyDown,
}: {
  placeholder: string
  children?: ReactNode
  error?: boolean
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <Combobox.InputGroup
      className={cn(
        "group flex min-h-9 w-full items-center rounded-xl border border-input bg-input/30",
        "transition-all focus-within:ring-[3px] focus-within:ring-ring/50",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        error && "border-destructive focus-within:ring-destructive/30"
      )}
    >
      {children}
      <Combobox.Input
        aria-invalid={error}
        className="h-9 min-w-24 flex-1 bg-transparent px-3 text-foreground text-sm outline-none placeholder:text-muted-foreground"
        onKeyDown={onInputKeyDown}
        placeholder={placeholder}
      />

      {/* Divider between input and controls */}
      <span className="h-4 w-px shrink-0 bg-border/50" />

      <Combobox.Clear
        className={cn(
          "mx-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
        )}
      >
        <XIcon className="h-3.5 w-3.5" />
      </Combobox.Clear>

      <Combobox.Trigger
        className={cn(
          "me-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
        )}
      >
        <Combobox.Icon>
          <ChevronDownIcon className="h-4 w-4 transition-transform duration-150 group-data-[popup-open]:rotate-180" />
        </Combobox.Icon>
      </Combobox.Trigger>
    </Combobox.InputGroup>
  )
}

// ─── Mobile: pill-shaped search bar inside the sheet ──────────────────────────
export const MobileSearchBar = forwardRef<
  HTMLInputElement,
  {
    placeholder: string
    onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  }
>(({ placeholder, onInputKeyDown }, ref) => (
  <div className="shrink-0 border-b px-4 py-3">
    <Combobox.InputGroup
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-full",
        "border border-input bg-input/30 px-4",
        "transition-all focus-within:ring-[3px] focus-within:ring-ring/50"
      )}
    >
      <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Combobox.Input
        className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        onKeyDown={onInputKeyDown}
        placeholder={placeholder}
        ref={ref}
      />
      <Combobox.Clear className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
        <XIcon className="h-3.5 w-3.5" />
      </Combobox.Clear>
    </Combobox.InputGroup>
  </div>
))
MobileSearchBar.displayName = "MobileSearchBar"

// ─── Desktop: multi-select chips + inline input ────────────────────────────────
export function DesktopChipsInput({
  placeholder,
  error = false,
  onInputKeyDown,
  renderChips,
}: {
  placeholder: string
  error?: boolean
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  renderChips: (inputNode: ReactNode) => ReactNode
}) {
  return (
    <Combobox.InputGroup
      className={cn(
        "group flex min-h-9 w-full flex-wrap items-center gap-1 rounded-xl border border-input bg-input/30 px-2 py-1",
        "transition-all focus-within:ring-[3px] focus-within:ring-ring/50",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        error && "border-destructive focus-within:ring-destructive/30"
      )}
    >
      <Combobox.Chips className="contents">
        <Combobox.Value>
          {(val: unknown[]) =>
            renderChips(
              <Combobox.Input
                className="h-7 min-w-20 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={onInputKeyDown}
                placeholder={val.length > 0 ? "" : placeholder}
              />
            )
          }
        </Combobox.Value>
      </Combobox.Chips>

      {/* Divider between chips/input and controls */}
      <span className="h-4 w-px shrink-0 bg-border/50" />

      <Combobox.Clear
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
        )}
      >
        <XIcon className="h-3.5 w-3.5" />
      </Combobox.Clear>

      <Combobox.Trigger
        className={cn(
          "me-0.5 flex h-6 w-7 shrink-0 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
        )}
      >
        <Combobox.Icon>
          <ChevronDownIcon className="h-4 w-4 transition-transform duration-150 group-data-[popup-open]:rotate-180" />
        </Combobox.Icon>
      </Combobox.Trigger>
    </Combobox.InputGroup>
  )
}
