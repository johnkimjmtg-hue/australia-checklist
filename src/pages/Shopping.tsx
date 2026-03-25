import { useState, useEffect, useMemo, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import imgShopping from '../assets/landing/shopping.png'
import { colors, font, radius, spacing, shadow } from '../styles/tokens'

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
  const [displayCount, setDisplayCount] = useState(30)
  const loaderRef = useRef<HTMLDivElement>(null)

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

  // 필터 변경 시 displayCount 리셋
  useEffect(() => { setDisplayCount(30) }, [selCat, sortBy, search])

  // 무한 스크롤
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setDisplayCount(prev => prev + 30)
      }
    }, { threshold: 0.1 })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [filtered])


  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <Icon icon="ph:circle-notch" width={28} height={28} color={colors.primary}
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
          .featured-scroll::-webkit-scrollbar-track{background:${colors.bgPage};border-radius:2px;}
          .featured-scroll::-webkit-scrollbar-thumb{background:${colors.border};border-radius:2px;}
          .cat-scroll::-webkit-scrollbar{height:4px;}
          .cat-scroll::-webkit-scrollbar-track{background:${colors.bgPage};border-radius:2px;}
          .cat-scroll::-webkit-scrollbar-thumb{background:${colors.border};border-radius:2px;}
        }
      `}</style>
    </div>
  )

  return (
    <div style={{
      background: colors.bgPage, minHeight:'100vh',
      fontFamily: font.family,
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
        background: colors.bgCard, borderBottom: `1.5px solid ${colors.border}`,
        position:'sticky', top:0, zIndex:20,
        display:'flex', alignItems:'flex-start',
      }}>
        {/* 찜 버튼 - 고정 */}
        {myList.length > 0 && onGoToMyList && (
          <div style={{ paddingLeft:14, paddingTop:10, paddingBottom:10, flexShrink:0 }}>
            <button className="cat-btn" onClick={onGoToMyList} style={{
              height:34, padding:'0 12px', borderRadius:radius.full, cursor:'pointer',
              background: '#FF6B9D', border: 'none',
              color: '#fff',
              fontSize: font.size.sm, fontWeight: font.weight.bold, whiteSpace:'nowrap',
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
        <div className="cat-scroll" style={{ display:'flex', gap:spacing[2], padding:`${spacing[2]}px ${spacing[3]}px`, overflowX:'auto', flex:1 }}>
          <button className="cat-btn" onClick={() => setSelCat(null)} style={{
            flexShrink:0, height:34, padding:`0 ${spacing[3]}px`, borderRadius:radius.full, cursor:'pointer',
            background: selCat === null ? colors.primaryLight : colors.bgCard,
            border: `1.5px solid ${selCat === null ? colors.primary : colors.border}`,
            color: selCat === null ? colors.primary : colors.textTertiary,
            fontSize: font.size.sm, fontWeight: selCat === null ? font.weight.bold : font.weight.medium,
            WebkitTapHighlightColor: 'transparent',
          }}>전체</button>
          {categories.map(cat => (
            <button key={cat.id} className="cat-btn" onClick={() => setSelCat(cat.id)} style={{
              flexShrink:0, height:34, padding:`0 ${spacing[3]}px`, borderRadius:radius.full, cursor:'pointer',
              background: selCat === cat.id ? colors.primaryLight : colors.bgCard,
              border: `1.5px solid ${selCat === cat.id ? colors.primary : colors.border}`,
              color: selCat === cat.id ? colors.primary : colors.textTertiary,
              fontSize: font.size.sm, fontWeight: selCat === cat.id ? font.weight.bold : font.weight.medium,
              whiteSpace:'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}>{cat.emoji} {cat.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 14px 0' }}>

        {/* ── 검색창 */}
        <div style={{
          display:'flex', alignItems:'center', gap:spacing[2],
          background: colors.bgCard, border:`1.5px solid ${colors.border}`, borderRadius:radius.sm,
          padding:`0 ${spacing[3]}px`, height:42, marginBottom: spacing[3],
        }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color={colors.textTertiary} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="상품명, 브랜드, 태그 검색"
            style={{
              flex:1, border:'none', outline:'none',
              fontSize: font.size.md, color: colors.textPrimary, background:'transparent',
              fontFamily: font.family,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
              <Icon icon="ph:x" width={14} height={14} color={colors.textTertiary} />
            </button>
          )}
        </div>

        {/* ── 추천 상품 (전체 탭일 때만) */}
        {!selCat && featured.length > 0 && (
          <div style={{ marginBottom: spacing[5] }}>
            <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing[2], display:'flex', alignItems:'center', gap:6 }}>
              <span>⭐ 강력 추천</span>
              <div style={{ flex:1, height:1, background: colors.border }} />
            </div>
            <div className="featured-scroll" style={{ display:'flex', gap: spacing[2], paddingBottom: spacing[2], overflowX:'auto' }}>
              {featured.map(p => (
                <div key={p.id} style={{ flexShrink:0, width:160, background: colors.bgCard, borderRadius: radius.md, overflow:'hidden', border:`1px solid ${colors.border}`, position:'relative', boxShadow: shadow.card }}>
                  <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
                  <div style={{
                    width:'100%', height:120,
                    background: p.image_url ? 'none' : colors.gray100,
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                  }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <Icon icon="ph:shopping-bag" width={36} height={36} color={colors.gray300} />
                    }
                  </div>
                  <div style={{ padding:`${spacing[2]}px ${spacing[2]}px ${spacing[3]}px` }}>
                    {p.tags[0] && (
                      <span style={{
                        fontSize:9, fontWeight: font.weight.bold, padding:'2px 6px', borderRadius:4,
                        background: TAG_COLOR[p.tags[0]]?.bg ?? colors.gray100,
                        color: TAG_COLOR[p.tags[0]]?.color ?? colors.textSecondary,
                        marginBottom:5, display:'inline-block',
                      }}>{p.tags[0]}</span>
                    )}
                    <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textPrimary, lineHeight:1.4, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize: font.size.xs, color: colors.textTertiary, marginBottom:6 }}>{p.brand}</div>
                    <div style={{ fontSize:11, fontWeight: font.weight.bold, color: PRICE_COLOR[p.price_range] ?? colors.textSecondary }}>
                      {p.price_range} · {PRICE_LABEL[p.price_range]}
                    </div>
                  </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); myList.includes(p.id) ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                    position:'absolute', top:6, right:6,
                    width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                    background:'#FF6B9D',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 2px 6px rgba(255,107,157,0.4)',
                    WebkitTapHighlightColor:'transparent',
                  }}>
                    {myList.includes(p.id)
                      ? <Icon icon="ph:check-bold" width={16} height={16} color="#fff" />
                      : <span style={{ fontSize:12, fontWeight: font.weight.bold, color:'#fff' }}>찜</span>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 정렬 + 상품 수 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: spacing[2] }}>
          <div style={{ fontSize: font.size.sm, color: colors.textTertiary, fontWeight: font.weight.bold }}>
            {selCat ? `${categories.find(c=>c.id===selCat)?.name} ` : '전체 '}
            <span style={{ color: colors.primary }}>{filtered.length}개</span>
          </div>
          <div style={{ display:'flex', gap: spacing[1] }}>
            {([
              { id:'default', label:'기본' },
              { id:'price_asc', label:'가격 낮은순' },
              { id:'price_desc', label:'가격 높은순' },
              { id:'name', label:'이름순' },
            ] as {id:SortOption; label:string}[]).map(s => (
              <button key={s.id} className="sort-btn" onClick={() => setSortBy(s.id)} style={{
                fontSize: font.size.xs, fontWeight: sortBy === s.id ? font.weight.bold : font.weight.medium,
                padding:'4px 8px', borderRadius: radius.sm, cursor:'pointer',
                background: sortBy === s.id ? colors.primaryLight : colors.bgCard,
                border: `1px solid ${sortBy === s.id ? colors.primary : colors.border}`,
                color: sortBy === s.id ? colors.primary : colors.textTertiary,
                WebkitTapHighlightColor: 'transparent',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* ── 상품 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: spacing[2] }}>
          {filtered.slice(0, displayCount).map((p, i) => (
            <div key={p.id} style={{
              background: colors.bgCard, borderRadius: radius.md,
              border:`1px solid ${colors.border}`,
              overflow:'hidden',
              animation:`fadeUp 0.25s ease ${i * 0.04}s both`,
              position:'relative',
              boxShadow: shadow.card,
            }}>
              <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
              <div style={{
                width:'100%', aspectRatio:'1',
                background: p.image_url ? 'none' : colors.gray100,
                display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <Icon icon="ph:shopping-bag" width={32} height={32} color={colors.gray300} />
                }
              </div>
              <div style={{ padding:`${spacing[2]}px ${spacing[2]}px ${spacing[3]}px` }}>
                {p.tags.length > 0 && (
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:5 }}>
                    {p.tags.slice(0,2).map(tag => (
                      <span key={tag} style={{
                        fontSize:9, fontWeight: font.weight.bold, padding:'2px 5px', borderRadius:4,
                        background: TAG_COLOR[tag]?.bg ?? colors.gray100,
                        color: TAG_COLOR[tag]?.color ?? colors.textSecondary,
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textPrimary, lineHeight:1.4, marginBottom:3 }}>{p.name}</div>
                <div style={{ fontSize: font.size.xs, color: colors.textTertiary, marginBottom:6 }}>{p.brand}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight: font.weight.bold, color: PRICE_COLOR[p.price_range] ?? colors.textSecondary }}>
                    {p.price_range}
                  </span>
                  {p.where_to_buy.length > 0 && (
                    <span style={{ fontSize:9, color: colors.textTertiary, fontWeight: font.weight.medium }}>
                      {p.where_to_buy[0]}{p.where_to_buy.length > 1 ? ` 외 ${p.where_to_buy.length-1}` : ''}
                    </span>
                  )}
                </div>
              </div>
              </div>
              <button onClick={e => { e.stopPropagation(); myList.includes(p.id) ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                position:'absolute', top:6, right:6,
                width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                background:'#FF6B9D',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 6px rgba(255,107,157,0.4)',
                WebkitTapHighlightColor:'transparent',
              }}>
                {myList.includes(p.id)
                  ? <Icon icon="ph:check-bold" width={16} height={16} color="#fff" />
                  : <span style={{ fontSize:12, fontWeight: font.weight.bold, color:'#fff' }}>찜</span>
                }
              </button>
            </div>
          ))}
          {displayCount < filtered.length && (
            <div ref={loaderRef} style={{ gridColumn:'1/-1', height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon icon="ph:circle-notch" width={20} height={20} color={colors.textTertiary} style={{ animation:'spin 1s linear infinite' }} />
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color: colors.gray300 }}>
            <Icon icon="ph:shopping-cart-simple" width={40} height={40} color={colors.gray300} />
            <div style={{ marginTop:8, fontSize: font.size.sm, color: colors.textTertiary }}>상품이 없어요</div>
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
            width:'100%', maxWidth:390, background: colors.bgCard,
            borderRadius:`${radius.xl}px ${radius.xl}px 0 0`, zIndex:501,
            animation:'slideUp 0.3s ease',
            maxHeight:'85vh', overflowY:'auto',
          }}>
            <style>{`@keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

            {/* 드래그 핸들 */}
            <div style={{ width:40, height:4, borderRadius:2, background: colors.border, margin:'12px auto 0' }} />

            <div style={{
              width:'100%', height:220,
              background: selProduct.image_url ? 'none' : colors.gray100,
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
            }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={60} height={60} color={colors.gray300} />
              }
            </div>

            <div style={{ padding:`${spacing[4]}px ${spacing[4]}px 40px` }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom: spacing[2], alignItems:'center' }}>
                {selProduct.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: font.size.xs, fontWeight: font.weight.bold, padding:'3px 8px', borderRadius: radius.sm,
                    background: TAG_COLOR[tag]?.bg ?? colors.gray100,
                    color: TAG_COLOR[tag]?.color ?? colors.textSecondary,
                  }}>{tag}</span>
                ))}
                <span style={{
                  fontSize: font.size.xs, fontWeight: font.weight.bold, padding:'3px 8px', borderRadius: radius.sm,
                  background: colors.bgPage,
                  color: PRICE_COLOR[selProduct.price_range] ?? colors.textSecondary,
                  border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? colors.border}`,
                  marginLeft:'auto',
                }}>
                  {selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}
                </span>
              </div>

              <div style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom:4 }}>{selProduct.name}</div>
              <div style={{ fontSize: font.size.sm, color: colors.textSecondary, marginBottom: spacing[3] }}>{selProduct.brand}</div>

              {selProduct.description && (
                <div style={{ fontSize: font.size.sm, color: colors.textPrimary, lineHeight:1.7, marginBottom: spacing[4] }}>
                  {selProduct.description}
                </div>
              )}

              {selProduct.where_to_buy.length > 0 && (
                <div style={{ marginBottom: spacing[4] }}>
                  <div style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.textTertiary, letterSpacing:0.5, marginBottom: spacing[2] }}>
                    어디서 살 수 있어요?
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map(store => (
                      <span key={store} style={{
                        fontSize: font.size.sm, fontWeight: font.weight.medium, padding:'5px 10px', borderRadius: radius.sm,
                        background: colors.bgPage, color: colors.textSecondary,
                        border:`1px solid ${colors.border}`,
                      }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { myList.includes(selProduct.id) ? removeFromMyList(selProduct.id) : addToMyList(selProduct.id) }} style={{
                width:'100%', height:50, borderRadius: radius.md, border: '1.5px solid #FF6B9D', cursor:'pointer',
                background: myList.includes(selProduct.id) ? '#FF6B9D' : colors.bgCard,
                color: myList.includes(selProduct.id) ? '#fff' : '#FF6B9D',
                fontSize: font.size.md, fontWeight: font.weight.bold,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom: spacing[2],
                WebkitTapHighlightColor:'transparent',
                fontFamily: font.family,
              }}>
                <Icon icon={myList.includes(selProduct.id) ? 'ph:check-circle-fill' : 'ph:heart'} width={18} height={18} color={myList.includes(selProduct.id) ? '#fff' : '#FF6B9D'} />
                {myList.includes(selProduct.id) ? '찜 취소하기' : '내 쇼핑리스트에 찜하기'}
              </button>

              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:50, borderRadius: radius.md,
                border:`1.5px solid ${colors.border}`, background: colors.bgCard,
                color: colors.textTertiary, fontSize: font.size.md, fontWeight: font.weight.bold,
                cursor:'pointer', WebkitTapHighlightColor:'transparent', fontFamily: font.family,
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
