// ── 업체 북마크 (로컬스토리지)
const KEY = 'biz-bookmarks'

export function getBookmarks(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id)
}

export function toggleBookmark(id: string): boolean {
  const list = getBookmarks()
  const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  window.dispatchEvent(new CustomEvent('bookmark-changed'))
  return next.includes(id)
}

export function getBookmarkCount(): number {
  return getBookmarks().length
}

