// ─────────────────────────────────────────────
// BingoSheet.tsx
// src/components/BingoSheet.tsx
// ─────────────────────────────────────────────
import { Icon } from '@iconify/react'
import BingoPage from '../pages/BingoPage'

type Props = {
  onClose: () => void
}

export default function BingoSheet({ onClose }: Props) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'linear-gradient(180deg, #8E9EAB 0%, #CFD9DF 30%, #EEF2F5 100%)', borderRadius:'20px 20px 0 0',
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

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>☕ 카페 빙고</div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%',
            background:'rgba(0,0,0,0.10)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
          }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <BingoPage embedded onBack={onClose} />
        </div>
      </div>
    </>
  )
}
