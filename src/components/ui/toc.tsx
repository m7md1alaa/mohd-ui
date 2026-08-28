import { MenuIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface TocHeading {
  id: string;
  level: number;
  text: string;
}

export interface TocProps {
  headings: TocHeading[];
  label?: string;
  closeLabel?: string;
  className?: string;
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl";
  scrollOffset?: number;
  dir?: "ltr" | "rtl";
}

const breakpointClasses = {
  sm: "sm:block",
  md: "md:block",
  lg: "lg:block",
  xl: "xl:block",
} as const;
const mobileBreakpointClasses = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
} as const;

export function Toc({
  headings,
  label = "On this page",
  closeLabel = "Close table of contents",
  className,
  mobileBreakpoint = "lg",
  scrollOffset = 80,
  dir = "ltr",
}: TocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const instanceId = useId().replace(/:/g, "");
  const minLevel = headings.length
    ? Math.min(...headings.map((heading) => heading.level))
    : 1;

  useEffect(() => {
    const elements = headings
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: `-${scrollOffset}px 0px -60% 0px`, threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));

    const hash = window.location.hash.slice(1);
    if (hash && headings.some((heading) => heading.id === hash)) {
      window.setTimeout(() => {
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "instant", block: "start" });
        setActiveId(hash);
      }, 0);
    }
    return () => observer.disconnect();
  }, [headings, scrollOffset]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open)
      dialogRef.current.showModal();
  }, [isOpen]);

  if (!headings.length) return null;

  const close = () => {
    if (dialogRef.current?.open) setIsClosing(true);
  };
  const navigate = (id: string) => {
    const heading = document.getElementById(id);
    if (!heading) return;
    heading.scrollIntoView({ behavior: "instant", block: "start" });
    window.history.replaceState({}, "", `#${id}`);
    setActiveId(id);
    if (isOpen) close();
  };

  return (
    <>
      <nav
        aria-label={label}
        className={cn("hidden", breakpointClasses[mobileBreakpoint], className)}
      >
        <div className="sticky top-24 space-y-3">
          <TocLabel>{label}</TocLabel>
          <TocList
            headings={headings}
            minLevel={minLevel}
            activeId={activeId}
            onNavigate={navigate}
          />
        </div>
      </nav>

      <div
        dir={dir}
        className={cn(
          "fixed bottom-6 z-50",
          mobileBreakpointClasses[mobileBreakpoint],
          dir === "rtl" ? "left-6" : "right-6",
        )}
      >
        <button
          type="button"
          className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-[transform,background-color] hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={`${instanceId}-toc-dialog`}
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon aria-hidden="true" className="size-5" />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id={`${instanceId}-toc-dialog`}
        dir={dir}
        aria-label={label}
        className={cn(
          "fixed inset-y-0 end-0 m-0 flex min-h-dvh w-[18rem] max-w-[80vw] flex-col border-s border-border bg-background p-6 text-foreground shadow-2xl",
          mobileBreakpointClasses[mobileBreakpoint],
          "toc-dialog",
          dir === "rtl" && "toc-dialog-rtl",
          isClosing && "toc-dialog-closing",
        )}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget || !isClosing) return;
          setIsClosing(false);
          setIsOpen(false);
          dialogRef.current?.close();
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <TocLabel>{label}</TocLabel>
          <button
            type="button"
            aria-label={closeLabel}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={close}
          >
            <XIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">
          <TocList
            headings={headings}
            minLevel={minLevel}
            activeId={activeId}
            onNavigate={navigate}
            listClass="space-y-3"
          />
        </div>
      </dialog>

      <style>{`.toc-dialog{opacity:0;translate:100% 0;transition:translate 280ms cubic-bezier(.32,.72,0,1),opacity 280ms cubic-bezier(.32,.72,0,1),display 280ms allow-discrete,overlay 280ms allow-discrete}.toc-dialog-rtl{translate:-100% 0;inset-inline-start:0;inset-inline-end:auto;border-inline-start:0;border-inline-end-width:1px}.toc-dialog[open]{opacity:1;translate:0 0}.toc-dialog-closing{opacity:0!important;translate:100% 0!important;transition-duration:200ms}.toc-dialog-rtl.toc-dialog-closing{translate:-100% 0!important}.toc-dialog::backdrop{background:rgb(0 0 0 / 0);backdrop-filter:blur(0);transition:background 280ms ease,backdrop-filter 280ms ease}.toc-dialog[open]::backdrop{background:rgb(0 0 0 / .5);backdrop-filter:blur(4px)}@media(prefers-reduced-motion:reduce){.toc-dialog,.toc-dialog-closing,.toc-dialog::backdrop{transition-duration:150ms;translate:0 0}}`}</style>
    </>
  );
}

function TocLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

function TocList({
  headings,
  minLevel,
  activeId,
  onNavigate,
  listClass,
}: {
  headings: TocHeading[];
  minLevel: number;
  activeId: string | null;
  onNavigate: (id: string) => void;
  listClass?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ height: 0, top: 0 });

  useEffect(() => {
    const track = trackRef.current;
    const activeLink = track?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    const activeItem = activeLink?.closest("li");
    if (!track || !activeItem) return;
    const trackRect = track.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    setIndicator({
      height: itemRect.height,
      top: Math.max(
        0,
        Math.min(
          itemRect.top - trackRect.top,
          trackRect.height - itemRect.height,
        ),
      ),
    });
  }, [activeId, headings, listClass]);

  return (
    <div ref={trackRef} className="relative">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-0.5 rounded-full bg-border/40"
      />
      <span
        aria-hidden="true"
        className="absolute start-0 w-0.5 rounded-full bg-primary transition-[transform,height,opacity] duration-200 ease-out"
        style={{
          height: indicator.height,
          opacity: indicator.height ? 1 : 0,
          transform: `translateY(${indicator.top}px)`,
        }}
      />
      <ul className={cn("relative", listClass)}>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              data-active={activeId === heading.id ? "true" : undefined}
              className="block leading-relaxed text-muted-foreground/80 transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{
                paddingInlineStart: `calc(0.75rem + ${(heading.level - minLevel) * 1}rem)`,
              }}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(heading.id);
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
