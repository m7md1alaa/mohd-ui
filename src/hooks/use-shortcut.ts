import { useMemo } from "react";

/**
 * Parses a plain shortcut string ("mod+b", "ctrl+shift+k", ...) into a
 * matcher for keydown events. "mod" means Cmd on Mac, Ctrl elsewhere —
 * checked here as `metaKey || ctrlKey` so it works without OS sniffing.
 */
export function useShortcut(shortcut: string) {
  return useMemo(() => {
    const parts = shortcut.toLowerCase().split("+");
    const key = parts.at(-1) ?? "";
    const needsMod = parts.includes("mod");
    const needsCtrl = parts.includes("ctrl") || parts.includes("control");
    const needsShift = parts.includes("shift");
    const needsAlt = parts.includes("alt");

    const matches = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) {
        return false;
      }
      if (needsMod && !(e.metaKey || e.ctrlKey)) {
        return false;
      }
      if (needsCtrl && !e.ctrlKey) {
        return false;
      }
      if (needsShift && !e.shiftKey) {
        return false;
      }
      if (needsAlt && !e.altKey) {
        return false;
      }
      return true;
    };

    return { key, matches };
  }, [shortcut]);
}
