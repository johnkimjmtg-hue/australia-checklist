# 호주가자 디자인 시스템

> 새 세션 시작 시 이 파일을 첨부하면 클로드가 스타일 기준을 바로 이해합니다.

---

## 1. 컬러 팔레트

### 브랜드 색상 (기존 앱 - ChecklistPage 등)
```
Primary:        #29B6D0  (파란색 - 버튼, 강조, 완료 체크)
Danger:         #DC2626  (빨강 - 삭제, 경고)
Warning:        #F59E0B  (주황 - 일정 미지정)
```

### 랜딩/홈 테마 (LandingPage, HomePage) — 그레이트 배리어 리프
```
배경 그라데이션: linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #26C6DA 65%, #00E5CC 100%)
  - 위: #E0F7FA  (연한 하늘)
  - 중: #80DEEA  (밝은 청록)
  - 하: #00E5CC  (형광 옥색 - 옥반지 느낌)

카드/창 배경:   #EFFCFC  ← 연한 민트 (반투명 절대 사용 금지)
카드 그림자:    0 4px 20px rgba(0,0,0,0.10)
카드 테두리:    없음 (border: none)
카드 radius:   22px (큰 카드), 16px (작은 카드/칩), 20px (메뉴 카드)

팝업/바텀시트 배경: #ffffff  ← 흰색
팝업 그림자:        0 8px 32px rgba(0,0,0,0.20)
```

### 텍스트 색상 (랜딩/홈)
```
제목 (강조):      #0D3349  (진한 네이비)
본문:             #0D4F6E  (중간 네이비)
보조:             #1565A0  (연한 네이비)
액센트:           #00838F  (청록 - 링크, 뱃지, 년도 표시)
온도:             #CC3300  (블러드 오렌지 - 날씨 온도 전용)
지나간 날짜:      #7BAAB5  (흐린 청록회색)
섹션 라벨:        #0D4F6E  (그라데이션 배경 위)

⚠️ 반투명 색상 절대 사용 금지:
  - rgba(255,255,255,0.82) → #EFFCFC 사용
  - rgba(255,255,255,0.9) → #0D4F6E (텍스트인 경우) 사용
```

---

## 2. 타이포그래피

### 폰트
```
font-family: -apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif
```

### 랜딩/홈 페이지 기준
| 역할 | 크기 | 굵기 |
|---|---|---|
| 히어로 제목 | 32px | 800 |
| 섹션 라벨 ("나의 여행 리스트") | 16px | 700 |
| 메뉴 카드 제목 ("버킷리스트") | 17px | 700 |
| 메뉴 카드 설명 ("꼭 해볼 것들") | 14px | 400 |
| 부제목/설명 | 16px | 400 |
| 달력 년/월 헤더 | 15px | 700 |
| 달력 요일 | 11px | 600 |
| 달력 날짜 숫자 | 13px | 400 |
| 칩 라벨 ("출발일") | 11px | 600 |
| 칩 값 ("날짜 선택") | 14px | 400(미입력) / 700(입력됨) |
| D-day 숫자 | 52px | 900 |
| D-day 라벨 | 15px | 400 |
| 버튼 글자 | 17px | 400(비활성) / 800(활성) |
| 뱃지 | 11px | 700 |

---

## 3. 컴포넌트 스타일

### 카드 (공통)
```css
background: #EFFCFC
border-radius: 22px
border: none
box-shadow: 0 4px 20px rgba(0,0,0,0.10)
```

### 메뉴 카드 아이콘 박스
```css
width: 44px
height: 44px
border-radius: 14px
background: rgba(0,131,143,0.15)
font-size: 22px
```

### 뱃지 (개수 표시)
```css
background: #00838F
color: #fff
font-size: 11px
font-weight: 700
padding: 3px 10px
border-radius: 20px
```

### 버튼 (랜딩 메인 버튼)
```css
background: #EFFCFC
color: #0D3349
border: none
border-radius: 50px
font-size: 17px
padding: 18px
/* 활성: font-weight 800 / 비활성: font-weight 400 */
```

