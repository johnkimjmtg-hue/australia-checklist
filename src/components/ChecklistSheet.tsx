// ─────────────────────────────────────────────
// ChecklistSheet.tsx
// 체크리스트를 바텀시트로 표시
// src/components/ChecklistSheet.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { AppState } from '../store/state'
import { Icon } from '@iconify/react'
import ChecklistPage from '../pages/ChecklistPage'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'
import { getCachedBusinesses, getCachedShopping } from '../lib/dataCache'

type DBItem = {
  id: string; category_id: string; label: string; icon: string | null
  sort_order: number; address?: string | null; description?: string | null
  related_business_id?: string | null; related_business_ids?: string[] | null
  image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null
}

type Props = {
  state: AppState
  setState: (s: AppState) => void
  onClose: () => void
}

export default function ChecklistSheet({ state, setState, onClose }: Props) {
  const [detailItem, setDetailItem] = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [detailProds, setDetailProds] = useState<any[]>([])

  const handleDetailItem = (item: DBItem | null) => {
    setDetailItem(item)
    if (item?.related_business_ids?.length) {
      const cached = getCachedBusinesses()
      setDetailBizCards(cached?.filter((b: Business) => item.related_business_ids!.includes(b.id)) ?? [])
    } else setDetailBizCards([])
    if ((item?.related_product_ids?.length ?? 0) > 0) {
      const cached = getCachedShopping()
      setDetailProds(cached?.products.filter((p: any) => item!.related_product_ids!.includes(p.id)).slice(0,5) ?? [])
    } else setDetailProds([])
  }

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }}
      />

      {/* 바텀시트 - 약관 팝업과 동일한 스타일 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#ffffff', borderRadius:'20px 20px 0 0',
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

        {/* X 닫기 버튼 */}
        <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%',
            background:'rgba(0,0,0,0.08)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
          }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* ChecklistPage */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <ChecklistPage
            state={state}
            setState={setState}
            initialTab="bucketlist"
            onGoHome={onClose}
            embedded
            onDetailItem={handleDetailItem}
          />
        </div>
      </div>
      {/* 상세 팝업 — ChecklistSheet 바깥 레벨 */}
      {detailItem && (
        <>
          <div onClick={() => setDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.5)' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430, background:'#ffffff',
            borderRadius:'20px 20px 0 0', maxHeight:'72vh', overflowY:'auto',
            zIndex:1101, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            display:'flex', flexDirection:'column',
            fontFamily:"-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif",
          }}>
            <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setDetailItem(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {detailItem.image_url && (
                <div style={{ width:'100%', height:220, overflow:'hidden' }}>
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
                {detailProds.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#1565A0', marginBottom:8 }}>🛍️ 관련 상품</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {detailProds.map((prod: any) => (
                        <div key={prod.id} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(0,131,143,0.06)', borderRadius:12, padding:12 }}>
                          {prod.image_url && <img src={prod.image_url} alt="" style={{ width:44, height:44, borderRadius:8, objectFit:'cover', flexShrink:0 }} />}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#0D3349', marginBottom:2 }}>{prod.name}</div>
                            <div style={{ fontSize:11, color:'#7BAAB5' }}>{prod.brand}</div>
                          </div>
                        </div>
                      ))}
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
