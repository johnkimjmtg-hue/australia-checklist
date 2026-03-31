// ─────────────────────────────────────────────
// ChecklistPage.tsx  (src/pages/ChecklistPage.tsx)
// ─────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { CheckItem } from '../data/checklist'
import { supabase } from '../lib/supabase'
import { colors, font, radius, spacing, shadow, T } from '../styles/tokens'

type Category = { id: string; label: string; emoji: string; sort_order: number }
type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null; image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null }

import {
  AppState, TripInfo,
  toggleItem, setSchedule, setCategory, addCustom,
  issueReceipt, resetAll, saveTrip, loadTrip, loadState, clearTrip,
  fmt, getTripDays, fmtMD,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'
import Services from './Services'
import BucketCheckView from './BucketCheckView'
import NearbyMap from './NearbyMap'
import Shopping from './Shopping'
import MyShoppingView from './MyShoppingView'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'
import BingoPage from './BingoPage'
import type { BingoRef } from './BingoPage'
import { getCachedChecklist, getCachedShopping, getCachedBusinesses } from '../lib/dataCache'
import TermsPage from './TermsPage'
import logoImg from '../assets/logo.png'
import AppHeader from '../components/AppHeader'

const ff = font.family

// ── 로그아웃 시 로컬스토리지 초기화
const CAT_ICON_MAP: Record<string,string> = {
  hospital:'ph:first-aid-kit', food:'ph:fork-knife', shopping:'ph:shopping-bag',
  admin:'ph:files', people:'ph:users', parenting:'ph:baby', places:'ph:map-pin',
  schedule:'ph:calendar', custom:'ph:star',
}

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  '인기':     { bg:'#FEF3C7', color:'#B45309' },
  '강추':     { bg:'#DCFCE7', color:'#15803D' },
  '선물':     { bg:'#FCE7F3', color:'#BE185D' },
  '프리미엄': { bg:'#EDE9FE', color:'#7C3AED' },
  '가성비':   { bg:'#DBEAFE', color:'#1D4ED8' },
  '필수템':   { bg:'#FEE2E2', color:'#DC2626' },
}
const PRICE_COLOR: Record<string, string> = { '$':'#16A34A', '$$':'#D97706', '$$$':'#7C3AED' }
const PRICE_LABEL: Record<string, string> = { '$':'저렴', '$$':'보통', '$$$':'고급' }
const STATE_MAP: Record<string, { label: string }> = {
  'NSW':{ label:'시드니' },'VIC':{ label:'멜번' },'QLD':{ label:'브리즈번' },
  'WA':{ label:'퍼스' },'SA':{ label:'애들레이드' },'TAS':{ label:'태즈매니아' },
  'ACT':{ label:'캔버라' },'NT':{ label:'다윈' },
}

type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset' | 'tripPicker' | 'calendar'
type MainTab = 'bucketlist' | 'bucketcheck' | 'services' | 'shopping' | 'myshoppinglist' | 'nearby' | 'bingo'
type Props = { state: AppState; setState: (s: AppState) => void; initialTab?: MainTab; onGoHome?: () => void; embedded?: boolean }

