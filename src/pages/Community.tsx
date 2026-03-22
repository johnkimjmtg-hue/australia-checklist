import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

interface Message {
  id: string
  text: string
  created_at: string
  author_id: string
  author_name: string
  likes: number
  reply_to_id?: string | null
  reply_to_text?: string | null
  reply_to_name?: string | null
  image_url?: string | null
}

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
const BLUE = '#1B6EF3'
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// 이미지 압축 (Canvas → WebP, 최대 800px, 약 200KB 이하)
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob!), 'image/webp', 0.75)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Cloudinary 업로드
async function uploadToCloudinary(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const fd = new FormData()
  fd.append('file', compressed, 'image.webp')
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'community')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!data.secure_url) throw new Error('업로드 실패')
  return data.secure_url
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간`
  return `${Math.floor(h / 24)}일`
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const h = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h}:${mm}`
}

function formatDateLabel(ts: string): string {
  const d = new Date(ts)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

function getMyId(): string {
  let id = localStorage.getItem('community-my-id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('community-my-id', id)
  }
  return id
}

function getMyName(): string | null {
  return localStorage.getItem('community-my-name')
}

function getLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('community-liked') ?? '[]')) }
  catch { return new Set() }
}

function saveLiked(liked: Set<string>) {
  localStorage.setItem('community-liked', JSON.stringify([...liked]))
}

