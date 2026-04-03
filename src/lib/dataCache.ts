// ── 리스트 데이터 캐시 유틸
// 어드민 배포 버튼 → cache_version 버전 업 → 다음 방문 시 해당 데이터만 재다운로드
// 캐시 있고 버전 같으면 절대 DB 재다운로드 안 함 (새로고침 포함)
// TTL(5분) 기반 버전 체크 → cache_version 조회 횟수 최소화
import { supabase } from './supabase'

const CACHE_KEYS = {
  checklist:    'cache-checklist',
  businesses:   'cache-businesses',
  shopping:     'cache-shopping',
  bingo:        'cache-bingo',
  events:       'cache-events',
  packing:      'cache-packing',
  version:      'cache-version',
  lastChecked:  'cache-last-checked',
}

// 5분마다 한 번만 cache_version DB 조회
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000

type CacheVersion = { checklist: number; businesses: number; shopping: number; bingo: number; events: number; packing: number }
const DEFAULT_VERSION: CacheVersion = { checklist: 0, businesses: 0, shopping: 0, bingo: 0, events: 0, packing: 0 }

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
function getLastChecked(): number {
  return parseInt(localStorage.getItem(CACHE_KEYS.lastChecked) ?? '0')
}
function saveLastChecked() {
  try { localStorage.setItem(CACHE_KEYS.lastChecked, Date.now().toString()) } catch {}
}

async function fetchServerVersions(): Promise<CacheVersion> {
  const { data } = await supabase.from('cache_version').select('key, version')
  if (!data) return DEFAULT_VERSION
  const v = { ...DEFAULT_VERSION }
  data.forEach((row: any) => { if (row.key in v) (v as any)[row.key] = row.version })
  return v
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
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
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
async function fetchPacking() {
  const [cats, items] = await Promise.all([
    supabase.from('packing_categories').select('*').order('sort_order'),
    supabase.from('packing_items').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], items: items.data ?? [] }
  setCache(CACHE_KEYS.packing, data)
  // 홈 배지용 total 저장 (🔴 제외)
  const checkableCount = (items.data ?? []).filter((i: any) => !i.tips?.startsWith('🔴')).length
  try { localStorage.setItem('packing-total', String(checkableCount)) } catch {}
  return data
}
async function fetchEvents() {
  const { data } = await supabase.from('events').select('*').eq('is_active', true)
    .order('start_date')
  setCache(CACHE_KEYS.events, data ?? [])
  return data ?? []
}

// ── 메인 캐시 동기화
// 반환값: true = 새 데이터 다운로드됨 (리렌더 필요), false = 캐시 그대로
export async function syncDataCache(): Promise<boolean> {
  try {
    const allCached =
      getCache(CACHE_KEYS.checklist) &&
      getCache(CACHE_KEYS.businesses) &&
      getCache(CACHE_KEYS.shopping) &&
      getCache(CACHE_KEYS.bingo) &&
      getCache(CACHE_KEYS.events) &&
      getCache(CACHE_KEYS.packing)

    if (!allCached) {
      // 캐시 자체가 없으면 무조건 전체 다운로드 (TTL 무시)
      const serverVer = await fetchServerVersions()
      await Promise.all([fetchChecklist(), fetchBusinesses(), fetchShopping(), fetchBingo(), fetchEvents(), fetchPacking()])
      saveLocalVersion(serverVer)
      saveLastChecked()
      return true
    }

    // 5분 이내에 이미 체크했으면 DB 조회 자체를 스킵
    if (Date.now() - getLastChecked() < VERSION_CHECK_INTERVAL) {
      return false
    }

    // 5분 지났으면 cache_version 체크
    const [serverVer, localVer] = [await fetchServerVersions(), getLocalVersion()]
    const tasks: Promise<any>[] = []
    if (serverVer.checklist > localVer.checklist)   tasks.push(fetchChecklist())
    if (serverVer.businesses > localVer.businesses) tasks.push(fetchBusinesses())
    if (serverVer.shopping > localVer.shopping)     tasks.push(fetchShopping())
    if (serverVer.bingo > localVer.bingo)           tasks.push(fetchBingo())
    if (serverVer.events > localVer.events)         tasks.push(fetchEvents())
    if (serverVer.packing > localVer.packing)       tasks.push(fetchPacking())

    if (tasks.length > 0) {
      await Promise.all(tasks)
      saveLocalVersion(serverVer)
      saveLastChecked()
      return true
    }

    // 버전 동일 — 체크 시간만 갱신
    saveLastChecked()
    return false
  } catch (e) {
    console.error('syncDataCache error:', e)
    return false
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
export function getCachedPacking() {
  return getCache<{ categories: any[]; items: any[] }>(CACHE_KEYS.packing)
}
export function getCachedEvents() {
  return getCache<any[]>(CACHE_KEYS.events)
}
