import { useState } from 'react'
import './RecordModal.css'

function RecordModal({ isOpen, onClose }) {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (e) => {
        setAudioChunks(prev => [...prev, e.data])
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        // TODO: Send to transcription or save
        console.log('Recording saved:', audioUrl)
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Please allow microphone access')
    }
  }

  const startBrowserTabRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        audio: true,
        video: true 
      })
      
      const audioStream = new MediaStream(stream.getAudioTracks())
      const recorder = new MediaRecorder(audioStream)
      
      recorder.ondataavailable = (e) => {
        setAudioChunks(prev => [...prev, e.data])
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        console.log('Tab audio saved:', audioUrl)
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Screen capture denied:', error)
      alert('Please allow screen/tab sharing')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      setAudioChunks([])
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Lecture</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!isRecording ? (
          <div className="recording-options">
            <button className="option-card" onClick={startMicRecording}>
              <div className="option-icon">🎤</div>
              <div className="option-text">
                <h3>Microphone</h3>
                <p>Record your voice or class</p>
              </div>
            </button>

            <button className="option-card" onClick={startBrowserTabRecording}>
              <div className="option-icon">💻</div>
              <div className="option-text">
                <h3>Browser Tab</h3>
                <p>Capture audio playing in a browser tab</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="recording-active">
            <div className="recording-indicator">
              <div className="pulse"></div>
              <span>Recording...</span>
            </div>
            <button className="stop-btn" onClick={stopRecording}>
              Stop Recording
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordModal