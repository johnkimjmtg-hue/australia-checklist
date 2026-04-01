// ─────────────────────────────────────────────
// DayDetailView.tsx
// src/components/DayDetailView.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { AppState, TripInfo, getTripDays } from '../store/state'
import { ITEMS } from '../data/checklist'
import { getCachedChecklist } from '../lib/dataCache'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

type DBItem = {
  id: string; category_id: string; label: string; icon: string | null
  image_url?: string | null; description?: string | null; tips?: string | null; address?: string | null
}

type Props = {
  date: Date
  dayIdx: number
  trip: TripInfo
  state: AppState
  setState: (s: AppState) => void
  onClose: () => void
}

function getMemoKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `memo_${y}-${m}-${d}`
}

export default function DayDetailView({ date, dayIdx, trip, state, setState, onClose }: Props) {
  const [memo, setMemo] = useState('')
  const [editing, setEditing] = useState(false)
  const [dbItems, setDbItems] = useState<DBItem[]>([])
  const [achieved, setAchieved] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })

  useEffect(() => {
    const key = getMemoKey(date)
    const saved = localStorage.getItem(key) ?? ''
    setMemo(saved)
  }, [date])

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.items?.length) setDbItems(cached.items)
  }, [])

  const saveMemo = (val: string) => {
    const key = getMemoKey(date)
    setMemo(val)
    localStorage.setItem(key, val)
  }

  // 이 날짜에 배정된 버킷리스트 항목
  const allItems = [...ITEMS, ...state.customItems]
  const dayItems = allItems.filter(item =>
    state.selected[item.id] && (state.schedules[item.id] ?? []).includes(dayIdx)
  )

  const toggleAchieved = (id: string) => {
    const key = `${id}_${dayIdx}`
    const next = { ...achieved, [key]: !achieved[key] }
    if (!next[key]) delete next[key]
    setAchieved(next)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
  }

  const dateStr = `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일 ${WEEK[date.getDay()]}요일`
  const tripDays = getTripDays(trip)
  const dayLabel = `여행 ${dayIdx + 1}일차`

  const hasMemo = memo.trim().length > 0

  return (
    <div style={{
      background: '#ffffff', fontFamily: ff, height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 헤더 */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', borderBottom: '1px solid rgba(0,131,143,0.15)',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0D3349' }}>{dateStr}</div>
          <div style={{ fontSize: 13, color: '#00838F', fontWeight: 700, marginTop: 2 }}>{dayLabel}</div>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.06)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}>
          <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
        </button>
      </div>

      {/* 내용 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* 버킷리스트 섹션 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#29B6D0', flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>버킷리스트</div>
            <div style={{ fontSize: 12, color: '#7BAAB5' }}>({dayItems.length}개)</div>
          </div>

          {dayItems.length === 0 ? (
            <div style={{
              background: '#F8FAFC', borderRadius: 12, padding: '20px',
              textAlign: 'center', color: '#7BAAB5', fontSize: 13,
            }}>
              이 날짜에 배정된 버킷리스트가 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayItems.map(item => {
                const db = dbItems.find(d => d.id === item.id)
                const key = `${item.id}_${dayIdx}`
                const isDone = !!achieved[key]
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isDone ? 'rgba(41,182,208,0.08)' : '#F8FAFC',
                    borderRadius: 12, padding: '12px 14px',
                    border: isDone ? '1px solid rgba(41,182,208,0.3)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                    {db?.image_url && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={db.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: isDone ? '#7BAAB5' : '#0D3349',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.4,
                      }}>{item.label}</div>
                      {db?.description && (
                        <div style={{ fontSize: 12, color: '#7BAAB5', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{db.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleAchieved(item.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: isDone ? '#29B6D0' : 'rgba(0,0,0,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s',
                      }}>
                      <Icon icon="ph:check-bold" width={13} height={13} color={isDone ? '#fff' : '#aaa'} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 메모 섹션 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>메모</div>
          </div>

          {editing ? (
            <div>
              <textarea
                value={memo}
                onChange={e => saveMemo(e.target.value)}
                placeholder="이 날의 메모를 남겨보세요..."
                autoFocus
                style={{
                  width: '100%', minHeight: 120, borderRadius: 12,
                  border: '1.5px solid #F59E0B', outline: 'none',
                  padding: '12px 14px', fontSize: 14, color: '#0D3349',
                  background: '#FFFBEB', fontFamily: ff, resize: 'none',
                  lineHeight: 1.6, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setEditing(false)}
                style={{
                  marginTop: 8, height: 36, padding: '0 20px', borderRadius: 20,
                  border: 'none', background: '#F59E0B', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                }}>
                저장
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              style={{
                background: hasMemo ? '#FFFBEB' : '#F8FAFC',
                borderRadius: 12, padding: '14px',
                border: hasMemo ? '1px solid rgba(245,158,11,0.3)' : '1.5px dashed #E2E8F0',
                cursor: 'pointer', minHeight: 80,
                display: 'flex', alignItems: hasMemo ? 'flex-start' : 'center',
                justifyContent: hasMemo ? 'flex-start' : 'center',
              }}>
              {hasMemo ? (
                <div style={{ fontSize: 14, color: '#0D3349', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{memo}</div>
              ) : (
                <div style={{ fontSize: 13, color: '#7BAAB5', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon icon="ph:pencil-simple" width={14} height={14} color="#7BAAB5" />
                  메모를 추가해보세요
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
