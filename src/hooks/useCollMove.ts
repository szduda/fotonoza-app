import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { t } from "@/lib/i18n"
import {
  collectionDisplayLabel,
  OTHERS_COLLECTION_ID,
  selectedPhotosSourceLabel,
} from "@/lib/collections"
import type { CollectionFolder, Photo } from "@/types/domain"

const fillTpl = (tpl: string, vars: Record<string, string>): string =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "")

type Locale = "en" | "pl"

export const useCollMove = (
  locale: Locale,
  folders: CollectionFolder[],
  photos: Photo[],
  hasSelection: boolean,
  selectedCount: number,
  assignSelectedPhotosCollection: (folderId: string | null) => void,
) => {
  const [movePicking, setMovePicking] = useState(false)
  const [moveConfirmDest, setMoveConfirmDest] = useState<string | null>(null)

  const clusterRef = useRef<HTMLDivElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  const resetMove = useCallback(() => {
    setMovePicking(false)
    setMoveConfirmDest(null)
  }, [])

  const isMoveConfirm = moveConfirmDest !== null
  const isMoveTargeting = movePicking && !isMoveConfirm

  useEffect(() => {
    if (!hasSelection && (movePicking || isMoveConfirm)) resetMove()
  }, [hasSelection, movePicking, isMoveConfirm, resetMove])

  useEffect(() => {
    if (!isMoveTargeting) return
    document.body.dataset.collMovePick = ""
    return () => {
      delete document.body.dataset.collMovePick
    }
  }, [isMoveTargeting])

  useEffect(() => {
    if (!movePicking && !isMoveConfirm) return
    const onDown = (e: PointerEvent) => {
      const node = e.target as Node
      if (clusterRef.current?.contains(node)) return
      if (modalRef.current?.contains(node)) return
      resetMove()
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [movePicking, isMoveConfirm, resetMove])

  const [modalPos, setModalPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!isMoveConfirm || !clusterRef.current) {
      setModalPos(null)
      return
    }
    const el = clusterRef.current
    const place = (): void => {
      const r = el.getBoundingClientRect()
      setModalPos({ top: r.top + 4, left: r.right + 10 })
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [isMoveConfirm])

  const onMoveTargetPick = useCallback(
    (folderId: string) => {
      if (!isMoveTargeting) return
      setMoveConfirmDest(folderId)
    },
    [isMoveTargeting],
  )

  const onMoveToolbarClick = useCallback(() => {
    if (movePicking || isMoveConfirm) {
      resetMove()
      return
    }
    setMovePicking(true)
  }, [movePicking, isMoveConfirm, resetMove])

  const askText = useMemo(() => {
    if (!isMoveConfirm || moveConfirmDest === null) return ""
    const othersLabel = t(locale, (m) => m.labels.collectionOthers)
    const mixedLabel = t(locale, (m) => m.labels.collectionMoveFromMixed)
    const fromSrc = selectedPhotosSourceLabel(folders, photos, othersLabel, mixedLabel)
    const toLbl = collectionDisplayLabel(
      folders,
      moveConfirmDest === OTHERS_COLLECTION_ID ? undefined : moveConfirmDest,
      othersLabel,
    )
    const tpl = t(locale, (m) => m.labels.collectionMoveAsk)
    return fillTpl(tpl, { n: String(selectedCount), from: fromSrc, to: toLbl })
  }, [isMoveConfirm, moveConfirmDest, folders, photos, locale, selectedCount])

  const onConfirmYes = useCallback(() => {
    if (moveConfirmDest === null) return
    assignSelectedPhotosCollection(
      moveConfirmDest === OTHERS_COLLECTION_ID ? null : moveConfirmDest,
    )
    resetMove()
  }, [moveConfirmDest, assignSelectedPhotosCollection, resetMove])

  const onConfirmNo = useCallback(() => {
    setMoveConfirmDest(null)
  }, [])

  return {
    clusterRef,
    modalRef,
    isMoveTargeting,
    isMoveConfirm,
    modalPos,
    onMoveToolbarClick,
    onMoveTargetPick,
    onConfirmYes,
    onConfirmNo,
    askText,
  }
}
