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
const BG = '#E8EDF3'

const CATEGORIES = [
  { id: 'all',      label: '전체',      icon: 'ph:squares-four', color: '#64748B' },
  { id: 'tip',      label: '호주꿀팁',  icon: 'ph:star',         color: '#FFB800' },
  { id: 'question', label: '질문있어요',icon: 'ph:question',     color: '#EA580C' },
  { id: 'job',      label: '구인구직',  icon: 'ph:briefcase',    color: '#1B6EF3' },
  { id: 'free',     label: '자유',      icon: 'ph:chat-circle',  color: '#94A3B8' },
]

const CAT_COLOR: Record<string, string> = {
  tip: '#FFB800', question: '#EA580C', job: '#1B6EF3', free: '#94A3B8',
}

const CAT_BG: Record<string, string> = {
  tip: '#FFFBEB', question: '#FFF7ED', job: '#EFF6FF', free: '#F8FAFC',
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function getCatLabel(id: string) {
  return CATEGORIES.find(c => c.id === id)?.label ?? id
}

// ── 메인 컴포넌트
export default function Community() {
  const [screen, setScreen]   = useState<Screen>('list')
  const [selCat, setSelCat]   = useState('all')
  const [posts, setPosts]     = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activePost, setActivePost] = useState<Post | null>(null)

  useEffect(() => { loadPosts() }, [selCat])

  async function loadPosts() {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (selCat !== 'all') query = query.eq('category', selCat)
    const { data } = await query
    setPosts((data as Post[]) ?? [])
    setLoading(false)
  }

  function openPost(post: Post) {
    setActivePost(post)
    setScreen('detail')
    // 조회수 증가
    supabase.from('posts').update({ views: post.views + 1 }).eq('id', post.id).then(() => {})
  }

  if (screen === 'write') {
    return <WriteScreen onBack={() => setScreen('list')} onDone={() => { setScreen('list'); loadPosts() }} />
  }

  if (screen === 'detail' && activePost) {
    return <DetailScreen post={activePost} onBack={() => { setScreen('list'); loadPosts() }} />
  }

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:ff, paddingBottom:80 }}>
      {/* 카테고리 필터 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 14px' }}>
        <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
          {CATEGORIES.map(cat => {
            const active = selCat === cat.id
            return (
              <button key={cat.id} onClick={() => setSelCat(cat.id)} style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'7px 12px', borderRadius:20, border:'none', cursor:'pointer',
                background: active ? cat.color : '#F1F5F9',
                color: active ? '#fff' : '#64748B',
                fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0,
                transition:'all 0.15s',
              }}>
                <Icon icon={cat.icon} width={13} height={13} color={active ? '#fff' : cat.color} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div style={{ padding:'12px 14px' }}>
        {loading ? (
          <LoadingSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState onWrite={() => setScreen('write')} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onClick={() => openPost(post)} />
            ))}
          </div>
        )}
      </div>

      {/* 글쓰기 버튼 */}
      <button onClick={() => setScreen('write')} style={{
        position:'fixed', bottom:24, right:20,
        width:52, height:52, borderRadius:'50%', border:'none',
        background: BLUE, color:'#fff', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 16px rgba(27,110,243,0.4)',
        zIndex:50,
      }}>
        <Icon icon="ph:pencil-simple" width={22} height={22} color="#fff" />
      </button>
    </div>
  )
}

