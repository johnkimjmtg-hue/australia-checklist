// ─────────────────────────────────────────────
// EmergencyWidget.tsx
// src/pages/EmergencyWidget.tsx
// 긴급 번역 카드 (오프라인)
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

const CATEGORIES = [
  {
    id: 'emergency', label: '🚨 긴급상황', color: '#DC2626', bg: '#FEF2F2',
    phrases: [
      { ko: '도와주세요!', en: 'Help me!', phonetic: '헬프 미!' },
      { ko: '경찰을 불러주세요', en: 'Call the police!', phonetic: '콜 더 폴리스!' },
      { ko: '구급차를 불러주세요', en: 'Call an ambulance!', phonetic: '콜 언 앰뷸런스!' },
      { ko: '불이야!', en: 'Fire!', phonetic: '파이어!' },
      { ko: '도둑이야!', en: 'Thief!', phonetic: '씨프!' },
      { ko: '길을 잃었어요', en: 'I am lost.', phonetic: '아이 엠 로스트.' },
    ],
  },
  {
    id: 'medical', label: '🏥 아파요', color: '#9333EA', bg: '#FAF5FF',
    phrases: [
      { ko: '배가 아파요', en: 'I have a stomachache.', phonetic: '아이 해브 어 스터머케이크.' },
      { ko: '머리가 아파요', en: 'I have a headache.', phonetic: '아이 해브 어 헤드에이크.' },
      { ko: '열이 있어요', en: 'I have a fever.', phonetic: '아이 해브 어 피버.' },
      { ko: '알레르기가 있어요', en: 'I have an allergy.', phonetic: '아이 해브 언 알러지.' },
      { ko: '병원에 데려다 주세요', en: 'Please take me to a hospital.', phonetic: '플리즈 테이크 미 투 어 하스피털.' },
      { ko: '약을 사야 해요', en: 'I need to buy medicine.', phonetic: '아이 니드 투 바이 메디슨.' },
      { ko: '임산부예요', en: 'I am pregnant.', phonetic: '아이 엠 프레그넌트.' },
    ],
  },
  {
    id: 'lost', label: '🎒 분실·도난', color: '#D97706', bg: '#FFFBEB',
    phrases: [
      { ko: '지갑을 잃어버렸어요', en: 'I lost my wallet.', phonetic: '아이 로스트 마이 월렛.' },
      { ko: '여권을 잃어버렸어요', en: 'I lost my passport.', phonetic: '아이 로스트 마이 패스포트.' },
      { ko: '핸드폰을 잃어버렸어요', en: 'I lost my phone.', phonetic: '아이 로스트 마이 폰.' },
      { ko: '가방을 도난당했어요', en: 'My bag was stolen.', phonetic: '마이 백 워즈 스톨런.' },
      { ko: '분실물 센터가 어디예요?', en: 'Where is the lost and found?', phonetic: '웨어 이즈 더 로스트 앤 파운드?' },
      { ko: '카드를 분실했어요. 정지해주세요', en: 'I lost my card. Please cancel it.', phonetic: '아이 로스트 마이 카드. 플리즈 캔슬 잇.' },
    ],
  },
  {
    id: 'transport', label: '🚌 교통', color: '#0284C7', bg: '#EFF6FF',
    phrases: [
      { ko: '~에 가고 싶어요', en: 'I want to go to ~.', phonetic: '아이 원트 투 고 투 ~.' },
      { ko: '이 주소로 가주세요', en: 'Please take me to this address.', phonetic: '플리즈 테이크 미 투 디스 어드레스.' },
      { ko: '여기서 내려주세요', en: 'Please stop here.', phonetic: '플리즈 스탑 히어.' },
      { ko: '공항에 가주세요', en: 'Please take me to the airport.', phonetic: '플리즈 테이크 미 투 디 에어포트.' },
      { ko: '얼마예요?', en: 'How much is it?', phonetic: '하우 머치 이즈 잇?' },
      { ko: '영수증 주세요', en: 'Receipt please.', phonetic: '리싯 플리즈.' },
    ],
  },
  {
    id: 'restaurant', label: '🍽 음식점', color: '#F59E0B', bg: '#FFFBEB',
    phrases: [
      { ko: '이거 주세요', en: 'I will have this.', phonetic: '아이 윌 해브 디스.' },
      { ko: '알레르기가 있어요 (견과류)', en: 'I am allergic to nuts.', phonetic: '아이 엠 알러직 투 넛츠.' },
      { ko: '채식주의자예요', en: 'I am vegetarian.', phonetic: '아이 엠 베지테리언.' },
      { ko: '계산서 주세요', en: 'Check please.', phonetic: '체크 플리즈.' },
      { ko: '카드 결제 되나요?', en: 'Do you accept cards?', phonetic: '두 유 억셉트 카즈?' },
      { ko: '포장해주세요', en: 'Can I get this to go?', phonetic: '캔 아이 겟 디스 투 고?' },
      { ko: '맛있어요!', en: 'It\'s delicious!', phonetic: '잇츠 딜리셔스!' },
    ],
  },
  {
    id: 'accommodation', label: '🏨 숙소', color: '#10B981', bg: '#F0FDF4',
    phrases: [
      { ko: '체크인하고 싶어요', en: 'I would like to check in.', phonetic: '아이 우드 라이크 투 체크 인.' },
      { ko: '예약했어요', en: 'I have a reservation.', phonetic: '아이 해브 어 레저베이션.' },
      { ko: '방 열쇠를 잃어버렸어요', en: 'I lost my room key.', phonetic: '아이 로스트 마이 룸 키.' },
      { ko: '에어컨이 안 돼요', en: 'The air conditioning is not working.', phonetic: '디 에어 컨디셔닝 이즈 낫 워킹.' },
      { ko: '와이파이 비밀번호가 뭐예요?', en: 'What is the Wi-Fi password?', phonetic: '왓 이즈 더 와이파이 패스워드?' },
      { ko: '체크아웃 시간이 언제예요?', en: 'What time is checkout?', phonetic: '왓 타임 이즈 체크아웃?' },
    ],
  },
]

