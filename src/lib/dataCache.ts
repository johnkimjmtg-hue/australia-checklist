// ── 리스트 데이터 캐시 유틸
// 첫 방문 시 전체 다운로드 → 로컬 저장
// 이후 방문 시 서버 max(updated_at)와 비교 → 변경 시만 재다운로드
import { supabase } from './supabase'

const CACHE_KEYS = {
  checklist:  'cache-checklist',
  businesses: 'cache-businesses',
  shopping:   'cache-shopping',
  bingo:      'cache-bingo',
  version:    'cache-version',
}

type CacheVersion = {
  checklist:  string | null
  businesses: string | null
  shopping:   string | null
  bingo:      string | null
}

function getLocalVersion(): CacheVersion {
  try { return JSON.parse(localStorage.getItem(CACHE_KEYS.version) ?? 'null') ?? { checklist: null, businesses: null, shopping: null, bingo: null } }
  catch { return { checklist: null, businesses: null, shopping: null, bingo: null } }
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

// 서버에서 각 테이블 max(updated_at) 조회
async function fetchServerVersions(): Promise<CacheVersion> {
  const [cl, biz, sh, bn] = await Promise.all([
    supabase.from('checklist_items').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('businesses').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('shopping_products').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('bingo_cafes').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    checklist:  cl.data?.updated_at  ?? null,
    businesses: biz.data?.updated_at ?? null,
    shopping:   sh.data?.updated_at  ?? null,
    bingo:      bn.data?.updated_at  ?? null,
  }
}

// 체크리스트 다운로드
async function fetchChecklist() {
  const [cats, items] = await Promise.all([
    supabase.from('checklist_categories').select('*').order('sort_order'),
    supabase.from('checklist_items').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], items: items.data ?? [] }
  setCache(CACHE_KEYS.checklist, data)
  return data
}

// 업체 리스트 다운로드 (전체)
async function fetchBusinesses() {
  const { data } = await supabase.from('businesses').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('name')
  setCache(CACHE_KEYS.businesses, data ?? [])
  return data ?? []
}

// 쇼핑 다운로드
async function fetchShopping() {
  const [cats, prods] = await Promise.all([
    supabase.from('shopping_categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order'),
  ])
  const data = { categories: cats.data ?? [], products: prods.data ?? [] }
  setCache(CACHE_KEYS.shopping, data)
  return data
}

// 빙고 카페 다운로드
async function fetchBingo() {
  const { data } = await supabase.from('bingo_cafes').select('*').eq('is_active', true).order('city').order('sort_order')
  setCache(CACHE_KEYS.bingo, data ?? [])
  return data ?? []
}

// ── 메인 캐시 업데이트 함수 (App.tsx에서 호출)
export async function syncDataCache() {
  try {
    const [serverVer, localVer] = await Promise.all([
      fetchServerVersions(),
      Promise.resolve(getLocalVersion()),
    ])

    const tasks: Promise<any>[] = []

    if (serverVer.checklist !== localVer.checklist || !getCache(CACHE_KEYS.checklist)) {
      tasks.push(fetchChecklist())
    }
    if (serverVer.businesses !== localVer.businesses || !getCache(CACHE_KEYS.businesses)) {
      tasks.push(fetchBusinesses())
    }
    if (serverVer.shopping !== localVer.shopping || !getCache(CACHE_KEYS.shopping)) {
      tasks.push(fetchShopping())
    }
    if (serverVer.bingo !== localVer.bingo || !getCache(CACHE_KEYS.bingo)) {
      tasks.push(fetchBingo())
    }

    if (tasks.length > 0) {
      await Promise.all(tasks)
      saveLocalVersion(serverVer)
    }
  } catch (e) {
    console.error('syncDataCache error:', e)
  }
}

// ── 각 페이지에서 캐시 데이터 읽기
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
