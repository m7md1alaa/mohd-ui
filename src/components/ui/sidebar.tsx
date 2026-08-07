"use client";

import { mergeProps, useRender } from "@base-ui/react";
import { PanelLeftIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-media-query";
import { useShortcut } from "@/hooks/use-shortcut";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const ICON_MODE_WIDTH_PX = 48;
const DEFAULT_WIDTH_PX = 240;
const MIN_WIDTH_PX = 180;
const MAX_WIDTH_PX = 400;
const STORAGE_KEY_WIDTH = "sidebar-width";
const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const ANIMATION_DURATION_MS = 200;
const DEFAULT_SHORTCUT = "mod+b";

type Collapsible = "icon" | "sidebar";

function isEditableElement(el: Element | null) {
  if (!el) {
    return false;
  }
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface SidebarContextType {
  closeMobileOnItemClick: boolean;
  collapsibleType: Collapsible;
  dir: "ltr" | "rtl";
  dragHandleRef: React.RefObject<HTMLDivElement | null>;
  isAnimating: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  setIsCollapsed: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
  sidebarWidth: number;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
const SidebarProvider = ({
  closeMobileOnItemClick = true,
  collapsibleType = "icon",
  children,
  groupId,
  dir = "ltr",
  shortcut = DEFAULT_SHORTCUT,
}: {
  /** Default for whether clicking a menu item closes the mobile sheet. Per-item `closeOnClick` overrides this. */
  closeMobileOnItemClick?: boolean;
  children: ReactNode;
  collapsibleType?: Collapsible;
  groupId: string;
  dir?: "ltr" | "rtl";
  /** Toggle shortcut, e.g. "mod+b". Pass `false` to disable entirely. */
  shortcut?: string | false;
}) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  // Always render the plain default on the first pass (server and initial
  // client render must match) — the saved value is synced in afterward, so
  // this component never touches localStorage during render.
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH_PX);
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(
        `${STORAGE_KEY_WIDTH}-${groupId}`,
      );
      if (savedWidth) {
        setSidebarWidth(
          Math.min(MAX_WIDTH_PX, Math.max(MIN_WIDTH_PX, Number(savedWidth))),
        );
      }
      const savedCollapsed = localStorage.getItem(
        `${STORAGE_KEY_COLLAPSED}-${groupId}`,
      );
      if (savedCollapsed) {
        setIsCollapsedState(savedCollapsed === "true");
      }
    } catch {
      /* ignore */
    }
    // Only ever sync from storage once, on mount for this groupId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const sidebarWidthRef = useRef(sidebarWidth);
  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  // Ref so drag effect always sees latest collapsed state without re-registering
  const isCollapsedRef = useRef(isCollapsed);
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  // isAnimating: true while the CSS transition is running (collapse/expand only)
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setIsCollapsed = useCallback(
    (v: boolean) => {
      setIsCollapsedState(v);
      try {
        localStorage.setItem(`${STORAGE_KEY_COLLAPSED}-${groupId}`, String(v));
      } catch {
        /* ignore */
      }
      // Trigger animation flag
      setIsAnimating(true);
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
      animationTimer.current = setTimeout(
        () => setIsAnimating(false),
        ANIMATION_DURATION_MS,
      );
    },
    [groupId],
  );

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const { matches: matchesShortcut } = useShortcut(
    shortcut || DEFAULT_SHORTCUT,
  );

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  // Mouse-only by design — this is a 1px precision handle, not a touch target;
  // it's disabled on mobile anyway (see `isMobile` guard below).
  useEffect(() => {
    if (isMobile) {
      return;
    }

    const handle = dragHandleRef.current;
    if (!handle) {
      return;
    }

    let startX = 0;
    let startWidth = 0;
    let isDragging = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        return;
      }
      const delta = dir === "rtl" ? startX - e.clientX : e.clientX - startX;
      const next = Math.min(
        MAX_WIDTH_PX,
        Math.max(MIN_WIDTH_PX, startWidth + delta),
      );
      setSidebarWidth(next);
      try {
        localStorage.setItem(`${STORAGE_KEY_WIDTH}-${groupId}`, String(next));
      } catch {
        /* ignore */
      }
    };

    const onMouseUp = () => {
      if (!isDragging) {
        return;
      }
      isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onMouseDown = (e: MouseEvent) => {
      // When collapsed the handle is a click-to-expand — don't start drag
      if (isCollapsedRef.current) {
        return;
      }
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startWidth = sidebarWidthRef.current;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };

    // mousemove/mouseup are bound for the effect's whole lifetime (guarded by
    // `isDragging` above) rather than added/removed per-drag, so every
    // listener this effect owns is set up and torn down in one place.
    handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      // If a dependency change or unmount tears this effect down mid-drag,
      // onMouseUp never runs — reset the body styles it would have cleared.
      if (isDragging) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [dir, groupId, isMobile]);

  // ── Keyboard shortcut ───────────────────────────────────────────────────────
  // toggleSidebar/isMobile/setMobileOpen are read via a ref instead of being
  // effect dependencies, so the global keydown listener isn't torn down and
  // re-attached on every collapse toggle — only when `shortcut` itself changes.
  const latestRef = useRef({ isMobile, setMobileOpen, toggleSidebar });
  useEffect(() => {
    latestRef.current = { isMobile, setMobileOpen, toggleSidebar };
  }, [isMobile, setMobileOpen, toggleSidebar]);

  useEffect(() => {
    if (shortcut === false) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) {
        return;
      }
      if (matchesShortcut(e)) {
        e.preventDefault();
        const current = latestRef.current;
        if (current.isMobile) {
          current.setMobileOpen((v) => !v);
        } else {
          current.toggleSidebar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [matchesShortcut, shortcut]);

  const contextValue = useMemo<SidebarContextType>(
    () => ({
      closeMobileOnItemClick,
      collapsibleType,
      dir,
      isAnimating,
      isCollapsed,
      isMobile,
      mobileOpen,
      setMobileOpen,
      sidebarWidth,
      toggleSidebar,
      setIsCollapsed,
      dragHandleRef,
    }),
    [
      closeMobileOnItemClick,
      collapsibleType,
      dir,
      isAnimating,
      isCollapsed,
      isMobile,
      mobileOpen,
      setMobileOpen,
      sidebarWidth,
      toggleSidebar,
      setIsCollapsed,
      dragHandleRef,
    ]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider>
        <div className="flex h-screen w-screen overflow-hidden" dir={dir}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
};

// ─── Sidebar shell ────────────────────────────────────────────────────────────
const Sidebar = ({ className, children }: React.ComponentProps<"div">) => {
  const {
    collapsibleType,
    dragHandleRef,
    dir,
    isAnimating,
    isCollapsed,
    isMobile,
    mobileOpen,
    setMobileOpen,
    sidebarWidth,
    toggleSidebar,
  } = useSidebar();
  const isRtl = dir === "rtl";
  const collapsedW = collapsibleType === "icon" ? ICON_MODE_WIDTH_PX : 0;

  if (isMobile) {
    return (
      <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
        <SheetContent
          className={cn(
            "w-72 bg-sidebar p-0! text-sidebar-foreground",
            className,
          )}
          showCloseButton={false}
          side="left"
        >
          <div className="flex size-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  const width = isCollapsed ? collapsedW : sidebarWidth;

  return (
    <div
      className={cn(
        "group relative hidden shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground md:flex",
        className,
      )}
      data-collapsible={collapsibleType}
      data-slot="sidebar"
      data-state={isCollapsed ? "collapsed" : "expanded"}
      style={{
        width,
        transition: isAnimating
          ? `width ${ANIMATION_DURATION_MS}ms var(--ease-snappy)`
          : "none",
      }}
    >
      {children}

      {/* Drag handle — resize when expanded, click to expand when collapsed */}
      <div
        aria-hidden
        className={cn(
          "absolute top-0 z-fixed h-full",
          "transition-colors duration-150",
          isRtl ? "left-0" : "right-0",
          isCollapsed
            ? "w-1 cursor-e-resize hover:bg-sidebar-primary/30 active:bg-sidebar-primary/50"
            : "w-1 cursor-col-resize hover:bg-sidebar-border/60 active:bg-sidebar-primary/40",
        )}
        onClick={isCollapsed ? toggleSidebar : undefined}
        ref={dragHandleRef}
      />
    </div>
  );
};

// ─── Main content ─────────────────────────────────────────────────────────────
function MainContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative min-w-0 flex-1 overflow-y-auto", className)}
      data-slot="main-content"
      {...props}
    />
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button group/menu-button relative flex w-full items-center gap-2 overflow-hidden rounded-md px-4 py-3 text-start transition-[width,height,padding,colors]",
    "[&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0",
    "focus-visible:outline focus-visible:outline-ring focus-visible:ring-4 focus-visible:ring-ring/10",
    "data-[popup-open]:bg-accent",
    "data-[active]:bg-sidebar-accent data-[active]:text-sidebar-accent-foreground",
    "group-data-[state=collapsed]:size-8 group-data-[state=collapsed]:p-2",
  ],
  {
    defaultVariants: { size: "default", variant: "default" },
    variants: {
      size: {
        default: "h-8 text-sm",
        lg: "h-12 text-sm group-data-[state=collapsed]:p-0!",
        sm: "h-7 text-xs",
      },
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
    },
  },
);

interface SidebarMenuButtonProps
  extends
    Omit<useRender.ComponentProps<"button">, "ref">,
    VariantProps<typeof sidebarMenuButtonVariants> {
  /** Overrides the provider's `closeMobileOnItemClick` default for this item. */
  closeOnClick?: boolean;
  isActive?: boolean;
  ref?: React.Ref<HTMLElement>;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  closeOnClick,
  onClick,
  ref,
  ...props
}: SidebarMenuButtonProps) {
  const { closeMobileOnItemClick, isCollapsed, isMobile, setMobileOpen } =
    useSidebar();
  const shouldCloseOnClick = closeOnClick ?? closeMobileOnItemClick;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (isMobile && shouldCloseOnClick) {
        setMobileOpen(false);
      }
    },
    [onClick, isMobile, shouldCloseOnClick, setMobileOpen],
  );

  const element = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ size, variant }), className),
        onClick: handleClick,
      },
      props,
    ),
    ref,
    render,
    state: { active: isActive, sidebar: "menu-button", size },
  });

  const shouldShowTooltip = tooltip && isCollapsed && !isMobile;
  if (!shouldShowTooltip) {
    return element;
  }

  const tooltipProps =
    typeof tooltip === "string" ? { children: tooltip } : tooltip;
  return (
    <Tooltip>
      <TooltipTrigger render={element} />
      <TooltipContent
        align="center"
        side="right"
        sideOffset={8}
        {...tooltipProps}
      />
    </Tooltip>
  );
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, mobileOpen, setMobileOpen, isMobile } = useSidebar();

  const handleClick = useCallback(() => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      toggleSidebar();
    }
  }, [isMobile, mobileOpen, setMobileOpen, toggleSidebar]);

  return (
    <Button
      className={cn("size-7", className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={handleClick}
      size="icon"
      variant="ghost"
      {...props}
    >
      <PanelLeftIcon className="rtl:rotate-180" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-2",
        className,
      )}
      data-slot="sidebar-content"
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-slot="sidebar-header"
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-col p-2 first:pt-0",
        className,
      )}
      data-slot="sidebar-group"
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full text-sm", className)}
      data-slot="sidebar-group-content"
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  render,
  className,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-sidebar-foreground/70 text-xs transition-[margin,opacity] duration-200 ease-linear",
          "focus-visible:outline focus-visible:outline-ring focus-visible:ring-4 focus-visible:ring-ring/10",
          "[&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[state=collapsed]:-mt-8 group-data-[state=collapsed]:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "sidebar-group-label" },
  });
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-s px-2.5 py-0.5 rtl:-translate-x-px",
        "group-data-[state=collapsed]:hidden",
        className,
      )}
      data-slot="sidebar-menu-sub"
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-sub-item relative", className)}
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  );
}

