import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { ITEMS } from '../data/checklist'

type Props = { state: AppState; trip: TripInfo; achieved: Record<string,boolean> }

const ITEM_ICONS: Record<string, string> = {
  h01:'🦷',h02:'🦷',h03:'✨',h04:'💉',h05:'💧',h06:'👁',h07:'👓',h08:'❤️',h09:'🛡',h10:'🌿',
  h11:'✂️',h12:'💅',h13:'👁',h14:'✏️',h15:'🧖',h16:'🛍',h17:'🧴',h18:'☀️',h19:'🎭',h20:'💧',
  h21:'💪',h22:'🌡',h23:'💊',h24:'👓',h25:'🦴',h26:'🧴',
  f01:'🍗',f02:'🍗',f03:'🍗',f04:'🍜',f05:'🍜',f06:'🥢',f07:'🍲',f08:'🍲',f09:'🍲',f10:'🦀',
  f11:'🥩',f12:'🥩',f13:'🍺',f14:'🌶',f15:'🥩',f16:'🍚',f17:'🍣',f18:'🍜',f19:'🥞',f20:'🍧',
  f21:'🍗',f22:'🍲',f23:'🥩',f24:'🍜',f25:'🏪',f26:'☕',f27:'🍢',f28:'🥩',f29:'🥞',f30:'🥟',
  f31:'🍱',f32:'🍲',f33:'🌶',f34:'🍽',f35:'🍶',
  s01:'🛍',s02:'✈️',s03:'🌿',s04:'🏪',s05:'🕶',s06:'👕',s07:'💍',s08:'👓',s09:'🛒',s10:'✏️',
  s11:'💊',s12:'💊',s13:'🩹',s14:'🩹',s15:'😴',s16:'🏥',s17:'👗',s18:'🛒',s19:'🍫',s20:'📦',
  s21:'🌿',s22:'🥬',s23:'🌿',s24:'🎁',s25:'📚',
  a01:'🪪',a02:'📘',a03:'🏦',a04:'💛',a05:'📱',a06:'🚗',a07:'💰',a08:'📊',a09:'🛡',a10:'📄',
  a11:'🏥',a12:'📈',a13:'🌏',a14:'📜',a15:'✅',
  p01:'🏠',p02:'👬',p03:'👥',p04:'🏠',p05:'🎓',p06:'🏡',p07:'🙏',p08:'🍽',p09:'📸',p10:'🎁',
  k01:'💉',k02:'🩺',k03:'🦷',k04:'🧸',k05:'👕',k06:'📚',k07:'🧷',k08:'🎠',k09:'🎡',k10:'📸',
  g01:'🏯',g02:'🌿',g03:'🗼',g04:'🌊',g05:'🏘',g06:'🎨',g07:'🎵',g08:'🏛',g09:'📚',g10:'🏙',
  g11:'🌋',g12:'🏖',g13:'🏺',g14:'🏘',g15:'🍂',g16:'🎤',g17:'🎮',g18:'♨️',g19:'🔐',g20:'⚾',
  g21:'👘',g22:'🪖',
}

