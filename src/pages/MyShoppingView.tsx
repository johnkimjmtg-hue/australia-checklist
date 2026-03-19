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
  '인기':    { bg: '#FEF3C7', color: '#D97706' },
  '강추':    { bg: '#DCFCE7', color: '#16A34A' },
  '필수템':  { bg: '#FEE2E2', color: '#DC2626' },
  '선물용':  { bg: '#EDE9FE', color: '#7C3AED' },
  '프리미엄':{ bg: '#F0F9FF', color: '#0369A1' },
  '체험':    { bg: '#FFF7ED', color: '#C2410C' },
  '기념':    { bg: '#F0FDF4', color: '#15803D' },
}

// ── Props
type Props = {
  onBack: () => void
  myList: string[]
  myChecked: Record<string, boolean>
  onMyListChange: (next: string[]) => void
  onMyCheckedChange: (next: Record<string, boolean>) => void
}

export default function MyShoppingView({ onBack, myList, myChecked, onMyListChange, onMyCheckedChange }: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selProduct, setSelProduct]   = useState<Product | null>(null)
  const [loading, setLoading]         = useState(true)
  const [petalTrigger, setPetalTrigger] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

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
              <span style={{ fontSize:42, fontWeight:800, color:'#2d1f2d', lineHeight:1 }}>{checkedCount}</span>
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

                {/* 오른쪽 - 체크박스 + 삭제 */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', flexShrink:0, padding:'12px 12px 12px 0' }}>
                  <div onClick={() => toggleChecked(p.id)} style={{
                    width:26, height:26, borderRadius:6, flexShrink:0,
                    border: checked ? 'none' : '1.5px solid #C8C8C8',
                    background: checked ? '#FF6B9D' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.15s',
                    boxShadow: checked ? 'none' : '1px 1px 3px #d0d0d0, -1px -1px 3px #ffffff',
                  }}>
                    {checked && (
                      <svg width="12" height="9" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <button onClick={() => removeFromMyList(p.id)} style={{
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
          background:'#e8e8e8', color:'#1B6EF3',
          fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:shopping-bag" width={18} height={18} color="#1B6EF3" />
          쇼핑리스트 보기
        </button>
        <button onClick={() => setShowReceipt(true)} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#64748B',
          fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:share-network" width={18} height={18} color="#64748B" />
          공유하기
        </button>
      </div>

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
                background: myList.includes(selProduct.id) ? '#fff0f5' : '#FF6B9D',
                color: myList.includes(selProduct.id) ? '#FF6B9D' : '#fff',
                fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom:10,
                boxShadow: myList.includes(selProduct.id) ? 'inset 2px 2px 4px #d1fae5' : '0 4px 12px rgba(255,107,157,0.35)',
                WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon={myList.includes(selProduct.id) ? 'ph:check-circle-fill' : 'ph:heart'} width={18} height={18} color={myList.includes(selProduct.id) ? '#16A34A' : '#fff'} />
                {myList.includes(selProduct.id) ? '찜 취소하기' : '내 쇼핑리스트에 찜하기'}
              </button>
              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:44, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#94A3B8', fontSize:14, fontWeight:600, cursor:'pointer',
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
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`
  const siteUrl = 'https://hojugaja.com/app?tab=shopping'

  const handleShare = async () => {
    const text = [
      '🛍️ 내 호주 쇼핑리스트',
      '',
      ...myProducts.map(p => `${myChecked[p.id] ? '✅' : '⬜'} ${p.name} (${p.brand})`),
      '',
      `${checkedCount}/${total}개 완료`,
      '',
      `호주 쇼핑리스트 구경하기 👉 ${siteUrl}`,
    ].join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ title: '내 호주 쇼핑리스트', text })
      } else {
        await navigator.clipboard.writeText(text)
        alert('클립보드에 복사됐어요!')
      }
    } catch {}
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:700 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'calc(100% - 40px)', maxWidth:340,
        background:'#e8e8e8', borderRadius:20, zIndex:701,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* 헤더 */}
        <div style={{ background:'#FF6B9D', padding:'20px 20px 16px', textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:6 }}>🛍️</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:2 }}>내 쇼핑리스트</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.85)' }}>{dateStr} · {checkedCount}/{total}개 완료</div>
        </div>

        {/* 진행률 바 */}
        <div style={{ background:'#d0d0d0', height:6 }}>
          <div style={{
            height:'100%', background:'#FF6B9D',
            width: total > 0 ? `${(checkedCount/total)*100}%` : '0%',
            transition:'width 0.4s ease',
          }} />
        </div>

        {/* 상품 목록 */}
        <div style={{ maxHeight:280, overflowY:'auto', padding:'12px 16px' }}>
          {myProducts.map(p => (
            <div key={p.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 0', borderBottom:'1px solid #E2E8F0',
            }}>
              <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#f0f0f0', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:16 }}>🛍️</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:13, fontWeight:600,
                  color: myChecked[p.id] ? '#94A3B8' : '#0F172A',
                  textDecoration: myChecked[p.id] ? 'line-through' : 'none',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>{p.name}</div>
                <div style={{ fontSize:11, color: PRICE_COLOR_R[p.price_range] ?? '#475569', fontWeight:700 }}>
                  {p.price_range} · {PRICE_LABEL_R[p.price_range]}
                </div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:6, flexShrink:0,
                background: myChecked[p.id] ? '#FF6B9D' : '#E2E8F0',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {myChecked[p.id] && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 사이트 링크 */}
        <div style={{ margin:'0 16px 12px', padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #E2E8F0' }}>
          <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginBottom:2 }}>🔗 같이 쇼핑해요!</div>
          <div style={{ fontSize:12, color:'#1B6EF3', fontWeight:600 }}>{siteUrl}</div>
        </div>

        {/* 버튼 */}
        <div style={{ display:'flex', gap:8, padding:'0 16px 20px' }}>
          <button onClick={onClose} style={{
            flex:1, height:48, borderRadius:10, border:'none',
            background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:600, cursor:'pointer',
            boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          }}>닫기</button>
          <button onClick={handleShare} style={{
            flex:2, height:48, borderRadius:10, border:'none',
            background:'#FF6B9D', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow:'0 4px 12px rgba(255,107,157,0.4)',
          }}>
            <Icon icon="ph:share-network" width={18} height={18} color="#fff" />
            공유하기
          </button>
        </div>
      </div>
    </>
  )
}


// ── 선물박스 프로그래스
function GiftBoxProgress({ total, checkedCount }: {
  total: number
  checkedCount: number
  myList: string[]
  myChecked: Record<string, boolean>
}) {
  const displayCount = Math.min(total, 12)

  // 고정 영역 110x110 안에서 박스 크기/레이아웃 결정
  const AREA = 110
  const cols = displayCount === 1 ? 1 : displayCount <= 4 ? 2 : displayCount <= 9 ? 3 : 4
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
          const bodyMain = filled ? '#FF6B9D' : '#e0d0e0'
          const bodyDark = filled ? '#e0437a' : '#c8b0c8'
          const bodyLight= filled ? '#ffadd0' : '#ede0ed'
          const lidMain  = filled ? '#FF85B3' : '#e8d8e8'
          const lidDark  = filled ? '#e0437a' : '#c8b0c8'
          const ribMain  = filled ? '#ffffff' : '#f5eef5'
          const ribShad  = filled ? '#f0c0d8' : '#ddd0dd'
          const stroke   = filled ? '#a0245a' : '#b090b0'

          return (
            <svg key={i} viewBox="0 0 100 115" width={boxSize} height={Math.round(boxSize * 1.05)}
              style={{
                animation: filled ? `giftPop 0.35s cubic-bezier(.36,.07,.19,.97) both` : 'none',
                filter: filled
                  ? 'drop-shadow(0 4px 8px rgba(255,107,157,0.55))'
                  : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
              }}>
              <rect x="10" y="42" width="80" height="62" rx="6" fill={bodyMain} stroke={stroke} strokeWidth="3.5"/>
              <rect x="10" y="42" width="16" height="62" rx="3" fill={bodyDark} opacity="0.35"/>
              <rect x="32" y="48" width="28" height="10" rx="4" fill={bodyLight} opacity="0.45"/>
              <rect x="10" y="88" width="80" height="16" rx="3" fill={bodyDark} opacity="0.2"/>
              <rect x="6" y="24" width="88" height="22" rx="6" fill={lidMain} stroke={stroke} strokeWidth="3.5"/>
              <rect x="6" y="24" width="16" height="22" rx="4" fill={lidDark} opacity="0.3"/>
              <rect x="20" y="28" width="38" height="8" rx="4" fill={bodyLight} opacity="0.5"/>
              <rect x="43" y="24" width="14" height="80" fill={ribMain} stroke={stroke} strokeWidth="2"/>
              <rect x="43" y="24" width="5" height="80" fill={ribShad} opacity="0.5"/>
              <rect x="6" y="29" width="88" height="12" fill={ribMain} stroke={stroke} strokeWidth="2"/>
              <rect x="6" y="29" width="88" height="4" fill={ribShad} opacity="0.4"/>
              <path d="M50,18 Q34,4 22,10 Q18,18 30,22 Q40,24 50,18Z" fill={ribMain} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M50,18 Q38,8 28,14 Q26,18 34,20 Q42,22 50,18Z" fill={ribShad} opacity="0.35"/>
              <path d="M50,18 Q66,4 78,10 Q82,18 70,22 Q60,24 50,18Z" fill={ribMain} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M50,18 Q62,8 72,14 Q74,18 66,20 Q58,22 50,18Z" fill={ribShad} opacity="0.35"/>
              <circle cx="50" cy="19" r="7" fill={lidMain} stroke={stroke} strokeWidth="2.5"/>
              <circle cx="48" cy="17" r="2.5" fill={bodyLight} opacity="0.6"/>
            </svg>
          )
        })}
      </div>
      {total > 12 && (
        <div style={{ fontSize:10, color:'#5a3a5a', fontWeight:700, textAlign:'center', marginTop:2 }}>
          +{total - 12}개
        </div>
      )}
    </div>
  )
}
