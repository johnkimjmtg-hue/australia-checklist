// ─────────────────────────────────────────────
// AdminPage.tsx
// src/pages/admin/AdminPage.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { btnPrimary, btnGhost, inputStyle, type Cat, type Item } from './adminShared'
import BusinessTab    from './BusinessTab'
import RequestsTab    from './RequestsTab'
import { CategoriesTab, ItemsTab } from './CategoriesAndItemsTab'
import ShoppingTab    from './ShoppingTab'
import BingoTab       from './BingoTab'
import EventsTab      from './EventsTab'
import GoogleMappingTab from './GoogleMappingTab'
import DeployTab      from './DeployTab'
import { PackingCategoriesTab, PackingItemsTab } from './PackingTab'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

type MainTab = 'business' | 'requests' | 'categories' | 'items' | 'shopping' | 'bingo' | 'events' | 'google' | 'deploy' | 'packing_cats' | 'packing_items'

const TAB_META: { id: MainTab; icon: string; label: string }[] = [
  { id: 'business',  icon: 'ph:buildings',         label: '업체' },
  { id: 'requests',  icon: 'ph:envelope-open',      label: '신청' },
  { id: 'categories',icon: 'ph:folder-open',        label: '카테고리' },
  { id: 'items',     icon: 'ph:list-checks',        label: '체크리스트' },
  { id: 'shopping',  icon: 'ph:shopping-bag',       label: '쇼핑' },
  { id: 'bingo',     icon: 'ph:coffee',             label: '빙고' },
  { id: 'events',    icon: 'ph:calendar-check',     label: '행사' },
  { id: 'google',    icon: 'ph:magnifying-glass',   label: '구글매핑' },
  { id: 'packing_cats',  icon: 'ph:suitcase',        label: '짐카테고리' },
  { id: 'packing_items', icon: 'ph:luggage',         label: '짐항목' },
  { id: 'deploy',    icon: 'ph:rocket-launch',      label: '배포' },
]

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed]   = useState(false)
  const [pw, setPw]           = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab]         = useState<MainTab>('business')

  // 공유 체크리스트 state (CategoriesTab ↔ ItemsTab 공유)
  const [sharedCats,  setSharedCats]  = useState<Cat[]>([])
  const [sharedItems, setSharedItems] = useState<Item[]>([])
  const [clLoading,   setClLoading]   = useState(true)
  // 짐싸기 state
  const [packingCats,  setPackingCats]  = useState<Cat[]>([])
  const [packingItems, setPackingItems] = useState<Item[]>([])
  const [packingLoading, setPackingLoading] = useState(true)

  const fetchCL = async () => {
    setClLoading(true)
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('checklist_categories').select('*').order('sort_order'),
      supabase.from('checklist_items').select('*').order('sort_order'),
    ])
    if (cats)  setSharedCats(cats)
    if (items) setSharedItems(items)
    setClLoading(false)
  }

  const fetchPacking = async () => {
    setPackingLoading(true)
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('packing_categories').select('*').order('sort_order'),
      supabase.from('packing_items').select('*').order('sort_order'),
    ])
    if (cats)  setPackingCats(cats)
    if (items) setPackingItems(items)
    setPackingLoading(false)
  }

  useEffect(() => { fetchCL(); fetchPacking() }, [])

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F7', fontFamily: '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', boxShadow: '0 8px 32px rgba(30,77,131,0.12)', width: 'calc(100% - 48px)', maxWidth: 360 }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F1B2D', textAlign: 'center', marginBottom: 4 }}>Admin</div>
        <div style={{ fontSize: 12, color: '#8AAAC8', textAlign: 'center', marginBottom: 24 }}>호주가자 관리자 페이지</div>
        <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputStyle} />
        {pwError && <div style={{ color: '#e8420a', fontSize: 12, marginTop: 6, fontWeight: 700 }}>비밀번호가 틀렸어요</div>}
        <button onClick={handleLogin} style={{ ...btnPrimary, marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex' }}>로그인</button>
        <button onClick={onBack} style={{ ...btnGhost, marginTop: 8, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon icon="ph:arrow-left" width={14} height={14} /> 돌아가기
        </button>
      </div>
    </div>
  )

  const currentTab = TAB_META.find(t => t.id === tab)!

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F7', fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif', paddingBottom: 72 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 헤더 */}
      <div style={{ background: '#1B6EF3', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(27,110,243,0.18)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon icon="ph:arrow-left" width={18} height={18} color="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>호주가자 Admin</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>{currentTab.label}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>🔒 관리자</div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ padding: '16px 14px 16px' }}>
        {tab === 'business'   && <BusinessTab />}
        {tab === 'requests'   && <RequestsTab />}
        {tab === 'categories' && (clLoading ? <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div> : <CategoriesTab cats={sharedCats} setCats={setSharedCats} />)}
        {tab === 'items'      && (clLoading ? <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div> : <ItemsTab cats={sharedCats} items={sharedItems} setItems={setSharedItems} />)}
        {tab === 'shopping'   && <ShoppingTab />}
        {tab === 'bingo'      && <BingoTab />}
        {tab === 'events'     && <EventsTab />}
        {tab === 'google'     && <GoogleMappingTab />}
        {tab === 'packing_cats'  && (packingLoading ? <div style={{ padding:32, textAlign:'center', color:'#aaa' }}>불러오는 중...</div> : <PackingCategoriesTab cats={packingCats} setCats={setPackingCats} />)}
        {tab === 'packing_items' && (packingLoading ? <div style={{ padding:32, textAlign:'center', color:'#aaa' }}>불러오는 중...</div> : <PackingItemsTab cats={packingCats} items={packingItems} setItems={setPackingItems} />)}
        {tab === 'deploy'     && <DeployTab />}
      </div>

      {/* 하단 네비바 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: '#fff', borderTop: '1px solid #E8EDF3', display: 'flex', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TAB_META.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '8px 2px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: tab === t.id ? '#1B6EF3' : '#94A3B8' }}>
            <Icon icon={t.icon} width={22} height={22} color={tab === t.id ? '#1B6EF3' : '#94A3B8'} />
            <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 16, height: 2, borderRadius: 2, background: '#1B6EF3', marginTop: 1 }} />}
          </button>
        ))}
        {/* 새로고침 버튼 */}
        <button onClick={() => { fetchCL(); fetchPacking() }} disabled={clLoading || packingLoading} style={{ width: 52, border: 'none', background: 'none', cursor: 'pointer', padding: '8px 2px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: clLoading ? '#C8C8C8' : '#16A34A', borderLeft: '1px solid #E8EDF3' }}>
          <Icon icon={clLoading ? 'ph:spinner' : 'ph:arrow-clockwise'} width={22} height={22} color={clLoading ? '#C8C8C8' : '#16A34A'} style={clLoading ? { animation: 'spin 1s linear infinite' } : {}} />
          <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>새로고침</span>
        </button>
      </div>
    </div>
  )
}