export default function ChecklistPage({ state, setState, initialTab, onGoHome, embedded }: Props) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trip, setTrip]               = useState<TripInfo|null>(() => loadTrip())
  const [categories, setCategories]   = useState<Category[]>([])
  const [dbItems, setDbItems]         = useState<DBItem[]>([])
  const [dbLoading, setDbLoading]     = useState(true)
  const [modal, setModal]             = useState<Modal>('none')
  const [sheetItem, setSheetItem]     = useState<CheckItem|null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [achieved, setAchieved]       = useState<Record<string,boolean>>(() => { try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} } })
  const [issuedAt, setIssuedAt]       = useState('')
  const [shakeBtn, setShakeBtn]       = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [mainTab, setMainTab]         = useState<MainTab>(() => {
    if (initialTab) return initialTab
    const tab = searchParams.get('tab')
    if (tab === 'services' || tab === 'shopping' || tab === 'myshoppinglist' || tab === 'nearby' || tab === 'bingo') return tab as MainTab
    return 'bucketcheck'
  })
  const [logoTapCount, setLogoTapCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch]   = useState(false)
  const [showMenu, setShowMenu]       = useState(false)
  const [termsTab, setTermsTab]       = useState<'terms'|'privacy'|null>(null)
  const logoTapTimer = useRef<any>(null)
  const bingoRef = useRef<BingoRef>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [bizCount, setBizCount]       = useState(0)
  const [shopCount, setShopCount]     = useState(0)
  const [myList, setMyList] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] } })
  const [myChecked, setMyChecked] = useState<Record<string,boolean>>(() => { try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} } })
  const myListCount    = myList.length
  const myCheckedCount = myList.filter(id => myChecked[id]).length

  const handleMyListChange = (next: string[]) => {
    setMyList(next)
    try { localStorage.setItem('my-shopping-list', JSON.stringify(next)) } catch {}
  }
  const handleMyCheckedChange = (next: Record<string,boolean>) => {
    setMyChecked(next)
    try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {}
  }

  const [detailBizId, setDetailBizId] = useState<string|null>(null)
  const [detailBiz, setDetailBiz]     = useState<Business|null>(null)
  const [detailItem, setDetailItem]   = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [selProduct, setSelProduct]   = useState<any|null>(null)

  useEffect(() => {
    // count 쿼리 대신 캐시에서 계산 (DB Disk IO 절감)
    const biz = getCachedBusinesses()
    if (biz) setBizCount(biz.length)
    const shop = getCachedShopping()
    if (shop) setShopCount(shop.products.length)
  }, [])
  useEffect(() => {
    // 체크리스트 캐시 우선 사용
    const cached = getCachedChecklist()
    if (cached) {
      setCategories(cached.categories)
      setDbItems(cached.items)
      setDbLoading(false)
    } else {
      Promise.all([
        supabase.from('checklist_categories').select('*').order('sort_order'),
        supabase.from('checklist_items').select('*').eq('is_active',true).order('sort_order'),
      ]).then(([{data:cats},{data:items}]) => { if(cats) setCategories(cats); if(items) setDbItems(items); setDbLoading(false) })
    }
  }, [])

  const [highlightItem, setHighlightItem] = useState<string|null>(null)
  useEffect(() => {
    const cat = searchParams.get('cat'); const item = searchParams.get('item')
    if(cat) { setState(setCategory(state,cat)); if(item) { setHighlightItem(item); setTimeout(()=>{ const el=document.getElementById(`item-${item}`); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}) },600); setTimeout(()=>setHighlightItem(null),3500) } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const [pickerStep, setPickerStep] = useState<'start'|'end'>('start')
  const [startDate, setStartDate]   = useState(trip?.startDate ?? '')
  const [endDate, setEndDate]       = useState(trip?.endDate ?? '')

  const handleLogoTap = () => {
    const next = logoTapCount+1; setLogoTapCount(next)
    if(logoTapTimer.current) clearTimeout(logoTapTimer.current)
    if(next>=5){ navigate('/admin'); setLogoTapCount(0); return }
    logoTapTimer.current = setTimeout(()=>{ if(next<5) navigate('/'); setLogoTapCount(0) },400)
  }

  const CATEGORIES = categories
  const ITEMS: CheckItem[] = dbItems.map(i=>({id:i.id,categoryId:i.category_id,label:i.label,emoji:'📌'}))
  const activeCategory = (state.meta.activeCategory && CATEGORIES.some(c=>c.id===state.meta.activeCategory)) ? state.meta.activeCategory : (CATEGORIES[0]?.id ?? '')
  const allItems = [...ITEMS,...state.customItems.map(c=>({...c,emoji:'📝'}))]
  const catItems = allItems.filter(i=>i.categoryId===activeCategory)
  const searchResults = searchQuery.trim() ? allItems.filter(i=>{ const q=searchQuery.trim().toLowerCase(); const db=dbItems.find(d=>d.id===i.id); return i.label.toLowerCase().includes(q)||(db?.description??'').toLowerCase().includes(q)||(db?.address??'').toLowerCase().includes(q) }) : null

  const done  = Object.keys(state.selected).length
  const bucketBadge = Object.keys(state.selected).reduce((acc, id) => {
    const days = state.schedules[id] ?? []
    return acc + (days.length === 0 ? 1 : days.length)
  }, 0)
  const total = allItems.length
  const unscheduledCount = Object.keys(state.selected).filter(id=>!(state.schedules[id]?.length)).length
  const tripLabel = trip ? `${trip.startDate.slice(5).replace('-','/')}~${trip.endDate.slice(5).replace('-','/')}` : null

  const handleOpenTripPicker = () => { setPickerStep('start'); setStartDate(trip?.startDate??''); setEndDate(trip?.endDate??''); setModal('tripPicker') }
  const handleResetTrip = () => { setStartDate(''); setEndDate(''); clearTrip(); setTrip(null); setModal('none') }


  const handleDateSelect = (val:string) => {
    if(pickerStep==='start'){ setStartDate(val); setPickerStep('end') }
    else {
      const t={startDate,endDate:val}
      saveTrip(t); setTrip(t); setModal('none')
    }
  }

  const handleIssue = () => {
    if(done===0){ setModal('noItems'); return }
    setMainTab('bucketcheck')
  }
  const triggerShake = () => { setShakeBtn(true); setTimeout(()=>setShakeBtn(false),600) }
  const handleAddCustom = () => { const label=customLabel.trim(); if(!label) return; setState(addCustom(state,label,activeCategory)); setCustomLabel('') }
  const doReset = () => {
    const next = resetAll()
    setState(next); setTrip(null); setStartDate(''); setEndDate('')
    setShowReceipt(false); setModal('none')
    setAchieved({})
    try{localStorage.removeItem('bucket-achieved')}catch{}
  }
  const isIssued = !!state.meta.lastIssuedAt

  const TABS = [
    {id:'bucketlist',icon:'ph:check-square',  label:'버킷리스트'},
    {id:'services',  icon:'ph:buildings',      label:'업체정보'},
    {id:'nearby',    icon:'ph:map-pin',        label:'내주변'},
    {id:'shopping',  icon:'ph:shopping-bag',   label:'쇼핑정보'},
    {id:'bingo',     icon:'ph:coffee',         label:'카페빙고'},
  ] as {id:MainTab;icon:string;label:string}[]

  const handleTabClick = (id:MainTab) => {
    if(id==='shopping'){ setMainTab('myshoppinglist'); return }
    if(id==='bucketlist'){ setMainTab('bucketcheck'); return }
    setMainTab(id)
  }
  const activeTabId: MainTab = mainTab==='myshoppinglist'?'shopping':mainTab==='bucketcheck'?'bucketlist':mainTab

  return (
    <div style={{ 
      minHeight:'100dvh',
      background: embedded ? '#EFFCFC' : 'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #4DD0E1 65%, #26C6DA 100%)', fontFamily:ff, maxWidth:430, margin:'0 auto', position:'relative' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .list-item:active { background: ${colors.gray50} !important; }
        .cat-btn { transition:all 0.12s; -webkit-tap-highlight-color:transparent; }
        .nav-btn  { -webkit-tap-highlight-color:transparent; }
      `}</style>

      {/* ── 다른 탭들 ── */}
      {mainTab==='services' ? (
          <Services onSelectBusiness={()=>{}} onBack={()=>setMainTab('bucketlist')} />
      ) : mainTab==='shopping' ? (
          <Shopping myList={myList} myChecked={myChecked} onMyListChange={handleMyListChange} onMyCheckedChange={handleMyCheckedChange} onGoToMyList={()=>setMainTab('myshoppinglist')} />
      ) : mainTab==='myshoppinglist' ? (
          <MyShoppingView myList={myList} myChecked={myChecked} onMyListChange={handleMyListChange} onMyCheckedChange={handleMyCheckedChange} onBack={()=>setMainTab('shopping')} onLanding={()=>navigate('/')} />
      ) : mainTab==='nearby' ? (
        <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, height:'calc(100dvh - 62px)', display:'flex', flexDirection:'column', zIndex:5, background:'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #4DD0E1 65%, #26C6DA 100%)' }}>
          <NearbyMap onBack={()=>setMainTab('bucketlist')} />
        </div>
      ) : mainTab==='bingo' ? (
          <BingoPage ref={bingoRef} embedded={true} initialCity={(searchParams.get('city') as 'melbourne'|'sydney') ?? undefined} />
      ) : mainTab==='bucketcheck' ? (
        <>
          <BucketCheckView state={state} trip={trip} setState={setState} items={ITEMS} dbItems={dbItems} onAchievedChange={setAchieved}
            onEdit={()=>{ setShowReceipt(false); const next={...state,meta:{...state.meta,lastIssuedAt:undefined}}; setState(next); try{localStorage.setItem('korea-receipt',JSON.stringify(next))}catch{}; setMainTab('bucketlist') }}
            onDelete={doReset}
            onShare={()=>{ const at=state.meta.lastIssuedAt??issuedAt; setIssuedAt(at); setShowReceipt(true) }}
            onLanding={()=>navigate('/')} />
          {showReceipt&&trip&&(
            <ReceiptModal state={state} trip={trip} issuedAt={issuedAt} achieved={achieved} dbItems={dbItems}
              onClose={()=>setShowReceipt(false)} onReset={()=>{ setShowReceipt(false); doReset() }} />
          )}
        </>
      ) : (
        // ── 버킷리스트 선택 화면 (paddingBottom으로 하단 고정 영역 확보)
        <div style={{ paddingBottom: embedded ? 20 : 130, background: 'transparent', minHeight: '100dvh' }}>

          {!embedded && <AppHeader />}


          {/* ── 서브헤더 + 카테고리 (sticky 고정) ── */}
          {!showSearch && (
            <div style={{ position:'sticky', top:0, zIndex:30, background: embedded ? '#EFFCFC' : 'rgba(224,247,250,0.95)', borderBottom:'1px solid rgba(0,131,143,0.15)' }}>
              {/* 멘트 + 일정설정 + 일정보기 */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:`${spacing[3]}px ${spacing[4]}px ${spacing[2]}px` }}>
                <span style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color: done>0 ? '#00838F' : '#0D3349' }}>
                  {done > 0 ? `${done}개 선택됨` : trip ? '항목을 선택하세요' : '여행 일정을 설정하세요'}
                </span>
                <button onClick={handleOpenTripPicker} style={{
                    height:30, padding:'0 12px', borderRadius:20,
                    border: tripLabel ? '1.5px solid #00838F' : '1.5px solid #00838F',
                    background: tripLabel ? 'rgba(0,131,143,0.12)' : 'rgba(0,131,143,0.12)',
                    color: '#00838F',
                    fontSize:11, fontWeight:700,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:ff,
                  }}>
                    <Icon icon="ph:airplane-takeoff" width={12} height={12} color="#00838F" />
                    {tripLabel ?? '일정 설정'}
                  </button>
              </div>
              {/* 카테고리 그리드 */}
              <div style={{ padding:`0 ${spacing[3]}px ${spacing[3]}px` }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:spacing[1] }}>
                  {(() => {
                    const nonCustom = CATEGORIES.filter(c=>c.id!=='custom')
                    const custom    = CATEGORIES.find(c=>c.id==='custom')
                    const allCats   = custom ? [...nonCustom,custom] : nonCustom
                    return allCats.map(cat => {
                      const isActive = activeCategory===cat.id
                      const catDone  = allItems.filter(i=>i.categoryId===cat.id&&state.selected[i.id]).length
                      return (
                        <button key={cat.id} className="cat-btn"
                          onClick={()=>{ setState(setCategory(state,cat.id)); setShowSearch(false) }}
                          style={{
                            height:36, borderRadius:radius.sm, position:'relative',
                            border: isActive ? '2px solid #00838F' : '1px solid rgba(0,131,143,0.2)',
                            background: isActive ? '#00838F' : 'rgba(255,255,255,0.7)',
                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:ff,
                            WebkitTapHighlightColor:'transparent',
                          }}>
                          <span style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:isActive ? '#fff' : '#0D3349', lineHeight:1.2, textAlign:'center', padding:'0 2px', wordBreak:'keep-all' }}>
                            {cat.label}
                          </span>
                          {catDone>0 && (
                            <span style={{ position:'absolute', top:-5, right:-5, background:'#EF4444', color:'#fff', borderRadius:radius.full, fontSize:8, fontWeight:font.weight.bold, minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>{catDone}</span>
                          )}
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>
              {/* ── 내 버킷리스트 보기 + 초기화 버튼 */}
              {done > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:spacing[2], padding:`0 ${spacing[3]}px ${spacing[2]}px` }}>
                  <div style={{ flex:1 }} />
                  <button onClick={handleIssue} style={{
                    height:28, paddingLeft:10, paddingRight:10, background:'#00838F', color:'#fff',
                    border:'none', borderRadius:radius.sm, fontSize:font.size.xs, fontWeight:font.weight.bold,
                    cursor:'pointer', fontFamily:ff, whiteSpace:'nowrap',
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    <Icon icon="ph:list-checks" width={12} height={12} color="#fff" />
                    {`내 버킷리스트 (${bucketBadge})`}
                  </button>
                  <button onClick={()=>setModal('confirmReset')} style={{
                    height:28, paddingLeft:10, paddingRight:10, background:colors.bgCard, color:colors.gray600,
                    border:`1px solid ${colors.gray400}`, borderRadius:radius.sm, fontSize:font.size.xs, fontWeight:font.weight.bold,
                    cursor:'pointer', fontFamily:ff, whiteSpace:'nowrap',
                  }}>초기화</button>
                </div>
              )}
            </div>
          )}

          {/* ── 캘린더 뷰 (리스트 본문 대체) ── */}
          {modal==='calendar' && trip && !showSearch && (
            <CalendarModal state={state} trip={trip} allItems={allItems} onClose={()=>setModal('none')} />
          )}

          {/* ── 리스트 (캘린더 모드일 때 숨김) ── */}
          {modal !== 'calendar' && (
          <div style={{ background:'transparent', padding:`${spacing[3]}px ${spacing[3]}px` }}>
            {!showSearch && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:spacing[2] }}>
                <span style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:'#00838F' }}>
                  {CATEGORIES.find(c=>c.id===activeCategory)?.label}
                </span>
                <span style={{ fontSize:font.size.sm, color:'#00838F', fontWeight:font.weight.bold }}>
                  {catItems.filter(i=>state.selected[i.id]).length}/{catItems.length}
                </span>
              </div>
            )}
            {activeCategory==='custom'&&!showSearch&&(
              <div style={{ display:'flex', gap:spacing[2], marginBottom:spacing[3], alignItems:'center' }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:spacing[2], background:colors.bgCard, borderRadius:radius.sm, padding:`0 ${spacing[3]}px`, border:'1px solid rgba(0,131,143,0.2)', height:44 }}>
                  <Icon icon="ph:plus-circle" width={16} height={16} color={'#00838F'} />
                  <input ref={inputRef} value={customLabel} onChange={e=>setCustomLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddCustom()} placeholder="직접 추가"
                    style={{ flex:1, border:'none', outline:'none', fontSize:font.size.md, color:colors.textPrimary, background:'transparent', fontFamily:ff }} />
                </div>
                <button onClick={handleAddCustom} style={{ height:44, padding:`0 ${spacing[4]}px`, background:'#00838F', color:'#fff', border:'none', borderRadius:radius.sm, fontWeight:font.weight.bold, fontSize:font.size.sm, cursor:'pointer', fontFamily:ff }}>추가</button>
              </div>
            )}
            {searchResults!==null&&searchResults.length===0&&(
              <div style={{ textAlign:'center', padding:'40px 0', ...T.sm }}>검색 결과가 없어요</div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:spacing[5] }}>
              {(searchResults??catItems).map(item => {
                const checked  = !!state.selected[item.id]
                const dayCount = (state.schedules[item.id]??[]).length
                const db       = dbItems.find(d=>d.id===item.id)
                const regionKey = db?.address ? Object.keys(STATE_MAP).find(k=>db.address!.toUpperCase().includes(k)) : null
                const region    = regionKey ? STATE_MAP[regionKey] : null
                const cat       = CATEGORIES.find(c=>c.id===item.categoryId)
                const isHighlight = highlightItem===item.id
                return (
                  <div key={item.id} id={`item-${item.id}`} className="list-item"
                    style={{
                      display:'flex', alignItems:'center', gap:spacing[3],
                      padding:`${spacing[3]}px ${spacing[3]}px`,
                      background: colors.bgCard,
                      borderRadius:radius.md,
                      border: checked ? `1px solid ${colors.success}` : isHighlight ? '1.5px solid #00838F' : `1px solid ${colors.gray300}`,
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                    onClick={()=>{
                      if(!db) return
                      setDetailItem(db)
                      if((db.related_business_ids?.length??0)>0){
                        const cached = getCachedBusinesses()
                        setDetailBizCards(cached?.filter(b => db.related_business_ids!.includes(b.id)) ?? [])
                      } else setDetailBizCards([])
                    }}
                  >
                    {/* 이미지 */}
                    <div style={{ width:56, height:56, borderRadius:radius.sm, flexShrink:0, background:colors.gray100, border:'1px solid rgba(0,131,143,0.2)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {db?.image_url
                        ? <img src={db.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <Icon icon={db?.icon ?? CAT_ICON_MAP[item.categoryId] ?? 'ph:star'} width={26} height={26} color={colors.gray400} />
                      }
                    </div>
                    {/* 텍스트 */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:font.size.md, fontWeight:font.weight.medium, color:checked?colors.success:colors.gray800,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.4,
                      }}>
                        {item.label}
                      </div>
                      <div style={{ display:'flex', gap:spacing[1], alignItems:'center', marginTop:3, flexWrap:'wrap' }}>
                        {checked && dayCount===0 && (
                          <span
                            onClick={e=>{ e.stopPropagation(); if(trip) setSheetItem(item as CheckItem) }}
                            style={{ fontSize:font.size.xs, color:colors.warning, fontWeight:font.weight.bold, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2 }}
                          >일정 미지정</span>
                        )}
                        {checked && dayCount>0 && (state.schedules[item.id]??[]).map(dayIdx=>(
                          <span key={dayIdx} style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, background:colors.success, color:'#fff', borderRadius:radius.full, padding:`1px ${spacing[2]}px` }}>{dayIdx+1}일차</span>
                        ))}
                        {region && <span style={{ fontSize:font.size.xs, color:colors.gray500, fontWeight:font.weight.medium, marginLeft:'auto' }}>📍 {region.label}</span>}
                      </div>
                    </div>
                    {/* 체크박스 */}
                    <button onClick={e=>{
                      e.stopPropagation()
                      if(!trip){ setModal('noTrip'); return }
                      const nextChecked=!checked
                      setState(toggleItem(state,item.id))
                      if(nextChecked) setTimeout(()=>setSheetItem(item as CheckItem),50)
                    }} style={{
                      width:24, height:24, borderRadius:6, flexShrink:0,
                      border: checked ? 'none' : `1.5px solid ${colors.gray300}`,
                      background: checked ? colors.success : colors.bgCard,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', padding:0, transition:'all 0.15s',
                    }}>
                      {checked&&<svg width="12" height="9" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          )}
        </div>
      )}

      {/* ── 하단 고정 영역 ── */}
      {!embedded && <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:colors.bgCard, zIndex:40 }}>


        <div style={{
          display:'flex', padding:`${spacing[1]}px ${spacing[3]}px 0`,
          borderTop:`1.5px solid ${colors.border}`,
          paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {onGoHome && (
            <button className="nav-btn" onClick={onGoHome}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, height:54, background:'none', border:'none', cursor:'pointer', position:'relative', fontFamily:ff }}>
              <Icon icon="ph:house" width={22} height={22} color={colors.textTertiary} />
              <span style={{ fontSize:12, fontWeight:font.weight.medium, color:colors.textTertiary }}>홈</span>
            </button>
          )}
          {TABS.map(tab=>{
            const isActive = activeTabId===tab.id
            const badge = tab.id==='bucketlist' ? Object.keys(state.selected).reduce((acc, id) => {
                          const days = state.schedules[id] ?? []
                          return acc + (days.length === 0 ? 1 : days.length)
                        }, 0)
                        : tab.id==='shopping'   ? myListCount
                        : 0
            return (
              <button key={tab.id} className="nav-btn" onClick={()=>handleTabClick(tab.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, height:54, background:'none', border:'none', cursor:'pointer', position:'relative', fontFamily:ff }}>
                <div style={{ position:'relative', display:'inline-flex' }}>
                  <Icon icon={tab.icon} width={22} height={22} color={isActive?colors.primary:colors.textTertiary} />
                  {badge>0&&(
                    <div style={{
                      position:'absolute', top:-5, right:-8,
                      minWidth:16, height:16, borderRadius:radius.full,
                      background:'#00838F', color:'#fff',
                      fontSize:10, fontWeight:font.weight.bold,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      padding:'0 4px', lineHeight:1,
                    }}>{badge}</div>
                  )}
                </div>
                <span style={{ fontSize:12, fontWeight:isActive?font.weight.bold:font.weight.medium, color:isActive?colors.primary:colors.textTertiary }}>{tab.label}</span>
                {isActive&&<div style={{ width:4, height:4, borderRadius:radius.full, background:'#00838F', position:'absolute', bottom:4 }} />}
              </button>
            )
          })}
        </div>
      </div>}

      {/* ── ScheduleSheet ── */}
      {sheetItem&&trip&&(
        <ScheduleSheet itemLabel={sheetItem.label} trip={trip}
          currentDays={state.schedules[sheetItem.id]??[]}
          onSelect={days=>{ setState(setSchedule(state,sheetItem.id,days)) }}
          onClose={()=>setSheetItem(null)} />
      )}

      {/* ── Trip date picker ── */}
      {modal==='tripPicker'&&(
        <TripPickerModal step={pickerStep} startDate={startDate} onSelect={handleDateSelect} onReset={handleResetTrip} onClose={()=>setModal('none')} />
      )}

      {/* ── Alerts ── */}
      {modal==='confirmReset'&&<AlertModal title="전체 초기화할까요?" message="체크 내용과 여행일정이 모두 삭제됩니다." confirmLabel="삭제" confirmColor={colors.danger} onConfirm={doReset} onCancel={()=>setModal('none')} />}
      {modal==='noTrip'&&<AlertModal title="여행일정을 먼저 설정해주세요" confirmLabel="날짜 입력하기" confirmFirst onConfirm={()=>{ setModal('none'); setTimeout(handleOpenTripPicker,100) }} onCancel={()=>setModal('none')} />}
      {modal==='noDate'&&<AlertModal title="출발일과 도착일을 모두 선택해주세요" confirmLabel="확인" onConfirm={()=>setModal('none')} onCancel={()=>setModal('none')} hideCancel />}
      {modal==='noItems'&&<AlertModal title="선택된 항목이 없어요" message="버킷리스트 항목을 하나 이상 선택해야 발행할 수 있어요." confirmLabel="확인" onConfirm={()=>setModal('none')} onCancel={()=>setModal('none')} hideCancel />}
      {modal==='noSchedule'&&<AlertModal title="날짜 미지정 항목이 있어요" message="체크된 모든 항목에 날짜를 지정해야 발행할 수 있어요." confirmLabel="확인" onConfirm={()=>setModal('none')} onCancel={()=>setModal('none')} hideCancel />}

      {/* ── 쇼핑 상품 팝업 ── */}
      {selProduct&&(
        <>
          <div onClick={()=>setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:colors.bgCard,
            borderRadius:radius.xl, zIndex:601,
            animation:'slideUpSheet 0.25s ease', maxHeight:'85vh', overflowY:'auto',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`${spacing[3]}px auto 0` }} />
            <div style={{ width:'100%', height:200, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,131,143,0.10)' }}>
              {selProduct.image_url ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={56} height={56} color={'#00838F'} />}
            </div>
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[4]}px` }}>
              <div style={{ display:'flex', gap:spacing[1], flexWrap:'wrap', marginBottom:spacing[3], alignItems:'center' }}>
                {(selProduct.tags??[]).map((tag:string)=>(
                  <span key={tag} style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, padding:`2px ${spacing[2]}px`, borderRadius:radius.sm, background:TAG_COLOR[tag]?.bg??colors.primaryLight, color:TAG_COLOR[tag]?.color??colors.primary }}>{tag}</span>
                ))}
                {selProduct.price_range&&<span style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, padding:`2px ${spacing[2]}px`, borderRadius:radius.sm, background:'rgba(0,131,143,0.10)', color:PRICE_COLOR[selProduct.price_range]??colors.primary, border:'1px solid rgba(0,131,143,0.2)', marginLeft:'auto' }}>{selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}</span>}
              </div>
              <div style={{ ...T.h2, marginBottom:spacing[1] }}>{selProduct.name}</div>
              {selProduct.brand&&<div style={{ ...T.sm, marginBottom:spacing[3] }}>{selProduct.brand}</div>}
              {selProduct.description&&<div style={{ fontSize:font.size.sm, color:colors.textSecondary, lineHeight:1.7, marginBottom:spacing[4] }}>{selProduct.description}</div>}
              {(selProduct.where_to_buy??[]).length>0&&(
                <div style={{ marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:colors.textSecondary, marginBottom:spacing[2] }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:spacing[1], flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map((store:string)=>(
                      <span key={store} style={{ fontSize:font.size.sm, padding:`4px ${spacing[2]}px`, borderRadius:radius.sm, background:'rgba(0,131,143,0.10)', color:'#00838F', border:'1px solid rgba(0,131,143,0.2)' }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={()=>setSelProduct(null)} style={{ width:'100%', height:48, borderRadius:radius.md, border:'1px solid rgba(0,131,143,0.2)', background:colors.bgCard, color:colors.textSecondary, fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:ff }}>닫기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 버킷리스트 상세 팝업 ── */}
      {detailItem&&(
        <div onClick={()=>setDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,0.45)', fontFamily:ff }}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#EFFCFC',
            borderRadius:20, maxHeight:'85vh', overflowY:'auto',
            animation:'slideUpSheet 0.25s ease',
            boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={()=>setDetailItem(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            {detailItem.image_url&&<div style={{ width:'100%', height:220, overflow:'hidden', marginTop:spacing[2] }}><img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>}
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[4]}px` }}>
              <div style={{ ...T.h2, lineHeight:1.4, marginBottom:spacing[3] }}>{detailItem.label}</div>
              {detailItem.description&&<div style={{ fontSize:font.size.md, color:'#475569', lineHeight:1.7, marginBottom:spacing[4], whiteSpace:'pre-wrap' }}>{detailItem.description}</div>}
              {detailItem.tips&&(
                <div style={{ background:'rgba(0,131,143,0.10)', border:'1px solid rgba(0,131,143,0.2)', borderRadius:radius.md, padding:`${spacing[3]}px`, marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:'#00838F', marginBottom:spacing[1] }}>💡 현지인 팁</div>
                  <div style={{ fontSize:font.size.sm, color:'#475569', lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {detailItem.address&&(
                <button onClick={()=>window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')} style={{ display:'flex', alignItems:'center', gap:spacing[2], width:'100%', background:'rgba(0,131,143,0.10)', border:'1px solid rgba(0,131,143,0.2)', borderRadius:radius.md, padding:`${spacing[3]}px`, marginBottom:spacing[4], cursor:'pointer', textAlign:'left' }}>
                  <Icon icon="ph:map-pin" width={16} height={16} color={'#00838F'} />
                  <div>
                    <div style={{ fontSize:font.size.xs, color:colors.textTertiary }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:font.size.sm, color:'#00838F', fontWeight:font.weight.bold, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={13} height={13} color={colors.textTertiary} style={{ marginLeft:'auto' }} />
                </button>
              )}
              {detailBizCards.length>0&&(
                <div style={{ marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:colors.textSecondary, marginBottom:spacing[2] }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>{detailBizCards.map(biz=><BusinessCard key={biz.id} business={biz} />)}</div>
                </div>
              )}
              {(detailItem.related_product_ids?.length??0)>0&&(()=>{
                const cached = getCachedShopping()
                const prods = cached?.products.filter(p => detailItem.related_product_ids!.includes(p.id)).slice(0,5) ?? []
                return prods.length>0 ? (
                  <div style={{ marginBottom:spacing[4] }}>
                    <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:colors.textSecondary, marginBottom:spacing[2] }}>🛍️ 관련 상품</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>
                      {prods.map(prod=>(
                        <button key={prod.id} onClick={()=>setSelProduct(prod)} style={{ display:'flex', alignItems:'center', gap:spacing[3], background:colors.bgInput, border:'1px solid rgba(0,131,143,0.2)', borderRadius:radius.md, padding:`${spacing[3]}px`, cursor:'pointer', textAlign:'left', width:'100%' }}>
                          {prod.image_url && <img src={prod.image_url} alt="" style={{ width:44, height:44, borderRadius:radius.sm, objectFit:'cover', flexShrink:0 }} />}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:colors.textPrimary, marginBottom:2 }}>{prod.name}</div>
                            <div style={{ fontSize:font.size.xs, color:colors.textTertiary }}>{prod.brand}</div>
                          </div>
                          <Icon icon="ph:arrow-right" width={16} height={16} color={colors.textTertiary} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

            </div>
          </div>
        </div>
      )}

      {showReceipt&&trip&&(
        <ReceiptModal state={state} trip={trip} issuedAt={issuedAt} achieved={achieved} dbItems={dbItems}
          onClose={()=>setShowReceipt(false)} onReset={()=>setModal('confirmReset')} />
      )}

      {/* ── 메뉴 바텀시트 */}
      {showMenu && (
        <>
          <div onClick={()=>setShowMenu(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, zIndex:801,
            background:colors.bgCard, borderRadius:radius.xl,
            padding:`${spacing[3]}px ${spacing[4]}px ${spacing[8]}px`,
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            animation:'slideUpSheet 0.25s ease',
          }}>
            {/* 핸들 */}
            <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`0 auto ${spacing[4]}px` }} />
            <div style={{ fontSize:font.size.md, fontWeight:font.weight.bold, color:colors.textPrimary, marginBottom:spacing[3], paddingBottom:spacing[3], borderBottom:'1px solid rgba(0,131,143,0.2)' }}>호주가자</div>
            {[
              { icon:'ph:file-text', label:'이용약관', tab:'terms' as const },
              { icon:'ph:shield-check', label:'개인정보처리방침', tab:'privacy' as const },
            ].map(item => (
              <button key={item.tab} onClick={()=>{ setTermsTab(item.tab); setShowMenu(false) }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:spacing[3],
                padding:`${spacing[4]}px ${spacing[2]}px`,
                background:'none', border:'none', borderBottom:'1px solid rgba(0,131,143,0.2)',
                cursor:'pointer', fontFamily:font.family, textAlign:'left',
              }}>
                <Icon icon={item.icon} width={20} height={20} color={colors.textSecondary} />
                <span style={{ fontSize:font.size.md, color:colors.textPrimary, fontWeight:font.weight.medium }}>{item.label}</span>
                <Icon icon="ph:caret-right" width={16} height={16} color={colors.textTertiary} style={{ marginLeft:'auto' }} />
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── 약관 페이지 */}
      {termsTab && (
        <div style={{ position:'fixed', inset:0, zIndex:900, background:'#fff', overflowY:'auto', display:'flex', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:430 }}>
            <TermsPage initialTab={termsTab} onBack={()=>setTermsTab(null)} />
          </div>
        </div>
      )}

    </div>
  )
}
/* ── 캘린더 뷰 (인라인) ── */
function CalendarModal({ state, trip, allItems, onClose }: { state:AppState; trip:TripInfo; allItems:any[]; onClose:()=>void }) {
  const days = getTripDays(trip)
  const [activeDayIdx, setActiveDayIdx] = useState<number|null>(null)
  const dayCount = days.map((_,idx)=> allItems.filter(item=>state.selected[item.id]&&(state.schedules[item.id]??[]).includes(idx)).length)
  function dayColor(count:number):string { if(count<=0) return colors.bgCard; if(count===1) return '#D1FAE5'; if(count===2) return '#FEF08A'; if(count===3) return '#FED7AA'; return '#FCA5A5' }
  const dayItems = activeDayIdx!==null ? allItems.filter(item=>state.selected[item.id]&&(state.schedules[item.id]??[]).includes(activeDayIdx)) : []

  // 달력 그리드: 7열, 시작 요일 맞춤
  const startDow = new Date(trip.startDate).getDay() // 0=일
  const totalCells = Math.ceil((days.length + startDow) / 7) * 7
  const cells: (number|null)[] = []
  for(let i=0;i<startDow;i++) cells.push(null)
  for(let i=0;i<days.length;i++) cells.push(i)
  while(cells.length<totalCells) cells.push(null)
  const DOW_LABELS = ['일','월','화','수','목','금','토']

  return (
    <div style={{ background:colors.bgPage, padding:`${spacing[3]}px ${spacing[3]}px ${spacing[4]}px`, fontFamily:font.family }}>
      {/* 헤더 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:spacing[3] }}>
        <span style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:colors.textPrimary }}>📅 일정 현황</span>
        <div style={{ display:'flex', alignItems:'center', gap:spacing[3] }}>
          {/* 범례 */}
          <div style={{ display:'flex', gap:spacing[2] }}>
            {[['없음','#fff'],['1개','#D1FAE5'],['2개','#FEF08A'],['3개','#FED7AA'],['4+','#FCA5A5']].map(([label,color])=>(
              <div key={label} style={{ display:'flex', alignItems:'center', gap:3 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:color, border:`1px solid ${colors.gray200}` }}/>
                <span style={{ fontSize:9, color:colors.textTertiary }}>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:colors.textTertiary, fontSize:16, padding:0, lineHeight:1 }}>✕</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {DOW_LABELS.map((d,i)=>(
          <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:font.weight.bold, padding:'3px 0',
            color: i===0?'#E05050':i===6?'#4477CC':colors.textTertiary }}>
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {cells.map((dayIdx, ci) => {
          if(dayIdx===null) return <div key={ci} />
          const d = days[dayIdx]
          const isActive = activeDayIdx===dayIdx
          const bg = isActive ? colors.primary : dayColor(dayCount[dayIdx])
          const dateNum = new Date(d).getDate()
          const colIdx = ci % 7
          return (
            <button key={ci} onClick={()=>setActiveDayIdx(isActive?null:dayIdx)} style={{
              aspectRatio:'1', borderRadius:radius.sm,
              border: isActive ? '1.5px solid #00838F' : `1px solid ${colors.gray200}`,
              background: bg,
              color: isActive ? '#fff' : colors.textPrimary,
              cursor:'pointer', fontFamily:font.family,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
              padding:'2px 0', position:'relative',
              WebkitTapHighlightColor:'transparent',
            }}>
              <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold,
                color: isActive?'#fff': colIdx===0?'#E05050':colIdx===6?'#4477CC':colors.textPrimary }}>
                {dateNum}
              </div>
              <div style={{ fontSize:8, opacity:0.7, color:isActive?'#fff':colors.textTertiary }}>
                {dayIdx+1}일
              </div>
              {dayCount[dayIdx]>0&&!isActive&&(
                <span style={{ position:'absolute', top:2, right:3, fontSize:8, fontWeight:font.weight.bold, color:colors.textSecondary }}>{dayCount[dayIdx]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜 항목 */}
      <div style={{ marginTop:spacing[3], minHeight:40 }}>
        {activeDayIdx===null ? (
          <p style={{ ...T.sm, textAlign:'center', padding:`${spacing[2]}px 0`, color:colors.textTertiary }}>날짜를 눌러 일정을 확인하세요</p>
        ) : dayItems.length===0 ? (
          <p style={{ ...T.sm, textAlign:'center', padding:`${spacing[2]}px 0`, color:colors.textTertiary }}>이 날 할당된 항목이 없어요</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:spacing[1] }}>
            <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:colors.textSecondary, marginBottom:4 }}>
              {activeDayIdx+1}일차 · {fmtMD(days[activeDayIdx])} ({dayItems.length}개)
            </div>
            {dayItems.map(item=>(
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:spacing[2], padding:`${spacing[2]}px ${spacing[3]}px`, background:colors.bgCard, borderRadius:radius.sm, border:'1px solid rgba(0,131,143,0.2)' }}>
                <Icon icon="ph:check-circle-fill" width={13} height={13} color={'#00838F'} />
                <span style={{ fontSize:font.size.sm, color:colors.textPrimary, fontWeight:font.weight.medium }}>
                  {item.label.includes(',')?item.label.split(',')[0].trim():item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Alert Modal ── */
function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel, confirmFirst }: { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean; confirmFirst?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:colors.bgCard, borderRadius:radius.lg, padding:`${spacing[6]}px ${spacing[5]}px`,
        zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
        animation:'scaleIn 0.22s ease', fontFamily:font.family,
        boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <p style={{ fontSize:font.size.lg, fontWeight:font.weight.bold, color:colors.textPrimary, marginBottom:message?spacing[2]:spacing[5], lineHeight:1.5 }}>{title}</p>
        {message&&<p style={{ fontSize:font.size.sm, color:colors.textSecondary, marginBottom:spacing[5], lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:'flex', gap:spacing[2] }}>
          {confirmFirst&&<button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:radius.sm, background:'rgba(0,131,143,0.10)', color:confirmColor??colors.primary, fontWeight:font.weight.bold, fontSize:font.size.md, cursor:'pointer', fontFamily:font.family }}>{confirmLabel}</button>}
          {!hideCancel&&<button onClick={onCancel} style={{ flex:1, height:48, border:'1px solid rgba(0,131,143,0.2)', borderRadius:radius.sm, background:colors.bgCard, color:colors.textSecondary, fontWeight:font.weight.medium, fontSize:font.size.sm, cursor:'pointer', fontFamily:font.family }}>취소</button>}
          {!confirmFirst&&<button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:radius.sm, background:confirmColor===colors.danger?colors.dangerLight:colors.primaryLight, color:confirmColor??colors.primary, fontWeight:font.weight.bold, fontSize:font.size.md, cursor:'pointer', fontFamily:font.family }}>{confirmLabel}</button>}
        </div>
      </div>
    </>
  )
}

/* ── Mini Calendar ── */
function MiniCalendar({ year, month, selected, minDate, onSelect }: { year:number; month:number; selected:string; minDate?:string; onSelect:(d:string)=>void }) {
  const pad = (n:number) => String(n).padStart(2,'0')
  const firstDay=new Date(year,month-1,1).getDay(); const daysInMonth=new Date(year,month,0).getDate()
  const cells:(number|null)[]=[]
  for(let i=0;i<firstDay;i++) cells.push(null)
  for(let i=1;i<=daysInMonth;i++) cells.push(i)
  while(cells.length%7!==0) cells.push(null)
  const DAYS=['일','월','화','수','목','금','토']
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {DAYS.map((d,i)=><div key={d} style={{ textAlign:'center', fontSize:font.size.xs, fontWeight:font.weight.bold, padding:'4px 0', color:i===0?'#E05050':i===6?'#4477CC':colors.textTertiary }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px 0' }}>
        {cells.map((day,idx)=>{
          if(!day) return <div key={idx} />
          const dateStr=`${year}-${pad(month)}-${pad(day)}`
          const isSelected=dateStr===selected; const isDisabled=!!minDate&&dateStr<minDate
          const dayOfWeek=(firstDay+day-1)%7; const isToday=dateStr===new Date().toISOString().slice(0,10)
          return (
            <div key={idx} onClick={()=>!isDisabled&&onSelect(dateStr)} style={{ textAlign:'center', padding:'6px 0', borderRadius:radius.sm, cursor:isDisabled?'default':'pointer', background:isSelected?colors.primary:'transparent', color:isDisabled?colors.gray200:isSelected?'#fff':dayOfWeek===0?'#E05050':dayOfWeek===6?'#4477CC':colors.textPrimary, fontSize:font.size.sm, fontWeight:isSelected||isToday?font.weight.bold:font.weight.regular, border:isToday&&!isSelected?'1.5px solid #00838F':'1.5px solid transparent', boxSizing:'border-box' }}>{day}</div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Trip Picker Modal ── */
function TripPickerModal({ step, startDate, onSelect, onReset, onClose }: { step:'start'|'end'; startDate:string; onSelect:(v:string)=>void; onReset:()=>void; onClose:()=>void }) {
  const today=new Date()
  const [year,setYear]=useState(today.getFullYear()); const [month,setMonth]=useState(today.getMonth()+1); const [selected,setSelected]=useState('')
  const isStart=step==='start'; const minDate=!isStart&&startDate?startDate:undefined
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, animation:'fadeIn 0.2s ease' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'calc(100% - 32px)', maxWidth:340, background:colors.bgCard, borderRadius:radius.lg, padding:`${spacing[5]}px`, zIndex:501, animation:'scaleIn 0.2s ease', maxHeight:'90vh', overflowY:'auto', fontFamily:font.family }}>
        <div style={{ textAlign:'center', marginBottom:spacing[4] }}>
          <div style={{ ...T.xs, letterSpacing:1, marginBottom:spacing[1] }}>{isStart?'STEP 1 / 2':'STEP 2 / 2'}</div>
          <div style={{ ...T.h4, color:'#00838F' }}>{isStart?'✈️ 출발일을 선택해주세요':'🏠 도착일을 선택해주세요'}</div>
          {!isStart&&startDate&&<div style={{ ...T.xs, marginTop:spacing[1] }}>출발일: {startDate}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:spacing[3] }}>
          <button onClick={()=>{ if(month===1){setYear(y=>y-1);setMonth(12)} else setMonth(m=>m-1) }} style={{ width:32, height:32, borderRadius:radius.sm, border:'1px solid rgba(0,131,143,0.2)', background:colors.bgCard, cursor:'pointer', fontSize:14, color:'#00838F', fontWeight:font.weight.bold }}>‹</button>
          <div style={{ ...T.h4 }}>{year}년 {month}월</div>
          <button onClick={()=>{ if(month===12){setYear(y=>y+1);setMonth(1)} else setMonth(m=>m+1) }} style={{ width:32, height:32, borderRadius:radius.sm, border:'1px solid rgba(0,131,143,0.2)', background:colors.bgCard, cursor:'pointer', fontSize:14, color:'#00838F', fontWeight:font.weight.bold }}>›</button>
        </div>
        <MiniCalendar year={year} month={month} selected={selected} minDate={minDate} onSelect={d=>setSelected(d)} />
        <div style={{ marginTop:spacing[3], padding:`${spacing[3]}px`, borderRadius:radius.sm, background:selected?colors.primaryLight:colors.gray100, textAlign:'center', fontSize:font.size.sm, fontWeight:font.weight.bold, color:selected?colors.primary:colors.textTertiary }}>
          {selected?`📅 ${selected}`:'날짜를 선택해주세요'}
        </div>
        <button onClick={()=>selected&&onSelect(selected)} style={{ width:'100%', height:48, borderRadius:radius.sm, border:'none', cursor:selected?'pointer':'default', background:selected?colors.primary:colors.gray100, color:selected?'#fff':colors.textTertiary, fontSize:font.size.md, fontWeight:font.weight.bold, marginTop:spacing[3], fontFamily:font.family }}>
          {isStart?'다음 →':'완료'}
        </button>
        {isStart&&<button onClick={onReset} style={{ width:'100%', marginTop:spacing[2], background:'none', border:'none', color:colors.textTertiary, fontSize:font.size.sm, cursor:'pointer', fontFamily:font.family }}>일정 초기화</button>}
      </div>
    </>
  )
}

/* ── 폭죽 ── */