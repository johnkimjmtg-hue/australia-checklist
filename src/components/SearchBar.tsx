type Props = {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', borderRadius: 14,
        padding: '11px 16px',
        boxShadow: '0 2px 12px rgba(30,77,131,0.09)',
        border: '1px solid rgba(200,215,240,0.6)',
      }}>
        <span style={{ fontSize: 16 }}>🔎</span>
        <input
          type="text"
          placeholder="업체명, 서비스, 지역 검색..."
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 14, color: '#0F1B2D', background: 'transparent',
            fontFamily: '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
            fontWeight: 600,
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#aab', padding: 0 }}
          >✕</button>
        )}
      </div>
    </div>
  )
}
