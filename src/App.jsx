import { useState, useRef, useEffect } from 'react'
import './App.css'

// 🔧 URL cargada desde el archivo .env (más seguro)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_URL

const MOTIVATIONAL_QUOTES = [
  "Cada día es una nueva oportunidad para ser mejor. 💪",
  "Tu potencial no tiene límites. ✨",
  "El esfuerzo de hoy es el éxito de mañana. 🌟",
  "Cree en ti mismo y todo será posible. 🚀",
]

function TypingIndicator() {
  return (
    <div className="message bot-message typing-wrapper">
      <div className="avatar bot-avatar">🤖</div>
      <div className="bubble typing-bubble">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`message ${isBot ? 'bot-message' : 'user-message'}`}>
      {isBot && <div className="avatar bot-avatar">🤖</div>}
      <div className={`bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
        <p>{msg.text}</p>
        <span className="timestamp">{msg.time}</span>
      </div>
      {!isBot && <div className="avatar user-avatar">😊</div>}
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '¡Hola! 👋 Soy tu coach motivacional. Estoy aquí para ayudarte a superar cualquier desafío y alcanzar tus metas. ¿Cómo te sientes hoy?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // ID de sesión único por visita para mantener contexto en n8n
  const sessionId = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userText = input.trim()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setMessages(prev => [...prev, { role: 'user', text: userText, time: now }])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: userText,           // Campo que espera el Chat Trigger de n8n
          sessionId: sessionId.current,  // Mantiene el contexto de la conversación
        }),
      })

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`)

      const data = await response.json()
      // El Chat Trigger de n8n devuelve la respuesta en "output"
      const botText = data.output || data.text || data.message || data.response || '¡Ánimo! Sigue adelante. 💪'

      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: '⚠️ No pude conectarme al servidor. Revisa la URL del webhook en el archivo App.jsx. ¡Pero recuerda: los obstáculos son temporales!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }

    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app-wrapper">
      {/* Partículas de fondo */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <div className="bot-status">
              <div className="status-dot"></div>
              <span>En línea</span>
            </div>
            <h1>Coach Motivacional <span className="ai-badge">IA</span></h1>
            <p className="header-subtitle">Tu compañero de crecimiento personal</p>
          </div>
          <div className="header-icon">🌟</div>
        </header>

        {/* Frase motivacional rotativa */}
        <div className="quote-banner">
          <span className="quote-icon">💬</span>
          <span className="quote-text" key={quote}>{quote}</span>
        </div>

        {/* Mensajes */}
        <div className="messages-area">
          {messages.map((msg, idx) => (
            <Message key={idx} msg={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu mensaje... (Enter para enviar)"
              rows={1}
              disabled={isTyping}
              className="message-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="send-button"
              aria-label="Enviar mensaje"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Powered by n8n AI · Presiona Enter para enviar</p>
        </div>
      </div>
    </div>
  )
}
