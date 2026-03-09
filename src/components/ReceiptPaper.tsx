import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { ITEMS } from '../data/checklist'
import { getGrade, getGradeLabel, getGradeColor } from '../utils/grade'

type Props = { state: AppState; trip: TripInfo; issuedAt: string }

export default function ReceiptPaper({ state, trip, issuedAt }: Props) {
  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
  const done  = Object.keys(state.selected).length
  const total = allItems.length
  const grade = getGrade(done, total)
  const days  = getTripDays(trip)

  const dayGroups = days.map((date, idx) => ({
    dayIdx: idx, date,
    items: allItems.filter(item =>
      state.selected[item.id] && (state.schedules[item.id] ?? []).includes(idx)
    ),
  })).filter(g => g.items.length > 0)

  const unscheduled = allItems.filter(item =>
    state.selected[item.id] && !(state.schedules[item.id]?.length)
  )

  const ff = "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"

  return (
    <div id="receipt-root" style={{
      width: 320, margin: '0 auto',
      fontFamily: ff,
      background: '#fff',
      borderRadius: 14,
      border: '1px solid rgba(27,110,243,0.12)',
      overflow: 'hidden',
    }}>

      {/* ── 헤더: 로고 + 여행기간 한 줄 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1B6EF3, #1B6EF3)',
        padding: '14px 16px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8, letterSpacing: 2.5, fontWeight: 800, marginBottom: 3 }}>
            BUCKET LIST
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>호주가자</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8, letterSpacing: 1, marginBottom: 2 }}>{issuedAt}</div>
          <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
            {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 }}>
            {done}건 완료 · <span style={{ color: getGradeColor(grade), fontWeight: 800 }}>{grade} CLASS</span>
          </div>
        </div>
      </div>

      {/* ── 항목 목록 ── */}
      <div style={{ padding: '0' }}>
        {dayGroups.length === 0 && unscheduled.length === 0 ? (
          <p style={{ color: '#C0CCD8', textAlign: 'center', fontSize: 12, padding: '24px 0' }}>체크한 항목이 없습니다</p>
        ) : (
          <>
            {dayGroups.map(({ dayIdx, date, items }) => (
              <div key={dayIdx}>
                {/* 날짜 구분선 — 작고 조용하게 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px 4px',
                  background: '#F8FAFD',
                  borderBottom: '1px solid rgba(27,110,243,0.06)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#1B6EF3' }}>{dayIdx+1}일차</span>
                  <span style={{ fontSize: 10, color: '#AAB8CC', fontWeight: 500 }}>{fmtMD(date)} ({dow(date)})</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#AAB8CC' }}>{items.length}건</span>
                </div>
                {/* 항목들 */}
                {items.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px',
                    borderBottom: '1px solid rgba(27,110,243,0.05)',
                  }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: 12, color: '#1C2E45', fontWeight: 500, flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 10, color: '#1B6EF3', fontWeight: 800 }}>✓</span>
                  </div>
                ))}
              </div>
            ))}

            {/* 미지정 */}
            {unscheduled.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px 4px',
                  background: '#F8FAFD',
                  borderBottom: '1px solid rgba(27,110,243,0.06)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#AAB8CC' }}>날짜 미지정</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#AAB8CC' }}>{unscheduled.length}건</span>
                </div>
                {unscheduled.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px',
                    borderBottom: '1px solid rgba(27,110,243,0.05)',
                  }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: 12, color: '#AAB8CC', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 10, color: '#AAB8CC' }}>✓</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 합계 + 등급 ── */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1.5px dashed rgba(27,110,243,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#0F1B2D', letterSpacing: 0.5 }}>TOTAL </span>
            <span style={{ fontSize: 11, color: '#1B6EF3', fontWeight: 800 }}>{done}/{total}건</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: getGradeColor(grade), fontWeight: 900 }}>{grade} CLASS</span>
            <span style={{ fontSize: 10, color: '#8AAAC8', marginLeft: 6 }}>"{getGradeLabel(grade)}"</span>
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div style={{
          padding: '8px 14px 12px',
          borderTop: '1px solid rgba(27,110,243,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 9, color: '#C0CCD8', fontWeight: 600 }}>호주가자 · 여행 버킷리스트 🦘</span>
          <span style={{ fontSize: 9, color: '#C0CCD8', letterSpacing: 1 }}>{state.meta.receiptCode}</span>
        </div>

        {/* ── 바코드 ── */}
        <div style={{
          padding: '10px 14px 14px',
          borderTop: '1px dashed rgba(27,110,243,0.10)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <svg width="240" height="40" viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg">
            {[2,6,9,13,16,19,23,27,30,33,37,40,44,47,51,54,57,61,65,68,72,75,78,82,85,89,92,95,99,102,106,109,112,116,119,122,126,130,133,136,140,143,147,150,153,157,160,163,167,170,174,177,180,184,187,191,194,197,201,204,208,211,214,218,221,225,228,231,235,238].map((x, i) => (
              <rect key={i} x={x} y={0} width={i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1} height={i % 7 === 0 ? 40 : 32} fill="rgba(27,110,243,0.25)" />
            ))}
          </svg>
          <span style={{ fontSize: 8, color: '#C0CCD8', letterSpacing: 2, fontWeight: 600 }}>
            AUSTRALIA-2026-{state.meta.receiptCode}
          </span>
        </div>
      </div>
    </div>
  )
}
