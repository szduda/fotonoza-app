import { useRef, type RefObject } from "react"

export type ViewGridMeasure = {
  viewGridRef: RefObject<HTMLDivElement | null>
}

export const useViewGridLayout = (): ViewGridMeasure => {
  const viewGridRef = useRef<HTMLDivElement | null>(null)
  return { viewGridRef }
}
