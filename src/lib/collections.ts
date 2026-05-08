import type { CollectionFolder, Photo } from "@/types/domain"

/** Virtual tree node for uncategorized photos (not stored in `collectionFolders`). */
export const OTHERS_COLLECTION_ID = "__others__"

/** Deepest allowed folder: top (0) → nested 1 → 2 → 3; no children under depth 3. */
export const MAX_COLLECTION_DEPTH = 3

/** Parent id for a new folder from current sidebar filter (root when All/Others). */
export const parentForNewFolder = (collectionFilter: string | undefined): string | null => {
  if (!collectionFilter || collectionFilter === OTHERS_COLLECTION_ID) return null
  return collectionFilter
}

/** Ancestors of `parentId` up to root — expand these so a new child under `parentId` is visible. */
export const ancestorChainFromParent = (
  folders: CollectionFolder[],
  parentId: string | null,
): string[] => {
  if (!parentId) return []
  const byId = new Map(folders.map((f) => [f.id, f]))
  const chain: string[] = []
  let pid: string | null = parentId
  while (pid) {
    chain.push(pid)
    pid = byId.get(pid)?.parentId ?? null
  }
  return chain
}

/** Depth of `folderId` from tree root (root-level folders = 0). */
export const folderDepth = (folders: CollectionFolder[], folderId: string): number => {
  const byId = new Map(folders.map((f) => [f.id, f]))
  let d = 0
  let cur = byId.get(folderId)
  while (cur?.parentId) {
    d += 1
    cur = byId.get(cur.parentId)
  }
  return d
}

/** New folder under `parentId` would sit at `parentDepth + 1`; must be ≤ {@link MAX_COLLECTION_DEPTH}. */
export const canNestUnderParent = (
  folders: CollectionFolder[],
  parentId: string | null,
): boolean => {
  if (parentId === null) return true
  return folderDepth(folders, parentId) < MAX_COLLECTION_DEPTH
}

export const canNestUnderFilter = (
  folders: CollectionFolder[],
  collectionFilter: string | undefined,
): boolean => canNestUnderParent(folders, parentForNewFolder(collectionFilter))

export type CollTreeNode = { folder: CollectionFolder; children: CollTreeNode[] }

const byParent = (folders: CollectionFolder[]): Map<string | null, CollectionFolder[]> => {
  const m = new Map<string | null, CollectionFolder[]>()
  for (const f of folders) {
    const k = f.parentId
    const arr = m.get(k) ?? []
    arr.push(f)
    m.set(k, arr)
  }
  return m
}

export const buildCollTree = (folders: CollectionFolder[]): CollTreeNode[] => {
  const map = byParent(folders)
  const sortByName = (a: CollectionFolder, b: CollectionFolder) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })

  const walk = (folder: CollectionFolder): CollTreeNode => ({
    folder,
    children: (map.get(folder.id) ?? []).sort(sortByName).map(walk),
  })

  return (map.get(null) ?? []).sort(sortByName).map(walk)
}

/** Photos in this folder plus descendants (`collectionId` matches subtree). */
export const subtreePhotoCounts = (
  folders: CollectionFolder[],
  photos: Photo[],
): Map<string, number> => {
  const direct = new Map<string, number>()
  for (const p of photos) {
    const cid = p.collectionId
    if (!cid) continue
    direct.set(cid, (direct.get(cid) ?? 0) + 1)
  }
  const kids = byParent(folders)
  const out = new Map<string, number>()
  const dfs = (id: string): number => {
    let n = direct.get(id) ?? 0
    for (const ch of kids.get(id) ?? []) {
      n += dfs(ch.id)
    }
    out.set(id, n)
    return n
  }
  for (const root of kids.get(null) ?? []) {
    dfs(root.id)
  }
  return out
}

export const uncategorizedPhotoCount = (photos: Photo[]): number =>
  photos.reduce((n, p) => n + (p.collectionId ? 0 : 1), 0)

/** Folder id plus every descendant folder id. */
export const collectDescendantIds = (
  folders: CollectionFolder[],
  rootId: string,
): Set<string> => {
  const map = byParent(folders)
  const out = new Set<string>()
  const walk = (id: string) => {
    out.add(id)
    for (const ch of map.get(id) ?? []) walk(ch.id)
  }
  walk(rootId)
  return out
}

/** Label for a folder id or Others (virtual). */
export const collectionDisplayLabel = (
  folders: CollectionFolder[],
  key: string | undefined,
  othersLabel: string,
): string => {
  if (!key || key === OTHERS_COLLECTION_ID) return othersLabel
  return folders.find((f) => f.id === key)?.name ?? key
}

/** Single source label when all selected photos share one collection; else `mixedLabel`. */
export const selectedPhotosSourceLabel = (
  folders: CollectionFolder[],
  photos: Photo[],
  othersLabel: string,
  mixedLabel: string,
): string => {
  const sel = photos.filter((p) => p.selected)
  const keys = new Set(sel.map((p) => p.collectionId ?? OTHERS_COLLECTION_ID))
  if (keys.size <= 1) {
    const only = [...keys][0] ?? OTHERS_COLLECTION_ID
    return collectionDisplayLabel(folders, only === OTHERS_COLLECTION_ID ? undefined : only, othersLabel)
  }
  return mixedLabel
}

export const photoMatchesCollection = (
  photo: Photo,
  filterId: string | undefined,
  folders: CollectionFolder[],
): boolean => {
  if (filterId === undefined) return true
  if (filterId === OTHERS_COLLECTION_ID) return !photo.collectionId
  const allowed = collectDescendantIds(folders, filterId)
  return photo.collectionId != null && allowed.has(photo.collectionId)
}
