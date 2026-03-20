import { useState, useEffect, useMemo, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

// ── 공유 상수
interface Product {
  id: string
  category_id: number
  name: string
  brand: string
  description: string
  price_range: '$' | '$$' | '$$$'
  where_to_buy: string[]
  tags: string[]
  image_url: string | null
  is_featured: boolean
  sort_order: number
}

const PRICE_LABEL: Record<string, string> = { '$': '저렴', '$$': '보통', '$$$': '프리미엄' }
const PRICE_COLOR: Record<string, string> = { '$': '#16A34A', '$$': '#D97706', '$$$': '#7C3AED' }
const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  '인기':          { bg: '#FEF3C7', color: '#D97706' },
  '강추':          { bg: '#DCFCE7', color: '#16A34A' },
  '필수템':        { bg: '#FEE2E2', color: '#DC2626' },
  '선물용':        { bg: '#EDE9FE', color: '#7C3AED' },
  '선물':          { bg: '#EDE9FE', color: '#7C3AED' },
  '프리미엄':      { bg: '#F0F9FF', color: '#0369A1' },
  '체험':          { bg: '#FFF7ED', color: '#C2410C' },
  '기념':          { bg: '#F0FDF4', color: '#15803D' },
  '가성비':        { bg: '#FFF1F2', color: '#E11D48' },
  '안사면 후회':   { bg: '#FFF7ED', color: '#EA580C' },
  '없어서 못삼':   { bg: '#FDF4FF', color: '#A21CAF' },
  '한국보다 저렴': { bg: '#F0FDF4', color: '#15803D' },
  '호주 한정':     { bg: '#EFF6FF', color: '#1D4ED8' },
  '약국 인기':     { bg: '#ECFDF5', color: '#059669' },
  '마트 필수':     { bg: '#FFFBEB', color: '#B45309' },
  '현지인 추천':   { bg: '#FFF1F2', color: '#BE123C' },
  '유아동':        { bg: '#F0F9FF', color: '#0284C7' },
  '건강식품':      { bg: '#F0FDF4', color: '#16A34A' },
}

// ── Props
type Props = {
  onBack: () => void
  onLanding: () => void
  myList: string[]
  myChecked: Record<string, boolean>
  onMyListChange: (next: string[]) => void
  onMyCheckedChange: (next: Record<string, boolean>) => void
}

