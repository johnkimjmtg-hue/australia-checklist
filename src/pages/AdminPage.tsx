import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/businesses'
import {
  Business, getBusinesses, createBusiness,
  updateBusiness, toggleFeatured,
} from '../lib/businessService'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

// ── 탭 타입
type MainTab = 'business' | 'categories' | 'items' | 'export'

// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'',
}

// ── 체크리스트 타입
type Cat  = { id:string; label:string; receiptLabel:string; emoji:string }
type Item = { id:string; categoryId:string; label:string; emoji:string }

const DEFAULT_CATS: Cat[] = [
  { id:'hospital',  label:'병원/뷰티', receiptLabel:'병원/뷰티', emoji:'🏥' },
  { id:'food',      label:'먹거리',    receiptLabel:'먹거리',    emoji:'🍽' },
  { id:'shopping',  label:'쇼핑',      receiptLabel:'쇼핑',      emoji:'🛍' },
  { id:'admin',     label:'행정',      receiptLabel:'행정',      emoji:'📋' },
  { id:'people',    label:'사람',      receiptLabel:'사람',      emoji:'👥' },
  { id:'parenting', label:'육아',      receiptLabel:'육아',      emoji:'🧸' },
  { id:'places',    label:'가볼 곳',   receiptLabel:'가볼 곳',   emoji:'🗺' },
  { id:'schedule',  label:'일정',      receiptLabel:'일정',      emoji:'📅' },
  { id:'custom',    label:'직접입력',  receiptLabel:'직접입력',  emoji:'✏️' },
]

