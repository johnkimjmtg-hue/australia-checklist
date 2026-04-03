// ─────────────────────────────────────────────
// WidgetManager.tsx
// src/components/WidgetManager.tsx
// 카드 관리 - 드래그 애니메이션 + 영역간 이동
// ─────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

export const WIDGET_STORAGE_KEY = 'home-widgets'
export type WidgetId = 'packing' | 'ipc' | 'bucket' | 'shopping' | 'nearby' | 'note' | 'bingo' | 'services' | 'exchange' | 'emergency'

export const ALL_WIDGETS: { id: WidgetId; icon: string; title: string; sub: string; color: string }[] = [
  { id: 'packing',   icon: '🧳', title: '짐싸기 체크리스트', sub: '공항 통과 완벽 가이드',    color: '#8B5CF6' },
  { id: 'ipc',       icon: '✈️', title: '입국 신고서 가이드', sub: '기내에서 미리 연습해요',    color: '#29B6D0' },
  { id: 'bucket',    icon: '🗺️', title: '버킷리스트',         sub: '꼭 해볼 것들',            color: '#00838F' },
  { id: 'shopping',  icon: '🛍️', title: '쇼핑리스트',         sub: '꼭 살 것들',              color: '#FF6B9D' },
  { id: 'nearby',    icon: '📍', title: '내 주변',             sub: '내 주변에는',             color: '#00838F' },
  { id: 'note',      icon: '📝', title: '노트',               sub: '메모·기록·여행 노트',      color: '#F97316' },
  { id: 'exchange',  icon: '💱', title: '환율 계산기',         sub: 'AUD ↔ KRW 실시간',        color: '#10B981' },
  { id: 'emergency', icon: '🚨', title: '긴급 번역',           sub: '오프라인 긴급 표현 카드',  color: '#DC2626' },
  { id: 'bingo',     icon: '☕', title: '카페 빙고',           sub: '시드니·멜번 카페 투어',    color: '#00838F' },
  { id: 'services',  icon: '🏢', title: '업체 정보',           sub: '여행 중 필요한 업체 정보', color: '#0284C7' },
]

export const DEFAULT_WIDGETS: WidgetId[] = ['packing', 'ipc', 'bucket', 'shopping', 'nearby', 'note', 'bingo', 'services']

export function loadWidgets(): WidgetId[] {
  try {
    const saved = localStorage.getItem(WIDGET_STORAGE_KEY)
    if (!saved) return DEFAULT_WIDGETS
    const parsed: WidgetId[] = JSON.parse(saved)
    return parsed.filter(id => ALL_WIDGETS.some(w => w.id === id))
  } catch { return DEFAULT_WIDGETS }
}

export function saveWidgets(widgets: WidgetId[]) {
  try { localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets)) } catch {}
}

type DragState = {
  id: WidgetId
  fromSection: 'active' | 'shelf'
  fromIdx: number
  x: number
  y: number
  startX: number
  startY: number
  width: number
  height: number
}

type DropTarget = { section: 'active' | 'shelf'; idx: number } | null

type Props = { onClose: () => void; onSave: (widgets: WidgetId[]) => void }

