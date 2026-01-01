import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './App.css'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

function App() {
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')
  const [savedSummaries, setSavedSummaries] = useState([])
  const [loading, setLoading] = useState(false)

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
    <div className="App">
      <h1>Note Summarizer</h1>
      
      <textarea 
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Paste your notes here..."
        rows="10"
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      
      <button 
        onClick={handleSummarize} 
        disabled={loading}
        style={{ padding: '10px 20px', cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {summary && (
        <div className="summary" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>Saved Summaries</h2>
        {savedSummaries.length === 0 ? (
          <p>No saved summaries yet</p>
        ) : (
          savedSummaries.map(item => (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
              <small>{item.date}</small>
              <p><strong>Notes:</strong> {item.text.substring(0, 100)}...</p>
              <p><strong>Summary:</strong> {item.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App