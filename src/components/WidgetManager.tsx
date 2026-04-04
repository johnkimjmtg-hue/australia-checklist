// ─────────────────────────────────────────────
// WidgetManager.tsx
// src/components/WidgetManager.tsx
// 카드 관리 - @dnd-kit 기반 드래그
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

export const DEFAULT_WIDGETS: WidgetId[] = ['bucket', 'note']

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

type Props = { onClose: () => void; onSave: (widgets: WidgetId[]) => void }

function CardContent({ w }: { w: typeof ALL_WIDGETS[0] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
      <Icon icon="ph:dots-six-vertical" width={20} height={20} color="#94A3B8" style={{ flexShrink: 0 }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${w.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{w.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>{w.title}</div>
        <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.sub}</div>
      </div>
    </div>
  )
}

function SortableCard({ id, onRemove }: { id: WidgetId; onRemove: () => void }) {
  const w = ALL_WIDGETS.find(x => x.id === id)!
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.3 : 1,
          background: '#F8FAFC',
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        }}
      >
        {/* 핸들에만 listeners 적용 */}
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none', cursor: 'grab', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          <Icon icon="ph:dots-six-vertical" width={20} height={20} color="#94A3B8" />
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${w.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{w.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349' }}>{w.title}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.sub}</div>
        </div>
      </div>
      <button onClick={onRemove} style={{
        width: 28, height: 28, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: 'rgba(220,38,38,0.1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}>
        <Icon icon="ph:minus" width={14} height={14} color="#DC2626" />
      </button>
    </div>
  )
}

function ShelfCard({ id, onAdd }: { id: WidgetId; onAdd: () => void }) {
  const w = ALL_WIDGETS.find(x => x.id === id)!
  return (
    <div onClick={onAdd} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      background: 'rgba(255,255,255,0.6)', borderRadius: 14,
      border: '1px dashed rgba(212,112,58,0.3)', cursor: 'pointer',
    }}>
      <div style={{ width: 20, flexShrink: 0 }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${w.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, opacity: 0.6 }}>{w.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3A10', opacity: 0.7 }}>{w.title}</div>
        <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.sub}</div>
      </div>
      <div style={{ fontSize: 20, color: '#D4703A', fontWeight: 700, paddingRight: 4 }}>+</div>
    </div>
  )
}

export default function WidgetManager({ onClose, onSave }: Props) {
  const [active, setActive] = useState<WidgetId[]>(() => loadWidgets())
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)

  const shelf = ALL_WIDGETS.filter(w => !active.includes(w.id)).map(w => w.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as WidgetId)
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null)
    const { active: dragActive, over } = e
    if (!over || dragActive.id === over.id) return
    const oldIdx = active.indexOf(dragActive.id as WidgetId)
    const newIdx = active.indexOf(over.id as WidgetId)
    if (oldIdx === -1 || newIdx === -1) return
    const next = arrayMove(active, oldIdx, newIdx)
    setActive(next)
    saveWidgets(next)
    onSave(next)
  }

  const handleRemove = (id: WidgetId) => {
    if (active.length <= 1) return
    const next = active.filter(w => w !== id)
    setActive(next)
    saveWidgets(next)
    onSave(next)
  }

  const handleAdd = (id: WidgetId) => {
    const next = [...active, id]
    setActive(next)
    saveWidgets(next)
    onSave(next)
  }

  const handleReset = () => {
    const next = [...DEFAULT_WIDGETS]
    setActive(next)
    saveWidgets(next)
    onSave(next)
  }

  const draggingWidget = draggingId ? ALL_WIDGETS.find(w => w.id === draggingId) : null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', zIndex: 900 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'linear-gradient(180deg, #D4703A 0%, #F5C97A 40%, #F5D4BC 100%)',
        borderRadius: '20px 20px 0 0', height: '85vh', zIndex: 901,
        animation: 'slideUpSheet 0.25s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
        display: 'flex', flexDirection: 'column', fontFamily: ff,
      }}>
        <style>{`@keyframes slideUpSheet { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }`}</style>

        {/* 헤더 */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>⚙️ 카드 관리</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', minHeight: 0 }}>

          {/* 홈 화면 표시 중 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            홈 화면에 표시 중 ({active.length})
          </div>
          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: '10px', marginBottom: 20, border: '1.5px solid rgba(212,112,58,0.4)' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={active} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {active.map(id => (
                    <SortableCard key={id} id={id} onRemove={() => handleRemove(id)} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {draggingWidget && (
                  <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', opacity: 0.95 }}>
                    <CardContent w={draggingWidget} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

          {/* 카드 보관함 */}
          {shelf.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3A10' }}>카드 보관함</div>
                <div style={{ fontSize: 11, color: '#7C3A10', opacity: 0.7 }}>탭하면 홈에 추가돼요</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                {shelf.map(id => (
                  <ShelfCard key={id} id={id} onAdd={() => handleAdd(id)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 */}
        <div style={{ flexShrink: 0, padding: '12px 16px 32px', borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', gap: 8 }}>
          <button onClick={handleReset} style={{
            height: 48, padding: '0 20px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.5)', color: '#7C3A10',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
          }}>초기화</button>
          <button onClick={onClose} style={{
            flex: 1, height: 48, borderRadius: 12, border: 'none',
            background: '#D4703A', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: ff,
          }}>완료</button>
        </div>
      </div>
    </>
  )
}