// ── 게시글 카드
function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const color = CAT_COLOR[post.category] || '#94A3B8'
  const bg = CAT_BG[post.category] || '#F8FAFC'
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:14,
      borderLeft:`4px solid ${color}`,
      padding:'14px 16px', cursor:'pointer',
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      border:`1px solid #F1F5F9`,
      borderLeftColor: color, borderLeftWidth: 4,
    }}>
      {/* 카테고리 + 시간 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{
          fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20,
          background: bg, color,
        }}>{getCatLabel(post.category)}</span>
        <span style={{ fontSize:11, color:'#94A3B8' }}>{timeAgo(post.created_at)}</span>
      </div>
      {/* 제목 */}
      <div style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:6, lineHeight:1.4 }}>
        {post.title}
      </div>
      {/* 내용 미리보기 */}
      <div style={{
        fontSize:13, color:'#64748B', lineHeight:1.6,
        overflow:'hidden', display:'-webkit-box',
        WebkitLineClamp:2, WebkitBoxOrient:'vertical',
        marginBottom:10,
      }}>
        {post.content}
      </div>
      {/* 푸터 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600 }}>
          <Icon icon="ph:user-circle" width={12} height={12} style={{ marginRight:3 }} />
          {post.nickname}
        </span>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ fontSize:11, color:'#94A3B8', display:'flex', alignItems:'center', gap:3 }}>
            <Icon icon="ph:eye" width={12} height={12} /> {post.views}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 상세 화면
function DetailScreen({ post, onBack }: { post: Post; onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [nick, setNick]         = useState(() => localStorage.getItem('community-nick') || '')
  const [submitting, setSubmitting] = useState(false)
  const color = CAT_COLOR[post.category] || '#94A3B8'
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadComments() }, [])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
    setLoading(false)
  }

  async function submitComment() {
    if (!text.trim() || !nick.trim()) return
    setSubmitting(true)
    localStorage.setItem('community-nick', nick)
    const { error } = await supabase.from('comments').insert({
      post_id: post.id, content: text.trim(), nickname: nick.trim(),
    })
    if (!error) {
      setText('')
      await loadComments()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:ff, paddingBottom:120 }}>
      {/* 헤더 */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #E8EDF3',
        padding:'14px 16px', display:'flex', alignItems:'center', gap:10,
        position:'sticky', top:0, zIndex:50,
      }}>
        <button onClick={onBack} style={{
          background:'#F1F5F9', border:'none', borderRadius:10, cursor:'pointer',
          width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon icon="ph:arrow-left" width={18} height={18} color="#475569" />
        </button>
        <span style={{ fontSize:14, fontWeight:800, color:'#0F172A', flex:1 }}>게시글</span>
        <span style={{
          fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
          background: CAT_BG[post.category] || '#F8FAFC', color,
        }}>{getCatLabel(post.category)}</span>
      </div>

      <div style={{ padding:'16px 14px' }}>
        {/* 게시글 본문 */}
        <div style={{
          background:'#fff', borderRadius:16, padding:'20px 18px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
          borderTop:`3px solid ${color}`, marginBottom:12,
        }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#0F172A', lineHeight:1.4, marginBottom:12 }}>
            {post.title}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:14, borderBottom:'1px solid #F1F5F9' }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background: `${color}22`, display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Icon icon="ph:user" width={16} height={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{post.nickname}</div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>{timeAgo(post.created_at)}</div>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, color:'#94A3B8', fontSize:11 }}>
              <Icon icon="ph:eye" width={12} height={12} /> {post.views}
            </div>
          </div>
          <div style={{ fontSize:14, color:'#334155', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
            {post.content}
          </div>
        </div>

        {/* 댓글 */}
        <div style={{ fontSize:13, fontWeight:800, color:'#64748B', marginBottom:10, paddingLeft:2 }}>
          댓글 {comments.length}개
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:20, color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'#CBD5E1', fontSize:13 }}>
            첫 댓글을 남겨보세요 💬
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {comments.map(c => (
              <div key={c.id} style={{
                background:'#fff', borderRadius:12, padding:'12px 14px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1E293B' }}>{c.nickname}</span>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{timeAgo(c.created_at)}</span>
                </div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.7 }}>{c.content}</div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 댓글 입력 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#fff', borderTop:'1px solid #E8EDF3',
        padding:'10px 14px 24px', zIndex:50,
      }}>
        <div style={{ display:'flex', gap:6, marginBottom:6 }}>
          <input
            value={nick} onChange={e => setNick(e.target.value)}
            placeholder="닉네임"
            style={{
              width:90, flexShrink:0, padding:'9px 10px', border:'1.5px solid #E2E8F0',
              borderRadius:10, fontSize:13, fontFamily:ff, outline:'none',
            }}
          />
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="댓글을 입력하세요"
            style={{
              flex:1, padding:'9px 12px', border:'1.5px solid #E2E8F0',
              borderRadius:10, fontSize:13, fontFamily:ff, outline:'none',
            }}
          />
          <button onClick={submitComment} disabled={submitting || !text.trim() || !nick.trim()} style={{
            width:40, height:40, borderRadius:10, border:'none',
            background: text.trim() && nick.trim() ? BLUE : '#E2E8F0',
            cursor: text.trim() && nick.trim() ? 'pointer' : 'default',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icon icon="ph:paper-plane-right" width={18} height={18} color={text.trim() && nick.trim() ? '#fff' : '#94A3B8'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 글쓰기 화면
function WriteScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [category, setCategory] = useState('free')
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [nick, setNick]         = useState(() => localStorage.getItem('community-nick') || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

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
    <div style={{ minHeight:'100vh', background:BG, fontFamily:ff, paddingBottom:40 }}>
      <div style={{ padding:'16px 14px' }}>

        {/* 제목 */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:12, fontWeight:800, color:BLUE, marginBottom:8 }}>제목</div>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={{
              width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0',
              borderRadius:10, fontSize:14, fontFamily:ff, outline:'none', boxSizing:'border-box',
            }}
          />
        </div>

        {/* 닉네임 */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:12, fontWeight:800, color:BLUE, marginBottom:8 }}>닉네임</div>
          <input
            value={nick} onChange={e => setNick(e.target.value)}
            placeholder="사용할 닉네임 입력"
            style={{
              width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0',
              borderRadius:10, fontSize:14, fontFamily:ff, outline:'none', boxSizing:'border-box',
            }}
          />
        </div>

        {/* 카테고리 */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:12, fontWeight:800, color:BLUE, marginBottom:10 }}>카테고리</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {writeCats.map(cat => {
              const active = category === cat.id
              return (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'7px 14px', borderRadius:20, border:`1.5px solid ${active ? cat.color : '#E2E8F0'}`,
                  background: active ? cat.color : '#fff',
                  color: active ? '#fff' : '#64748B',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                }}>
                  <Icon icon={cat.icon} width={13} height={13} color={active ? '#fff' : cat.color} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 내용 */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:12, fontWeight:800, color:BLUE, marginBottom:8 }}>내용</div>
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={8}
            style={{
              width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0',
              borderRadius:10, fontSize:14, fontFamily:ff, outline:'none',
              resize:'none', boxSizing:'border-box', lineHeight:1.7,
            }}
          />
        </div>

        {error && (
          <div style={{
            padding:'11px 14px', borderRadius:10, background:'#FEE2E2',
            color:'#DC2626', fontSize:13, fontWeight:700, marginBottom:10,
          }}>{error}</div>
        )}

        {/* 버튼 */}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button onClick={onBack} style={{
            flex:1, height:50, borderRadius:14, border:'1.5px solid #E2E8F0',
            background:'#fff', color:'#64748B', fontSize:15, fontWeight:700, cursor:'pointer',
          }}>취소</button>
          <button onClick={submit} disabled={submitting} style={{
            flex:2, height:50, borderRadius:14, border:'none',
            background:BLUE, color:'#fff', fontSize:15, fontWeight:700,
            cursor:'pointer', opacity: submitting ? 0.6 : 1,
          }}>{submitting ? '등록 중...' : '등록하기'}</button>
        </div>
      </div>
    </div>
  )
}

