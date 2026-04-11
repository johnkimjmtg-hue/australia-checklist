// ── 리스트 데이터 캐시 유틸 (IndexedDB + 메모리 캐시)
// localStorage 5MB 제한 해결
// 기존 동기 API 완전 호환 유지 (메모리 캐시로 동기 접근 가능)
import { supabase } from './supabase'

const DB_NAME = 'hojugaja-cache'
const DB_VERSION = 1
const STORE_NAME = 'cache'
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5분

type CacheVersion = { checklist: number; businesses: number; shopping: number; bingo: number; events: number; packing: number }
const DEFAULT_VERSION: CacheVersion = { checklist: 0, businesses: 0, shopping: 0, bingo: 0, events: 0, packing: 0 }

// ── 메모리 캐시 (동기 접근용)
const MEM: Record<string, any> = {}

// ── IndexedDB
let _db: IDBDatabase | null = null
function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  // 메모리에 있으면 바로 반환
  if (MEM[key] !== undefined) return MEM[key]
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => {
        const val = req.result ?? null
        if (val !== null) MEM[key] = val // 메모리에 저장
        resolve(val)
      }
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  MEM[key] = value // 메모리에도 저장
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}

// ── localStorage (버전/타임스탬프 등 작은 데이터)
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function lsSet<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}
function getLocalVersion(): CacheVersion {
  return lsGet<CacheVersion>('cache-version') ?? DEFAULT_VERSION
}
function saveLocalVersion(v: CacheVersion) { lsSet('cache-version', v) }
function getLastChecked(): number {
  return parseInt(localStorage.getItem('cache-last-checked') ?? '0')
}
function saveLastChecked() {
  try { localStorage.setItem('cache-last-checked', Date.now().toString()) } catch {}
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
  await idbSet('cache-checklist', data)
  return data
}

async function fetchBusinesses() {
  const PAGE = 1000
  let all: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id,name,category,description,phone,website,kakao,address,city,is_featured,is_active,tags,google_place_id,google_rating,google_review_count,latitude,longitude,is_korean,source')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    all = [...all, ...data]
    if (data.length < PAGE) break
    from += PAGE
  }
  await idbSet('cache-businesses', all)
  return all
}

async function fetchShopping() {
  const [cats, prods] = await Promise.all([
    supabase.from('shopping_categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], products: prods.data ?? [] }
  await idbSet('cache-shopping', data)
  return data
}

async function fetchBingo() {
  const { data } = await supabase.from('bingo_cafes').select('*').eq('is_active', true)
    .order('city').order('sort_order')
  await idbSet('cache-bingo', data ?? [])
  return data ?? []
}

async function fetchPacking() {
  const [cats, items] = await Promise.all([
    supabase.from('packing_categories').select('*').order('sort_order'),
    supabase.from('packing_items').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], items: items.data ?? [] }
  await idbSet('cache-packing', data)
  const checkableCount = (items.data ?? []).filter((i: any) => !i.tips?.startsWith('🔴')).length
  try { localStorage.setItem('packing-total', String(checkableCount)) } catch {}
  return data
}

async function fetchEvents() {
  const { data } = await supabase.from('events').select('*').eq('is_active', true)
    .order('start_date')
  await idbSet('cache-events', data ?? [])
  return data ?? []
}

// ── 앱 시작 시 메모리 캐시 워밍업 (IndexedDB → 메모리)
async function warmupMemoryCache() {
  const keys = ['cache-checklist', 'cache-businesses', 'cache-shopping', 'cache-bingo', 'cache-events', 'cache-packing']
  await Promise.all(keys.map(k => idbGet(k))) // 메모리에 로드
}

// ── 메인 캐시 동기화
export async function syncDataCache(): Promise<boolean> {
  try {
    // 먼저 메모리 캐시 워밍업
    await warmupMemoryCache()

    const allCached =
      MEM['cache-checklist'] && MEM['cache-businesses'] && MEM['cache-shopping'] &&
      MEM['cache-bingo'] && MEM['cache-events'] && MEM['cache-packing']

    if (!allCached) {
      const serverVer = await fetchServerVersions()
      await Promise.all([fetchChecklist(), fetchBusinesses(), fetchShopping(), fetchBingo(), fetchEvents(), fetchPacking()])
      saveLocalVersion(serverVer)
      saveLastChecked()
      return true
    }

    if (Date.now() - getLastChecked() < VERSION_CHECK_INTERVAL) return false

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

    saveLastChecked()
    return false
  } catch (e) {
    console.error('syncDataCache error:', e)
    return false
  }
}

// ── 동기 접근 API (기존 코드 호환 - 메모리 캐시 사용)
export function getCachedChecklist() {
  return MEM['cache-checklist'] as { categories: any[]; items: any[] } | null
}
export function getCachedBusinesses() {
  return MEM['cache-businesses'] as any[] | null
}
export function getCachedShopping() {
  return MEM['cache-shopping'] as { categories: any[]; products: any[] } | null
}
export function getCachedBingo() {
  return MEM['cache-bingo'] as any[] | null
}
export function getCachedPacking() {
  return MEM['cache-packing'] as { categories: any[]; items: any[] } | null
}
export function getCachedEvents() {
  return MEM['cache-events'] as any[] | null
}
