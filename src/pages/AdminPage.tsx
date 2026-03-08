import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import {
  Business, getBusinesses, createBusiness,
  updateBusiness, toggleFeatured,
} from '../lib/businessService'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

// ── 탭 타입
type MainTab = 'business' | 'categories' | 'items' | 'export' | 'requests' | 'suggestions'

// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'',
}

// ── 체크리스트 타입
type Cat  = { id:string; label:string; receiptLabel:string; emoji:string }
type Item = { id:string; categoryId:string; label:string; emoji:string }

const DEFAULT_CATS: Cat[] = [
  { id:'cafe',       label:'카페/브런치',  receiptLabel:'카페/브런치',  emoji:'☕' },
  { id:'food',       label:'먹거리',       receiptLabel:'먹거리',       emoji:'🍔' },
  { id:'shopping',   label:'쇼핑',         receiptLabel:'쇼핑',         emoji:'🛍' },
  { id:'nature',     label:'자연/동물',    receiptLabel:'자연/동물',    emoji:'🐨' },
  { id:'city',       label:'도시/문화',    receiptLabel:'도시/문화',    emoji:'🏛' },
  { id:'beach',      label:'해변/물놀이',  receiptLabel:'해변/물놀이',  emoji:'🏊' },
  { id:'backpacker', label:'백패커',       receiptLabel:'백패커',       emoji:'🎒' },
  { id:'unique',     label:'이색경험',     receiptLabel:'이색경험',     emoji:'🌈' },
  { id:'custom',     label:'직접입력',     receiptLabel:'직접입력',     emoji:'✏️' },
]