// ── 로딩 스켈레톤
function LoadingSkeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          background:'#fff', borderRadius:14, padding:'16px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.05)', opacity:0.7,
        }}>
          <div style={{ height:10, width:60, background:'#F1F5F9', borderRadius:6, marginBottom:12 }} />
          <div style={{ height:14, width:'70%', background:'#E2E8F0', borderRadius:6, marginBottom:8 }} />
          <div style={{ height:10, width:'90%', background:'#F1F5F9', borderRadius:6, marginBottom:4 }} />
          <div style={{ height:10, width:'60%', background:'#F1F5F9', borderRadius:6 }} />
        </div>
      ))}
    </div>
  )
}

// ── 빈 상태
function EmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{
        width:64, height:64, borderRadius:'50%', background:'#EFF6FF',
        display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 16px',
      }}>
        <Icon icon="ph:chat-circle-dots" width={32} height={32} color={BLUE} />
      </div>
      <div style={{ fontSize:15, fontWeight:800, color:'#1E293B', marginBottom:6 }}>아직 게시글이 없어요</div>
      <div style={{ fontSize:13, color:'#94A3B8', marginBottom:20 }}>첫 번째 글을 남겨보세요!</div>
      <button onClick={onWrite} style={{
        padding:'11px 24px', borderRadius:12, border:'none',
        background:BLUE, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>글쓰기</button>
    </div>
  )
}
