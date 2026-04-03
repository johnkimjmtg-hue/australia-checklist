// ─────────────────────────────────────────────
// IPCPage.tsx
// src/pages/IPCPage.tsx
// 호주 입국 신고서 (Incoming Passenger Card) 가이드
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"
const STORAGE_KEY = 'ipc-answers'

type Answer = 'yes' | 'no' | null

interface Question {
  id: string
  en: string
  ko: string
  tip: string
  warning?: string // 🔴 주의 항목
}

// 앞면 YES/NO 질문 11개
const QUESTIONS: Question[] = [
  {
    id: 'q1',
    en: 'Goods that may be prohibited or subject to restrictions, such as medicines, steroids, illegal pornography, firearms, weapons or illicit drugs?',
    ko: '의약품, 스테로이드, 불법 포르노, 총기류, 무기, 불법 약물 등 반입 금지 또는 제한 물품이 있나요?',
    tip: '처방약은 YES. 영문 처방전 지참 시 대부분 통과 가능해요. 건강보조식품·영양제도 해당될 수 있어요.',
    warning: '처방약·영양제가 있으면 YES 체크 후 신고하세요.',
  },
  {
    id: 'q2',
    en: 'More than 2250mL of alcoholic beverages or 25 cigarettes or 25g of tobacco products?',
    ko: '주류 2250mL 초과, 담배 25개비 초과, 또는 담배 제품 25g 초과?',
    tip: '담배 한 갑은 20개비라 면세 범위 안이에요. 두 갑(40개비)이면 YES. 전자담배는 호주 반입 금지!',
    warning: '일회용 전자담배는 반입 자체가 금지예요.',
  },
  {
    id: 'q3',
    en: 'Goods obtained overseas or purchased duty and/or tax free in Australia with a combined total price of more than AUD$900, including gifts?',
    ko: '해외에서 구입하거나 면세로 구입한 물품(선물 포함)의 합계 금액이 AUD $900 초과?',
    tip: '선물도 포함이에요. 쇼핑을 많이 했다면 영수증을 미리 합산해보세요. $900 넘으면 세금 낼 수 있어요.',
  },
  {
    id: 'q4',
    en: 'Goods/samples for business/commercial use?',
    ko: '사업 또는 상업 목적의 물품이나 샘플이 있나요?',
    tip: '개인 사용 목적이면 NO. 판매나 전시 목적의 물품이면 YES.',
  },
  {
    id: 'q5',
    en: 'AUD$10,000 or more in Australian or foreign currency equivalent?',
    ko: '호주 달러 또는 외화로 AUD $10,000 이상의 현금을 소지하고 있나요?',
    tip: '현금 10만 달러가 넘으면 신고 필수. 숨기면 압수됩니다. 신고하는 것 자체는 문제없어요.',
  },
  {
    id: 'q6',
    en: 'Meat, poultry, fish, seafood, eggs, dairy, fruit, vegetables?',
    ko: '육류, 가금류, 생선, 해산물, 달걀, 유제품, 과일, 채소?',
    tip: '라면 스프(고기 성분), 김치, 육포, 멸치도 해당돼요. 애매하면 YES 체크 후 신고하는 게 안전해요.',
    warning: '가장 많이 걸리는 항목! 육포·김치·건어물 있으면 YES.',
  },
  {
    id: 'q7',
    en: 'Grains, seeds, bulbs, straw, nuts, plants, parts of plants, traditional medicines or herbs, wooden articles?',
    ko: '곡물, 씨앗, 구근, 견과류, 식물, 한약재, 목제품?',
    tip: '한약재, 씨앗 팔찌 장식품, 목제 기념품도 해당돼요. 볶은 견과류(포장)는 신고 후 대부분 통과.',
    warning: '한약재 있으면 YES.',
  },
  {
    id: 'q8',
    en: 'Animals, parts of animals, animal products including equipment, pet food, eggs, biologicals, specimens, birds, fish, insects, shells, bee products?',
    ko: '동물, 동물 부위, 동물 제품(장비, 펫푸드, 달걀, 조개껍데기, 꿀 제품 등)?',
    tip: '조개껍데기 기념품, 꿀, 프로폴리스도 해당돼요. 해외에서 산 가죽 제품은 보통 OK지만 신고 권장.',
  },
  {
    id: 'q9',
    en: 'Soil, items with soil attached or used in freshwater areas e.g. sports/recreational equipment, shoes?',
    ko: '흙, 흙이 묻은 물건, 또는 민물 지역에서 사용한 스포츠·레크리에이션 장비나 신발?',
    tip: '등산화 밑창에 흙이 묻어있으면 YES! 출발 전에 신발을 깨끗이 닦아오세요.',
    warning: '신발 밑창 흙도 해당! 미리 닦아오세요.',
  },
  {
    id: 'q10',
    en: 'Have you been in contact with farms, farm animals, wilderness areas or freshwater streams/lakes etc in the past 30 days?',
    ko: '지난 30일 이내에 농장, 농장 동물, 자연 지역, 민물 하천이나 호수 등에 접촉했나요?',
    tip: '등산, 캠핑, 농촌 체험도 해당돼요. 한국에서 시골이나 산에 갔다면 YES.',
  },
  {
    id: 'q11',
    en: 'Were you in Africa, South/Central America or the Caribbean in the last 6 days?',
    ko: '지난 6일 이내에 아프리카, 남미/중미, 또는 카리브해 지역에 있었나요?',
    tip: '한국에서 직항이면 대부분 NO. 경유지에 따라 달라질 수 있어요.',
  },
]

