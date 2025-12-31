import { useState } from 'react'
import './App.css'

function App() {
  const [noteText, setNoteText] = useState('')
  const [summary, setSummary] = useState('')

  const handleSummarize = () => {
    // For now, just a fake summary
    setSummary('This is a summary of your notes')
  }

  return (
    <div className="App">
      <h1>Note Summarizer</h1>
      <textarea 
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Paste your notes here..."
        rows="10"
        style={{ width: '100%', padding: '10px' }}
      />
      <button onClick={handleSummarize}>Summarize</button>
      {summary && (
        <div className="summary" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  )
}

export default App