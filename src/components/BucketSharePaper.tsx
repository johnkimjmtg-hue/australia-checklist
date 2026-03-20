import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { Icon } from '@iconify/react'

type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null; image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null }
type Props = { state: AppState; trip: TripInfo; achieved: Record<string,boolean>; dbItems?: DBItem[] }

/* 아이템별 단색 아이콘 — BucketCheckView와 동일 */
const ITEM_ICONS: Record<string, string> = {
  h01:'ph:tooth',h02:'ph:tooth',h03:'ph:sparkle',h04:'ph:syringe',h05:'ph:drop',
  h06:'ph:eye',h07:'ph:eyeglasses',h08:'ph:heartbeat',h09:'ph:shield-check',h10:'ph:leaf',
  h11:'ph:scissors',h12:'ph:hand',h13:'ph:eye',h14:'ph:pencil-simple',h15:'ph:person-simple',
  h16:'ph:shopping-bag',h17:'ph:flask',h18:'ph:sun',h19:'ph:mask-happy',h20:'ph:drop-half',
  h21:'ph:barbell',h22:'ph:thermometer-hot',h23:'ph:pill',h24:'ph:eyeglasses',h25:'ph:bone',h26:'ph:flask',
  f01:'ph:chicken',f02:'ph:chicken',f03:'ph:chicken',f04:'ph:bowl-food',f05:'ph:bowl-food',
  f06:'ph:fork-knife',f07:'ph:bowl-food',f08:'ph:bowl-food',f09:'ph:bowl-food',f10:'ph:fish',
  f11:'ph:fork-knife',f12:'ph:flame',f13:'ph:beer-stein',f14:'ph:pepper',f15:'ph:flame',
  f16:'ph:bowl-food',f17:'ph:fish',f18:'ph:bowl-food',f19:'ph:cake',f20:'ph:ice-cream',
  f21:'ph:flame',f22:'ph:bowl-food',f23:'ph:fork-knife',f24:'ph:bowl-food',f25:'ph:storefront',
  f26:'ph:coffee',f27:'ph:fork-knife',f28:'ph:fork-knife',f29:'ph:fork-knife',f30:'ph:fork-knife',
  f31:'ph:sushi',f32:'ph:bowl-food',f33:'ph:pepper',f34:'ph:fork-knife',f35:'ph:wine',
  s01:'ph:shopping-bag',s02:'ph:airplane',s03:'ph:leaf',s04:'ph:storefront',s05:'ph:sunglasses',
  s06:'ph:t-shirt',s07:'ph:diamond',s08:'ph:eyeglasses',s09:'ph:shopping-cart',s10:'ph:pencil',
  s11:'ph:pill',s12:'ph:pill',s13:'ph:bandaids',s14:'ph:bandaids',s15:'ph:moon',
  s16:'ph:first-aid-kit',s17:'ph:t-shirt',s18:'ph:shopping-cart',s19:'ph:cookie',s20:'ph:package',
  s21:'ph:leaf',s22:'ph:leaf',s23:'ph:plant',s24:'ph:gift',s25:'ph:books',
  a01:'ph:identification-card',a02:'ph:book-open',a03:'ph:bank',a04:'ph:bank',a05:'ph:device-mobile',
  a06:'ph:car',a07:'ph:currency-krw',a08:'ph:chart-bar',a09:'ph:shield',a10:'ph:files',
  a11:'ph:heartbeat',a12:'ph:chart-line-up',a13:'ph:globe',a14:'ph:seal',a15:'ph:check-circle',
  p01:'ph:house-line',p02:'ph:users-three',p03:'ph:users',p04:'ph:house',p05:'ph:graduation-cap',
  p06:'ph:map-pin',p07:'ph:hands-praying',p08:'ph:fork-knife',p09:'ph:camera',p10:'ph:gift',
  k01:'ph:syringe',k02:'ph:stethoscope',k03:'ph:tooth',k04:'ph:lego',k05:'ph:t-shirt',
  k06:'ph:books',k07:'ph:baby',k08:'ph:smiley',k09:'ph:ticket',k10:'ph:camera',
  g01:'ph:buildings',g02:'ph:tree',g03:'ph:broadcast-tower',g04:'ph:waves',g05:'ph:house',
  g06:'ph:palette',g07:'ph:music-note',g08:'ph:building',g09:'ph:books',g10:'ph:binoculars',
  g11:'ph:mountain',g12:'ph:umbrella-simple',g13:'ph:crown',g14:'ph:house',g15:'ph:tree-evergreen',
  g16:'ph:microphone',g17:'ph:monitor',g18:'ph:thermometer-hot',g19:'ph:lock-key',g20:'ph:baseball',
  g21:'ph:dress',g22:'ph:flag',
}
const CAT_ICONS: Record<string,string> = {
  hospital:'ph:first-aid-kit',food:'ph:fork-knife',shopping:'ph:shopping-bag',
  admin:'ph:files',people:'ph:users',parenting:'ph:baby',places:'ph:map-pin',
  schedule:'ph:calendar',custom:'ph:star',
}

