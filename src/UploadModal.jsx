import { useState } from 'react'
import './RecordModal.css' // Reuse same styles

function UploadModal({ isOpen, onClose, onUpload }) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    
    // Read file content
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target.result
      onUpload(content, file.name)
      setUploading(false)
      onClose()
    }
    
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload File</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!uploading ? (
          <div className="recording-options">
            <label className="option-card" style={{ cursor: 'pointer' }}>
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="option-icon">📄</div>
              <div className="option-text">
                <h3>Choose File</h3>
                <p>Upload .txt, .pdf, .doc, .docx</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="recording-active">
            <div className="recording-indicator">
              <div className="pulse"></div>
              <span>Uploading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadModal