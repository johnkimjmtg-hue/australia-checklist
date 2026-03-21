import { useState, useEffect, useRef } from 'react'
import { CheckItem, ITEM_ICONS } from '../data/checklist'
import { supabase } from '../lib/supabase'

type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null; image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null }
import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'

type Filter = 'all' | 'done' | 'todo'
type Props = {
  state:      AppState
  trip:       TripInfo
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
              : '#C8C8C8',
            transition: `all 0.3s ease ${i * 0.06}s`,
            animation: isGold ? `coinPop 0.3s ease ${i * 0.06}s both` : 'none',
          }}/>
        )
      })}
      <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginTop:4 }}>
        {count}/{total}
      </div>
    </div>
  )
}

function CircleProgress({ pct }: { pct:number }) {
  const R = 44, C = 2*Math.PI*R
  return (
    <div style={{ position:'relative',width:100,height:100,flexShrink:0 }}>
      <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={R} fill="none" stroke="#a8b498" strokeWidth={10}/>
        <circle cx={50} cy={50} r={R} fill="none" stroke="#FFCD00" strokeWidth={10}
          strokeDasharray={C} strokeDashoffset={C-(pct/100)*C} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <span style={{ fontSize:15,fontWeight:800,color:'#2d3e1f' }}>{pct}%</span>
      </div>
    </div>
  )
}

function AllDoneModal({ total, onReset, onClose }: { total:number; onReset:()=>void; onClose:()=>void }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:700 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'calc(100% - 40px)',maxWidth:320,
        background:'#e8e8e8',borderRadius:20,padding:'32px 24px 24px',
        zIndex:701,textAlign:'center',
      }}>
        <div style={{ fontSize:52,marginBottom:8 }}>🎉</div>
        <div style={{ fontSize:22,fontWeight:800,color:'#1B6EF3',marginBottom:8 }}>축하합니다!</div>
        <div style={{ fontSize:15,color:'#64748B',lineHeight:1.6,marginBottom:24 }}>
          모든 리스트를 완료했습니다.<br/>
          <span style={{ fontWeight:700,color:'#FFCD00',fontSize:17 }}>{total}개</span>를 모두 달성했어요 🥳
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={onClose} style={{
            flex:1,height:48,borderRadius:8,border:'1px solid #C8C8C8',
            background:'#e8e8e8',color:'#64748B',fontSize:14,fontWeight:600,cursor:'pointer',
            boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          }}>닫기</button>
          <button onClick={onReset} style={{
            flex:2,height:48,borderRadius:8,border:'none',
            background:'#e8e8e8',color:'#1B6EF3',fontSize:14,fontWeight:700,cursor:'pointer',
            boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          }}>다시 시작하기</button>
        </div>
      </div>
    </>
  )
}

