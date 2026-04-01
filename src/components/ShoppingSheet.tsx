// ─────────────────────────────────────────────
// ShoppingSheet.tsx
// src/components/ShoppingSheet.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'
import MyShoppingView from '../pages/MyShoppingView'
import Shopping from '../pages/Shopping'

type View = 'mylist' | 'shopping'

type Props = {
  onClose: () => void
}

export default function ShoppingSheet({ onClose }: Props) {
  const [view, setView] = useState<View>('mylist')
  const [myList, setMyList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] }
  })
  const [myChecked, setMyChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} }
  })

  const handleMyListChange = (next: string[]) => {
    setMyList(next)
    try { localStorage.setItem('my-shopping-list', JSON.stringify(next)) } catch {}
  }

  const handleMyCheckedChange = (next: Record<string, boolean>) => {
    setMyChecked(next)
    try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {}
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#ffffff', borderRadius:'20px 20px 0 0',
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
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 12px 0' }}>
          {view === 'shopping' ? (
            <button onClick={() => setView('mylist')} style={{ background:'#CC3300', border:'none', borderRadius:20, padding:'6px 14px 6px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:6, WebkitTapHighlightColor:'transparent' }}>
              <Icon icon="ph:arrow-left" width={16} height={16} color="#ffffff" />
              <span style={{ fontSize:14, fontWeight:700, color:'#ffffff' }}>내 쇼핑리스트</span>
            </button>
          ) : <div />}
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {view === 'mylist' ? (
            <MyShoppingView
              myList={myList}
              myChecked={myChecked}
              onMyListChange={handleMyListChange}
              onMyCheckedChange={handleMyCheckedChange}
              onBack={() => setView('shopping')}
              onLanding={onClose}
            />
          ) : (
            <Shopping
              myList={myList}
              myChecked={myChecked}
              onMyListChange={handleMyListChange}
              onMyCheckedChange={handleMyCheckedChange}
              onGoToMyList={() => setView('mylist')}
            />
          )}
        </div>
      </div>
    </>
  )
}
