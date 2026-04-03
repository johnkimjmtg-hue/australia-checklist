// ─────────────────────────────────────────────
// WidgetManager.tsx
// src/components/WidgetManager.tsx
// 위젯 추가/제거/순서 관리 바텀시트
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

export const WIDGET_STORAGE_KEY = 'home-widgets'

export type WidgetId = 'packing' | 'ipc' | 'bucket' | 'shopping' | 'nearby' | 'note' | 'bingo' | 'services' | 'exchange' | 'emergency'

export const ALL_WIDGETS: { id: WidgetId; icon: string; title: string; sub: string; color: string }[] = [
  { id: 'packing',   icon: '🧳', title: '짐싸기 체크리스트', sub: '공항 통과 완벽 가이드',      color: '#8B5CF6' },
  { id: 'ipc',       icon: '✈️', title: '입국 신고서 가이드', sub: '기내에서 미리 연습해요',      color: '#29B6D0' },
  { id: 'bucket',    icon: '🗺️', title: '버킷리스트',         sub: '꼭 해볼 것들',              color: '#00838F' },
  { id: 'shopping',  icon: '🛍️', title: '쇼핑리스트',         sub: '꼭 살 것들',                color: '#FF6B9D' },
  { id: 'nearby',    icon: '📍', title: '내 주변',             sub: '내 주변에는',               color: '#00838F' },
  { id: 'note',      icon: '📝', title: '노트',               sub: '메모·기록·여행 노트',        color: '#F97316' },
  { id: 'exchange',  icon: '💱', title: '환율 계산기',         sub: 'AUD ↔ KRW 실시간',          color: '#10B981' },
  { id: 'emergency', icon: '🚨', title: '긴급 번역',           sub: '오프라인 긴급 표현 카드',    color: '#DC2626' },
  { id: 'bingo',     icon: '☕', title: '카페 빙고',           sub: '시드니·멜번 카페 투어',      color: '#00838F' },
  { id: 'services',  icon: '🏢', title: '업체 정보',           sub: '여행 중 필요한 업체 정보',   color: '#0284C7' },
]

export const DEFAULT_WIDGETS: WidgetId[] = ['packing', 'ipc', 'bucket', 'shopping', 'nearby', 'note', 'bingo', 'services']

export function loadWidgets(): WidgetId[] {
  try {
    const saved = localStorage.getItem(WIDGET_STORAGE_KEY)
    if (!saved) return DEFAULT_WIDGETS
    const parsed: WidgetId[] = JSON.parse(saved)
    // 유효한 위젯 ID만 필터
    return parsed.filter(id => ALL_WIDGETS.some(w => w.id === id))
  } catch { return DEFAULT_WIDGETS }
}

export function saveWidgets(widgets: WidgetId[]) {
  try { localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets)) } catch {}
}

type Props = { onClose: () => void; onSave: (widgets: WidgetId[]) => void }

export default function WidgetManager({ onClose, onSave }: Props) {
  const [active, setActive] = useState<WidgetId[]>(() => loadWidgets())

  const isOn = (id: WidgetId) => active.includes(id)

  const toggle = (id: WidgetId) => {
    if (isOn(id)) {
      if (active.length <= 1) return // 최소 1개
      setActive(active.filter(w => w !== id))
    } else {
      setActive([...active, id])
    }
  }

  const moveUp = (id: WidgetId) => {
    const idx = active.indexOf(id)
    if (idx <= 0) return
    const next = [...active]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setActive(next)
  }

  const moveDown = (id: WidgetId) => {
    const idx = active.indexOf(id)
    if (idx < 0 || idx >= active.length - 1) return
    const next = [...active]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setActive(next)
  }

  const handleSave = () => {
    saveWidgets(active)
    onSave(active)
    onClose()
  }

  const handleReset = () => {
    setActive([...DEFAULT_WIDGETS])
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:900 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'#ffffff',
        borderRadius:'20px 20px 0 0', height:'85vh', zIndex:901,
        animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column', fontFamily: ff,
      }}>
        <style>{`@keyframes slideUpSheet { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }`}</style>

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>⚙️ 위젯 관리</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 0', minHeight:0 }}>

          {/* 활성 위젯 (순서 조정) */}
          <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>홈 화면에 표시 중 ({active.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
            {active.map((id, idx) => {
              const w = ALL_WIDGETS.find(x => x.id === id)!
              return (
                <div key={id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  background:'#F8FAFC', borderRadius:14, padding:'10px 12px',
                  border:'1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${w.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{w.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0D3349' }}>{w.title}</div>
                    <div style={{ fontSize:11, color:'#94A3B8' }}>{w.sub}</div>
                  </div>
                  {/* 순서 버튼 */}
                  <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
                    <button onClick={() => moveUp(id)} disabled={idx === 0} style={{
                      width:24, height:24, borderRadius:6, border:'none',
                      background: idx === 0 ? 'transparent' : 'rgba(0,0,0,0.06)',
                      cursor: idx === 0 ? 'default' : 'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon icon="ph:caret-up" width={12} height={12} color={idx === 0 ? '#E2E8F0' : '#64748B'} />
                    </button>
                    <button onClick={() => moveDown(id)} disabled={idx === active.length - 1} style={{
                      width:24, height:24, borderRadius:6, border:'none',
                      background: idx === active.length - 1 ? 'transparent' : 'rgba(0,0,0,0.06)',
                      cursor: idx === active.length - 1 ? 'default' : 'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon icon="ph:caret-down" width={12} height={12} color={idx === active.length - 1 ? '#E2E8F0' : '#64748B'} />
                    </button>
                  </div>
                  {/* 제거 버튼 */}
                  <button onClick={() => toggle(id)} style={{
                    width:28, height:28, borderRadius:'50%', border:'none',
                    background:'rgba(220,38,38,0.08)', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    <Icon icon="ph:minus" width={14} height={14} color="#DC2626" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* 추가 가능한 위젯 */}
          {ALL_WIDGETS.filter(w => !active.includes(w.id)).length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>추가 가능한 위젯</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:24 }}>
                {ALL_WIDGETS.filter(w => !active.includes(w.id)).map(w => (
                  <div key={w.id} style={{
                    display:'flex', alignItems:'center', gap:10,
                    background:'#fff', borderRadius:14, padding:'10px 12px',
                    border:'1px solid rgba(0,0,0,0.06)', opacity:0.7,
                  }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${w.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{w.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0D3349' }}>{w.title}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{w.sub}</div>
                    </div>
                    <button onClick={() => toggle(w.id)} style={{
                      width:28, height:28, borderRadius:'50%', border:'none',
                      background:'rgba(41,182,208,0.1)', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      <Icon icon="ph:plus" width={14} height={14} color="#29B6D0" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={{ flexShrink:0, padding:'12px 16px 32px', borderTop:'1px solid rgba(0,0,0,0.06)', display:'flex', gap:8 }}>
          <button onClick={handleReset} style={{
            height:48, padding:'0 20px', borderRadius:12, border:'1px solid rgba(0,0,0,0.1)',
            background:'#F8FAFC', color:'#64748B', fontSize:14, fontWeight:700,
            cursor:'pointer', fontFamily:ff,
          }}>초기화</button>
          <button onClick={handleSave} style={{
            flex:1, height:48, borderRadius:12, border:'none',
            background:'#0D3349', color:'#fff', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:ff,
          }}>저장하기</button>
        </div>
      </div>
    </>
  )
}