function DeleteModal({ onConfirm, onCancel }: { onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:600 }}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'calc(100% - 48px)',maxWidth:300,
        background:'#e8e8e8',borderRadius:16,padding:'28px 20px 20px',
        zIndex:601,textAlign:'center',
      }}>
        <p style={{ fontSize:17,fontWeight:700,color:'#1E293B',marginBottom:8 }}>버킷리스트를 삭제할까요?</p>
        <p style={{ fontSize:14,color:'#64748B',lineHeight:1.6,marginBottom:24 }}>모든 체크 내용과 일정이 삭제됩니다.</p>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={onCancel} style={{ flex:1,height:48,borderRadius:6,border:'1px solid #C8C8C8',background:'#e8e8e8',color:'#64748B',fontSize:15,fontWeight:600,cursor:'pointer',boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>취소</button>
          <button onClick={onConfirm} style={{ flex:2,height:48,borderRadius:6,border:'none',background:'#e8e8e8',color:'#DC2626',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>삭제하기</button>
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
  const [showAllDone, setShowAllDone] = useState(false)
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
  const tripDays     = getTripDays(trip)

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
        setShowAllDone(true)
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
    return (
      <div style={{
        display:'flex', alignItems:'stretch',
        margin:'0 16px', borderRadius:12,
        background: isAchieved ? '#fff8e4' : '#fff',
        border:'1px solid #C8C8C8',
        borderLeft: isAchieved ? '4px solid #16A34A' : '4px solid #CBD5E1',
        transition:'all 0.3s', overflow:'hidden',
      }}>
        {/* 왼쪽 - 이미지 꽉 채우기 */}
        <div onClick={async e => {
          e.stopPropagation()
          if (!db) return
          if ((db.related_product_ids?.length ?? 0) > 0) {
            const { data } = await supabase.from('shopping_products').select('*').eq('id', db.related_product_ids![0]).single()
            if (data) setSelProduct(data)
            return
          }
          setDetailItem(db)
          if ((db.related_business_ids?.length ?? 0) > 0) {
            const { data } = await supabase.from('businesses').select('*').in('id', db.related_business_ids!)
            setDetailBizCards(data ?? [])
          } else setDetailBizCards([])
        }} style={{
          width:80, flexShrink:0, cursor: db ? 'pointer' : 'default',
          background:'#f0f0f0', overflow:'hidden',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {db?.image_url
            ? <img src={db.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <Icon icon={db?.icon ?? CAT_ICONS[(item as any).categoryId] ?? 'ph:star'} width={28} height={28} color={isAchieved ? '#78716C' : '#CBD5E1'} />
          }
        </div>

        {/* 가운데 - 제목 + 설명 + 뱃지 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3, minWidth:0, justifyContent:'center', padding:'10px 8px 10px 12px' }}>
          <span style={{
            fontSize:14, fontWeight: isAchieved ? 700 : 500,
            color: isAchieved ? '#0F172A' : '#475569',
            lineHeight:1.4,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>{item.label}</span>
          {db?.description && (
            <span style={{
              fontSize:11, color:'#94A3B8', fontWeight:400, lineHeight:1.5,
              overflow:'hidden', textOverflow:'ellipsis',
              display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical',
            }}>{db.description}</span>
          )}

          {hasDetail && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
              <button
                onClick={async e => {
                  e.stopPropagation()
                  if (!db) return
                  if ((db.related_product_ids?.length ?? 0) > 0) {
                    const { data } = await supabase.from('shopping_products').select('*').eq('id', db.related_product_ids![0]).single()
                    if (data) setSelProduct(data)
                    return
                  }
                  setDetailItem(db)
                  if ((db.related_business_ids?.length ?? 0) > 0) {
                    const { data } = await supabase.from('businesses').select('*').in('id', db.related_business_ids!)
                    setDetailBizCards(data ?? [])
                  } else setDetailBizCards([])
                }}
                style={{
                  fontSize:11, fontWeight:600, color:'#64748B',
                  background:'none', border:'none',
                  cursor:'pointer', padding:0, flexShrink:0,
                }}>
                자세히 알아보기 ›
              </button>
              {region ? (
                <span style={{
                  fontSize:11, fontWeight:600, color:'#64748B',
                  display:'flex', alignItems:'center', gap:3,
                }}>
                  <Icon icon="ph:map-pin-fill" width={11} height={11} color="#EF4444" />
                  {region.label}
                </span>
              ) : <span />}
            </div>
          )}
        </div>

        {/* 오른쪽 - 완료 배지 + 삭제 */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:6, padding:'10px 12px 10px 0' }}>
          {/* 완료 배지 */}
          <div onClick={() => toggleAchieved(item.id, day)} style={{
            display:'flex', alignItems:'center', gap:3,
            padding:'4px 8px', borderRadius:6, cursor:'pointer',
            background: isAchieved ? '#16A34A' : '#f0f0f0',
            border: `1px solid ${isAchieved ? '#16A34A' : '#16A34A'}`,
            transition:'all 0.2s', whiteSpace:'nowrap',
          }}>
            <span style={{ fontSize:10, fontWeight:700, color: isAchieved ? '#fff' : '#16A34A' }}>완료</span>
            <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke={isAchieved ? '#fff' : '#16A34A'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* 삭제 */}
          <button onClick={() => setDeleteItemId({ id: item.id, day })} style={{
            background:'none', border:'none', cursor:'pointer', padding:2,
            display:'flex', alignItems:'center',
          }}>
            <Icon icon="ph:trash" width={18} height={18} color="#94A3B8" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} style={{ minHeight:'100vh', background:'#e8e8e8', fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes slideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
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

      {/* ══ 진행 카드 ══ */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'#e8e8e8', padding:'16px 16px 0' }}>
        <div style={{
          background:'#c8d4b8',
          borderRadius:12,
          boxShadow:'inset 3px 3px 8px #a8b498, inset -2px -2px 6px #e8f4d8',
          padding:'20px', display:'flex', alignItems:'center', gap:20,
        }}>
          <CircleProgress pct={pct} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20,fontWeight:800,color:'#2d3e1f',marginBottom:4,lineHeight:1.2 }}>호주 버킷리스트</div>
            <div style={{ fontSize:12,color:'#4a5e32',fontWeight:600,marginBottom:6 }}>
              {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
            </div>
            <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:4 }}>
              <span style={{ fontSize:28,fontWeight:800,color:'#2d3e1f',lineHeight:1 }}>{achievedCount}</span>
              <span style={{ fontSize:17,fontWeight:600,color:'#4a5e32' }}>/{total}건 완료</span>
            </div>
            <div style={{ fontSize:13,color:'#4a5e32',lineHeight:1.5 }}>나만의 버킷리스트 꼭 완료하세요.</div>
          </div>
          <CoinStack count={achievedCount} total={total} />
        </div>
      </div>

      {/* ══ 필터 ══ */}
      <div style={{ padding:'14px 16px 0',display:'flex',alignItems:'center',gap:8 }}>
        <span style={{ fontSize:12,color:'#94A3B8',fontWeight:600,flexShrink:0 }}>필터</span>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            height:30, padding:'0 14px', borderRadius:6,
            border:'none',
            background:'#e8e8e8',
            color: filter===f.key ? '#1B6EF3' : '#94A3B8',
            fontSize:13, fontWeight: filter===f.key ? 700 : 500, cursor:'pointer',
            boxShadow: filter===f.key
              ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
              : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            WebkitTapHighlightColor:'transparent',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ══ 리스트 ══ */}
      <div style={{ padding:'12px 0 130px',display:'flex',flexDirection:'column',gap:16 }}>
        {sortedDays.map(dayIdx => {
          const dayItems = (byDay.get(dayIdx) ?? []).filter(item => filterRow(item.id, dayIdx))
          if (!dayItems.length) return null
          const date     = tripDays[dayIdx]
          const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
          const dayDone  = dayItems.filter(i => !!achieved[`${i.id}_${dayIdx}`]).length
          return (
            <div key={dayIdx}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px 8px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:'#1E293B' }}>{dayIdx+1}일차</span>
                  <span style={{ fontSize:12,color:'#64748B' }}>{dayLabel}</span>
                </div>
                <span style={{ fontSize:12,color:'#1B6EF3',fontWeight:600 }}>{dayDone}/{dayItems.length}</span>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {dayItems.map(item => <CheckRow key={`${item.id}_${dayIdx}`} item={item} day={dayIdx}/>)}
              </div>
            </div>
          )
        })}
        {(() => {
          const items = checkedItems.filter(i => !(state.schedules[i.id]?.length)).filter(i => filterRow(i.id))
          if (!items.length) return null
          const doneCount = items.filter(i => !!achieved[i.id]).length
          return (
            <div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px 8px' }}>
                <span style={{ fontSize:14,fontWeight:700,color:'#94A3B8' }}>날짜 미지정</span>
                <span style={{ fontSize:12,color:'#64748B',fontWeight:600 }}>{doneCount}/{items.length}</span>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {items.map(item => <CheckRow key={item.id} item={item}/>)}
              </div>
            </div>
          )
        })()}
        {sortedDays.length===0 && checkedItems.filter(i => !(state.schedules[i.id]?.length)).length===0 && (
          <div style={{ textAlign:'center',padding:'60px 20px',color:'#94A3B8',fontSize:14 }}>아직 담긴 항목이 없어요</div>
        )}
      </div>

      {/* ══ 하단 버튼 ══ */}
      <div style={{
        position:'fixed', bottom:0,
        left:'50%', transform:'translateX(-50%)',
        width: footerWidth ?? '100%',
        padding:'12px 14px 20px',
        background:'#e8e8e8',
        zIndex:20, boxSizing:'border-box',
        display:'flex', gap:8,
        borderTop:'1px solid #C8C8C8',
      }}>
        <button onClick={onEdit} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#64748B',
          fontSize:14, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:pencil-simple" width={18} height={18} color="#64748B" />
          리스트 수정하기
        </button>
        <button onClick={onLanding} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#1B6EF3',
          fontSize:14, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:check-circle" width={18} height={18} color="#1B6EF3" />
          저장하고 나가기
        </button>
        <button onClick={() => setShowMoreMenu(true)} style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          border:'none', background:'#e8e8e8',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:dots-three-vertical" width={20} height={20} color="#64748B" />
        </button>
      </div>

      {/* ══ 더보기 모달 ══ */}
      {showMoreMenu && (
        <div style={{
          position:'fixed', inset:0, zIndex:100,
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)',
          display:'flex', alignItems:'flex-end', justifyContent:'center',
        }} onClick={() => setShowMoreMenu(false)}>
          <div style={{
            width:'100%', maxWidth:390,
            background:'#e8e8e8', borderRadius:'20px 20px 0 0',
            padding:'20px 16px 36px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'0 auto 20px' }} />
            <div style={{ fontSize:13, fontWeight:800, color:'#94A3B8', marginBottom:14, letterSpacing:0.5 }}>더보기</div>
            <button onClick={() => { setShowMoreMenu(false); onShare() }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#1B6EF3',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px', marginBottom:10,
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:share-network" width={18} height={18} color="#1B6EF3" />공유하기
            </button>
            <button onClick={() => { setShowMoreMenu(false); setShowDelete(true) }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#DC2626',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px',
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:trash" width={18} height={18} color="#DC2626" />리스트 삭제하기
            </button>
          </div>
        </div>
      )}

      {/* ── 아이템 삭제 확인 팝업 */}
      {deleteItemId && (() => {
        const item = allItems.find(i => i.id === deleteItemId.id)
        return (
          <>
            <div onClick={() => setDeleteItemId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:700 }} />
            <div style={{
              position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              background:'#e8e8e8', borderRadius:20, padding:'28px 24px 20px',
              zIndex:701, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
              boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
            }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:8 }}>항목을 삭제할까요?</div>
              {item && (
                <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.5 }}>
                  <span style={{ fontWeight:700, color:'#1B6EF3' }}>{item.label}</span>을<br/>버킷리스트에서 삭제합니다.
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setDeleteItemId(null)} style={{
                  flex:1, height:48, borderRadius:10, border:'none',
                  background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:600, cursor:'pointer',
                  boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                }}>취소</button>
                <button onClick={() => { deleteItem(deleteItemId.id, deleteItemId.day); setDeleteItemId(null) }} style={{
                  flex:2, height:48, borderRadius:10, border:'none',
                  background:'#e8e8e8', color:'#DC2626', fontSize:14, fontWeight:700, cursor:'pointer',
                  boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                }}>삭제하기</button>
              </div>
            </div>
          </>
        )
      })()}

      {showDelete && (
        <DeleteModal
          onConfirm={() => { setShowDelete(false); onDelete() }}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showAllDone && (
        <AllDoneModal
          total={total}
          onReset={() => { setShowAllDone(false); onDelete() }}
          onClose={() => setShowAllDone(false)}
        />
      )}

      {/* ── 쇼핑 상품 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600 }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, background:'#e8e8e8',
            borderRadius:'20px 20px 0 0', zIndex:601,
            animation:'slideUpSheet 0.25s ease', maxHeight:'85vh', overflowY:'auto',
          }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{
              width:'100%', height:220,
              background: selProduct.image_url ? 'none' : 'linear-gradient(135deg, #e0e0e0, #d0d0d0)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
            }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={60} height={60} color="#94A3B8" />
              }
            </div>
            <div style={{ padding:'16px 18px 40px' }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                {(selProduct.tags ?? []).map((tag: string) => (
                  <span key={tag} style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background: TAG_COLOR[tag]?.bg ?? '#e8e8e8',
                    color: TAG_COLOR[tag]?.color ?? '#475569',
                  }}>{tag}</span>
                ))}
                {selProduct.price_range && (
                  <span style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background:'#e8e8e8', color: PRICE_COLOR[selProduct.price_range] ?? '#475569',
                    border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? '#C8C8C8'}`,
                    marginLeft:'auto',
                  }}>{selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}</span>
                )}
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selProduct.name}</div>
              {selProduct.brand && <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{selProduct.brand}</div>}
              {selProduct.description && (
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>{selProduct.description}</div>
              )}
              {(selProduct.where_to_buy ?? []).length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map((store: string) => (
                      <span key={store} style={{
                        fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8,
                        background:'#e8e8e8', color:'#475569', border:'1px solid #C8C8C8',
                      }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:50, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#1B6EF3', fontSize:15, fontWeight:700, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>확인</button>
            </div>
          </div>
        </>
      )}

      {/* ── 버킷리스트 상세 팝업 */}
      {detailItem && (
        <div onClick={() => setDetailItem(null)} style={{
          position:'fixed', inset:0, zIndex:600,
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
          fontFamily:"'Pretendard','Noto Sans KR',sans-serif",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390,
            background:'#e8e8e8', borderRadius:'20px 20px 0 0',
            maxHeight:'85vh', overflowY:'auto',
            animation:'slideUpSheet 0.25s ease',
          }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            {detailItem.image_url && (
              <div style={{ width:'100%', height:220, overflow:'hidden', marginTop:8 }}>
                <img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <div style={{ padding:'16px 18px 40px' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', lineHeight:1.4, marginBottom:12 }}>
                {detailItem.label}
              </div>
              {detailItem.description && (
                <div style={{ fontSize:14, color:'#475569', lineHeight:1.7, marginBottom:16, whiteSpace:'pre-wrap' }}>
                  {detailItem.description}
                </div>
              )}
              {detailItem.tips && (
                <div style={{
                  background:'#fff', border:'1px solid #C8C8C8', borderRadius:12,
                  padding:'12px 14px', marginBottom:16,
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>💡 현지인 팁</div>
                  <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {detailItem.address && (
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')}
                  style={{
                    display:'flex', alignItems:'center', gap:8, width:'100%',
                    background:'#fff', border:'1px solid #C8C8C8', borderRadius:12,
                    padding:'12px 14px', marginBottom:16, cursor:'pointer', textAlign:'left',
                  }}>
                  <Icon icon="ph:map-pin" width={18} height={18} color="#1B6EF3" />
                  <div>
                    <div style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:13, color:'#1B6EF3', fontWeight:600, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={14} height={14} color="#94A3B8" style={{ marginLeft:'auto' }} />
                </button>
              )}
              {detailBizCards.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:8 }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {detailBizCards.map(biz => (
                      <BusinessCard key={biz.id} business={biz} />
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setDetailItem(null)} style={{
                width:'100%', height:48, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:700,
                cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 관련업체 팝업 */}
      {detailBizId && (
        <div style={{ position:'fixed', inset:0, zIndex:800 }}>
          <div onClick={() => { setDetailBizId(null); setDetailBiz(null) }}
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, zIndex:801,
            maxHeight:'85vh', overflowY:'auto',
            borderRadius:'20px 20px 0 0',
            background:'#e8e8e8',
            padding:'12px 12px 32px',
            boxSizing:'border-box',
            animation:'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <button onClick={() => { setDetailBizId(null); setDetailBiz(null) }}
                style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94A3B8' }}>✕</button>
            </div>
            {detailBiz
              ? <BusinessCard business={detailBiz} />
              : <div style={{ textAlign:'center', padding:24, color:'#94A3B8', fontSize:14 }}>불러오는 중...</div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
