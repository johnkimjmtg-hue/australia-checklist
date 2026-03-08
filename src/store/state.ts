const KEY_RECEIPT  = 'korea-receipt'
const KEY_TRIP     = 'korea-trip'
const KEY_ANNOUNCE = 'announce-dismiss'

export type TripInfo = { startDate: string; endDate: string }

export type AppState = {
  selected:    Record<string, true>
  schedules:   Record<string, number[]>   // itemId → [dayIndex...]
  customItems: { id: string; label: string; categoryId: string }[]
  meta: { receiptCode: string; lastIssuedAt?: string; activeCategory: string }
}

function gj<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fb } catch { return fb }
}
function sj<T>(key: string, v: T) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

function makeDefault(): AppState {
  return {
    selected: {}, schedules: {}, customItems: [],
    meta: { receiptCode: genCode(), activeCategory: '' },
  }
}

export function loadState(): AppState {
  const s = gj<AppState>(KEY_RECEIPT, makeDefault())
  if (!s.selected)    s.selected    = {}
  if (!s.schedules)   s.schedules   = {}
  if (!s.customItems) s.customItems = []
  if (!s.meta)        s.meta        = { receiptCode: genCode(), activeCategory: '' }
  if (!s.meta.receiptCode) s.meta.receiptCode = genCode()
  if (!s.meta.activeCategory) s.meta.activeCategory = ''
  return s
}

function save(s: AppState): AppState { sj(KEY_RECEIPT, s); return s }

export function toggleItem(s: AppState, id: string): AppState {
  const sel = { ...s.selected }
  const sc  = { ...s.schedules }
  if (sel[id]) { delete sel[id]; delete sc[id] }
  else sel[id] = true
  return save({ ...s, selected: sel, schedules: sc })
}

export function setSchedule(s: AppState, id: string, days: number[]): AppState {
  return save({ ...s, schedules: { ...s.schedules, [id]: days } })
}

export function setCategory(s: AppState, cat: string): AppState {
  return save({ ...s, meta: { ...s.meta, activeCategory: cat } })
}

export function addCustom(s: AppState, label: string, categoryId: string): AppState {
  const id   = `c_${Date.now()}`
  const item = { id, label, categoryId }
  const next = { ...s, customItems: [...s.customItems, item], selected: { ...s.selected, [id]: true } }
  return save(next)
}

export function issueReceipt(s: AppState, at: string): AppState {
  return save({ ...s, meta: { ...s.meta, lastIssuedAt: at } })
}

export function resetAll(): AppState {
  try { localStorage.removeItem(KEY_RECEIPT) } catch {}
  try { localStorage.removeItem(KEY_TRIP) } catch {}
  const next = makeDefault()
  return save(next)
}

// Trip
export function loadTrip(): TripInfo | null { return gj<TripInfo|null>(KEY_TRIP, null) }
export function saveTrip(t: TripInfo)       { sj(KEY_TRIP, t) }
export function clearTrip()                 { try { localStorage.removeItem(KEY_TRIP) } catch {} }

// Announce
export function shouldShowAnnounce(): boolean {
  const v = localStorage.getItem(KEY_ANNOUNCE)
  return !v || v.slice(0,10) !== new Date().toISOString().slice(0,10)
}
export function dismissAnnounce() {
  try { localStorage.setItem(KEY_ANNOUNCE, new Date().toISOString()) } catch {}
}

// Helpers
export function genCode(): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const r = Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join('')
  return `AUSTRALIA-${new Date().getFullYear()}-${r}`
}
export function fmt(d: Date): string {
  const p = (n:number) => String(n).padStart(2,'0')
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
export function fmtCompact(d: Date): string {
  const p = (n:number) => String(n).padStart(2,'0')
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}
export function getTripDays(t: TripInfo): Date[] {
  const days: Date[] = []
  const s = new Date(t.startDate), e = new Date(t.endDate)
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) days.push(new Date(d))
  return days
}
export function fmtMD(d: Date): string {
  return `${d.getMonth()+1}/${d.getDate()}`
}
export function dow(d: Date): string {
  return ['일','월','화','수','목','금','토'][d.getDay()]
}
