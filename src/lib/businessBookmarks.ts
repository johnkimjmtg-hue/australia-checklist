// ── 업체 북마크 (로컬스토리지 + Supabase profiles.bookmarks 동기화)
import { supabase } from './supabase'

const KEY = 'biz-bookmarks'

export function getBookmarks(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id)
}

export async function toggleBookmark(id: string): Promise<boolean> {
  const list = getBookmarks()
  const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id]

  // 로컬스토리지 저장
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}

  // 이벤트 발송
  try { window.dispatchEvent(new CustomEvent('bookmark-change', { detail: { id, bookmarked: next.includes(id), count: next.length } })) } catch {}

  // DB 저장
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (user) {
    await supabase.from('profiles').upsert(
      { id: user.id, bookmarks: next },
      { onConflict: 'id' }
    )
  }

  return next.includes(id)
}

export function getBookmarkCount(): number {
  return getBookmarks().length
}

// 로그인 시 DB에서 북마크 로드
export async function loadBookmarksFromDB(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return
  const { data } = await supabase
    .from('profiles')
    .select('bookmarks')
    .eq('id', user.id)
    .single()
  if (data?.bookmarks) {
    try { localStorage.setItem(KEY, JSON.stringify(data.bookmarks)) } catch {}
  }
}
