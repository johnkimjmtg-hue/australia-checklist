// ─────────────────────────────────────────────
// ChecklistSheet.tsx
// 체크리스트를 바텀시트로 표시
// src/components/ChecklistSheet.tsx
// ─────────────────────────────────────────────
import { AppState } from '../store/state'
import ChecklistPage from '../pages/ChecklistPage'

type Props = {
  state: AppState
  setState: (s: AppState) => void
  onClose: () => void
}

export default function ChecklistSheet({ state, setState, onClose }: Props) {
  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }}
      />

      {/* 바텀시트 - 약관 팝업과 동일한 스타일 */}
      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:398,
        background:'#EFFCFC', borderRadius:20,
        maxHeight:'85vh', overflowY:'auto', zIndex:801,
        animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column',
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* X 닫기 버튼 */}
        <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%',
            background:'rgba(0,0,0,0.08)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
          }}>
            <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
          </button>
        </div>

        {/* ChecklistPage */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <ChecklistPage
            state={state}
            setState={setState}
            initialTab="bucketlist"
            onGoHome={onClose}
            embedded
          />
        </div>
      </div>
    </>
  )
}