const DEFAULT_ITEMS: Item[] = [
  { id:'h01', categoryId:'hospital', label:'치과 (스케일링/충치)', emoji:'🦷' },
  { id:'h02', categoryId:'hospital', label:'치아 미백',            emoji:'🦷' },
  { id:'h03', categoryId:'hospital', label:'피부과 레이저 시술',   emoji:'💆' },
  { id:'h04', categoryId:'hospital', label:'보톡스/필러',          emoji:'💉' },
  { id:'h05', categoryId:'hospital', label:'여드름 치료',          emoji:'🧴' },
  { id:'h06', categoryId:'hospital', label:'안과 검진',            emoji:'👁' },
  { id:'h07', categoryId:'hospital', label:'라식/라섹 상담',       emoji:'👓' },
  { id:'h08', categoryId:'hospital', label:'건강검진',             emoji:'🏥' },
  { id:'h09', categoryId:'hospital', label:'암보험 가입 검토',     emoji:'📋' },
  { id:'h10', categoryId:'hospital', label:'한의원 (침/뜸)',       emoji:'🌿' },
  { id:'h11', categoryId:'hospital', label:'미용실 (커트/펌/염색)',emoji:'💇' },
  { id:'h12', categoryId:'hospital', label:'네일 샵',              emoji:'💅' },
  { id:'h13', categoryId:'hospital', label:'속눈썹 연장',          emoji:'👁' },
  { id:'h14', categoryId:'hospital', label:'눈썹 문신/정리',       emoji:'✏️' },
  { id:'h15', categoryId:'hospital', label:'마사지/스파',          emoji:'💆' },
  { id:'h16', categoryId:'hospital', label:'올리브영',             emoji:'🛍' },
  { id:'h17', categoryId:'hospital', label:'다이소 뷰티',          emoji:'🧴' },
  { id:'h18', categoryId:'hospital', label:'선크림 (한국 브랜드)', emoji:'☀️' },
  { id:'h19', categoryId:'hospital', label:'마스크 팩 대량 구입',  emoji:'🎭' },
  { id:'h20', categoryId:'hospital', label:'토너/에센스',          emoji:'💧' },
  { id:'h21', categoryId:'hospital', label:'헬스장 1일권',         emoji:'💪' },
  { id:'h22', categoryId:'hospital', label:'찜질방/사우나',        emoji:'♨️' },
  { id:'h23', categoryId:'hospital', label:'약국 (상비약)',        emoji:'💊' },
  { id:'h24', categoryId:'hospital', label:'안경/렌즈 맞추기',    emoji:'👓' },
  { id:'h25', categoryId:'hospital', label:'정형외과/물리치료',    emoji:'🩺' },
  { id:'h26', categoryId:'hospital', label:'피부과 처방 크림',     emoji:'🧴' },
  { id:'f01', categoryId:'food', label:'교촌치킨',         emoji:'🍗' },
  { id:'f02', categoryId:'food', label:'네네치킨',         emoji:'🍗' },
  { id:'f03', categoryId:'food', label:'BHC치킨',          emoji:'🍗' },
  { id:'f04', categoryId:'food', label:'짜장면',           emoji:'🍜' },
  { id:'f05', categoryId:'food', label:'짬뽕',             emoji:'🍜' },
  { id:'f06', categoryId:'food', label:'탕수육',           emoji:'🥢' },
  { id:'f07', categoryId:'food', label:'순대국',           emoji:'🍲' },
  { id:'f08', categoryId:'food', label:'갈비탕',           emoji:'🍲' },
  { id:'f09', categoryId:'food', label:'돼지국밥',         emoji:'🍲' },
  { id:'f10', categoryId:'food', label:'게장',             emoji:'🦀' },
  { id:'f11', categoryId:'food', label:'보쌈',             emoji:'🥩' },
  { id:'f12', categoryId:'food', label:'삼겹살',           emoji:'🥩' },
  { id:'f13', categoryId:'food', label:'치맥 (치킨+맥주)', emoji:'🍺' },
  { id:'f14', categoryId:'food', label:'떡볶이',           emoji:'🌶' },
  { id:'f15', categoryId:'food', label:'한우 구이',        emoji:'🥩' },
  { id:'f16', categoryId:'food', label:'비빔밥',           emoji:'🍚' },
  { id:'f17', categoryId:'food', label:'회/초밥',          emoji:'🍣' },
  { id:'f18', categoryId:'food', label:'라면',             emoji:'🍜' },
  { id:'f19', categoryId:'food', label:'호떡',             emoji:'🥞' },
  { id:'f20', categoryId:'food', label:'빙수',             emoji:'🍧' },
  { id:'f21', categoryId:'food', label:'닭갈비',           emoji:'🍗' },
  { id:'f22', categoryId:'food', label:'순두부찌개',       emoji:'🍲' },
  { id:'f23', categoryId:'food', label:'곱창/막창',        emoji:'🥩' },
  { id:'f24', categoryId:'food', label:'냉면',             emoji:'🍜' },
  { id:'f25', categoryId:'food', label:'편의점 먹방',      emoji:'🏪' },
  { id:'f26', categoryId:'food', label:'감성 카페',        emoji:'☕' },
  { id:'f27', categoryId:'food', label:'포장마차/노점',    emoji:'🍢' },
  { id:'f28', categoryId:'food', label:'족발',             emoji:'🥩' },
  { id:'f29', categoryId:'food', label:'해물파전',         emoji:'🥞' },
  { id:'f30', categoryId:'food', label:'만두',             emoji:'🥟' },
  { id:'f31', categoryId:'food', label:'김밥',             emoji:'🍱' },
  { id:'f32', categoryId:'food', label:'부대찌개',         emoji:'🍲' },
  { id:'f33', categoryId:'food', label:'마라탕',           emoji:'🌶' },
  { id:'f34', categoryId:'food', label:'오마카세',         emoji:'🍽' },
  { id:'f35', categoryId:'food', label:'막걸리',           emoji:'🍶' },
  { id:'s01', categoryId:'shopping', label:'올리브영',              emoji:'🛍' },
  { id:'s02', categoryId:'shopping', label:'면세점 쇼핑',           emoji:'✈️' },
  { id:'s03', categoryId:'shopping', label:'김정문알로에 팩',        emoji:'🌿' },
  { id:'s04', categoryId:'shopping', label:'다이소',                emoji:'🏪' },
  { id:'s05', categoryId:'shopping', label:'선글라스',              emoji:'🕶' },
  { id:'s06', categoryId:'shopping', label:'속옷',                  emoji:'👕' },
  { id:'s07', categoryId:'shopping', label:'반지 (택스리펀 가능)',   emoji:'💍' },
  { id:'s08', categoryId:'shopping', label:'안경 맞추기',           emoji:'👓' },
  { id:'s09', categoryId:'shopping', label:'홍대 오프라인 쇼핑',    emoji:'🛒' },
  { id:'s10', categoryId:'shopping', label:'편지지 / 노트 / 펜',    emoji:'✏️' },
  { id:'s11', categoryId:'shopping', label:'후시딘 / 마데카솔',     emoji:'💊' },
  { id:'s12', categoryId:'shopping', label:'소염제 / 항생제',       emoji:'💊' },
  { id:'s13', categoryId:'shopping', label:'메디폼',                emoji:'🩹' },
  { id:'s14', categoryId:'shopping', label:'가슴마스크',            emoji:'🩹' },
  { id:'s15', categoryId:'shopping', label:'온열 안대',             emoji:'😴' },
  { id:'s16', categoryId:'shopping', label:'남대문 비상약',         emoji:'💊' },
  { id:'s17', categoryId:'shopping', label:'무신사 스탠다드',       emoji:'👗' },
  { id:'s18', categoryId:'shopping', label:'명동 쇼핑',             emoji:'🛒' },
  { id:'s19', categoryId:'shopping', label:'한국 과자 박스',        emoji:'🍫' },
  { id:'s20', categoryId:'shopping', label:'라면 박스',             emoji:'📦' },
  { id:'s21', categoryId:'shopping', label:'김/반찬',               emoji:'🌿' },
  { id:'s22', categoryId:'shopping', label:'김치',                  emoji:'🥬' },
  { id:'s23', categoryId:'shopping', label:'홍삼/인삼 제품',        emoji:'🌿' },
  { id:'s24', categoryId:'shopping', label:'기념품',                emoji:'🎁' },
  { id:'s25', categoryId:'shopping', label:'교보문고 서점',         emoji:'📚' },
  { id:'a01', categoryId:'admin', label:'주민등록증 재발급',   emoji:'🪪' },
  { id:'a02', categoryId:'admin', label:'여권 갱신/발급',      emoji:'📘' },
  { id:'a03', categoryId:'admin', label:'은행 계좌 정리',      emoji:'🏦' },
  { id:'a04', categoryId:'admin', label:'카카오뱅크 개설',     emoji:'💛' },
  { id:'a05', categoryId:'admin', label:'핸드폰 변경/유심',    emoji:'📱' },
  { id:'a06', categoryId:'admin', label:'운전면허 갱신',       emoji:'🚗' },
  { id:'a07', categoryId:'admin', label:'세금 신고/환급',      emoji:'💰' },
  { id:'a08', categoryId:'admin', label:'국민연금 확인',       emoji:'📊' },
  { id:'a09', categoryId:'admin', label:'보험 점검',           emoji:'🛡' },
  { id:'a10', categoryId:'admin', label:'가족관계증명서',      emoji:'📄' },
  { id:'a11', categoryId:'admin', label:'건강보험 정리',       emoji:'🏥' },
  { id:'a12', categoryId:'admin', label:'주식 계좌 정리',      emoji:'📈' },
  { id:'a13', categoryId:'admin', label:'재외국민 등록',       emoji:'🌏' },
  { id:'a14', categoryId:'admin', label:'공증/인감증명서',     emoji:'📜' },
  { id:'a15', categoryId:'admin', label:'복지 혜택 확인',      emoji:'✅' },
  { id:'p01', categoryId:'people', label:'부모님 만나기',       emoji:'👪' },
  { id:'p02', categoryId:'people', label:'형제자매 만나기',     emoji:'👬' },
  { id:'p03', categoryId:'people', label:'친구들 만나기',       emoji:'👥' },
  { id:'p04', categoryId:'people', label:'친척 방문',           emoji:'🏠' },
  { id:'p05', categoryId:'people', label:'동창 모임',           emoji:'🎓' },
  { id:'p06', categoryId:'people', label:'고향 방문',           emoji:'🏡' },
  { id:'p07', categoryId:'people', label:'성묘/제사',           emoji:'🙏' },
  { id:'p08', categoryId:'people', label:'가족 외식',           emoji:'🍽' },
  { id:'p09', categoryId:'people', label:'가족사진 스튜디오',   emoji:'📸' },
  { id:'p10', categoryId:'people', label:'부모님 선물',         emoji:'🎁' },
  { id:'k01', categoryId:'parenting', label:'아이 예방접종',     emoji:'💉' },
  { id:'k02', categoryId:'parenting', label:'소아과 검진',       emoji:'🩺' },
  { id:'k03', categoryId:'parenting', label:'아이 치과',         emoji:'🦷' },
  { id:'k04', categoryId:'parenting', label:'장난감/완구 쇼핑',  emoji:'🧸' },
  { id:'k05', categoryId:'parenting', label:'아이 옷 쇼핑',      emoji:'👕' },
  { id:'k06', categoryId:'parenting', label:'전집/어린이 도서',  emoji:'📚' },
  { id:'k07', categoryId:'parenting', label:'기저귀 대량 구입',  emoji:'🧷' },
  { id:'k08', categoryId:'parenting', label:'키즈카페 방문',     emoji:'🎠' },
  { id:'k09', categoryId:'parenting', label:'에버랜드/롯데월드', emoji:'🎡' },
  { id:'k10', categoryId:'parenting', label:'가족 사진',         emoji:'📸' },
  { id:'g01', categoryId:'places', label:'경복궁',              emoji:'🏯' },
  { id:'g02', categoryId:'places', label:'창덕궁/후원',         emoji:'🌿' },
  { id:'g03', categoryId:'places', label:'N서울타워',           emoji:'🗼' },
  { id:'g04', categoryId:'places', label:'한강 피크닉',         emoji:'🌊' },
  { id:'g05', categoryId:'places', label:'북촌 한옥마을',       emoji:'🏘' },
  { id:'g06', categoryId:'places', label:'인사동',              emoji:'🎨' },
  { id:'g07', categoryId:'places', label:'홍대 거리',           emoji:'🎵' },
  { id:'g08', categoryId:'places', label:'DDP',                 emoji:'🏛' },
  { id:'g09', categoryId:'places', label:'COEX 별마당',         emoji:'📚' },
  { id:'g10', categoryId:'places', label:'롯데타워 전망대',     emoji:'🏙' },
  { id:'g11', categoryId:'places', label:'제주도',              emoji:'🌋' },
  { id:'g12', categoryId:'places', label:'부산 해운대',         emoji:'🏖' },
  { id:'g13', categoryId:'places', label:'경주',                emoji:'🏺' },
  { id:'g14', categoryId:'places', label:'전주 한옥마을',       emoji:'🏘' },
  { id:'g15', categoryId:'places', label:'남이섬',              emoji:'🍂' },
  { id:'g16', categoryId:'places', label:'노래방',              emoji:'🎤' },
  { id:'g17', categoryId:'places', label:'PC방',                emoji:'🎮' },
  { id:'g18', categoryId:'places', label:'찜질방',              emoji:'♨️' },
  { id:'g19', categoryId:'places', label:'방탈출 카페',         emoji:'🔐' },
  { id:'g20', categoryId:'places', label:'야구 직관',           emoji:'⚾' },
  { id:'g21', categoryId:'places', label:'한복 체험',           emoji:'👘' },
  { id:'g22', categoryId:'places', label:'DMZ 투어',            emoji:'🪖' },
]

