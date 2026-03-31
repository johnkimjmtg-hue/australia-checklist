// ─────────────────────────────────────────────
// BucketSheet.tsx
// 홈페이지에서 버킷리스트를 바텀시트로 표시
// src/components/BucketSheet.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AppState, TripInfo } from '../store/state'
import { getCachedChecklist } from '../lib/dataCache'
import BucketCheckView from '../pages/BucketCheckView'

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

export default function BucketSheet({ state, setState, trip, onClose }: Props) {
  const [dbItems, setDbItems] = useState<DBItem[]>([])

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.length) setDbItems(cached)
  }, [])

  const ITEMS: CheckItem[] = dbItems.map(i => ({
    id: i.id, categoryId: i.category_id, label: i.label, emoji: '📌',
  }))

  const hasItems = Object.keys(state.selected).length > 0
  const sheetHeight = hasItems ? '90vh' : 'auto'

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }}
      />

      {/* 바텀시트 */}
      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:430,
        height: sheetHeight,
        maxHeight: '90vh',
        background:'#EFFCFC',
        borderRadius:20,
        zIndex:801,
        animation:'slideUpSheet 0.25s ease',
        boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* 핸들 + 닫기 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 16px 0', position:'relative' }}>
          <div style={{ width:40, height:4, borderRadius:999, background:'rgba(0,0,0,0.15)' }} />
          <button
            onClick={onClose}
            style={{
              position:'absolute', right:16, top:8,
              width:28, height:28, borderRadius:'50%',
              background:'rgba(255,255,255,0.6)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', WebkitTapHighlightColor:'transparent',
            }}
          >
            <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
          </button>
        </div>

        {/* BucketCheckView */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <BucketCheckView
            state={state}
            trip={trip}
            setState={setState}
            items={ITEMS}
            dbItems={dbItems}
            onAchievedChange={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onShare={() => {}}
            onLanding={onClose}
          />
        </div>
      </div>
    </>
  )
}
