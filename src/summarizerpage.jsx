import React from 'react'  // FIX
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

const getStorageKey = (email) => (email ? `summaries:${email}` : 'summaries:anon')

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

function SummarizerPage() {
  const navigate = useNavigate()
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')
  const [highlights, setHighlights] = useState({ overview: '', takeaways: [], keywords: [] })
  const [savedSummaries, setSavedSummaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState(null)

  useEffect(() => {
    setUserEmail(getCurrentUserEmail())
  }, [])

  useEffect(() => {
    const key = getStorageKey(userEmail)
    const saved = localStorage.getItem(key)
    setSavedSummaries(saved ? JSON.parse(saved) : [])
  }, [userEmail])

  useEffect(() => {
    const key = getStorageKey(userEmail)
    localStorage.setItem(key, JSON.stringify(savedSummaries))
  }, [savedSummaries, userEmail])

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

  return (
    <div className="app-section">
      <div className="session-bar">
        <div className="session-info">
          <span className="session-label">Signed in as</span>
          <strong>{userEmail || 'Guest'}</strong>
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
    </div>
  )
}

export default SummarizerPage