const EMOJI_MAP: [string[], string][] = [
  [['치과','치아','스케일링','충치','미백'], '🦷'],
  [['피부','레이저','보톡스','필러','여드름'], '💆'],
  [['안과','눈','라식','라섹'], '👁'],
  [['안경','렌즈'], '👓'],
  [['병원','검진','건강','의원'], '🏥'],
  [['약','처방','항생','소염'], '💊'],
  [['미용실','헤어','커트','펌','염색'], '💇'],
  [['네일'], '💅'],
  [['마사지','스파'], '💆'],
  [['찜질','사우나'], '♨️'],
  [['크림','로션','에센스','토너','팩'], '🧴'],
  [['선크림'], '☀️'],
  [['올리브영'], '🛍'],
  [['다이소','마트'], '🏪'],
  [['헬스','운동'], '💪'],
  [['치킨','닭'], '🍗'],
  [['짜장','짬뽕','라면','냉면','국수'], '🍜'],
  [['국밥','국','탕','찌개','순대'], '🍲'],
  [['고기','삼겹','갈비','한우','보쌈','족발','곱창'], '🥩'],
  [['회','초밥'], '🍣'],
  [['떡볶이','마라'], '🌶'],
  [['비빔밥'], '🍚'],
  [['카페'], '☕'],
  [['빙수'], '🍧'],
  [['맥주','치맥','막걸리'], '🍺'],
  [['만두'], '🥟'],
  [['김밥'], '🍱'],
  [['포장마차','노점'], '🍢'],
  [['면세'], '✈️'],
  [['선글라스'], '🕶'],
  [['반지','목걸이','귀걸이'], '💍'],
  [['책','도서'], '📚'],
  [['과자','초콜릿'], '🍫'],
  [['김치'], '🥬'],
  [['홍삼','인삼'], '🌿'],
  [['기념품','선물'], '🎁'],
  [['여권'], '📘'],
  [['은행','계좌'], '🏦'],
  [['핸드폰','유심'], '📱'],
  [['자동차','운전'], '🚗'],
  [['세금','환급'], '💰'],
  [['보험'], '🛡'],
  [['부모','가족'], '👪'],
  [['친구'], '👥'],
  [['학교','동창','모임'], '🎓'],
  [['고향'], '🏡'],
  [['사진','스튜디오'], '📸'],
  [['예방접종','주사'], '💉'],
  [['장난감'], '🧸'],
  [['기저귀'], '🧷'],
  [['키즈'], '🎠'],
  [['경복궁','창덕궁','궁'], '🏯'],
  [['타워'], '🗼'],
  [['한강'], '🌊'],
  [['한옥'], '🏘'],
  [['노래방'], '🎤'],
  [['pc방','게임'], '🎮'],
  [['야구'], '⚾'],
  [['한복'], '👘'],
  [['제주'], '🌋'],
  [['부산','해운대'], '🏖'],
  [['방탈출'], '🔐'],
]

