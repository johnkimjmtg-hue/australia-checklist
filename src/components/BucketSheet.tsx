// ─────────────────────────────────────────────
// BucketSheet.tsx
// src/components/BucketSheet.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AppState, TripInfo, resetBucket } from '../store/state'
import { getCachedBusinesses } from '../lib/dataCache'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'
import { Icon } from '@iconify/react'
import { getCachedChecklist } from '../lib/dataCache'
import { supabase } from '../lib/supabase'
import BucketCheckView from '../pages/BucketCheckView'
import ChecklistPage from '../pages/ChecklistPage'
import { ITEMS as LOCAL_ITEMS } from '../data/checklist'

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
  const [detailItem, setDetailItem] = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.items?.length) {
      setDbItems(cached.items)
    } else {
      // 캐시 없으면 supabase에서 직접 가져오기
      supabase.from('checklist_items').select('*').eq('is_active', true).order('sort_order')
        .then(({ data }) => { if (data?.length) setDbItems(data) })
    }
  }, [])

  const handleBackToBucket = () => {
    setView('bucket')
    setDetailItem(null)
  }

  const ITEMS: CheckItem[] = dbItems.length > 0
    ? dbItems.map(i => ({ id: i.id, categoryId: i.category_id, label: i.label, emoji: '📌' }))
    : LOCAL_ITEMS.map(i => ({ id: i.id, categoryId: i.categoryId, label: i.label, emoji: i.emoji }))

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#ffffff', borderRadius:'20px 20px 0 0',
        maxHeight:'calc(100dvh - 20px)', overflowY:'auto', zIndex:801,
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
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>
              {view === 'bucket' ? '🗺️ 버킷리스트' : '✏️ 항목 추가/수정'}
            </div>
            {view === 'bucket' && (
              <button onClick={() => setView('checklist')} style={{ height:26, paddingLeft:10, paddingRight:10, borderRadius:20, border:'none', background:'#29B6D0', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:3, cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:pencil-simple" width={12} height={12} color="#fff" />항목 추가/수정
              </button>
            )}
            {view === 'checklist' && (
              <button onClick={handleBackToBucket} style={{ height:26, paddingLeft:10, paddingRight:10, borderRadius:20, border:'none', background:'#29B6D0', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:3, cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:arrow-left" width={12} height={12} color="#fff" />내 버킷리스트 보기
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
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
              onDetailItem={(item) => {
                setDetailItem(item)
                if (item?.related_business_ids?.length) {
                  const cached = getCachedBusinesses()
                  setDetailBizCards(cached?.filter((b: Business) => item.related_business_ids!.includes(b.id)) ?? [])
                } else setDetailBizCards([])
              }}
            />
          ) : (
            <ChecklistPage
              state={state}
              setState={setState}
              initialTab="bucketlist"
              onGoHome={handleBackToBucket}
              embedded
              onDetailItem={(item) => {
                setDetailItem(item)
                if (item?.related_business_ids?.length) {
                  const cached = getCachedBusinesses()
                  setDetailBizCards(cached?.filter((b: Business) => item.related_business_ids!.includes(b.id)) ?? [])
                } else setDetailBizCards([])
              }}
            />
          )}
        </div>
      </div>
      {/* 상세보기 팝업 - BucketSheet 바깥 레벨 */}
      {detailItem && (
        <>
          <div onClick={() => setDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430, background:'#ffffff',
            borderRadius:'20px 20px 0 0', maxHeight:'72vh', overflowY:'auto',
            zIndex:1101, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            fontFamily:"-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif",
            display:'flex', flexDirection:'column',
          }}>
            {/* 헤더 */}
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setDetailItem(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
            {detailItem.image_url && (
              <div style={{ width:'100%', height:220, overflow:'hidden', marginTop:8 }}>
                <img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <div style={{ padding:'16px 16px 40px' }}>
              <div style={{ fontSize:18, fontWeight:700, color:'#0D3349', lineHeight:1.4, marginBottom:12 }}>{detailItem.label}</div>
              {detailItem.description && <div style={{ fontSize:14, color:'#475569', lineHeight:1.7, marginBottom:16, whiteSpace:'pre-wrap' }}>{detailItem.description}</div>}
              {detailItem.tips && (
                <div style={{ background:'rgba(41,182,208,0.12)', border:'1px solid rgba(0,131,143,0.15)', borderRadius:12, padding:12, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#29B6D0', marginBottom:4 }}>💡 현지인 팁</div>
                  <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {detailItem.address && (
                <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'rgba(41,182,208,0.12)', border:'1px solid rgba(0,131,143,0.15)', borderRadius:12, padding:12, marginBottom:16, cursor:'pointer', textAlign:'left' }}>
                  <Icon icon="ph:map-pin" width={16} height={16} color="#29B6D0" />
                  <div>
                    <div style={{ fontSize:11, color:'#7BAAB5' }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:13, color:'#29B6D0', fontWeight:700, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={13} height={13} color="#7BAAB5" style={{ marginLeft:'auto' }} />
                </button>
              )}
              {detailBizCards.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1565A0', marginBottom:8 }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {detailBizCards.map((biz: Business) => <BusinessCard key={biz.id} business={biz} />)}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