// 닉네임으로 아바타 색상 결정
function avatarColor(name: string): string {
  const colors = ['#1B6EF3','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
  '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
  '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
  '🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐',
  '😭','😢','😥','😓','😩','😫','🥱','😤','😠','😡',
  '👍','👎','👏','🙌','🤝','🙏','✌️','🤞','👌','🤙',
  '👋','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔',
  '💕','💞','💓','💗','💖','💘','💝','✈️','🛫','🛬',
  '☕','🍵','🧋','🥤','🍺','🍻','🥂','🍷','🍸','🍹',
  '🍕','🍔','🍟','🌭','🍿','🥚','🍳','🧇','🥞','🍞',
  '🍜','🍝','🍛','🍲','🍣','🍱','🥟','🍙','🍚','🧁',
  '🐶','🐱','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦘',
  '🌸','🌺','🌻','🌹','🌷','🌼','💐','🍀','🌿','🌱',
  '✅','❌','⭕','🔴','🟢','🔵','💯','🔥','✨','⭐',
  '🌟','💫','⚡','❄️','🌈','🎉','🎊','🎈','🎁','🏆',
  '📱','💻','📷','📸','💡','💰','💎','🔑','📝','📖',
]

// ── 닉네임 변경 팝업
function NameChangePopup({ currentName, onClose, onSet }: {
  currentName: string
  onClose: () => void
  onSet: (name: string) => void
}) {
  const [input, setInput] = useState(currentName)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const name = input.trim()
    if (!name || name === currentName) { onClose(); return }
    setChecking(true)
    setError('')
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('community_posts')
      .select('id')
      .eq('author_name', name)
      .gte('created_at', since)
      .limit(1)
    setChecking(false)
    if (data && data.length > 0) {
      setError('이미 사용 중인 닉네임이에요.')
      return
    }
    onSet(name)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      fontFamily: ff,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#e8e8e8', borderRadius: 20, padding: '24px',
        width: 'calc(100% - 48px)', maxWidth: 340,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>닉네임 변경</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon icon="ph:x" width={18} height={18} color="#94A3B8" />
          </button>
        </div>

        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) handleSubmit() }}
          placeholder="새 닉네임 입력 (최대 10자)"
          maxLength={10}
          autoFocus
          style={{
            width: '100%', height: 48,
            border: `1px solid ${error ? '#EF4444' : '#C8C8C8'}`,
            borderRadius: 12, padding: '0 14px', fontSize: 15,
            color: '#0F172A', fontFamily: ff, outline: 'none',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 48, borderRadius: 12, border: 'none',
            background: '#e8e8e8', color: '#64748B', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: ff,
            boxShadow: '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          }}>취소</button>
          <button onClick={handleSubmit} disabled={!input.trim() || checking} style={{
            flex: 1, height: 48, borderRadius: 12, border: 'none',
            background: '#e8e8e8',
            color: input.trim() && !checking ? BLUE : '#94A3B8',
            fontSize: 14, fontWeight: 700,
            cursor: input.trim() && !checking ? 'pointer' : 'default',
            fontFamily: ff,
            boxShadow: input.trim() && !checking
              ? '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff'
              : 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff',
          }}>{checking ? '확인 중...' : '변경하기'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── 닉네임 설정 화면
function NicknameSetup({ onSet }: { onSet: (name: string) => void }) {
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const examples = ['호주사랑', '시드니거주', '멜번이민자', '브리즈번사람', '캥거루팬']

  const handleSubmit = async () => {
    const name = input.trim()
    if (!name) return
    setChecking(true)
    setError('')
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('community_posts')
      .select('id')
      .eq('author_name', name)
      .gte('created_at', since)
      .limit(1)
    setChecking(false)
    if (data && data.length > 0) {
      setError('이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.')
      return
    }
    onSet(name)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      fontFamily: ff,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#e8e8e8', borderRadius: 20, padding: '28px 24px',
        width: 'calc(100% - 48px)', maxWidth: 360,
      }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>💬</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 6 }}>
          채팅방 입장
        </div>
        <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
          호주에 사는 사람들과 자유롭게 대화해요.<br/>사용할 닉네임을 입력해주세요.
        </div>

        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) handleSubmit() }}
          placeholder="닉네임 입력 (최대 10자)"
          maxLength={10}
          autoFocus
          style={{
            width: '100%', height: 48,
            border: `1px solid ${error ? '#EF4444' : '#C8C8C8'}`,
            borderRadius: 12, padding: '0 14px', fontSize: 15,
            color: '#0F172A', fontFamily: ff, outline: 'none',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 20 }}>
          {examples.map(ex => (
            <button key={ex} onClick={() => { setInput(ex); setError('') }} style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px',
              borderRadius: 20, border: '1px solid #C8C8C8',
              background: '#e8e8e8', color: '#64748B', cursor: 'pointer',
            }}>{ex}</button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || checking}
          style={{
            width: '100%', height: 50, borderRadius: 12, border: 'none',
            background: '#e8e8e8',
            color: input.trim() && !checking ? BLUE : '#94A3B8',
            fontSize: 15, fontWeight: 700,
            cursor: input.trim() && !checking ? 'pointer' : 'default',
            fontFamily: ff,
            boxShadow: input.trim() && !checking
              ? '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff'
              : 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff',
          }}
        >{checking ? '확인 중...' : '입장하기 →'}</button>
      </div>
    </div>,
    document.body
  )
}

