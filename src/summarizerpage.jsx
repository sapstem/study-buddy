import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleGenerativeAI } from '@google/generative-ai'
import RecordModal from './RecordModal'
import './SummarizerPage.css'
import UploadModal from './UploadModal'
import LinkModal from './LinkModal'
import PasteModal from './PasteModal'

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

const loadSummaries = (name) => {
  const key = name ? `summaries:${name}` : 'summaries:anon'
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : []
}

const saveSummaries = (name, items) => {
  const key = name ? `summaries:${name}` : 'summaries:anon'
  localStorage.setItem(key, JSON.stringify(items))
}

function SummarizerPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('Guest')
  const [noteText, setNoteText] = useState('')
  const [savedSummaries, setSavedSummaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [overview, setOverview] = useState('')
  const [takeaways, setTakeaways] = useState([])
  const [keywords, setKeywords] = useState([])
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)

  useEffect(() => {
    const name = getDisplayName()
    setDisplayName(name)
    const items = loadSummaries(name)
    setSavedSummaries(items)
  }, [])

  useEffect(() => {
    saveSummaries(displayName, savedSummaries)
  }, [displayName, savedSummaries])

  const runSummarize = async () => {
    if (!noteText.trim()) {
      setStatus('Enter some text first.')
      return
    }
    if (!genAI) {
      setStatus('Missing API key.')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `
You are a study assistant. Read the notes and produce JSON:
{ "overview": "2-3 sentences", "takeaways": ["bullet1","bullet2","bullet3"], "keywords": ["k1","k2","k3"] }
Notes:
${noteText}`
      const result = await model.generateContent(prompt)
      const response = await result.response
      const raw = response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(raw)

      const newItem = {
        id: Date.now(),
        text: noteText.trim(),
        summary: parsed.overview || '',
        takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        date: new Date().toLocaleString()
      }

      setOverview(newItem.summary)
      setTakeaways(newItem.takeaways)
      setKeywords(newItem.keywords)
      setSavedSummaries([newItem, ...savedSummaries])
      navigate(`/conversation/${newItem.id}`)
    } catch (error) {
      console.error(error)
      setStatus('Failed to summarize.')
    } finally {
      setLoading(false)
    }
  }

  // HANDLERS
  const handleUpload = (content, filename) => {
    setNoteText(content)
    setStatus(`Loaded: ${filename}`)
  }

  const handleLink = async (url) => {
    setLoading(true)
    setStatus('Fetching content from URL...')
    
    try {
      // Use Jina AI Reader to convert URL to markdown
      const jinaUrl = `https://r.jina.ai/${url}`
      const response = await fetch(jinaUrl)
      const markdown = await response.text()
      
      if (markdown && markdown.length > 50) {
        setNoteText(markdown)
        setStatus(`Loaded content from: ${url}`)
      } else {
        throw new Error('No content found')
      }
    } catch (error) {
      console.error('Failed to fetch URL:', error)
      setStatus('Failed to fetch URL. Please copy/paste the content manually.')
      setNoteText(url)
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = (text) => {
    setNoteText(text)
  }

  return (
    <div className="studio-shell">
      <aside className="studio-rail">
        <div className="studio-header">
          <div className="logo-mark">S</div>
          <span className="logo-name">Iris</span>
        </div>

        <div className="studio-section">
          <button
            className="studio-link active"
            onClick={() => {
              setNoteText('')
              setOverview('')
              setTakeaways([])
              setKeywords([])
            }}
          >
            + Add content
          </button>
          <button className="studio-link">🔍 Search</button>
          <button className="studio-link">🕐 History</button>
        </div>

        <div className="studio-section">
          <p className="studio-label">Spaces</p>
          <button className="studio-link">+ Create Space</button>
          <button className="studio-link active">{displayName}'s Space</button>
        </div>

        <div className="studio-section">
          <p className="studio-label">Recents</p>
          {savedSummaries.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className="studio-link"
              onClick={() => {
                setOverview(item.summary || '')
                setTakeaways(item.takeaways || [])
                setKeywords(item.keywords || [])
                setNoteText(item.text)
              }}
            >
              {item.text.slice(0, 25) || 'Summary'}...
            </button>
          ))}
        </div>

        <div className="user-profile">
          <div className="user-avatar"></div>
          <span className="user-name">{displayName}</span>
        </div>
      </aside>

      <main className="studio-main">
        <div className="studio-hero">
          <h1>Hey {displayName}, ready to learn?</h1>

          <div className="action-row">
            <div className="action-tile" onClick={() => setShowUploadModal(true)}>
              <div className="icon">⭱</div>
              <div>
                <p className="title">Upload</p>
                <p className="sub">File, audio, video</p>
              </div>
            </div>
            <div className="action-tile" onClick={() => setShowLinkModal(true)}>
              <div className="icon">🔗</div>
              <div>
                <p className="title">Link</p>
                <p className="sub">YouTube, Website</p>
              </div>
            </div>
            <div className="action-tile" onClick={() => setShowPasteModal(true)}>
              <div className="icon">📋</div>
              <div>
                <p className="title">Paste</p>
                <p className="sub">Copied Text</p>
              </div>
            </div>
            <div className="action-tile" onClick={() => setShowRecordModal(true)}>
              <div className="icon">🎙</div>
              <div>
                <p className="title">Record</p>
                <p className="sub">Record Lecture</p>
              </div>
            </div>
          </div>

          <div className="prompt-bar">
            <input
              type="text"
              placeholder="Learn anything"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && runSummarize()}
            />
            <div className="prompt-controls">
            </div>
            <button className="send-btn" onClick={runSummarize} disabled={loading}>
              ↑
            </button>
          </div>

          {status && <p className="muted">{status}</p>}

          {(overview || takeaways.length > 0 || keywords.length > 0) && (
            <div className="summary-output">
              {overview && <p className="summary-overview">{overview}</p>}
              <div className="summary-grid">
                {takeaways.length > 0 && (
                  <div>
                    <p className="summary-heading">Takeaways</p>
                    <ul>
                      {takeaways.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {keywords.length > 0 && (
                  <div>
                    <p className="summary-heading">Keywords</p>
                    <div className="keyword-chips">
                      {keywords.map((k, i) => <span key={i} className="chip">{k}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="spaces-area">
          <div className="spaces-header">
            <h2>Spaces</h2>
            <span className="muted">Newest ▼</span>
          </div>
          <div className="spaces-grid">
            <div className="space-card dashed">＋</div>
            {savedSummaries.slice(0, 3).map((item) => (
              <div key={item.id} className="space-card">
                <p className="space-title">{item.text.slice(0, 50)}</p>
                <p className="space-sub">{item.date}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      <LinkModal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)}
        onSubmit={handleLink}
      />

      <PasteModal 
        isOpen={showPasteModal} 
        onClose={() => setShowPasteModal(false)}
        onPaste={handlePaste}
      />

      <RecordModal 
        isOpen={showRecordModal} 
        onClose={() => setShowRecordModal(false)} 
      />
    </div>
  )
}

export default SummarizerPage