import React from 'react'  // FIX
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

const getStorageKey = (email) => (email ? `summaries:${email}` : 'summaries:anon')
const getSpacesKey = (email) => (email ? `spaces:${email}` : 'spaces:anon')
const getChatKey = (email) => (email ? `chat:${email}` : 'chat:anon')

const base64UrlToBase64 = (input) => {
  // JWT payload is base64url; normalize and pad for atob
  let output = input.replace(/-/g, '+').replace(/_/g, '/')
  while (output.length % 4 !== 0) {
    output += '='
  }
  return output
}

const getCurrentUserEmail = () => {
  const token = localStorage.getItem('auth_token')
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = JSON.parse(atob(base64UrlToBase64(parts[1])))
    return payload?.email || null
  } catch (error) {
    console.warn('Failed to parse auth token', error)
    return null
  }
}

const formatNameFromEmail = (email) => {
  if (!email) return 'Guest'
  const [userPart] = email.split('@')
  if (!userPart) return 'Guest'
  const cleaned = userPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return cleaned || 'Guest'
}

function SummarizerPage() {
  const navigate = useNavigate()
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')
  const [highlights, setHighlights] = useState({ overview: '', takeaways: [], keywords: [] })
  const [savedSummaries, setSavedSummaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [accountOpen, setAccountOpen] = useState(false)
  const [spaces, setSpaces] = useState([])
  const [currentSpace, setCurrentSpace] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    setUserEmail(getCurrentUserEmail())
  }, [])

  useEffect(() => {
    const key = getStorageKey(userEmail)
    const saved = localStorage.getItem(key)
    setSavedSummaries(saved ? JSON.parse(saved) : [])

    const spacesKey = getSpacesKey(userEmail)
    const savedSpaces = localStorage.getItem(spacesKey)
    const initialSpaces = savedSpaces ? JSON.parse(savedSpaces) : [{ id: 'default', name: 'My Space' }]
    setSpaces(initialSpaces)
    setCurrentSpace(initialSpaces[0])

    const chatKey = getChatKey(userEmail)
    const savedChat = localStorage.getItem(chatKey)
    setChatMessages(savedChat ? JSON.parse(savedChat) : [])
  }, [userEmail])

  useEffect(() => {
    const key = getStorageKey(userEmail)
    localStorage.setItem(key, JSON.stringify(savedSummaries))
  }, [savedSummaries, userEmail])

  useEffect(() => {
    const spacesKey = getSpacesKey(userEmail)
    localStorage.setItem(spacesKey, JSON.stringify(spaces))
  }, [spaces, userEmail])

  useEffect(() => {
    const chatKey = getChatKey(userEmail)
    localStorage.setItem(chatKey, JSON.stringify(chatMessages))
  }, [chatMessages, userEmail])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleSummarize = async () => {
    if (!noteText.trim()) {
      alert('Please enter some notes to summarize')
      return
    }

    setLoading(true)
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `
You are a study assistant. Read the notes and produce:
- "overview": 2-3 sentence concise overview
- "takeaways": 3-5 bullet key takeaways
- "keywords": 5-10 important keywords/terms
Respond only in JSON with keys: overview (string), takeaways (array of strings), keywords (array of strings).
Notes:
${noteText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const raw = response.text()
      const cleaned = raw.replace(/```json|```/g, '').trim()

      let parsed = { overview: '', takeaways: [], keywords: [] }
      try {
        parsed = JSON.parse(cleaned)
      } catch (error) {
        console.warn('Failed to parse structured response, falling back to raw text', error)
        parsed.overview = raw
      }

      const newSummary = {
        id: Date.now(),
        text: noteText,
        summary: parsed.overview || '',
        takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        date: new Date().toLocaleString()
      }

      setSummary(newSummary.summary)
      setHighlights({
        overview: newSummary.summary,
        takeaways: newSummary.takeaways,
        keywords: newSummary.keywords
      })
      setSavedSummaries([newSummary, ...savedSummaries])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate summary. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSummaries = () => {
    const key = getStorageKey(userEmail)
    localStorage.removeItem(key)
    setSavedSummaries([])
    setSummary('')
    setHighlights({ overview: '', takeaways: [], keywords: [] })
  }

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    navigate('/auth')
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const getTitle = (item) => {
    const source = item.summary || item.text || 'Untitled'
    const words = source.split(/\s+/).filter(Boolean).slice(0, 6).join(' ')
    return words || 'Untitled'
  }

  const displayName = formatNameFromEmail(userEmail)
  const goHome = () => navigate('/')

  const handleAddSpace = () => {
    const name = prompt('Name your space')
    if (!name) return
    const newSpace = { id: Date.now().toString(), name: name.trim() }
    const next = [...spaces, newSpace]
    setSpaces(next)
    setCurrentSpace(newSpace)
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const userMsg = { id: Date.now().toString(), role: 'user', text: chatInput.trim() }
    const aiMsg = {
      id: `${Date.now().toString()}-ai`,
      role: 'ai',
      text: "I'm here to help. Ask me to summarize, extract key ideas, or quiz you on your notes."
    }
    setChatMessages([userMsg, aiMsg, ...chatMessages])
    setChatInput('')
  }

  return (
    <div className="workspace-shell" data-theme={theme}>
      <div className="workspace-layout">
        <aside className="workspace-rail">
          <button type="button" className="workspace-brand" onClick={goHome}>Sage</button>
          <div className="workspace-nav">
            <button
              type="button"
              className="rail-link primary"
              onClick={() => {
                setNoteText('')
                setSummary('')
                setHighlights({ overview: '', takeaways: [], keywords: [] })
              }}
            >
              + New summary
            </button>
            <div className="rail-list">
              <p className="rail-label">Previous summaries</p>
              {savedSummaries.length === 0 && (
                <p className="rail-empty">No summaries yet</p>
              )}
              {savedSummaries.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rail-item"
                  onClick={() => {
                    setNoteText(item.text)
                    setSummary(item.summary)
                    setHighlights({
                      overview: item.summary,
                      takeaways: item.takeaways || [],
                      keywords: item.keywords || []
                    })
                  }}
                >
                  <span className="rail-item-title">{getTitle(item)}</span>
                  <span className="rail-item-date">{item.date}</span>
                </button>
              ))}
            </div>

            <div className="rail-list">
              <p className="rail-label">Spaces</p>
              <button type="button" className="rail-link" onClick={handleAddSpace}>
                + Create space
              </button>
              {spaces.map((space) => (
                <button
                  key={space.id}
                  type="button"
                  className={`rail-item ${currentSpace?.id === space.id ? 'active' : ''}`}
                  onClick={() => setCurrentSpace(space)}
                >
                  <span className="rail-item-title">{space.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="workspace-account">
            <button
              type="button"
              className="account-trigger"
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <div className="account-avatar">{(userEmail || 'U').slice(0, 1).toUpperCase()}</div>
              <div className="account-meta">
                <span className="account-label">Account</span>
                <strong title={userEmail || 'Guest'}>{displayName}</strong>
              </div>
              <span className="chevron">{accountOpen ? '▴' : '▾'}</span>
            </button>

            {accountOpen && (
              <div className="account-menu">
                <button type="button" className="menu-item" onClick={handleClearSummaries}>
                  Clear summaries
                </button>
                <button type="button" className="menu-item">
                  Settings
                </button>
                <div className="menu-divider" />
                <div className="menu-item theme-row">
                  <span>Dark mode</span>
                  <button
                    type="button"
                    className={`theme-toggle ${theme === 'dark' ? 'on' : 'off'}`}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    <span className="thumb" />
                  </button>
                </div>
                <div className="menu-divider" />
                <button type="button" className="menu-item danger" onClick={handleSignOut}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="workspace-main">
          <div className="workspace-hero">
            <div>
              <p className="muted">What should we learn, {displayName.toLowerCase()}?</p>
              <h1 className="hero-title">{currentSpace ? currentSpace.name : 'Workspace'}</h1>
            </div>
            <div className="action-cards">
              <button type="button" className="action-card">
                <span className="action-icon">⭱</span>
                <div>
                  <div className="action-title">Upload</div>
                  <div className="action-sub">File, audio, video</div>
                </div>
              </button>
              <button type="button" className="action-card">
                <span className="action-icon">🔗</span>
                <div>
                  <div className="action-title">Link</div>
                  <div className="action-sub">YouTube, Website</div>
                </div>
              </button>
              <button type="button" className="action-card">
                <span className="action-icon">📋</span>
                <div>
                  <div className="action-title">Paste</div>
                  <div className="action-sub">Copied text</div>
                </div>
              </button>
              <button type="button" className="action-card">
                <span className="action-icon">🎙</span>
                <div>
                  <div className="action-title">Record</div>
                  <div className="action-sub">Record lecture</div>
                </div>
              </button>
            </div>
          </div>

          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <p className="muted">AI Tutor</p>
                <strong>Ask questions about your notes</strong>
              </div>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <p className="muted">No messages yet. Ask anything to start.</p>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                  <span className="chat-role">{msg.role === 'user' ? 'You' : 'Sage'}</span>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Ask Sage to explain, summarize, or quiz you..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>

          <div className="session-bar">
            <div className="session-info">
              <span className="session-label">Signed in as</span>
              <strong title={userEmail || 'Guest'}>{displayName}</strong>
            </div>
            <div className="session-actions">
              <button type="button" className="ghost-btn" onClick={handleClearSummaries}>
                Clear summaries
              </button>
              <button type="button" className="ghost-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>

          <div className="input-section">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Paste your lecture notes, study materials, or any text you want summarized..."
              rows="10"
            />

            <button
              className="action-btn"
              onClick={handleSummarize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span>AI</span>
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <span>{'->'}</span>
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>

          {(summary || highlights.takeaways.length > 0 || highlights.keywords.length > 0) && (
            <div className="summary">
              <div className="summary-header">
                <h3>
                  <span>*</span>
                  <span>AI Overview</span>
                </h3>
                <span className="summary-sub">Topic overview, takeaways, keywords</span>
              </div>

              {summary && (
                <p className="summary-overview">{summary}</p>
              )}

              <div className="summary-grid">
                {highlights.takeaways.length > 0 && (
                  <div className="summary-card">
                    <h4>Key takeaways</h4>
                    <ul>
                      {highlights.takeaways.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {highlights.keywords.length > 0 && (
                  <div className="summary-card">
                    <h4>Keywords</h4>
                    <div className="keywords">
                      {highlights.keywords.map((word, idx) => (
                        <span key={idx} className="keyword-chip">{word}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="saved-summaries">
            <h2>
              <span>*</span>
              <span>Your Summaries</span>
            </h2>
            {savedSummaries.length === 0 ? (
              <p className="no-summaries">
                No saved summaries yet. Create your first AI summary above!
              </p>
            ) : (
              savedSummaries.map(item => (
                <div key={item.id} className="saved-summary-item">
                  <small>* {item.date}</small>
                  <p><strong>Original Notes:</strong> {item.text.substring(0, 150)}{item.text.length > 150 ? '...' : ''}</p>
                  <p><strong>AI Overview:</strong> {item.summary}</p>
                  {item.takeaways?.length > 0 && (
                    <div className="saved-takeaways">
                      <strong>Takeaways:</strong>
                      <ul>
                        {item.takeaways.map((take, idx) => (
                          <li key={idx}>{take}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.keywords?.length > 0 && (
                    <p><strong>Keywords:</strong> {item.keywords.join(', ')}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SummarizerPage
