import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleGenerativeAI } from '@google/generative-ai'
import FlashcardView from './FlashcardView'
import NotesView from './NotesView'
import './ConversationView.css'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

const base64UrlToBase64 = (input) => {
  let output = input.replace(/-/g, '+').replace(/_/g, '/')
  while (output.length % 4 !== 0) output += '='
  return output
}

const getDisplayName = () => {
  const token = localStorage.getItem('auth_token')
  if (!token) return 'Guest'
  try {
    const payload = JSON.parse(atob(base64UrlToBase64(token.split('.')[1] || '')))
    // Use actual Google account name
    return payload?.name || payload?.given_name || 'Guest'
  } catch (e) {
    return 'Guest'
  }
}

function ConversationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Load conversation from localStorage using same key as summarizerpage
    const displayName = getDisplayName()
    const key = displayName ? `summaries:${displayName}` : 'summaries:anon'
    const saved = localStorage.getItem(key)
    
    if (saved) {
      const summaries = JSON.parse(saved)
      const found = summaries.find(s => s.id === parseInt(id))
      if (found) {
        setConversation(found)
        // Load chat history if exists
        const chatKey = `chat:${id}`
        const savedChat = localStorage.getItem(chatKey)
        if (savedChat) {
          setMessages(JSON.parse(savedChat))
        }
      } else {
        navigate('/summarizer')
      }
    } else {
      navigate('/summarizer')
    }
  }, [id, navigate])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !genAI) return

    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      // Build context from original content and chat history
      const context = `
You are a helpful study assistant. The user is studying the following content:

${conversation.text}

Summary: ${conversation.summary}

Answer the user's question based on this content. Be concise and helpful.

User's question: ${userMessage}`

      const result = await model.generateContent(context)
      const response = await result.response
      const aiMessage = response.text()

      // Add AI response to chat
      const updatedMessages = [...newMessages, { role: 'assistant', content: aiMessage }]
      setMessages(updatedMessages)
      
      // Save chat history to localStorage
      const chatKey = `chat:${id}`
      localStorage.setItem(chatKey, JSON.stringify(updatedMessages))
    } catch (error) {
      console.error('Failed to get response:', error)
      const errorMessages = [...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]
      setMessages(errorMessages)
    } finally {
      setLoading(false)
    }
  }

  if (!conversation) {
    return <div>Loading...</div>
  }

  return (
    <div className="conversation-view">
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar - toggleable */}
      <aside className={`studio-rail ${sidebarOpen ? 'open' : ''}`}>
        <div className="studio-header">
          <div className="logo-mark">S</div>
          <span className="logo-name">Sage</span>
        </div>
        
        <button 
          className="studio-link"
          onClick={() => {
            navigate('/summarizer')
            setSidebarOpen(false)
          }}
        >
          ← Back to Home
        </button>

        <div className="sidebar-actions">
          <button 
            className="sidebar-action-btn"
            onClick={() => {
              setActiveTab('chat')
              setSidebarOpen(false)
            }}
          >
            <span className="action-icon">💬</span>
            <span>Chat Bot</span>
          </button>

          <button 
            className="sidebar-action-btn"
            onClick={() => {
              setActiveTab('notes')
              setSidebarOpen(false)
            }}
          >
            <span className="action-icon">📄</span>
            <span>Document</span>
          </button>

          <button 
            className="sidebar-action-btn"
            onClick={() => {
              setActiveTab('flashcards')
              setSidebarOpen(false)
            }}
          >
            <span className="action-icon">🃏</span>
            <span>Flashcards</span>
          </button>

          <button 
            className="sidebar-action-btn"
            onClick={() => {
              setActiveTab('quizzes')
              setSidebarOpen(false)
            }}
          >
            <span className="action-icon">📝</span>
            <span>Quiz</span>
          </button>
        </div>
      </aside>

      {/* Overlay - click to close sidebar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="conversation-main">{/* Top Bar */}
        <div className="conversation-header">
          <button className="back-btn" onClick={() => navigate('/summarizer')}>
            ←
          </button>
          <h1 className="conversation-title">
            {conversation.text.slice(0, 50)}...
          </h1>
          <div className="header-actions">
            <button className="share-btn">Share</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="conversation-tabs">
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="tab-icon">💬</span>
            Chat
          </button>
          <button 
            className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            <span className="tab-icon">🃏</span>
            Flashcards
          </button>
          <button 
            className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            <span className="tab-icon">📝</span>
            Quizzes
          </button>
          <button 
            className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <span className="tab-icon">📄</span>
            Notes
          </button>
        </div>

        {/* Content Area */}
        <div className="conversation-content">
          {activeTab === 'chat' && (
            <div className="chat-view">
              {/* Summary Card */}
              <div className="summary-card">
                <p>{conversation.summary}</p>
              </div>

              {/* Takeaways */}
              {conversation.takeaways && conversation.takeaways.length > 0 && (
                <div className="summary-section">
                  <h3>Key Takeaways</h3>
                  <ul>
                    {conversation.takeaways.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keywords */}
              {conversation.keywords && conversation.keywords.length > 0 && (
                <div className="summary-section">
                  <h3>Keywords</h3>
                  <div className="keyword-chips">
                    {conversation.keywords.map((k, i) => (
                      <span key={i} className="chip">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 0 && (
                <div className="chat-messages-container">
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Conversation</h3>
                  {messages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                      <div className="message-label">
                        {msg.role === 'user' ? 'You' : 'Sage'}
                      </div>
                      <div className="message-content">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="chat-message assistant">
                      <div className="message-label">Sage</div>
                      <div className="message-content typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <FlashcardView conversation={conversation} />
          )}

          {activeTab === 'quizzes' && (
            <div className="feature-placeholder">
              <div className="placeholder-icon">📝</div>
              <h2>Quizzes</h2>
              <p>Coming soon! Test yourself with AI-generated quizzes.</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <NotesView conversation={conversation} />
          )}
        </div>

        {/* Bottom Input Bar */}
        <div className="conversation-input-bar">
          <input
            type="text"
            placeholder="Ask a question about this content..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            disabled={loading}
          />
          <button 
            className="send-message-btn"
            onClick={handleSendMessage}
            disabled={loading || !chatInput.trim()}
          >
            ↑
          </button>
        </div>
      </main>
    </div>
  )
}

export default ConversationView