export default function MyShoppingView({ onBack, onLanding, myList, myChecked, onMyListChange, onMyCheckedChange }: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selProduct, setSelProduct]   = useState<Product | null>(null)
  const [loading, setLoading]         = useState(true)
  const [petalTrigger, setPetalTrigger] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  const SHOPPING_MSGS = [
    '지갑이 열릴 준비가 됐나요?',
    '카트에 담아요, 후회는 나중에!',
    '쇼핑은 멈출 수 없어요!',
    '조금만 더, 거의 다 왔어요!',
    '오늘의 득템을 향해!',
  ]
  const pageRef = useRef<HTMLDivElement>(null)
  const [footerWidth, setFooterWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const updateWidth = () => {
      if (pageRef.current) setFooterWidth(pageRef.current.getBoundingClientRect().width)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { setAllProducts(data ?? []); setLoading(false) })
  }, [])

  const myProducts = useMemo(() =>
    myList.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[]
  , [myList, allProducts])

  const checkedCount = myList.filter(id => myChecked[id]).length
  const total        = myList.length
  const pct          = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  const removeFromMyList = (id: string) => {
    onMyListChange(myList.filter(i => i !== id))
    const nextChecked = { ...myChecked }
    delete nextChecked[id]
    onMyCheckedChange(nextChecked)
  }

  const toggleChecked = (id: string) => {
    const wasChecked = !!myChecked[id]
    const next = { ...myChecked, [id]: !myChecked[id] }
    if (!next[id]) delete next[id]
    onMyCheckedChange(next)
    if (!wasChecked) {
      setPetalTrigger(t => t + 1)
      setMsgIndex(i => (i + 1) % 5)
    }
  }

  const addToMyList = (id: string) => {
    if (myList.includes(id)) return
    onMyListChange([...myList, id])
  }

  return (
    <div ref={pageRef} style={{
      background:'#e8e8e8', minHeight:'100vh',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      maxWidth:480, margin:'0 auto', position:'relative',
    }}>
      <style>{`
        @keyframes slideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes petalFall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity:1; }
          80%  { opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity:0; }
        }
        @keyframes petalSway {
          0%   { margin-left: 0px; }
          25%  { margin-left: 20px; }
          75%  { margin-left: -20px; }
          100% { margin-left: 0px; }
        }
        .my-item { transition: all 0.2s ease; }
        .my-item:active { transform: scale(0.98); }
      `}</style>

      {/* 꽃가루 애니메이션 */}
      <PetalBurst trigger={petalTrigger} />

      {/* ── 진행 카드 */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'#e8e8e8', padding:'16px 16px 0' }}>
        <div style={{
          background:'#e8b8e8',
          borderRadius:12,
          boxShadow:'inset 3px 3px 8px #c898c8, inset -2px -2px 6px #f8d8f8',
          padding:'20px', display:'flex', alignItems:'center', gap:20,
          position:'relative', overflow:'hidden',
        }}>
          {/* 선물박스 그리드 */}
          <GiftBoxProgress total={total} checkedCount={checkedCount} myList={myList} myChecked={myChecked} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#2d1f2d', marginBottom:4, lineHeight:1.2 }}>내 쇼핑리스트</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
              <span style={{ fontSize:28, fontWeight:800, color:'#2d1f2d', lineHeight:1 }}>{checkedCount}</span>
              <span style={{ fontSize:17, fontWeight:600, color:'#5a3a5a' }}>/{total}개 구매 완료</span>
            </div>
            <div style={{ fontSize:13, color:'#5a3a5a', lineHeight:1.5 }}>
              {pct === 100
                ? '쇼핑 완료! 모든 상품을 구매했어요 🎉'
                : pct > 0
                ? SHOPPING_MSGS[msgIndex]
                : '찜한 상품을 체크하며 쇼핑하세요!'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 필터 */}
      <div style={{ padding:'14px 16px 0', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600, flexShrink:0 }}>
          {total > 0 ? `${total}개 찜` : '아직 찜한 상품이 없어요'}
        </span>
      </div>

      {/* ── 리스트 */}
      <div style={{ padding:'12px 16px 130px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#94A3B8', fontSize:14 }}>불러오는 중...</div>
        ) : total === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Icon icon="ph:shopping-cart-simple" width={48} height={48} color="#C8C8C8" />
            <div style={{ marginTop:12, fontSize:15, fontWeight:700, color:'#94A3B8' }}>찜한 상품이 없어요</div>
            <div style={{ marginTop:6, fontSize:13, color:'#C8C8C8' }}>쇼핑리스트에서 상품을 찜해보세요!</div>
          </div>
        ) : (
          myProducts.map(p => {
            const checked = !!myChecked[p.id]
            return (
              <div key={p.id} className="my-item" style={{
                display:'flex', alignItems:'stretch',
                borderRadius:14,
                background: checked ? '#fff0f5' : '#fff',
                border:'1px solid #C8C8C8',
                borderLeft: checked ? '4px solid #FF6B9D' : '4px solid #CBD5E1',
                transition:'all 0.3s', overflow:'hidden',
              }}>
                {/* 이미지 6:4 */}
                <div onClick={() => setSelProduct(p)} style={{
                  width:110, flexShrink:0,
                  background: p.image_url ? 'none' : '#f0f0f0',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden', cursor:'pointer',
                  position:'relative',
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <Icon icon="ph:shopping-bag" width={32} height={32} color="#CBD5E1" />
                  }
                  {/* 돋보기 아이콘 */}
                  <div style={{
                    position:'absolute', top:6, right:6,
                    width:24, height:24, borderRadius:'50%',
                    background:'rgba(0,0,0,0.35)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Icon icon="ph:magnifying-glass-bold" width={13} height={13} color="#fff" />
                  </div>
                </div>

                {/* 텍스트 */}
                <div onClick={() => setSelProduct(p)} style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center', gap:4, cursor:'pointer', padding:'12px 8px 12px 12px' }}>
                  <span style={{
                    fontSize:15, fontWeight: checked ? 700 : 600,
                    color: checked ? '#94A3B8' : '#0F172A',
                    textDecoration: checked ? 'line-through' : 'none',
                    lineHeight:1.4,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{p.name}</span>
                  {p.description && (
                    <span style={{
                      fontSize:11, color:'#94A3B8', lineHeight:1.4,
                      overflow:'hidden', textOverflow:'ellipsis',
                      display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical',
                    }}>{p.description}</span>
                  )}
                  <span style={{ fontSize:11, color:'#B0B8C1' }}>{p.brand}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, fontWeight:800, color: checked ? '#CBD5E1' : PRICE_COLOR[p.price_range] ?? '#475569' }}>
                      {p.price_range} · {PRICE_LABEL[p.price_range]}
                    </span>
                    {p.tags[0] && (
                      <span style={{
                        fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4,
                        background: TAG_COLOR[p.tags[0]]?.bg ?? '#F1F5F9',
                        color: TAG_COLOR[p.tags[0]]?.color ?? '#475569',
                      }}>{p.tags[0]}</span>
                    )}
                  </div>
                </div>

                {/* 오른쪽 - 구매 배지 + 삭제 */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', flexShrink:0, padding:'12px 12px 12px 0' }}>
                  {/* 구매 배지 */}
                  <div onClick={() => toggleChecked(p.id)} style={{
                    display:'flex', alignItems:'center', gap:3,
                    padding:'4px 8px', borderRadius:6, cursor:'pointer',
                    background: checked ? '#FF6B9D' : '#f0f0f0',
                    border: `1px solid ${checked ? '#FF6B9D' : '#D0D0D0'}`,
                    transition:'all 0.2s', whiteSpace:'nowrap',
                  }}>
                    <span style={{ fontSize:10, fontWeight:700, color: checked ? '#fff' : '#B0B0B0' }}>구매</span>
                    <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke={checked ? '#fff' : '#C8C8C8'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* 삭제 */}
                  <button onClick={() => setDeleteConfirmId(p.id)} style={{
                    background:'none', border:'none', cursor:'pointer', padding:2,
                    display:'flex', alignItems:'center',
                  }}>
                    <Icon icon="ph:trash" width={18} height={18} color="#94A3B8" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* 전체 완료 축하 */}
      </div>

      {/* ── 하단 버튼 */}
      <div style={{
        position:'fixed', bottom:0,
        left:'50%', transform:'translateX(-50%)',
        width: footerWidth ?? '100%',
        padding:'12px 14px 20px',
        background:'#e8e8e8', zIndex:20, boxSizing:'border-box',
        display:'flex', gap:8, borderTop:'1px solid #C8C8C8',
      }}>
        <button onClick={onBack} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#FF6B9D',
          fontSize:14, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:shopping-bag" width={18} height={18} color="#FF6B9D" />
          상품 추가하기
        </button>
        <button onClick={onLanding} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#1B6EF3',
          fontSize:14, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:check-circle" width={18} height={18} color="#1B6EF3" />
          저장하고 나가기
        </button>
        <button onClick={() => setShowMoreMenu(true)} style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          border:'none', background:'#e8e8e8',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:dots-three-vertical" width={20} height={20} color="#64748B" />
        </button>
      </div>

      {/* ── 더보기 모달 */}
      {showMoreMenu && (
        <div style={{
          position:'fixed', inset:0, zIndex:100,
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)',
          display:'flex', alignItems:'flex-end', justifyContent:'center',
        }} onClick={() => setShowMoreMenu(false)}>
          <div style={{
            width:'100%', maxWidth:390,
            background:'#e8e8e8', borderRadius:'20px 20px 0 0',
            padding:'20px 16px 36px',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'0 auto 20px' }} />
            <div style={{ fontSize:13, fontWeight:800, color:'#94A3B8', marginBottom:14, letterSpacing:0.5 }}>더보기</div>
            <button onClick={() => { setShowMoreMenu(false); setShowReceipt(true) }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#1B6EF3',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px', marginBottom:10,
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:share-network" width={18} height={18} color="#1B6EF3" />공유하기
            </button>
            <button onClick={() => { setShowMoreMenu(false); setShowDeleteAll(true) }} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#e8e8e8', color:'#DC2626',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px',
              boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:trash" width={18} height={18} color="#DC2626" />리스트 삭제하기
            </button>
          </div>
        </div>
      )}

      {/* ── 전체 삭제 확인 팝업 */}
      {showDeleteAll && (
        <>
          <div onClick={() => setShowDeleteAll(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:700 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#e8e8e8', borderRadius:20, padding:'28px 24px 20px',
            zIndex:701, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
            boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:8 }}>리스트를 삭제할까요?</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.5 }}>
              내 쇼핑리스트의 모든 상품이 삭제됩니다.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowDeleteAll(false)} style={{
                flex:1, height:48, borderRadius:10, border:'none',
                background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:600, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>취소</button>
              <button onClick={() => {
                onMyListChange([])
                onMyCheckedChange({})
                setShowDeleteAll(false)
                onBack()
              }} style={{
                flex:2, height:48, borderRadius:10, border:'none',
                background:'#e8e8e8', color:'#DC2626', fontSize:14, fontWeight:700, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>삭제하기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 삭제 확인 팝업 */}
      {deleteConfirmId && (() => {
        const p = myProducts.find(x => x.id === deleteConfirmId)
        return (
          <>
            <div onClick={() => setDeleteConfirmId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:700 }} />
            <div style={{
              position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              background:'#e8e8e8', borderRadius:20, padding:'28px 24px 20px',
              zIndex:701, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
              boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
            }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:8 }}>상품을 삭제할까요?</div>
              {p && <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.5 }}>
                <span style={{ fontWeight:700, color:'#FF6B9D' }}>{p.name}</span>을<br/>내 쇼핑리스트에서 삭제합니다.
              </div>}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setDeleteConfirmId(null)} style={{
                  flex:1, height:48, borderRadius:10, border:'none',
                  background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:600, cursor:'pointer',
                  boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                }}>취소</button>
                <button onClick={() => { removeFromMyList(deleteConfirmId); setDeleteConfirmId(null) }} style={{
                  flex:2, height:48, borderRadius:10, border:'none',
                  background:'#e8e8e8', color:'#DC2626', fontSize:14, fontWeight:700, cursor:'pointer',
                  boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                }}>삭제하기</button>
              </div>
            </div>
          </>
        )
      })()}

      {/* ── 공유 영수증 모달 */}
      {showReceipt && (
        <ShoppingReceiptModal
          myProducts={myProducts}
          myChecked={myChecked}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* ── 상품 상세 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, background:'#e8e8e8',
            borderRadius:'20px 20px 0 0', zIndex:601,
            animation:'slideUp 0.3s ease', maxHeight:'85vh', overflowY:'auto',
          }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{
              width:'100%', height:220,
              background: selProduct.image_url ? 'none' : 'linear-gradient(135deg, #e0e0e0, #d0d0d0)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
            }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={60} height={60} color="#94A3B8" />
              }
            </div>
            <div style={{ padding:'16px 18px 40px' }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                {selProduct.tags.map(tag => (
                  <span key={tag} style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6, background: TAG_COLOR[tag]?.bg ?? '#e8e8e8', color: TAG_COLOR[tag]?.color ?? '#475569' }}>{tag}</span>
                ))}
                <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6, background:'#e8e8e8', color: PRICE_COLOR[selProduct.price_range] ?? '#475569', border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? '#C8C8C8'}`, marginLeft:'auto' }}>
                  {selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}
                </span>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selProduct.name}</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{selProduct.brand}</div>
              {selProduct.description && (
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>{selProduct.description}</div>
              )}
              {selProduct.where_to_buy.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map(store => (
                      <span key={store} style={{ fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8, background:'#e8e8e8', color:'#475569', border:'1px solid #C8C8C8' }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* 찜 취소 / 추가 버튼 */}
              <button onClick={() => {
                myList.includes(selProduct.id) ? removeFromMyList(selProduct.id) : addToMyList(selProduct.id)
              }} style={{
                width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer',
                background:'#e8e8e8', color:'#FF6B9D',
                fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom:10,
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon={myList.includes(selProduct.id) ? 'ph:check-circle-fill' : 'ph:heart'} width={18} height={18} color="#FF6B9D" />
                {myList.includes(selProduct.id) ? '찜 취소하기' : '내 쇼핑리스트에 찜하기'}
              </button>
              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:50, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#94A3B8', fontSize:15, fontWeight:700, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 꽃가루 컴포넌트
interface Petal { id: number; x: number; color: string; size: number; duration: number; delay: number; shape: string }

function PetalBurst({ trigger }: { trigger: number }) {
  const [petals, setPetals] = useState<Petal[]>([])
  const prev = useRef(0)

  useEffect(() => {
    if (trigger === 0 || trigger === prev.current) return
    prev.current = trigger
    const colors = ['#FF6B9D','#FF9EC4','#FFB3D9','#FF85B3','#FFC1D9','#FF4D94','#FFAAD4','#39d353','#7FFFB2','#FFCD00','#FFE566','#A78BFA']
    const shapes = ['🌸','🌺','🌼','🌻','🌷','✿','❀','🎀','💮']
    setPetals(Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 12 + Math.random() * 14,
      duration: 2.5 + Math.random() * 1.5,
      delay: Math.random() * 0.5,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    })))
    setTimeout(() => setPetals([]), 3000)
  }, [trigger])

  if (!petals.length) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
      {petals.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          top: -20,
          left: `${p.x}%`,
          fontSize: p.size,
          animation: `petalFall ${p.duration}s ease-in ${p.delay}s forwards, petalSway ${p.duration * 0.5}s ease-in-out ${p.delay}s infinite`,
          userSelect:'none',
        }}>
          {p.shape}
        </div>
      ))}
    </div>
  )
}

// ── 공유 영수증 모달
const PRICE_LABEL_R: Record<string, string> = { '$': '저렴', '$$': '보통', '$$$': '프리미엄' }
const PRICE_COLOR_R: Record<string, string> = { '$': '#16A34A', '$$': '#D97706', '$$$': '#7C3AED' }

function ShoppingReceiptModal({ myProducts, myChecked, onClose }: {
  myProducts: any[]
  myChecked: Record<string, boolean>
  onClose: () => void
}) {
  const checkedCount = myProducts.filter(p => myChecked[p.id]).length
  const total = myProducts.length
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`

  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [ready, setReady] = useState(false)
  const blobRef = useRef<Blob | null>(null)

  const capture = async () => {
    const el = document.getElementById('shopping-share-card')
    if (!el) return null
    // @ts-ignore
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, { scale: 3, backgroundColor: '#e8e8e8', useCORS: true })
    return new Promise<Blob>(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const blob = await capture()
      blobRef.current = blob ?? null
      setReady(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const blob = blobRef.current ?? await capture()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = '호주쇼핑리스트.png'; a.click(); URL.revokeObjectURL(url)
    }
    setSaving(false)
  }

  const handleShare = async () => {
    if (!blobRef.current) return
    setSharing(true)
    try {
      const file = new File([blobRef.current], '호주쇼핑리스트.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: '호주 여행정보 사이트 👉 https://hojugaja.com/app?tab=shopping' })
      } else if (navigator.share) {
        await navigator.share({ title: '내 쇼핑리스트', url: 'https://hojugaja.com/app?tab=shopping' })
      } else {
        await handleSave()
      }
    } catch {}
    setSharing(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }} />
      <div style={{ position:'relative', zIndex:1, overflowY:'auto', height:'100%', padding:'28px 16px 120px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        {/* 닫기 */}
        <button onClick={onClose} style={{
          position:'sticky', top:0, alignSelf:'flex-end',
          width:32, height:32, borderRadius:'50%',
          background:'rgba(255,255,255,0.9)', border:'none',
          fontSize:16, color:'#5A7090', marginBottom:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
        }}>✕</button>

        {/* ── 공유 카드 ── */}
        <div id="shopping-share-card" style={{ width:320, background:'#e8e8e8', padding:'12px', borderRadius:20 }}>

          {/* 상황판 */}
          <div style={{
            background:'#e8b8e8', borderRadius:12, marginBottom:8,
            boxShadow:'inset 3px 3px 8px #c898c8, inset -2px -2px 6px #f8d8f8',
            padding:'16px', display:'flex', alignItems:'center', gap:16,
          }}>
            {/* 선물박스 그리드 */}
            <MiniGiftGrid total={total} checkedCount={checkedCount} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#2d1f2d', marginBottom:2 }}>내 쇼핑리스트</div>
              <div style={{ fontSize:11, color:'#5a3a5a', marginBottom:4 }}>{dateStr}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                <span style={{ fontSize:22, fontWeight:800, color:'#2d1f2d' }}>{checkedCount}</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#5a3a5a' }}>/{total}개 구매 완료</span>
              </div>
            </div>
          </div>

          {/* 상품 목록 */}
          <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', marginBottom:8, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            {myProducts.map((p, i) => {
              const done = !!myChecked[p.id]
              return (
                <div key={p.id} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  borderBottom: i < myProducts.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: done ? '#fff0f5' : '#fff',
                }}>
                  {/* 체크 */}
                  <div style={{
                    width:18, height:18, borderRadius:4, flexShrink:0,
                    background: done ? '#FF6B9D' : '#fff',
                    border: done ? 'none' : '1.5px solid #CBD5E1',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {done && <svg width="10" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {/* 이미지 */}
                  <div style={{ width:32, height:32, borderRadius:6, overflow:'hidden', flexShrink:0, background:'#f0f0f0' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🛍️</div>
                    }
                  </div>
                  {/* 텍스트 */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: done ? '#94A3B8' : '#0F172A', textDecoration: done ? 'line-through' : 'none', lineHeight:1.4 }}>{p.name}</div>
                    <div style={{ fontSize:10, color: PRICE_COLOR_R[p.price_range] ?? '#475569', fontWeight:700 }}>{p.price_range} · {PRICE_LABEL_R[p.price_range]}</div>
                  </div>
                  {done && <span style={{ fontSize:9, fontWeight:700, color:'#FF6B9D', background:'#fff0f5', padding:'2px 6px', borderRadius:4, flexShrink:0 }}>구매✓</span>}
                </div>
              )
            })}
          </div>

          {/* 광고 카드 */}
          <div style={{ background:'linear-gradient(135deg, #FF6B9D, #e0437a)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:'#fff' }}>호주가자</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                호주 여행 정보 사이트 <Icon icon="mdi:kangaroo" width={13} height={13} color="#fff" />
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>www.hojugaja.com</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', marginTop:2 }}>나만의 쇼핑리스트를 만들어보세요</div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 14px 26px',
        background:'#e8e8e8',
        borderTop:'1.5px solid #D1D9E3', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)',
        display:'flex', gap:8, zIndex:2,
      }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex:1, height:46, borderRadius:12, cursor:'pointer',
          border:'1.5px solid #D1D9E3', background:'#fff',
          fontWeight:700, fontSize:13, color:'#FF6B9D',
          boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
        }}>{saving ? '저장 중...' : !ready ? '준비 중...' : '이미지 저장'}</button>
        <button onClick={handleShare} disabled={sharing} style={{
          flex:1, height:46, borderRadius:12, cursor:'pointer',
          border:'none', background:'linear-gradient(160deg, #FF85B3, #FF6B9D)',
          fontWeight:700, fontSize:13, color:'#fff',
          boxShadow:'0 4px 14px rgba(255,107,157,0.4)',
        }}>{sharing ? '공유 중...' : !ready ? '준비 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}


// ── 선물박스 프로그래스
function GiftBoxProgress({ total, checkedCount }: {
  total: number
  checkedCount: number
  myList: string[]
  myChecked: Record<string, boolean>
}) {
  const displayCount = Math.min(total, 16)

  // 고정 영역 110x110 안에서 박스 크기/레이아웃 결정
  const AREA = 110
  const cols = displayCount === 1 ? 1 : displayCount <= 4 ? 2 : displayCount <= 9 ? 3 : displayCount <= 16 ? 4 : 4
  const rows = Math.ceil(displayCount / cols)
  const gap = 4
  const boxSize = Math.min(
    Math.floor((AREA - gap * (cols - 1)) / cols),
    Math.floor((AREA - gap * (rows - 1)) / rows),
  )

  return (
    <div style={{
      flexShrink: 0,
      width: AREA, height: AREA,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes giftPop {
          0%   { transform: scale(0.5); opacity:0.5; }
          65%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity:1; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: gap,
        width: cols * (boxSize + gap) - gap,
        justifyContent: 'center',
        alignContent: 'center',
      }}>
        {Array.from({ length: displayCount }).map((_, i) => {
          const filled = i < checkedCount
          // 켜진 상태 (구매완료): 핑크 단색
          // 꺼진 상태 (미구매): 어두운 퍼플 단색 — 불꺼진 전광판
          const body = filled ? '#FF6B9D' : '#c4a8c4'
          const lid  = filled ? '#FF85B3' : '#d0b4d0'
          const rib  = filled ? '#ffffff' : '#e8d8e8'
          const knot = filled ? '#FF6B9D' : '#c4a8c4'

          return (
            <svg key={i} viewBox="0 0 100 115" width={boxSize} height={Math.round(boxSize * 1.05)}
              style={{
                animation: filled ? `giftPop 0.35s cubic-bezier(.36,.07,.19,.97) both` : 'none',
                filter: filled ? 'drop-shadow(0 3px 8px rgba(255,107,157,0.5))' : 'none',
              }}>
              {/* 박스 본체 */}
              <rect x="10" y="42" width="80" height="62" rx="5" fill={body}/>
              {/* 뚜껑 */}
              <rect x="6" y="24" width="88" height="22" rx="5" fill={lid}/>
              {/* 리본 세로 */}
              <rect x="43" y="24" width="14" height="80" fill={rib}/>
              {/* 리본 가로 */}
              <rect x="6" y="29" width="88" height="12" fill={rib}/>
              {/* 나비매듭 왼쪽 */}
              <path d="M50,18 Q34,4 22,10 Q18,18 30,22 Q40,24 50,18Z" fill={rib}/>
              {/* 나비매듭 오른쪽 */}
              <path d="M50,18 Q66,4 78,10 Q82,18 70,22 Q60,24 50,18Z" fill={rib}/>
              {/* 매듭 중앙 */}
              <circle cx="50" cy="19" r="7" fill={knot}/>
            </svg>
          )
        })}
      </div>
      {total > 16 && (
        <div style={{ fontSize:10, color:'#5a3a5a', fontWeight:700, textAlign:'center', marginTop:2 }}>
          +{total - 16}개
        </div>
      )}
    </div>
  )
}

// ── 공유 카드용 미니 선물박스 그리드
function MiniGiftGrid({ total, checkedCount }: { total: number; checkedCount: number }) {
  const displayCount = Math.min(total, 16)
  const AREA = 80
  const cols = displayCount === 1 ? 1 : displayCount <= 4 ? 2 : displayCount <= 9 ? 3 : displayCount <= 16 ? 4 : 4
  const rows = Math.ceil(displayCount / cols)
  const gap = 3
  const boxSize = Math.min(
    Math.floor((AREA - gap * (cols - 1)) / cols),
    Math.floor((AREA - gap * (rows - 1)) / rows),
  )
  return (
    <div style={{ flexShrink:0, width:AREA, height:AREA, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap, width: cols * (boxSize + gap) - gap, justifyContent:'center', alignContent:'center' }}>
        {Array.from({ length: displayCount }).map((_, i) => {
          const filled = i < checkedCount
          const body = filled ? '#FF6B9D' : '#c4a8c4'
          const lid  = filled ? '#FF85B3' : '#d0b4d0'
          const rib  = filled ? '#ffffff' : '#e8d8e8'
          const knot = filled ? '#FF6B9D' : '#c4a8c4'
          return (
            <svg key={i} viewBox="0 0 100 115" width={boxSize} height={Math.round(boxSize * 1.05)}>
              <rect x="10" y="42" width="80" height="62" rx="5" fill={body}/>
              <rect x="6" y="24" width="88" height="22" rx="5" fill={lid}/>
              <rect x="43" y="24" width="14" height="80" fill={rib}/>
              <rect x="6" y="29" width="88" height="12" fill={rib}/>
              <path d="M50,18 Q34,4 22,10 Q18,18 30,22 Q40,24 50,18Z" fill={rib}/>
              <path d="M50,18 Q66,4 78,10 Q82,18 70,22 Q60,24 50,18Z" fill={rib}/>
              <circle cx="50" cy="19" r="7" fill={knot}/>
            </svg>
          )
        })}
      </div>
    </div>
  )
}