const DEFAULT_ITEMS: Item[] = [
  // 카페/브런치
  { id:'c01', categoryId:'cafe', label:'빌즈(Bills) 리코타 팬케이크',     emoji:'🥞' },
  { id:'c02', categoryId:'cafe', label:'루네(Lune) 크로와상 줄 서기',     emoji:'🥐' },
  { id:'c03', categoryId:'cafe', label:'더 그라운즈 오브 알렉산드리아',   emoji:'🌿' },
  { id:'c04', categoryId:'cafe', label:'싱글 오(Single O) 스페셜티 커피', emoji:'☕' },
  { id:'c05', categoryId:'cafe', label:'캄포스(Campos) 초록 컵 인증샷',   emoji:'☕' },
  { id:'c06', categoryId:'cafe', label:'패트리샤(Patricia) 에스프레소 바',emoji:'☕' },
  { id:'c07', categoryId:'cafe', label:'에디션 로스터스 수플레 팬케이크', emoji:'🥞' },
  { id:'c08', categoryId:'cafe', label:'브라더 바바 부단 이색 인테리어',  emoji:'☕' },
  { id:'c09', categoryId:'cafe', label:'룸텐(Room 10) 브런치',            emoji:'🍳' },
  { id:'c10', categoryId:'cafe', label:'듁스(Dukes) 멜버른 커피',         emoji:'☕' },
  { id:'c11', categoryId:'cafe', label:'아보카도 온 토스트 먹기',         emoji:'🥑' },
  { id:'c12', categoryId:'cafe', label:'플랫 화이트 원조 찾기',           emoji:'☕' },
  { id:'c13', categoryId:'cafe', label:'본다이 아이스버그 카페',          emoji:'☕' },
  { id:'c14', categoryId:'cafe', label:'서리힐즈 카페 호핑',              emoji:'☕' },
  { id:'c15', categoryId:'cafe', label:'기드온 라떼 아트 구경',           emoji:'☕' },
  { id:'c16', categoryId:'cafe', label:'옥션룸 멜버른 브런치',            emoji:'🍳' },
  { id:'c17', categoryId:'cafe', label:'피콜로 라떼 도전',                emoji:'☕' },
  { id:'c18', categoryId:'cafe', label:'차이 라떼(Chai Latte) 마시기',    emoji:'🍵' },
  { id:'c19', categoryId:'cafe', label:'매직(Magic) 커피 주문',           emoji:'☕' },
  { id:'c20', categoryId:'cafe', label:'롱 블랙(Long Black) 마시기',      emoji:'☕' },
  { id:'c21', categoryId:'cafe', label:'세븐 씨즈 창고형 카페',           emoji:'☕' },
  { id:'c22', categoryId:'cafe', label:'바이런 베이 The Farm 커피',        emoji:'☕' },
  { id:'c23', categoryId:'cafe', label:'베이컨 앤 에그 롤 먹기',          emoji:'🥚' },
  { id:'c24', categoryId:'cafe', label:'험블 베이커리 핑거번',            emoji:'🍞' },
  { id:'c25', categoryId:'cafe', label:'에이피 베이커리(AP Bakery)',       emoji:'🍞' },
  { id:'c26', categoryId:'cafe', label:'오트 밀크로 변경해보기',          emoji:'🥛' },
  { id:'c27', categoryId:'cafe', label:'아이스 롱 블랙 체험',             emoji:'☕' },
  { id:'c28', categoryId:'cafe', label:'콘 프릿터(Corn Fritters) 먹기',   emoji:'🌽' },
  { id:'c29', categoryId:'cafe', label:'시드니 QVB 애프터눈 티 세트',     emoji:'🫖' },
  { id:'c30', categoryId:'cafe', label:'브루타운 크로넛 먹기',            emoji:'🥐' },
  { id:'c31', categoryId:'cafe', label:'숏 블랙(Short Black) 도전',       emoji:'☕' },
  { id:'c32', categoryId:'cafe', label:'베이비치노 주문하기',             emoji:'🥛' },
  { id:'c33', categoryId:'cafe', label:'소이 라떼(Soy Latte) 마시기',     emoji:'☕' },
  { id:'c34', categoryId:'cafe', label:'로컬 베이커리 사워도우 구매',     emoji:'🍞' },
  { id:'c35', categoryId:'cafe', label:'퍼스 Sayers Sister 브런치',       emoji:'🍳' },
  { id:'c36', categoryId:'cafe', label:'커피 안솔로지 브리즈번',          emoji:'☕' },
  { id:'c37', categoryId:'cafe', label:'더 바니(The Barn) 고택 카페',     emoji:'☕' },
  { id:'c38', categoryId:'cafe', label:'캔버라 The Cupping Room',          emoji:'☕' },
  { id:'c39', categoryId:'cafe', label:'메카(Mecca) 커피 알렉산드리아',   emoji:'☕' },
  { id:'c40', categoryId:'cafe', label:'아르티장(Artificer) 커피 바',     emoji:'☕' },
  { id:'c41', categoryId:'cafe', label:'해변가 카페 선라이즈 커피',       emoji:'🌅' },

  // 먹거리
  { id:'f01', categoryId:'food', label:'허리케인 그릴 폭립',              emoji:'🍖' },
  { id:'f02', categoryId:'food', label:'팀탐 슬램 체험',                  emoji:'🍫' },
  { id:'f03', categoryId:'food', label:'해리스 카페 드 휠 타이거 파이',   emoji:'🥧' },
  { id:'f04', categoryId:'food', label:'시드니 피쉬 마켓 굴 먹기',        emoji:'🦪' },
  { id:'f05', categoryId:'food', label:'팬케이크 온 더 록스',             emoji:'🥞' },
  { id:'f06', categoryId:'food', label:'치킨 파르마 펍 메뉴',             emoji:'🍗' },
  { id:'f07', categoryId:'food', label:'헝그리잭스 와퍼',                 emoji:'🍔' },
  { id:'f08', categoryId:'food', label:'젤라토 메시나 위클리 스페셜',     emoji:'🍨' },
  { id:'f09', categoryId:'food', label:'부스트 주스 망고 매직',           emoji:'🥭' },
  { id:'f10', categoryId:'food', label:'베지마이트 도전',                 emoji:'🍞' },
  { id:'f11', categoryId:'food', label:'캥거루 스테이크 구워먹기',        emoji:'🥩' },
  { id:'f12', categoryId:'food', label:'공원 BBQ 파티',                   emoji:'🔥' },
  { id:'f13', categoryId:'food', label:'피쉬 앤 칩스 해변에서',           emoji:'🐟' },
  { id:'f14', categoryId:'food', label:'블랙 스타 페이스트리 수박 케이크',emoji:'🍰' },
  { id:'f15', categoryId:'food', label:'라밍턴 맛보기',                   emoji:'🍮' },
  { id:'f16', categoryId:'food', label:'파블로바 디저트',                 emoji:'🍮' },
  { id:'f17', categoryId:'food', label:'버닝스 앞 소시지 시즐',           emoji:'🌭' },
  { id:'f18', categoryId:'food', label:'호주식 펍 스테이크',              emoji:'🥩' },
  { id:'f19', categoryId:'food', label:'야라 밸리 와이너리 시음',         emoji:'🍷' },
  { id:'f20', categoryId:'food', label:'BYO 식당에서 저녁 즐기기',        emoji:'🍷' },
  { id:'f21', categoryId:'food', label:'구즈만 와이 고메즈(GYG)',         emoji:'🌮' },
  { id:'f22', categoryId:'food', label:'베티스 버거 골드코스트',          emoji:'🍔' },
  { id:'f23', categoryId:'food', label:'그릴드(Grill\'d) 건강 버거',      emoji:'🍔' },
  { id:'f24', categoryId:'food', label:'여름 망고 한 박스 사기',          emoji:'🥭' },
  { id:'f25', categoryId:'food', label:'번다버그 진저비어',               emoji:'🫚' },
  { id:'f26', categoryId:'food', label:'친친(Chin Chin) 아시안 맛집',     emoji:'🍜' },
  { id:'f27', categoryId:'food', label:'미스터 웡 딤섬 런치',             emoji:'🥟' },
  { id:'f28', categoryId:'food', label:'바라문디 생선 스테이크',          emoji:'🐟' },
  { id:'f29', categoryId:'food', label:'밀로 가루 호주식으로 마시기',     emoji:'🥛' },
  { id:'f30', categoryId:'food', label:'에뮤 고기 요리 시식',             emoji:'🥩' },
  { id:'f31', categoryId:'food', label:'시드니 록 오이스터',              emoji:'🦪' },
  { id:'f32', categoryId:'food', label:'마무락(Mamak) 로티',              emoji:'🫓' },
  { id:'f33', categoryId:'food', label:'도넛 타임 비주얼 도넛',           emoji:'🍩' },
  { id:'f34', categoryId:'food', label:'바이올렛 크럼블 초콜릿',          emoji:'🍫' },
  { id:'f35', categoryId:'food', label:'스미스 감자칩 식초맛 도전',       emoji:'🥔' },
  { id:'f36', categoryId:'food', label:'모튼 베이 벅 부채새우 요리',      emoji:'🦐' },
  { id:'f37', categoryId:'food', label:'리틀 크리처스 프리맨틀 맥주',     emoji:'🍺' },
  { id:'f38', categoryId:'food', label:'쿠퍼스 맥주 효모 섞어 마시기',    emoji:'🍺' },
  { id:'f39', categoryId:'food', label:'포 포틴스(4 Pines) 맨리 맥주',    emoji:'🍺' },
  { id:'f40', categoryId:'food', label:'빅토리아 비터(VB) 마시기',        emoji:'🍺' },
  { id:'f41', categoryId:'food', label:'킹 아일랜드 치즈 플래터',         emoji:'🧀' },
  { id:'f42', categoryId:'food', label:'헌터 밸리 치즈 공장',             emoji:'🧀' },
  { id:'f43', categoryId:'food', label:'포엑스(XXXX Gold) 퀸즐랜드',      emoji:'🍺' },

  // 쇼핑
  { id:'s01', categoryId:'shopping', label:'포포크림 10개 묶음',           emoji:'🧴' },
  { id:'s02', categoryId:'shopping', label:'어그(UGG) 부츠 현지 구매',     emoji:'👢' },
  { id:'s03', categoryId:'shopping', label:'이솝(Aesop) 30% 저렴하게',     emoji:'🧴' },
  { id:'s04', categoryId:'shopping', label:'블랙모어스 영양제 세일',        emoji:'💊' },
  { id:'s05', categoryId:'shopping', label:'판도라 호주 한정 참 사기',      emoji:'💍' },
  { id:'s06', categoryId:'shopping', label:'티투(T2) French Earl Grey',     emoji:'🍵' },
  { id:'s07', categoryId:'shopping', label:'화이트 글로 미백 치약',         emoji:'🪥' },
  { id:'s08', categoryId:'shopping', label:'캄포 호주 지도 나무 도마',      emoji:'🪵' },
  { id:'s09', categoryId:'shopping', label:'마누카 꿀 MGO 500+',            emoji:'🍯' },
  { id:'s10', categoryId:'shopping', label:'프로폴리스 스프레이',           emoji:'💊' },
  { id:'s11', categoryId:'shopping', label:'팀탐 다양한 맛 종류별로',       emoji:'🍫' },
  { id:'s12', categoryId:'shopping', label:'비타민 E 크림 (판빙빙 크림)',   emoji:'🧴' },
  { id:'s13', categoryId:'shopping', label:'양태반 크림',                   emoji:'🧴' },
  { id:'s14', categoryId:'shopping', label:'수킨(Sukin) 비건 스킨케어',     emoji:'🌿' },
  { id:'s15', categoryId:'shopping', label:'울워스/콜스 1달러 장바구니',    emoji:'🛍' },
  { id:'s16', categoryId:'shopping', label:'하이스 초콜릿 골드 박스',       emoji:'🍫' },
  { id:'s17', categoryId:'shopping', label:'줄리크 로즈워터 미스트',        emoji:'🌹' },
  { id:'s18', categoryId:'shopping', label:'캥거루 가죽 지갑',              emoji:'👛' },
  { id:'s19', categoryId:'shopping', label:'메리노 울 이불',                emoji:'🛏' },
  { id:'s20', categoryId:'shopping', label:'에보리진 부메랑 장식품',        emoji:'🪃' },
  { id:'s21', categoryId:'shopping', label:'이뮤 오일(Emu Oil)',            emoji:'🧴' },
  { id:'s22', categoryId:'shopping', label:'마카다미아 너츠 대량 구매',     emoji:'🥜' },
  { id:'s23', categoryId:'shopping', label:'빌라봉 래쉬가드',               emoji:'🩱' },
  { id:'s24', categoryId:'shopping', label:'라노립스(Lanolips) 립밤',       emoji:'💄' },
  { id:'s25', categoryId:'shopping', label:'펜폴즈(Penfolds) 와인',        emoji:'🍷' },
  { id:'s26', categoryId:'shopping', label:'케이마트(Kmart) 홈웨어',        emoji:'🏠' },
  { id:'s27', categoryId:'shopping', label:'타겟(Target) 아기옷',           emoji:'👕' },
  { id:'s28', categoryId:'shopping', label:'버닝스(Bunnings) 앞치마',       emoji:'🛒' },
  { id:'s29', categoryId:'shopping', label:'티투(T2) 다기 세트',            emoji:'🫖' },
  { id:'s30', categoryId:'shopping', label:'네이처스 웨이 젤리 영양제',     emoji:'💊' },
  { id:'s31', categoryId:'shopping', label:'무가(Moogoo) 천연 화장품',      emoji:'🌿' },
  { id:'s32', categoryId:'shopping', label:'선스크린 스틱 무기자차',        emoji:'☀️' },
  { id:'s33', categoryId:'shopping', label:'바이런 베이 쿠키',              emoji:'🍪' },
  { id:'s34', categoryId:'shopping', label:'아노츠 Iced VoVo 과자',        emoji:'🍬' },
  { id:'s35', categoryId:'shopping', label:'이솝 핸드밤 대용량',            emoji:'🧴' },
  { id:'s36', categoryId:'shopping', label:'캥거루 육포',                   emoji:'🥩' },
  { id:'s37', categoryId:'shopping', label:'T2 슬리피 티',                  emoji:'🍵' },
  { id:'s38', categoryId:'shopping', label:'헤이구루 초콜릿 개구리',        emoji:'🍫' },

  // 자연/동물
  { id:'n01', categoryId:'nature', label:'블루마운틴 별보기',              emoji:'⭐' },
  { id:'n02', categoryId:'nature', label:'그레이트 오션 로드 12사도',      emoji:'🪨' },
  { id:'n03', categoryId:'nature', label:'로트네스트 섬 쿼카 셀카',        emoji:'🐾' },
  { id:'n04', categoryId:'nature', label:'울루루 선셋 샴페인',             emoji:'🌅' },
  { id:'n05', categoryId:'nature', label:'그레이트 배리어 리프 스노클링',  emoji:'🤿' },
  { id:'n06', categoryId:'nature', label:'포트 스티븐스 돌고래 크루즈',    emoji:'🐬' },
  { id:'n07', categoryId:'nature', label:'스카이다이빙 바다 위 낙하',      emoji:'🪂' },
  { id:'n08', categoryId:'nature', label:'본다이-쿠지 해안 트레킹 6km',   emoji:'🥾' },
  { id:'n09', categoryId:'nature', label:'바이런 베이 등대 일출',          emoji:'🌅' },
  { id:'n10', categoryId:'nature', label:'론 파인 보호구역 코알라 안기',   emoji:'🐨' },
  { id:'n11', categoryId:'nature', label:'필립 아일랜드 펭귄 퍼레이드',    emoji:'🐧' },
  { id:'n12', categoryId:'nature', label:'타롱가 주 페리 타고 기린 보기',  emoji:'🦒' },
  { id:'n13', categoryId:'nature', label:'닝갈루 리프 고래상어 스노클링',  emoji:'🦈' },
  { id:'n14', categoryId:'nature', label:'프레이저 아일랜드 모래섬 탐험',  emoji:'🏜' },
  { id:'n15', categoryId:'nature', label:'블루마운틴 시닉 레일웨이',       emoji:'🚞' },
  { id:'n16', categoryId:'nature', label:'화이트헤이븐 비치 실리카 스크럽',emoji:'🏝' },
  { id:'n17', categoryId:'nature', label:'휘트선데이 세일링 별 보기',      emoji:'⭐' },
  { id:'n18', categoryId:'nature', label:'페더데일 야생동물원 코알라',      emoji:'🐨' },
  { id:'n19', categoryId:'nature', label:'탕갈루마 야생 돌고래 먹이',      emoji:'🐬' },
  { id:'n20', categoryId:'nature', label:'모리셋 파크 야생 캥거루',        emoji:'🦘' },
  { id:'n21', categoryId:'nature', label:'멜버른 근교 야생 코알라 찾기',   emoji:'🐨' },
  { id:'n22', categoryId:'nature', label:'캥거루 아일랜드 바다사자',       emoji:'🦭' },
  { id:'n23', categoryId:'nature', label:'울루루 베이스 워크 10km',        emoji:'🥾' },
  { id:'n24', categoryId:'nature', label:'시드니 하버 혹등고래 점프',      emoji:'🐋' },
  { id:'n25', categoryId:'nature', label:'피나클스 사막 바위 기둥 산책',   emoji:'🏜' },
  { id:'n26', categoryId:'nature', label:'모닝턴 페닌슐라 야외 온천',      emoji:'♨️' },
  { id:'n27', categoryId:'nature', label:'태즈매니아 크래들 마운틴 트래킹',emoji:'⛰' },
  { id:'n28', categoryId:'nature', label:'카카두 국립공원 악어 관찰',      emoji:'🐊' },
  { id:'n29', categoryId:'nature', label:'핑크 호수 경비행기 투어',        emoji:'✈️' },
  { id:'n30', categoryId:'nature', label:'데인트리 열대우림 트레킹',       emoji:'🌴' },
  { id:'n31', categoryId:'nature', label:'몽키 마이아 야생 돌고래',        emoji:'🐬' },
  { id:'n32', categoryId:'nature', label:'타즈매니아 남극광 사냥',         emoji:'🌌' },
  { id:'n33', categoryId:'nature', label:'열기구 골드코스트 선라이즈',     emoji:'🎈' },
  { id:'n34', categoryId:'nature', label:'퍼핑 빌리 증기기관차',           emoji:'🚂' },
  { id:'n35', categoryId:'nature', label:'커럼빈 야생 앵무새 먹이',        emoji:'🦜' },
  { id:'n36', categoryId:'nature', label:'블루 마운틴 제놀란 동굴',        emoji:'🕳' },
  { id:'n37', categoryId:'nature', label:'사막 낙타 타고 울루루 일출',     emoji:'🐪' },
  { id:'n38', categoryId:'nature', label:'로열 보타닉 가든 잔디밭',        emoji:'🌿' },
  { id:'n39', categoryId:'nature', label:'킹스 파크 일몰 퍼스 야경',       emoji:'🌇' },
  { id:'n40', categoryId:'nature', label:'그레이트 오션 로드 헬기 투어',   emoji:'🚁' },

  // 도시/문화
  { id:'u01', categoryId:'city', label:'시드니 오페라 하우스 인증샷',     emoji:'🎭' },
  { id:'u02', categoryId:'city', label:'멜버른 호시어 레인 벽화',         emoji:'🎨' },
  { id:'u03', categoryId:'city', label:'하버 브리지 클라이밍',            emoji:'🌉' },
  { id:'u04', categoryId:'city', label:'시드니 대학교 해리포터 건물',     emoji:'🏛' },
  { id:'u05', categoryId:'city', label:'빅토리아 주립 도서관 돔',         emoji:'📚' },
  { id:'u06', categoryId:'city', label:'서큘러 키 페리 하버 즐기기',      emoji:'⛴' },
  { id:'u07', categoryId:'city', label:'비비드 시드니 오페라 조명쇼',     emoji:'💡' },
  { id:'u08', categoryId:'city', label:'오페라 바 노을 생맥주',           emoji:'🍺' },
  { id:'u09', categoryId:'city', label:'퀸 빅토리아 빌딩 시계탑',        emoji:'🕰' },
  { id:'u10', categoryId:'city', label:'멜버른 시티 서클 무료 트램',      emoji:'🚃' },
  { id:'u11', categoryId:'city', label:'플린더스 스트리트 역 만남',       emoji:'🚉' },
  { id:'u12', categoryId:'city', label:'달링 하버 토요일 불꽃놀이',       emoji:'🎆' },
  { id:'u13', categoryId:'city', label:'맥콰리 체어 오페라 인증샷',       emoji:'📸' },
  { id:'u14', categoryId:'city', label:'퍼스 킹스 파크 피크닉 야경',      emoji:'🌃' },
  { id:'u15', categoryId:'city', label:'박싱 데이 명품 반값 쇼핑',        emoji:'🛍' },
  { id:'u16', categoryId:'city', label:'AFL 경기 직관',                   emoji:'🏈' },
  { id:'u17', categoryId:'city', label:'시드니 타워 아이 360도 야경',     emoji:'🗼' },
  { id:'u18', categoryId:'city', label:'루나 파크 광대 문 입장',          emoji:'🎡' },
  { id:'u19', categoryId:'city', label:'멜버른 루프탑 바 스카이라인',     emoji:'🌆' },
  { id:'u20', categoryId:'city', label:'더 록스 골목 역사 투어',          emoji:'🪨' },
  { id:'u21', categoryId:'city', label:'브리즈번 강 페리 야경',           emoji:'🌉' },
  { id:'u22', categoryId:'city', label:'시드니 현대 미술관(MCA) 루프탑',  emoji:'🖼' },
  { id:'u23', categoryId:'city', label:'안작 데이 퍼레이드 참관',         emoji:'🎖' },
  { id:'u24', categoryId:'city', label:'마디 그라 퍼레이드',              emoji:'🌈' },
  { id:'u25', categoryId:'city', label:'퍼스 런던 코트 중세 골목',        emoji:'🏰' },
  { id:'u26', categoryId:'city', label:'블루 마운틴 쓰리 시스터즈',       emoji:'⛰' },
  { id:'u27', categoryId:'city', label:'시드니 세인트 메리 성당',         emoji:'⛪' },
  { id:'u28', categoryId:'city', label:'멜버른 스카이덱 유리 바닥',       emoji:'🏙' },
  { id:'u29', categoryId:'city', label:'시드니 차이나타운 야시장',        emoji:'🏮' },
  { id:'u30', categoryId:'city', label:'호바트 살라망카 토요 마켓',       emoji:'🛒' },
  { id:'u31', categoryId:'city', label:'캔버라 전쟁 기념관 한국전 기록',  emoji:'🕊' },
  { id:'u32', categoryId:'city', label:'호바트 MONA 현대 미술관',         emoji:'🖼' },
  { id:'u33', categoryId:'city', label:'퍼스 하이어 가든 힙플 카페',      emoji:'🌿' },

  // 해변/물놀이
  { id:'b01', categoryId:'beach', label:'본다이 아이스버그 해수 수영장',  emoji:'🏊' },
  { id:'b02', categoryId:'beach', label:'본다이 비치 선탠하기',           emoji:'🏖' },
  { id:'b03', categoryId:'beach', label:'브라이튼 비치 배싱 박스 인증샷', emoji:'🎨' },
  { id:'b04', categoryId:'beach', label:'맨리 비치 페리로 가기',          emoji:'⛴' },
  { id:'b05', categoryId:'beach', label:'화이트헤이븐 비치 실리카 모래',  emoji:'🏝' },
  { id:'b06', categoryId:'beach', label:'서퍼스 파라다이스 백사장',       emoji:'🏄' },
  { id:'b07', categoryId:'beach', label:'저비스 베이 하이얌스 비치',      emoji:'🏖' },
  { id:'b08', categoryId:'beach', label:'로트네스트 더 바신 스노클링',    emoji:'🤿' },
  { id:'b09', categoryId:'beach', label:'서핑 레슨 첫 파도 타기',         emoji:'🏄' },
  { id:'b10', categoryId:'beach', label:'누사 비치 패들보드',             emoji:'🛶' },
  { id:'b11', categoryId:'beach', label:'왓슨스 베이 피쉬앤칩스',         emoji:'🐟' },
  { id:'b12', categoryId:'beach', label:'탕갈루마 난파선 스노클링',       emoji:'🤿' },
  { id:'b13', categoryId:'beach', label:'쿠지 비치 로컬 해변',            emoji:'🏖' },
  { id:'b14', categoryId:'beach', label:'쉘리 비치 스노클링 상어 찾기',   emoji:'🦈' },
  { id:'b15', categoryId:'beach', label:'본다이-브론테 해안 절벽 산책',   emoji:'🥾' },
  { id:'b16', categoryId:'beach', label:'글레넬그 비치 트램 여행',        emoji:'🚃' },
  { id:'b17', categoryId:'beach', label:'해밀턴 아일랜드 버기카 드라이브',emoji:'🏝' },
  { id:'b18', categoryId:'beach', label:'벨즈 비치 서퍼 성지 구경',       emoji:'🏄' },
  { id:'b19', categoryId:'beach', label:'코트슬로 비치 인디언 오션 수영', emoji:'🌊' },
  { id:'b20', categoryId:'beach', label:'브룸 케이블 비치 낙타 일몰',     emoji:'🐪' },
  { id:'b21', categoryId:'beach', label:'그린 아일랜드 산호초 스노클링',  emoji:'🤿' },
  { id:'b22', categoryId:'beach', label:'모레튼 아일랜드 모래언덕 달리기',emoji:'🏜' },
  { id:'b23', categoryId:'beach', label:'시드니 닐슨 파크 안전 수영장',   emoji:'🏊' },
  { id:'b24', categoryId:'beach', label:'해변 바비큐 소시지 굽기',        emoji:'🔥' },
  { id:'b25', categoryId:'beach', label:'카약 하버 브리지 통과',          emoji:'🚣' },
  { id:'b26', categoryId:'beach', label:'제트보트 시드니 하버 360도',     emoji:'🚤' },
  { id:'b27', categoryId:'beach', label:'타즈매니아 와인글래스 베이',     emoji:'🏝' },
  { id:'b28', categoryId:'beach', label:'스탠드 업 패들보드(SUP)',        emoji:'🛶' },
  { id:'b29', categoryId:'beach', label:'고래 관찰 시즌 혹등고래',        emoji:'🐋' },
  { id:'b30', categoryId:'beach', label:'해변 모닝 요가',                 emoji:'🧘' },
  { id:'b31', categoryId:'beach', label:'조개(Pipis) 캐기 체험',          emoji:'🐚' },
  { id:'b32', categoryId:'beach', label:'서호주 쉘 비치 조개껍데기 해변', emoji:'🐚' },

  // 백패커
  { id:'k01', categoryId:'backpacker', label:'캠퍼밴 빌려 호주 일주',          emoji:'🚐' },
  { id:'k02', categoryId:'backpacker', label:'공원 무료 바비큐 이용',           emoji:'🔥' },
  { id:'k03', categoryId:'backpacker', label:'맨발로 마트 가기',                emoji:'🦶' },
  { id:'k04', categoryId:'backpacker', label:'호스텔 도미토리 친구 만들기',     emoji:'🛏' },
  { id:'k05', categoryId:'backpacker', label:'"No Worries" 마인드 갖기',        emoji:'😎' },
  { id:'k06', categoryId:'backpacker', label:'멜버른 무료 트램 활용',           emoji:'🚃' },
  { id:'k07', categoryId:'backpacker', label:'보틀샵 호주 주류 문화 적응',      emoji:'🍺' },
  { id:'k08', categoryId:'backpacker', label:'"G\'day Mate" 인사하기',          emoji:'👋' },
  { id:'k09', categoryId:'backpacker', label:'검트리 중고거래 캠핑 장비',       emoji:'⛺' },
  { id:'k10', categoryId:'backpacker', label:'식당 무료 수돗물 요청하기',       emoji:'💧' },
  { id:'k11', categoryId:'backpacker', label:'TFN 신청 워홀 첫걸음',           emoji:'📋' },
  { id:'k12', categoryId:'backpacker', label:'셰어하우스 인스펙션',             emoji:'🏠' },
  { id:'k13', categoryId:'backpacker', label:'RSA 자격증 따기',                 emoji:'📜' },
  { id:'k14', categoryId:'backpacker', label:'우퍼(WWOOF) 농장 숙식',          emoji:'🌾' },
  { id:'k15', categoryId:'backpacker', label:'검트리 중고차 구매 후 되팔기',    emoji:'🚗' },
  { id:'k16', categoryId:'backpacker', label:'세컨 비자 농장 88일',             emoji:'🍌' },
  { id:'k17', categoryId:'backpacker', label:'멜버른 길거리 버스킹 감상',       emoji:'🎵' },
  { id:'k18', categoryId:'backpacker', label:'도서관 무료 Wi-Fi 활용',          emoji:'📶' },
  { id:'k19', categoryId:'backpacker', label:'호스텔 펍 크롤 참여',             emoji:'🍻' },
  { id:'k20', categoryId:'backpacker', label:'별 보며 캠핑카 위 잠들기',        emoji:'⭐' },
  { id:'k21', categoryId:'backpacker', label:'마트 마감 반값 할인 득템',        emoji:'🛒' },
  { id:'k22', categoryId:'backpacker', label:'오피스웍스 이력서 출력',          emoji:'📄' },
  { id:'k23', categoryId:'backpacker', label:'현지 유심 옵터스/텔스트라 개통',  emoji:'📱' },
  { id:'k24', categoryId:'backpacker', label:'이력서 직접 돌리기 도전',         emoji:'📄' },
  { id:'k25', categoryId:'backpacker', label:'오지 캠핑 야생 하룻밤',          emoji:'⛺' },
  { id:'k26', categoryId:'backpacker', label:'비포장 도로 사륜구동 탐험',       emoji:'🚙' },
  { id:'k27', categoryId:'backpacker', label:'주립 미술관 무료 투어',           emoji:'🖼' },
  { id:'k28', categoryId:'backpacker', label:'호주 슬랭 마스터하기',            emoji:'🗣' },
  { id:'k29', categoryId:'backpacker', label:'로컬 펍 퀴즈 나잇 참여',         emoji:'🍺' },
  { id:'k30', categoryId:'backpacker', label:'비치 타월 깔고 독서 일광욕',      emoji:'📖' },

  // 이색경험
  { id:'e01', categoryId:'unique', label:'시드니 뉴이어 불꽃놀이 명당 사수',  emoji:'🎆' },
  { id:'e02', categoryId:'unique', label:'한여름의 크리스마스 체험',           emoji:'🎄' },
  { id:'e03', categoryId:'unique', label:'남십자성 찾기',                      emoji:'⭐' },
  { id:'e04', categoryId:'unique', label:'밤바다 발광 플랑크톤 감상',          emoji:'🌊' },
  { id:'e05', categoryId:'unique', label:'공원 야생 앵무새 먹이 주기',         emoji:'🦜' },
  { id:'e06', categoryId:'unique', label:'멜버른 컵 경마 도전',                emoji:'🐎' },
  { id:'e07', categoryId:'unique', label:'호주의 날 로컬 파티 참여',           emoji:'🇦🇺' },
  { id:'e08', categoryId:'unique', label:'지하 마을 쿠버 페디 숙박',           emoji:'🕳' },
  { id:'e09', categoryId:'unique', label:'가니 기차 대륙 종단',                emoji:'🚂' },
  { id:'e10', categoryId:'unique', label:'화이트 나이트 멜버른',               emoji:'💡' },
  { id:'e11', categoryId:'unique', label:'거대 거미 헌츠맨 첫 만남',           emoji:'🕷' },
  { id:'e12', categoryId:'unique', label:'해질녘 수만 마리 박쥐 구경',         emoji:'🦇' },
  { id:'e13', categoryId:'unique', label:'플로리아드 꽃 축제 캔버라',          emoji:'🌷' },
  { id:'e14', categoryId:'unique', label:'에보리진 디저리두 소리 듣기',        emoji:'🎵' },
  { id:'e15', categoryId:'unique', label:'부메랑 던지기 클래스',               emoji:'🪃' },
  { id:'e16', categoryId:'unique', label:'루프탑 영화관 멜버른 야경',          emoji:'🎬' },
  { id:'e17', categoryId:'unique', label:'야간 동물원 야행성 동물 관찰',       emoji:'🦉' },
  { id:'e18', categoryId:'unique', label:'벼룩시장 빈티지 의류 득템',          emoji:'👗' },
  { id:'e19', categoryId:'unique', label:'호주 달러 동물 동전 수집',           emoji:'🪙' },
  { id:'e20', categoryId:'unique', label:'요가 온 더 비치',                    emoji:'🧘' },
  { id:'e21', categoryId:'unique', label:'아웃백 로드하우스 버거',             emoji:'🍔' },
  { id:'e22', categoryId:'unique', label:'아웃백 주유소 아슬아슬 주유',        emoji:'⛽' },
  { id:'e23', categoryId:'unique', label:'포트 와인 강화 와인 시음',           emoji:'🍷' },
  { id:'e24', categoryId:'unique', label:'타투 샵 호주 문화 체험',             emoji:'🎨' },
  { id:'e25', categoryId:'unique', label:'로컬 밴드 펍 라이브 공연',           emoji:'🎸' },
  { id:'e26', categoryId:'unique', label:'서프 라이프 세이빙 대회 관람',       emoji:'🏄' },
  { id:'e27', categoryId:'unique', label:'현지인과 바비큐 BYO 파티',           emoji:'🔥' },
  { id:'e28', categoryId:'unique', label:'호주식 영어 욕 배우기',              emoji:'🗣' },
  { id:'e29', categoryId:'unique', label:'호주 홍보대사 SNS 기록하기',         emoji:'📱' },
  { id:'e30', categoryId:'unique', label:'망고 페스티벌 퀸즐랜드',             emoji:'🥭' },
]

