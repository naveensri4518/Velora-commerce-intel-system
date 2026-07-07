import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles, Loader } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function AiChatbot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI Admin Assistant. Ask me anything about your inventory or sales!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Only admins can see this
  if (user?.role !== 'ROLE_ADMIN') return null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', { message: userMsg })
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to my brain right now.' }])
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 10px 25px -5px rgba(126, 34, 206, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="AI Assistant"
      >
        <Sparkles size={24} />
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      width: 360, height: 500, background: 'var(--color-surface)',
      borderRadius: 16, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border-light)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Smart Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg)' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
            background: msg.role === 'user' ? 'var(--color-accent)' : 'white',
            color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
            border: msg.role === 'user' ? 'none' : '1px solid var(--color-border-light)',
            fontSize: 14, lineHeight: 1.4, whiteSpace: 'pre-wrap'
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12, background: 'white', border: '1px solid var(--color-border-light)' }}>
            <Loader size={16} className="animate-spin" color="var(--color-accent)" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{
        padding: 12, borderTop: '1px solid var(--color-border-light)', background: 'var(--color-surface)',
        display: 'flex', gap: 8
      }}>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about sales, stock, etc..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--color-border-light)', fontSize: 14, outline: 'none' }}
        />
        <button type="submit" disabled={!input.trim() || loading} style={{
          background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: (!input.trim() || loading) ? 0.5 : 1
        }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