export default function BucketSharePaper({ state, trip, achieved }: Props) {
  const allItems     = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
  const checkedItems = allItems.filter(i => state.selected[i.id])
  const tripDays     = getTripDays(trip)
  const total        = checkedItems.length
  const achievedCount = checkedItems.filter(i => achieved[i.id]).length
  const pct          = total > 0 ? Math.round((achievedCount / total) * 100) : 0

  const byDay = new Map<number, typeof checkedItems>()
  checkedItems.forEach(item => {
    ;(state.schedules[item.id] ?? []).forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(item)
    })
  })
  const sortedDays  = Array.from(byDay.keys()).sort((a, b) => a - b)
  const unscheduled = checkedItems.filter(i => !(state.schedules[i.id]?.length))

  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

  return (
    <div id="receipt-root" style={{
      width: 320, margin: '0 auto',
      fontFamily: ff,
      background: '#F1F5F9',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #002870, #003594)',
        padding: '16px 18px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:2.5, fontWeight:800, marginBottom:3 }}>BUCKET LIST</div>
          <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>호주가자</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ color:'#FFCD00', fontSize:22, fontWeight:900, lineHeight:1 }}>{pct}%</div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11, marginTop:2 }}>{achievedCount}/{total}건 완료</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, marginTop:2 }}>
            {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div style={{ background:'#fff', padding:'0' }}>
        {sortedDays.map(dayIdx => {
          const items = byDay.get(dayIdx) ?? []
          const date  = tripDays[dayIdx]
          return (
            <div key={dayIdx}>
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'6px 14px 4px', background:'#F8FAFD',
                borderBottom:'1px solid rgba(30,77,131,0.06)',
              }}>
                <span style={{ fontSize:10, fontWeight:800, color:'#003594' }}>{dayIdx+1}일차</span>
                {date && <span style={{ fontSize:10, color:'#AAB8CC' }}>{fmtMD(date)}({dow(date)})</span>}
                <span style={{ marginLeft:'auto', fontSize:10, color:'#AAB8CC' }}>{items.length}건</span>
              </div>
              {items.map(item => {
                const done = !!achieved[item.id]
                return (
                  <div key={item.id} style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'7px 14px',
                    background: done ? '#fff8e4' : '#fff',
                    borderBottom:'1px solid rgba(30,77,131,0.05)',
                  }}>
                    {/* 체크박스 */}
                    <div style={{
                      width:16, height:16, borderRadius:3, flexShrink:0,
                      background: done ? '#16A34A' : '#fff',
                      border: done ? 'none' : '1.5px solid #CBD5E1',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {done && <span style={{ color:'#fff', fontSize:9, fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, flexShrink:0 }}>{ITEM_ICONS[item.id] ?? item.emoji ?? '📌'}</span>
                    <span style={{ fontSize:12, color: done ? '#44403C' : '#64748B', fontWeight: done ? 600 : 400, flex:1 }}>{item.label}</span>
                    {done && <span style={{ fontSize:10, color:'#16A34A', fontWeight:700 }}>완료</span>}
                  </div>
                )
              })}
            </div>
          )
        })}

        {unscheduled.length > 0 && (
          <div>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'6px 14px 4px', background:'#F8FAFD',
              borderBottom:'1px solid rgba(30,77,131,0.06)',
            }}>
              <span style={{ fontSize:10, fontWeight:800, color:'#94A3B8' }}>날짜 미지정</span>
              <span style={{ marginLeft:'auto', fontSize:10, color:'#AAB8CC' }}>{unscheduled.length}건</span>
            </div>
            {unscheduled.map(item => {
              const done = !!achieved[item.id]
              return (
                <div key={item.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'7px 14px',
                  background: done ? '#fff8e4' : '#fff',
                  borderBottom:'1px solid rgba(30,77,131,0.05)',
                }}>
                  <div style={{
                    width:16, height:16, borderRadius:3, flexShrink:0,
                    background: done ? '#16A34A' : '#fff',
                    border: done ? 'none' : '1.5px solid #CBD5E1',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {done && <span style={{ color:'#fff', fontSize:9, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:13, flexShrink:0 }}>{ITEM_ICONS[item.id] ?? item.emoji ?? '📌'}</span>
                  <span style={{ fontSize:12, color: done ? '#44403C' : '#64748B', fontWeight: done ? 600 : 400, flex:1 }}>{item.label}</span>
                  {done && <span style={{ fontSize:10, color:'#16A34A', fontWeight:700 }}>완료</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{
        padding:'10px 14px 12px', background:'#fff',
        borderTop:'1.5px dashed rgba(30,77,131,0.15)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{ fontSize:9, color:'#C0CCD8', fontWeight:600 }}>호주가자 · 여행 버킷리스트 🦘</span>
        <span style={{ fontSize:9, color:'#C0CCD8', letterSpacing:1 }}>{state.meta.receiptCode}</span>
      </div>
    </div>
  )
}