const EMOJI_MAP: [string[], string][] = [
  [['치과','치아','스케일링','충치','미백'], '🦷'],
  [['피부','레이저','보톡스','필러','여드름'], '💆'],
  [['안과','눈','라식','라섹'], '👁'],
  [['안경','렌즈'], '👓'],
  [['병원','검진','건강','의원'], '🏥'],
  [['약','처방','항생','소염'], '💊'],
  [['미용실','헤어','커트','펌','염색'], '💇'],
  [['네일'], '💅'],
  [['마사지','스파'], '💆'],
  [['찜질','사우나'], '♨️'],
  [['크림','로션','에센스','토너','팩'], '🧴'],
  [['선크림'], '☀️'],
  [['올리브영'], '🛍'],
  [['다이소','마트'], '🏪'],
  [['헬스','운동'], '💪'],
  [['치킨','닭'], '🍗'],
  [['짜장','짬뽕','라면','냉면','국수'], '🍜'],
  [['국밥','국','탕','찌개','순대'], '🍲'],
  [['고기','삼겹','갈비','한우','보쌈','족발','곱창'], '🥩'],
  [['회','초밥'], '🍣'],
  [['떡볶이','마라'], '🌶'],
  [['비빔밥'], '🍚'],
  [['카페'], '☕'],
  [['빙수'], '🍧'],
  [['맥주','치맥','막걸리'], '🍺'],
  [['만두'], '🥟'],
  [['김밥'], '🍱'],
  [['포장마차','노점'], '🍢'],
  [['면세'], '✈️'],
  [['선글라스'], '🕶'],
  [['반지','목걸이','귀걸이'], '💍'],
  [['책','도서'], '📚'],
  [['과자','초콜릿'], '🍫'],
  [['김치'], '🥬'],
  [['홍삼','인삼'], '🌿'],
  [['기념품','선물'], '🎁'],
  [['여권'], '📘'],
  [['은행','계좌'], '🏦'],
  [['핸드폰','유심'], '📱'],
  [['자동차','운전'], '🚗'],
  [['세금','환급'], '💰'],
  [['보험'], '🛡'],
  [['부모','가족'], '👪'],
  [['친구'], '👥'],
  [['학교','동창','모임'], '🎓'],
  [['고향'], '🏡'],
  [['사진','스튜디오'], '📸'],
  [['예방접종','주사'], '💉'],
  [['장난감'], '🧸'],
  [['기저귀'], '🧷'],
  [['키즈'], '🎠'],
  [['경복궁','창덕궁','궁'], '🏯'],
  [['타워'], '🗼'],
  [['한강'], '🌊'],
  [['한옥'], '🏘'],
  [['노래방'], '🎤'],
  [['pc방','게임'], '🎮'],
  [['야구'], '⚾'],
  [['한복'], '👘'],
  [['제주'], '🌋'],
  [['부산','해운대'], '🏖'],
  [['방탈출'], '🔐'],
]