### 팝업 / 바텀시트 (공통) — AppHeader 날씨/메뉴/약관 팝업
```css
/* 기본 팝업 - 여백 있는 스타일 */
position: fixed
bottom: 16px
left: 50%
transform: translateX(-50%)
width: calc(100% - 32px)
max-width: 398px
background: #ffffff
border-radius: 20px
box-shadow: 0 8px 32px rgba(0,0,0,0.20)
animation: slideUpSheet 0.25s ease
max-height: 85vh
overflow-y: auto

/* X 닫기 버튼 (ph:x 아이콘 사용) */
width: 28px
height: 28px
border-radius: 50%
background: rgba(0,0,0,0.08)
border: none
color: #0D3349
/* Icon: ph:x, width:16, height:16 */

/* 오버레이 (팝업 뒤 배경) */
position: fixed
inset: 0
background: rgba(0,0,0,0.45)
z-index: 800
```

### BucketSheet / ChecklistSheet (전체화면 바텀시트)
```css
/* 홈 → 버킷리스트, 홈 → 체크리스트 팝업 */
position: fixed
bottom: 0                    ← 하단 여백 없음
left: 50%
transform: translateX(-50%)
width: 100%                  ← 양쪽 여백 없음
max-width: 430px
background: #ffffff
border-radius: 20px 20px 0 0  ← 위쪽만 굴림, 아래 모서리 직각
box-shadow: 0 8px 32px rgba(0,0,0,0.20)
animation: slideUpSheet 0.25s ease
max-height: 85vh
overflow-y: auto
display: flex
flex-direction: column

/* 헤더 구조 */
헤더: padding 12px 12px 0, flex, space-between
X 버튼: ph:x 아이콘 (width:16, height:16, color:#0D3349)
         width:28, height:28, border-radius:50%, background:rgba(0,0,0,0.08)

@keyframes slideUpSheet {
  from { transform: translateX(-50%) translateY(100%); }
  to   { transform: translateX(-50%) translateY(0); }
}
```

### BucketCheckView 상세 팝업 (버킷리스트 카드 클릭 시)
```css
/* BucketSheet 안에서 별도 레이어로 렌더링 (zIndex: 1101) */
/* BucketSheet보다 낮게 띄워서 "팝업 안 팝업" 느낌 유지 */
position: fixed
bottom: 0
left: 50%
transform: translateX(-50%)
width: 100%
max-width: 430px
background: #ffffff
border-radius: 20px 20px 0 0
max-height: 72vh             ← BucketSheet(85vh)보다 낮게 — 뒤에 시트가 보임
overflow-y: auto
z-index: 1101
animation: slideUpSheet 0.25s ease
box-shadow: 0 8px 32px rgba(0,0,0,0.18)
display: flex
flex-direction: column

/* 헤더: X 버튼만, 오른쪽 정렬 */
헤더: padding 12px 12px 0, flex, justify-content: flex-end
X 버튼: ph:x 아이콘 동일

/* 오버레이 */
position: fixed
inset: 0
background: rgba(0,0,0,0.5)
z-index: 1100
```

### BucketCheckView 진행 카드 (상황판)
```css
background: #ffffff
border-radius: 16px
padding: 14px 16px
border: 1px solid rgba(0,131,143,0.20)  ← 그림자 없이 테두리만

/* 내부 구성 */
카운터:      achievedCount (18px/900/#29B6D0) / total 완료 (13px/#7BAAB5)
프로그레스바: height 6px, border-radius 3px
             배경: #E0F7FA
             채움: #29B6D0, transition width 0.4s ease
메시지:      12px / #7BAAB5
버튼:        수정(#29B6D0 배경), 비우기(danger 계열) — height 26px, border-radius 20px
```

