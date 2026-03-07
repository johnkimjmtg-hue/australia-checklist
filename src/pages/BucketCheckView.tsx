import { useState } from 'react'
import { ITEMS, CATEGORIES } from '../data/checklist'
import { AppState, TripInfo, toggleItem, getTripDays, fmtMD, dow } from '../store/state'

type Filter = 'all' | 'done' | 'todo'

type Props = {
  state:     AppState
  trip:      TripInfo
  setState:  (s: AppState) => void
  onEdit:    () => void   // 수정하기 → 설정화면으로
  onDelete:  () => void   // 삭제하기 → confirmReset
}

/* ── 원형 그래프 ── */
function CircleProgress({ pct, done, total }: { pct: number; done: number; total: number }) {
  const R = 42
  const C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={R} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle cx={48} cy={48} r={R} fill="none" stroke="#003594" strokeWidth={8}
          strokeDasharray={C} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#003594', lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  )
}

export default function BucketCheckView({ state, trip, setState, onEdit, onDelete }: Props) {
  const [filter, setFilter]   = useState<Filter>('all')
  const [menuOpen, setMenuOpen] = useState(false)

  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
  const checkedItems = allItems.filter(i => state.selected[i.id])
  const done  = checkedItems.filter(i => state.selected[i.id]).length  // 전체 선택된 항목 수
  // "완료"는 체크된 항목들 중 실제 체크표시(여기서는 selected = 선택된 것, 별도 checked 없음)
  // 여기선 selected = 버킷리스트에 담긴 항목, 별도 "달성" 상태 필요
  // → state.schedules를 "달성 여부"로 활용: dayIndex가 있으면 담긴것, 달성은 별도 필드 필요
  // 현재 구조상 selected = 담긴 항목들 (발행된 버킷리스트)
  // 달성 표시는 새로운 방식 필요 → localStorage에 별도 저장
  // 우선 toggleItem을 그대로 활용: 체크 on/off = achieved
  // → 발행 후엔 selected가 "달성됨" 의미로 전환됨 (발행 시점의 selected를 snapshot으로)
  // 실제로는 발행된 항목 = schedules에 등록된 항목들
  const tripDays = getTripDays(trip)
  const total = checkedItems.length

  // 날짜별 그룹핑: schedules[itemId] = [dayIndex, ...]
  // dayIndex 0 = 1일차
  const byDay: Map<number, typeof checkedItems> = new Map()
  checkedItems.forEach(item => {
    const days = state.schedules[item.id] ?? []
    days.forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(item)
    })
  })
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => a - b)

  // "달성" 여부: 별도 achieved 상태 — localStorage 키 'bucket-achieved'
  const [achieved, setAchieved] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })
  const saveAchieved = (next: Record<string, boolean>) => {
    setAchieved(next)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
  }
  const toggleAchieved = (id: string) => {
    const next = { ...achieved, [id]: !achieved[id] }
    if (!next[id]) delete next[id]
    saveAchieved(next)
  }

  const achievedCount = checkedItems.filter(i => achieved[i.id]).length
  const pct = total > 0 ? Math.round((achievedCount / total) * 100) : 0

  // 필터 적용
  const filterItem = (item: { id: string }) => {
    if (filter === 'done') return !!achieved[item.id]
    if (filter === 'todo') return !achieved[item.id]
    return true
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',  label: '전체' },
    { key: 'todo', label: '미완료' },
    { key: 'done', label: '완료' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#F1F5F9',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        .check-row { transition: background 0.1s; }
        .check-row:active { background: #F1F5F9 !important; }
        .filter-btn { transition: all 0.12s; }
        .menu-item:hover { background: #F1F5F9; }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
          <span style={{ fontSize: 13, color: '#003594', fontWeight: 800, letterSpacing: 2 }}>HOJUGAJA</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              width: 36, height: 36, borderRadius: 6,
              border: '1px solid #E2E8F0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, color: '#64748B',
            }}>⋯</button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', top: 42, right: 0, zIndex: 50,
                  background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 15px rgba(0,0,0,0.10)',
                  minWidth: 140, overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit() }} style={{
                    width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
                    textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#1E293B', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    ✏️ 수정하기
                  </button>
                  <div style={{ height: 1, background: '#E2E8F0' }} />
                  <button className="menu-item" onClick={() => { setMenuOpen(false); onDelete() }} style={{
                    width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
                    textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#DC2626', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    🗑 삭제하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* 탭 자리 (높이 맞춤) */}
        <div style={{ padding: '4px 20px 0', display: 'flex' }}>
          <div style={{
            height: 44, display: 'flex', alignItems: 'center',
            fontSize: 15, fontWeight: 700, color: '#003594',
            borderBottom: '3px solid #003594', paddingBottom: 2,
          }}>버킷리스트</div>
          <div style={{ height: 44, flex: 1 }} />
        </div>
      </div>

      {/* ── 진행 카드 ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 8,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          padding: '20px',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <CircleProgress pct={pct} done={achievedCount} total={total} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
              {achievedCount}/{total}건 완료
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>
              {pct === 100
                ? '🎉 모든 버킷리스트 달성!'
                : pct >= 50
                ? '절반 이상 달성! 계속 화이팅 💪'
                : '호주에서 꼭 해야 할 것들을 하나씩 체크하세요'}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {trip.startDate.slice(5).replace('-', '/')} ~ {trip.endDate.slice(5).replace('-', '/')}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#003594',
                background: 'rgba(0,53,148,0.07)', padding: '2px 8px', borderRadius: 4,
              }}>{tripDays.length}일</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 필터 ── */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 8 }}>
        {FILTERS.map(f => (
          <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)} style={{
            height: 34, padding: '0 16px', borderRadius: 4, border: '1px solid',
            borderColor: filter === f.key ? '#003594' : '#E2E8F0',
            background: filter === f.key ? '#003594' : '#fff',
            color: filter === f.key ? '#fff' : '#64748B',
            fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
            cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ── 날짜별 리스트 ── */}
      <div style={{ padding: '12px 0 100px' }}>
        {sortedDays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: 14 }}>
            일정이 지정된 항목이 없어요
          </div>
        ) : (
          sortedDays.map(dayIdx => {
            const dayItems = (byDay.get(dayIdx) ?? []).filter(filterItem)
            if (dayItems.length === 0) return null
            const date = tripDays[dayIdx]
            const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
            const dayAchieved = dayItems.filter(i => achieved[i.id]).length

            return (
              <div key={dayIdx} style={{ marginBottom: 8 }}>
                {/* 날짜 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px 6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                      {dayIdx + 1}일차
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{dayLabel}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#003594', fontWeight: 600 }}>
                    {dayAchieved}/{dayItems.length}
                  </span>
                </div>

                {/* 항목들 */}
                <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                  {dayItems.map((item, idx) => {
                    const isAchieved = !!achieved[item.id]
                    const cat = CATEGORIES.find(c => c.id === item.categoryId)
                    return (
                      <div key={item.id} className="check-row" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 20px',
                        borderBottom: idx < dayItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                        background: '#fff',
                        minHeight: 52,
                      }}>
                        {/* 체크박스 */}
                        <button onClick={() => toggleAchieved(item.id)} style={{
                          width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                          border: isAchieved ? 'none' : '1.5px solid #CBD5E1',
                          background: isAchieved ? '#003594' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}>
                          {isAchieved && (
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        {/* 이모지 */}
                        <span style={{ fontSize: 20, flexShrink: 0, opacity: isAchieved ? 1 : 0.4 }}>
                          {item.emoji}
                        </span>

                        {/* 라벨 */}
                        <span style={{
                          flex: 1, fontSize: 16, lineHeight: 1.4,
                          fontWeight: isAchieved ? 600 : 400,
                          color: isAchieved ? '#1E293B' : '#64748B',
                          textDecoration: isAchieved ? 'none' : 'none',
                        }}>{item.label}</span>

                        {/* 카테고리 뱃지 */}
                        {cat && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#003594',
                            background: 'rgba(0,53,148,0.07)',
                            padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                          }}>{cat.label}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {/* 날짜 미지정 항목 */}
        {(() => {
          const unscheduled = checkedItems.filter(i => !(state.schedules[i.id]?.length)).filter(filterItem)
          if (unscheduled.length === 0) return null
          return (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>날짜 미지정</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  {unscheduled.filter(i => achieved[i.id]).length}/{unscheduled.length}
                </span>
              </div>
              <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                {unscheduled.map((item, idx) => {
                  const isAchieved = !!achieved[item.id]
                  const cat = CATEGORIES.find(c => c.id === item.categoryId)
                  return (
                    <div key={item.id} className="check-row" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 20px',
                      borderBottom: idx < unscheduled.length - 1 ? '1px solid #E2E8F0' : 'none',
                      background: '#fff', minHeight: 52,
                    }}>
                      <button onClick={() => toggleAchieved(item.id)} style={{
                        width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                        border: isAchieved ? 'none' : '1.5px solid #CBD5E1',
                        background: isAchieved ? '#003594' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}>
                        {isAchieved && (
                          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                            <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <span style={{ fontSize: 20, flexShrink: 0, opacity: isAchieved ? 1 : 0.4 }}>{item.emoji}</span>
                      <span style={{
                        flex: 1, fontSize: 16, lineHeight: 1.4,
                        fontWeight: isAchieved ? 600 : 400,
                        color: isAchieved ? '#1E293B' : '#64748B',
                      }}>{item.label}</span>
                      {cat && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#003594',
                          background: 'rgba(0,53,148,0.07)',
                          padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                        }}>{cat.label}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── 하단 고정 바 ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '10px 20px 24px',
        background: 'rgba(241,245,249,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #E2E8F0', zIndex: 20, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
          TOTAL: <span style={{ color: '#003594' }}>{achievedCount}/{total}건</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onEdit} style={{
            height: 44, padding: '0 16px', borderRadius: 6,
            border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer',
          }}>수정하기</button>
          <button onClick={onDelete} style={{
            height: 44, padding: '0 16px', borderRadius: 6,
            border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer',
          }}>삭제하기</button>
        </div>
      </div>
    </div>
  )
}