/* 원형 프로그레스 */
function CircleProgress({ pct }: { pct: number }) {
  const R = 38, C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C
  return (
    <div style={{ position:'relative', width:86, height:86, flexShrink:0 }}>
      <svg width={86} height={86} viewBox="0 0 86 86" style={{ transform:'rotate(-90deg)' }}>
        <circle cx={43} cy={43} r={R} fill="none" stroke="#F1F5F9" strokeWidth={9}/>
        <circle cx={43} cy={43} r={R} fill="none" stroke="#FFCD00" strokeWidth={9}
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <span style={{ fontSize:13,fontWeight:800,color:'#1B6EF3' }}>{pct}%</span>
      </div>
    </div>
  )
}

/* 동전 스택 */
function CoinStack({ count, total }: { count:number; total:number }) {
  const maxCoins = 8
  const filled   = total > 0 ? Math.round((count / total) * maxCoins) : 0
  return (
    <div style={{ display:'flex',flexDirection:'column-reverse',alignItems:'center',gap:2,justifyContent:'flex-end',minWidth:32 }}>
      {Array.from({ length: maxCoins }, (_, i) => (
        <div key={i} style={{
          width:24, height:12, borderRadius:'50%',
          background: i < filled
            ? 'radial-gradient(ellipse at 35% 35%, #FFE566, #FFCD00 60%, #C8960C)'
            : '#E2E8F0',
          boxShadow: i < filled ? '0 2px 4px rgba(180,130,0,0.3)' : 'none',
        }}/>
      ))}
      <div style={{ fontSize:9,color:'#94A3B8',fontWeight:600,marginTop:3 }}>{count}/{total}</div>
    </div>
  )
}