function CardItem({
  w, isPlaceholder, isDragging, isDropTarget, onHandleStart
}: {
  w: { id: WidgetId; icon: string; title: string; sub: string; color: string }
  isPlaceholder?: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  onHandleStart: (e: React.TouchEvent | React.MouseEvent) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: isPlaceholder ? 'transparent' : isDropTarget ? `${w.color}10` : '#F8FAFC',
      borderRadius: 14, padding: '10px 12px',
      border: isPlaceholder
        ? '2px dashed rgba(41,182,208,0.4)'
        : isDropTarget
        ? `2px dashed ${w.color}`
        : '1px solid rgba(0,0,0,0.06)',
      opacity: isDragging ? 0 : 1,
      transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      minHeight: 60,
    }}>
      {isPlaceholder ? (
        <div style={{ flex: 1, height: 36 }} />
      ) : (
        <>
          <div
            className="drag-handle"
            onTouchStart={onHandleStart}
            onMouseDown={onHandleStart}
            style={{ padding: '6px 4px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <Icon icon="ph:dots-six-vertical" width={20} height={20} color="#94A3B8" />
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${w.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{w.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>{w.title}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.sub}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default function WidgetManager({ onClose, onSave }: Props) {
  const [active, setActive] = useState<WidgetId[]>(() => loadWidgets())
  const shelf = ALL_WIDGETS.filter(w => !active.includes(w.id)).map(w => w.id)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)

  const activeRefs = useRef<(HTMLDivElement | null)[]>([])
  const shelfRefs = useRef<(HTMLDivElement | null)[]>([])
  const activeSectionRef = useRef<HTMLDivElement>(null)
  const shelfSectionRef = useRef<HTMLDivElement>(null)

  // 드래그 중 현재 위치로 드롭 타겟 계산
  const calcDropTarget = useCallback((clientY: number): DropTarget => {
    // active 섹션
    const activeEl = activeSectionRef.current
    const shelfEl = shelfSectionRef.current
    if (!activeEl || !shelfEl) return null

    const activeRect = activeEl.getBoundingClientRect()
    const shelfRect = shelfEl.getBoundingClientRect()

    // active 영역
    if (clientY >= activeRect.top - 20 && clientY <= activeRect.bottom + 20) {
      const items = activeRefs.current
      for (let i = 0; i < items.length; i++) {
        const el = items[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (clientY < rect.top + rect.height / 2) return { section: 'active', idx: i }
      }
      return { section: 'active', idx: active.length }
    }

    // shelf 영역
    if (clientY >= shelfRect.top - 20) {
      const items = shelfRefs.current
      for (let i = 0; i < items.length; i++) {
        const el = items[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (clientY < rect.top + rect.height / 2) return { section: 'shelf', idx: i }
      }
      return { section: 'shelf', idx: shelf.length }
    }

    return null
  }, [active, shelf])

  const startDrag = useCallback((
    id: WidgetId,
    fromSection: 'active' | 'shelf',
    fromIdx: number,
    clientX: number,
    clientY: number,
    el: HTMLElement
  ) => {
    const rect = el.getBoundingClientRect()
    setDrag({
      id, fromSection, fromIdx,
      x: rect.left, y: rect.top,
      startX: clientX, startY: clientY,
      width: rect.width, height: rect.height,
    })
    setDropTarget({ section: fromSection, idx: fromIdx })
    if (navigator.vibrate) navigator.vibrate(30)
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!drag) return
    setDrag(prev => prev ? { ...prev, x: prev.x + (clientX - drag.startX), y: prev.y + (clientY - drag.startY), startX: clientX, startY: clientY } : null)
    setDropTarget(calcDropTarget(clientY))
  }, [drag, calcDropTarget])

  const handleDrop = useCallback(() => {
    if (!drag || !dropTarget) { setDrag(null); setDropTarget(null); return }

    const { id, fromSection } = drag
    const { section: toSection, idx: toIdx } = dropTarget

    setActive(prev => {
      const currentShelf = ALL_WIDGETS.filter(w => !prev.includes(w.id)).map(w => w.id)
      let newActive = [...prev]

      if (fromSection === 'active' && toSection === 'active') {
        // active → active 순서 변경
        const fromI = newActive.indexOf(id)
        newActive.splice(fromI, 1)
        const insertAt = Math.min(toIdx, newActive.length)
        newActive.splice(insertAt, 0, id)
      } else if (fromSection === 'shelf' && toSection === 'active') {
        // shelf → active 추가
        const insertAt = Math.min(toIdx, newActive.length)
        newActive.splice(insertAt, 0, id)
      } else if (fromSection === 'active' && toSection === 'shelf') {
        // active → shelf 제거
        if (newActive.length > 1) {
          newActive = newActive.filter(w => w !== id)
        }
      }
      // shelf → shelf는 순서 의미 없음 (무시)

      saveWidgets(newActive)
      onSave(newActive)
      return newActive
    })

    setDrag(null)
    setDropTarget(null)
  }, [drag, dropTarget, onSave])

  // 글로벌 이벤트
  useEffect(() => {
    if (!drag) return
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    const onMouseUp = () => handleDrop()
    const onTouchEnd = () => handleDrop()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [drag, handleMove, handleDrop])

  const handleReset = () => {
    const next = [...DEFAULT_WIDGETS]
    setActive(next)
    saveWidgets(next)
    onSave(next)
  }

  // active 렌더 (드롭 타겟 플레이스홀더 포함)
  const renderActive = () => {
    const items: JSX.Element[] = []
    const dragInActive = drag && dropTarget?.section === 'active'
    let placeholderInserted = false

    for (let i = 0; i <= active.length; i++) {
      // 플레이스홀더 삽입
      if (dragInActive && dropTarget?.idx === i && !placeholderInserted) {
        const w = ALL_WIDGETS.find(x => x.id === drag!.id)!
        items.push(
          <div key="placeholder" style={{ transition: 'all 0.18s' }}>
            <CardItem w={w} isPlaceholder onHandleStart={() => {}} />
          </div>
        )
        placeholderInserted = true
      }
      if (i === active.length) break

      const id = active[i]
      if (drag && id === drag.id && drag.fromSection === 'active') {
        // 드래그 중인 원본 자리 - 투명하게
        const w = ALL_WIDGETS.find(x => x.id === id)!
        items.push(
          <div key={id} ref={el => { activeRefs.current[i] = el }}>
            <CardItem w={w} isDragging onHandleStart={() => {}} />
          </div>
        )
      } else {
        const w = ALL_WIDGETS.find(x => x.id === id)!
        items.push(
          <div key={id} ref={el => { activeRefs.current[i] = el }}>
            <CardItem
              w={w}
              isDropTarget={dropTarget?.section === 'active' && dropTarget?.idx === i && drag?.id !== id}
              onHandleStart={(e) => {
                e.preventDefault()
                const el = (e.currentTarget as HTMLElement).closest('[data-card]') as HTMLElement
                const rect = el?.getBoundingClientRect()
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
                const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
                startDrag(id, 'active', i, clientX, clientY, el || e.currentTarget as HTMLElement)
              }}
            />
          </div>
        )
      }
    }
    return items
  }

  const renderShelf = () => {
    const currentShelf = ALL_WIDGETS.filter(w => !active.includes(w.id)).map(w => w.id)
    const items: JSX.Element[] = []
    const dragInShelf = drag && dropTarget?.section === 'shelf'

    for (let i = 0; i <= currentShelf.length; i++) {
      if (dragInShelf && dropTarget?.idx === i) {
        const w = ALL_WIDGETS.find(x => x.id === drag!.id)!
        items.push(
          <div key="placeholder">
            <CardItem w={w} isPlaceholder onHandleStart={() => {}} />
          </div>
        )
      }
      if (i === currentShelf.length) break

      const id = currentShelf[i]
      if (drag && id === drag.id && drag.fromSection === 'shelf') {
        const w = ALL_WIDGETS.find(x => x.id === id)!
        items.push(
          <div key={id} ref={el => { shelfRefs.current[i] = el }}>
            <CardItem w={w} isDragging onHandleStart={() => {}} />
          </div>
        )
      } else {
        const w = ALL_WIDGETS.find(x => x.id === id)!
        items.push(
          <div key={id} ref={el => { shelfRefs.current[i] = el }}>
            <CardItem
              w={w}
              onHandleStart={(e) => {
                e.preventDefault()
                const el = (e.currentTarget as HTMLElement).closest('[data-card]') as HTMLElement
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
                const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
                startDrag(id, 'shelf', i, clientX, clientY, el || e.currentTarget as HTMLElement)
              }}
            />
          </div>
        )
      }
    }
    return items
  }

  const dragWidget = drag ? ALL_WIDGETS.find(w => w.id === drag.id) : null

  return (
    <>
      <div onClick={drag ? undefined : onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', zIndex: 900 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'linear-gradient(180deg, #D4703A 0%, #F5C97A 40%, #F5D4BC 100%)',
        borderRadius: '20px 20px 0 0', height: '85vh', zIndex: 901,
        animation: 'slideUpSheet 0.25s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
        display: 'flex', flexDirection: 'column', fontFamily: ff,
        userSelect: 'none', WebkitUserSelect: 'none',
      }}>
        <style>{`
          @keyframes slideUpSheet { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }
          .drag-handle { cursor: grab; touch-action: none; }
          .drag-handle:active { cursor: grabbing; }
        `}</style>

        {/* 헤더 */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>⚙️ 카드 관리</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: drag ? 'hidden' : 'auto', padding: '16px 16px 0', minHeight: 0 }}>

          {/* 홈 화면 카드 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            홈 화면에 표시 중 ({active.length})
          </div>
          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: '10px', marginBottom: 20, border: '1.5px solid rgba(212,112,58,0.4)' }}>
            <div ref={activeSectionRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
              {renderActive().map((el, i) => <div key={i} data-card>{el}</div>)}
            </div>
          </div>

          {/* 카드 보관함 */}
          {(() => {
            const currentShelf = ALL_WIDGETS.filter(w => !active.includes(w.id))
            if (currentShelf.length === 0 && !drag) return null
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3A10' }}>카드 보관함</div>
                  <div style={{ fontSize: 11, color: '#7C3A10', opacity: 0.7 }}>여기로 끌면 홈에서 숨겨져요</div>
                </div>
                <div
                  ref={shelfSectionRef}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24,
                    minHeight: 60, padding: '8px', borderRadius: 14,
                    background: drag?.fromSection === 'active' && dropTarget?.section === 'shelf'
                      ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                    border: drag?.fromSection === 'active' && dropTarget?.section === 'shelf'
                      ? '2px dashed rgba(255,255,255,0.6)' : '1px dashed rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }}
                >
                  {renderShelf().map((el, i) => <div key={i} data-card>{el}</div>)}
                  {currentShelf.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: '#7C3A10' }}>
                      여기로 카드를 끌어다 놓으세요
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </div>

        {/* 하단 */}
        <div style={{ flexShrink: 0, padding: '12px 16px 32px', borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', gap: 8 }}>
          <button onClick={handleReset} style={{
            height: 48, padding: '0 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.5)', color: '#7C3A10', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: ff,
          }}>초기화</button>
          <button onClick={onClose} style={{
            flex: 1, height: 48, borderRadius: 12, border: 'none',
            background: '#D4703A', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: ff,
          }}>완료</button>
        </div>
      </div>

      {/* 플로팅 드래그 카드 */}
      {drag && dragWidget && (
        <div style={{
          position: 'fixed',
          left: drag.x,
          top: drag.y,
          width: drag.width,
          zIndex: 1100,
          pointerEvents: 'none',
          transform: 'scale(1.04) rotate(1.5deg)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          borderRadius: 14,
          background: '#fff',
          transition: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
            <Icon icon="ph:dots-six-vertical" width={20} height={20} color="#94A3B8" />
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${dragWidget.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{dragWidget.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>{dragWidget.title}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{dragWidget.sub}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
