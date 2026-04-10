// ─────────────────────────────────────────────
// ExchangeWidget.tsx
// src/pages/ExchangeWidget.tsx
// AUD ↔ KRW 환율 계산기
// Capacitor Android 대응: 다중 API fallback
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"
const RATE_KEY = 'exchange-rate-cache'
const RATE_TS_KEY = 'exchange-rate-ts'
const RATE_TTL = 1000 * 60 * 60 // 1시간

// 여러 API를 순서대로 시도 (하나 실패하면 다음으로)
const fetchRateFromAPIs = async (): Promise<number | null> => {
  // 1순위: exchangerate-api (CORS 허용)
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/AUD', {
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.rates?.KRW) return data.rates.KRW
    }
  } catch {}

  // 2순위: open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AUD')
    if (res.ok) {
      const data = await res.json()
      if (data.rates?.KRW) return data.rates.KRW
    }
  } catch {}

  // 3순위: frankfurter (EUR 기준으로 AUD→KRW 계산)
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=AUD&to=KRW')
    if (res.ok) {
      const data = await res.json()
      if (data.rates?.KRW) return data.rates.KRW
    }
  } catch {}

  return null
}

export default function ExchangeWidget({ onClose }: { onClose: () => void }) {
  const [rate, setRate] = useState<number | null>(() => {
    try { return parseFloat(localStorage.getItem(RATE_KEY) ?? '') || null } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      const ts = localStorage.getItem(RATE_TS_KEY)
      return ts ? new Date(parseInt(ts)).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''
    } catch { return '' }
  })
  const [audInput, setAudInput] = useState('')
  const [krwInput, setKrwInput] = useState('')
  const [direction, setDirection] = useState<'aud2krw' | 'krw2aud'>('aud2krw')

  const fetchRate = async () => {
    setLoading(true)
    setError(false)
    const r = await fetchRateFromAPIs()
    if (r) {
      setRate(r)
      const now = Date.now()
      try {
        localStorage.setItem(RATE_KEY, String(r))
        localStorage.setItem(RATE_TS_KEY, String(now))
      } catch {}
      setLastUpdated(new Date(now).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
      setError(false)
    } else {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    try {
      const ts = parseInt(localStorage.getItem(RATE_TS_KEY) ?? '0')
      if (!rate || Date.now() - ts > RATE_TTL) fetchRate()
    } catch {
      fetchRate()
    }
  }, [])

  const handleAudChange = (v: string) => {
    setAudInput(v)
    setDirection('aud2krw')
    if (rate && v) {
      const krw = parseFloat(v.replace(/,/g, '')) * rate
      setKrwInput(isNaN(krw) ? '' : Math.round(krw).toLocaleString())
    } else setKrwInput('')
  }

  const handleKrwChange = (v: string) => {
    setKrwInput(v)
    setDirection('krw2aud')
    if (rate && v) {
      const aud = parseFloat(v.replace(/,/g, '')) / rate
      setAudInput(isNaN(aud) ? '' : aud.toFixed(2))
    } else setAudInput('')
  }

  const swap = () => {
    if (direction === 'aud2krw') {
      const val = krwInput.replace(/,/g, '')
      handleKrwChange(val)
    } else {
      const val = audInput.replace(/,/g, '')
      handleAudChange(val)
    }
  }

  const QUICK = [10, 20, 50, 100, 200, 500]

  return (
    <div style={{ fontFamily: ff, padding: '16px 16px 40px' }}>
      {/* 환율 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          {loading ? (
            <div style={{ fontSize: 14, color: '#94A3B8' }}>환율 불러오는 중...</div>
          ) : error ? (
            <div>
              <div style={{ fontSize: 13, color: '#DC2626' }}>환율을 불러오지 못했어요</div>
              {rate && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>마지막 저장 환율 사용 중</div>}
            </div>
          ) : rate ? (
            <>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>현재 환율</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0D3349' }}>
                1 AUD = <span style={{ color: '#29B6D0' }}>{Math.round(rate).toLocaleString()}원</span>
              </div>
              {lastUpdated && <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>기준 {lastUpdated}</div>}
            </>
          ) : (
            <div style={{ fontSize: 14, color: '#94A3B8' }}>환율을 불러오는 중...</div>
          )}
        </div>
        <button onClick={fetchRate} disabled={loading} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'rgba(41,182,208,0.1)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon icon="ph:arrow-clockwise" width={16} height={16} color="#29B6D0"
            style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 입력 */}
      <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        {/* AUD */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>🇦🇺 호주 달러 (AUD)</div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1.5px solid', borderColor: direction === 'aud2krw' ? '#29B6D0' : '#E2E8F0', overflow: 'hidden' }}>
            <span style={{ padding: '0 12px', fontSize: 18, fontWeight: 700, color: '#29B6D0' }}>$</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={audInput}
              onChange={e => handleAudChange(e.target.value)}
              style={{ flex: 1, height: 52, border: 'none', outline: 'none', fontSize: 22, fontWeight: 700, color: '#0D3349', background: 'transparent', fontFamily: ff }}
            />
            {audInput && <button onClick={() => { setAudInput(''); setKrwInput('') }} style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon icon="ph:x-circle" width={18} height={18} color="#CBD5E1" />
            </button>}
          </div>
        </div>

        {/* 스왑 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <button onClick={swap} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#29B6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="ph:arrows-down-up" width={16} height={16} color="#fff" />
          </button>
        </div>

        {/* KRW */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>🇰🇷 한국 원 (KRW)</div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1.5px solid', borderColor: direction === 'krw2aud' ? '#FF6B9D' : '#E2E8F0', overflow: 'hidden' }}>
            <span style={{ padding: '0 12px', fontSize: 18, fontWeight: 700, color: '#FF6B9D' }}>₩</span>
            <input
              type="text" inputMode="numeric" placeholder="0"
              value={krwInput}
              onChange={e => handleKrwChange(e.target.value.replace(/,/g, ''))}
              style={{ flex: 1, height: 52, border: 'none', outline: 'none', fontSize: 22, fontWeight: 700, color: '#0D3349', background: 'transparent', fontFamily: ff }}
            />
            {krwInput && <button onClick={() => { setAudInput(''); setKrwInput('') }} style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon icon="ph:x-circle" width={18} height={18} color="#CBD5E1" />
            </button>}
          </div>
        </div>
      </div>

      {/* 빠른 계산 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>빠른 계산 (AUD)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {QUICK.map(v => (
            <button key={v} onClick={() => handleAudChange(String(v))} style={{
              height: 40, borderRadius: 10, border: '1px solid rgba(41,182,208,0.2)',
              background: audInput === String(v) ? '#29B6D0' : 'rgba(41,182,208,0.06)',
              color: audInput === String(v) ? '#fff' : '#0D3349',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
            }}>
              ${v}
              {rate && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>
                {Math.round(v * rate).toLocaleString()}원
              </div>}
            </button>
          ))}
        </div>
      </div>

      {/* 생활비 참고 */}
      <div style={{ background: 'rgba(41,182,208,0.06)', border: '1px solid rgba(41,182,208,0.15)', borderRadius: 14, padding: '14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0D3349', marginBottom: 10 }}>💡 시드니 물가 참고</div>
        {[
          { item: '커피 (롱블랙)', price: 5 },
          { item: '브런치 식사', price: 25 },
          { item: '시내버스 1회', price: 4 },
          { item: '슈퍼마켓 물 1.5L', price: 3 },
          { item: '시내 택시 기본', price: 6 },
        ].map(r => (
          <div key={r.item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>{r.item}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0D3349' }}>
              ${r.price} {rate && <span style={{ color: '#94A3B8', fontWeight: 400 }}>≈ {Math.round(r.price * rate).toLocaleString()}원</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