### BucketCheckView 포토카드 그리드
```
레이아웃: 2열 그리드, gap 10px
카드 radius: 16px
비율: 3/4 (일반), 2/1 (마지막 홀수 카드 — span 2)

이미지 없을 때: 카테고리별 단색 배경 + 중앙에 아이콘 (rgba(255,255,255,0.4))
오버레이: 하단만 — linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%)
          텍스트 영역에만 적용 (카드 전체 X)

체크 버튼: 우상단, width/height 26px, border-radius 50%
           미완료: rgba(255,255,255,0.25) 배경
           완료:   #29B6D0 배경 + ph:check 흰색

제목 텍스트: 14px / 400 (볼드 아님) / #fff
지역 표시:  stateMap으로 주소→NSW/VIC/QLD→시드니/멜번/브리즈번 매핑
            11px / rgba(255,255,255,0.7)

클릭 영역: 카드 전체 X — 하단 텍스트 영역만 onClick → 상세 팝업
```

---

## 4. 페이지 구조

### LandingPage (첫 진입 - trip 없을 때)
```
전체 배경: 그라데이션
├── 히어로 섹션 (투명 배경 + 블롭)
│   ├── 아이콘 (✈️, 주황 #FF7043, bounce+pulse 애니메이션)
│   ├── 제목 32px/800
│   └── 부제목 16px/400
├── 날짜 칩 2개 (출발일 / 귀국일)
├── 피커 시트 (년도/월 선택)
├── 달력 카드
└── 시작하기 버튼 (하단 고정)
```

### HomePage (trip 있을 때 메인)
```
전체 배경: 그라데이션
├── 달력 카드 (상단, padding-top 52px)
└── 스크롤 영역
    ├── D-day 카드
    ├── 섹션 라벨 "나의 여행 리스트"
    └── 메뉴 그리드 (2열)
        ├── 버킷리스트 → BucketSheet 팝업
        ├── 쇼핑리스트
        ├── 업체정보
        ├── 내 주변
        └── 카페 빙고 (전체 너비)
```

### BucketSheet 구조
```
BucketSheet (전체화면 바텀시트)
├── 오버레이 (rgba(0,0,0,0.45), zIndex:800)
├── 시트 본체 (zIndex:801)
│   ├── 헤더 (← 버킷리스트 | X 버튼)
│   └── 내용
│       ├── view='bucket' → BucketCheckView
│       │   └── 포토카드 클릭 → onDetailItem 콜백
│       └── view='checklist' → ChecklistPage (embedded)
└── 상세 팝업 (BucketSheet 바깥, zIndex:1100~1101)
    ├── 오버레이 (rgba(0,0,0,0.5))
    └── 상세 시트 (max-height:72vh)
        ├── 헤더 (X 버튼만)
        ├── 이미지 (있을 때)
        ├── 제목/설명/팁/주소
        └── 관련 업체 (BusinessCard)
```

### App.tsx 라우팅
```
trip 없음 → LandingPage
trip 있음 + activeTab 없음 → HomePage
trip 있음 + activeTab 있음 → ChecklistPage(initialTab=activeTab)
```

---

## 5. 애니메이션

```css
@keyframes floatA { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.04)} }
@keyframes floatB { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 50%{transform:translateY(-10px) scale(1.06) rotate(8deg)} }
@keyframes bounceIn { 0%{transform:scale(0.5) translateY(30px);opacity:0} 60%{transform:scale(1.08) translateY(-6px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
@keyframes ripple { 0%{transform:scale(0.8);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
@keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
```

---

## 6. 기존 앱 토큰 (ChecklistPage 등)

`src/styles/tokens.ts` 참조.
Primary: #29B6D0 (변경됨), 폰트: Pretendard, radius: sm/md/lg/xl/full

---

## 7. 주요 변경 이력

```
- Primary 색상: #1B6EF3 → #29B6D0 (밝은 파란색)
- Success 색상: #16A34A → #29B6D0 (완료 체크도 파란색으로 통일)
- 팝업 배경: #EFFCFC → #ffffff (흰색)
- BucketSheet: 여백 없는 전체화면 바텀시트로 변경
- BucketCheckView: 리스트 → 포토카드 그리드로 변경
- 상세 팝업: BucketSheet 바깥 레벨에서 별도 렌더링 (max-height 72vh)
- X 닫기 버튼: span 텍스트 → ph:x 아이콘으로 변경
```
