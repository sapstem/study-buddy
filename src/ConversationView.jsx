import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './ConversationView.css'

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
      } else {
        navigate('/summarizer')
      }
    } else {
      navigate('/summarizer')
    }
  }, [id, navigate])

  if (!conversation) {
    return <div>Loading...</div>
  }

  return (
    <div className="conversation-view">
      {/* Sidebar - reuse from summarizer */}
      <aside className="studio-rail">
        <div className="studio-header">
          <div className="logo-mark">S</div>
          <span className="logo-name">Sage</span>
        </div>
        
        <button 
          className="studio-link"
          onClick={() => navigate('/summarizer')}
        >
          ← Back to Home
        </button>
      </aside>

      {/* Main Content */}
      <main className="conversation-main">
        {/* Top Bar */}
        <div className="conversation-header">
          <button className="back-btn" onClick={() => navigate('/summarizer')}>
            ←
          </button>
          <h1 className="conversation-title">
            {conversation.text.slice(0, 50)}...
          </h1>
          <div className="header-actions">
            <button className="upgrade-btn">Upgrade</button>
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
              <div className="summary-card">
                <p>{conversation.summary}</p>
              </div>

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
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="feature-placeholder">
              <div className="placeholder-icon">🃏</div>
              <h2>Flashcards</h2>
              <p>Coming soon! Generate flashcards from your notes.</p>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="feature-placeholder">
              <div className="placeholder-icon">📝</div>
              <h2>Quizzes</h2>
              <p>Coming soon! Test yourself with AI-generated quizzes.</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="feature-placeholder">
              <div className="placeholder-icon">📄</div>
              <h2>Notes</h2>
              <p>Coming soon! View and edit your original notes.</p>
            </div>
          )}
        </div>

        {/* Bottom Input Bar */}
        <div className="conversation-input-bar">
          <input
            type="text"
            placeholder="Learn anything"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <div className="input-controls">
            <button className="control-btn">📎</button>
            <button className="control-btn">🎙</button>
            <button className="control-btn voice-btn">🎤 Voice</button>
          </div>
          <span className="auto-label">Auto ▾</span>
          <span className="context-label">@ Add Context</span>
        </div>
      </main>
    </div>
  )
}

export default ConversationView