import { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

interface Comment {
  id: string
  text: string
  created_at: string
  author_id: string
}

interface Post {
  id: string
  text: string
  created_at: string
  author_id: string
  likes: number
  comments: Comment[]
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
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
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [liked, setLiked] = useState<Set<string>>(getLiked)
  const [newText, setNewText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchPosts = useCallback(async () => {
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: true })

    if (!postsData) return

    const postIds = postsData.map(p => p.id)

    const [{ data: commentsData }, { data: likesData }] = await Promise.all([
      supabase.from('community_comments').select('*').in('post_id', postIds).order('created_at', { ascending: true }),
      supabase.from('community_likes').select('post_id').in('post_id', postIds),
    ])

    const commentsByPost: Record<string, Comment[]> = {}
    commentsData?.forEach(c => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = []
      commentsByPost[c.post_id].push(c)
    })

    const likeCountByPost: Record<string, number> = {}
    likesData?.forEach(l => {
      likeCountByPost[l.post_id] = (likeCountByPost[l.post_id] ?? 0) + 1
    })

    setAllPosts(postsData.map(p => ({
      ...p,
      likes: likeCountByPost[p.id] ?? 0,
      comments: commentsByPost[p.id] ?? [],
    })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, fetchPosts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPosts])

  useEffect(() => {
    if (!loading) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [loading])

  // 검색 필터링
  const filteredPosts = search.trim()
    ? allPosts.filter(p =>
        p.text.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.comments.some(c => c.text.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : allPosts

  // 최신 50개씩: 전체에서 뒤에서부터 page*PAGE_SIZE개
  const totalFiltered = filteredPosts.length
  const startIdx = Math.max(0, totalFiltered - page * PAGE_SIZE)
  const visiblePosts = filteredPosts.slice(startIdx)
  const hasMore = startIdx > 0

  const handlePost = async () => {
    const text = newText.trim()
    if (!text) return
    setNewText('')
    await supabase.from('community_posts').insert({ text, author_id: MY_ID })
    await fetchPosts()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleLike = async (postId: string) => {
    const key = `post_${postId}`
    const newLiked = new Set(liked)
    const isAlreadyLiked = newLiked.has(key)

    if (isAlreadyLiked) {
      newLiked.delete(key)
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p))
    } else {
      newLiked.add(key)
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    }
    setLiked(newLiked)
    saveLiked(newLiked)

    if (isAlreadyLiked) {
      await supabase.from('community_likes').delete().eq('post_id', postId).eq('author_id', MY_ID)
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, author_id: MY_ID })
    }
  }

  const handleComment = async (postId: string) => {
    const text = (commentText[postId] ?? '').trim()
    if (!text) return
    setCommentText(prev => ({ ...prev, [postId]: '' }))
    await supabase.from('community_comments').insert({ post_id: postId, text, author_id: MY_ID })
    await fetchPosts()
  }

  const handleDelete = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId)
    await fetchPosts()
  }

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('community_comments').delete().eq('id', commentId)
    await fetchPosts()
  }

  const handleShare = async (text: string, comments: Comment[] = []) => {
    const lines = [text]
    if (comments.length > 0) {
      lines.push('')
      comments.forEach(c => lines.push(`  └ ${c.text}`))
    }
    const shareText = lines.join('\n')
    if (navigator.share) {
      try { await navigator.share({ text: shareText }) } catch {}
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('클립보드에 복사됐어요!')
    }
  }

  return (
    <div style={{
      position: 'relative', height: '100%',
      background: '#F0F4F8',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .community-textarea { resize:none; outline:none; border:none; background:transparent; font-family:inherit; }
        .community-textarea::placeholder { color:#CBD5E1; }
        .post-card { animation: fadeSlideUp 0.25s ease; }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .like-btn:active { transform: scale(1.3); }
        .like-btn { transition: transform 0.15s ease; }
      `}</style>

      {/* ── 검색창 (헤더 아래 고정) */}
      <div style={{ position: 'fixed', top: 96, left: 0, right: 0, zIndex: 29, padding: '10px 14px 8px', background: '#F0F4F8', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F8FAFC', borderRadius: 12, padding: '0 12px',
          border: '1.5px solid #E2E8F0', height: 40,
        }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="글·댓글 검색..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1E293B', background: 'transparent', fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon icon="ph:x-circle" width={16} height={16} color="#94A3B8" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon icon="ph:circle-notch" width={28} height={28} color="#1B6EF3"
            style={{ animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ overflowY: 'auto', padding: '12px 14px 0', paddingTop: 70, paddingBottom: 100 }}>

          {/* ── 더보기 버튼 (글 목록 위) */}
          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                width: '100%', marginBottom: 12, padding: '10px',
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 12, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#1B6EF3',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon icon="ph:arrow-up" width={14} height={14} color="#1B6EF3" />
              이전 글 더보기 ({startIdx}개)
            </button>
          )}

          {/* 검색 결과 없음 */}
          {search.trim() && filteredPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 13 }}>
              <Icon icon="ph:magnifying-glass" width={32} height={32} color="#CBD5E1" />
              <div style={{ marginTop: 8 }}>검색 결과가 없어요</div>
            </div>
          )}

          {visiblePosts.map(post => {
            const isExpanded = expandedId === post.id
            const isLiked = liked.has(`post_${post.id}`)
            const isMine = post.author_id === MY_ID
            return (
              <div key={post.id} className="post-card" style={{ marginBottom: 10 }}>
                <div style={{
                  background: '#fff', borderRadius: 16, padding: '14px 16px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.07)', position: 'relative',
                }}>
                  {isMine && (
                    <button onClick={() => handleDelete(post.id)} style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    }}>
                      <Icon icon="ph:x" width={14} height={14} color="#CBD5E1" />
                    </button>
                  )}
                  <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.65, marginBottom: 10, paddingRight: isMine ? 20 : 0 }}>
                    {post.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(post.created_at)}</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setExpandedId(isExpanded ? null : post.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      <Icon icon="ph:chat-circle" width={18} height={18} color={isExpanded ? '#1B6EF3' : '#94A3B8'} />
                      {post.comments.length > 0 && (
                        <span style={{ fontSize: 12, color: isExpanded ? '#1B6EF3' : '#94A3B8', fontWeight: 600 }}>
                          {post.comments.length}
                        </span>
                      )}
                    </button>
                    <button onClick={() => handleShare(post.text, post.comments)} style={{
                      display: 'flex', alignItems: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      <Icon icon="ph:export" width={18} height={18} color="#94A3B8" />
                    </button>
                    <button className="like-btn" onClick={() => handleLike(post.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      <Icon icon={isLiked ? 'ph:heart-fill' : 'ph:heart'} width={18} height={18}
                        color={isLiked ? '#EF4444' : '#94A3B8'} />
                      {post.likes > 0 && (
                        <span style={{ fontSize: 12, color: isLiked ? '#EF4444' : '#94A3B8', fontWeight: 600 }}>
                          {post.likes}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{
                    background: '#F8FAFC', borderRadius: '0 0 14px 14px',
                    border: '1px solid #E2E8F0', borderTop: 'none',
                    padding: '10px 14px 12px', marginTop: -6,
                  }}>
                    {post.comments.map(c => (
                      <div key={c.id} style={{
                        display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CBD5E1', marginTop: 6, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{c.text}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{timeAgo(c.created_at)}</div>
                        </div>
                        {c.author_id === MY_ID && (
                          <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                            <Icon icon="ph:x" width={12} height={12} color="#CBD5E1" />
                          </button>
                        )}
                      </div>
                    ))}
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
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', fontFamily: 'inherit', color: '#1E293B' }}
                      />
                      <button onClick={() => handleComment(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
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
      )}

      <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #E2E8F0', padding: '12px 14px 28px' }}>
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
            style={{ flex: 1, fontSize: 14, color: '#1E293B', lineHeight: 1.6, minHeight: 24, maxHeight: 120 }}
          />
          <button onClick={handlePost} style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: newText.trim() ? '#1B6EF3' : '#E2E8F0', border: 'none',
            cursor: newText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            <Icon icon="ph:paper-plane-right-fill" width={18} height={18} color={newText.trim() ? '#fff' : '#94A3B8'} />
          </button>
        </div>
      </div>
    </div>
  )
}
