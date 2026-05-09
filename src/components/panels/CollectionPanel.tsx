import clsx from "clsx"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { Button } from "@/components/generic/Button"
import { ToggledPanel } from "@/components/generic/ToggledPanel"
import { t } from "@/lib/i18n"
import {
  ancestorChainFromParent,
  buildCollTree,
  canNestUnderFilter,
  OTHERS_COLLECTION_ID,
  parentForNewFolder,
  subtreePhotoCounts,
  uncategorizedPhotoCount,
} from "@/lib/collections"
import { CollBranch, othersRowCls } from "@/components/panels/CollTree"
import { CollMoveModal } from "@/components/panels/CollMoveModal"
import { useCollMove } from "@/hooks/useCollMove"
import { useAppStore } from "@/store/appStore"

export const CollectionPanel = (): ReactElement => {
  const { locale, collectionFolders, collectionFilter, photos } = useAppStore((s) => s.present)
  const setCollectionFilter = useAppStore((s) => s.actions.setCollectionFilter)
  const addCollectionFolder = useAppStore((s) => s.actions.addCollectionFolder)
  const renameCollectionFolder = useAppStore((s) => s.actions.renameCollectionFolder)
  const assignSelectedPhotosCollection = useAppStore(
    (s) => s.actions.assignSelectedPhotosCollection,
  )

  const folders = collectionFolders ?? []
  const canNest = useMemo(
    () => canNestUnderFilter(folders, collectionFilter),
    [folders, collectionFilter],
  )

  const { hasSelection, selectedCount } = useMemo(() => {
    let n = 0
    for (const p of photos) {
      if (p.selected) n++
    }
    return { hasSelection: n > 0, selectedCount: n }
  }, [photos])

  const {
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
  } = useCollMove(
    locale,
    folders,
    photos,
    hasSelection,
    selectedCount,
    assignSelectedPhotosCollection,
  )

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const skipBlurCommit = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const flushRename = useCallback(() => {
    if (!editingId) return
    renameCollectionFolder(editingId, draft)
    setEditingId(null)
  }, [editingId, draft, renameCollectionFolder])

  const onEditBlur = useCallback(() => {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false
      return
    }
    flushRename()
  }, [flushRename])

  const cancelEdit = useCallback(() => {
    skipBlurCommit.current = true
    setEditingId(null)
  }, [])

  const beginEdit = useCallback((id: string, name: string) => {
    setEditingId(id)
    setDraft(name)
  }, [])

  useEffect(() => {
    if (!editingId) return
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [editingId])

  const tree = useMemo(() => buildCollTree(folders), [folders])
  const subtreeCounts = useMemo(() => subtreePhotoCounts(folders, photos), [folders, photos])
  const othersPhotoN = useMemo(() => uncategorizedPhotoCount(photos), [photos])

  const moveFlowActive = isMoveConfirm || isMoveTargeting

  const defaultName = t(locale, (m) => m.labels.collectionNew)
  const othersLbl = t(locale, (m) => m.labels.collectionOthers)

  const onAddFolder = () => {
    const parentId = parentForNewFolder(collectionFilter)
    const id = addCollectionFolder(defaultName)
    if (!id) return
    setCollapsed((prev) => {
      const next = new Set(prev)
      for (const anc of ancestorChainFromParent(folders, parentId)) {
        next.delete(anc)
      }
      return next
    })
    setEditingId(id)
    setDraft(defaultName)
  }

  return (
    <div ref={clusterRef} className="relative">
      <ToggledPanel
        id="collections"
        label={t(locale, (m) => m.labels.collections)}
        className="border-b border-neutral-600/50"
      >
        <div className="flex flex-col gap-2 px-2 pb-2">
          <div className="flex justify-between flex-wrap items-center gap-1 py-1">
            <Button
              variant="outlined"
              size="xs"
              className={clsx(
                "font-normal normal-case",
                !collectionFilter && "border-yellow-500/50",
              )}
              onClick={() => setCollectionFilter(undefined)}
            >
              {t(locale, (m) => m.labels.collectionAll)}
            </Button>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="subtle"
                size="xs"
                className={`font-normal normal-case text-yellow-500/70 bg-yellow-900/15 ${moveFlowActive && "pointer-events-none"}`}
                disabled={!hasSelection}
                onClick={onMoveToolbarClick}
              >
                {moveFlowActive
                  ? t(locale, (m) => m.labels.collectionChooseCollection)
                  : t(locale, (m) => m.labels.collectionMoveSelected)}
              </Button>
              <Button
                variant="outlined"
                size="xs"
                className="font-normal normal-case"
                disabled={!canNest}
                title={!canNest ? t(locale, (m) => m.labels.collectionNestLimit) : undefined}
                onClick={onAddFolder}
              >
                {defaultName}
              </Button>
            </div>
          </div>
          <div className="border-t border-dotted border-neutral-600/50 -mx-2" />
          <div
            className={clsx(
              "flex min-h-0 flex-col gap-0.5 py-1 rounded",
              moveFlowActive && "bg-yellow-500/10",
            )}
          >
            <CollBranch
              nodes={tree}
              depth={0}
              filter={collectionFilter}
              collapsed={collapsed}
              toggle={toggleCollapse}
              onPick={setCollectionFilter}
              editingId={editingId}
              draft={draft}
              setDraft={setDraft}
              inputRef={inputRef}
              beginEdit={beginEdit}
              onEditBlur={onEditBlur}
              cancelEdit={cancelEdit}
              movePickActive={isMoveTargeting}
              onMoveTargetPick={onMoveTargetPick}
              subtreeCounts={subtreeCounts}
            />
            <div className="relative z-0 flex items-center gap-0.5 hover:z-10 focus-within:z-10">
              <span className="inline-block w-4 shrink-0" />
              <Button
                variant="text"
                size="xs"
                className={othersRowCls(collectionFilter === OTHERS_COLLECTION_ID, isMoveTargeting)}
                onClick={() => {
                  if (isMoveTargeting) {
                    onMoveTargetPick(OTHERS_COLLECTION_ID)
                    return
                  }
                  setCollectionFilter(OTHERS_COLLECTION_ID)
                }}
              >
                {othersLbl} ({othersPhotoN})
              </Button>
            </div>
          </div>
        </div>
      </ToggledPanel>

      {isMoveConfirm && (
        <CollMoveModal
          modalRef={modalRef}
          pos={modalPos}
          askText={askText}
          yesLabel={t(locale, (m) => m.labels.collectionMoveYes)}
          noLabel={t(locale, (m) => m.labels.collectionMoveNo)}
          onYes={onConfirmYes}
          onNo={onConfirmNo}
        />
      )}
    </div>
  )
}