function autoEmoji(label: string): string {
  const lower = label.toLowerCase()
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some(k => lower.includes(k))) return emoji
  }
  return '📌'
}

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw]         = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab]       = useState<MainTab>('business')

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  if (!authed) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, padding:'32px 24px',
        boxShadow:'0 8px 32px rgba(30,77,131,0.12)', width:'calc(100% - 48px)', maxWidth:360,
      }}>
        <div style={{ fontSize:32, textAlign:'center', marginBottom:8 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D', textAlign:'center', marginBottom:4 }}>Admin</div>
        <div style={{ fontSize:12, color:'#8AAAC8', textAlign:'center', marginBottom:24 }}>호주가자 관리자 페이지</div>
        <input
          type="password" placeholder="비밀번호"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />
        {pwError && <div style={{ color:'#e8420a', fontSize:12, marginTop:6, fontWeight:700 }}>비밀번호가 틀렸어요</div>}
        <button onClick={handleLogin} style={{ ...btnPrimary, marginTop:12 }}>로그인</button>
        <button onClick={onBack} style={{ ...btnGhost, marginTop:8 }}>← 돌아가기</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight:'100vh', background:'#f0f2f5',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        background:'#1E4D83', color:'#fff', padding:'16px 20px',
        display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:50,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', padding:0 }}>←</button>
        <div>
          <div style={{ fontSize:17, fontWeight:900 }}>🛠 호주가자 Admin</div>
          <div style={{ fontSize:11, opacity:0.7 }}>관리자 페이지</div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', display:'flex', overflowX:'auto' }}>
        {([
          ['business',   '🏢 업체 관리'],
          ['categories', '📂 카테고리'],
          ['items',      '📝 체크리스트'],
          ['export',     '💾 코드 내보내기'],
        ] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'12px 18px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, whiteSpace:'nowrap',
            color: tab===id ? '#1E4D83' : '#888',
            borderBottom: tab===id ? '2.5px solid #1E4D83' : '2.5px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px 80px' }}>
        {tab==='business'   && <BusinessTab />}
        {tab==='categories' && <CategoriesTab />}
        {tab==='items'      && <ItemsTab />}
        {tab==='export'     && <ExportTab />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// TAB 1: 업체 관리
// ════════════════════════════════════════════
function BusinessTab() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState<string|null>(null)
  const [toast, setToast]           = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setBusinesses(await getBusinesses())
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  function openNew() {
    setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true)
  }

  function openEdit(b: Business) {
    setForm({
      id:b.id, name:b.name, category:b.category,
      description:b.description||'', phone:b.phone||'',
      website:b.website||'', kakao:b.kakao||'',
      address:b.address||'', city:b.city,
      is_featured:b.is_featured, is_active:b.is_active,
      tags:b.tags?.join(', ')||'',
    })
    setEditTarget(b); setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.city) { showToast('업체명, 도시는 필수예요'); return }
    setSaving(true)
    const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), rating:0, reviews_count:0 }
    if (editTarget) {
      const result = await updateBusiness(editTarget.id, payload)
      if (result) showToast('✅ 수정 완료')
      else { showToast('❌ 수정 실패 - 콘솔 확인'); setSaving(false); return }
    } else {
      const id = 'biz-' + Date.now()
      const result = await createBusiness({ ...payload, id })
      if (result) showToast('✅ 등록 완료')
      else { showToast('❌ 등록 실패 - 콘솔 확인'); setSaving(false); return }
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    showToast('🗑 삭제 완료'); setDeleteId(null); await load()
  }

  async function handleToggle(id: string, cur: boolean) {
    await toggleFeatured(id, !cur)
    showToast(cur ? '추천 해제' : '⭐ 추천 설정'); await load()
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {deleteId && <Confirm msg="정말 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}

      {showForm ? (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={() => setShowForm(false)} style={btnGhost}>← 목록</button>
            <h2 style={{ fontSize:16, fontWeight:900, color:'#0F1B2D', margin:0 }}>{editTarget ? '업체 수정' : '업체 등록'}</h2>
          </div>
          <Card>
            <Grid2>
              <Field label="업체명 *"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="예: Palas Property" /></Field>
              <Field label="도시 *"><input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={inputStyle} placeholder="예: Sydney CBD" /></Field>
            </Grid2>
            <Field label="카테고리">
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
                {CATEGORIES.filter(c=>c.id!=='all').map(c=>(
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="주소"><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} style={inputStyle} placeholder="예: 123 George Street" /></Field>
            <Field label="업체 소개"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...inputStyle,resize:'none'}} rows={3} /></Field>
            <Field label="태그 (쉼표 구분)"><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} style={inputStyle} placeholder="예: 부동산 구매, 투자 상담" /></Field>
            <Grid2>
              <Field label="전화번호"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="+61 2 1234 5678" /></Field>
              <Field label="카카오 ID"><input value={form.kakao} onChange={e=>setForm(f=>({...f,kakao:e.target.value}))} style={inputStyle} /></Field>
            </Grid2>
            <Field label="웹사이트"><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={inputStyle} placeholder="https://..." /></Field>
            <div style={{ display:'flex', gap:20, marginTop:8 }}>
              <label style={checkLabel}><input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} /> ⭐ 추천 업체</label>
              <label style={checkLabel}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} /> ✅ 활성화</label>
            </div>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop:16 }}>{saving ? '저장 중...' : editTarget ? '수정 완료' : '등록하기'}</button>
          </Card>

          {/* 리뷰 관리 - 수정 모드일 때만 */}
          {editTarget && <ReviewManager businessId={editTarget.id} onRefresh={load} showToast={showToast} />}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:13, color:'#888', fontWeight:700 }}>총 {businesses.length}개 업체</span>
            <button onClick={openNew} style={btnPrimary}>+ 업체 등록</button>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>불러오는 중...</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {businesses.map(b => (
                <Card key={b.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:15, fontWeight:900, color:'#0F1B2D' }}>{b.name}</span>
                      {b.is_featured && <span style={{ marginLeft:6, fontSize:10, background:'#1E4D83', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>추천</span>}
                      {!b.is_active  && <span style={{ marginLeft:6, fontSize:10, background:'#e8420a', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>비활성</span>}
                    </div>
                    <span style={{ fontSize:11, color:'#8AAAC8' }}>{CATEGORIES.find(c=>c.id===b.category)?.emoji} {CATEGORIES.find(c=>c.id===b.category)?.label}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#7a8fb5', marginBottom:12 }}>📍 {b.city} · ⭐ {b.rating} ({b.reviews_count})</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(b)} style={{ ...btnGhost, flex:1, padding:'7px' }}>✏️ 수정</button>
                    <button onClick={() => handleToggle(b.id, b.is_featured)} style={{
                      flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:12,
                      background: b.is_featured ? 'rgba(255,220,50,0.2)' : 'rgba(200,218,248,0.3)',
                      color: b.is_featured ? '#b8860b' : '#1E4D83',
                    }}>{b.is_featured ? '⭐ 추천해제' : '☆ 추천설정'}</button>
                    <button onClick={() => setDeleteId(b.id)} style={{ padding:'7px 12px', background:'rgba(232,66,10,0.08)', border:'none', borderRadius:8, color:'#e8420a', fontWeight:800, fontSize:12, cursor:'pointer' }}>🗑</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

// ════════════════════════════════════════════
// 리뷰 관리 컴포넌트
// ════════════════════════════════════════════
function ReviewManager({ businessId, onRefresh, showToast }: { businessId: string; onRefresh: () => void; showToast: (msg: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { loadReviews() }, [businessId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) {
      showToast('🗑 리뷰 삭제 완료')
      await loadReviews()
      onRefresh()
    }
    setDeleteId(null)
  }

  return (
    <>
      {deleteId && <Confirm msg="이 리뷰를 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}
      <Card>
        <SectionTitle>⭐ 리뷰 관리 ({reviews.length})</SectionTitle>
        {loading ? (
          <div style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'12px 0' }}>불러오는 중...</div>
        ) : reviews.length === 0 ? (
          <div style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'12px 0' }}>리뷰가 없어요</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'#f8fafd', borderRadius:10, border:'1px solid #eee' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#0F1B2D' }}>{r.author_name}</span>
                    <span style={{ fontSize:12, color:'#f5a623' }}>{'⭐'.repeat(r.rating)}</span>
                    <span style={{ fontSize:11, color:'#bbb' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#555', margin:0, lineHeight:1.6 }}>{r.content}</p>
                </div>
                <button onClick={() => setDeleteId(r.id)} style={{ ...btnSmDanger, flexShrink:0 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 2: 카테고리 관리
// ════════════════════════════════════════════
function CategoriesTab() {
  const [cats, setCats]         = useState<Cat[]>(() => JSON.parse(JSON.stringify(DEFAULT_CATS)))
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [toast, setToast]       = useState('')
  const [selectedId, setSelectedId] = useState(DEFAULT_CATS[0].id)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function addCat() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || autoEmoji(newLabel)
    const id = 'cat_' + Date.now()
    setCats(prev => [...prev, { id, label:newLabel.trim(), receiptLabel:newLabel.trim(), emoji }])
    setNewEmoji(''); setNewLabel('')
    showToast('카테고리 추가됨: ' + newLabel)
  }

  function deleteCat(id: string) {
    if (!confirm('이 카테고리와 하위 항목을 모두 삭제할까요?')) return
    setCats(prev => prev.filter(c => c.id !== id))
    showToast('삭제됨')
  }

  function updateCat(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setCats(prev => prev.map(c => c.id===id ? {...c, [field]:val, ...(field==='label'?{receiptLabel:val}:{})} : c))
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>새 카테고리 추가</SectionTitle>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} placeholder="😀" maxLength={2} style={{ ...inputStyle, width:60, textAlign:'center', fontSize:20 }} />
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()} placeholder="카테고리 이름" style={{ ...inputStyle, flex:1 }} />
          <button onClick={addCat} style={btnPrimary}>추가</button>
        </div>
        <p style={{ fontSize:12, color:'#aaa', marginTop:6 }}>이모티콘 비워두면 자동 선택됩니다</p>
      </Card>

      <Card>
        <SectionTitle>카테고리 목록 ({cats.length})</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
          {cats.map(cat => {
            const isLocked = cat.id === 'custom'
            return (
              <div key={cat.id} onClick={() => setSelectedId(cat.id)} style={{
                border: `1.5px solid ${selectedId===cat.id ? '#1E4D83' : '#e8e8e8'}`,
                borderRadius:12, padding:'12px 14px',
                background: selectedId===cat.id ? '#eef2fb' : '#fafafa',
                display:'flex', alignItems:'center', gap:10, cursor:'pointer',
              }}>
                {isLocked ? <span style={{ color:'#ccc' }}>🔒</span> : null}
                <input
                  value={cat.emoji} maxLength={2}
                  onChange={e => updateCat(cat.id, 'emoji', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ width:36, textAlign:'center', fontSize:20, border:'none', background:'transparent', cursor:isLocked?'default':'text' }}
                />
                <input
                  value={cat.label}
                  onChange={e => updateCat(cat.id, 'label', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ flex:1, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:isLocked?'#aaa':'#222', cursor:isLocked?'default':'text' }}
                />
                {!isLocked && (
                  <button onClick={e => { e.stopPropagation(); deleteCat(cat.id) }} style={{ background:'none', border:'none', color:'#e05252', cursor:'pointer', fontSize:14 }}>✕</button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 3: 체크리스트 항목
// ════════════════════════════════════════════
function ItemsTab() {
  const [cats]  = useState<Cat[]>(() => JSON.parse(JSON.stringify(DEFAULT_CATS)))
  const [items, setItems] = useState<Item[]>(() => JSON.parse(JSON.stringify(DEFAULT_ITEMS)))
  const [selCat, setSelCat] = useState(DEFAULT_CATS[0].id)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const catItems = items.filter(i => i.categoryId === selCat)
  const isLocked = selCat === 'custom'
  const cat = cats.find(c => c.id === selCat)

  function addItem() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || autoEmoji(newLabel)
    const id = 'i_' + Date.now()
    setItems(prev => [...prev, { id, categoryId:selCat, label:newLabel.trim(), emoji }])
    setNewLabel(''); setNewEmoji('')
    showToast('항목 추가됨: ' + newLabel)
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    showToast('항목 삭제됨')
  }

  function updateItem(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i))
  }

  function moveItem(id: string, dir: number) {
    const catIs = items.filter(i => i.categoryId === selCat)
    const localIdx = catIs.findIndex(i => i.id === id)
    const newIdx = localIdx + dir
    if (newIdx < 0 || newIdx >= catIs.length) return
    const allItems = [...items]
    const a = allItems.findIndex(i => i.id === catIs[localIdx].id)
    const b = allItems.findIndex(i => i.id === catIs[newIdx].id)
    ;[allItems[a], allItems[b]] = [allItems[b], allItems[a]]
    setItems(allItems)
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>카테고리 선택</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setSelCat(c.id)} style={{
              padding:'6px 14px', borderRadius:8, border:'1.5px solid',
              borderColor: selCat===c.id ? '#1E4D83' : '#ddd',
              background: selCat===c.id ? '#1E4D83' : '#fff',
              color: selCat===c.id ? '#fff' : '#666',
              fontSize:13, fontWeight:700, cursor:'pointer',
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionTitle style={{ margin:0 }}>{cat?.emoji} {cat?.label} 항목 ({catItems.length})</SectionTitle>
        </div>

        {!isLocked && (
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="새 항목 이름" style={{ ...inputStyle, flex:1 }} />
            <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} placeholder="🎯" maxLength={2} style={{ ...inputStyle, width:60, textAlign:'center', fontSize:18 }} />
            <button onClick={addItem} style={btnPrimary}>추가</button>
          </div>
        )}

        {isLocked ? (
          <p style={{ color:'#aaa', fontSize:13 }}>🔒 직접입력 카테고리는 앱에서 사용자가 직접 추가합니다.</p>
        ) : catItems.length === 0 ? (
          <p style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'20px 0' }}>항목이 없어요. 위에서 추가해보세요!</p>
        ) : (
          <div>
            {catItems.map((item, localIdx) => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #f3f3f3' }}>
                <input value={item.emoji} maxLength={2} onChange={e=>updateItem(item.id,'emoji',e.target.value)} style={{ width:36, textAlign:'center', fontSize:18, border:'none', background:'transparent' }} />
                <input value={item.label} onChange={e=>updateItem(item.id,'label',e.target.value)} style={{ flex:1, fontSize:13, border:'none', background:'transparent', color:'#444' }} />
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => moveItem(item.id,-1)} disabled={localIdx===0} style={{ ...btnSmGhost, opacity:localIdx===0?0.3:1 }}>↑</button>
                  <button onClick={() => moveItem(item.id, 1)} disabled={localIdx===catItems.length-1} style={{ ...btnSmGhost, opacity:localIdx===catItems.length-1?0.3:1 }}>↓</button>
                  <button onClick={() => deleteItem(item.id)} style={{ ...btnSmDanger }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 4: 코드 내보내기
// ════════════════════════════════════════════
function ExportTab() {
  const [code, setCode]   = useState('')
  const [copied, setCopied] = useState(false)

  function generate() {
    const cats  = JSON.parse(JSON.stringify(DEFAULT_CATS))
    const items = JSON.parse(JSON.stringify(DEFAULT_ITEMS))
    const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    let out = `export type Category = { id: string; label: string; receiptLabel: string; emoji: string }\n`
    out += `export type CheckItem = { id: string; categoryId: string; label: string; emoji: string }\n\n`
    out += `export const CATEGORIES: Category[] = [\n`
    cats.forEach((c: Cat) => { out += `  { id:'${esc(c.id)}', label:'${esc(c.label)}', receiptLabel:'${esc(c.receiptLabel)}', emoji:'${c.emoji}' },\n` })
    out += `]\n\nexport const ITEMS: CheckItem[] = [`
    let lastCat = ''
    items.forEach((item: Item) => {
      const cat = cats.find((c: Cat) => c.id === item.categoryId)
      if (cat && cat.id !== lastCat) { out += `\n\n  // ${cat.label}\n`; lastCat = cat.id }
      out += `  { id:'${esc(item.id)}', categoryId:'${esc(item.categoryId)}', label:'${esc(item.label)}', emoji:'${item.emoji}' },\n`
    })
    out += `]\n`
    setCode(out)
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <SectionTitle>사용 방법</SectionTitle>
      {[
        '"코드 생성" 버튼을 클릭하세요',
        '"전체 복사" 버튼으로 코드를 클립보드에 복사하세요',
        'src/data/checklist.ts 파일 전체 내용을 붙여넣으세요',
        'npm run build 후 배포하면 모든 사용자에게 반영됩니다',
      ].map((step, i) => (
        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'#1E4D83', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
          <span style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>{step}</span>
        </div>
      ))}

      <div style={{ display:'flex', gap:10, margin:'16px 0' }}>
        <button onClick={generate} style={btnPrimary}>⚡ 코드 생성</button>
        <button onClick={copy} disabled={!code} style={{ ...btnGhost, opacity:code?1:0.4 }}>{copied ? '✅ 복사됨!' : '📋 전체 복사'}</button>
      </div>
      <textarea
        value={code} readOnly
        placeholder="'코드 생성' 버튼을 눌러주세요..."
        style={{ width:'100%', minHeight:320, padding:14, border:'1.5px solid #e0e0e0', borderRadius:10, fontFamily:'monospace', fontSize:12, color:'#333', background:'#fafafa', resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}
      />
    </Card>
  )
}

// ════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'#fff', borderRadius:14, padding:20, marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>{children}</div>
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize:13, fontWeight:800, color:'#444', marginBottom:14, letterSpacing:0.5, ...style }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:10 }}><div style={{ fontSize:12, fontWeight:800, color:'#1E4D83', marginBottom:4 }}>{label}</div>{children}</div>
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{children}</div>
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:'#222', color:'#fff', padding:'10px 22px', borderRadius:99, fontSize:13, fontWeight:600, zIndex:999 }}>{msg}</div>
}

function Confirm({ msg, onOk, onCancel, danger }: { msg: string; onOk: ()=>void; onCancel: ()=>void; danger?: boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:600 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:'24px 20px', zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize:14, fontWeight:800, marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>취소</button>
          <button onClick={onOk} style={{ flex:2, padding:'11px', border:'none', borderRadius:10, background: danger?'#e8420a':'#1E4D83', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>삭제</button>
        </div>
      </div>
    </>
  )
}

// ── 공통 스타일
const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', border:'1.5px solid #e0e0e0', borderRadius:9,
  fontSize:14, color:'#333', outline:'none', boxSizing:'border-box',
  fontFamily:'inherit',
}

const btnPrimary: React.CSSProperties = {
  padding:'9px 20px', borderRadius:9, border:'none', background:'#1E4D83', color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer', width:'100%',
}

const btnGhost: React.CSSProperties = {
  padding:'9px 16px', borderRadius:9, border:'1.5px solid #e0e0e0', background:'#fff', color:'#666',
  fontSize:13, fontWeight:700, cursor:'pointer', width:'100%',
}

const btnSmGhost: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'1.5px solid #e0e0e0', background:'#f4f5f8', color:'#666',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const btnSmDanger: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'none', background:'#fee2e2', color:'#e05252',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const checkLabel: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1E4D83', cursor:'pointer',
}