// 뒷면 방문 목적
const TRAVEL_REASONS = [
  { id: '1', label: '컨벤션/학술대회', en: 'Convention/conference' },
  { id: '2', label: '비즈니스', en: 'Business' },
  { id: '3', label: '친지/친구 방문', en: 'Visiting friends or relatives' },
  { id: '4', label: '취업', en: 'Employment' },
  { id: '5', label: '교육', en: 'Education' },
  { id: '6', label: '전시회', en: 'Exhibition' },
  { id: '7', label: '휴가/관광', en: 'Holiday' },
  { id: '8', label: '기타', en: 'Other' },
]

type TabType = 'guide' | 'tips'
type SideType = 'front' | 'back'

interface IPCAnswers {
  [key: string]: Answer
  tuberculosis: Answer
  criminal: Answer
  intendToLive: Answer
  travelReason: string | null
  visitorType: 'A' | 'B' | 'C' | null
}

const DEFAULT_ANSWERS: IPCAnswers = {
  tuberculosis: null, criminal: null, intendToLive: null,
  travelReason: null, visitorType: null,
}
QUESTIONS.forEach(q => { DEFAULT_ANSWERS[q.id] = null })

export default function IPCPage({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabType>('guide')
  const [side, setSide] = useState<SideType>('front')
  const [answers, setAnswers] = useState<IPCAnswers>(() => {
    try { return { ...DEFAULT_ANSWERS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } }
    catch { return { ...DEFAULT_ANSWERS } }
  })
  const [tipItem, setTipItem] = useState<Question | null>(null)
  const [showResult, setShowResult] = useState(false)

  const setAnswer = (id: string, val: Answer | string | null) => {
    const next = { ...answers, [id]: val }
    setAnswers(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  // 결과 분석
  const yesCount = QUESTIONS.filter(q => answers[q.id] === 'yes').length
  const warningYes = QUESTIONS.filter(q => q.warning && answers[q.id] === 'yes')
  const unanswered = QUESTIONS.filter(q => answers[q.id] === null).length
  const allAnswered = unanswered === 0

  const resultStatus = warningYes.length > 0 ? 'danger' : yesCount > 0 ? 'warn' : 'safe'

  return (
    <div style={{ fontFamily: ff, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .ipc-yn-btn { transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
        .ipc-yn-btn:active { transform: scale(0.95); }
      `}</style>

      {/* 상단 탭 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '4px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {([
          { id: 'guide', label: '📋 작성 가이드' },
          { id: 'tips',  label: '💡 핵심 팁' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            height: 32, padding: '0 14px', borderRadius: 20, border: 'none',
            background: tab === t.id ? '#0D3349' : '#F8FAFC',
            color: tab === t.id ? '#fff' : '#64748B',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            cursor: 'pointer', fontFamily: ff,
          }}>{t.label}</button>
        ))}
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* ── 작성 가이드 탭 */}
        {tab === 'guide' && (
          <>
            {/* 앞면/뒷면 전환 */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {([
                { id: 'front', label: '앞면 (신고 항목)' },
                { id: 'back',  label: '뒷면 (인적사항)' },
              ] as const).map(s => (
                <button key={s.id} onClick={() => setSide(s.id)} style={{
                  flex: 1, height: 36, borderRadius: 9, border: 'none',
                  background: side === s.id ? '#fff' : 'transparent',
                  color: side === s.id ? '#0D3349' : '#94A3B8',
                  fontSize: 13, fontWeight: side === s.id ? 700 : 400,
                  cursor: 'pointer', fontFamily: ff,
                  boxShadow: side === s.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>{s.label}</button>
              ))}
            </div>

            {/* 안내 배너 */}
            <div style={{ background: 'rgba(41,182,208,0.08)', border: '1px solid rgba(41,182,208,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#0369A1', lineHeight: 1.6 }}>
              ✈️ <strong>비행기 안에서 미리 연습해보세요!</strong><br />
              모든 답변은 오프라인으로 저장돼요. 실제 카드는 영문으로 작성해야 해요.
            </div>
            {/* ATD 안내 */}
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
              📱 <strong>디지털 신고서(ATD) 안내</strong><br />
              2024년부터 퀀타스 항공 일부 노선은 앱으로 미리 제출 가능해요. 단, <strong>대한항공·아시아나 등 한국 항공사는 아직 해당 없어요.</strong> 기존 종이 IPC를 기내에서 작성하세요.
            </div>

            {/* ── 앞면 */}
            {side === 'front' && (
              <>
                {/* YES/NO 질문들 */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>
                  아래 물품을 호주로 반입하시나요?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {QUESTIONS.map((q, i) => {
                    const ans = answers[q.id]
                    return (
                      <div key={q.id} style={{
                        background: ans === 'yes' ? (q.warning ? '#FEF2F2' : '#FFFBEB') : '#F8FAFC',
                        borderRadius: 14, padding: '14px 14px 12px',
                        border: ans === 'yes' ? (q.warning ? '1px solid rgba(220,38,38,0.2)' : '1px solid rgba(234,179,8,0.25)') : '1px solid rgba(0,0,0,0.06)',
                      }}>
                        {/* 질문 번호 + 텍스트 */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            background: ans === 'yes' ? (q.warning ? '#DC2626' : '#D97706') : '#E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            color: ans === 'yes' ? '#fff' : '#64748B',
                          }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0D3349', lineHeight: 1.5 }}>{q.ko}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, lineHeight: 1.4 }}>{q.en}</div>
                          </div>
                        </div>

                        {/* YES/NO + 팁 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button className="ipc-yn-btn" onClick={() => setAnswer(q.id, ans === 'yes' ? null : 'yes')} style={{
                            height: 32, padding: '0 16px', borderRadius: 20, border: 'none',
                            background: ans === 'yes' ? '#DC2626' : 'rgba(220,38,38,0.08)',
                            color: ans === 'yes' ? '#fff' : '#DC2626',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                          }}>YES</button>
                          <button className="ipc-yn-btn" onClick={() => setAnswer(q.id, ans === 'no' ? null : 'no')} style={{
                            height: 32, padding: '0 16px', borderRadius: 20, border: 'none',
                            background: ans === 'no' ? '#29B6D0' : 'rgba(41,182,208,0.08)',
                            color: ans === 'no' ? '#fff' : '#29B6D0',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                          }}>NO</button>
                          <button onClick={() => setTipItem(q)} style={{
                            marginLeft: 'auto', height: 28, padding: '0 12px', borderRadius: 20, border: 'none',
                            background: 'rgba(41,182,208,0.12)', color: '#0369A1',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            💡 팁
                          </button>
                        </div>
                        {q.warning && ans === 'yes' && (
                          <div style={{ marginTop: 8, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>⚠️ {q.warning}</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 비호주 시민 질문 */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>호주 시민이 아닌 경우</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { id: 'tuberculosis', ko: '결핵이 있나요?', en: 'Do you have tuberculosis?' },
                    { id: 'criminal', ko: '형사 유죄 판결을 받은 적이 있나요?', en: 'Do you have any criminal conviction/s?' },
                    { id: 'intendToLive', ko: '향후 12개월 동안 호주에 거주할 예정인가요?', en: 'Do you intend to live in Australia for the next 12 months?' },
                  ].map(item => {
                    const ans = answers[item.id] as Answer
                    return (
                      <div key={item.id} style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0D3349', marginBottom: 3 }}>{item.ko}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>{item.en}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ipc-yn-btn" onClick={() => setAnswer(item.id, ans === 'yes' ? null : 'yes')} style={{
                            height: 32, padding: '0 16px', borderRadius: 20, border: 'none',
                            background: ans === 'yes' ? '#DC2626' : 'rgba(220,38,38,0.08)',
                            color: ans === 'yes' ? '#fff' : '#DC2626',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                          }}>YES</button>
                          <button className="ipc-yn-btn" onClick={() => setAnswer(item.id, ans === 'no' ? null : 'no')} style={{
                            height: 32, padding: '0 16px', borderRadius: 20, border: 'none',
                            background: ans === 'no' ? '#29B6D0' : 'rgba(41,182,208,0.08)',
                            color: ans === 'no' ? '#fff' : '#29B6D0',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
                          }}>NO</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 결과 확인 버튼 */}
                <button onClick={() => setShowResult(true)} style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: allAnswered ? '#0D3349' : '#E2E8F0',
                  color: allAnswered ? '#fff' : '#94A3B8',
                  fontSize: 15, fontWeight: 700, cursor: allAnswered ? 'pointer' : 'default',
                  fontFamily: ff, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {allAnswered ? '✈️ 입국 신고서 점검하기' : `${unanswered}개 항목 미응답`}
                </button>
              </>
            )}

            {/* ── 뒷면 */}
            {side === 'back' && (
              <>
                {/* A/B/C 선택 */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>방문 유형을 선택하세요</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {([
                    { id: 'B', ko: 'B. 방문자/임시 입국자', en: 'Visitor or temporary entrant', desc: '여행, 유학, 워킹홀리데이' },
                    { id: 'A', ko: 'A. 영구 이민', en: 'Migrating permanently', desc: '호주 영주권/시민권 취득' },
                    { id: 'C', ko: 'C. 귀국 거주자', en: 'Resident returning', desc: '호주 거주자 귀국' },
                  ] as const).map(v => (
                    <button key={v.id} onClick={() => setAnswer('visitorType', answers.visitorType === v.id ? null : v.id)} style={{
                      flex: 1, padding: '12px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: answers.visitorType === v.id ? '#0D3349' : '#F8FAFC',
                      color: answers.visitorType === v.id ? '#fff' : '#0D3349',
                      fontFamily: ff, textAlign: 'center' as const,
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{v.id === 'B' ? '✈️' : v.id === 'A' ? '🏡' : '🔄'}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{v.ko}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{v.desc}</div>
                    </button>
                  ))}
                </div>

                {/* 방문 목적 */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>방문 주요 목적 (1개 선택)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {TRAVEL_REASONS.map(r => (
                    <button key={r.id} onClick={() => setAnswer('travelReason', answers.travelReason === r.id ? null : r.id)} style={{
                      padding: '12px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: answers.travelReason === r.id ? '#29B6D0' : '#F8FAFC',
                      color: answers.travelReason === r.id ? '#fff' : '#0D3349',
                      fontSize: 13, fontWeight: answers.travelReason === r.id ? 700 : 400,
                      fontFamily: ff,
                    }}>
                      <div>{r.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{r.en}</div>
                    </button>
                  ))}
                </div>

                {/* 작성 팁 */}
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D3349', marginBottom: 10 }}>✍️ 작성 시 주의사항</div>
                  {[
                    { label: '영문 대문자로', desc: '이름, 주소 등 모든 항목은 영문 대문자로 작성하세요.' },
                    { label: '여권과 동일하게', desc: '성(Family/surname)과 이름(Given names)은 여권과 똑같이 써야 해요.' },
                    { label: '호주 내 주소', desc: '숙소 주소를 미리 영어로 저장해두세요. 호텔명 + 도시 + State로 작성.' },
                    { label: '항공편 번호', desc: 'KE107, OZ601 등 탑승하는 항공편 번호를 적어요.' },
                    { label: '파란색/검정 볼펜', desc: '연필이나 다른 색 펜은 안 돼요.' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#29B6D0', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0D3349' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── 핵심 팁 탭 */}
        {tab === 'tips' && (
          <>
            {/* 벌금 경고 */}
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>🚨 미신고 적발 시 벌금</div>
              <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.7 }}>
                현장 벌금 최소 <strong>AUD $6,260 (약 570만원)</strong><br />
                비자 취소 및 향후 입국 불이익 가능<br />
                <strong>애매하면 무조건 YES 체크 → 신고 카운터로!</strong>
              </div>
            </div>

            {/* 핵심 원칙 */}
            <div style={{ background: 'rgba(41,182,208,0.08)', border: '1px solid rgba(41,182,208,0.2)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0369A1', marginBottom: 8 }}>✅ 핵심 원칙</div>
              {[
                '신고(YES)했다가 압수돼도 벌금은 없어요',
                '숨겼다가 걸리면 벌금 + 기록에 남아요',
                '모르면 YES, 심사관이 판단해줘요',
                '탐지견이 음식물을 정확히 찾아냅니다',
              ].map(tip => (
                <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#0D3349' }}>
                  <span style={{ color: '#29B6D0', fontWeight: 700 }}>→</span> {tip}
                </div>
              ))}
            </div>

            {/* 한국인 주의 음식 */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349', marginBottom: 10 }}>🍱 한국인이 자주 가져가는 음식</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { item: '육포·소시지·육수팩', status: '🔴', desc: '절대 금지. 고기 성분 = 압수 + 벌금' },
                { item: '라면 (고기 스프 포함)', status: '🟡', desc: '신고 후 대부분 통과. 스프 성분 확인 필요' },
                { item: '햇반·컵밥', status: '🟡', desc: '신고 하면 통과 가능 (10kg 이하)' },
                { item: '김치 (진공포장)', status: '🟡', desc: '신고 필수. 진공포장 강력 권장' },
                { item: '멸치·마른오징어', status: '🟡', desc: '신고 후 검사 → 대부분 통과' },
                { item: '초콜릿·과자 (육류 없는 것)', status: '🟢', desc: '반입 가능. 신고 불필요' },
                { item: '생과일·생채소', status: '🔴', desc: '절대 금지. 기내 사과도 버려야 해요' },
              ].map(row => (
                <div key={row.item} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                  background: row.status === '🔴' ? '#FEF2F2' : row.status === '🟡' ? '#FFFBEB' : '#F0FDF4',
                  border: row.status === '🔴' ? '1px solid rgba(220,38,38,0.15)' : row.status === '🟡' ? '1px solid rgba(217,119,6,0.15)' : '1px solid rgba(22,163,74,0.15)',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{row.status}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D3349' }}>{row.item}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 심사관 질문 */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D3349', marginBottom: 10 }}>💬 심사관 예상 질문</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'What is the purpose of your visit?', a: '방문 목적이 무엇인가요?', ans: 'I\'m here for a holiday. / Sightseeing.' },
                { q: 'How long are you staying?', a: '얼마나 머물 예정인가요?', ans: 'About (N) days. / (N) weeks.' },
                { q: 'Where are you staying?', a: '어디 머무실 예정인가요?', ans: 'At (호텔명) in Sydney.' },
                { q: 'Do you have anything to declare?', a: '신고할 물품이 있나요?', ans: 'Yes, I have food items. / No, nothing to declare.' },
              ].map(item => (
                <div key={item.q} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>{item.a}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D3349', marginBottom: 6 }}>"{item.q}"</div>
                  <div style={{ fontSize: 12, color: '#29B6D0', fontWeight: 600 }}>→ {item.ans}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 팁 팝업 */}
      {tipItem && (
        <>
          <div onClick={() => setTipItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1100 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430, background: '#fff',
            borderRadius: '20px 20px 0 0', zIndex: 1101,
            animation: 'slideUpSheet 0.25s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '20px 20px 40px', fontFamily: ff,
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={() => setTipItem(null)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0D3349', marginBottom: 8, lineHeight: 1.5 }}>{tipItem.ko}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14, lineHeight: 1.5 }}>{tipItem.en}</div>
            <div style={{ background: 'rgba(41,182,208,0.08)', border: '1px solid rgba(41,182,208,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#0D3349', lineHeight: 1.7 }}>
              💡 {tipItem.tip}
            </div>
            {tipItem.warning && (
              <div style={{ marginTop: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 700 }}>
                ⚠️ {tipItem.warning}
              </div>
            )}
          </div>
        </>
      )}

      {/* 결과 팝업 */}
      {showResult && (
        <>
          <div onClick={() => setShowResult(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 'calc(100% - 48px)', maxWidth: 340, background: '#fff',
            borderRadius: 20, zIndex: 1201, padding: '28px 20px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: ff, textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {resultStatus === 'danger' ? '🚨' : resultStatus === 'warn' ? '⚠️' : '✅'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              {resultStatus === 'danger' ? '주의! 반드시 신고하세요' :
               resultStatus === 'warn' ? `YES 항목 ${yesCount}개 — 신고 카운터로` :
               '문제없어요! 입국 준비 완료'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 20 }}>
              {resultStatus === 'danger' ? (
                <>{warningYes.map(q => q.ko).join(', ')}<br />반드시 신고(Declare) 카운터로 가세요!</>
              ) : resultStatus === 'warn' ? (
                <>YES 체크 항목이 있어요.<br />입국 신고서에 정확히 체크하고<br />신고 카운터(레드 채널)로 가세요.</>
              ) : (
                <>신고할 물품이 없어요.<br />그린 채널로 빠르게 통과하세요! 🦘</>
              )}
            </div>
            <button onClick={() => setShowResult(false)} style={{
              width: '100%', height: 48, borderRadius: 12, border: 'none',
              background: resultStatus === 'danger' ? '#DC2626' : resultStatus === 'warn' ? '#D97706' : '#29B6D0',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
            }}>확인</button>
          </div>
        </>
      )}
    </div>
  )
}
