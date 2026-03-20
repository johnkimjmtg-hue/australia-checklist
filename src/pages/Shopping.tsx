import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import imgShopping from '../assets/landing/shopping.png'

interface Category {
  id: number
  name: string
  emoji: string
  sort_order: number
}

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

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name'

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

export default function Shopping({ myList, myChecked, onMyListChange, onMyCheckedChange, onGoToMyList }: {
  myList: string[]
  myChecked: Record<string, boolean>
  onMyListChange: (next: string[]) => void
  onMyCheckedChange: (next: Record<string, boolean>) => void
  onGoToMyList?: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(true)
  const [selCat, setSelCat]         = useState<number | null>(null)
  const [sortBy, setSortBy]         = useState<SortOption>('default')
  const [search, setSearch]         = useState('')
  const [selProduct, setSelProduct] = useState<Product | null>(null)

  const addToMyList = (id: string) => {
    if (myList.includes(id)) return
    onMyListChange([...myList, id])
  }
  const removeFromMyList = (id: string) => {
    onMyListChange(myList.filter(i => i !== id))
  }

  useEffect(() => {
    const fetch = async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('shopping_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order'),
      ])
      setCategories(cats ?? [])
      setProducts(prods ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const featured = useMemo(() => products.filter(p => p.is_featured), [products])

  const filtered = useMemo(() => {
    let list = selCat ? products.filter(p => p.category_id === selCat) : products
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (sortBy === 'price_asc')  list = [...list].sort((a, b) => a.price_range.length - b.price_range.length)
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price_range.length - a.price_range.length)
    if (sortBy === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, selCat, sortBy, search])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <Icon icon="ph:circle-notch" width={28} height={28} color="#1B6EF3"
        style={{ animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .prod-card:active{transform:scale(0.97)}
        .prod-card{transition:transform 0.15s ease;}
        .cat-btn{transition:all 0.15s ease; -webkit-tap-highlight-color:transparent;}
        .sort-btn{transition:all 0.15s ease;}
        .featured-scroll{overflow-x:auto;}
        .cat-scroll{overflow-x:auto;}
        @media (max-width:768px){
          .featured-scroll{scrollbar-width:none;-ms-overflow-style:none;}
          .featured-scroll::-webkit-scrollbar{display:none;}
          .cat-scroll{scrollbar-width:none;-ms-overflow-style:none;}
          .cat-scroll::-webkit-scrollbar{display:none;}
        }
        @media (min-width:769px){
          .featured-scroll::-webkit-scrollbar{height:4px;}
          .featured-scroll::-webkit-scrollbar-track{background:#e8e8e8;border-radius:2px;}
          .featured-scroll::-webkit-scrollbar-thumb{background:#C8C8C8;border-radius:2px;}
          .cat-scroll::-webkit-scrollbar{height:4px;}
          .cat-scroll::-webkit-scrollbar-track{background:#e8e8e8;border-radius:2px;}
          .cat-scroll::-webkit-scrollbar-thumb{background:#C8C8C8;border-radius:2px;}
        }
      `}</style>
    </div>
  )

  return (
    <div style={{
      background:'#e8e8e8', minHeight:'100vh',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom: 80,
    }}>
      {/* ── 히어로 배너 */}
      <div style={{
        position:'relative', overflow:'hidden',
        height:120, marginBottom:0,
      }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${imgShopping})`,
          backgroundSize:'cover', backgroundPosition:'center',
        }}/>
        <div style={{ position:'absolute', inset:0, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{
            fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.85)',
            textShadow:'0 1px 3px rgba(0,0,0,0.5)',
          }}>
            호주에서 꼭 사야하는 아이템을 모았어요.
          </div>
        </div>
      </div>

      {/* ── 카테고리 탭 */}
      <div style={{
        background:'#e8e8e8', borderBottom:'1px solid #D1D9E3',
        position:'sticky', top:0, zIndex:20,
        display:'flex', alignItems:'center',
      }}>
        {/* 찜 버튼 - 고정 */}
        {myList.length > 0 && onGoToMyList && (
          <div style={{ paddingLeft:14, paddingTop:10, paddingBottom:10, flexShrink:0, display:'flex', alignItems:'center' }}>
            <button className="cat-btn" onClick={onGoToMyList} style={{
              height:34, padding:'0 12px', borderRadius:20, cursor:'pointer',
              background: '#FF6B9D', border: 'none',
              color: '#fff',
              fontSize:12, fontWeight:700, whiteSpace:'nowrap',
              boxShadow:'0 3px 8px rgba(255,107,157,0.4)',
              WebkitTapHighlightColor: 'transparent',
              display:'flex', alignItems:'center', gap:5,
            }}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill="none">
                <path fill="#fff" d="M224,56H175.4A48,48,0,0,0,80.6,56H32A16,16,0,0,0,16,72V200a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V72A16,16,0,0,0,224,56ZM128,32a32,32,0,0,1,30.86,24H97.14A32,32,0,0,1,128,32Zm0,120a48,48,0,0,1-48-48,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0A48,48,0,0,1,128,152Z"/>
              </svg>
              {myList.length}
            </button>
          </div>
        )}
        {/* 카테고리 스크롤 */}
        <div className="cat-scroll" style={{ display:'flex', gap:6, padding:'10px 14px', overflowX:'auto', flex:1, scrollbarWidth:'thin', scrollbarColor:'#C8C8C8 #e8e8e8' }}>
          <button className="cat-btn" onClick={() => setSelCat(null)} style={{
            flexShrink:0, height:34, padding:'0 14px', borderRadius:20, cursor:'pointer',
            background: '#e8e8e8', border: 'none',
            color: selCat === null ? '#1B6EF3' : '#94A3B8',
            fontSize:12, fontWeight: selCat === null ? 700 : 500,
            boxShadow: selCat === null
              ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
              : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            WebkitTapHighlightColor: 'transparent',
          }}>전체</button>
          {categories.map(cat => (
            <button key={cat.id} className="cat-btn" onClick={() => setSelCat(cat.id)} style={{
              flexShrink:0, height:34, padding:'0 14px', borderRadius:20, cursor:'pointer',
              background: '#e8e8e8', border: 'none',
              color: selCat === cat.id ? '#1B6EF3' : '#94A3B8',
              fontSize:12, fontWeight: selCat === cat.id ? 700 : 500, whiteSpace:'nowrap',
              boxShadow: selCat === cat.id
                ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              WebkitTapHighlightColor: 'transparent',
            }}>{cat.emoji} {cat.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 14px 0' }}>

        {/* ── 검색창 */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#fff', border:'1px solid #C8C8C8', borderRadius:10,
          padding:'0 12px', height:40, marginBottom:14,
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="상품명, 브랜드, 태그 검색"
            style={{
              flex:1, border:'none', outline:'none',
              fontSize:14, color:'#1E293B', background:'transparent',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
              <Icon icon="ph:x" width={14} height={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* ── 추천 상품 (전체 탭일 때만) */}
        {!selCat && featured.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#1E293B', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <span>⭐ 강력 추천</span>
              <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
            </div>
            <div className="featured-scroll" style={{ display:'flex', gap:10, paddingBottom:8, overflowX:'auto', scrollbarWidth:'thin', scrollbarColor:'#C8C8C8 #e8e8e8' }}>
              {featured.map(p => (
                <div key={p.id} style={{ flexShrink:0, width:160, background:'#fff', borderRadius:14, overflow:'hidden', border:'1px solid #C8C8C8', position:'relative' }}>
                  <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
                  {/* 이미지 */}
                  <div style={{
                    width:'100%', height:120,
                    background: p.image_url ? 'none' : 'linear-gradient(135deg, #e8e8e8, #e0e0e0)',
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                  }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <Icon icon="ph:shopping-bag" width={36} height={36} color="#93C5FD" />
                    }
                  </div>
                  <div style={{ padding:'10px 10px 12px' }}>
                    {p.tags[0] && (
                      <span style={{
                        fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4,
                        background: TAG_COLOR[p.tags[0]]?.bg ?? '#F1F5F9',
                        color: TAG_COLOR[p.tags[0]]?.color ?? '#475569',
                        marginBottom:5, display:'inline-block',
                      }}>{p.tags[0]}</span>
                    )}
                    <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', lineHeight:1.4, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginBottom:6 }}>{p.brand}</div>
                    <div style={{
                      fontSize:11, fontWeight:800,
                      color: PRICE_COLOR[p.price_range] ?? '#475569',
                    }}>{p.price_range} · {PRICE_LABEL[p.price_range]}</div>
                  </div>
                  </div>
                  {/* 찜 버튼 */}
                  <button onClick={e => { e.stopPropagation(); myList.includes(p.id) ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                    position:'absolute', top:6, right:6,
                    width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                    background:'#FF6B9D',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                    WebkitTapHighlightColor:'transparent',
                  }}>
                    {myList.includes(p.id)
                      ? <Icon icon="ph:check-bold" width={16} height={16} color="#fff" />
                      : <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>찜</span>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 정렬 + 상품 수 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:12, color:'#94A3B8', fontWeight:600 }}>
            {selCat ? `${categories.find(c=>c.id===selCat)?.name} ` : '전체 '}
            <span style={{ color:'#1B6EF3' }}>{filtered.length}개</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {([
              { id:'default', label:'기본' },
              { id:'price_asc', label:'가격 낮은순' },
              { id:'price_desc', label:'가격 높은순' },
              { id:'name', label:'이름순' },
            ] as {id:SortOption; label:string}[]).map(s => (
              <button key={s.id} className="sort-btn" onClick={() => setSortBy(s.id)} style={{
                fontSize:10, fontWeight: sortBy === s.id ? 700 : 500, padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer',
                background: '#e8e8e8',
                color: sortBy === s.id ? '#1B6EF3' : '#94A3B8',
                boxShadow: sortBy === s.id
                  ? 'inset 2px 2px 4px #c5c5c5, inset -2px -2px 4px #ffffff'
                  : '2px 2px 4px #c5c5c5, -2px -2px 4px #ffffff',
                WebkitTapHighlightColor: 'transparent',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* ── 상품 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {filtered.map((p, i) => (
            <div key={p.id} style={{
              background:'#fff', borderRadius:14,
              border:'1px solid #C8C8C8',
              overflow:'hidden',
              animation:`fadeUp 0.25s ease ${i * 0.04}s both`,
              position:'relative',
            }}>
              <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
              {/* 이미지 */}
              <div style={{
                width:'100%', aspectRatio:'1',
                background: p.image_url ? 'none' : 'linear-gradient(135deg, #e8e8e8, #e0e0e0)',
                display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <Icon icon="ph:shopping-bag" width={32} height={32} color="#CBD5E1" />
                }
              </div>
              <div style={{ padding:'10px 10px 12px' }}>
                {/* 태그 */}
                {p.tags.length > 0 && (
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:5 }}>
                    {p.tags.slice(0,2).map(tag => (
                      <span key={tag} style={{
                        fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4,
                        background: TAG_COLOR[tag]?.bg ?? '#F1F5F9',
                        color: TAG_COLOR[tag]?.color ?? '#475569',
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', lineHeight:1.4, marginBottom:3 }}>{p.name}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginBottom:6 }}>{p.brand}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight:800, color: PRICE_COLOR[p.price_range] ?? '#475569' }}>
                    {p.price_range}
                  </span>
                  {p.where_to_buy.length > 0 && (
                    <span style={{ fontSize:9, color:'#94A3B8', fontWeight:500 }}>
                      {p.where_to_buy[0]}{p.where_to_buy.length > 1 ? ` 외 ${p.where_to_buy.length-1}` : ''}
                    </span>
                  )}
                </div>
              </div>
              </div>
              {/* 찜 버튼 */}
              <button onClick={e => { e.stopPropagation(); myList.includes(p.id) ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                position:'absolute', top:6, right:6,
                width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                background:'#FF6B9D',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                WebkitTapHighlightColor:'transparent',
              }}>
                {myList.includes(p.id)
                  ? <Icon icon="ph:check-bold" width={16} height={16} color="#fff" />
                  : <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>찜</span>
                }
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#CBD5E1' }}>
            <Icon icon="ph:shopping-cart-simple" width={40} height={40} color="#CBD5E1" />
            <div style={{ marginTop:8, fontSize:13 }}>상품이 없어요</div>
          </div>
        )}
      </div>

      {/* ── 상품 상세 바텀시트 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            zIndex:500, animation:'fadeIn 0.2s ease',
          }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, background:'#e8e8e8',
            borderRadius:'20px 20px 0 0', zIndex:501,
            animation:'slideUp 0.3s ease',
            maxHeight:'85vh', overflowY:'auto',
          }}>
            <style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

            {/* 드래그 핸들 */}
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />

            {/* 이미지 */}
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
              {/* 태그들 + 가격 뱃지 */}
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                {selProduct.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background: TAG_COLOR[tag]?.bg ?? '#e8e8e8',
                    color: TAG_COLOR[tag]?.color ?? '#475569',
                  }}>{tag}</span>
                ))}
                <span style={{
                  fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                  background: TAG_COLOR[selProduct.price_range]?.bg ?? '#e8e8e8',
                  color: PRICE_COLOR[selProduct.price_range] ?? '#475569',
                  border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? '#C8C8C8'}`,
                  marginLeft:'auto',
                }}>
                  {selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}
                </span>
              </div>

              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selProduct.name}</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{selProduct.brand}</div>

              {/* 설명 */}
              {selProduct.description && (
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>
                  {selProduct.description}
                </div>
              )}

              {/* 구매처 */}
              {selProduct.where_to_buy.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:0.5, marginBottom:8 }}>
                    어디서 살 수 있어요?
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map(store => (
                      <span key={store} style={{
                        fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8,
                        background:'#e8e8e8', color:'#475569',
                        border:'1px solid #C8C8C8',
                      }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 찜하기 버튼 */}
              <button onClick={() => { myList.includes(selProduct.id) ? removeFromMyList(selProduct.id) : addToMyList(selProduct.id) }} style={{
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
