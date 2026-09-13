import { useEffect, useState } from "react"

const ANDROID_RE = /android/i

function getIsAndroid(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }
  return ANDROID_RE.test(navigator.userAgent)
}

function getVisualViewportHeight(): number | null {
  if (typeof window === "undefined") {
    return null
  }
  const vv = window.visualViewport
  if (!vv) {
    return null
  }
  return vv.height
}

function getKeyboardHeight(): number {
  if (typeof window === "undefined") {
    return 0
  }
  const vv = window.visualViewport
  if (!vv) {
    return 0
  }
  const visibleBottom = vv.offsetTop + vv.height
  return Math.max(0, window.innerHeight - visibleBottom)
}

export interface VisualViewportHeightResult {
  height: number | null
  isAndroid: boolean
  keyboardHeight: number
}

/**
 * Tracks the visual viewport height and on-screen-keyboard height on mobile.
 * Used to size the mobile combobox sheet so it never sits under the keyboard.
 */
export function useVisualViewportHeight(): VisualViewportHeightResult {
  const [height, setHeight] = useState<number | null>(getVisualViewportHeight)
  const [keyboardHeight, setKeyboardHeight] = useState(getKeyboardHeight)
  const [isAndroid] = useState(getIsAndroid)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) {
      return
    }

    const onResize = () => {
      setHeight(getVisualViewportHeight())
      setKeyboardHeight(getKeyboardHeight())
    }
    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [])

  return { height, keyboardHeight, isAndroid }
}