export default function Community() {
  const MY_ID = getMyId()
  const [myName, setMyName] = useState<string | null>(getMyName)
  const [messages, setMessages] = useState<Message[]>([])
  const [liked, setLiked] = useState<Set<string>>(getLiked)
  const [newText, setNewText] = useState('')
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [likedAnim, setLikedAnim] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [showNameChange, setShowNameChange] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [footerWidth, setFooterWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const updateWidth = () => {
      if (pageRef.current) setFooterWidth(pageRef.current.getBoundingClientRect().width)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 80)
  }

  const fetchMessages = useCallback(async () => {
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200)

    if (!postsData) return

    const postIds = postsData.map(p => p.id)
    const { data: likesData } = await supabase
      .from('community_likes')
      .select('post_id')
      .in('post_id', postIds)

    const likeCountByPost: Record<string, number> = {}
    likesData?.forEach(l => {
      likeCountByPost[l.post_id] = (likeCountByPost[l.post_id] ?? 0) + 1
    })

    setMessages(postsData.map(p => ({
      id: p.id,
      text: p.text,
      created_at: p.created_at,
      author_id: p.author_id,
      author_name: p.author_name ?? '익명',
      likes: likeCountByPost[p.id] ?? 0,
      reply_to_id: p.reply_to_id ?? null,
      reply_to_text: p.reply_to_text ?? null,
      reply_to_name: p.reply_to_name ?? null,
      image_url: p.image_url ?? null,
    })))
    setLoading(false)
  }, [])

  // Realtime 구독 + 자동 재연결
  const channelRef = useRef<any>(null)

  const setupChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('hojugaja-chat-db')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, () => {
        fetchMessages().then(() => scrollToBottom())
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, () => {
        fetchMessages()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => {
        fetchMessages()
      })
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          channelRef.current = null
          setTimeout(() => setupChannel(), 3000)
        }
      })

    channelRef.current = channel
  }, [fetchMessages])

  // Presence 채널 - 고정 이름
  useEffect(() => {
    const presenceChannel = supabase.channel('hojugaja-chat-room')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setOnlineCount(Object.keys(state).length)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ t: Date.now() })
        }
      })
    return () => { supabase.removeChannel(presenceChannel) }
  }, [])

  useEffect(() => {
    fetchMessages()
    setupChannel()

    // 백그라운드에서 돌아올 때 메시지만 새로 로드 (채널 재생성 X)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages()
        if (!channelRef.current) setupChannel()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // 페이지 보일 때만 10초마다 폴링 (Realtime 백업)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages()
      }
    }, 10000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(pollInterval)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [setupChannel])

  // 최초 로드 시 맨 아래로
  useEffect(() => {
    if (!loading) scrollToBottom('auto')
  }, [loading])

  // 이모지 피커 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    if (showEmoji) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    const results = messages.filter(m =>
      m.text.toLowerCase().includes(q.trim().toLowerCase()) ||
      (m.reply_to_text ?? '').toLowerCase().includes(q.trim().toLowerCase())
    )
    setSearchResults(results)
  }

  // 원글 ID → 답글 ID 목록 맵
  const repliesMap = messages.reduce<Record<string, string[]>>((acc, m) => {
    if (m.reply_to_id) {
      if (!acc[m.reply_to_id]) acc[m.reply_to_id] = []
      acc[m.reply_to_id].push(m.id)
    }
    return acc
  }, {})

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.background = 'rgba(27,110,243,0.08)'
      setTimeout(() => { el.style.background = '' }, 1500)
    }
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSetName = (name: string) => {
    localStorage.setItem('community-my-name', name)
    setMyName(name)
  }

  const handlePost = async () => {
    const text = newText.trim()
    if (!text && !imgFile) return
    if (!myName) return
    setUploading(true)
    setNewText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    let imageUrl: string | null = null
    if (imgFile) {
      try { imageUrl = await uploadToCloudinary(imgFile) } catch {}
      setImgFile(null)
      setImgPreview(null)
    }

    await supabase.from('community_posts').insert({
      text: text || '',
      author_id: MY_ID,
      author_name: myName,
      reply_to_id: replyTo?.id ?? null,
      reply_to_text: replyTo?.text ?? null,
      reply_to_name: replyTo?.author_name ?? null,
      image_url: imageUrl,
    })
    setReplyTo(null)
    setUploading(false)
    await fetchMessages()
    scrollToBottom()
  }

  const handleLike = async (msgId: string) => {
    const key = `post_${msgId}`
    const newLiked = new Set(liked)
    const isAlreadyLiked = newLiked.has(key)

    if (isAlreadyLiked) {
      newLiked.delete(key)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, likes: Math.max(0, m.likes - 1) } : m))
      await supabase.from('community_likes').delete().eq('post_id', msgId).eq('author_id', MY_ID)
    } else {
      newLiked.add(key)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, likes: m.likes + 1 } : m))
      setLikedAnim(msgId)
      setTimeout(() => setLikedAnim(null), 600)
      await supabase.from('community_likes').insert({ post_id: msgId, author_id: MY_ID })
    }
    setLiked(newLiked)
    saveLiked(newLiked)
  }

  const handleDelete = async (msgId: string) => {
    await supabase.from('community_posts').delete().eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current
    if (!ta) { setNewText(prev => prev + emoji); return }
    const start = ta.selectionStart ?? newText.length
    const end = ta.selectionEnd ?? newText.length
    const next = newText.slice(0, start) + emoji + newText.slice(end)
    setNewText(next)
    setTimeout(() => {
      ta.focus()
      const pos = start + emoji.length
      ta.setSelectionRange(pos, pos)
    }, 0)
    setShowEmoji(false)
  }

  // 날짜 구분선 표시 여부
  const shouldShowDate = (idx: number): boolean => {
    if (idx === 0) return true
    return !isSameDay(messages[idx - 1].created_at, messages[idx].created_at)
  }

  // 연속 메시지 여부 (같은 사람이 연속으로 보냄 - 1분 이내)
  const isContinuous = (idx: number): boolean => {
    if (idx === 0) return false
    const prev = messages[idx - 1]
    const curr = messages[idx]
    if (prev.author_id !== curr.author_id) return false
    const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
    return diff < 60000
  }

  return (
    <div ref={pageRef} style={{
      background: '#e8e8e8',
      fontFamily: ff,
      minHeight: '100%',
      paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .chat-textarea { resize:none; outline:none; border:none; background:transparent; font-family:inherit; width:100%; }
        .chat-textarea::placeholder { color:#CBD5E1; }
        .bubble-in { animation: bubbleIn 0.2s ease; }
        @keyframes bubbleIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes heartPop { 0%{transform:scale(1)} 50%{transform:scale(1.5)} 100%{transform:scale(1)} }
        .heart-pop { animation: heartPop 0.5s ease; }
        .msg-bubble:hover .msg-actions { opacity:1; }
        .msg-actions { opacity:0; transition:opacity 0.15s; }
      `}</style>

      {/* 닉네임 미설정 시 팝업 */}
      {!myName && <NicknameSetup onSet={handleSetName} />}

      {/* ── 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff',
        borderTop: '1px solid #C8C8C8',
        borderBottom: '1px solid #C8C8C8',
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1B6EF3, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon icon="mdi:kangaroo" width={22} height={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>호주가자 단톡방</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 검색 버튼 */}
            <button onClick={() => {
              setShowSearch(v => !v)
              setSearchQuery('')
              setSearchResults([])
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: showSearch ? '#e8e8e8' : '#e8e8e8',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: showSearch
                ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            }}>
              <Icon icon="ph:magnifying-glass" width={16} height={16} color={showSearch ? BLUE : '#64748B'} />
            </button>
            {myName && (
              <button onClick={() => setShowNameChange(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#e8e8e8', border: 'none', borderRadius: 20,
                padding: '6px 12px', cursor: 'pointer',
                boxShadow: '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: avatarColor(myName),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 800,
                }}>{myName[0]}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{myName}</span>
              </button>
            )}
          </div>
        </div>

        {/* 검색창 슬라이드 다운 */}
        {showSearch && (
          <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#e8e8e8', borderRadius: 12, padding: '0 12px',
              height: 40, border: '1px solid #C8C8C8',
            }}>
              <Icon icon="ph:magnifying-glass" width={14} height={14} color="#94A3B8" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="대화 내용 검색..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 13, color: '#1E293B', background: 'transparent', fontFamily: ff,
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <Icon icon="ph:x-circle" width={14} height={14} color="#94A3B8" />
                </button>
              )}
            </div>
            {/* 검색 결과 */}
            {searchQuery.trim() && (
              <div style={{
                marginTop: 8, maxHeight: 360, overflowY: 'auto',
                background: '#fff', borderRadius: 12, border: '1px solid #C8C8C8',
              }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '14px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
                    검색 결과가 없어요
                  </div>
                ) : (
                  searchResults.map(r => (
                    <button key={r.id} onClick={() => scrollToMessage(r.id)} style={{
                      width: '100%', padding: '10px 14px', background: 'none',
                      border: 'none', borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer', textAlign: 'left', fontFamily: ff,
                      display: 'block',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, marginBottom: 4 }}>
                        {r.author_name} · {formatTime(r.created_at)}
                      </div>
                      {r.reply_to_text && (
                        <div style={{
                          fontSize: 11, color: '#94A3B8', background: '#F1F5F9',
                          borderRadius: 6, padding: '3px 8px', marginBottom: 4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          ↩ {r.reply_to_name}: {r.reply_to_text}
                        </div>
                      )}
                      {r.text ? (
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {r.text}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#CBD5E1', fontStyle: 'italic' }}>
                          (내용 없음)
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 메시지 목록 */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Icon icon="ph:circle-notch" width={28} height={28} color={BLUE}
            style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '12px 14px 0' }}>

          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>첫 번째 메시지를 남겨보세요!</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>호주에 사는 사람들과 자유롭게 대화해요</div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.author_id === MY_ID
            const isLiked = liked.has(`post_${msg.id}`)
            const continuous = isContinuous(idx)
            const color = avatarColor(msg.author_name)

            return (
              <div key={msg.id}>
                {/* 날짜 구분선 */}
                {shouldShowDate(idx) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    margin: `${idx === 0 ? 4 : 16}px 0 12px`,
                  }}>
                    <div style={{ flex: 1, height: 1, background: '#D1D9E3' }} />
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#94A3B8',
                      background: '#e8e8e8', padding: '2px 10px', borderRadius: 20,
                      border: '1px solid #C8C8C8',
                    }}>{formatDateLabel(msg.created_at)}</span>
                    <div style={{ flex: 1, height: 1, background: '#D1D9E3' }} />
                  </div>
                )}

                {/* 메시지 버블 */}
                <div id={`msg-${msg.id}`} className="bubble-in msg-bubble" style={{
                  display: 'flex',
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: continuous ? 2 : 10,
                  marginTop: continuous ? 0 : (idx > 0 && !shouldShowDate(idx) ? 4 : 0),
                  borderRadius: 8, transition: 'background 0.4s',
                }}>
                  {/* 아바타 + 닉네임 (상대방만, 연속이면 숨김) */}
                  {!isMine && (
                    <div style={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                      {!continuous && (
                        <>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: '#64748B',
                            whiteSpace: 'nowrap', maxWidth: 44,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            textAlign: 'center',
                          }}>{msg.author_name}</div>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, color: '#fff',
                            flexShrink: 0,
                          }}>{msg.author_name[0]}</div>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>

                    {/* 이미지 — 버블 밖, 텍스트 버블 위에 */}
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt=""
                        onClick={() => setFullscreenImg(msg.image_url!)}
                        style={{
                          maxWidth: 220, maxHeight: 220, borderRadius: 12,
                          objectFit: 'cover', cursor: 'pointer', display: 'block',
                          marginBottom: msg.text ? 4 : 0,
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      {/* 말풍선 */}
                      <div style={{
                        background: isMine ? BLUE : '#fff',
                        color: isMine ? '#fff' : '#1E293B',
                        borderRadius: isMine
                          ? (continuous ? '18px 18px 4px 18px' : '18px 4px 18px 18px')
                          : (continuous ? '18px 18px 18px 4px' : '4px 18px 18px 18px'),
                        padding: '10px 14px',
                        fontSize: 14, lineHeight: 1.6,
                        border: isMine ? 'none' : '1px solid #C8C8C8',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {/* 인용 메시지 */}
                        {msg.reply_to_id && (
                          <div
                            onClick={() => scrollToMessage(msg.reply_to_id!)}
                            style={{
                              background: isMine ? 'rgba(255,255,255,0.2)' : '#e8e8e8',
                              borderRadius: 8, padding: '6px 10px',
                              marginBottom: 8, cursor: 'pointer',
                            }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isMine ? 'rgba(255,255,255,0.8)' : BLUE, marginBottom: 2 }}>
                              {msg.reply_to_name}
                            </div>
                            <div style={{ fontSize: 12, color: isMine ? 'rgba(255,255,255,0.7)' : '#64748B', lineHeight: 1.5 }}>
                              {msg.reply_to_text}
                            </div>
                          </div>
                        )}
                        {msg.text}
                        {/* 답글 뱃지 — 원글에 답글이 있을 때 표시 */}
                        {!msg.reply_to_id && repliesMap[msg.id]?.length > 0 && (
                          <div
                            onClick={() => scrollToMessage(repliesMap[msg.id][0])}
                            style={{
                              marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(27,110,243,0.08)',
                              borderRadius: 20, padding: '3px 10px',
                              cursor: 'pointer', fontSize: 11, fontWeight: 700,
                              color: isMine ? 'rgba(255,255,255,0.9)' : BLUE,
                            }}
                          >
                            ↩ 답글 {repliesMap[msg.id].length}개
                          </div>
                        )}
                      </div>

                      {/* 시간 + 좋아요 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2, flexShrink: 0 }}>
                        {msg.likes > 0 && (
                          <button onClick={() => handleLike(msg.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            background: 'rgba(219,39,119,0.1)', border: 'none',
                            borderRadius: 20, padding: '2px 6px', cursor: 'pointer',
                          }}>
                            <span className={likedAnim === msg.id ? 'heart-pop' : ''} style={{ fontSize: 12 }}>
                              {isLiked ? '💗' : '🩷'}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#DB2777' }}>{msg.likes}</span>
                          </button>
                        )}
                        <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 (호버 시 표시) */}
                  <div className="msg-actions" style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    alignSelf: 'center',
                  }}>
                    {/* 답장 버튼 */}
                    <button onClick={() => {
                      setReplyTo(msg)
                      textareaRef.current?.focus()
                    }} style={{
                      background: '#fff', border: '1px solid #C8C8C8',
                      borderRadius: '50%', width: 28, height: 28,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>
                      <Icon icon="ph:arrow-bend-up-left" width={13} height={13} color="#64748B" />
                    </button>
                    {msg.likes === 0 && (
                      <button onClick={() => handleLike(msg.id)} style={{
                        background: '#fff', border: '1px solid #C8C8C8',
                        borderRadius: '50%', width: 28, height: 28,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}>
                        <span style={{ fontSize: 14 }}>{isLiked ? '💗' : '🩷'}</span>
                      </button>
                    )}
                    {isMine && (
                      <button onClick={() => handleDelete(msg.id)} style={{
                        background: '#fff', border: '1px solid #C8C8C8',
                        borderRadius: '50%', width: 28, height: 28,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}>
                        <Icon icon="ph:trash" width={13} height={13} color="#EF4444" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} style={{ height: 4 }} />
        </div>
      )}

      {/* ── 입력창 */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: footerWidth ?? '100%',
        background: '#e8e8e8',
        borderTop: '1px solid #C8C8C8',
        padding: '6px 14px 16px',
        zIndex: 40, boxSizing: 'border-box',
      }}>
        {/* 답장 미리보기 */}
        {replyTo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#e8e8e8', borderRadius: 10,
            padding: '8px 12px', marginBottom: 6,
            borderLeft: `3px solid ${BLUE}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, marginBottom: 1 }}>
                {replyTo.author_name}에게 답장
              </div>
              <div style={{ fontSize: 12, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replyTo.text}
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 2, flexShrink: 0,
            }}>
              <Icon icon="ph:x" width={14} height={14} color="#94A3B8" />
            </button>
          </div>
        )}
        {/* 이모지 피커 */}
        {showEmoji && (
          <div ref={emojiPickerRef} style={{
            position: 'absolute', bottom: '100%', left: 14, right: 14,
            background: '#e8e8e8', borderRadius: 14, padding: 12,
            border: '1px solid #C8C8C8', marginBottom: 6,
            display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
            maxHeight: 200, overflowY: 'auto',
          }}>
            {EMOJIS.map((emoji, i) => (
              <button key={i} onClick={() => insertEmoji(emoji)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, padding: 4, borderRadius: 6, lineHeight: 1,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >{emoji}</button>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display:'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            setImgFile(f)
            setImgPreview(URL.createObjectURL(f))
            e.target.value = ''
          }}
        />

        <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
          {/* + 버튼 (입력창 밖 왼쪽) */}
          <button onClick={() => fileInputRef.current?.click()} style={{
            width:36, height:36, borderRadius:'50%', flexShrink:0,
            background:'#e8e8e8', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'2px 2px 5px #c5c5c5, -2px -2px 5px #ffffff',
            WebkitTapHighlightColor:'transparent',
            marginBottom:2,
          }}>
            <Icon icon="ph:plus" width={20} height={20} color={imgFile ? BLUE : '#64748B'} />
          </button>

          {/* 입력창 */}
          <div style={{
            flex:1, background:'#fff', borderRadius:20, padding:'8px 12px',
            border:'1px solid #C8C8C8', display:'flex', flexDirection:'column', gap:6,
          }}>
            {/* 이미지 미리보기 — 위쪽 */}
            {imgPreview && (
              <div style={{ position:'relative', display:'inline-block', alignSelf:'flex-start' }}>
                <img src={imgPreview} alt="" style={{ maxHeight:100, maxWidth:180, borderRadius:8, border:'1px solid #C8C8C8', objectFit:'cover', display:'block' }} />
                <button onClick={() => { setImgFile(null); setImgPreview(null) }} style={{
                  position:'absolute', top:-6, right:-6, width:18, height:18,
                  borderRadius:'50%', background:'#64748B', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon icon="ph:x" width={10} height={10} color="#fff" />
                </button>
              </div>
            )}

            {/* 텍스트 입력 + 이모지 + 전송 */}
            <div style={{ display:'flex', alignItems:'flex-end', gap:6 }}>
              <button onClick={() => setShowEmoji(v => !v)} style={{
                background:'none', border:'none', cursor:'pointer',
                padding:0, fontSize:20, opacity: showEmoji ? 1 : 0.5,
                transition:'opacity 0.15s', flexShrink:0, lineHeight:1, marginBottom:2,
              }}>🙂</button>

              <textarea
                ref={textareaRef}
                value={newText}
                onChange={e => {
                  setNewText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    handlePost()
                  }
                }}
                placeholder="메시지 입력..."
                rows={1}
                className="chat-textarea"
                style={{ fontSize:14, color:'#1E293B', lineHeight:1.6, minHeight:24, maxHeight:120 }}
              />

              <button onClick={handlePost} disabled={uploading} style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background: (newText.trim() || imgFile) && !uploading ? BLUE : '#CBD5E1', border:'none',
                cursor: (newText.trim() || imgFile) && !uploading ? 'pointer' : 'default',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background 0.2s',
              }}>
                {uploading
                  ? <Icon icon="ph:spinner" width={16} height={16} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  : <Icon icon="ph:paper-plane-right-fill" width={16} height={16} color="#fff" />
                }
              </button>
            </div>
          </div>
        </div>
        </div>
        {/* 닉네임 변경 팝업 */}
        {showNameChange && myName && (
          <NameChangePopup
            currentName={myName}
            onClose={() => setShowNameChange(false)}
            onSet={(name) => { handleSetName(name); setShowNameChange(false) }}
          />
        )}

        {/* 풀스크린 이미지 뷰어 — createPortal로 body에 직접 렌더링 */}
        {fullscreenImg && createPortal(
          <div
            onClick={() => setFullscreenImg(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}
          >
            <img
              src={fullscreenImg}
              alt=""
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', gap: 12 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(fullscreenImg!)
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'image.jpg'
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    window.open(fullscreenImg!, '_blank')
                  }
                  setFullscreenImg(null)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: BLUE, color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Icon icon="ph:download-simple" width={16} height={16} color="#fff" />
                다운로드
              </button>
              <button
                onClick={() => setFullscreenImg(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

  )
}
