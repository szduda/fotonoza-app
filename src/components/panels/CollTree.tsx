import clsx from "clsx"
import type { KeyboardEvent, MouseEvent, ReactElement, RefObject } from "react"
import { Button } from "@/components/generic/Button"
import { chrome } from "@/components/layout/chromeTheme"
import { OTHERS_COLLECTION_ID, type CollTreeNode } from "@/lib/collections"

const inputCls = `min-w-0 flex-1 rounded border border-neutral-600/50 bg-neutral-900/40 px-1.5 py-0.5 text-[11px] outline-none focus:border-neutral-500 ${chrome.panelText}`

const folderRowCls = (active: boolean, pickMove: boolean): string =>
  clsx(
    "!min-h-0 flex-1 justify-start !px-1 py-0.5 normal-case !bg-transparent",
    active && "text-yellow-500/70 !font-bold",
    !active && "enabled:hover:!bg-neutral-800/60 !font-medium",
    pickMove &&
      "cursor-crosshair enabled:hover:!bg-neutral-700/40 enabled:hover:ring-1 enabled:hover:ring-amber-400/55",
  )

/** Shared with the Others row below the tree in CollectionPanel. */
export const othersRowCls = folderRowCls

export type CollTreeProps = {
  nodes: CollTreeNode[]
  depth: number
  filter: string | undefined
  collapsed: Set<string>
  toggle: (id: string) => void
  onPick: (id: string) => void
  editingId: string | null
  draft: string
  setDraft: (v: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  beginEdit: (id: string, name: string) => void
  onEditBlur: () => void
  cancelEdit: () => void
  movePickActive?: boolean
  onMoveTargetPick?: (folderId: string) => void
  subtreeCounts: ReadonlyMap<string, number>
}

export const CollBranch = ({
  nodes,
  depth,
  filter,
  collapsed,
  toggle,
  onPick,
  editingId,
  draft,
  setDraft,
  inputRef,
  beginEdit,
  onEditBlur,
  cancelEdit,
  movePickActive = false,
  onMoveTargetPick,
  subtreeCounts,
}: CollTreeProps): ReactElement => (
  <>
    {nodes.map(({ folder, children }) => {
      const hasKids = children.length > 0
      const open = !collapsed.has(folder.id)
      const active =
        folder.id === OTHERS_COLLECTION_ID
          ? filter === OTHERS_COLLECTION_ID
          : filter === folder.id
      const editing = editingId === folder.id
      const pickMove = movePickActive && !!onMoveTargetPick
      const subN = subtreeCounts.get(folder.id) ?? 0
      const labelWithCount = `${folder.name} (${subN})`
      return (
        <div key={folder.id}>
          <div
            className="relative z-0 flex min-w-0 items-center hover:z-10 focus-within:z-10"
            style={{ paddingLeft: depth * 16 }}
          >
            {hasKids ? (
              <Button
                variant="subtleText"
                size="xs"
                className="!h-5 !min-h-5 w-4 shrink-0 !bg-transparent p-0 text-[15px] leading-none enabled:hover:!bg-neutral-800/50 -translate-y-[1px]"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  toggle(folder.id)
                }}
              >
                {open ? "-" : "+"}
              </Button>
            ) : (
              <span className="inline-block w-4 shrink-0" />
            )}
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={onEditBlur}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                  if (e.key === "Escape") {
                    e.preventDefault()
                    cancelEdit()
                  }
                }}
                className={inputCls}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Button
                variant="text"
                size="xs"
                className={clsx(folderRowCls(active, pickMove), "min-w-0 truncate")}
                onClick={() => {
                  if (pickMove) {
                    onMoveTargetPick?.(folder.id)
                    return
                  }
                  onPick(folder.id)
                }}
                onDoubleClick={
                  pickMove
                    ? undefined
                    : (e: MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault()
                        beginEdit(folder.id, folder.name)
                      }
                }
              >
                <span className="truncate">{labelWithCount}</span>
              </Button>
            )}
          </div>
          {hasKids && open && (
            <CollBranch
              nodes={children}
              depth={depth + 1}
              filter={filter}
              collapsed={collapsed}
              toggle={toggle}
              onPick={onPick}
              editingId={editingId}
              draft={draft}
              setDraft={setDraft}
              inputRef={inputRef}
              beginEdit={beginEdit}
              onEditBlur={onEditBlur}
              cancelEdit={cancelEdit}
              movePickActive={movePickActive}
              onMoveTargetPick={onMoveTargetPick}
              subtreeCounts={subtreeCounts}
            />
          )}
        </div>
      )
    })}
  </>
)
