// ─────────────────────────────────────────────
// 호주가자 Design Tokens  (src/styles/tokens.ts)
// GlobeGlider-inspired: pure white base, blue accent input, no neumorphism
// ─────────────────────────────────────────────

export const colors = {
  // Brand
  primary:       '#1B6EF3',
  primaryLight:  '#EEF4FF',
  primaryDark:   '#1458CC',

  // Grayscale
  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Semantic
  success:      '#16A34A',
  successLight: '#DCFCE7',
  warning:      '#D97706',
  warningLight: '#FEF3C7',
  danger:       '#DC2626',
  dangerLight:  '#FEE2E2',

  // Background
  bgPage:  '#F8FAFC',  // 전체 배경 → 아주 연한 회색
  bgCard:  '#FFFFFF',  // 카드 배경 (그림자로 구분)
  bgInput: '#EEF4FF',  // 인풋 배경 → 연한 파랑 (primary 계열)

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textTertiary:  '#64748B',
  textInverse:   '#FFFFFF',

  // Border
  border:      '#CBD5E1',
  borderFocus: '#1B6EF3',
} as const

export const font = {
  family: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
  size: {
    xs:   11,
    sm:   12,
    md:   14,
    lg:   16,
    xl:   18,
    '2xl': 22,
    '3xl': 28,
  },
  weight: {
    regular: 400,
    medium:  500,
    bold:    700,
  },
  lineHeight: {
    tight:  1.3,
    normal: 1.5,
    loose:  1.8,
  },
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
} as const

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
} as const

export const shadow = {
  // 배경이 흰색이므로 카드 구분을 위해 그림자 살짝 강화
  card:  '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  modal: '0 8px 32px rgba(0,0,0,0.12)',
  none:  'none',
} as const

export const transition = {
  fast:   'all 0.12s ease',
  normal: 'all 0.2s ease',
} as const

// ── 자주 쓰는 스타일 조합 헬퍼 ─────────────────
export const T = {
  // 타이포
  h1:      { fontSize: font.size['2xl'], fontWeight: font.weight.bold,    color: colors.textPrimary,   lineHeight: font.lineHeight.tight  },
  h2:      { fontSize: font.size.xl,     fontWeight: font.weight.bold,    color: colors.textPrimary,   lineHeight: font.lineHeight.tight  },
  h3:      { fontSize: font.size.lg,     fontWeight: font.weight.bold,    color: colors.textPrimary   },
  h4:      { fontSize: font.size.md,     fontWeight: font.weight.bold,    color: colors.textPrimary   },
  body:    { fontSize: font.size.md,     fontWeight: font.weight.regular, color: colors.textPrimary,   lineHeight: font.lineHeight.normal },
  sm:      { fontSize: font.size.sm,     fontWeight: font.weight.regular, color: colors.textSecondary, lineHeight: font.lineHeight.normal },
  xs:      { fontSize: font.size.xs,     fontWeight: font.weight.regular, color: colors.textTertiary  },
  caption: { fontSize: font.size.xs,     fontWeight: font.weight.medium,  color: colors.textSecondary },

  // 카드 — border 제거, 그림자로만 구분 (흰 배경 위에서 더 깔끔)
  card: {
    background:   colors.bgCard,
    borderRadius: radius.lg,
    border:       `1px solid ${colors.border}`,
    padding:      `${spacing[4]}px`,
    boxShadow:    shadow.card,
  } as React.CSSProperties,

  // 인풋 — 연한 파랑 배경, 테두리 없음 (GlobeGlider 스타일)
  input: {
    width:        '100%',
    height:       48,
    background:   colors.bgInput,
    border:       '1.5px solid transparent',
    borderRadius: radius.md,
    padding:      `0 ${spacing[3]}px`,
    fontSize:     font.size.md,
    color:        colors.textPrimary,
    outline:      'none',
    boxSizing:    'border-box' as const,
    transition:   transition.fast,
  } as React.CSSProperties,
} as const


// ─────────────────────────────────────────────
// 랜딩/홈 페이지 전용 토큰 (LandingPage, HomePage)
// 그레이트 배리어 리프 테마
// ─────────────────────────────────────────────

export const landing = {
  // 배경 그라데이션
  gradient: 'linear-gradient(180deg, #00BCD4 0%, #80DEEA 28%, #FFF0C8 50%, #F5C97A 70%, #D4703A 100%)',

  colors: {
    // 텍스트
    textTitle:    '#0D3349',   // 제목 - 진한 네이비
    textBody:     '#0D4F6E',   // 본문 - 중간 네이비
    textSub:      '#1565A0',   // 보조 - 연한 네이비
    textAccent:   '#00838F',   // 액센트 - 청록 (링크, 뱃지, 년도)
    textPast:     '#7BAAB5',   // 지나간 날짜
    textOnBg:     'rgba(255,255,255,0.9)', // 그라데이션 위 흰 텍스트

    // 카드
    card:         'rgba(255,255,255,0.88)', // 반투명 흰색
    cardShadow:   '0 4px 20px rgba(0,0,0,0.10)',
    iconBg:       'rgba(0,131,143,0.15)',   // 메뉴 아이콘 박스

    // 달력
    calSelected:  '#00838F',   // 출발일/귀국일 bg
    calRange:     '#B2EBF2',   // 선택 범위 bg
    calRangeText: '#006064',   // 선택 범위 텍스트

    // 히어로 블롭
    blob1:        '#80DEEA',
    blob2:        '#26C6DA',
    blob3:        '#00ACC1',

    // 히어로 아이콘
    iconMain:     '#FF7043',   // 비행기 아이콘 주황
  },

  font: {
    family: "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif",
    size: {
      hero:    32,  // 히어로 제목
      section: 16,  // 섹션 라벨 ("나의 여행 리스트")
      menu:    17,  // 메뉴 카드 제목 ("버킷리스트")
      menuSub: 14,  // 메뉴 카드 설명 ("꼭 해볼 것들")
      body:    16,  // 부제목/설명
      calHdr:  15,  // 달력 헤더 년/월
      calDay:  11,  // 달력 요일
      calNum:  13,  // 달력 날짜 숫자
      chip:    11,  // 칩 라벨 ("출발일")
      chipVal: 14,  // 칩 값 ("날짜 선택")
      dday:    52,  // D-day 숫자
      ddaySub: 15,  // D-day 라벨
      btn:     17,  // 버튼
      badge:   11,  // 뱃지
    },
    weight: {
      regular: 400,
      semi:    600,
      bold:    700,
      heavy:   800,
      black:   900,
    },
  },

  radius: {
    card:    22,  // 큰 카드 (달력, D-day)
    menuCard:20,  // 메뉴 카드
    chip:    16,  // 날짜 칩
    icon:    14,  // 아이콘 박스
    btn:     50,  // 버튼 (pill)
    badge:   20,  // 뱃지
  },
} as const

// ─────────────────────────────────────────────
// 오버레이 토큰
// ─────────────────────────────────────────────
export const overlay = {
  sheet:     'rgba(0,0,0,0.45)',  // 바텀시트 메인 오버레이
  sheetBlur: 'blur(8px)',
  popup:     'rgba(0,0,0,0.5)',   // 중첩 팝업 오버레이
  popupBlur: 'blur(6px)',
} as const