function autoEmoji(label: string): string {
  const lower = label.toLowerCase()
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some(k => lower.includes(k))) return emoji
  }
  return '📌'
}

// ════════════════════════════════════════════
// 주소 자동완성 컴포넌트
// ════════════════════════════════════════════
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
    s.onload = () => {
      // 약간 딜레이 줘서 places 객체 완전히 초기화되도록
      setTimeout(() => resolve(), 100)
    }
    s.onerror = () => reject(new Error('Google Maps load failed'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

function AddressAutocomplete({ address, city, onSelect }: {
  address: string
  city: string
  onSelect: (address: string, city: string) => void
}) {
  const [query, setQuery]             = useState(address || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading]         = useState(false)
  const [manual, setManual]           = useState(false)
  const [manualCity, setManualCity]   = useState(city || '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        await loadGoogleMaps()
        const places = (window as any).google.maps.places
        const AutocompleteSuggestion = places.AutocompleteSuggestion || places.autocomplete?.AutocompleteSuggestion
        if (!AutocompleteSuggestion) throw new Error('AutocompleteSuggestion not available')
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
          includedRegionCodes: ['au'],
        })
        setSuggestions(results || [])
      } catch (e) {
        console.error('Places error:', e)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  async function handleSelect(suggestion: any) {
    setSuggestions([])
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] })
      const components = place.addressComponents || []
      const suburb = components.find((c: any) => c.types.includes('locality') || c.types.includes('sublocality_level_1'))?.longText || ''
      const state  = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.shortText || ''
      const post   = components.find((c: any) => c.types.includes('postal_code'))?.longText || ''
      const streetNum = components.find((c: any) => c.types.includes('street_number'))?.longText || ''
      const route     = components.find((c: any) => c.types.includes('route'))?.longText || ''
      const streetAddress = [streetNum, route, suburb, state, post].filter(Boolean).join(', ')
      setQuery(streetAddress)
      setManualCity(suburb)
      onSelect(streetAddress, suburb)
    } catch (e) { console.error('Place detail error:', e) }
  }

  if (manual) return (
    <div>
      <input value={query} onChange={e => { setQuery(e.target.value); onSelect(e.target.value, manualCity) }}
        style={inputStyle} placeholder="예: 123 George Street, Chatswood NSW 2067" />
      <input value={manualCity} onChange={e => { setManualCity(e.target.value); onSelect(query, e.target.value) }}
        style={{ ...inputStyle, marginTop:6 }} placeholder="Suburb 예: Chatswood" />
      <button onClick={() => setManual(false)} style={{ fontSize:11, color:'#1E4D83', background:'none', border:'none', cursor:'pointer', marginTop:4, fontWeight:700 }}>🔍 자동검색으로 전환</button>
    </div>
  )

  return (
    <div style={{ position:'relative' }}>
      <input value={query} onChange={e => handleInput(e.target.value)} style={inputStyle}
        placeholder="주소 입력 (예: 123 George St Chatswood)" />
      {loading && <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>🔍 검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100,
          background:'#fff', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          border:'1px solid #e0e0e0', overflow:'hidden', marginTop:4 }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)}
              style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:'1px solid #f3f3f3', color:'#333' }}
              onMouseEnter={e => (e.currentTarget.style.background='#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
              📍 {s.placePrediction?.text?.text || ''}
            </div>
          ))}
        </div>
      )}
      {city && <div style={{ marginTop:6, fontSize:12, color:'#1E4D83', fontWeight:700 }}>📌 Suburb: {city}</div>}
      <button onClick={() => setManual(true)} style={{ fontSize:11, color:'#aaa', background:'none', border:'none', cursor:'pointer', marginTop:4, fontWeight:700 }}>✏️ 직접 입력</button>
    </div>
  )
}

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw]         = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab]       = useState<MainTab>('business')

  // ── 공유 checklist state (카테고리·아이템·아이콘 탭 간 공유)
  const [sharedCats,    setSharedCats]    = useState<Cat[]>(() => JSON.parse(JSON.stringify(DEFAULT_CATS)))
  const [sharedItems,   setSharedItems]   = useState<Item[]>(() => JSON.parse(JSON.stringify(DEFAULT_ITEMS)))
  const [sharedIconMap, setSharedIconMap] = useState<Record<string,string>>(() => ({
    // 카페/브런치
    c01:'ph:coffee',c02:'ph:croissant',c03:'ph:flower',c04:'ph:coffee',c05:'ph:coffee',
    c06:'ph:coffee',c07:'ph:cake',c08:'ph:coffee',c09:'ph:egg',c10:'ph:coffee',
    c11:'ph:leaf',c12:'ph:coffee',c13:'ph:coffee',c14:'ph:coffee',c15:'ph:coffee',
    c16:'ph:egg',c17:'ph:coffee',c18:'ph:tea-bag',c19:'ph:coffee',c20:'ph:coffee',
    c21:'ph:coffee',c22:'ph:coffee',c23:'ph:egg',c24:'ph:bread',c25:'ph:bread',
    c26:'ph:drop',c27:'ph:coffee',c28:'ph:plant',c29:'ph:tea-bag',c30:'ph:croissant',
    c31:'ph:coffee',c32:'ph:drop',c33:'ph:coffee',c34:'ph:bread',c35:'ph:egg',
    c36:'ph:coffee',c37:'ph:coffee',c38:'ph:coffee',c39:'ph:coffee',c40:'ph:coffee',
    c41:'ph:sun',
    // 먹거리
    f01:'ph:fork-knife',f02:'ph:cookie',f03:'ph:pie',f04:'ph:fish',f05:'ph:cake',
    f06:'ph:fork-knife',f07:'ph:hamburger',f08:'ph:ice-cream',f09:'ph:orange',f10:'ph:bread',
    f11:'ph:fork-knife',f12:'ph:flame',f13:'ph:fish',f14:'ph:cake',f15:'ph:cake',
    f16:'ph:cake',f17:'ph:flame',f18:'ph:fork-knife',f19:'ph:wine',f20:'ph:wine',
    f21:'ph:pepper',f22:'ph:hamburger',f23:'ph:hamburger',f24:'ph:orange',f25:'ph:bottle',
    f26:'ph:bowl-food',f27:'ph:bowl-food',f28:'ph:fish',f29:'ph:drop',f30:'ph:fork-knife',
    f31:'ph:fish',f32:'ph:fork-knife',f33:'ph:donut',f34:'ph:cookie',f35:'ph:fork-knife',
    f36:'ph:shrimp',f37:'ph:beer-stein',f38:'ph:beer-stein',f39:'ph:beer-stein',f40:'ph:beer-stein',
    f41:'ph:cheese',f42:'ph:cheese',f43:'ph:beer-stein',
    // 쇼핑
    s01:'ph:drop-half',s02:'ph:boot',s03:'ph:drop-half',s04:'ph:pill',s05:'ph:diamond',
    s06:'ph:tea-bag',s07:'ph:tooth',s08:'ph:cutting-board',s09:'ph:jar-label',s10:'ph:pill',
    s11:'ph:cookie',s12:'ph:drop-half',s13:'ph:drop-half',s14:'ph:leaf',s15:'ph:shopping-bag',
    s16:'ph:cookie',s17:'ph:flower',s18:'ph:wallet',s19:'ph:bed',s20:'ph:boomerang',
    s21:'ph:drop-half',s22:'ph:nut',s23:'ph:t-shirt',s24:'ph:lipstick',s25:'ph:wine',
    s26:'ph:house',s27:'ph:baby',s28:'ph:shopping-cart',s29:'ph:tea-bag',s30:'ph:pill',
    s31:'ph:leaf',s32:'ph:sun',s33:'ph:cookie',s34:'ph:cookie',s35:'ph:drop-half',
    s36:'ph:fork-knife',s37:'ph:tea-bag',s38:'ph:cookie',
    // 자연/동물
    n01:'ph:star',n02:'ph:mountains',n03:'ph:paw-print',n04:'ph:sunset',n05:'ph:waves',
    n06:'ph:fish-simple',n07:'ph:parachute',n08:'ph:sneaker-move',n09:'ph:lighthouse',n10:'ph:paw-print',
    n11:'ph:bird',n12:'ph:paw-print',n13:'ph:fish-simple',n14:'ph:jeep',n15:'ph:train',
    n16:'ph:island',n17:'ph:sailboat',n18:'ph:paw-print',n19:'ph:fish-simple',n20:'ph:paw-print',
    n21:'ph:tree',n22:'ph:paw-print',n23:'ph:sneaker-move',n24:'ph:waves',n25:'ph:mountains',
    n26:'ph:thermometer-hot',n27:'ph:mountain',n28:'ph:paw-print',n29:'ph:airplane',n30:'ph:tree-palm',
    n31:'ph:fish-simple',n32:'ph:shooting-star',n33:'ph:balloon',n34:'ph:train',n35:'ph:bird',
    n36:'ph:cave',n37:'ph:horse',n38:'ph:flower',n39:'ph:sunset',n40:'ph:helicopter',
    // 도시/문화
    u01:'ph:buildings',u02:'ph:palette',u03:'ph:bridge',u04:'ph:graduation-cap',u05:'ph:books',
    u06:'ph:boat',u07:'ph:lightbulb',u08:'ph:beer-stein',u09:'ph:clock',u10:'ph:tram',
    u11:'ph:train-simple',u12:'ph:shooting-star',u13:'ph:camera',u14:'ph:tree',u15:'ph:shopping-bag',
    u16:'ph:football',u17:'ph:binoculars',u18:'ph:smiley',u19:'ph:buildings',u20:'ph:map-pin',
    u21:'ph:boat',u22:'ph:frame-corners',u23:'ph:medal',u24:'ph:rainbow',u25:'ph:castle',
    u26:'ph:mountains',u27:'ph:church',u28:'ph:buildings',u29:'ph:storefront',u30:'ph:storefront',
    u31:'ph:dove',u32:'ph:frame-corners',u33:'ph:plant',
    // 해변/물놀이
    b01:'ph:waves',b02:'ph:umbrella',b03:'ph:palette',b04:'ph:boat',b05:'ph:island',
    b06:'ph:waves',b07:'ph:waves',b08:'ph:waves',b09:'ph:waves',b10:'ph:oar',
    b11:'ph:fish',b12:'ph:waves',b13:'ph:umbrella',b14:'ph:fish-simple',b15:'ph:sneaker-move',
    b16:'ph:tram',b17:'ph:island',b18:'ph:waves',b19:'ph:waves',b20:'ph:horse',
    b21:'ph:waves',b22:'ph:jeep',b23:'ph:waves',b24:'ph:flame',b25:'ph:oar',
    b26:'ph:boat',b27:'ph:island',b28:'ph:oar',b29:'ph:waves',b30:'ph:person-simple',
    b31:'ph:shell',b32:'ph:shell',
    // 백패커
    k01:'ph:van',k02:'ph:flame',k03:'ph:person-simple',k04:'ph:bed',k05:'ph:smiley',
    k06:'ph:tram',k07:'ph:beer-stein',k08:'ph:hand-waving',k09:'ph:tent',k10:'ph:drop',
    k11:'ph:identification-card',k12:'ph:house',k13:'ph:certificate',k14:'ph:plant',k15:'ph:car',
    k16:'ph:leaf',k17:'ph:music-note',k18:'ph:wifi',k19:'ph:beer-stein',k20:'ph:star',
    k21:'ph:shopping-cart',k22:'ph:printer',k23:'ph:device-mobile',k24:'ph:paper-plane',k25:'ph:tent',
    k26:'ph:jeep',k27:'ph:frame-corners',k28:'ph:chat-circle',k29:'ph:beer-stein',k30:'ph:book-open',
    // 이색경험
    e01:'ph:shooting-star',e02:'ph:tree-evergreen',e03:'ph:star',e04:'ph:waves',e05:'ph:bird',
    e06:'ph:horse',e07:'ph:flag',e08:'ph:cave',e09:'ph:train',e10:'ph:lightbulb',
    e11:'ph:bug',e12:'ph:bat',e13:'ph:flower',e14:'ph:music-note',e15:'ph:boomerang',
    e16:'ph:film-slate',e17:'ph:owl',e18:'ph:clothes-hanger',e19:'ph:coin',e20:'ph:person-simple',
    e21:'ph:hamburger',e22:'ph:gas-pump',e23:'ph:wine',e24:'ph:palette',e25:'ph:guitar',
    e26:'ph:waves',e27:'ph:flame',e28:'ph:chat-circle',e29:'ph:device-mobile',e30:'ph:orange',
  }))

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  if (!authed) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, padding:'32px 24px',
        boxShadow:'0 8px 32px rgba(30,77,131,0.12)', width:'calc(100% - 48px)', maxWidth:360,
      }}>
        <div style={{ fontSize:32, textAlign:'center', marginBottom:8 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D', textAlign:'center', marginBottom:4 }}>Admin</div>
        <div style={{ fontSize:12, color:'#8AAAC8', textAlign:'center', marginBottom:24 }}>호주가자 관리자 페이지</div>
        <input
          type="password" placeholder="비밀번호"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />
        {pwError && <div style={{ color:'#e8420a', fontSize:12, marginTop:6, fontWeight:700 }}>비밀번호가 틀렸어요</div>}
        <button onClick={handleLogin} style={{ ...btnPrimary, marginTop:12 }}>로그인</button>
        <button onClick={onBack} style={{ ...btnGhost, marginTop:8 }}>← 돌아가기</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight:'100vh', background:'#f0f2f5',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        background:'#1E4D83', color:'#fff', padding:'16px 20px',
        display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:50,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', padding:0 }}>←</button>
        <div>
          <div style={{ fontSize:17, fontWeight:900 }}>🛠 호주가자 Admin</div>
          <div style={{ fontSize:11, opacity:0.7 }}>관리자 페이지</div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', display:'flex', overflowX:'auto' }}>
        {([
          ['business',    '🏢 업체 관리'],
          ['requests',    '📬 등록 신청'],
          ['suggestions', '💡 버킷 추천'],
          ['categories',  '📂 카테고리'],
          ['items',       '📝 체크리스트'],
          ['export',      '💾 코드 내보내기'],
        ] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'12px 18px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, whiteSpace:'nowrap',
            color: tab===id ? '#1E4D83' : '#888',
            borderBottom: tab===id ? '2.5px solid #1E4D83' : '2.5px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px 80px' }}>
        {tab==='business'    && <BusinessTab />}
        {tab==='requests'    && <RequestsTab />}
        {tab==='suggestions' && <SuggestionsTab />}
        {tab==='categories'  && <CategoriesTab cats={sharedCats} setCats={setSharedCats} items={sharedItems} setItems={setSharedItems} />}
        {tab==='items'       && <ItemsTab cats={sharedCats} items={sharedItems} setItems={setSharedItems} iconMap={sharedIconMap} setIconMap={setSharedIconMap} />}
        {tab==='export'      && <ExportTab cats={sharedCats} items={sharedItems} iconMap={sharedIconMap} />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// TAB 1: 업체 관리
// ════════════════════════════════════════════
function BusinessTab() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState<string|null>(null)
  const [toast, setToast]           = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setBusinesses(await getBusinesses())
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  function openNew() {
    setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true)
  }

  function openEdit(b: Business) {
    setForm({
      id:b.id, name:b.name, category:b.category,
      description:b.description||'', phone:b.phone||'',
      website:b.website||'', kakao:b.kakao||'',
      address:b.address||'', city:b.city,
      is_featured:b.is_featured, is_active:b.is_active,
      tags:b.tags?.join(', ')||'',
    })
    setEditTarget(b); setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.city) { showToast('업체명, 도시는 필수예요'); return }
    setSaving(true)
    const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), rating:0, reviews_count:0 }
    if (editTarget) {
      const result = await updateBusiness(editTarget.id, payload)
      if (result) showToast('✅ 수정 완료')
      else { showToast('❌ 수정 실패 - 콘솔 확인'); setSaving(false); return }
    } else {
      const id = 'biz-' + Date.now()
      const result = await createBusiness({ ...payload, id })
      if (result) showToast('✅ 등록 완료')
      else { showToast('❌ 등록 실패 - 콘솔 확인'); setSaving(false); return }
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    showToast('🗑 삭제 완료'); setDeleteId(null); await load()
  }

  async function handleToggle(id: string, cur: boolean) {
    await toggleFeatured(id, !cur)
    showToast(cur ? '추천 해제' : '⭐ 추천 설정'); await load()
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {deleteId && <Confirm msg="정말 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}

      {showForm ? (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={() => setShowForm(false)} style={btnGhost}>← 목록</button>
            <h2 style={{ fontSize:16, fontWeight:900, color:'#0F1B2D', margin:0 }}>{editTarget ? '업체 수정' : '업체 등록'}</h2>
          </div>
          <Card>
            <Grid2>
              <Field label="업체명 *"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="예: Palas Property" /></Field>
              <Field label="카테고리">
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
                  {CATEGORIES.filter(c=>c.id!=='all').map(c=>(
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </Field>
            </Grid2>
            <Field label="주소 검색">
              <AddressAutocomplete
                address={form.address}
                city={form.city}
                onSelect={(address, city) => setForm(f=>({...f, address, city}))}
              />
            </Field>
            <Field label="업체 소개"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...inputStyle,resize:'none'}} rows={3} /></Field>
            <Field label="태그 (쉼표 구분)"><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} style={inputStyle} placeholder="예: 부동산 구매, 투자 상담" /></Field>
            <Grid2>
              <Field label="전화번호"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="+61 2 1234 5678" /></Field>
              <Field label="카카오 ID"><input value={form.kakao} onChange={e=>setForm(f=>({...f,kakao:e.target.value}))} style={inputStyle} /></Field>
            </Grid2>
            <Field label="웹사이트"><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={inputStyle} placeholder="https://..." /></Field>
            <div style={{ display:'flex', gap:20, marginTop:8 }}>
              <label style={checkLabel}><input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} /> ⭐ 추천 업체</label>
              <label style={checkLabel}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} /> ✅ 활성화</label>
            </div>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop:16 }}>{saving ? '저장 중...' : editTarget ? '수정 완료' : '등록하기'}</button>
          </Card>

          {/* 리뷰 관리 - 수정 모드일 때만 */}
          {editTarget && <ReviewManager businessId={editTarget.id} onRefresh={load} showToast={showToast} />}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:13, color:'#888', fontWeight:700 }}>총 {businesses.length}개 업체</span>
            <button onClick={openNew} style={btnPrimary}>+ 업체 등록</button>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>불러오는 중...</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {businesses.map(b => (
                <Card key={b.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:15, fontWeight:900, color:'#0F1B2D' }}>{b.name}</span>
                      {b.is_featured && <span style={{ marginLeft:6, fontSize:10, background:'#1E4D83', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>추천</span>}
                      {!b.is_active  && <span style={{ marginLeft:6, fontSize:10, background:'#e8420a', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>비활성</span>}
                    </div>
                    <span style={{ fontSize:11, color:'#8AAAC8' }}>{CATEGORIES.find(c=>c.id===b.category)?.emoji} {CATEGORIES.find(c=>c.id===b.category)?.label}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#7a8fb5', marginBottom:12 }}>📍 {b.city} · ⭐ {b.rating} ({b.reviews_count})</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(b)} style={{ ...btnGhost, flex:1, padding:'7px' }}>✏️ 수정</button>
                    <button onClick={() => handleToggle(b.id, b.is_featured)} style={{
                      flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:12,
                      background: b.is_featured ? 'rgba(255,220,50,0.2)' : 'rgba(200,218,248,0.3)',
                      color: b.is_featured ? '#b8860b' : '#1E4D83',
                    }}>{b.is_featured ? '⭐ 추천해제' : '☆ 추천설정'}</button>
                    <button onClick={() => setDeleteId(b.id)} style={{ padding:'7px 12px', background:'rgba(232,66,10,0.08)', border:'none', borderRadius:8, color:'#e8420a', fontWeight:800, fontSize:12, cursor:'pointer' }}>🗑</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

// ════════════════════════════════════════════
// 리뷰 관리 컴포넌트
// ════════════════════════════════════════════
function ReviewManager({ businessId, onRefresh, showToast }: { businessId: string; onRefresh: () => void; showToast: (msg: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { loadReviews() }, [businessId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) {
      showToast('🗑 리뷰 삭제 완료')
      setReviews(prev => prev.filter(r => r.id !== id))
      await onRefresh()
    } else {
      showToast('❌ 삭제 실패')
    }
    setDeleteId(null)
  }

  return (
    <>
      {deleteId && <Confirm msg="이 리뷰를 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}
      <Card>
        <SectionTitle>⭐ 리뷰 관리 ({reviews.length})</SectionTitle>
        {loading ? (
          <div style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'12px 0' }}>불러오는 중...</div>
        ) : reviews.length === 0 ? (
          <div style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'12px 0' }}>리뷰가 없어요</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'#f8fafd', borderRadius:10, border:'1px solid #eee' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#0F1B2D' }}>{r.author_name}</span>
                    <span style={{ fontSize:12, color:'#f5a623' }}>{'⭐'.repeat(r.rating)}</span>
                    <span style={{ fontSize:11, color:'#bbb' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#555', margin:0, lineHeight:1.6 }}>{r.content}</p>
                </div>
                <button onClick={() => setDeleteId(r.id)} style={{ ...btnSmDanger, flexShrink:0 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 2: 카테고리 관리
// ════════════════════════════════════════════
function CategoriesTab({ cats, setCats, items, setItems }: {
  cats: Cat[]; setCats: (f: (p: Cat[]) => Cat[]) => void
  items: Item[]; setItems: (f: (p: Item[]) => Item[]) => void
}) {
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [toast, setToast]       = useState('')
  const [selectedId, setSelectedId] = useState(cats[0]?.id ?? '')
  const [dragIdx, setDragIdx]   = useState<number|null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function addCat() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || autoEmoji(newLabel)
    const id = 'cat_' + Date.now()
    setCats(prev => [...prev, { id, label:newLabel.trim(), receiptLabel:newLabel.trim(), emoji }])
    setNewEmoji(''); setNewLabel('')
    showToast('카테고리 추가됨: ' + newLabel)
  }

  function deleteCat(id: string) {
    if (!confirm('이 카테고리와 하위 항목을 모두 삭제할까요?')) return
    setCats(prev => prev.filter(c => c.id !== id))
    setItems(prev => prev.filter(i => i.categoryId !== id))
    showToast('삭제됨')
  }

  function updateCat(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setCats(prev => prev.map(c => c.id===id ? {...c, [field]:val, ...(field==='label'?{receiptLabel:val}:{})} : c))
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    setCats(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, moved)
      // custom 항상 맨 마지막 강제
      const customIdx = next.findIndex(c => c.id === 'custom')
      if (customIdx !== -1 && customIdx !== next.length - 1) {
        const [custom] = next.splice(customIdx, 1)
        next.push(custom)
      }
      return next
    })
    setDragIdx(null); setDragOverIdx(null)
    showToast('순서 변경됨')
  }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>새 카테고리 추가</SectionTitle>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} placeholder="😀" maxLength={2}
            style={{ ...inputStyle, width:52, textAlign:'center', fontSize:20, flexShrink:0 }} />
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()}
            placeholder="카테고리 이름" style={{ ...inputStyle, flex:1, minWidth:0 }} />
          <button onClick={addCat} style={{ ...btnPrimary, flexShrink:0, whiteSpace:'nowrap' }}>추가</button>
        </div>
        <p style={{ fontSize:12, color:'#aaa', marginTop:6 }}>이모티콘 비워두면 자동 선택됩니다</p>
      </Card>

      <Card>
        <SectionTitle>카테고리 목록 ({cats.length}) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {cats.map((cat, idx) => {
            const isLocked = cat.id === 'custom'
            const isDragging = dragIdx === idx
            const isOver = dragOverIdx === idx
            return (
              <div
                key={cat.id}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(cat.id)}
                style={{
                  border: isOver ? '2px dashed #1E4D83' : `1.5px solid ${selectedId===cat.id ? '#1E4D83' : '#e8e8e8'}`,
                  borderRadius:12, padding:'12px 14px',
                  background: isDragging ? '#e8f0fe' : selectedId===cat.id ? '#eef2fb' : '#fafafa',
                  display:'flex', alignItems:'center', gap:10, cursor: isLocked ? 'default' : 'grab',
                  opacity: isDragging ? 0.5 : 1,
                  transition:'background 0.1s, opacity 0.1s',
                }}>
                {isLocked
                  ? <span style={{ color:'#ccc', fontSize:16 }}>🔒</span>
                  : <span style={{ color:'#aaa', fontSize:16, cursor:'grab', userSelect:'none' }}>⠿</span>
                }
                <input
                  value={cat.emoji} maxLength={2}
                  onChange={e => updateCat(cat.id, 'emoji', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ width:36, textAlign:'center', fontSize:20, border:'none', background:'transparent', cursor:isLocked?'default':'text' }}
                />
                <input
                  value={cat.label}
                  onChange={e => updateCat(cat.id, 'label', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ flex:1, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:isLocked?'#aaa':'#222', cursor:isLocked?'default':'text' }}
                />
                {!isLocked && (
                  <button onClick={e => { e.stopPropagation(); deleteCat(cat.id) }} style={{ background:'none', border:'none', color:'#e05252', cursor:'pointer', fontSize:14 }}>✕</button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 3: 체크리스트 항목
// ════════════════════════════════════════════
// 자주 쓰는 Phosphor 아이콘 목록 (카테고리별 그룹)
const PH_ICONS = [
  'ph:heart','ph:star','ph:check-circle','ph:map-pin','ph:calendar',
  'ph:camera','ph:gift','ph:flag','ph:crown','ph:trophy',
  // 의료
  'ph:first-aid-kit','ph:stethoscope','ph:syringe','ph:pill','ph:tooth',
  'ph:heartbeat','ph:bandaids','ph:thermometer','ph:eye','ph:eyeglasses',
  'ph:drop','ph:flask','ph:mask-happy','ph:shield-check','ph:leaf',
  'ph:scissors','ph:barbell','ph:sun','ph:bone','ph:sparkle',
  // 음식
  'ph:fork-knife','ph:bowl-food','ph:coffee','ph:beer-stein','ph:wine',
  'ph:chicken','ph:fish','ph:cake','ph:ice-cream','ph:pepper',
  'ph:flame','ph:storefront','ph:cookie','ph:bread',
  // 쇼핑/생활
  'ph:shopping-bag','ph:shopping-cart','ph:package','ph:t-shirt',
  'ph:diamond','ph:sunglasses','ph:books','ph:plant','ph:moon',
  // 행정/금융
  'ph:identification-card','ph:book-open','ph:bank','ph:device-mobile',
  'ph:car','ph:currency-krw','ph:chart-bar','ph:shield','ph:files',
  'ph:globe','ph:seal','ph:chart-line-up',
  // 사람/커뮤니티
  'ph:users','ph:users-three','ph:house','ph:house-line','ph:graduation-cap',
  'ph:hands-praying','ph:hand','ph:person-simple',
  // 육아
  'ph:baby','ph:lego','ph:smiley','ph:ticket',
  // 장소/관광
  'ph:buildings','ph:tree','ph:waves','ph:palette','ph:music-note',
  'ph:building','ph:binoculars','ph:mountain','ph:tree-evergreen',
  'ph:microphone','ph:monitor','ph:baseball','ph:dress',
  // 일정
  'ph:airplane','ph:airplane-takeoff','ph:train','ph:bus',
  'ph:clock','ph:alarm','ph:pencil-simple','ph:note',
]

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = search ? PH_ICONS.filter(i => i.includes(search)) : PH_ICONS
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width:44, height:38, border:'1.5px solid #e0e0e0', borderRadius:9,
        background:'#fafafa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon icon={value || 'ph:star'} width={20} height={20} color="#1E4D83" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:700 }}/>
          <div style={{
            position:'absolute', top:44, left:0, zIndex:701,
            background:'#fff', borderRadius:12, padding:12,
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
            width:260, maxHeight:300, overflowY:'auto',
          }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="아이콘 검색 (예: heart, food...)"
              style={{ ...inputStyle, marginBottom:10, fontSize:12, padding:'6px 10px' }}
              autoFocus
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {filtered.map(ic => (
                <button key={ic} type="button" onClick={() => { onChange(ic); setOpen(false); setSearch('') }}
                  title={ic.replace('ph:','')}
                  style={{
                    width:32, height:32, border: value===ic ? '2px solid #1E4D83' : '1px solid #eee',
                    borderRadius:6, background: value===ic ? '#eef2fb' : '#fafafa',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                  }}>
                  <Icon icon={ic} width={16} height={16} color={value===ic ? '#1E4D83' : '#555'} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ItemsTab({ cats, items, setItems, iconMap, setIconMap }: {
  cats: Cat[]
  items: Item[]; setItems: (f: (p: Item[]) => Item[]) => void
  iconMap: Record<string,string>; setIconMap: (f: (p: Record<string,string>) => Record<string,string>) => void
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? '')
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon]   = useState('ph:star')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const catItems = items.filter(i => i.categoryId === selCat)
  const isLocked = selCat === 'custom'
  const cat = cats.find(c => c.id === selCat)

  // CAT_ICON_MAP 기본 아이콘
  const CAT_DEFAULT: Record<string,string> = {
    hospital:'ph:first-aid-kit', food:'ph:fork-knife', shopping:'ph:shopping-bag',
    admin:'ph:files', people:'ph:users', parenting:'ph:baby', places:'ph:map-pin',
    schedule:'ph:calendar', custom:'ph:star',
  }

  function addItem() {
    if (!newLabel.trim()) return
    const id = 'i_' + Date.now()
    const icon = newIcon || CAT_DEFAULT[selCat] || 'ph:star'
    setItems(prev => [...prev, { id, categoryId:selCat, label:newLabel.trim(), emoji:'⭐' }])
    setIconMap(prev => ({ ...prev, [id]: icon }))
    setNewLabel(''); setNewIcon(CAT_DEFAULT[selCat] || 'ph:star')
    showToast('항목 추가됨: ' + newLabel)
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setIconMap(prev => { const n = {...prev}; delete n[id]; return n })
    showToast('항목 삭제됨')
  }

  function updateItem(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i))
  }

  function updateIcon(id: string, icon: string) {
    setIconMap(prev => ({ ...prev, [id]: icon }))
  }

  function moveItem(id: string, dir: number) {
    const catIs = items.filter(i => i.categoryId === selCat)
    const localIdx = catIs.findIndex(i => i.id === id)
    const newIdx = localIdx + dir
    if (newIdx < 0 || newIdx >= catIs.length) return
    const allItems = [...items]
    const a = allItems.findIndex(i => i.id === catIs[localIdx].id)
    const b = allItems.findIndex(i => i.id === catIs[newIdx].id)
    ;[allItems[a], allItems[b]] = [allItems[b], allItems[a]]
    setItems(allItems)
  }

  // ExportTab과 state 공유 (props로 처리)

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>카테고리 선택</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => { setSelCat(c.id); setNewIcon(CAT_DEFAULT[c.id] || 'ph:star') }} style={{
              padding:'6px 14px', borderRadius:8, border:'1.5px solid',
              borderColor: selCat===c.id ? '#1E4D83' : '#ddd',
              background: selCat===c.id ? '#1E4D83' : '#fff',
              color: selCat===c.id ? '#fff' : '#666',
              fontSize:13, fontWeight:700, cursor:'pointer',
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionTitle style={{ margin:0 }}>{cat?.emoji} {cat?.label} 항목 ({catItems.length})</SectionTitle>
        </div>

        {!isLocked && (
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <IconPicker value={newIcon} onChange={setNewIcon} />
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="새 항목 이름" style={{ ...inputStyle, flex:1, minWidth:0 }} />
            <button onClick={addItem} style={btnPrimary}>추가</button>
          </div>
        )}

        {isLocked ? (
          <p style={{ color:'#aaa', fontSize:13 }}>🔒 직접입력 카테고리는 앱에서 사용자가 직접 추가합니다.</p>
        ) : catItems.length === 0 ? (
          <p style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'20px 0' }}>항목이 없어요. 위에서 추가해보세요!</p>
        ) : (
          <div>
            {catItems.map((item, localIdx) => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #f3f3f3' }}>
                <IconPicker value={iconMap[item.id] || CAT_DEFAULT[selCat] || 'ph:star'} onChange={v => updateIcon(item.id, v)} />
                <input value={item.label} onChange={e=>updateItem(item.id,'label',e.target.value)} style={{ flex:1, fontSize:13, border:'none', background:'transparent', color:'#444' }} />
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => moveItem(item.id,-1)} disabled={localIdx===0} style={{ ...btnSmGhost, opacity:localIdx===0?0.3:1 }}>↑</button>
                  <button onClick={() => moveItem(item.id, 1)} disabled={localIdx===catItems.length-1} style={{ ...btnSmGhost, opacity:localIdx===catItems.length-1?0.3:1 }}>↓</button>
                  <button onClick={() => deleteItem(item.id)} style={{ ...btnSmDanger }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 4: 코드 내보내기
// ════════════════════════════════════════════
function ExportTab({ cats, items, iconMap }: {
  cats: Cat[]; items: Item[]; iconMap: Record<string,string>
}) {
  const [code, setCode]   = useState('')
  const [copied, setCopied] = useState(false)

  function generate() {
    const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    // custom 항상 맨 마지막 정렬
    const sortedCats = [...cats.filter(c => c.id !== 'custom'), ...cats.filter(c => c.id === 'custom')]
    let out = `export type Category = { id: string; label: string; receiptLabel: string; emoji: string }\n`
    out += `export type CheckItem = { id: string; categoryId: string; label: string; emoji: string }\n\n`
    out += `export const CATEGORIES: Category[] = [\n`
    sortedCats.forEach((c: Cat) => { out += `  { id:'${esc(c.id)}', label:'${esc(c.label)}', receiptLabel:'${esc(c.receiptLabel)}', emoji:'${c.emoji}' },\n` })
    out += `]\n\nexport const ITEMS: CheckItem[] = [`
    let lastCat = ''
    items.forEach((item: Item) => {
      const cat = sortedCats.find((c: Cat) => c.id === item.categoryId)
      if (cat && cat.id !== lastCat) { out += `\n\n  // ${cat.label}\n`; lastCat = cat.id }
      out += `  { id:'${esc(item.id)}', categoryId:'${esc(item.categoryId)}', label:'${esc(item.label)}', emoji:'${item.emoji}' },\n`
    })
    out += `]\n\n`
    // ITEM_ICONS 내보내기
    out += `// 아이템별 Phosphor 아이콘 맵 — ChecklistPage.tsx 와 BucketCheckView.tsx 의 ITEM_ICONS 를 이 내용으로 교체하세요\n`
    out += `export const ITEM_ICONS: Record<string, string> = {\n`
    Object.entries(iconMap).forEach(([k, v]) => { out += `  ${k}:'${v}',\n` })
    out += `}\n`
    setCode(out)
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <SectionTitle>사용 방법</SectionTitle>
      {[
        '"코드 생성" 버튼을 클릭하세요',
        '"전체 복사" 버튼으로 코드를 클립보드에 복사하세요',
        'src/data/checklist.ts 파일 전체 내용을 붙여넣으세요',
        'npm run build 후 배포하면 모든 사용자에게 반영됩니다',
      ].map((step, i) => (
        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'#1E4D83', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
          <span style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>{step}</span>
        </div>
      ))}

      <div style={{ display:'flex', gap:10, margin:'16px 0' }}>
        <button onClick={generate} style={btnPrimary}>⚡ 코드 생성</button>
        <button onClick={copy} disabled={!code} style={{ ...btnGhost, opacity:code?1:0.4 }}>{copied ? '✅ 복사됨!' : '📋 전체 복사'}</button>
      </div>
      <textarea
        value={code} readOnly
        placeholder="'코드 생성' 버튼을 눌러주세요..."
        style={{ width:'100%', minHeight:320, padding:14, border:'1.5px solid #e0e0e0', borderRadius:10, fontFamily:'monospace', fontSize:12, color:'#333', background:'#fafafa', resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}
      />
    </Card>
  )
}

// ════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'#fff', borderRadius:14, padding:20, marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>{children}</div>
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize:13, fontWeight:800, color:'#444', marginBottom:14, letterSpacing:0.5, ...style }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:10 }}><div style={{ fontSize:12, fontWeight:800, color:'#1E4D83', marginBottom:4 }}>{label}</div>{children}</div>
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{children}</div>
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:'#222', color:'#fff', padding:'10px 22px', borderRadius:99, fontSize:13, fontWeight:600, zIndex:999 }}>{msg}</div>
}

function Confirm({ msg, onOk, onCancel, danger }: { msg: string; onOk: ()=>void; onCancel: ()=>void; danger?: boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:600 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:'24px 20px', zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize:14, fontWeight:800, marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>취소</button>
          <button onClick={onOk} style={{ flex:2, padding:'11px', border:'none', borderRadius:10, background: danger?'#e8420a':'#1E4D83', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>삭제</button>
        </div>
      </div>
    </>
  )
}

// ── 공통 스타일
const inputStyle: React.CSSProperties = {
  width:'100%', minWidth:0, padding:'9px 12px', border:'1.5px solid #e0e0e0', borderRadius:9,
  fontSize:14, color:'#333', outline:'none', boxSizing:'border-box',
  fontFamily:'inherit', display:'block',
}

const btnPrimary: React.CSSProperties = {
  padding:'9px 18px', borderRadius:9, border:'none', background:'#1E4D83', color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
}

const btnGhost: React.CSSProperties = {
  padding:'9px 16px', borderRadius:9, border:'1.5px solid #e0e0e0', background:'#fff', color:'#666',
  fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
}

const btnSmGhost: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'1.5px solid #e0e0e0', background:'#f4f5f8', color:'#666',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const btnSmDanger: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'none', background:'#fee2e2', color:'#e05252',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const checkLabel: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1E4D83', cursor:'pointer',
}

// ════════════════════════════════════════════
// TAB: 업체 등록 신청 목록
// ════════════════════════════════════════════
type RequestStatus = 'pending' | 'approved' | 'rejected'
type BusinessRequest = {
  id: string
  business_name: string
  address: string
  description: string
  hashtags: string[]
  phone: string | null
  kakao: string | null
  website: string | null
  status: RequestStatus
  created_at: string
}

function RequestsTab() {
  const [requests, setRequests] = useState<BusinessRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<RequestStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase
      .from('business_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests((data as BusinessRequest[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const { supabase } = await import('../lib/supabase')
    await supabase.from('business_requests').update({ status }).eq('id', id)
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))

    // 승인 시 businesses 테이블에 자동 등록
    if (status === 'approved') {
      const req = requests.find(r => r.id === id)
      if (req) {
        const suburb = req.address.split(',').slice(-2, -1)[0]?.trim() || ''
        const { error } = await (await import('../lib/supabase')).supabase
          .from('businesses')
          .insert({
            id:          crypto.randomUUID(),
            name:        req.business_name,
            category:    req.category || 'restaurant',
            description: req.description,
            phone:       req.phone    || null,
            website:     req.website  || null,
            kakao:       req.kakao    || null,
            address:     req.address,
            city:        suburb,
            tags:        req.hashtags,
            is_featured: false,
            is_active:   true,
          })
        if (error) {
          alert(`승인됐지만 업체 등록 중 오류가 발생했어요:\n${error.message}`)
        } else {
          alert(`✅ "${req.business_name}" 업체가 등록됐어요!`)
        }
      }
    }
  }

  async function deleteRequest(id: string) {
    if (!window.confirm('이 신청을 삭제할까요?')) return
    const { supabase } = await import('../lib/supabase')
    await supabase.from('business_requests').delete().eq('id', id)
    setRequests(rs => rs.filter(r => r.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const statusColor: Record<RequestStatus, string> = {
    pending:  '#FFCD00',
    approved: '#16A34A',
    rejected: '#EF4444',
  }
  const statusLabel: Record<RequestStatus, string> = {
    pending:  '대기중',
    approved: '승인됨',
    rejected: '거절됨',
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D' }}>업체 등록 신청</div>
        <button onClick={loadRequests} style={{ ...btnSmGhost }}>새로고침 ↻</button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {(['all','pending','approved','rejected'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            height:32, padding:'0 12px', borderRadius:8, border:'none',
            background: filter===s ? '#1E4D83' : '#fff',
            color: filter===s ? '#fff' : '#64748B',
            fontSize:12, fontWeight:700, cursor:'pointer',
            boxShadow: filter===s ? '0 2px 8px rgba(30,77,131,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            {s === 'all' ? '전체' : statusLabel[s]} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>신청 내역이 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(req => (
            <div key={req.id} style={{
              background:'#fff', borderRadius:12, overflow:'hidden',
              boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
            }}>
              {/* 헤더 */}
              <div
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}
              >
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#1E293B' }}>{req.business_name}</span>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background: statusColor[req.status] + '22',
                      color: statusColor[req.status] === '#FFCD00' ? '#92620a' : statusColor[req.status],
                    }}>{statusLabel[req.status]}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>
                    {new Date(req.created_at).toLocaleDateString('ko-KR')} · {req.address}
                  </div>
                </div>
                <span style={{ color:'#94A3B8', fontSize:14 }}>{expanded === req.id ? '▲' : '▼'}</span>
              </div>

              {/* 상세 */}
              {expanded === req.id && (
                <div style={{ borderTop:'1px solid #F1F5F9', padding:'14px 16px', background:'#FAFAFA' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    <Row label="주소"    value={req.address} />
                    <Row label="설명"    value={req.description} />
                    <Row label="해시태그" value={req.hashtags.map(t => `#${t}`).join(' ')} />
                    {req.phone   && <Row label="전화번호"   value={req.phone} />}
                    {req.kakao   && <Row label="카카오채팅" value={req.kakao} link />}
                    {req.website && <Row label="웹사이트"   value={req.website} link />}
                  </div>
                  {/* 액션 버튼 */}
                  <div style={{ display:'flex', gap:8 }}>
                    {req.status !== 'approved' && (
                      <button onClick={() => updateStatus(req.id, 'approved')} style={{
                        flex:1, height:38, border:'none', borderRadius:8,
                        background:'#16A34A', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✓ 승인</button>
                    )}
                    {req.status !== 'rejected' && (
                      <button onClick={() => updateStatus(req.id, 'rejected')} style={{
                        flex:1, height:38, border:'none', borderRadius:8,
                        background:'#FEE2E2', color:'#EF4444', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✕ 거절</button>
                    )}
                    {req.status !== 'pending' && (
                      <button onClick={() => updateStatus(req.id, 'pending')} style={{
                        ...btnSmGhost, flex:1, height:38, borderRadius:8, fontSize:13,
                      }}>대기로 되돌리기</button>
                    )}
                    <button onClick={() => deleteRequest(req.id)} style={{
                      width:38, height:38, border:'none', borderRadius:8,
                      background:'#FEE2E2', color:'#EF4444', fontSize:16, cursor:'pointer', flexShrink:0,
                    }}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'70px 1fr', gap:8, alignItems:'start' }}>
      <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8', paddingTop:1 }}>{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#1E4D83', fontWeight:600, wordBreak:'break-all' }}>{value}</a>
      ) : (
        <span style={{ fontSize:12, color:'#1E293B', fontWeight:500, lineHeight:1.5, wordBreak:'break-all' }}>{value}</span>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// TAB: 버킷리스트 추천 목록
// ════════════════════════════════════════════
type Suggestion = {
  id: string
  suggestion: string
  email: string | null
  status: string
  created_at: string
}

function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { loadSuggestions() }, [])

  async function loadSuggestions() {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase
      .from('item_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
    setSuggestions((data as Suggestion[]) ?? [])
    setLoading(false)
  }

  async function deleteSuggestion(id: string) {
    if (!window.confirm('이 추천을 삭제할까요?')) return
    const { supabase } = await import('../lib/supabase')
    await supabase.from('item_suggestions').delete().eq('id', id)
    setSuggestions(s => s.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D' }}>버킷리스트 추천</div>
          <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>검토 후 체크리스트에 직접 추가해주세요</div>
        </div>
        <button onClick={loadSuggestions} style={{ ...btnSmGhost }}>새로고침 ↻</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
      ) : suggestions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>추천 내역이 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              background:'#fff', borderRadius:12, padding:'16px',
              boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  {/* 추천 내용 */}
                  <div style={{ fontSize:14, fontWeight:600, color:'#1E293B', lineHeight:1.6, marginBottom:8 }}>
                    💡 {s.suggestion}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {s.email && (
                      <div style={{ fontSize:12, color:'#64748B', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ color:'#94A3B8' }}>📧</span> {s.email}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#94A3B8' }}>
                      {new Date(s.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                  </div>
                </div>
                {/* 삭제 버튼 */}
                <button onClick={() => deleteSuggestion(s.id)} style={{
                  width:36, height:36, border:'none', borderRadius:8, flexShrink:0,
                  background:'#FEE2E2', color:'#EF4444', fontSize:16, cursor:'pointer',
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
