// ── 업체 북마크 + 폴더 (로컬스토리지)

const BM_KEY     = 'biz-bookmarks-v2'  // Record<bizId, folderId[]>
const FOLDER_KEY = 'biz-folders'       // Folder[] (커스텀만 저장)

export interface Folder {
  id: string
  name: string
  emoji: string
  createdAt: number
}

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'wishlist', name: '가보고 싶은 곳', emoji: '🗺️', createdAt: 0 },
]

// ── 폴더 ──
export function getFolders(): Folder[] {
  try {
    const custom = JSON.parse(localStorage.getItem(FOLDER_KEY) ?? '[]') as Folder[]
    const customIds = custom.map(f => f.id)
    return [...DEFAULT_FOLDERS.filter(f => !customIds.includes(f.id)), ...custom]
  } catch { return [...DEFAULT_FOLDERS] }
}

export function addFolder(name: string, emoji = '📁'): Folder {
  const folder: Folder = { id: `f_${Date.now()}`, name, emoji, createdAt: Date.now() }
  try {
    const custom = JSON.parse(localStorage.getItem(FOLDER_KEY) ?? '[]') as Folder[]
    localStorage.setItem(FOLDER_KEY, JSON.stringify([...custom, folder]))
  } catch {}
  return folder
}

export function deleteFolder(id: string) {
  if (DEFAULT_FOLDERS.some(f => f.id === id)) return
  try {
    const custom = JSON.parse(localStorage.getItem(FOLDER_KEY) ?? '[]') as Folder[]
    localStorage.setItem(FOLDER_KEY, JSON.stringify(custom.filter(f => f.id !== id)))
    // 해당 폴더 북마크에서도 제거
    const bm = getBookmarkMap()
    Object.keys(bm).forEach(bizId => { bm[bizId] = bm[bizId].filter(fid => fid !== id) })
    localStorage.setItem(BM_KEY, JSON.stringify(bm))
  } catch {}
  window.dispatchEvent(new CustomEvent('bookmark-changed'))
}

// ── 북마크 맵 ──
function getBookmarkMap(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(BM_KEY) ?? '{}') } catch { return {} }
}

export function getBookmarks(): string[] {
  const bm = getBookmarkMap()
  return Object.keys(bm).filter(id => (bm[id] ?? []).length > 0)
}

export function getBookmarkFolders(bizId: string): string[] {
  return getBookmarkMap()[bizId] ?? []
}

export function isBookmarked(id: string): boolean {
  return getBookmarkFolders(id).length > 0
}

export function getBookmarksByFolder(folderId: string): string[] {
  const bm = getBookmarkMap()
  return Object.keys(bm).filter(id => bm[id].includes(folderId))
}

export function toggleBookmarkFolder(bizId: string, folderId: string): void {
  const bm = getBookmarkMap()
  const folders = bm[bizId] ?? []
  const next = folders.includes(folderId)
    ? folders.filter(f => f !== folderId)
    : [...folders, folderId]
  if (next.length === 0) { delete bm[bizId] } else { bm[bizId] = next }
  try { localStorage.setItem(BM_KEY, JSON.stringify(bm)) } catch {}
  window.dispatchEvent(new CustomEvent('bookmark-changed'))
}

// 단순 토글 (기존 호환용)
export function toggleBookmark(bizId: string): boolean {
  const was = isBookmarked(bizId)
  if (was) {
    const bm = getBookmarkMap()
    delete bm[bizId]
    try { localStorage.setItem(BM_KEY, JSON.stringify(bm)) } catch {}
    window.dispatchEvent(new CustomEvent('bookmark-changed'))
  }
  return !was
}

export function getBookmarkCount(): number {
  return getBookmarks().length
}
