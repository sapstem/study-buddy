import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

function summarizerPage() {
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')
  const [savedSummaries, setSavedSummaries] = useState([])
  const [loading, setLoading] = useState(false)

  // localstorage effects
  useEffect(() => {
    const saved = localStorage.getItem('summaries')
    if (saved) {
      setSavedSummaries(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (savedSummaries.length > 0) {
      localStorage.setItem('summaries', JSON.stringify(savedSummaries))
    }
  }, [savedSummaries])

  const handleSummarize = async () => {
    if (!noteText.trim()) {
      alert('Please enter some notes to summarize')
      return
    }

    setLoading(true)
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `Summarize the following notes in a concise way:\n\n${noteText}`
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const summaryText = response.text()
      
      const newSummary = {
        id: Date.now(),
        text: noteText,
        summary: summaryText,
        date: new Date().toLocaleString()
      }
      
      setSummary(summaryText)
      setSavedSummaries([newSummary, ...savedSummaries])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate summary. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-section">
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
              <span>⏳</span>
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Generate Summary</span>
            </>
          )}
        </button>
      </div>

      {summary && (
        <div className="summary">
          <h3>
            <span>💡</span>
            <span>AI Summary</span>
          </h3>
          <p>{summary}</p>
        </div>
      )}

      <div className="saved-summaries">
        <h2>
          <span>📚</span>
          <span>Your Summaries</span>
        </h2>
        {savedSummaries.length === 0 ? (
          <p className="no-summaries">
            No saved summaries yet. Create your first AI summary above!
          </p>
        ) : (
          savedSummaries.map(item => (
            <div key={item.id} className="saved-summary-item">
              <small>📅 {item.date}</small>
              <p><strong>Original Notes:</strong> {item.text.substring(0, 150)}{item.text.length > 150 ? '...' : ''}</p>
              <p><strong>AI Summary:</strong> {item.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SummarizerPage