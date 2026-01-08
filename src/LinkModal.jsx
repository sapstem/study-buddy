import { useState } from 'react'
import './RecordModal.css'

function LinkModal({ isOpen, onClose, onSubmit }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!url.trim()) return
    
    setLoading(true)
    await onSubmit(url)
    setLoading(false)
    setUrl('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Link</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 0' }}>
          <input
            type="url"
            placeholder="Paste YouTube or website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!url.trim() || loading}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '14px',
              background: '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: (!url.trim() || loading) ? 0.5 : 1
            }}
          >
            {loading ? 'Loading...' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkModal