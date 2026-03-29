// ── 리스트 데이터 캐시 유틸
// 어드민 배포 버튼 → cache_version 버전 업 → 다음 방문 시 해당 데이터만 재다운로드
// 캐시 있고 버전 같으면 절대 DB 재다운로드 안 함 (새로고침 포함)
// force_reset = true 이면 해당 캐시 강제 삭제 후 재다운로드
import { supabase } from './supabase'

const CACHE_KEYS = {
  checklist:  'cache-checklist',
  businesses: 'cache-businesses',
  shopping:   'cache-shopping',
  bingo:      'cache-bingo',
  version:    'cache-version',
}

type CacheVersion = { checklist: number; businesses: number; shopping: number; bingo: number }
const DEFAULT_VERSION: CacheVersion = { checklist: 0, businesses: 0, shopping: 0, bingo: 0 }

function getLocalVersion(): CacheVersion {
  try { return JSON.parse(localStorage.getItem(CACHE_KEYS.version) ?? 'null') ?? DEFAULT_VERSION }
  catch { return DEFAULT_VERSION }
}
function saveLocalVersion(v: CacheVersion) {
  try { localStorage.setItem(CACHE_KEYS.version, JSON.stringify(v)) } catch {}
}
function getCache<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function setCache<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}
function clearCache(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

type ServerVersionRow = { key: string; version: number; force_reset: boolean }

async function fetchServerVersionRows(): Promise<ServerVersionRow[]> {
  const { data } = await supabase.from('cache_version').select('key, version, force_reset')
  return data ?? []
}

async function fetchChecklist() {
  const [cats, items] = await Promise.all([
    supabase.from('checklist_categories').select('*').order('sort_order'),
    supabase.from('checklist_items').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], items: items.data ?? [] }
  setCache(CACHE_KEYS.checklist, data)
  return data
}
async function fetchBusinesses() {
  const PAGE = 1000
  let all: any[] = []
  let from = 0
  while (true) {
    const { data } = await supabase.from('businesses').select('*').eq('is_active', true)
      .order('is_featured', { ascending: false }).order('name')
      .range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < PAGE) break
    from += PAGE
  }
  setCache(CACHE_KEYS.businesses, all)
  return all
}
async function fetchShopping() {
  const [cats, prods] = await Promise.all([
    supabase.from('shopping_categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], products: prods.data ?? [] }
  setCache(CACHE_KEYS.shopping, data)
  return data
}
async function fetchBingo() {
  const { data } = await supabase.from('bingo_cafes').select('*').eq('is_active', true)
    .order('city').order('sort_order')
  setCache(CACHE_KEYS.bingo, data ?? [])
  return data ?? []
}

const FETCH_MAP: Record<string, () => Promise<any>> = {
  checklist:  fetchChecklist,
  businesses: fetchBusinesses,
  shopping:   fetchShopping,
  bingo:      fetchBingo,
}

const CACHE_KEY_MAP: Record<string, string> = {
  checklist:  CACHE_KEYS.checklist,
  businesses: CACHE_KEYS.businesses,
  shopping:   CACHE_KEYS.shopping,
  bingo:      CACHE_KEYS.bingo,
}

// force_reset 완료 후 서버 플래그 해제
async function clearForceReset(key: string) {
  await supabase.from('cache_version').update({ force_reset: false }).eq('key', key)
}

// ── 메인 캐시 동기화
export async function syncDataCache() {
  try {
    const rows = await fetchServerVersionRows()
    const localVer = getLocalVersion()

    const serverVer: CacheVersion = { ...DEFAULT_VERSION }
    rows.forEach((row) => {
      if (row.key in serverVer) (serverVer as any)[row.key] = row.version
    })

    const tasks: Promise<any>[] = []
    const resetKeys: string[] = []

    for (const row of rows) {
      const key = row.key as keyof CacheVersion
      if (!(key in FETCH_MAP)) continue

      const forceReset = row.force_reset === true
      const versionChanged = serverVer[key] > localVer[key]

      if (forceReset) {
        // 강제 초기화: 캐시 삭제 후 재다운로드
        clearCache(CACHE_KEY_MAP[key])
        tasks.push(FETCH_MAP[key]())
        resetKeys.push(key)
      } else if (versionChanged || !getCache(CACHE_KEY_MAP[key])) {
        // 버전 변경 또는 캐시 없음: 재다운로드
        tasks.push(FETCH_MAP[key]())
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks)
      saveLocalVersion(serverVer)
    } else {
      // 캐시 없는 항목만 체크
      const allCached =
        getCache(CACHE_KEYS.checklist) &&
        getCache(CACHE_KEYS.businesses) &&
        getCache(CACHE_KEYS.shopping) &&
        getCache(CACHE_KEYS.bingo)
      if (!allCached) {
        await Promise.all([fetchChecklist(), fetchBusinesses(), fetchShopping(), fetchBingo()])
        saveLocalVersion(serverVer)
      }
    }

    // force_reset 플래그 서버에서 해제 (백그라운드)
    if (resetKeys.length > 0) {
      Promise.all(resetKeys.map(clearForceReset)).catch(() => {})
    }
  } catch (e) {
    console.error('syncDataCache error:', e)
  }
}

export function getCachedChecklist() {
  return getCache<{ categories: any[]; items: any[] }>(CACHE_KEYS.checklist)
}
export function getCachedBusinesses() {
  return getCache<any[]>(CACHE_KEYS.businesses)
}
export function getCachedShopping() {
  return getCache<{ categories: any[]; products: any[] }>(CACHE_KEYS.shopping)
}
export function getCachedBingo() {
  return getCache<any[]>(CACHE_KEYS.bingo)
}
