// DebugPage.tsx — 임시 디버그 페이지 (확인 후 삭제)
export default function DebugPage() {
  const cacheVersion    = localStorage.getItem('cache-version')
  const lastChecked     = localStorage.getItem('cache-last-checked')
  const businesses      = localStorage.getItem('cache-businesses')
  const checklist       = localStorage.getItem('cache-checklist')
  const shopping        = localStorage.getItem('cache-shopping')
  const bingo           = localStorage.getItem('cache-bingo')

  const bizCount        = businesses ? JSON.parse(businesses).length : 0
  const checklistCount  = checklist  ? JSON.parse(checklist).items?.length : 0
  const shoppingCount   = shopping   ? JSON.parse(shopping).products?.length : 0
  const bingoCount      = bingo      ? JSON.parse(bingo).length : 0

  const lastCheckedStr  = lastChecked
    ? new Date(parseInt(lastChecked)).toLocaleString('ko-KR')
    : '없음'

  const clearCache = () => {
    localStorage.removeItem('cache-version')
    localStorage.removeItem('cache-last-checked')
    localStorage.removeItem('cache-businesses')
    localStorage.removeItem('cache-checklist')
    localStorage.removeItem('cache-shopping')
    localStorage.removeItem('cache-bingo')
    alert('캐시 삭제 완료. 페이지를 새로고침하세요.')
  }

  const rows = [
    { label: 'cache-version',      value: cacheVersion ?? '없음' },
    { label: 'cache-last-checked', value: lastCheckedStr },
    { label: '업체 수',             value: businesses ? `${bizCount}개` : '캐시 없음' },
    { label: '체크리스트 항목 수',  value: checklist  ? `${checklistCount}개` : '캐시 없음' },
    { label: '쇼핑 상품 수',        value: shopping   ? `${shoppingCount}개` : '캐시 없음' },
    { label: '빙고 카페 수',        value: bingo      ? `${bingoCount}개` : '캐시 없음' },
  ]

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 14 }}>
      <h2 style={{ marginBottom: 20 }}>🔍 Cache Debug</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 8px', color: '#666', whiteSpace: 'nowrap' }}>{label}</td>
              <td style={{ padding: '10px 8px', fontWeight: 'bold', wordBreak: 'break-all' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={clearCache}
        style={{
          marginTop: 32, width: '100%', height: 48,
          background: '#e8420a', color: '#fff',
          border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        캐시 전체 삭제
      </button>
    </div>
  )
}
