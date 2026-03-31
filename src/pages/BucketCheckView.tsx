import { useState, useEffect, useRef } from 'react'
import { CheckItem, ITEM_ICONS } from '../data/checklist'
import { supabase } from '../lib/supabase'
import { getCachedBusinesses, getCachedShopping } from '../lib/dataCache'
import { colors, font, radius, spacing, shadow, T } from '../styles/tokens'
import { AlertModal } from '../components/ui'
import ScheduleSheet from '../components/ScheduleSheet'

type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null; image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null }
import { AppState, TripInfo, getTripDays, fmtMD, dow, setSchedule } from '../store/state'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'

type Filter = 'all' | 'done' | 'todo'
type Props = {
  state:      AppState
  trip:       TripInfo | null
  setState:   (s: AppState) => void
  items:      CheckItem[]
  dbItems:    DBItem[]
  onAchievedChange?: (achieved: Record<string,boolean>) => void
  onEdit:     () => void
  onDelete:   () => void
  onShare:    () => void
  onLanding:   () => void
}

const CAT_ICONS: Record<string,string> = {
  hospital:'ph:first-aid-kit',food:'ph:fork-knife',shopping:'ph:shopping-bag',
  admin:'ph:files',people:'ph:users',parenting:'ph:baby',places:'ph:map-pin',
  schedule:'ph:calendar',custom:'ph:star',
}
function ItemIcon({ itemId, categoryId, color }: { itemId:string; categoryId:string; color:string }) {
  return <Icon icon={ITEM_ICONS[itemId] ?? CAT_ICONS[categoryId] ?? 'ph:star'} width={20} height={20} color={color} />
}

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  '인기':      { bg:'#FEF3C7', color:'#B45309' },
  '강추':      { bg:'#DCFCE7', color:'#15803D' },
  '선물':      { bg:'#FCE7F3', color:'#BE185D' },
  '프리미엄':  { bg:'#EDE9FE', color:'#7C3AED' },
  '가성비':    { bg:'#DBEAFE', color:'#1D4ED8' },
  '필수템':    { bg:'#FEE2E2', color:'#DC2626' },
}
const PRICE_COLOR: Record<string, string> = { '$': '#16A34A', '$$': '#D97706', '$$$': '#7C3AED' }
const PRICE_LABEL: Record<string, string> = { '$': '저렴', '$$': '보통', '$$$': '고급' }

const stateMap: Record<string, {label:string; color:string; bg:string; icon:string}> = {
  'NSW': { label:'시드니',    color:'#fff', bg:'#B8860B', icon:'ph:house-line' },
  'VIC': { label:'멜번',      color:'#fff', bg:'#1a237e', icon:'ph:tram' },
  'QLD': { label:'브리즈번',  color:'#fff', bg:'#E65100', icon:'ph:sun' },
  'WA':  { label:'퍼스',      color:'#fff', bg:'#0891B2', icon:'ph:waves' },
  'SA':  { label:'애들레이드', color:'#fff', bg:'#BE185D', icon:'ph:wine' },
  'TAS': { label:'태즈매니아', color:'#fff', bg:'#065F46', icon:'ph:tree' },
  'ACT': { label:'캔버라',    color:'#fff', bg:'#374151', icon:'ph:flag' },
  'NT':  { label:'다윈',      color:'#fff', bg:'#92400E', icon:'ph:compass' },
}

interface Particle { id:number; x:number; color:string; size:number; duration:number; delay:number }

const catColors: Record<string,string> = {
  hospital:'#1a6b7a', food:'#2d7a5e', shopping:'#4a3f7a',
  places:'#7a4a2a', schedule:'#1a4a6b', admin:'#5a5a7a',
  people:'#3a6b4a', parenting:'#6b4a3a', custom:'#4a6b5a',
}

