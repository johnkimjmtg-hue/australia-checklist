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
  issueReceipt, resetAll, saveTrip, loadTrip, clearTrip,
  fmt, getTripDays, fmtMD,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'
import Services from './Services'
import BucketCheckView from './BucketCheckView'
import Community from './Community'
import Shopping from './Shopping'
import MyShoppingView from './MyShoppingView'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'
import NearbyMap from './NearbyMap'

const ff = font.family

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

type Props = { state: AppState; setState: (s: AppState) => void }
type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset' | 'tripPicker' | 'calendar'
type MainTab = 'bucketlist' | 'services' | 'shopping' | 'myshoppinglist' | 'community' | 'nearby'

export default function ChecklistPage({ state, setState, onLanding }: Props & { onLanding?: () => void }) {
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
    const tab = searchParams.get('tab')
    if (tab === 'services' || tab === 'shopping' || tab === 'myshoppinglist' || tab === 'community' || tab === 'nearby') return tab as MainTab
    return 'bucketlist'
  })
  const [logoTapCount, setLogoTapCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch]   = useState(false)
  const logoTapTimer = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [bizCount, setBizCount]       = useState(0)
  const [shopCount, setShopCount]     = useState(0)
  const [todayPostCount, setTodayPostCount] = useState(0)
  const [myList, setMyList] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] } })
  const [myChecked, setMyChecked] = useState<Record<string,boolean>>(() => { try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} } })
  const myListCount    = myList.length
  const myCheckedCount = myList.filter(id => myChecked[id]).length
  const handleMyListChange    = (next: string[]) => { setMyList(next); try { localStorage.setItem('my-shopping-list', JSON.stringify(next)) } catch {} }
  const handleMyCheckedChange = (next: Record<string,boolean>) => { setMyChecked(next); try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {} }

  const [detailBizId, setDetailBizId] = useState<string|null>(null)
  const [detailBiz, setDetailBiz]     = useState<Business|null>(null)
  const [detailItem, setDetailItem]   = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [selProduct, setSelProduct]   = useState<any|null>(null)

  useEffect(() => {
    supabase.from('businesses').select('*',{count:'exact',head:true}).eq('is_active',true).then(({count})=>{ if(count!==null) setBizCount(count) })
  }, [])
  useEffect(() => {
    supabase.from('shopping_products').select('*',{count:'exact',head:true}).eq('is_active',true).then(({count})=>{ if(count!==null) setShopCount(count) })
  }, [])
  useEffect(() => {
    let channel: any
    const today = new Date(); today.setHours(0,0,0,0); const todayStr = today.toISOString()
    const refetch = async () => { const {count} = await supabase.from('community_posts').select('*',{count:'exact',head:true}).gte('created_at',todayStr); if(count!==null) setTodayPostCount(count) }
    refetch()
    channel = supabase.channel('today-posts')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_posts'},(p:any)=>{ if(new Date(p.new.created_at)>=today) setTodayPostCount(prev=>prev+1) })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'community_posts'},()=>refetch())
      .subscribe()
    return () => { if(channel) channel.unsubscribe() }
  }, [])
  useEffect(() => {
    Promise.all([
      supabase.from('checklist_categories').select('*').order('sort_order'),
      supabase.from('checklist_items').select('*').eq('is_active',true).order('sort_order'),
    ]).then(([{data:cats},{data:items}]) => { if(cats) setCategories(cats); if(items) setDbItems(items); setDbLoading(false) })
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
  const total = allItems.length
  const unscheduledCount = Object.keys(state.selected).filter(id=>!(state.schedules[id]?.length)).length
  const tripLabel = trip ? `${trip.startDate.slice(5).replace('-','/')}~${trip.endDate.slice(5).replace('-','/')}` : null

  const handleOpenTripPicker = () => { setPickerStep('start'); setStartDate(trip?.startDate??''); setEndDate(trip?.endDate??''); setModal('tripPicker') }
  const handleResetTrip = () => { setStartDate(''); setEndDate(''); clearTrip(); setTrip(null); setModal('none') }

  const [showFireworks, setShowFireworks] = useState(false)
  const playFireworksSound = () => {
    try {
      const ctx = new (window.AudioContext||(window as any).webkitAudioContext)()
      const boom = (time:number,freq:number,vol:number) => { const buf=ctx.createBuffer(1,ctx.sampleRate*0.5,ctx.sampleRate); const data=buf.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.08)); const src=ctx.createBufferSource(); src.buffer=buf; const gain=ctx.createGain(); const filter=ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.setValueAtTime(freq,time); filter.frequency.exponentialRampToValueAtTime(80,time+0.4); gain.gain.setValueAtTime(vol,time); gain.gain.exponentialRampToValueAtTime(0.001,time+0.5); src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start(time) }
      const now=ctx.currentTime; boom(now,300,0.8); boom(now+0.35,200,0.6); boom(now+0.65,150,0.4)
    } catch {}
  }

  const handleDateSelect = (val:string) => {
    if(pickerStep==='start'){ setStartDate(val); setPickerStep('end') }
    else { const t={startDate,endDate:val}; saveTrip(t); setTrip(t); setModal('none'); playFireworksSound(); setShowFireworks(true); setTimeout(()=>setShowFireworks(false),2800) }
  }

  const handleIssue = () => {
    if(!trip){ setModal('noTrip'); return }
    if(done===0){ triggerShake(); return }
    const checkedIds=Object.keys(state.selected)
    const unscheduled=checkedIds.filter(id=>!(state.schedules[id]?.length))
    if(unscheduled.length>0){ setModal('noSchedule'); return }
    const at=fmt(new Date()); setIssuedAt(at); setState(issueReceipt(state,at))
  }
  const triggerShake = () => { setShakeBtn(true); setTimeout(()=>setShakeBtn(false),600) }
  const handleAddCustom = () => { const label=customLabel.trim(); if(!label) return; setState(addCustom(state,label,activeCategory)); setCustomLabel('') }
  const doReset = () => { setState(resetAll()); setTrip(null); setStartDate(''); setEndDate(''); setShowReceipt(false); setModal('none'); try{localStorage.removeItem('bucket-achieved')}catch{} }
  const isIssued = !!state.meta.lastIssuedAt

  const TABS = [
    {id:'bucketlist',icon:'ph:check-square',  label:'버킷리스트'},
    {id:'services',  icon:'ph:buildings',      label:'업체'},
    {id:'nearby',    icon:'ph:map-pin',        label:'내주변'},
    {id:'shopping',  icon:'ph:shopping-bag',   label:'쇼핑'},
    {id:'community', icon:'ph:chats-circle',   label:'커뮤니티'},
  ] as {id:MainTab;icon:string;label:string}[]

  const handleTabClick = (id:MainTab) => {
    if(id==='shopping'){ if(myListCount>0&&mainTab==='shopping'){setMainTab('myshoppinglist');return} if(mainTab==='myshoppinglist'){setMainTab('shopping');return} if(myListCount>0){setMainTab('myshoppinglist');return} }
    setMainTab(id)
  }
  const activeTabId: MainTab = mainTab==='myshoppinglist'?'shopping':mainTab

  return (
    <div style={{ minHeight:'100dvh', background:colors.bgPage, fontFamily:ff, maxWidth:430, margin:'0 auto', position:'relative', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes fwBurst { 0%{transform:translate(-50%,-50%) scale(0) rotate(var(--r));opacity:1} 80%{opacity:0.8} 100%{transform:translate(var(--tx),var(--ty)) scale(1) rotate(var(--r));opacity:0} }
        .list-item:active { background: ${colors.gray50} !important; }
        .cat-btn { transition:all 0.12s; -webkit-tap-highlight-color:transparent; }
        .nav-btn  { -webkit-tap-highlight-color:transparent; }
      `}</style>

      {/* ── 메인 컨텐츠 ── */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom: mainTab==='bucketlist'&&!isIssued ? 124 : 64 }}>

        {mainTab==='services' ? (
          <Services onSelectBusiness={()=>{}} onBack={()=>setMainTab('bucketlist')} />
        ) : mainTab==='shopping' ? (
          <Shopping myList={myList} myChecked={myChecked} onMyListChange={handleMyListChange} onMyCheckedChange={handleMyCheckedChange} onGoToMyList={()=>setMainTab('myshoppinglist')} />
        ) : mainTab==='myshoppinglist' ? (
          <MyShoppingView myList={myList} myChecked={myChecked} onMyListChange={handleMyListChange} onMyCheckedChange={handleMyCheckedChange} onBack={()=>setMainTab('shopping')} onLanding={()=>navigate('/')} />
        ) : mainTab==='nearby' ? (
          <NearbyMap onBack={()=>setMainTab('bucketlist')} />
        ) : mainTab==='community' ? (
          <Community />
        ) : (mainTab==='bucketlist'&&isIssued&&trip) ? (
          <>
            <BucketCheckView state={state} trip={trip} setState={setState} items={ITEMS} dbItems={dbItems} onAchievedChange={setAchieved}
              onEdit={()=>{ setShowReceipt(false); const next={...state,meta:{...state.meta,lastIssuedAt:undefined}}; setState(next); try{localStorage.setItem('korea-receipt',JSON.stringify(next))}catch{}; try{localStorage.removeItem('bucket-achieved')}catch{}; setAchieved({}) }}
              onDelete={doReset}
              onShare={()=>{ const at=state.meta.lastIssuedAt??issuedAt; setIssuedAt(at); setShowReceipt(true) }}
              onLanding={()=>onLanding?.()} />
            {showReceipt&&trip&&(
              <ReceiptModal state={state} trip={trip} issuedAt={issuedAt} achieved={achieved} dbItems={dbItems}
                onClose={()=>setShowReceipt(false)} onReset={()=>{ setShowReceipt(false); doReset() }} />
            )}
          </>
        ) : (
          <>
            {/* ── 버킷리스트 헤더 (sticky) ── */}
            <div style={{ position:'sticky', top:0, zIndex:30, background:colors.bgCard, borderBottom:`1px solid ${colors.border}` }}>

              {/* 타이틀 + 버튼들 */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:`${spacing[3]}px ${spacing[4]}px` }}>
                <div style={{ display:'flex', alignItems:'center', gap:spacing[2] }}>
                  <span onClick={handleLogoTap} style={{ ...T.h3, cursor:'pointer', userSelect:'none' }}>버킷리스트</span>
                  {done>0 && (
                    <span style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, background:colors.primaryLight, color:colors.primary, borderRadius:radius.full, padding:`2px ${spacing[2]}px` }}>
                      {done}개 선택
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:spacing[2], alignItems:'center' }}>
                  <button onClick={handleOpenTripPicker} style={{
                    height:32, padding:`0 ${spacing[3]}px`, borderRadius:radius.full,
                    border: tripLabel ? `1.5px solid ${colors.success}` : `1.5px solid ${colors.primary}`,
                    background: tripLabel ? colors.successLight : colors.primaryLight,
                    color: tripLabel ? colors.success : colors.primary,
                    fontSize:font.size.xs, fontWeight:font.weight.bold,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:ff,
                    animation: !tripLabel ? 'pulse 1.4s ease-in-out infinite' : 'none',
                  }}>
                    <Icon icon="ph:airplane-takeoff" width={13} height={13} />
                    {tripLabel ?? '일정 설정'}
                  </button>
                  {trip && (
                    <button onClick={()=>setModal('calendar')} style={{
                      width:32, height:32, borderRadius:radius.full,
                      border:`1px solid ${colors.border}`, background:colors.bgCard,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                    }}>
                      <Icon icon="ph:calendar-check" width={16} height={16} color={colors.primary} />
                    </button>
                  )}
                </div>
              </div>

              {/* 검색창 (열렸을 때) */}
              {showSearch && (
                <div style={{ padding:`0 ${spacing[4]}px ${spacing[2]}px` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:spacing[2], background:colors.bgInput, borderRadius:radius.sm, padding:`0 ${spacing[3]}px`, height:40, border:`1px solid ${colors.border}` }}>
                    <Icon icon="ph:magnifying-glass" width={15} height={15} color={colors.textTertiary} />
                    <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="버킷리스트 검색"
                      style={{ flex:1, border:'none', outline:'none', fontSize:font.size.sm, color:colors.textPrimary, background:'transparent', fontFamily:ff }} />
                    <button onClick={()=>{ setShowSearch(false); setSearchQuery('') }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                      <Icon icon="ph:x" width={13} height={13} color={colors.textTertiary} />
                    </button>
                  </div>
                </div>
              )}

              {/* 카테고리 그리드 2줄 */}
              {!showSearch && (
                <div style={{ padding:`0 ${spacing[3]}px ${spacing[3]}px`, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:spacing[1] }}>
                  {/* 검색 버튼 */}
                  <button className="cat-btn" onClick={()=>setShowSearch(true)} style={{
                    height:52, borderRadius:radius.sm, border:`1px solid ${colors.border}`,
                    background:colors.bgCard, cursor:'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, fontFamily:ff,
                  }}>
                    <Icon icon="ph:magnifying-glass" width={16} height={16} color={colors.textTertiary} />
                    <span style={{ fontSize:font.size.xs, color:colors.textTertiary, fontWeight:font.weight.medium }}>검색</span>
                  </button>
                  {/* 카테고리 칩 */}
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
                            height:52, borderRadius:radius.sm, position:'relative',
                            border: isActive ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}`,
                            background: isActive ? colors.primaryLight : colors.bgCard,
                            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, fontFamily:ff,
                          }}>
                          <span style={{ fontSize:16 }}>{cat.emoji}</span>
                          <span style={{ fontSize:9, fontWeight:isActive?font.weight.bold:font.weight.regular, color:isActive?colors.primary:colors.textSecondary, lineHeight:1.2, textAlign:'center', padding:'0 2px' }}>
                            {cat.label}
                          </span>
                          {catDone>0 && (
                            <span style={{ position:'absolute', top:-4, right:-4, background:colors.primary, color:'#fff', borderRadius:radius.full, fontSize:8, fontWeight:font.weight.bold, minWidth:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px' }}>{catDone}</span>
                          )}
                        </button>
                      )
                    })
                  })()}
                </div>
              )}
            </div>

            {/* ── 리스트 ── */}
            <div style={{ background:colors.bgPage }}>
              {/* 섹션 헤더 */}
              {!showSearch && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`${spacing[3]}px ${spacing[4]}px ${spacing[2]}px` }}>
                  <span style={{ ...T.sm, fontWeight:font.weight.bold }}>
                    {CATEGORIES.find(c=>c.id===activeCategory)?.emoji} {CATEGORIES.find(c=>c.id===activeCategory)?.label}
                  </span>
                  <span style={{ fontSize:font.size.sm, color:colors.primary, fontWeight:font.weight.bold }}>
                    {catItems.filter(i=>state.selected[i.id]).length}/{catItems.length}
                  </span>
                </div>
              )}

              {/* 직접 추가 */}
              {activeCategory==='custom'&&!showSearch&&(
                <div style={{ display:'flex', gap:spacing[2], padding:`0 ${spacing[4]}px ${spacing[3]}px`, alignItems:'center' }}>
                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:spacing[2], background:colors.bgCard, borderRadius:radius.sm, padding:`0 ${spacing[3]}px`, border:`1px solid ${colors.border}`, height:44 }}>
                    <Icon icon="ph:plus-circle" width={16} height={16} color={colors.primary} />
                    <input ref={inputRef} value={customLabel} onChange={e=>setCustomLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddCustom()} placeholder="직접 추가"
                      style={{ flex:1, border:'none', outline:'none', fontSize:font.size.md, color:colors.textPrimary, background:'transparent', fontFamily:ff }} />
                  </div>
                  <button onClick={handleAddCustom} style={{ height:44, padding:`0 ${spacing[4]}px`, background:colors.primary, color:'#fff', border:'none', borderRadius:radius.sm, fontWeight:font.weight.bold, fontSize:font.size.sm, cursor:'pointer', fontFamily:ff }}>추가</button>
                </div>
              )}

              {/* 아이템 리스트 — A타입 */}
              <div style={{ display:'flex', flexDirection:'column' }}>
                {searchResults!==null&&searchResults.length===0&&(
                  <div style={{ textAlign:'center', padding:'40px 0', ...T.sm }}>검색 결과가 없어요</div>
                )}
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
                        padding:`${spacing[3]}px ${spacing[4]}px`,
                        background: isHighlight ? '#EFF6FF' : checked ? colors.primaryLight : colors.bgCard,
                        borderLeft: checked ? `3px solid ${colors.primary}` : isHighlight ? `3px solid ${colors.primary}` : `3px solid transparent`,
                        cursor:'pointer', transition:'all 0.15s',
                        borderBottom:`1px solid ${colors.border}`,
                      }}
                      onClick={async()=>{
                        if(!db) return
                        if((db.related_product_ids?.length??0)>0){ const {data}=await supabase.from('shopping_products').select('*').eq('id',db.related_product_ids![0]).single(); if(data) setSelProduct(data); return }
                        setDetailItem(db)
                        if((db.related_business_ids?.length??0)>0){ const {data}=await supabase.from('businesses').select('*').in('id',db.related_business_ids!); setDetailBizCards(data??[]) } else setDetailBizCards([])
                      }}
                    >
                      {/* 체크박스 */}
                      <button onClick={e=>{
                        e.stopPropagation()
                        if(!trip){ setModal('noTrip'); return }
                        const nextChecked = !checked
                        setState(toggleItem(state,item.id))
                        if(nextChecked) setTimeout(()=>setSheetItem(item as CheckItem),50)
                      }} style={{
                        width:22, height:22, borderRadius:6, flexShrink:0,
                        border: checked ? 'none' : `1.5px solid ${colors.border}`,
                        background: checked ? colors.primary : colors.bgCard,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', padding:0,
                      }}>
                        {checked&&(
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      {/* 텍스트 */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:font.size.md, fontWeight:checked?font.weight.bold:font.weight.medium, color:checked?colors.primary:colors.textPrimary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {item.label}
                        </div>
                        <div style={{ display:'flex', gap:spacing[1], alignItems:'center', marginTop:3 }}>
                          {cat&&searchResults&&(
                            <span style={{ fontSize:font.size.xs, color:colors.textTertiary }}>{cat.emoji} {cat.label}</span>
                          )}
                          {region&&(
                            <span style={{ fontSize:font.size.xs, color:colors.textTertiary }}>{searchResults&&cat?'·':''} 📍 {region.label}</span>
                          )}
                        </div>
                      </div>

                      {/* 일정 뱃지 */}
                      {checked&&dayCount>0&&(
                        <span style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, background:colors.primary, color:'#fff', borderRadius:radius.full, padding:`2px ${spacing[2]}px`, flexShrink:0 }}>
                          {dayCount}일차
                        </span>
                      )}

                      <Icon icon="ph:caret-right" width={14} height={14} color={colors.gray300} />
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 하단 고정 영역 ── */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:colors.bgCard, borderTop:`1px solid ${colors.border}`, zIndex:40 }}>
        {/* 발행하기 버튼 */}
        {mainTab==='bucketlist'&&!isIssued&&(
          <div style={{ padding:`${spacing[2]}px ${spacing[3]}px`, display:'flex', gap:spacing[2] }}>
            <button onClick={handleIssue} style={{
              flex:4, height:40, background:colors.primary, color:'#fff',
              border:'none', borderRadius:radius.sm, fontSize:font.size.md, fontWeight:font.weight.bold,
              cursor:'pointer', fontFamily:ff, animation:shakeBtn?'shake 0.5s ease':'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <Icon icon="ph:paper-plane-right" width={16} height={16} color="#fff" />
              버킷리스트 발행하기
            </button>
            <button onClick={()=>setModal('confirmReset')} style={{
              flex:1, height:40, background:colors.gray100, color:colors.textSecondary,
              border:'none', borderRadius:radius.sm, fontSize:font.size.sm, fontWeight:font.weight.medium,
              cursor:'pointer', fontFamily:ff,
            }}>초기화</button>
          </div>
        )}

        {/* 하단 탭바 */}
        <div style={{ display:'flex', padding:`${spacing[1]}px 0 ${spacing[2]}px` }}>
          {TABS.map(tab=>{
            const isActive = activeTabId===tab.id
            const showBadge = tab.id==='community'&&todayPostCount>0
            return (
              <button key={tab.id} className="nav-btn" onClick={()=>handleTabClick(tab.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, height:50, background:'none', border:'none', cursor:'pointer', position:'relative', fontFamily:ff }}>
                <Icon icon={tab.icon} width={20} height={20} color={isActive?colors.primary:colors.textTertiary} />
                <span style={{ fontSize:9, fontWeight:isActive?font.weight.bold:font.weight.regular, color:isActive?colors.primary:colors.textTertiary }}>{tab.label}</span>
                {isActive&&<div style={{ width:4, height:4, borderRadius:radius.full, background:colors.primary, position:'absolute', bottom:2 }} />}
                {showBadge&&<span style={{ position:'absolute', top:6, right:'calc(50% - 14px)', background:'#EF4444', color:'#fff', fontSize:8, fontWeight:font.weight.bold, borderRadius:radius.full, padding:'1px 4px', minWidth:14, textAlign:'center' }}>{todayPostCount}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 폭죽 ── */}
      {showFireworks&&<Fireworks />}

      {/* ── 캘린더 팝업 ── */}
      {modal==='calendar'&&trip&&(
        <CalendarModal state={state} trip={trip} allItems={allItems} onClose={()=>setModal('none')} />
      )}

      {/* ── Trip date picker ── */}
      {modal==='tripPicker'&&(
        <TripPickerModal step={pickerStep} startDate={startDate} onSelect={handleDateSelect} onReset={handleResetTrip} onClose={()=>setModal('none')} />
      )}

      {/* ── Alerts ── */}
      {modal==='confirmReset'&&<AlertModal title="전체 초기화할까요?" message="체크 내용과 여행일정이 모두 삭제됩니다." confirmLabel="삭제" confirmColor={colors.danger} onConfirm={doReset} onCancel={()=>setModal('none')} />}
      {modal==='noTrip'&&<AlertModal title="여행일정을 먼저 설정해주세요" confirmLabel="날짜 입력하기" confirmFirst onConfirm={()=>{ setModal('none'); setTimeout(handleOpenTripPicker,100) }} onCancel={()=>setModal('none')} />}
      {modal==='noDate'&&<AlertModal title="출발일과 도착일을 모두 선택해주세요" confirmLabel="확인" onConfirm={()=>setModal('none')} onCancel={()=>setModal('none')} hideCancel />}
      {modal==='noSchedule'&&<AlertModal title="날짜 미지정 항목이 있어요" message="체크된 모든 항목에 날짜를 지정해야 발행할 수 있어요." confirmLabel="확인" onConfirm={()=>setModal('none')} onCancel={()=>setModal('none')} hideCancel />}

      {/* ── ScheduleSheet ── */}
      {sheetItem&&trip&&(
        <ScheduleSheet itemLabel={sheetItem.label} trip={trip}
          currentDays={state.schedules[sheetItem.id]??[]}
          onSelect={days=>{ setState(setSchedule(state,sheetItem.id,days)) }}
          onClose={()=>setSheetItem(null)} />
      )}

      {showReceipt&&trip&&(
        <ReceiptModal state={state} trip={trip} issuedAt={issuedAt} achieved={achieved} dbItems={dbItems}
          onClose={()=>setShowReceipt(false)} onReset={()=>setModal('confirmReset')} />
      )}

      {/* ── 쇼핑 상품 팝업 ── */}
      {selProduct&&(
        <>
          <div onClick={()=>setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600 }} />
          <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:colors.bgCard, borderRadius:`${radius.xl}px ${radius.xl}px 0 0`, zIndex:601, animation:'slideUp 0.25s ease', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`${spacing[3]}px auto 0` }} />
            <div style={{ width:'100%', height:200, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:colors.gray100 }}>
              {selProduct.image_url ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={48} height={48} color={colors.gray300} />}
            </div>
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[10]}px` }}>
              <div style={{ display:'flex', gap:spacing[1], flexWrap:'wrap', marginBottom:spacing[3], alignItems:'center' }}>
                {(selProduct.tags??[]).map((tag:string)=>(
                  <span key={tag} style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, padding:`2px ${spacing[2]}px`, borderRadius:radius.sm, background:TAG_COLOR[tag]?.bg??colors.gray100, color:TAG_COLOR[tag]?.color??colors.textSecondary }}>{tag}</span>
                ))}
              </div>
              <div style={{ ...T.h2, marginBottom:spacing[1] }}>{selProduct.name}</div>
              {selProduct.brand&&<div style={{ ...T.sm, marginBottom:spacing[3] }}>{selProduct.brand}</div>}
              {selProduct.description&&<div style={{ ...T.body, lineHeight:1.7, marginBottom:spacing[4] }}>{selProduct.description}</div>}
              <button onClick={()=>setSelProduct(null)} style={{ width:'100%', height:48, borderRadius:radius.md, border:'none', background:colors.gray100, color:colors.textSecondary, fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:ff }}>닫기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 버킷리스트 상세 팝업 ── */}
      {detailItem&&(
        <div onClick={()=>setDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', fontFamily:ff }}>
          <div onClick={e=>e.stopPropagation()} style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:colors.bgCard, borderRadius:`${radius.xl}px ${radius.xl}px 0 0`, maxHeight:'85vh', overflowY:'auto', animation:'slideUp 0.25s ease' }}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`${spacing[3]}px auto 0` }} />
            {detailItem.image_url&&<div style={{ width:'100%', height:200, overflow:'hidden', marginTop:spacing[2] }}><img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>}
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[10]}px` }}>
              <div style={{ ...T.h2, lineHeight:1.4, marginBottom:spacing[3] }}>{detailItem.label}</div>
              {detailItem.description&&<div style={{ ...T.body, lineHeight:1.7, marginBottom:spacing[4], color:colors.textSecondary }}>{detailItem.description}</div>}
              {detailItem.tips&&(
                <div style={{ background:colors.warningLight, border:`1px solid ${colors.warning}`, borderRadius:radius.md, padding:`${spacing[3]}px`, marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:colors.warning, marginBottom:spacing[1] }}>💡 현지인 팁</div>
                  <div style={{ ...T.sm, lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {detailItem.address&&(
                <button onClick={()=>window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')} style={{ display:'flex', alignItems:'center', gap:spacing[2], width:'100%', background:colors.bgCard, border:`1px solid ${colors.border}`, borderRadius:radius.md, padding:`${spacing[3]}px`, marginBottom:spacing[4], cursor:'pointer', textAlign:'left' }}>
                  <Icon icon="ph:map-pin" width={16} height={16} color={colors.primary} />
                  <div>
                    <div style={{ fontSize:font.size.xs, color:colors.textTertiary }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:font.size.sm, color:colors.primary, fontWeight:font.weight.bold, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={13} height={13} color={colors.textTertiary} style={{ marginLeft:'auto' }} />
                </button>
              )}
              {detailBizCards.length>0&&(
                <div style={{ marginBottom:spacing[4] }}>
                  <div style={{ ...T.caption, marginBottom:spacing[2] }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>{detailBizCards.map(biz=><BusinessCard key={biz.id} business={biz} />)}</div>
                </div>
              )}
              <button onClick={()=>setDetailItem(null)} style={{ width:'100%', height:48, borderRadius:radius.md, border:'none', background:colors.gray100, color:colors.textSecondary, fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:ff }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 캘린더 팝업 ── */
function CalendarModal({ state, trip, allItems, onClose }: { state:AppState; trip:TripInfo; allItems:any[]; onClose:()=>void }) {
  const days = getTripDays(trip)
  const [activeDayIdx, setActiveDayIdx] = useState<number|null>(null)
  const dayCount = days.map((_,idx)=> allItems.filter(item=>state.selected[item.id]&&(state.schedules[item.id]??[]).includes(idx)).length)
  function dayColor(count:number):string { if(count<=0) return colors.bgCard; if(count===1) return '#D1FAE5'; if(count===2) return '#FEF08A'; if(count===3) return '#FED7AA'; return '#FCA5A5' }
  const dayItems = activeDayIdx!==null ? allItems.filter(item=>state.selected[item.id]&&(state.schedules[item.id]??[]).includes(activeDayIdx)) : []
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, animation:'fadeIn 0.2s ease' }} />
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:colors.bgCard, borderRadius:`${radius.xl}px ${radius.xl}px 0 0`, zIndex:501, animation:'slideUp 0.25s ease', padding:`0 ${spacing[4]}px ${spacing[6]}px`, maxHeight:'70vh', overflowY:'auto', fontFamily:font.family }}>
        <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`${spacing[3]}px auto ${spacing[3]}px` }} />
        <div style={{ ...T.h4, marginBottom:spacing[3] }}>📅 일정 현황</div>
        <div style={{ display:'flex', gap:spacing[2], overflowX:'auto', paddingBottom:spacing[2], scrollbarWidth:'none' }}>
          {days.map((d,idx)=>{
            const isActive=activeDayIdx===idx; const bg=dayColor(dayCount[idx])
            return (
              <button key={idx} onClick={()=>setActiveDayIdx(isActive?null:idx)} style={{ minWidth:56, height:52, borderRadius:radius.sm, flexShrink:0, border:isActive?`1.5px solid ${colors.primary}`:`1px solid ${colors.border}`, cursor:'pointer', background:isActive?colors.primaryLight:bg, color:isActive?colors.primary:colors.textSecondary, fontSize:font.size.sm, fontWeight:isActive?font.weight.bold:font.weight.regular, position:'relative', fontFamily:font.family, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
                <div style={{ fontSize:font.size.xs }}>{idx+1}일차</div>
                <div style={{ fontSize:9, opacity:0.8 }}>{fmtMD(d)}</div>
                {dayCount[idx]>0&&<span style={{ position:'absolute', top:3, right:4, fontSize:9, fontWeight:font.weight.bold, color:colors.textSecondary }}>{dayCount[idx]}</span>}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop:spacing[3], minHeight:40 }}>
          {activeDayIdx===null ? (
            <p style={{ ...T.sm, textAlign:'center', padding:`${spacing[3]}px 0` }}>날짜를 눌러 일정을 확인하세요</p>
          ) : dayItems.length===0 ? (
            <p style={{ ...T.sm, textAlign:'center', padding:`${spacing[3]}px 0` }}>이 날 할당된 항목이 없어요</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>
              {dayItems.map(item=>(
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:spacing[2], padding:`${spacing[2]}px ${spacing[3]}px`, background:colors.primaryLight, borderRadius:radius.sm, fontSize:font.size.sm, color:colors.primary, fontWeight:font.weight.medium }}>
                  <Icon icon="ph:check-circle-fill" width={14} height={14} color={colors.primary} />
                  {item.label.includes(',')?item.label.split(',')[0].trim():item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Alert Modal ── */
function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel, confirmFirst }: { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean; confirmFirst?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:colors.bgCard, borderRadius:radius.lg, padding:`${spacing[6]}px ${spacing[5]}px`, zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center', animation:'scaleIn 0.22s ease', fontFamily:font.family }}>
        <p style={{ ...T.h4, marginBottom:message?spacing[2]:spacing[5], lineHeight:1.5 }}>{title}</p>
        {message&&<p style={{ ...T.sm, marginBottom:spacing[5], lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:'flex', gap:spacing[2] }}>
          {confirmFirst&&<button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:radius.sm, background:colors.primaryLight, color:confirmColor??colors.primary, fontWeight:font.weight.bold, fontSize:font.size.md, cursor:'pointer', fontFamily:font.family }}>{confirmLabel}</button>}
          {!hideCancel&&<button onClick={onCancel} style={{ flex:1, height:48, border:'none', borderRadius:radius.sm, background:colors.gray100, color:colors.textSecondary, fontWeight:font.weight.medium, fontSize:font.size.sm, cursor:'pointer', fontFamily:font.family }}>취소</button>}
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
            <div key={idx} onClick={()=>!isDisabled&&onSelect(dateStr)} style={{ textAlign:'center', padding:'6px 0', borderRadius:radius.sm, cursor:isDisabled?'default':'pointer', background:isSelected?colors.primary:'transparent', color:isDisabled?colors.gray200:isSelected?'#fff':dayOfWeek===0?'#E05050':dayOfWeek===6?'#4477CC':colors.textPrimary, fontSize:font.size.sm, fontWeight:isSelected||isToday?font.weight.bold:font.weight.regular, border:isToday&&!isSelected?`1.5px solid ${colors.primary}`:'1.5px solid transparent', boxSizing:'border-box' }}>{day}</div>
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
          <div style={{ ...T.h4, color:colors.primary }}>{isStart?'✈️ 출발일을 선택해주세요':'🏠 도착일을 선택해주세요'}</div>
          {!isStart&&startDate&&<div style={{ ...T.xs, marginTop:spacing[1] }}>출발일: {startDate}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:spacing[3] }}>
          <button onClick={()=>{ if(month===1){setYear(y=>y-1);setMonth(12)} else setMonth(m=>m-1) }} style={{ width:32, height:32, borderRadius:radius.sm, border:`1px solid ${colors.border}`, background:colors.bgCard, cursor:'pointer', fontSize:14, color:colors.primary, fontWeight:font.weight.bold }}>‹</button>
          <div style={{ ...T.h4 }}>{year}년 {month}월</div>
          <button onClick={()=>{ if(month===12){setYear(y=>y+1);setMonth(1)} else setMonth(m=>m+1) }} style={{ width:32, height:32, borderRadius:radius.sm, border:`1px solid ${colors.border}`, background:colors.bgCard, cursor:'pointer', fontSize:14, color:colors.primary, fontWeight:font.weight.bold }}>›</button>
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
function Fireworks() {
  const fwColors=['#FFCD00','#1B6EF3','#FF4B4B','#4ECDC4','#FF9F43','#A29BFE','#55EFC4','#FD79A8','#fff']
  const cx=50; const cy=50
  const particles=Array.from({length:72},(_,i)=>{ const angle=(i/72)*360; const dist=80+Math.random()*120; const rad=(angle*Math.PI)/180; return { tx:Math.cos(rad)*dist, ty:Math.sin(rad)*dist, color:fwColors[Math.floor(Math.random()*fwColors.length)], delay:Math.random()*0.3, dur:0.8+Math.random()*0.6, size:4+Math.random()*6, isRect:i%3!==0, angle } })
  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, pointerEvents:'none', overflow:'hidden' }}>
      {particles.map((p,i)=>(
        <div key={i} style={{ position:'absolute', left:`${cx}%`, top:`${cy}%`, width:p.isRect?p.size*0.5:p.size, height:p.isRect?p.size*2:p.size, borderRadius:p.isRect?2:'50%', background:p.color,
          // @ts-ignore
          '--tx':`${p.tx}px`,'--ty':`${p.ty}px`,'--r':`${p.angle}deg`, animation:`fwBurst ${p.dur}s ease-out ${p.delay}s both` }} />
      ))}
    </div>
  )
}
