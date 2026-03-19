import { useState, useEffect, useRef } from 'react'
import { CheckItem, ITEM_ICONS } from '../data/checklist'
import { supabase } from '../lib/supabase'

type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null }
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
  onServices:  () => void
  onShopping:  () => void
  onBingo:     () => void
  onCommunity: () => void
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

export default function BucketCheckView({ state, trip, setState, items, dbItems, onAchievedChange, onEdit, onDelete, onShare, onServices, onShopping, onBingo, onCommunity, onLanding }: Props) {
  const navigate = useNavigate()
  const [filter, setFilter]           = useState<Filter>('all')
  const [showDelete, setShowDelete]   = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAllDone, setShowAllDone] = useState(false)
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
  const filterRow = (id: string, day?: number) =>
    filter==='done' ? isRowDone(id, day) : filter==='todo' ? !isRowDone(id, day) : true

  const FILTERS: { key:Filter; label:string }[] = [
    { key:'all', label:'전체' }, { key:'todo', label:'미완료' }, { key:'done', label:'완료' },
  ]

  const [detailBizId, setDetailBizId] = useState<string|null>(null)
  const [detailBiz, setDetailBiz] = useState<any>(null)

  const CheckRow = ({ item, day }: { item: typeof checkedItems[0]; day?: number }) => {
    const key = day !== undefined ? `${item.id}_${day}` : item.id
    const isAchieved = !!achieved[key]
    return (
      <div style={{
        display:'flex',alignItems:'flex-start',gap:12,
        padding:'12px 16px',margin:'0 16px',borderRadius:12,
        background: isAchieved ? '#fff8e4' : '#fff',
        border:'1px solid #C8C8C8',
        borderLeft: isAchieved ? '4px solid #16A34A' : '4px solid #C8C8C8',
        minHeight:52,transition:'all 0.15s ease',
      }}>
        <div onClick={() => toggleAchieved(item.id, day)} style={{
          width:22,height:22,borderRadius:4,flexShrink:0,
          border: isAchieved ? 'none' : '1px solid #C8C8C8',
          background: isAchieved ? '#16A34A' : '#fff',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',
          cursor:'pointer',
        }}>
          {isAchieved && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <ItemIcon itemId={item.id} categoryId={(item as any).categoryId ?? 'custom'} color={isAchieved ? '#78716C' : '#94A3B8'} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, minWidth:0 }}>
          <span style={{ fontSize:15,lineHeight:1.4,fontWeight:isAchieved?600:400,color:'#1E293B', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.label}</span>
          {(() => {
            const db = dbItems.find(d => d.id === item.id)
            return (
              <>
                {db?.address && (
                  <span onClick={e => { e.stopPropagation(); window.open(`https://maps.google.com/?q=${encodeURIComponent(db.address!)}`, '_blank') }}
                    style={{ fontSize:11, color:'#1B6EF3', fontWeight:500, cursor:'pointer', textDecoration:'underline', textDecorationColor:'rgba(27,110,243,0.3)' }}>
                    📍 {db.address}
                  </span>
                )}
                {db?.description && (
                  <span style={{ fontSize:11, color:'#94A3B8', fontWeight:400, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:1.5 }}>
                    {db.description}
                  </span>
                )}
                {((db?.related_business_ids?.length ?? 0) > 0 || db?.related_business_id) && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
                    {(db?.related_business_ids?.length ? db.related_business_ids : db?.related_business_id ? [db.related_business_id] : []).map(bizId => (
                      <button key={bizId}
                        onClick={async e => {
                          e.stopPropagation()
                          setDetailBizId(bizId)
                          const { data } = await supabase.from('businesses').select('*').eq('id', bizId).single()
                          if (data) setDetailBiz(data)
                        }}
                        style={{
                          display:'flex', alignItems:'center', gap:3,
                          fontSize:10, fontWeight:700, color:'#1B6EF3',
                          background:'rgba(27,110,243,0.08)', border:'none',
                          borderRadius:4, padding:'2px 7px', cursor:'pointer',
                        }}>
                        <Icon icon="ph:buildings" width={11} height={11} color="#1B6EF3" />
                        관련업체
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
        <span style={{
          fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:4, flexShrink:0,
          color: isAchieved ? '#44403C' : '#fff',
          background: isAchieved ? 'rgba(68,64,60,0.10)' : '#fff',
        }}>완료 ✓</span>
      </div>
    )
  }

  return (
    <div ref={pageRef} style={{ minHeight:'100vh', background:'#e8e8e8', fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes slideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes confettiFall {
          0%   { transform:translateY(0) rotate(0deg); opacity:1; }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes coinPop {
          0%   { transform:translateY(8px) scale(0.8); opacity:0; }
          60%  { transform:translateY(-3px) scale(1.1); opacity:1; }
          100% { transform:translateY(0) scale(1); opacity:1; }
        }
        .neu-tab {
          background: #e8e8e8;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          transition: all 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff;
          border-radius: 10px;
        }
        .neu-tab.active {
          box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff;
        }
        .neu-tab:active {
          box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff;
        }
      `}</style>

      <Confetti trigger={confettiTrigger} />

      {/* ══ 헤더 + 탭 ══ */}
      <div style={{ background:'#e8e8e8', paddingBottom:8 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 12px' }}>
          <span onClick={handleLogoTap}
            style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}
          >HOJUGAJA</span>
          <span style={{ fontSize:13,color:'#64748B',fontWeight:600 }}>{achievedCount}/{total}</span>
        </div>
        <div style={{ display:'flex', padding:'0 10px', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
          {([
            { id:'bucketlist', icon:'ph:check-circle', label:'버킷리스트', action: () => {} },
			{ id:'shopping',   icon:'ph:shopping-bag', label:'쇼핑리스트', action: onShopping },
			{ id:'bingo',      icon:'ph:coffee',       label:'카페빙고게임', action: onBingo },
			{ id:'community',  icon:'ph:chats-circle', label:'채팅방', action: onCommunity },
			{ id:'services',   icon:'ph:buildings',    label:'업체리스트', action: onServices },
          ]).map(tab => {
            const active = tab.id === 'bucketlist'
            return (
              <button key={tab.id} onClick={tab.action}
                className={`neu-tab${active ? ' active' : ''}`}
                style={{ flex:1, minWidth:0, height:52 }}>
                <Icon icon={tab.icon} width={16} height={16} color={active ? '#1B6EF3' : '#94A3B8'} />
                <span style={{ fontSize:9, fontWeight: active ? 700 : 500, color: active ? '#1B6EF3' : '#94A3B8', whiteSpace:'nowrap' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

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
        <button onClick={onLanding} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#1B6EF3',
          fontSize:15, fontWeight:700, cursor:'pointer',
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
            <button onClick={() => { setShowMoreMenu(false); onEdit() }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#64748B',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px', marginBottom:10,
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:pencil-simple" width={18} height={18} color="#64748B" />수정하기
            </button>
            <button onClick={() => { setShowMoreMenu(false); setShowDelete(true) }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#DC2626',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px',
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:trash" width={18} height={18} color="#DC2626" />삭제하기
            </button>
          </div>
        </div>
      )}

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