// 긴급 번호
const EMERGENCY_NUMBERS = [
  { label: '경찰·소방·구급', number: '000', desc: '호주 긴급신고', color: '#DC2626' },
  { label: '한국 대사관 (시드니)', number: '+61-2-9210-0200', desc: '24시간 긴급전화', color: '#0284C7' },
  { label: '한국 영사관 (멜번)', number: '+61-3-9533-3800', desc: '24시간 긴급전화', color: '#0284C7' },
  { label: '여행자 보험 신고', number: '보험증서 확인', desc: '출발 전 번호 저장', color: '#D97706' },
]

export default function EmergencyWidget({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('emergency')
  const [copied, setCopied] = useState<string | null>(null)

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  const activeCat = CATEGORIES.find(c => c.id === activeTab)!

  return (
    <div style={{ fontFamily: ff, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* 긴급 번호 배너 */}
      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>🚨 긴급 전화번호</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {EMERGENCY_NUMBERS.map(n => (
              <button key={n.label} onClick={() => copyText(n.number)} style={{
                background: '#fff', border: `1px solid ${n.color}20`,
                borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                textAlign: 'left' as const, fontFamily: ff,
              }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{n.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: n.color }}>
                  {copied === n.number ? '복사됨 ✓' : n.number}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{n.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '0 16px 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
            height: 32, padding: '0 12px', borderRadius: 20, border: 'none',
            background: activeTab === cat.id ? cat.color : 'rgba(0,0,0,0.06)',
            color: activeTab === cat.id ? '#fff' : '#64748B',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0, fontFamily: ff,
          }}>{cat.label}</button>
        ))}
      </div>

      {/* 표현 카드 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeCat.phrases.map((p, i) => (
            <button key={i} onClick={() => copyText(p.en)} style={{
              background: activeTab === 'emergency' && i === 0 ? '#FEF2F2' : activeCat.bg,
              border: `1px solid ${activeCat.color}20`,
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              textAlign: 'left' as const, fontFamily: ff,
              display: 'block', width: '100%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0D3349' }}>{p.ko}</div>
                <div style={{ fontSize: 11, color: copied === p.en ? activeCat.color : '#CBD5E1', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                  {copied === p.en ? '복사됨 ✓' : '탭하면 복사'}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: activeCat.color, marginBottom: 4 }}>{p.en}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{p.phonetic}</div>
            </button>
          ))}
        </div>

        {/* 오프라인 안내 */}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(41,182,208,0.06)', borderRadius: 12, fontSize: 12, color: '#64748B', textAlign: 'center' as const }}>
          ✈️ 인터넷 없이 사용 가능해요
        </div>
      </div>
    </div>
  )
}
