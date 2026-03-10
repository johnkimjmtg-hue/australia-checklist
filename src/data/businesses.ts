export type Business = {
  id: string
  name: string
  category: string
  description: string
  phone?: string
  website?: string
  kakao?: string
  address: string
  city: string
  rating: number
  reviews: number
  isFeatured: boolean
  tags: string[]
}

export const CATEGORIES = [
  { id: 'all',        label: '전체',          emoji: '🗂'  },
  { id: 'realestate', label: '부동산',         emoji: '🏠'  },
  { id: 'lawyer',     label: '변호사',         emoji: '⚖️' },
  { id: 'accounting', label: '회계·세무',      emoji: '🧾'  },
  { id: 'insurance',  label: '보험',           emoji: '🛡'  },
  { id: 'immigration',label: '이민·유학',      emoji: '🌏'  },
  { id: 'academy',    label: '학원',           emoji: '🏫'  },
  { id: 'telecom',    label: '통신',           emoji: '📱'  },
  { id: 'travel',     label: '여행·액티비티',  emoji: '✈️' },
  { id: 'hotel',      label: '호텔·숙박',      emoji: '🏨'  },
  { id: 'banking',    label: '은행·환전',      emoji: '💰'  },
  { id: 'gp',         label: '병원(GP)',       emoji: '🏥'  },
  { id: 'dental',     label: '치과',           emoji: '🦷'  },
  { id: 'oriental',   label: '한의사',         emoji: '🌿'  },
  { id: 'pharmacy',   label: '약국',           emoji: '💊'  },
  { id: 'restaurant', label: '식당',           emoji: '🍜'  },
  { id: 'cafe',       label: '카페·베이커리',  emoji: '☕'  },
  { id: 'mart',       label: '한국마트',       emoji: '🛒'  },
  { id: 'beauty',     label: '미용·네일',      emoji: '💇'  },
  { id: 'moving',     label: '이사·공항픽업',  emoji: '📦'  },
  { id: 'handyman',   label: '핸디맨',         emoji: '🔧'  },
  { id: 'construction', label: '건설·시공',      emoji: '🏗'  },
  { id: 'shopping',   label: '쇼핑',           emoji: '🛍'  },
  { id: 'culture',    label: '문화시설',       emoji: '🎨'  },
  { id: 'transport',  label: '교통',           emoji: '🚌'  },
  { id: 'etc',        label: '기타',           emoji: '📌'  },
]

export const BUSINESSES: Business[] = []
