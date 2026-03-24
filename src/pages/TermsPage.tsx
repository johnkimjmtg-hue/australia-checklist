// ─────────────────────────────────────────────
// TermsPage.tsx  (src/pages/TermsPage.tsx)
// 이용약관 / 개인정보처리방침 탭 페이지
// ─────────────────────────────────────────────
import { useState } from 'react'
import { colors, font, radius, spacing, T } from '../styles/tokens'
import { AppHeader } from '../components/ui'

type Tab = 'terms' | 'privacy'

type Props = {
  initialTab?: Tab
  onBack: () => void
}

export default function TermsPage({ initialTab = 'terms', onBack }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: colors.bgPage,
      fontFamily: font.family,
      display: 'flex',
      justifyContent: 'center',
    }}>
      {/* 모바일 기준 래퍼 maxWidth 480 */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colors.bgPage,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
      <div style={{ flexShrink: 0 }}>
        <AppHeader title="약관 및 정책" onBack={onBack} />
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.bgCard,
        flexShrink: 0,
      }}>
        {(['terms', 'privacy'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              height: 44,
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${colors.primary}` : '2px solid transparent',
              color: tab === t ? colors.primary : colors.textTertiary,
              fontSize: font.size.sm,
              fontWeight: tab === t ? font.weight.bold : font.weight.regular,
              fontFamily: font.family,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t === 'terms' ? '이용약관' : '개인정보처리방침'}
          </button>
        ))}
      </div>

      {/* 본문 - 스크롤 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: `${spacing[5]}px ${spacing[4]}px ${spacing[10]}px`,
      }}>
        {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
      </div>
      </div>
    </div>
  )
}

// ── 공통 스타일 헬퍼 ──────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: spacing[6] }}>
      <div style={{
        ...T.h4,
        color: colors.primary,
        marginBottom: spacing[2],
        paddingBottom: spacing[2],
        borderBottom: `1px solid ${colors.border}`,
      }}>{title}</div>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      ...T.body,
      lineHeight: 1.8,
      margin: `0 0 ${spacing[2]}px`,
      color: colors.textSecondary,
    }}>{children}</p>
  )
}

function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ margin: `0 0 ${spacing[2]}px`, paddingLeft: spacing[5], color: colors.textSecondary }}>
      {items.map((item, i) => (
        <li key={i} style={{ ...T.body, lineHeight: 1.8, marginBottom: spacing[1], color: colors.textSecondary }}>{item}</li>
      ))}
    </ol>
  )
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: `0 0 ${spacing[2]}px`, paddingLeft: spacing[5], color: colors.textSecondary }}>
      {items.map((item, i) => (
        <li key={i} style={{ ...T.body, lineHeight: 1.8, marginBottom: spacing[1], color: colors.textSecondary }}>{item}</li>
      ))}
    </ul>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: spacing[2] }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.size.sm }}>
        <thead>
          <tr style={{ background: colors.bgInput }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: `${spacing[2]}px ${spacing[3]}px`,
                textAlign: 'left',
                fontWeight: font.weight.bold,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  lineHeight: 1.6,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Meta({ label }: { label: string }) {
  return (
    <div style={{
      ...T.xs,
      background: colors.bgInput,
      borderRadius: radius.sm,
      padding: `${spacing[2]}px ${spacing[3]}px`,
      marginBottom: spacing[5],
      color: colors.textTertiary,
    }}>{label}</div>
  )
}

// ── 이용약관 본문 ─────────────────────────────
function TermsContent() {
  return (
    <div>
      <div style={{ ...T.h2, marginBottom: spacing[1] }}>이용약관</div>
      <Meta label="시행일: 2026년 3월 24일　|　최종 수정일: 2026년 3월 24일" />

      <Section title="제1조 (목적)">
        <P>본 약관은 호주가자(이하 "서비스")가 제공하는 모바일 애플리케이션 및 웹 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</P>
      </Section>

      <Section title="제2조 (정의)">
        <OL items={[
          <><strong>서비스</strong>: 호주가자가 운영하는 호주 생활 정보 제공 앱 및 웹사이트를 의미합니다.</>,
          <><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 모든 사람을 의미합니다.</>,
          <><strong>회원</strong>: 이메일 또는 소셜 계정으로 가입하여 서비스를 이용하는 이용자를 의미합니다.</>,
          <><strong>콘텐츠</strong>: 이용자가 서비스 내에 게시한 텍스트, 이미지, 리뷰, 댓글 등 모든 게시물을 의미합니다.</>,
        ]} />
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <OL items={[
          '본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.',
          '서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 고지합니다.',
          '변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
          '변경 공지 이후에도 계속 서비스를 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.',
        ]} />
      </Section>

      <Section title="제4조 (서비스 이용)">
        <OL items={[
          '서비스는 호주 생활 정보(한인 업체 정보, 체크리스트, 쇼핑 정보, 지도, 커뮤니티 등)를 제공합니다.',
          '서비스는 만 14세 이상의 이용자를 대상으로 합니다.',
          '이용자는 본인의 계정 정보를 타인과 공유하거나 타인의 계정을 사용할 수 없습니다.',
          '이용자는 하나의 이메일 주소로 하나의 계정만 생성할 수 있습니다.',
        ]} />
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <P>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</P>
        <OL items={[
          '타인의 개인정보를 무단으로 수집, 저장, 공개하는 행위',
          '서비스의 운영을 방해하거나 서버에 과부하를 주는 행위',
          '타인을 사칭하거나 허위 정보를 등록하는 행위',
          '음란, 폭력적, 혐오적이거나 타인에게 불쾌감을 주는 콘텐츠를 게시하는 행위',
          '광고, 스팸 메시지 등 영리 목적의 콘텐츠를 무단으로 게시하는 행위',
          '관련 법령을 위반하는 행위',
        ]} />
      </Section>

      <Section title="제6조 (콘텐츠에 관한 권리)">
        <OL items={[
          '이용자가 서비스에 게시한 콘텐츠(리뷰, 커뮤니티 게시물 등)의 저작권은 해당 이용자에게 있습니다.',
          '이용자는 콘텐츠를 게시함으로써 서비스가 해당 콘텐츠를 서비스 운영 및 홍보 목적으로 사용할 수 있는 비독점적 권리를 서비스에 부여합니다.',
          '서비스는 법령 위반 또는 본 약관 위반 콘텐츠를 사전 통지 없이 삭제할 수 있습니다.',
        ]} />
      </Section>

      <Section title="제7조 (서비스 제공의 중단)">
        <OL items={[
          <>서비스는 다음 각 호의 경우 서비스 제공을 일시 중단할 수 있습니다.
            <UL items={[
              '시스템 점검, 유지보수 등 기술적 작업이 필요한 경우',
              '천재지변, 국가 비상사태 등 불가항력적인 경우',
              '서비스 운영상 필요한 경우',
            ]} />
          </>,
          '서비스는 불가피한 사유로 인한 서비스 중단에 대하여 책임을 지지 않습니다.',
        ]} />
      </Section>

      <Section title="제8조 (면책사항)">
        <OL items={[
          '서비스에 게시된 한인 업체 정보, 쇼핑 정보 등은 참고용으로 제공되며, 정확성이나 최신성을 보장하지 않습니다.',
          '이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 서비스는 책임을 지지 않습니다.',
          '이용자가 서비스를 통해 취득한 정보를 활용하여 발생한 결과에 대해 서비스는 책임을 지지 않습니다.',
        ]} />
      </Section>

      <Section title="제9조 (계정 해지 및 이용 제한)">
        <OL items={[
          '이용자는 언제든지 서비스 내 설정에서 탈퇴를 신청할 수 있습니다.',
          '서비스는 본 약관을 위반한 이용자에 대해 사전 통지 없이 계정을 정지하거나 삭제할 수 있습니다.',
          '탈퇴 시 이용자가 작성한 커뮤니티 게시물 및 리뷰는 삭제되지 않을 수 있으며, 삭제를 원하는 경우 탈퇴 전에 직접 삭제하여야 합니다.',
        ]} />
      </Section>

      <Section title="제10조 (준거법 및 관할)">
        <P>본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 관련 법령에서 정한 절차에 따라 해결합니다.</P>
      </Section>
    </div>
  )
}

// ── 개인정보처리방침 본문 ──────────────────────
function PrivacyContent() {
  return (
    <div>
      <div style={{ ...T.h2, marginBottom: spacing[1] }}>개인정보처리방침</div>
      <Meta label="시행일: 2026년 3월 24일　|　최종 수정일: 2026년 3월 24일" />

      <P>호주가자는 이용자의 개인정보를 소중히 여기며, 호주 Privacy Act 1988 및 관련 법령을 준수합니다.</P>

      <Section title="제1조 (수집하는 개인정보 항목)">
        <P><strong>가입 및 로그인 시</strong></P>
        <UL items={[
          '이메일 주소, 이름(닉네임), 비밀번호(암호화 저장)',
          'Google 계정 정보 (Google 로그인 이용 시: 이름, 이메일, 프로필 사진)',
        ]} />
        <P><strong>서비스 이용 시</strong></P>
        <UL items={[
          '여행 정보 (귀국 예정일, 체류 도시)',
          '커뮤니티 게시물 및 이미지',
          '업체 리뷰 및 평점',
          '서비스 이용 기록',
        ]} />
        <P><strong>자동 수집 정보</strong></P>
        <UL items={[
          '기기 정보, 브라우저 정보, IP 주소',
          '서비스 접속 일시 및 이용 기록',
        ]} />
      </Section>

      <Section title="제2조 (개인정보의 수집 및 이용 목적)">
        <OL items={[
          <><strong>회원 관리</strong>: 본인 확인, 계정 관리, 부정 이용 방지</>,
          <><strong>서비스 제공</strong>: 체크리스트, 업체 정보, 쇼핑 정보, 커뮤니티 기능 제공</>,
          <><strong>서비스 개선</strong>: 이용 현황 분석, 새로운 기능 개발</>,
          <><strong>고객 지원</strong>: 문의 사항 응대 및 불만 처리</>,
        ]} />
      </Section>

      <Section title="제3조 (개인정보의 보유 및 이용 기간)">
        <OL items={[
          '원칙적으로 개인정보 수집 및 이용 목적이 달성되면 해당 정보를 지체 없이 파기합니다.',
          '회원 탈퇴 시 개인정보는 즉시 삭제됩니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
          <>관련 법령에 의한 보존 항목 및 기간은 다음과 같습니다.
            <UL items={[
              '소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래 등에서의 소비자 보호에 관한 법률)',
              '접속 로그 기록: 3개월 (통신비밀보호법)',
            ]} />
          </>,
        ]} />
      </Section>

      <Section title="제4조 (개인정보의 제3자 제공)">
        <P>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</P>
        <OL items={[
          '이용자가 사전에 동의한 경우',
          '법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사 기관의 요구가 있는 경우',
        ]} />
      </Section>

      <Section title="제5조 (개인정보 처리 위탁)">
        <P>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부에 위탁하고 있습니다.</P>
        <Table
          headers={['수탁 업체', '위탁 업무', '보유 및 이용 기간']}
          rows={[
            ['Supabase Inc.', '회원 정보 저장 및 인증', '회원 탈퇴 시까지'],
            ['Google LLC', 'Google 소셜 로그인 인증', 'Google 정책에 따름'],
            ['Cloudinary Inc.', '이미지 파일 저장 및 관리', '회원 탈퇴 시까지'],
          ]}
        />
      </Section>

      <Section title="제6조 (개인정보의 파기)">
        <OL items={[
          '보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.',
          '전자적 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제합니다.',
        ]} />
      </Section>

      <Section title="제7조 (이용자의 권리)">
        <P>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</P>
        <OL items={[
          <><strong>열람</strong>: 본인의 개인정보 처리 현황을 열람할 수 있습니다.</>,
          <><strong>정정</strong>: 개인정보가 부정확한 경우 정정을 요청할 수 있습니다.</>,
          <><strong>삭제</strong>: 개인정보의 삭제를 요청할 수 있습니다.</>,
          <><strong>처리 정지</strong>: 개인정보 처리의 정지를 요청할 수 있습니다.</>,
        ]} />
        <P>위 권리 행사는 서비스 내 설정 또는 <strong>johnkim.jmtg@gmail.com</strong>으로 요청하실 수 있으며, 접수 후 10일 이내에 처리합니다.</P>
      </Section>

      <Section title="제8조 (쿠키 및 유사 기술)">
        <OL items={[
          '서비스는 이용자의 편의를 위해 로컬 스토리지(Local Storage)를 사용합니다.',
          '저장되는 정보: 커뮤니티 닉네임, 좋아요 기록, 사용자 식별 ID',
          '이용자는 브라우저 설정을 통해 저장된 데이터를 삭제할 수 있습니다.',
        ]} />
      </Section>

      <Section title="제9조 (개인정보 보호를 위한 기술적 조치)">
        <OL items={[
          '비밀번호 암호화 저장 (Supabase Auth 암호화 처리)',
          'HTTPS 암호화 통신',
          '외부 접근 통제 및 권한 관리',
        ]} />
      </Section>

      <Section title="제10조 (개인정보 보호책임자)">
        <P>개인정보 처리에 관한 업무를 총괄하고 이용자의 개인정보 관련 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</P>
        <UL items={[
          '개인정보 보호책임자: 호주가자 운영팀',
          '문의 이메일: johnkim.jmtg@gmail.com',
          '처리 시간: 평일 09:00 ~ 18:00 (AEST 기준)',
        ]} />
      </Section>

      <Section title="제11조 (개정 이력)">
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
