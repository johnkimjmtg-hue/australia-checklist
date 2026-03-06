import { CATEGORIES } from '../data/businesses'

type Props = {
  selected: string
  onChange: (id: string) => void
}

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 4px',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
    }}>
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              flexShrink: 0,
              background: isActive ? 'linear-gradient(135deg,#3A7FCC,#1E4D83)' : 'rgba(200,218,248,0.4)',
              color: isActive ? '#fff' : '#3a5fa5',
              border: 'none', borderRadius: 20,
              padding: '7px 14px', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 2px 8px rgba(30,77,131,0.20)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        )
      })}
    </div>
  )
}
