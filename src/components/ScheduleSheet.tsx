import { colors, font, radius, spacing } from '../styles/tokens'
import { TripInfo, getTripDays, fmtMD, dow } from '../store/state'

type Props = { itemLabel:string; trip:TripInfo; currentDays:number[]; onSelect:(days:number[])=>void; onClose:()=>void }

export default function ScheduleSheet({ itemLabel, trip, currentDays, onSelect, onClose }: Props) {
  const days = getTripDays(trip)
  const toggle = (idx:number) => {
    const next = currentDays.includes(idx) ? currentDays.filter(d=>d!==idx) : [...currentDays, idx]
    onSelect(next)
  }

  return (
    <>
      {/* 딤 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 500,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* 시트 */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 398,
        background: colors.bgCard,
        borderRadius: radius.xl,
        zIndex: 501,
        padding: `${spacing[4]}px ${spacing[4]}px ${spacing[5]}px`,
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'slideUpSheet 0.25s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
      }}>

        {/* 핸들 */}
        <div style={{
          width: 36, height: 4,
          background: colors.gray200,
          borderRadius: radius.full,
          margin: '0 auto',
          flexShrink: 0,
        }} />

        {/* 제목 */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: font.size.xs, color: colors.textTertiary, fontWeight: font.weight.medium, marginBottom: 4 }}>
            일정 추가
          </div>
          <div style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textPrimary, lineHeight: 1.4 }}>
            <span style={{ color: colors.primary }}>"{itemLabel}"</span>
          </div>
        </div>

        {/* 날짜 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}>
          {days.map((d, idx) => {
            const sel = currentDays.includes(idx)
            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                style={{
                  padding: '10px 4px',
                  borderRadius: radius.sm,
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: sel
                    ? `1.5px solid ${colors.primary}`
                    : `1px solid ${colors.gray200}`,
                  background: sel ? colors.primaryLight : colors.bgCard,
                  color: sel ? colors.primary : colors.textSecondary,
                  transition: 'all 0.12s',
                  WebkitTapHighlightColor: 'transparent',
                  fontFamily: font.family,
                }}
              >
                <div style={{ fontWeight: sel ? font.weight.bold : font.weight.medium, fontSize: font.size.sm }}>
                  {idx + 1}일
                </div>
                <div style={{ fontSize: font.size.xs, opacity: 0.7, marginTop: 2 }}>{fmtMD(d)}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>{dow(d)}</div>
              </button>
            )
          })}
        </div>

        {/* 선택 현황 */}
        {currentDays.length > 0 && (
          <div style={{
            background: colors.primaryLight,
            borderRadius: radius.sm,
            padding: `${spacing[2]}px ${spacing[3]}px`,
            textAlign: 'center',
            fontSize: font.size.sm,
            fontWeight: font.weight.bold,
            color: colors.primary,
            flexShrink: 0,
          }}>
            📅 {currentDays.length}일 선택됨
          </div>
        )}

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: 48,
            flexShrink: 0,
            background: currentDays.length > 0 ? colors.primary : colors.gray100,
            color: currentDays.length > 0 ? '#fff' : colors.textTertiary,
            border: 'none',
            borderRadius: radius.md,
            fontSize: font.size.md,
            fontWeight: font.weight.bold,
            cursor: 'pointer',
            fontFamily: font.family,
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s',
          }}
        >
          {currentDays.length > 0 ? `${currentDays.length}일 추가하기 ✓` : '닫기'}
        </button>
      </div>
    </>
  )
}
