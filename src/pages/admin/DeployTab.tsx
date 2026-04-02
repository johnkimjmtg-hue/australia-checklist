// ─────────────────────────────────────────────
// DeployTab.tsx
// src/pages/admin/DeployTab.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { Toast } from './adminShared'

const DEPLOY_ITEMS = [
  { key: 'checklist',  label: '체크리스트',  icon: 'ph:list-checks',      desc: '카테고리 + 항목' },
  { key: 'businesses', label: '업체리스트',  icon: 'ph:buildings',         desc: '전체 업체 정보' },
  { key: 'shopping',   label: '쇼핑리스트',  icon: 'ph:shopping-bag',      desc: '카테고리 + 상품' },
  { key: 'bingo',      label: '카페빙고',    icon: 'ph:coffee',             desc: '빙고 카페 목록' },
  { key: 'events',     label: '행사일정',    icon: 'ph:calendar-check',    desc: '달력 행사 데이터' },
]

export default function DeployTab() {
  const [versions, setVersions] = useState<Record<string, number>>({})
  const [loading, setLoading]   = useState(true)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [toast, setToast]       = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('cache_version').select('key, version')
    if (data) { const v: Record<string, number> = {}; data.forEach((row: any) => { v[row.key] = row.version }); setVersions(v) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deploy = async (key: string) => {
    setDeploying(key)
    const newVersion = (versions[key] ?? 0) + 1
    const { error } = await supabase.from('cache_version').upsert({ key, version: newVersion, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (!error) { setVersions(prev => ({ ...prev, [key]: newVersion })); showToast(`✅ ${DEPLOY_ITEMS.find(i => i.key === key)?.label} 배포 완료 (v${newVersion})`) }
    else showToast('❌ 배포 실패: ' + error.message)
    setDeploying(null)
  }

  const deployAll = async () => {
    if (!confirm('모든 데이터를 배포할까요? 모든 사용자가 다음 방문 시 데이터를 새로 다운로드합니다.')) return
    setDeploying('all')
    const updates = DEPLOY_ITEMS.map(item => ({ key: item.key, version: (versions[item.key] ?? 0) + 1, updated_at: new Date().toISOString() }))
    const { error } = await supabase.from('cache_version').upsert(updates, { onConflict: 'key' })
    if (!error) { const newVer: Record<string, number> = {}; updates.forEach(u => { newVer[u.key] = u.version }); setVersions(prev => ({ ...prev, ...newVer })); showToast('✅ 전체 배포 완료!') }
    else showToast('❌ 배포 실패: ' + error.message)
    setDeploying(null)
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div>
      {toast && <Toast msg={toast} />}
      <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: '#1E293B', lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, color: '#1B6EF3', marginBottom: 4 }}>🚀 데이터 배포 관리</div>
        배포 버튼을 누르면 버전이 올라가고, 사용자가 다음에 앱을 열 때 해당 데이터를 새로 받아요.<br />
        수정한 데이터만 선택적으로 배포할 수 있어요.
      </div>

      <button onClick={deployAll} disabled={deploying !== null}
        style={{ width: '100%', height: 52, borderRadius: 12, border: 'none', background: deploying ? '#94A3B8' : '#1B6EF3', color: '#fff', fontSize: 15, fontWeight: 700, cursor: deploying ? 'default' : 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon icon="ph:rocket-launch" width={20} height={20} color="#fff" />
        {deploying === 'all' ? '배포 중...' : '전체 배포'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEPLOY_ITEMS.map(item => (
          <div key={item.key} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon icon={item.icon} width={22} height={22} color="#1B6EF3" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.desc} · 현재 v{versions[item.key] ?? 1}</div>
            </div>
            <button onClick={() => deploy(item.key)} disabled={deploying !== null}
              style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: deploying === item.key ? '#94A3B8' : '#1B6EF3', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deploying !== null ? 'default' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              {deploying === item.key
                ? <><Icon icon="ph:circle-notch" width={14} height={14} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} /> 배포중</>
                : <><Icon icon="ph:rocket-launch" width={14} height={14} color="#fff" /> 배포</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