interface SidebarMenuSubButtonProps extends useRender.ComponentProps<"a"> {
  /** Overrides the provider's `closeMobileOnItemClick` default for this item. */
  closeOnClick?: boolean;
  isActive?: boolean;
  size?: "sm" | "md";
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  closeOnClick,
  onClick,
  ...props
}: SidebarMenuSubButtonProps) {
  const { closeMobileOnItemClick, isMobile, setMobileOpen } = useSidebar();
  const shouldCloseOnClick = closeOnClick ?? closeMobileOnItemClick;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (isMobile && shouldCloseOnClick) {
        setMobileOpen(false);
      }
    },
    [onClick, isMobile, shouldCloseOnClick, setMobileOpen],
  );

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        onClick: handleClick,
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 rtl:translate-x-px",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline focus-visible:outline-ring focus-visible:ring-4 focus-visible:ring-ring/10",
          "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
          "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          "data-[active]:bg-sidebar-accent data-[active]:text-sidebar-accent-foreground",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          "group-data-[state=collapsed]:hidden",
          className,
        ),
      },
      props,
    ),
    render,
    state: { active: isActive, size, slot: "sidebar-menu-sub-button" },
  });
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn("w-auto bg-sidebar-border", className)}
      data-slot="sidebar-separator"
      {...props}
    />
  );
}

interface SidebarMenuActionProps extends useRender.ComponentProps<"button"> {
  showOnHover?: boolean;
}

function SidebarMenuAction({
  render,
  className,
  showOnHover = false,
  ...props
}: SidebarMenuActionProps) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "peer absolute end-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground transition-transform hover:bg-accent",
          "[&>svg]:size-4 [&>svg]:shrink-0",
          "after:absolute after:-inset-2 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 md:after:hidden",
          "focus-visible:outline focus-visible:outline-ring focus-visible:ring-4 focus-visible:ring-ring/10",
          "data-[popup-open]:bg-accent",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[popup-open]:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: { sidebar: "menu-action", slot: "sidebar-menu-action" },
  });
}

export {
  MainContent,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
