import { useState } from 'react'
import './RecordModal.css'

function PasteModal({ isOpen, onClose, onPaste }) {
  const [text, setText] = useState('')

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setText(clipboardText)
    } catch (err) {
      console.log('Failed to read clipboard')
    }
  }

  const handleSubmit = () => {
    if (text.trim()) {
      onPaste(text)
      setText('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Paste Text</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 0' }}>
          <textarea
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '14px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={handlePaste}
              style={{
                flex: 1,
                padding: '14px',
                background: '#f5f5f5',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Paste from Clipboard
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              style={{
                flex: 1,
                padding: '14px',
                background: '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: !text.trim() ? 0.5 : 1
              }}
            >
              Add Text
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PasteModal