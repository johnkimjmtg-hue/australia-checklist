// ─────────────────────────────────────────────
// BucketSheet.tsx
// 버킷리스트 + 체크리스트를 한 바텀시트에서 전환
// src/components/BucketSheet.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AppState, TripInfo } from '../store/state'
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

type Props = {
  state: AppState
  setState: (s: AppState) => void
  trip: TripInfo
  onClose: () => void
}

type View = 'bucket' | 'checklist'

export default function BucketSheet({ state, setState, trip, onClose }: Props) {
  const [dbItems, setDbItems] = useState<DBItem[]>([])
  const [view, setView] = useState<View>('bucket')

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.length) setDbItems(cached)
  }, [])

  const ITEMS: CheckItem[] = dbItems.map(i => ({
    id: i.id, categoryId: i.category_id, label: i.label, emoji: '📌',
  }))

  return (
    <>
      {/* 오버레이 */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />

      {/* 바텀시트 */}
      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:398,
        background:'#EFFCFC', borderRadius:20,
        maxHeight:'85vh', overflowY:'auto', zIndex:801,
        animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column',
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 12px 0' }}>
          {view === 'checklist' ? (
            <button onClick={() => setView('bucket')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:'4px 6px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>
              <span style={{ fontSize:16, color:'#0D3349' }}>‹</span>
              <span style={{ fontSize:13, color:'#0D3349', fontWeight:600 }}>버킷리스트</span>
            </button>
          ) : (
            <div />
          )}
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%',
            background:'rgba(0,0,0,0.08)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
          }}>
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
              onDelete={() => {}}
              onShare={() => {}}
              onLanding={onClose}
            />
          ) : (
            <ChecklistPage
              state={state}
              setState={setState}
              initialTab="bucketlist"
              onGoHome={() => setView('bucket')}
              embedded
            />
          )}
        </div>
      </div>
    </>
  )
}
