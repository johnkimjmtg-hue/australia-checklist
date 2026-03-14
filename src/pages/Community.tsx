import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'

interface Comment {
  id: string
  text: string
  createdAt: number
  authorId: string
}

interface Post {
  id: string
  text: string
  createdAt: number
  authorId: string
  likes: number
  comments: Comment[]
}

const SAMPLE_POSTS: Post[] = [
  {
    id: 'p1',
    text: '멜번 살면서 제일 좋은게 커피값이 저렴한거 같아요. 한국이랑 비슷한 가격에 퀄리티는 훨씬 나은듯 ☕',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    authorId: 'user_sample1',
    likes: 12,
    comments: [
      { id: 'c1', text: '진짜요!! 플랫화이트 4.5불에 이 퀄리티면 너무 좋죠', createdAt: Date.now() - 1000 * 60 * 60 * 2, authorId: 'user_sample2' },
      { id: 'c2', text: '근데 팁 문화 없는게 제일 좋아요 ㅎㅎ', createdAt: Date.now() - 1000 * 60 * 50, authorId: 'user_sample3' },
    ],
  },
  {
    id: 'p2',
    text: '시드니 본다이 비치 근처 카페 추천해주실 분 계세요? 이번 주말에 가려고요!',
    createdAt: Date.now() - 1000 * 60 * 60 * 1,
    authorId: 'user_sample4',
    likes: 5,
    comments: [
      { id: 'c3', text: 'Porch and Parlour 강추합니다! 뷰도 예쁘고 커피도 맛있어요 🌊', createdAt: Date.now() - 1000 * 60 * 40, authorId: 'user_sample5' },
    ],
  },
  {
    id: 'p3',
    text: '호주 와서 제일 힘든게 운전인데... 오른쪽 핸들 아직도 헷갈려요 😅 다들 얼마나 걸렸어요?',
    createdAt: Date.now() - 1000 * 60 * 20,
    authorId: 'user_sample6',
    likes: 24,
    comments: [],
  },
]

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function getMyId(): string {
  let id = localStorage.getItem('community-my-id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('community-my-id', id)
  }
  return id
}

function getLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('community-liked') ?? '[]')) }
  catch { return new Set() }
}

function saveLiked(liked: Set<string>) {
  localStorage.setItem('community-liked', JSON.stringify([...liked]))
}

