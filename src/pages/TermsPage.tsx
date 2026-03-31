// ─────────────────────────────────────────────
// TermsPage.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { colors, font, radius, spacing, T } from '../styles/tokens'

type Tab = 'terms' | 'privacy'
type Props = { initialTab?: Tab; onBack: () => void }

export default function TermsPage({ initialTab = 'terms', onBack }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div style={{ minHeight:'100dvh', background:'#ffffff', fontFamily:font.family, display:'flex', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:430, minHeight:'100dvh', display:'flex', flexDirection:'column', background:'#ffffff', boxSizing:'border-box' }}>
        {/* 헤더 */}
        <div style={{ flexShrink:0, height:56, background:'#ffffff', borderBottom:`1px solid ${'#E0F7FA'}`, padding:`0 ${spacing[4]}px`, display:'flex', alignItems:'center', gap:spacing[2] }}>
          <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:spacing[1], margin:`-${spacing[1]}px`, display:'flex', alignItems:'center', WebkitTapHighlightColor:'transparent' }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke={colors.textPrimary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ ...T.h4 }}>약관 및 정책</div>
        </div>
        {/* 탭 */}
        <div style={{ display:'flex', borderBottom:`1px solid ${'#E0F7FA'}`, background:'#ffffff', flexShrink:0 }}>
          {(['terms','privacy'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, height:44, background:'none', border:'none',
              borderBottom: tab===t ? `2px solid ${'#00838F'}` : '2px solid transparent',
              color: tab===t ? '#00838F' : colors.textTertiary,
              fontSize:font.size.sm, fontWeight: tab===t ? font.weight.bold : font.weight.regular,
              fontFamily:font.family, cursor:'pointer', transition:'all 0.15s', marginBottom:-1,
            }}>
              {t === 'terms' ? '이용약관' : '개인정보처리방침'}
            </button>
          ))}
        </div>
        {/* 본문 */}
        <div style={{ padding:`${spacing[5]}px ${spacing[4]}px ${spacing[10]}px` }}>
          {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:spacing[6] }}>
      <div style={{ ...T.h4, color:'#00838F', marginBottom:spacing[2], paddingBottom:spacing[2], borderBottom:`1px solid ${'#E0F7FA'}` }}>{title}</div>
      {children}
    </div>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ ...T.body, lineHeight:1.8, margin:`0 0 ${spacing[2]}px`, color:colors.textSecondary }}>{children}</p>
}
function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ margin:`0 0 ${spacing[2]}px`, paddingLeft:spacing[5], color:colors.textSecondary }}>
      {items.map((item, i) => <li key={i} style={{ ...T.body, lineHeight:1.8, marginBottom:spacing[1], color:colors.textSecondary }}>{item}</li>)}
    </ol>
  )
}
function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin:`0 0 ${spacing[2]}px`, paddingLeft:spacing[5], color:colors.textSecondary }}>
      {items.map((item, i) => <li key={i} style={{ ...T.body, lineHeight:1.8, marginBottom:spacing[1], color:colors.textSecondary }}>{item}</li>)}
    </ul>
  )
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX:'auto', marginBottom:spacing[2] }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:font.size.sm }}>
        <thead>
          <tr style={{ background:colors.bgInput }}>
            {headers.map((h,i) => <th key={i} style={{ padding:`${spacing[2]}px ${spacing[3]}px`, textAlign:'left', fontWeight:font.weight.bold, color:colors.textPrimary, border:`1px solid ${'#E0F7FA'}`, whiteSpace:'nowrap' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={i}>
              {row.map((cell,j) => <td key={j} style={{ padding:`${spacing[2]}px ${spacing[3]}px`, color:colors.textSecondary, border:`1px solid ${'#E0F7FA'}`, lineHeight:1.6 }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function Meta({ label }: { label: string }) {
  return <div style={{ ...T.xs, background:colors.bgInput, borderRadius:radius.sm, padding:`${spacing[2]}px ${spacing[3]}px`, marginBottom:spacing[5], color:colors.textTertiary }}>{label}</div>
}

// ── 이용약관 ──────────────────────────────────
function TermsContent() {
  return (
    <div>
      <div style={{ ...T.h2, marginBottom:spacing[1] }}>이용약관</div>
      <Meta label="시행일: 2026년 3월 24일　|　최종 수정일: 2026년 3월 24일" />

      <Section title="제1조 (목적)">
        <P>본 약관은 호주가자(이하 "서비스")가 제공하는 모바일 애플리케이션 및 웹 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</P>
      </Section>

      <Section title="제2조 (정의)">
        <OL items={[
          <><strong>서비스</strong>: 호주가자가 운영하는 호주 생활 정보 제공 앱 및 웹사이트를 의미합니다.</>,
          <><strong>이용자</strong>: 서비스를 이용하는 모든 사람을 의미합니다.</>,
          <><strong>콘텐츠</strong>: 서비스가 제공하는 업체 정보, 체크리스트, 쇼핑 정보 등 모든 정보를 의미합니다.</>,
        ]} />
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <OL items={[
          '본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.',
          '서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 고지합니다.',
          '변경 공지 이후에도 계속 서비스를 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.',
        ]} />
      </Section>

      <Section title="제4조 (서비스 이용)">
        <OL items={[
          '서비스는 호주 생활 정보(한인 업체 정보, 체크리스트, 쇼핑 정보, 지도 등)를 제공합니다.',
          '서비스는 만 14세 이상의 이용자를 대상으로 합니다.',
          '이용자의 체크리스트, 쇼핑목록, 빙고 등 개인 사용 데이터는 이용자 본인의 기기에만 저장됩니다.',
        ]} />
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <P>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</P>
        <OL items={[
          '서비스의 운영을 방해하거나 서버에 과부하를 주는 행위',
          '관련 법령을 위반하는 행위',
          '서비스를 통해 얻은 정보를 무단으로 상업적으로 이용하는 행위',
        ]} />
      </Section>

      <Section title="제6조 (서비스 제공의 중단)">
        <OL items={[
          <>서비스는 다음 각 호의 경우 서비스 제공을 일시 중단할 수 있습니다.
            <UL items={[
              '시스템 점검, 유지보수 등 기술적 작업이 필요한 경우',
              '천재지변, 국가 비상사태 등 불가항력적인 경우',
            ]} />
          </>,
          '서비스는 불가피한 사유로 인한 서비스 중단에 대하여 책임을 지지 않습니다.',
        ]} />
      </Section>

      <Section title="제7조 (면책사항)">
        <OL items={[
          '서비스에 게시된 한인 업체 정보, 쇼핑 정보 등은 참고용으로 제공되며, 정확성이나 최신성을 보장하지 않습니다.',
          '이용자가 서비스를 통해 취득한 정보를 활용하여 발생한 결과에 대해 서비스는 책임을 지지 않습니다.',
        ]} />
      </Section>

      <Section title="제8조 (준거법 및 관할)">
        <P>본 약관은 호주 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 빅토리아주 법원을 전속 관할로 합니다. 단, 이용자가 호주 소비자법(Australian Consumer Law)에 따른 권리를 보유하는 경우 해당 권리는 영향을 받지 않습니다.</P>
      </Section>
    </div>
  )
}

// ── 개인정보처리방침 ──────────────────────────
function PrivacyContent() {
  return (
    <div>
      <div style={{ ...T.h2, marginBottom:spacing[1] }}>개인정보처리방침</div>
      <Meta label="시행일: 2026년 3월 24일　|　최종 수정일: 2026년 3월 24일" />

      <P>호주가자는 이용자의 개인정보를 소중히 여기며, 호주 Privacy Act 1988 및 관련 법령을 준수합니다.</P>

      <Section title="제1조 (수집하는 정보)">
        <P><strong>서비스 이용 시 기기에 저장되는 정보 (서버 전송 없음)</strong></P>
        <UL items={[
          '체크리스트 선택 항목 및 일정',
          '쇼핑 찜 목록 및 체크 현황',
          '카페 빙고 진행 상황 및 인증샷',
          '업체 북마크 목록',
          '여행 일정 (출발일, 귀국일)',
        ]} />
        <P><strong>위치 정보 (내주변 기능 사용 시)</strong></P>
        <UL items={[
          '현재 위치 (주변 업체 검색 목적으로만 사용, 저장하지 않음)',
        ]} />
        <P><strong>자동 수집 정보</strong></P>
        <UL items={[
          '기기 정보, 브라우저 정보',
          '서비스 접속 일시 및 이용 기록',
        ]} />
      </Section>

      <Section title="제2조 (개인정보의 수집 및 이용 목적)">
        <OL items={[
          <><strong>서비스 제공</strong>: 체크리스트, 업체 정보, 쇼핑 정보, 지도 기능 제공</>,
          <><strong>서비스 개선</strong>: 이용 현황 분석, 새로운 기능 개발</>,
          <><strong>고객 지원</strong>: 문의 사항 응대</>,
        ]} />
      </Section>

      <Section title="제3조 (개인정보의 보유 및 이용 기간)">
        <OL items={[
          '이용자의 개인 사용 데이터(체크리스트, 쇼핑목록 등)는 이용자 기기에만 저장되며, 서버에 전송되지 않습니다.',
          '이용자가 앱을 삭제하거나 브라우저 데이터를 초기화하면 저장된 데이터가 삭제됩니다.',
          '인증샷 이미지는 Cloudinary에 저장되며, 삭제 요청 시 johnkim.jmtg@gmail.com으로 연락하시면 처리합니다.',
        ]} />
      </Section>

      <Section title="제4조 (개인정보의 제3자 제공)">
        <P>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</P>
        <OL items={[
          '이용자가 사전에 동의한 경우',
          '법령의 규정에 의거하여 수사 기관의 요구가 있는 경우',
        ]} />
      </Section>

      <Section title="제5조 (개인정보 처리 위탁)">
        <P>서비스는 원활한 서비스 제공을 위해 다음과 같이 업무를 외부에 위탁합니다.</P>
        <Table
          headers={['수탁 업체', '위탁 업무', '보유 기간']}
          rows={[
            ['Supabase Inc.', '서비스 데이터베이스 (업체·체크리스트 등 공개 데이터)', '서비스 운영 기간'],
            ['Cloudinary Inc.', '인증샷 이미지 저장 및 관리', '삭제 요청 시까지'],
            ['Google LLC', '지도 서비스 (Google Maps API)', 'Google 정책에 따름'],
            ['Vercel Inc.', '웹 서비스 호스팅', '서비스 운영 기간'],
          ]}
        />
      </Section>

      <Section title="제6조 (위치 정보 이용)">
        <OL items={[
          '내주변 기능 이용 시 기기의 위치 정보에 접근합니다.',
          '위치 정보는 주변 업체 표시 목적으로만 사용되며, 서버에 저장되지 않습니다.',
          '이용자는 기기 설정에서 위치 정보 접근 권한을 언제든지 변경할 수 있습니다.',
        ]} />
      </Section>

      <Section title="제7조 (카메라 및 사진 접근)">
        <OL items={[
          '카페 빙고 인증샷 기능 이용 시 카메라 및 사진 라이브러리에 접근합니다.',
          '촬영된 사진은 Cloudinary에 업로드되며, 이용자가 직접 선택한 경우에만 저장됩니다.',
          '인증샷 삭제를 원하시면 johnkim.jmtg@gmail.com으로 요청하시면 처리합니다.',
        ]} />
      </Section>

      <Section title="제8조 (로컬 스토리지)">
        <OL items={[
          '서비스는 이용자의 편의를 위해 기기의 로컬 스토리지(Local Storage)를 사용합니다.',
          <>저장되는 정보: 체크리스트 항목, 여행 일정, 쇼핑 목록, 빙고 진행 상황, 업체 북마크</>,
          '이용자는 브라우저 설정 또는 앱 삭제를 통해 저장된 데이터를 삭제할 수 있습니다.',
        ]} />
      </Section>

      <Section title="제9조 (이용자의 권리)">
        <P>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</P>
        <OL items={[
          <><strong>데이터 삭제</strong>: 앱 삭제 또는 브라우저 데이터 초기화로 로컬 데이터를 삭제할 수 있습니다.</>,
          <><strong>인증샷 삭제</strong>: johnkim.jmtg@gmail.com으로 요청하시면 10일 이내 처리합니다.</>,
          <><strong>문의</strong>: 개인정보 관련 문의는 동일 이메일로 접수 가능합니다.</>,
        ]} />
      </Section>

      <Section title="제10조 (개인정보 보호를 위한 기술적 조치)">
        <OL items={[
          'HTTPS 암호화 통신',
          '외부 접근 통제 및 권한 관리 (Supabase RLS)',
          '이용자 개인 데이터는 서버에 저장하지 않고 기기에만 보관',
        ]} />
      </Section>

      <Section title="제11조 (개인정보 보호책임자)">
        <UL items={[
          '개인정보 보호책임자: 호주가자 운영팀',
          '문의 이메일: johnkim.jmtg@gmail.com',
          '처리 시간: 평일 09:00 ~ 18:00 (AEST 기준)',
        ]} />
      </Section>

      <Section title="제12조 (개정 이력)">
        <Table
          headers={['버전', '시행일', '주요 변경 내용']}
          rows={[
            ['v1.0', '2026.03.24', '최초 제정'],
          ]}
        />
      </Section>
    </div>
  )
}
