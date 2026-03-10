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
  password?: string
  views: number
  created_at: string
}

type Comment = {
  id: string
  post_id: string
  content: string
  nickname: string
  password?: string
  created_at: string
}

type Screen = 'list' | 'detail' | 'write' | 'edit'

// ── 상수
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
const BLUE = '#1B6EF3'
const BG = '#F4F6F8'

const CATEGORIES = [
  { id: 'all',      label: '전체',       color: '#1B6EF3' },
  { id: 'tip',      label: '호주꿀팁',   color: '#FFB800' },
  { id: 'question', label: '질문있어요', color: '#EA580C' },
  { id: 'job',      label: '구인구직',   color: '#16A34A' },
  { id: 'free',     label: '자유',       color: '#64748B' },
]

const CAT_COLOR: Record<string, string> = {
  tip: '#FFB800', question: '#EA580C', job: '#16A34A', free: '#64748B', all: '#1B6EF3'
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

// ── 공통 인풋 스타일
const inputBase: React.CSSProperties = {
  width: '100%', border: 'none', outline: 'none',
  fontFamily: ff, background: 'transparent', boxSizing: 'border-box',
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

  if (screen === 'edit' && activePost) {
    return <WriteScreen
      onBack={() => setScreen('detail')}
      onDone={() => { setScreen('list'); loadPosts() }}
      editPost={activePost}
    />
  }

  if (screen === 'detail' && activePost) {
    return (
      <DetailScreen
        post={activePost}
        onBack={() => { setScreen('list'); loadPosts() }}
        onEdit={() => setScreen('edit')}
        onDeleted={() => { setScreen('list'); loadPosts() }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: ff }}>

      {/* 카테고리 탭 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex' }}>
          {CATEGORIES.map(cat => {
            const active = selCat === cat.id
            return (
              <button key={cat.id} onClick={() => setSelCat(cat.id)} style={{
                flex: 1, height: 46, border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: active ? 800 : 500, fontFamily: ff,
                color: active ? cat.color : '#94A3B8',
                borderBottom: active ? `2.5px solid ${cat.color}` : '2.5px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 목록 */}
      <div style={{ background: '#fff' }}>
        {loading ? <LoadingSkeleton /> : posts.length === 0 ? (
          <EmptyState onWrite={() => setScreen('write')} />
        ) : (
          posts.map((post, i) => (
            <PostRow key={post.id} post={post} onClick={() => openPost(post)} isLast={i === posts.length - 1} />
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setScreen('write')} style={{
        position: 'fixed', bottom: 24, right: 20,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '12px 18px', borderRadius: 12, border: 'none',
        background: BLUE, color: '#fff', cursor: 'pointer',
        fontSize: 14, fontWeight: 700, fontFamily: ff,
        boxShadow: '0 4px 16px rgba(27,110,243,0.35)', zIndex: 50,
      }}>
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
  const color = CAT_COLOR[post.category] || '#64748B'
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderBottom: isLast ? 'none' : '1px solid #F1F4F7',
      padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: 12,
    }}>
      <div style={{ width: 3, borderRadius: 4, flexShrink: 0, background: color, alignSelf: 'stretch', minHeight: 44 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 6 }}>
            {getCat(post.category).label}
          </span>
          <span style={{ fontSize: 11, color: '#B0BAC5' }}>{timeAgo(post.created_at)}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 5, lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {post.title}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {post.content}
        </div>
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
function DetailScreen({ post, onBack, onEdit, onDeleted }: {
  post: Post; onBack: () => void; onEdit: () => void; onDeleted: () => void
}) {
  const [comments, setComments]     = useState<Comment[]>([])
  const [loading, setLoading]       = useState(true)
  const [text, setText]             = useState('')
  const [nick, setNick]             = useState(() => localStorage.getItem('community-nick') || '')
  const [commentPw, setCommentPw]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [pwModal, setPwModal]       = useState<{ type: 'editPost' | 'deletePost' | 'deleteComment'; commentId?: string } | null>(null)
  const [pwInput, setPwInput]       = useState('')
  const [pwError, setPwError]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const color = CAT_COLOR[post.category] || '#64748B'

  useEffect(() => { loadComments() }, [])

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
    setLoading(false)
  }

  async function submitComment() {
    if (!text.trim() || !nick.trim()) return
    setSubmitting(true)
    localStorage.setItem('community-nick', nick)
    await supabase.from('comments').insert({
      post_id: post.id, content: text.trim(), nickname: nick.trim(),
      password: commentPw.trim() || null,
    })
    setText(''); setCommentPw('')
    await loadComments()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    setSubmitting(false)
  }

  async function confirmPw() {
    if (!pwModal) return
    if (pwModal.type === 'editPost') {
      if (pwInput !== post.password) { setPwError('비밀번호가 맞지 않아요'); return }
      setPwModal(null); setPwInput(''); setPwError('')
      onEdit()
    } else if (pwModal.type === 'deletePost') {
      if (pwInput !== post.password) { setPwError('비밀번호가 맞지 않아요'); return }
      await supabase.from('posts').delete().eq('id', post.id)
      setPwModal(null); onDeleted()
    } else if (pwModal.type === 'deleteComment' && pwModal.commentId) {
      const c = comments.find(c => c.id === pwModal.commentId)
      if (pwInput !== c?.password) { setPwError('비밀번호가 맞지 않아요'); return }
      await supabase.from('comments').delete().eq('id', pwModal.commentId)
      setPwModal(null); setPwInput(''); setPwError('')
      loadComments()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: ff, paddingBottom: 90 }}>

      {/* 헤더 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8ECF0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, height: 50, padding: '0 4px',
      }}>
        <button onClick={onBack} style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon="ph:arrow-left" width={20} height={20} color="#475569" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A202C' }}>{getCat(post.category).label}</span>
        <button onClick={() => setShowPostMenu(!showPostMenu)} style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Icon icon="ph:dots-three-vertical" width={20} height={20} color="#475569" />
          {showPostMenu && (
            <div style={{ position: 'absolute', top: 44, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 120, zIndex: 100 }}>
              <button onClick={() => { setShowPostMenu(false); setPwModal({ type: 'editPost' }); setPwInput(''); setPwError('') }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#1E293B', cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
                수정하기
              </button>
              <button onClick={() => { setShowPostMenu(false); setPwModal({ type: 'deletePost' }); setPwInput(''); setPwError('') }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#DC2626', cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
                삭제하기
              </button>
            </div>
          )}
        </button>
      </div>

      {/* 본문 */}
      <div style={{ background: '#fff', marginBottom: 8 }}>
        <div style={{ padding: '18px 18px 0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '3px 9px', borderRadius: 6 }}>
            {getCat(post.category).label}
          </span>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A202C', marginTop: 10, lineHeight: 1.4 }}>{post.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #F1F4F7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F1F4F7', fontSize: 13, fontWeight: 800, color: '#475569' }}>
          댓글 {comments.length}
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#CBD5E1', fontSize: 13 }}>첫 댓글을 남겨보세요 💬</div>
        ) : (
          comments.map((c, i) => (
            <div key={c.id} style={{ padding: '14px 18px', borderBottom: i < comments.length - 1 ? '1px solid #F1F4F7' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{c.nickname}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#B0BAC5' }}>{timeAgo(c.created_at)}</span>
                  {c.password && (
                    <button onClick={() => { setPwModal({ type: 'deleteComment', commentId: c.id }); setPwInput(''); setPwError('') }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}>
                      <Icon icon="ph:trash" width={13} height={13} color="#CBD5E1" />
                    </button>
                  )}
                </div>
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
        width: '100%', maxWidth: 430, background: '#fff', borderTop: '1px solid #E8ECF0',
        padding: '10px 14px 28px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={nick} onChange={e => setNick(e.target.value)} placeholder="닉네임"
            style={{ width: 76, flexShrink: 0, padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: ff, outline: 'none', color: '#1E293B' }} />
          <input value={commentPw} onChange={e => setCommentPw(e.target.value)} placeholder="비밀번호" type="password"
            style={{ width: 76, flexShrink: 0, padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: ff, outline: 'none', color: '#1E293B' }} />
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="댓글 입력"
            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: ff, outline: 'none', color: '#1E293B' }} />
          <button onClick={submitComment} disabled={submitting || !text.trim() || !nick.trim()} style={{
            width: 42, height: 42, borderRadius: 10, border: 'none', flexShrink: 0,
            background: text.trim() && nick.trim() ? BLUE : '#E8ECF0',
            cursor: text.trim() && nick.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon icon="ph:paper-plane-right" width={18} height={18} color={text.trim() && nick.trim() ? '#fff' : '#94A3B8'} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#B0BAC5', paddingLeft: 2 }}>비밀번호는 댓글 삭제 시 필요해요</div>
      </div>

      {/* 비밀번호 확인 모달 */}
      {pwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '0 24px' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', marginBottom: 6 }}>
              {pwModal.type === 'editPost' ? '게시글 수정' : pwModal.type === 'deletePost' ? '게시글 삭제' : '댓글 삭제'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>작성 시 입력한 비밀번호를 입력해주세요</div>
            <input value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && confirmPw()}
              type="password" placeholder="비밀번호"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: ff, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            {pwError && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8, fontWeight: 600 }}>{pwError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPwModal(null); setPwInput(''); setPwError('') }} style={{ flex: 1, height: 44, border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', color: '#64748B', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: ff }}>취소</button>
              <button onClick={confirmPw} style={{
                flex: 1, height: 44, border: 'none', borderRadius: 10,
                background: pwModal.type === 'deletePost' || pwModal.type === 'deleteComment' ? '#DC2626' : BLUE,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
              }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// 글쓰기 / 수정 화면
// ══════════════════════════════════════════
function WriteScreen({ onBack, onDone, editPost }: { onBack: () => void; onDone: () => void; editPost?: Post }) {
  const [category, setCategory]     = useState(editPost?.category ?? 'free')
  const [title, setTitle]           = useState(editPost?.title ?? '')
  const [content, setContent]       = useState(editPost?.content ?? '')
  const [nick, setNick]             = useState(editPost?.nickname ?? localStorage.getItem('community-nick') ?? '')
  const [password, setPassword]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const isEdit = !!editPost
  const writeCats = CATEGORIES.filter(c => c.id !== 'all')

  async function submit() {
    if (!title.trim())    { setError('제목을 입력해주세요'); return }
    if (!content.trim())  { setError('내용을 입력해주세요'); return }
    if (!nick.trim())     { setError('닉네임을 입력해주세요'); return }
    if (!isEdit && !password.trim()) { setError('비밀번호를 입력해주세요'); return }
    if (isEdit && password !== editPost?.password) { setError('비밀번호가 맞지 않아요'); return }

    setSubmitting(true)
    localStorage.setItem('community-nick', nick)

    if (isEdit) {
      await supabase.from('posts').update({ category, title: title.trim(), content: content.trim() }).eq('id', editPost!.id)
    } else {
      const { error: err } = await supabase.from('posts').insert({
        category, title: title.trim(), content: content.trim(),
        nickname: nick.trim(), password: password.trim(), views: 0,
      })
      if (err) { setError('등록 중 오류가 발생했어요'); setSubmitting(false); return }
    }
    onDone()
  }

  return (
    <div style={{ height: '100vh', background: '#fff', fontFamily: ff, display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8ECF0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, height: 50, padding: '0 4px',
      }}>
        <button onClick={onBack} style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon="ph:x" width={20} height={20} color="#475569" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A202C' }}>{isEdit ? '게시글 수정' : '새 글 작성'}</span>
        <button onClick={submit} disabled={submitting} style={{
          marginRight: 10, padding: '7px 18px', borderRadius: 10, border: 'none',
          background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: ff,
        }}>
          {submitting ? (isEdit ? '저장 중' : '등록 중') : (isEdit ? '저장' : '등록')}
        </button>
      </div>

      {/* 게시판 선택 */}
      <div style={{ borderBottom: '1px solid #F1F4F7', padding: '10px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>게시판 선택</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {writeCats.map(cat => {
            const active = category === cat.id
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
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

      {/* 닉네임 */}
      <div style={{ borderBottom: '1px solid #F1F4F7', padding: '0 18px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon="ph:user-circle" width={16} height={16} color="#94A3B8" />
        <input
          value={nick} onChange={e => setNick(e.target.value)}
          placeholder="닉네임"
          readOnly={isEdit}
          style={{ ...inputBase, padding: '12px 0', fontSize: 14, color: '#1E293B' }}
        />
        <div style={{ width: 1, height: 16, background: '#E2E8F0', flexShrink: 0 }} />
        <Icon icon="ph:lock-simple" width={16} height={16} color="#94A3B8" />
        <input
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder={isEdit ? '수정 비밀번호 확인' : '비밀번호'}
          type="password"
          style={{ ...inputBase, padding: '12px 0', fontSize: 14, color: '#1E293B', width: 'auto', flex: 1 }}
        />
      </div>

      {/* 제목 */}
      <div style={{ borderBottom: '1px solid #F1F4F7', flexShrink: 0 }}>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          style={{ ...inputBase, padding: '14px 18px', fontSize: 16, fontWeight: 700, color: '#1A202C' }}
        />
      </div>

      {/* 내용 — flex:1로 남은 공간 꽉 채움 */}
      <textarea
        value={content} onChange={e => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        style={{
          ...inputBase, flex: 1, padding: '14px 18px',
          resize: 'none', fontSize: 14, color: '#334155', lineHeight: 1.8,
          borderBottom: '1px solid #F1F4F7',
        }}
      />

      {/* 에러 */}
      {error && (
        <div style={{ padding: '10px 18px', background: '#FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {error}
        </div>
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
            <div style={{ height: 10, width: 50, background: '#F1F4F7', borderRadius: 6, marginBottom: 10 }} />
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
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon icon="ph:chat-circle-dots" width={28} height={28} color={BLUE} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>아직 게시글이 없어요</div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>첫 번째 글을 남겨보세요!</div>
      <button onClick={onWrite} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: ff }}>
        글쓰기
      </button>
    </div>
  )
}
