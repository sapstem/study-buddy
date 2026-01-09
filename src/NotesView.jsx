import { useState, useEffect } from 'react'
import './NotesView.css'

function NotesView({ conversation }) {
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('Untitled Document')

  useEffect(() => {
    // Load notes and title from localStorage
    const notesKey = `notes:${conversation.id}`
    const titleKey = `notes-title:${conversation.id}`
    
    const savedNotes = localStorage.getItem(notesKey)
    const savedTitle = localStorage.getItem(titleKey)
    
    if (savedNotes) {
      setNotes(savedNotes)
    } else {
      setNotes(conversation.text)
    }
    
    if (savedTitle) {
      setTitle(savedTitle)
    } else {
      // Use first 50 chars as default title
      const defaultTitle = conversation.text.slice(0, 50).trim() || 'Untitled Document'
      setTitle(defaultTitle)
    }
  }, [conversation.id, conversation.text])

  const handleNotesChange = (e) => {
    const content = e.target.value
    setNotes(content)
    
    // Auto-save
    const key = `notes:${conversation.id}`
    localStorage.setItem(key, content)
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    // Auto-save title
    const key = `notes-title:${conversation.id}`
    localStorage.setItem(key, newTitle)
  }

  return (
    <div className="notes-editor-page">
      <input
        type="text"
        className="notes-title-input"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled Document"
      />
      
      <textarea
        className="notes-textarea"
        value={notes}
        onChange={handleNotesChange}
        placeholder="Start typing..."
        spellCheck="true"
      />
    </div>
  )
}

export default NotesView