export default function BucketSharePaper({ state, trip, achieved, dbItems = [] }: Props) {
  const dbItemsAsCheckItems = dbItems.map(i => ({
    id: i.id,
    categoryId: i.category_id,
    label: i.label,
    emoji: '📌',
  }))
  const allItems      = [...dbItemsAsCheckItems, ...state.customItems.map(c => ({ ...c, categoryId: c.categoryId ?? 'custom' }))]
  const checkedItems  = allItems.filter(i => state.selected[i.id])
  const tripDays      = getTripDays(trip)

  // BucketCheckView와 동일한 row 기준
  const getKey = (id: string, day?: number) => day !== undefined ? `${id}_${day}` : id
  const allRows: { id: string; day?: number }[] = []
  checkedItems.forEach(item => {
    const days = state.schedules[item.id] ?? []
    if (days.length === 0) allRows.push({ id: item.id })
    else days.forEach(d => allRows.push({ id: item.id, day: d }))
  })
  const total         = allRows.length
  const achievedCount = allRows.filter(r => !!achieved[getKey(r.id, r.day)]).length
  const pct           = total > 0 ? Math.round((achievedCount / total) * 100) : 0

  // 날짜별 그룹 (row 기준 — 같은 아이템도 날짜별로 각각)
  const byDay = new Map<number, { item: typeof checkedItems[0]; day: number }[]>()
  checkedItems.forEach(item => {
    ;(state.schedules[item.id] ?? []).forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push({ item, day: d })
    })
  })
  const sortedDays  = Array.from(byDay.keys()).sort((a, b) => a - b)
  const unscheduled = checkedItems.filter(i => !(state.schedules[i.id]?.length))

  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

  return (
    <div id="receipt-root" style={{ width:320, margin:'0 auto', fontFamily:ff, background:'#F1F5F9', borderRadius:14, overflow:'hidden' }}>

      {/* ── 상단 진행 카드 (헤더 대신) ── */}
      <div style={{
        background:'#fff', margin:12, borderRadius:12,
        boxShadow:'0 4px 20px rgba(27,110,243,0.10),0 1px 4px rgba(0,0,0,0.06)',
        padding:'16px', display:'flex', alignItems:'center', gap:14,
      }}>
        <CircleProgress pct={pct} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16,fontWeight:800,color:'#1E293B',marginBottom:3,lineHeight:1.2 }}>호주 버킷리스트</div>
          <div style={{ fontSize:11,color:'#94A3B8',fontWeight:600,marginBottom:5 }}>
            {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
          </div>
          <div style={{ display:'flex',alignItems:'baseline',gap:3 }}>
            <span style={{ fontSize:22,fontWeight:800,color:'#1B6EF3',lineHeight:1 }}>{achievedCount}</span>
            <span style={{ fontSize:13,fontWeight:600,color:'#64748B' }}>/{total}건 완료</span>
          </div>
        </div>
        <CoinStack count={achievedCount} total={total} />
      </div>

      {/* ── 리스트 ── */}
      <div style={{ background:'#fff', margin:'0 12px', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        {sortedDays.map(dayIdx => {
          const rows   = byDay.get(dayIdx) ?? []
          const date   = tripDays[dayIdx]
          const dayDone = rows.filter(r => !!achieved[getKey(r.item.id, r.day)]).length
          return (
            <div key={dayIdx}>
              {/* 날짜 헤더 */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'6px 12px 4px', background:'#F8FAFD',
                borderBottom:'1px solid #E2E8F0',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10,fontWeight:800,color:'#1B6EF3' }}>{dayIdx+1}일차</span>
                  {date && <span style={{ fontSize:10,color:'#94A3B8' }}>{fmtMD(date)}({dow(date)})</span>}
                </div>
                <span style={{ fontSize:10,color:'#1B6EF3',fontWeight:700 }}>{dayDone}/{rows.length}</span>
              </div>
              {/* 아이템 — 날짜별 row 각각 */}
              {rows.map(({ item, day }) => {
                const isDone = !!achieved[getKey(item.id, day)]
                const icon   = ITEM_ICONS[item.id] ?? CAT_ICONS[(item as any).categoryId] ?? 'ph:star'
                return (
                  <div key={`${item.id}_${day}`} style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 12px',
                    background: isDone ? '#fff8e4' : '#fff',
                    borderBottom:'1px solid #F1F5F9',
                  }}>
                    {/* 체크박스 */}
                    <div style={{
                      width:16,height:16,borderRadius:3,flexShrink:0,
                      background: isDone ? '#16A34A' : '#fff',
                      border: isDone ? 'none' : '1.5px solid #CBD5E1',
                      display:'flex',alignItems:'center',justifyContent:'center',
                    }}>
                      {isDone && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {/* 단색 아이콘 */}
                    <Icon icon={icon} width={16} height={16} color={isDone ? '#78716C' : '#94A3B8'} />
                    {/* 라벨 */}
                    <span style={{ flex:1,fontSize:12,color:'#1E293B',fontWeight:isDone?600:400,lineHeight:1.4 }}>{item.label}</span>
                    {isDone && <span style={{ fontSize:9,fontWeight:600,color:'#44403C',background:'rgba(68,64,60,0.10)',padding:'2px 6px',borderRadius:3,flexShrink:0 }}>완료 ✓</span>}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* 날짜 미지정 */}
        {unscheduled.length > 0 && (
          <div>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'6px 12px 4px', background:'#F8FAFD',
              borderBottom:'1px solid #E2E8F0',
            }}>
              <span style={{ fontSize:10,fontWeight:800,color:'#94A3B8' }}>날짜 미지정</span>
              <span style={{ fontSize:10,color:'#94A3B8' }}>{unscheduled.filter(i=>!!achieved[i.id]).length}/{unscheduled.length}</span>
            </div>
            {unscheduled.map(item => {
              const isDone = !!achieved[item.id]
              const icon   = ITEM_ICONS[item.id] ?? CAT_ICONS[(item as any).categoryId] ?? 'ph:star'
              return (
                <div key={item.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'8px 12px',
                  background: isDone ? '#fff8e4' : '#fff',
                  borderBottom:'1px solid #F1F5F9',
                }}>
                  <div style={{
                    width:16,height:16,borderRadius:3,flexShrink:0,
                    background: isDone ? '#16A34A' : '#fff',
                    border: isDone ? 'none' : '1.5px solid #CBD5E1',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}>
                    {isDone && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <Icon icon={icon} width={16} height={16} color={isDone ? '#78716C' : '#94A3B8'} />
                  <span style={{ flex:1,fontSize:12,color:'#1E293B',fontWeight:isDone?600:400,lineHeight:1.4 }}>{item.label}</span>
                  {isDone && <span style={{ fontSize:9,fontWeight:600,color:'#44403C',background:'rgba(68,64,60,0.10)',padding:'2px 6px',borderRadius:3,flexShrink:0 }}>완료 ✓</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 푸터 ── */}
      <div style={{
        margin:'12px 12px 12px',
        background:'linear-gradient(135deg, #1B6EF3, #1B6EF3)',
        borderRadius:10,
        padding:'12px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:12,fontWeight:800,color:'#fff',letterSpacing:-0.3 }}>호주가자</div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.7)',marginTop:2 }}>여행 버킷리스트 🦘</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11,fontWeight:700,color:'#FFCD00' }}>www.hojugaja.com</div>
          <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',marginTop:2 }}>나만의 버킷리스트를 만들어보세요</div>
        </div>
      </div>

    </div>
  )
}
