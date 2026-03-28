// ── 리스트 데이터 캐시 유틸
// 어드민 배포 버튼 → cache_version 버전 업 → 다음 방문 시 해당 데이터만 재다운로드
// 캐시 있고 버전 같으면 절대 DB 재다운로드 안 함 (새로고침 포함)
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
  const { data } = await supabase.from('businesses').select('*').eq('is_active', true)
    .order('is_featured', { ascending: false }).order('name')
  setCache(CACHE_KEYS.businesses, data ?? [])
  return data ?? []
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

// ── 메인 캐시 동기화
export async function syncDataCache() {
  try {
    const allCached =
      getCache(CACHE_KEYS.checklist) &&
      getCache(CACHE_KEYS.businesses) &&
      getCache(CACHE_KEYS.shopping) &&
      getCache(CACHE_KEYS.bingo)

    if (!allCached) {
      // 캐시 없음 → 전체 다운로드
      const serverVer = await fetchServerVersions()
      await Promise.all([fetchChecklist(), fetchBusinesses(), fetchShopping(), fetchBingo()])
      saveLocalVersion(serverVer)
      return
    }

    // 캐시 있음 → 버전만 체크
    const [serverVer, localVer] = [await fetchServerVersions(), getLocalVersion()]
    const tasks: Promise<any>[] = []
    if (serverVer.checklist > localVer.checklist)   tasks.push(fetchChecklist())
    if (serverVer.businesses > localVer.businesses) tasks.push(fetchBusinesses())
    if (serverVer.shopping > localVer.shopping)     tasks.push(fetchShopping())
    if (serverVer.bingo > localVer.bingo)           tasks.push(fetchBingo())
    if (tasks.length > 0) {
      await Promise.all(tasks)
      saveLocalVersion(serverVer)
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
