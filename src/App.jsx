import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')
  const [savedSummaries, setSavedSummaries] = useState([])

  // Load saved summaries from localStorage when app starts
  useEffect(() => {
    const saved = localStorage.getItem('summaries')
    if (saved) {
      setSavedSummaries(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage whenever savedSummaries changes
  useEffect(() => {
    if (savedSummaries.length > 0) {
      localStorage.setItem('summaries', JSON.stringify(savedSummaries))
    }
  }, [savedSummaries])

  const handleSummarize = () => {
    const newSummary = {
      id: Date.now(),
      text: noteText,
      summary: 'This is a summary of your notes',
      date: new Date().toLocaleString()
    }
    setSummary(newSummary.summary)
    setSavedSummaries([newSummary, ...savedSummaries])
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
      
      <button onClick={handleSummarize} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Summarize
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