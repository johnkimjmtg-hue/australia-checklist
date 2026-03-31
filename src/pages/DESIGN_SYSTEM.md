# 호주가자 디자인 시스템

> 새 세션 시작 시 이 파일을 첨부하면 클로드가 스타일 기준을 바로 이해합니다.

---

## 1. 컬러 팔레트

### 브랜드 색상 (기존 앱 - ChecklistPage 등)
```
Primary:        #1B6EF3  (파란색 - 버튼, 강조)
Success:        #16A34A  (초록 - 완료)
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

팝업/바텀시트 배경: #EFFCFC  ← 카드와 동일
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

### 팝업 / 바텀시트 (공통)
```css
/* 모든 팝업 동일 스타일 적용 - 날씨, 메뉴, 약관 모두 */
position: fixed
bottom: 16px
left: 50%
transform: translateX(-50%)
width: calc(100% - 32px)
max-width: 398px
background: #EFFCFC          ← 카드와 동일색, 반투명 절대 금지
border-radius: 20px
box-shadow: 0 8px 32px rgba(0,0,0,0.20)
animation: slideUpSheet 0.25s ease
max-height: 85vh
overflow-y: auto

/* 핸들 바 */
width: 36px
height: 4px
border-radius: 999px
background: rgba(0,0,0,0.15)
margin: 12px auto 0

/* X 닫기 버튼 */
width: 28px
height: 28px
border-radius: 50%
background: rgba(0,0,0,0.08)
border: none
color: #0D3349
font-size: 14px

/* 오버레이 (팝업 뒤 배경) */
position: fixed
inset: 0
background: rgba(0,0,0,0.45)
z-index: 800
```

### 달력 날짜 선택 색상
```
출발일/귀국일:  bg #00838F, color #fff
선택 범위:      bg #B2EBF2, color #006064, border-radius 0
오늘:           border 1.5px solid #00838F
지나간 날짜:    color #7BAAB5, 클릭 불가
```

### 도시 날씨 카드 (홈페이지 상단)
```css
background: #EFFCFC
border-radius: 12px
padding: 6px 10px
box-shadow: 0 4px 20px rgba(0,0,0,0.10)
flex: 1

/* 내부 구성: 아이콘 + 도시명 + 온도 + 시간 한 줄 */
아이콘: 20px
도시명: 12px / 700 / #0D3349
온도:   11px / 700 / #CC3300  ← 블러드 오렌지
시간:   11px / 600 / #0D3349
```

### 블롭 (히어로 배경 장식)
```
색상: #80DEEA, #26C6DA, #00ACC1
애니메이션: floatA(7s), floatB(5.5s) ease-in-out infinite
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
        ├── 버킷리스트
        ├── 쇼핑리스트
        ├── 업체정보
        ├── 내 주변
        └── 카페 빙고 (전체 너비)
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
```

---

## 6. 기존 앱 토큰 (ChecklistPage 등)

`src/styles/tokens.ts` 참조.
Primary: #1B6EF3, 폰트: Pretendard, radius: sm/md/lg/xl/full
