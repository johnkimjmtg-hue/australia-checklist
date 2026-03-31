// ─────────────────────────────────────────────
// BucketSheet.tsx
// src/components/BucketSheet.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AppState, TripInfo, resetBucket } from '../store/state'
import { getCachedChecklist } from '../lib/dataCache'
import BucketCheckView from '../pages/BucketCheckView'
import ChecklistPage from '../pages/ChecklistPage'

type DBItem = {
  id: string; category_id: string; label: string; icon: string | null
  sort_order: number; address?: string | null; description?: string | null
  related_business_id?: string | null; related_business_ids?: string[] | null
  image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null
}
type CheckItem = { id: string; categoryId: string; label: string; emoji: string }
type View = 'bucket' | 'checklist'

type Props = {
  trip: TripInfo
  // ✅ App.tsx에서 내려받아 동기화 유지
  state: AppState
  setState: (s: AppState) => void
  onClose: () => void
}

export default function BucketSheet({ trip, state, setState, onClose }: Props) {
  const [dbItems, setDbItems] = useState<DBItem[]>([])
  const [view, setView] = useState<View>('bucket')

  useEffect(() => {
    // ✅ getCachedChecklist()는 { categories, items } 객체 반환 — .items로 접근
    const cached = getCachedChecklist()
    if (cached?.items?.length) setDbItems(cached.items)
  }, [])

  const handleBackToBucket = () => {
    setView('bucket')
  }

  const ITEMS: CheckItem[] = dbItems.map(i => ({
    id: i.id, categoryId: i.category_id, label: i.label, emoji: '📌',
  }))

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'#ffffff', borderRadius:20,
        maxHeight:'85vh', overflowY:'auto', zIndex:801,
        animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column',
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 12px 0' }}>
          {view === 'checklist' ? (
            <button onClick={handleBackToBucket} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:'4px 6px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:16, color:'#0D3349' }}>‹</span>
              <span style={{ fontSize:13, color:'#0D3349', fontWeight:600 }}>버킷리스트</span>
            </button>
          ) : <div />}
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
          </button>
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {view === 'bucket' ? (
            <BucketCheckView
              state={state}
              trip={trip}
              setState={setState}
              items={ITEMS}
              dbItems={dbItems}
              onAchievedChange={() => {}}
              onEdit={() => setView('checklist')}
              onDelete={() => { const next = resetBucket(); setState(next) }}
              onShare={() => {}}
              onLanding={onClose}
            />
          ) : (
            <ChecklistPage
              state={state}
              setState={setState}
              initialTab="bucketlist"
              onGoHome={handleBackToBucket}
              embedded
            />
          )}
        </div>
      </div>
    </>
  )
}