function PhotoCardGrid({ items, dayIdx, dbItems, achieved, toggleAchieved, setDetailItem }: {
  items: { id: string; categoryId: string; label: string; emoji: string }[]
  dayIdx?: number
  dbItems: DBItem[]
  achieved: Record<string,boolean>
  toggleAchieved: (id: string, day?: number) => void
  setDetailItem: (item: DBItem) => void
}) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {items.map((item, idx) => {
        const db = dbItems.find(d => d.id === item.id)
        const isAchieved = dayIdx !== undefined
          ? !!achieved[`${item.id}_${dayIdx}`]
          : !!achieved[item.id]
        const bgColor = catColors[item.categoryId] ?? '#1a4a6b'
        const isWide = items.length % 2 !== 0 && idx === items.length - 1
        const regionKey = db?.address ? Object.keys(stateMap).find(k => db.address!.toUpperCase().includes(k)) : null
        const region = regionKey ? stateMap[regionKey] : null
        return (
          <div key={item.id}
            style={{
              gridColumn: isWide ? 'span 2' : 'span 1',
              borderRadius:16, overflow:'hidden', position:'relative',
              aspectRatio: isWide ? '2/1' : '3/4',
              background: bgColor,
              WebkitTapHighlightColor:'transparent',
            }}>
            {db?.image_url && (
              <img src={db.image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
            )}
            <button
              onClick={e => { e.stopPropagation(); toggleAchieved(item.id, dayIdx) }}
              style={{ position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background: isAchieved ? '#29B6D0' : 'rgba(255,255,255,0.25)', WebkitTapHighlightColor:'transparent' }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M1.5 6L4.5 9L10.5 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            <div
              onClick={() => db && setDetailItem(db)}
              style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px 10px 12px', background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)', cursor: db ? 'pointer' : 'default', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.3, opacity: isAchieved ? 0.7 : 1, textDecoration: isAchieved ? 'line-through' : 'none' }}>{item.label}</div>
              {region && <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:3 }}>📍 {region.label}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Confetti({ trigger }: { trigger:number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const prev = useRef(0)
  useEffect(() => {
    if (trigger === 0 || trigger === prev.current) return
    prev.current = trigger
    const colors = ['#FFCD00','#1B6EF3','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7']
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: Date.now()+i, x: Math.random()*100,
      color: colors[Math.floor(Math.random()*colors.length)],
      size: 6+Math.random()*8, duration: 1.2+Math.random()*0.8, delay: Math.random()*0.4,
    })))
    setTimeout(() => setParticles([]), 3000)
  }, [trigger])
  if (!particles.length) return null
  return (
    <div style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute',top:'-10px',left:`${p.x}%`,
          width:p.size,height:p.size*0.6,background:p.color,borderRadius:2,
          animation:`confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }}/>
      ))}
    </div>
  )
}

function CoinStack({ count, total }: { count:number; total:number }) {
  const maxCoins = 8
  const filled   = total > 0 ? Math.round((count / total) * maxCoins) : 0
  return (
    <div style={{ display:'flex', flexDirection:'column-reverse', alignItems:'center', gap:2, justifyContent:'flex-end', minWidth:36 }}>
      {Array.from({ length: maxCoins }, (_, i) => {
        const isGold = i < filled
        return (
          <div key={i} style={{
            width: 28, height: 14, borderRadius: '50%',
            background: isGold
              ? 'radial-gradient(ellipse at 35% 35%, #FFE566, #FFCD00 60%, #C8960C)'
              : 'rgba(0,0,0,0.10)',
            transition: `all 0.3s ease ${i * 0.06}s`,
            animation: isGold ? `coinPop 0.3s ease ${i * 0.06}s both` : 'none',
          }}/>
        )
      })}
      <div style={{ fontSize:font.size.sm, color:'#7BAAB5', fontWeight:font.weight.medium, marginTop:4 }}>
        {count}/{total}
      </div>
    </div>
  )
}

function CircleProgress({ pct }: { pct:number }) {
  const R = 48, C = 2*Math.PI*R
  return (
    <div style={{ position:'relative', width:116, height:116, flexShrink:0 }}>
      <svg width={116} height={116} viewBox="0 0 116 116" style={{ transform:'rotate(-90deg)' }}>
        <circle cx={58} cy={58} r={R} fill="none" stroke={'rgba(0,0,0,0.10)'} strokeWidth={14}/>
        <circle cx={58} cy={58} r={R} fill="none" stroke="#FFCD00" strokeWidth={14}
          strokeDasharray={C} strokeDashoffset={C-(pct/100)*C} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:font.size.xl, fontWeight:font.weight.bold, color:'#0D3349' }}>{pct}%</span>
      </div>
    </div>
  )
}

function AllDoneModal({ total, onReset, onClose }: { total:number; onReset:()=>void; onClose:()=>void }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:700 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'calc(100% - 48px)',maxWidth:300,
        background:'#ffffff',borderRadius:radius.lg,padding:`${spacing[6]}px ${spacing[5]}px`,
        zIndex:701,textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ fontSize:48,marginBottom:spacing[2] }}>🎉</div>
        <div style={{ fontSize:font.size.xl,fontWeight:font.weight.bold,color:'#29B6D0',marginBottom:spacing[2] }}>축하합니다!</div>
        <div style={{ fontSize:font.size.md,color:'#1565A0',lineHeight:1.6,marginBottom:spacing[5] }}>
          모든 리스트를 완료했습니다.<br/>
          <span style={{ fontWeight:font.weight.bold,color:'#FFCD00',fontSize:font.size.lg }}>{total}개</span>를 모두 달성했어요 🥳
        </div>
        <div style={{ display:'flex',gap:spacing[2] }}>
          <button onClick={onClose} style={{
            flex:1,height:48,borderRadius:radius.sm,border:`1px solid ${'rgba(0,131,143,0.15)'}`,
            background:'#ffffff',color:'#1565A0',fontSize:font.size.md,fontWeight:font.weight.medium,cursor:'pointer',
          }}>닫기</button>
          <button onClick={onReset} style={{
            flex:2,height:48,borderRadius:radius.sm,border:'none',
            background:'rgba(41,182,208,0.12)',color:'#29B6D0',fontSize:font.size.md,fontWeight:font.weight.bold,cursor:'pointer',
          }}>다시 시작하기</button>
        </div>
      </div>
    </>
  )
}

function DeleteModal({ onConfirm, onCancel }: { onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:600 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'calc(100% - 48px)',maxWidth:300,
        background:'#ffffff',borderRadius:radius.lg,padding:`${spacing[6]}px ${spacing[5]}px`,
        zIndex:601,textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <p style={{ fontSize:font.size.lg,fontWeight:font.weight.bold,color:'#0D3349',marginBottom:spacing[2] }}>버킷리스트를 삭제할까요?</p>
        <p style={{ fontSize:font.size.md,color:'#1565A0',lineHeight:1.6,marginBottom:spacing[5] }}>모든 체크 내용과 일정이 삭제됩니다.</p>
        <div style={{ display:'flex',gap:spacing[2] }}>
          <button onClick={onCancel} style={{ flex:1,height:48,borderRadius:radius.sm,border:`1px solid ${'rgba(0,131,143,0.15)'}`,background:'#ffffff',color:'#1565A0',fontSize:font.size.md,fontWeight:font.weight.medium,cursor:'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex:2,height:48,borderRadius:radius.sm,border:'none',background:colors.dangerLight,color:colors.danger,fontSize:font.size.md,fontWeight:font.weight.bold,cursor:'pointer' }}>삭제하기</button>
        </div>
      </div>
    </>
  )
}

export default function BucketCheckView({ state, trip, setState, items, dbItems, onAchievedChange, onEdit, onDelete, onShare, onLanding }: Props) {
  const navigate = useNavigate()
  const [filter, setFilter]           = useState<Filter>('all')
  const [showDelete, setShowDelete]   = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [sheetItem, setSheetItem]       = useState<{id:string;label:string}|null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<{ id: string; day?: number } | null>(null)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const prevAchieved = useRef(0)
  const logoTapCount = useRef(0)
  const logoTapTimer = useRef<any>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [footerWidth, setFooterWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const updateWidth = () => {
      if (pageRef.current) setFooterWidth(pageRef.current.getBoundingClientRect().width)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLogoTap = () => {
    const next = logoTapCount.current + 1
    logoTapCount.current = next
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current)
    if (next >= 5) { navigate('/admin'); logoTapCount.current = 0; return }
    logoTapTimer.current = setTimeout(() => {
      if (logoTapCount.current < 5) navigate('/')
      logoTapCount.current = 0
    }, 400)
  }

  const allItems     = [...items, ...state.customItems.map(c => ({ ...c, emoji:'📝', categoryId: c.categoryId ?? 'custom' }))]
  const checkedItems = allItems.filter(i => state.selected[i.id])
  const tripDays     = trip ? getTripDays(trip) : []

  const byDay = new Map<number, typeof checkedItems>()
  checkedItems.forEach(item => {
    ;(state.schedules[item.id] ?? []).forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(item)
    })
  })
  const sortedDays = Array.from(byDay.keys()).sort((a,b)=>a-b)

  const allRows: { id: string; day?: number }[] = []
  checkedItems.forEach(item => {
    const days = state.schedules[item.id] ?? []
    if (days.length === 0) allRows.push({ id: item.id })
    else days.forEach(d => allRows.push({ id: item.id, day: d }))
  })
  const total = allRows.length

  const [achieved, setAchieved] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })

  const getKey = (id: string, day?: number) => day !== undefined ? `${id}_${day}` : id

  const toggleAchieved = (id: string, day?: number) => {
    const key = getKey(id, day)
    const wasAchieved = !!achieved[key]
    const next = { ...achieved, [key]: !wasAchieved }
    if (!next[key]) delete next[key]
    setAchieved(next)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
    onAchievedChange?.(next)
    if (!wasAchieved) {
      const newCount = allRows.filter(r => !!next[getKey(r.id, r.day)]).length
      const isLast = newCount === total
      if (!isLast) setConfettiTrigger(t => t+1)
    }
  }

  const isItemFullyAchieved = (item: typeof checkedItems[0]) => {
    const days = state.schedules[item.id] ?? []
    if (days.length === 0) return !!achieved[item.id]
    return days.every(d => !!achieved[`${item.id}_${d}`])
  }
  const achievedCount = allRows.filter(r => !!achieved[getKey(r.id, r.day)]).length
  const pct = total > 0 ? Math.round((achievedCount/total)*100) : 0

  useEffect(() => {
    if (total > 0 && achievedCount === total && prevAchieved.current < total) {
      setTimeout(() => {
        setConfettiTrigger(t => t+1)
      }, 400)
    }
    prevAchieved.current = achievedCount
  }, [achievedCount, total])

  const isRowDone = (id: string, day?: number) => !!achieved[getKey(id, day)]

  const deleteItem = (id: string, day?: number) => {
    const newAchieved = { ...achieved }

    if (day !== undefined) {
      // 특정 날짜만 삭제
      const newSchedules = { ...state.schedules }
      const days = (newSchedules[id] ?? []).filter(d => d !== day)
      if (days.length === 0) {
        const newSelected = { ...state.selected }
        delete newSelected[id]
        delete newSchedules[id]
        const newCustomItems = state.customItems.filter(c => c.id !== id)
        const next = { ...state, selected: newSelected, schedules: newSchedules, customItems: newCustomItems }
        setState(next)
        try { localStorage.setItem('korea-receipt', JSON.stringify(next)) } catch {}
      } else {
        newSchedules[id] = days
        const next = { ...state, schedules: newSchedules }
        setState(next)
        try { localStorage.setItem('korea-receipt', JSON.stringify(next)) } catch {}
      }
      delete newAchieved[`${id}_${day}`]
    } else {
      // 날짜 미지정 아이템 전체 삭제
      const newSelected = { ...state.selected }
      delete newSelected[id]
      const newSchedules = { ...state.schedules }
      delete newSchedules[id]
      const newCustomItems = state.customItems.filter(c => c.id !== id)
      const next = { ...state, selected: newSelected, schedules: newSchedules, customItems: newCustomItems }
      setState(next)
      try { localStorage.setItem('korea-receipt', JSON.stringify(next)) } catch {}
      Object.keys(newAchieved).forEach(k => { if (k === id || k.startsWith(id + '_')) delete newAchieved[k] })
    }

    setAchieved(newAchieved)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(newAchieved)) } catch {}
    onAchievedChange?.(newAchieved)
  }
  const filterRow = (id: string, day?: number) =>
    filter==='done' ? isRowDone(id, day) : filter==='todo' ? !isRowDone(id, day) : true

  const FILTERS: { key:Filter; label:string }[] = [
    { key:'all', label:'전체' }, { key:'todo', label:'미완료' }, { key:'done', label:'완료' },
  ]

  const [detailBizId, setDetailBizId] = useState<string|null>(null)
  const [detailBiz, setDetailBiz] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [selProduct, setSelProduct] = useState<any|null>(null)

  const CheckRow = ({ item, day }: { item: typeof checkedItems[0]; day?: number }) => {
    const key = day !== undefined ? `${item.id}_${day}` : item.id
    const isAchieved = !!achieved[key]
    const db = dbItems.find(d => d.id === item.id)
    const regionKey = db?.address ? Object.keys(stateMap).find(k => db.address!.toUpperCase().includes(k)) : null
    const region = regionKey ? stateMap[regionKey] : null
    const hasDetail = !!(db?.description || db?.address || (db?.related_business_ids?.length ?? 0) > 0 || db?.tips)

    const openDetail = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!db) return
      if ((db.related_product_ids?.length ?? 0) > 0) {
        const cached = getCachedShopping()
        const prod = cached?.products.find(p => p.id === db.related_product_ids![0])
        if (prod) setSelProduct(prod)
        return
      }
      setDetailItem(db)
      if ((db.related_business_ids?.length ?? 0) > 0) {
        const cached = getCachedBusinesses()
        setDetailBizCards(cached?.filter(b => db.related_business_ids!.includes(b.id)) ?? [])
      } else setDetailBizCards([])
    }

    return (
      <div
        onClick={openDetail}
        style={{
          display:'flex', alignItems:'center', gap:spacing[3],
          padding:`${spacing[3]}px ${spacing[3]}px`,
          margin:`0 ${spacing[3]}px`,
          background: '#ffffff',
          borderRadius: radius.md,
          border: isAchieved ? `1px solid ${'#29B6D0'}` : `1px solid ${'rgba(0,131,143,0.15)'}`,
          cursor: db ? 'pointer' : 'default',
          transition:'all 0.15s',
        }}
      >
        {/* 이미지 — 체크리스트와 동일 */}
        <div style={{ width:56, height:56, borderRadius:radius.sm, flexShrink:0, background:'rgba(0,131,143,0.08)', border:`1px solid ${'rgba(0,131,143,0.15)'}`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {db?.image_url
            ? <img src={db.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <Icon icon={db?.icon ?? CAT_ICONS[(item as any).categoryId] ?? 'ph:star'} width={26} height={26} color={'#7BAAB5'} />
          }
        </div>

        {/* 텍스트 */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:font.size.md, fontWeight:font.weight.medium, color: isAchieved ? '#29B6D0' : colors.gray800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.label}
          </div>
          <div style={{ display:'flex', gap:spacing[1], alignItems:'center', marginTop:3, overflow:'hidden' }}>
            {db?.description && (
              <span style={{ fontSize:font.size.xs, color:'#7BAAB5', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, minWidth:0 }}>{db.description}</span>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:spacing[1], marginLeft:'auto', flexShrink:0 }}>
              {day === undefined && (
                <span
                  onClick={e => { e.stopPropagation(); setSheetItem({ id: item.id, label: item.label }) }}
                  style={{ fontSize:font.size.xs, color:colors.warning, fontWeight:font.weight.bold, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2, whiteSpace:'nowrap' }}
                >일정 지정</span>
              )}
              {region && <span style={{ fontSize:font.size.xs, color:colors.gray500, fontWeight:font.weight.medium, whiteSpace:'nowrap' }}>📍 {region.label}</span>}
            </div>
          </div>
        </div>

        {/* 완료 배지 + 휴지통 */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:spacing[1], flexShrink:0 }}>
          <div
            onClick={e => { e.stopPropagation(); toggleAchieved(item.id, day) }}
            style={{
              display:'flex', alignItems:'center', gap:3,
              padding:'4px 8px', borderRadius:radius.sm, cursor:'pointer',
              background: isAchieved ? '#29B6D0' : '#ffffff',
              border: `1px solid ${'#29B6D0'}`,
              transition:'all 0.15s', whiteSpace:'nowrap',
            }}
          >
            <span style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color: isAchieved ? '#fff' : '#29B6D0' }}>완료</span>
            <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke={isAchieved ? '#fff' : '#29B6D0'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setDeleteItemId({ id: item.id, day }) }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}
          >
            <Icon icon="ph:trash" width={15} height={15} color={'#7BAAB5'} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} style={{ minHeight:'100dvh', background:'transparent', fontFamily:font.family, maxWidth:430, margin:'0 auto', position:'relative' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes confettiFall {
          0%   { transform:translateY(0) rotate(0deg); opacity:1; }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes coinPop {
          0%   { transform:translateY(8px) scale(0.8); opacity:0; }
          60%  { transform:translateY(-3px) scale(1.1); opacity:1; }
          100% { transform:translateY(0) scale(1); opacity:1; }
        }
      `}</style>

      <Confetti trigger={confettiTrigger} />

      {/* ══ 상단 진행 카드 ══ */}
      <div style={{ padding:'16px 16px 0' }}>
        <div style={{ background:'#ffffff', borderRadius:16, padding:'14px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>내 버킷리스트</div>
            <div style={{ fontSize:13, color:'#1565A0' }}>
              <span style={{ fontSize:18, fontWeight:900, color:'#29B6D0' }}>{achievedCount}</span>
              <span style={{ color:'#7BAAB5' }}> / {total} 완료</span>
            </div>
          </div>
          <div style={{ height:6, borderRadius:3, background:'#E0F7FA', overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'#29B6D0', borderRadius:3, transition:'width 0.4s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <div style={{ fontSize:12, color:'#7BAAB5' }}>{
              pct === 0 ? '첫 번째 항목을 완료해봐요! 🙌' :
              pct < 25  ? '좋은 시작이에요! 계속 해봐요 💪' :
              pct < 50  ? '절반을 향해 달려가고 있어요! 🏃' :
              pct < 75  ? '절반을 넘었어요! 조금만 더! ⚡' :
              pct < 100 ? '거의 다 왔어요! 마지막 스퍼트! 🔥' :
                          '모든 항목을 완료했어요! 축하합니다 🎉'
            }</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={onEdit} style={{ height:26, paddingLeft:10, paddingRight:10, borderRadius:20, border:'none', background:'#29B6D0', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:3, cursor:'pointer', fontFamily:'inherit' }}>
                <Icon icon="ph:pencil-simple" width={11} height={11} color="#fff" />수정
              </button>
              <button onClick={() => setShowDelete(true)} style={{ height:26, paddingLeft:10, paddingRight:10, borderRadius:20, border:'1px solid rgba(220,38,38,0.3)', background:'rgba(220,38,38,0.08)', color:'#DC2626', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:3, cursor:'pointer', fontFamily:'inherit' }}>
                <Icon icon="ph:trash" width={11} height={11} color="#DC2626" />비우기
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ══ 포토카드 그리드 ══ */}
      <div style={{ padding:'12px 16px 80px' }}>
        {checkedItems.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <Icon icon="ph:list-checks" width={48} height={48} color="#B2EBF2" />
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:'#0D3349', marginBottom:6 }}>아직 담긴 항목이 없어요</div>
              <div style={{ fontSize:13, color:'#7BAAB5' }}>호주에서 꼭 해볼 것들을 담아보세요!</div>
            </div>
            <button onClick={onEdit} style={{ height:44, padding:'0 24px', background:'#29B6D0', color:'#fff', border:'none', borderRadius:50, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
              <Icon icon="ph:plus-circle" width={18} height={18} color="#fff" />
              리스트 추가하기
            </button>
          </div>
        ) : (
          <>
            {/* 날짜별 섹션 */}
            {sortedDays.map(dayIdx => {
              const dayItems = byDay.get(dayIdx) ?? []
              if (!dayItems.length) return null
              const date = tripDays[dayIdx]
              const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
              const dayDone = dayItems.filter(i => !!achieved[`${i.id}_${dayIdx}`]).length
              return (
                <div key={dayIdx} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#0D3349' }}>{dayIdx+1}일차</span>
                      <span style={{ fontSize:12, color:'#7BAAB5' }}>{dayLabel}</span>
                    </div>
                    <span style={{ fontSize:12, color:'#29B6D0', fontWeight:700 }}>{dayDone}/{dayItems.length}</span>
                  </div>
                  <PhotoCardGrid
                    items={dayItems}
                    dayIdx={dayIdx}
                    dbItems={dbItems}
                    achieved={achieved}
                    toggleAchieved={toggleAchieved}
                    setDetailItem={setDetailItem}
                  />
                </div>
              )
            })}
            {/* 날짜 미지정 섹션 */}
            {(() => {
              const items = checkedItems.filter(i => !(state.schedules[i.id]?.length))
              if (!items.length) return null
              const doneCount = items.filter(i => !!achieved[i.id]).length
              return (
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#7BAAB5' }}>날짜 미지정</span>
                    <span style={{ fontSize:12, color:'#7BAAB5', fontWeight:700 }}>{doneCount}/{items.length}</span>
                  </div>
                  <PhotoCardGrid
                    items={items}
                    dbItems={dbItems}
                    achieved={achieved}
                    toggleAchieved={toggleAchieved}
                    setDetailItem={setDetailItem}
                  />
                </div>
              )
            })()}
          </>
        )}
      </div>



      {/* ── ScheduleSheet ── */}
      {sheetItem && trip && (
        <ScheduleSheet
          itemLabel={sheetItem.label}
          trip={trip}
          currentDays={state.schedules[sheetItem.id] ?? []}
          onSelect={days => { setState(setSchedule(state, sheetItem.id, days)) }}
          onClose={() => setSheetItem(null)}
        />
      )}

      {/* ══ 더보기 모달 ══ */}
      {showMoreMenu && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)' }}
            onClick={() => setShowMoreMenu(false)} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398,
            background:'#ffffff', borderRadius:radius.xl,
            padding:`${spacing[4]}px ${spacing[3]}px ${spacing[8]}px`,
            zIndex:101, animation:'slideUpSheet 0.25s ease',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:'rgba(0,0,0,0.10)', margin:`0 auto ${spacing[4]}px` }} />
            <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:'#7BAAB5', marginBottom:spacing[3], letterSpacing:0.5 }}>더보기</div>
            <button onClick={() => { setShowMoreMenu(false); onShare() }} style={{
              width:'100%', height:52, borderRadius:radius.md,
              border:`1px solid ${'rgba(0,131,143,0.15)'}`, background:'#ffffff',
              color:'#29B6D0', fontSize:font.size.md, fontWeight:font.weight.bold,
              cursor:'pointer', display:'flex', alignItems:'center', gap:spacing[2],
              padding:`0 ${spacing[4]}px`, marginBottom:spacing[2], fontFamily:font.family,
            }}>
              <Icon icon="ph:share-network" width={18} height={18} color={'#29B6D0'} />공유하기
            </button>
            <button onClick={() => { setShowMoreMenu(false); setShowDelete(true) }} style={{
              width:'100%', height:52, borderRadius:radius.md,
              border:`1px solid ${colors.dangerLight}`, background:colors.dangerLight,
              color:colors.danger, fontSize:font.size.md, fontWeight:font.weight.bold,
              cursor:'pointer', display:'flex', alignItems:'center', gap:spacing[2],
              padding:`0 ${spacing[4]}px`, fontFamily:font.family,
            }}>
              <Icon icon="ph:trash" width={18} height={18} color={colors.danger} />리스트 삭제하기
            </button>
          </div>
        </>
      )}

      {/* ── 아이템 삭제 확인 팝업 */}
      {deleteItemId && (() => {
        const item = allItems.find(i => i.id === deleteItemId.id)
        return (
          <>
            <div onClick={() => setDeleteItemId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:700 }} />
            <div style={{
              position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              background:'#ffffff', borderRadius:radius.lg, padding:`${spacing[6]}px ${spacing[5]}px`,
              zIndex:701, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
              boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
            }}>
              <div style={{ fontSize:font.size.lg, fontWeight:font.weight.bold, color:'#0D3349', marginBottom:spacing[2] }}>항목을 삭제할까요?</div>
              {item && (
                <div style={{ fontSize:font.size.sm, color:'#1565A0', marginBottom:spacing[5], lineHeight:1.5 }}>
                  <span style={{ fontWeight:font.weight.bold, color:'#29B6D0' }}>{item.label}</span>을<br/>버킷리스트에서 삭제합니다.
                </div>
              )}
              <div style={{ display:'flex', gap:spacing[2] }}>
                <button onClick={() => setDeleteItemId(null)} style={{
                  flex:1, height:48, borderRadius:radius.sm, border:`1px solid ${'rgba(0,131,143,0.15)'}`,
                  background:'#ffffff', color:'#1565A0', fontSize:font.size.md, fontWeight:font.weight.medium, cursor:'pointer', fontFamily:font.family,
                }}>취소</button>
                <button onClick={() => { deleteItem(deleteItemId.id, deleteItemId.day); setDeleteItemId(null) }} style={{
                  flex:2, height:48, borderRadius:radius.sm, border:'none',
                  background:colors.dangerLight, color:colors.danger, fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:font.family,
                }}>삭제하기</button>
              </div>
            </div>
          </>
        )
      })()}

      {showDelete && (
        <DeleteModal onConfirm={() => { setShowDelete(false); onDelete() }} onCancel={() => setShowDelete(false)} />
      )}
      {/* ── 쇼핑 상품 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#ffffff',
            borderRadius:radius.xl, zIndex:601,
            animation:'slideUpSheet 0.25s ease', maxHeight:'85vh', overflowY:'auto',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:'rgba(0,0,0,0.10)', margin:`${spacing[3]}px auto 0` }} />
            <div style={{ width:'100%', height:200, overflow:'hidden', background:'rgba(41,182,208,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={56} height={56} color={'#29B6D0'} />
              }
            </div>
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[8]}px` }}>
              <div style={{ display:'flex', gap:spacing[1], flexWrap:'wrap', marginBottom:spacing[3], alignItems:'center' }}>
                {(selProduct.tags ?? []).map((tag: string) => (
                  <span key={tag} style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, padding:`2px ${spacing[2]}px`, borderRadius:radius.sm, background:TAG_COLOR[tag]?.bg??'rgba(41,182,208,0.12)', color:TAG_COLOR[tag]?.color??'#29B6D0' }}>{tag}</span>
                ))}
                {selProduct.price_range && (
                  <span style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, padding:`2px ${spacing[2]}px`, borderRadius:radius.sm, background:'rgba(41,182,208,0.12)', color:PRICE_COLOR[selProduct.price_range]??'#29B6D0', border:`1px solid ${'rgba(0,131,143,0.15)'}`, marginLeft:'auto' }}>{selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}</span>
                )}
              </div>
              <div style={{ ...T.h2, marginBottom:spacing[1] }}>{selProduct.name}</div>
              {selProduct.brand && <div style={{ ...T.sm, marginBottom:spacing[3] }}>{selProduct.brand}</div>}
              {selProduct.description && <div style={{ fontSize:font.size.sm, color:'#1565A0', lineHeight:1.7, marginBottom:spacing[4] }}>{selProduct.description}</div>}
              {(selProduct.where_to_buy ?? []).length > 0 && (
                <div style={{ marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:'#1565A0', marginBottom:spacing[2] }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:spacing[1], flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map((store: string) => (
                      <span key={store} style={{ fontSize:font.size.sm, padding:`4px ${spacing[2]}px`, borderRadius:radius.sm, background:'rgba(41,182,208,0.12)', color:'#29B6D0', border:`1px solid ${'rgba(0,131,143,0.15)'}` }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelProduct(null)} style={{ width:'100%', height:48, borderRadius:radius.md, border:`1px solid ${'rgba(0,131,143,0.15)'}`, background:'#ffffff', color:'#1565A0', fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:font.family }}>닫기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 버킷리스트 상세 팝업 */}
      {detailItem && (
        <div onClick={() => setDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', fontFamily:font.family }}>
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#ffffff',
            borderRadius:radius.xl, maxHeight:'85vh', overflowY:'auto',
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ width:36, height:4, borderRadius:radius.full, background:'rgba(0,0,0,0.10)', margin:`${spacing[3]}px auto 0` }} />
            {detailItem.image_url && (
              <div style={{ width:'100%', height:220, overflow:'hidden', marginTop:spacing[2] }}>
                <img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px ${spacing[8]}px` }}>
              <div style={{ ...T.h2, lineHeight:1.4, marginBottom:spacing[3] }}>{detailItem.label}</div>
              {detailItem.description && <div style={{ fontSize:font.size.md, color:'#475569', lineHeight:1.7, marginBottom:spacing[4], whiteSpace:'pre-wrap' }}>{detailItem.description}</div>}
              {detailItem.tips && (
                <div style={{ background:'rgba(41,182,208,0.12)', border:`1px solid ${'rgba(0,131,143,0.15)'}`, borderRadius:radius.md, padding:spacing[3], marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:'#29B6D0', marginBottom:spacing[1] }}>💡 현지인 팁</div>
                  <div style={{ fontSize:font.size.sm, color:'#475569', lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {detailItem.address && (
                <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')} style={{ display:'flex', alignItems:'center', gap:spacing[2], width:'100%', background:'rgba(41,182,208,0.12)', border:`1px solid ${'rgba(0,131,143,0.15)'}`, borderRadius:radius.md, padding:spacing[3], marginBottom:spacing[4], cursor:'pointer', textAlign:'left' }}>
                  <Icon icon="ph:map-pin" width={16} height={16} color={'#29B6D0'} />
                  <div>
                    <div style={{ fontSize:font.size.xs, color:'#7BAAB5' }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:font.size.sm, color:'#29B6D0', fontWeight:font.weight.bold, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={13} height={13} color={'#7BAAB5'} style={{ marginLeft:'auto' }} />
                </button>
              )}
              {detailBizCards.length > 0 && (
                <div style={{ marginBottom:spacing[4] }}>
                  <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:'#1565A0', marginBottom:spacing[2] }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>
                    {detailBizCards.map(biz => <BusinessCard key={biz.id} business={biz} />)}
                  </div>
                </div>
              )}
              <button onClick={() => setDetailItem(null)} style={{ width:'100%', height:48, borderRadius:radius.md, border:`1px solid ${'rgba(0,131,143,0.15)'}`, background:'#ffffff', color:'#1565A0', fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:font.family }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 관련업체 팝업 */}
      {detailBizId && (
        <div style={{ position:'fixed', inset:0, zIndex:800 }}>
          <div onClick={() => { setDetailBizId(null); setDetailBiz(null) }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, zIndex:801,
            maxHeight:'85vh', overflowY:'auto', borderRadius:radius.xl,
            background:'#ffffff', padding:`${spacing[3]}px ${spacing[3]}px ${spacing[6]}px`,
            boxSizing:'border-box', animation:'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:spacing[2] }}>
              <button onClick={() => { setDetailBizId(null); setDetailBiz(null) }}
                style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#7BAAB5' }}>✕</button>
            </div>
            {detailBiz
              ? <BusinessCard business={detailBiz} />
              : <div style={{ textAlign:'center', padding:spacing[6], color:'#7BAAB5', fontSize:font.size.md }}>불러오는 중...</div>
            }
          </div>
        </div>
      )}

      {/* 저장 확인 팝업 */}
      {showSaveConfirm && (
        <AlertModal
          title="저장하기"
          message="현재 달성 현황을 저장할까요? 나중에 언제든지 다시 저장할 수 있어요."
          confirmLabel="저장하기"
          onConfirm={() => {
            setShowSaveConfirm(false)
          }}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}
    </div>
  )
}