export default function Community() {
  const MY_ID = getMyId()
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
  const [liked, setLiked] = useState<Set<string>>(getLiked)
  const [newText, setNewText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts.length])

  const handlePost = () => {
    const text = newText.trim()
    if (!text) return
    const post: Post = {
      id: 'p_' + Date.now(),
      text,
      createdAt: Date.now(),
      authorId: MY_ID,
      likes: 0,
      comments: [],
    }
    setPosts(prev => [...prev, post])
    setNewText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleLike = (postId: string) => {
    const key = `post_${postId}`
    const newLiked = new Set(liked)
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      if (newLiked.has(key)) {
        newLiked.delete(key)
        return { ...p, likes: Math.max(0, p.likes - 1) }
      } else {
        newLiked.add(key)
        return { ...p, likes: p.likes + 1 }
      }
    }))
    setLiked(newLiked)
    saveLiked(newLiked)
  }

  const handleComment = (postId: string) => {
    const text = (commentText[postId] ?? '').trim()
    if (!text) return
    const comment: Comment = {
      id: 'c_' + Date.now(),
      text,
      createdAt: Date.now(),
      authorId: MY_ID,
    }
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    ))
    setCommentText(prev => ({ ...prev, [postId]: '' }))
  }

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        : p
    ))
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#F0F4F8',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .community-textarea { resize:none; outline:none; border:none; background:transparent; font-family:inherit; }
        .community-textarea::placeholder { color:#CBD5E1; }
        .post-card { animation: fadeSlideUp 0.25s ease; }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .like-btn:active { transform: scale(1.3); }
        .like-btn { transition: transform 0.15s ease; }
      `}</style>

      {/* 피드 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 0' }}>
        {posts.map(post => {
          const isExpanded = expandedId === post.id
          const isLiked = liked.has(`post_${post.id}`)
          const isMine = post.authorId === MY_ID

          return (
            <div key={post.id} className="post-card" style={{ marginBottom: 10 }}>
              {/* 말풍선 카드 */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                position: 'relative',
              }}>
                {/* 내 글 삭제 버튼 */}
                {isMine && (
                  <button onClick={() => handleDelete(post.id)} style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  }}>
                    <Icon icon="ph:x" width={14} height={14} color="#CBD5E1" />
                  </button>
                )}

                {/* 본문 */}
                <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.65, marginBottom: 10, paddingRight: isMine ? 20 : 0 }}>
                  {post.text}
                </div>

                {/* 하단 메타 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(post.createdAt)}</span>
                  <div style={{ flex: 1 }} />

                  {/* 댓글 버튼 */}
                  <button onClick={() => setExpandedId(isExpanded ? null : post.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                    <Icon icon="ph:chat-circle" width={18} height={18}
                      color={isExpanded ? '#1B6EF3' : '#94A3B8'} />
                    {post.comments.length > 0 && (
                      <span style={{ fontSize: 12, color: isExpanded ? '#1B6EF3' : '#94A3B8', fontWeight: 600 }}>
                        {post.comments.length}
                      </span>
                    )}
                  </button>

                  {/* 좋아요 버튼 */}
                  <button className="like-btn" onClick={() => handleLike(post.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                    <Icon icon={isLiked ? 'ph:heart-fill' : 'ph:heart'}
                      width={18} height={18} color={isLiked ? '#EF4444' : '#94A3B8'} />
                    {post.likes > 0 && (
                      <span style={{ fontSize: 12, color: isLiked ? '#EF4444' : '#94A3B8', fontWeight: 600 }}>
                        {post.likes}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 댓글 영역 */}
              {isExpanded && (
                <div style={{
                  background: '#F8FAFC', borderRadius: '0 0 14px 14px',
                  border: '1px solid #E2E8F0', borderTop: 'none',
                  padding: '10px 14px 12px',
                  marginTop: -6,
                }}>
                  {post.comments.map(c => (
                    <div key={c.id} style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      marginBottom: 8, position: 'relative',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#CBD5E1', marginTop: 6, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{c.text}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{timeAgo(c.createdAt)}</div>
                      </div>
                      {c.authorId === MY_ID && (
                        <button onClick={() => handleDeleteComment(post.id, c.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        }}>
                          <Icon icon="ph:x" width={12} height={12} color="#CBD5E1" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* 댓글 입력 */}
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: '#fff', borderRadius: 10,
                    border: '1px solid #E2E8F0', padding: '8px 10px',
                    marginTop: post.comments.length > 0 ? 8 : 0,
                  }}>
                    <input
                      value={commentText[post.id] ?? ''}
                      onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(post.id) } }}
                      placeholder="댓글 달기..."
                      style={{
                        flex: 1, border: 'none', outline: 'none', fontSize: 13,
                        background: 'transparent', fontFamily: 'inherit', color: '#1E293B',
                      }}
                    />
                    <button onClick={() => handleComment(post.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center',
                    }}>
                      <Icon icon="ph:paper-plane-right-fill" width={18} height={18}
                        color={(commentText[post.id] ?? '').trim() ? '#1B6EF3' : '#CBD5E1'} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 글쓰기 입력창 */}
      <div style={{
        background: '#fff',
        borderTop: '1px solid #E2E8F0',
        padding: '12px 14px 28px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: '#F8FAFC', borderRadius: 14,
          border: '1.5px solid #E2E8F0', padding: '10px 12px',
        }}>
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={e => {
              setNewText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handlePost() } }}
            placeholder="자유롭게 글을 남겨보세요 ✍️"
            rows={1}
            className="community-textarea"
            style={{
              flex: 1, fontSize: 14, color: '#1E293B', lineHeight: 1.6,
              minHeight: 24, maxHeight: 120,
            }}
          />
          <button onClick={handlePost} style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: newText.trim() ? '#1B6EF3' : '#E2E8F0',
            border: 'none', cursor: newText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            <Icon icon="ph:paper-plane-right-fill" width={18} height={18}
              color={newText.trim() ? '#fff' : '#94A3B8'} />
          </button>
        </div>
      </div>
    </div>
  )
}
