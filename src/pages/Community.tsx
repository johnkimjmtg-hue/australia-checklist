import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

// ── 타입
type Post = {
  id: string
  category: string
  title: string
  content: string
  nickname: string
  views: number
  created_at: string
  comment_count?: number
}

type Comment = {
  id: string
  post_id: string
  content: string
  nickname: string
  created_at: string
}

type Screen = 'list' | 'detail' | 'write'

// ── 상수
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
const BLUE = '#1B6EF3'
const BG = '#F4F6F8'

const CATEGORIES = [
  { id: 'all',      label: '전체',       color: '#1B6EF3' },
  { id: 'tip',      label: '호주꿀팁',   color: '#FFB800' },
  { id: 'question', label: '질문있어요', color: '#EA580C' },
  { id: 'job',      label: '구인구직',   color: '#16A34A' },
  { id: 'free',     label: '자유',       color: '#94A3B8' },
]

const CAT_COLOR: Record<string, string> = {
  tip: '#FFB800', question: '#EA580C', job: '#16A34A', free: '#94A3B8', all: '#1B6EF3'
}

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// ══════════════════════════════════════════
// 메인
// ══════════════════════════════════════════
export default function Community() {
  const [screen, setScreen]         = useState<Screen>('list')
  const [selCat, setSelCat]         = useState('all')
  const [posts, setPosts]           = useState<Post[]>([])
  const [loading, setLoading]       = useState(true)
  const [activePost, setActivePost] = useState<Post | null>(null)

  useEffect(() => { loadPosts() }, [selCat])

  async function loadPosts() {
    setLoading(true)
    let q = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (selCat !== 'all') q = q.eq('category', selCat)
    const { data } = await q
    setPosts((data as Post[]) ?? [])
    setLoading(false)
  }

  function openPost(post: Post) {
    setActivePost(post)
    setScreen('detail')
    supabase.from('posts').update({ views: post.views + 1 }).eq('id', post.id).then(() => {})
  }

  if (screen === 'write') {
    return <WriteScreen onBack={() => setScreen('list')} onDone={() => { setScreen('list'); loadPosts() }} />
  }

  if (screen === 'detail' && activePost) {
    return <DetailScreen post={activePost} onBack={() => { setScreen('list'); loadPosts() }} />
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: ff }}>

      {/* ── 카테고리 탭 고정 헤더 */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E8ECF0',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex' }}>
          {CATEGORIES.map(cat => {
            const active = selCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelCat(cat.id)}
                style={{
                  flex: 1, height: 46, border: 'none', background: 'transparent',
                  fontSize: 13, fontWeight: active ? 800 : 500, fontFamily: ff,
                  color: active ? cat.color : '#94A3B8',
                  borderBottom: active ? `2.5px solid ${cat.color}` : '2.5px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 게시글 목록 */}
      <div style={{ background: '#fff' }}>
        {loading ? (
          <LoadingSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState onWrite={() => setScreen('write')} />
        ) : (
          posts.map((post, i) => (
            <PostRow key={post.id} post={post} onClick={() => openPost(post)} isLast={i === posts.length - 1} />
          ))
        )}
      </div>

      {/* ── 글쓰기 FAB */}
      <button
        onClick={() => setScreen('write')}
        style={{
          position: 'fixed', bottom: 24, right: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 20px', borderRadius: 24, border: 'none',
          background: BLUE, color: '#fff', cursor: 'pointer',
          fontSize: 14, fontWeight: 700, fontFamily: ff,
          boxShadow: '0 4px 16px rgba(27,110,243,0.35)',
          zIndex: 50,
        }}
      >
        <Icon icon="ph:pencil-simple" width={16} height={16} color="#fff" />
        글쓰기
      </button>
    </div>
  )
}

// ══════════════════════════════════════════
// 게시글 행
// ══════════════════════════════════════════
function PostRow({ post, onClick, isLast }: { post: Post; onClick: () => void; isLast: boolean }) {
  const color = CAT_COLOR[post.category] || '#94A3B8'

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderBottom: isLast ? 'none' : '1px solid #F1F4F7',
        padding: '14px 18px',
        cursor: 'pointer',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      {/* 카테고리 컬러 바 */}
      <div style={{
        width: 3, borderRadius: 4, flexShrink: 0,
        background: color, alignSelf: 'stretch', minHeight: 44,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 카테고리 뱃지 + 시간 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color,
            background: `${color}18`, padding: '2px 8px', borderRadius: 20,
          }}>{getCat(post.category).label}</span>
          <span style={{ fontSize: 11, color: '#B0BAC5' }}>{timeAgo(post.created_at)}</span>
        </div>

        {/* 제목 */}
        <div style={{
          fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 5, lineHeight: 1.4,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {post.title}
        </div>

        {/* 내용 미리보기 */}
        <div style={{
          fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 8,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {post.content}
        </div>

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{post.nickname}</span>
          <span style={{ fontSize: 11, color: '#B0BAC5', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon icon="ph:eye" width={11} height={11} /> {post.views}
          </span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// 상세 화면
// ══════════════════════════════════════════
function DetailScreen({ post, onBack }: { post: Post; onBack: () => void }) {
  const [comments, setComments]     = useState<Comment[]>([])
  const [loading, setLoading]       = useState(true)
  const [text, setText]             = useState('')
  const [nick, setNick]             = useState(() => localStorage.getItem('community-nick') || '')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const color = CAT_COLOR[post.category] || '#94A3B8'

  useEffect(() => { loadComments() }, [])

  async function loadComments() {
    const { data } = await supabase
      .from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
    setLoading(false)
  }

  async function submitComment() {
    if (!text.trim() || !nick.trim()) return
    setSubmitting(true)
    localStorage.setItem('community-nick', nick)
    await supabase.from('comments').insert({ post_id: post.id, content: text.trim(), nickname: nick.trim() })
    setText('')
    await loadComments()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: ff, paddingBottom: 90 }}>

      {/* 헤더 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8ECF0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, height: 50, padding: '0 4px',
      }}>
        <button onClick={onBack} style={{
          width: 44, height: 44, border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon icon="ph:arrow-left" width={20} height={20} color="#475569" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A202C' }}>
          {getCat(post.category).label}
        </span>
        <div style={{ width: 44 }} />
      </div>

      {/* 본문 */}
      <div style={{ background: '#fff', marginBottom: 8 }}>
        <div style={{ padding: '18px 18px 0' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color,
            background: `${color}18`, padding: '3px 9px', borderRadius: 20,
          }}>{getCat(post.category).label}</span>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A202C', marginTop: 10, lineHeight: 1.4 }}>
            {post.title}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderBottom: '1px solid #F1F4F7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon icon="ph:user" width={15} height={15} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{post.nickname}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(post.created_at)}</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#B0BAC5', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon icon="ph:eye" width={11} height={11} /> {post.views}
          </span>
        </div>

        <div style={{ padding: '16px 18px 20px', fontSize: 14, color: '#334155', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>
      </div>

      {/* 댓글 */}
      <div style={{ background: '#fff' }}>
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid #F1F4F7',
          fontSize: 13, fontWeight: 800, color: '#475569',
        }}>
          댓글 {comments.length}
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#CBD5E1', fontSize: 13 }}>
            첫 댓글을 남겨보세요 💬
          </div>
        ) : (
          comments.map((c, i) => (
            <div key={c.id} style={{
              padding: '14px 18px',
              borderBottom: i < comments.length - 1 ? '1px solid #F1F4F7' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{c.nickname}</span>
                <span style={{ fontSize: 11, color: '#B0BAC5' }}>{timeAgo(c.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{c.content}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 댓글 입력 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: '#fff', borderTop: '1px solid #E8ECF0',
        padding: '10px 14px 28px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={nick} onChange={e => setNick(e.target.value)}
            placeholder="닉네임"
            style={{
              width: 80, flexShrink: 0, padding: '10px',
              border: '1.5px solid #E2E8F0', borderRadius: 10,
              fontSize: 13, fontFamily: ff, outline: 'none', color: '#1E293B',
            }}
          />
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="댓글을 입력하세요"
            style={{
              flex: 1, padding: '10px 12px',
              border: '1.5px solid #E2E8F0', borderRadius: 10,
              fontSize: 13, fontFamily: ff, outline: 'none', color: '#1E293B',
            }}
          />
          <button onClick={submitComment} disabled={submitting || !text.trim() || !nick.trim()} style={{
            width: 42, height: 42, borderRadius: 10, border: 'none', flexShrink: 0,
            background: text.trim() && nick.trim() ? BLUE : '#E8ECF0',
            cursor: text.trim() && nick.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            <Icon icon="ph:paper-plane-right" width={18} height={18} color={text.trim() && nick.trim() ? '#fff' : '#94A3B8'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// 글쓰기 화면
// ══════════════════════════════════════════
function WriteScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [category, setCategory]     = useState('free')
  const [title, setTitle]           = useState('')
  const [content, setContent]       = useState('')
  const [nick, setNick]             = useState(() => localStorage.getItem('community-nick') || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const writeCats = CATEGORIES.filter(c => c.id !== 'all')

  async function submit() {
    if (!title.trim())   { setError('제목을 입력해주세요'); return }
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    if (!nick.trim())    { setError('닉네임을 입력해주세요'); return }
    setSubmitting(true)
    localStorage.setItem('community-nick', nick)
    const { error: err } = await supabase.from('posts').insert({
      category, title: title.trim(), content: content.trim(), nickname: nick.trim(), views: 0,
    })
    if (err) { setError('등록 중 오류가 발생했어요'); setSubmitting(false); return }
    onDone()
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: ff }}>

      {/* 헤더 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8ECF0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, height: 50, padding: '0 4px',
      }}>
        <button onClick={onBack} style={{
          width: 44, height: 44, border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon icon="ph:x" width={20} height={20} color="#475569" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A202C' }}>새 글 작성</span>
        <button onClick={submit} disabled={submitting} style={{
          marginRight: 10, padding: '7px 18px', borderRadius: 10, border: 'none',
          background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: ff,
        }}>
          {submitting ? '등록 중' : '등록'}
        </button>
      </div>

      {/* 통합 입력 카드 */}
      <div style={{ background: '#fff', marginTop: 8 }}>

        {/* 카테고리 */}
        <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid #F1F4F7' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>게시판 선택</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {writeCats.map(cat => {
              const active = category === cat.id
              return (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: active ? '#F1F5F9' : 'transparent',
                  color: active ? cat.color : '#94A3B8',
                  fontSize: 13, fontWeight: active ? 800 : 500,
                  cursor: 'pointer', fontFamily: ff, transition: 'all 0.15s',
                }}>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 제목 */}
        <div style={{ borderBottom: '1px solid #F1F4F7' }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="제목"
            style={{
              width: '100%', padding: '16px 18px', border: 'none', outline: 'none',
              fontSize: 16, fontWeight: 700, fontFamily: ff, color: '#1A202C',
              boxSizing: 'border-box', background: 'transparent',
            }}
          />
        </div>

        {/* 본문 */}
        <div style={{ borderBottom: '1px solid #F1F4F7' }}>
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={12}
            style={{
              width: '100%', padding: '16px 18px', border: 'none', outline: 'none',
              resize: 'none', fontSize: 14, fontFamily: ff, color: '#334155',
              lineHeight: 1.8, boxSizing: 'border-box', background: 'transparent',
            }}
          />
        </div>

        {/* 닉네임 */}
        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon icon="ph:user-circle" width={18} height={18} color="#94A3B8" />
          <input
            value={nick} onChange={e => setNick(e.target.value)}
            placeholder="닉네임"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, fontFamily: ff, color: '#1E293B', background: 'transparent',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          margin: '8px 14px', padding: '11px 14px', borderRadius: 10,
          background: '#FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 700,
        }}>{error}</div>
      )}
    </div>
  )
}

// ── 로딩 스켈레톤
function LoadingSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid #F1F4F7', display: 'flex', gap: 12 }}>
          <div style={{ width: 3, borderRadius: 4, background: '#F1F4F7', alignSelf: 'stretch', minHeight: 60 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: 50, background: '#F1F4F7', borderRadius: 20, marginBottom: 10 }} />
            <div style={{ height: 14, width: '70%', background: '#E8ECF0', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 10, width: '90%', background: '#F1F4F7', borderRadius: 6, marginBottom: 4 }} />
            <div style={{ height: 10, width: '60%', background: '#F1F4F7', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 빈 상태
function EmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%', background: '#EFF6FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Icon icon="ph:chat-circle-dots" width={28} height={28} color={BLUE} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>아직 게시글이 없어요</div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>첫 번째 글을 남겨보세요!</div>
      <button onClick={onWrite} style={{
        padding: '11px 28px', borderRadius: 24, border: 'none',
        background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: ff,
      }}>글쓰기</button>
    </div>
  )
}
