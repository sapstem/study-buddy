import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ROTATING_WORDS = ['summaries', 'flashcards', 'study guides', 'notes', 'quizzes']

function LandingPage() {
  const navigate = useNavigate()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // typing animation effect
  useEffect(() => {
    const word = ROTATING_WORDS[currentWordIndex]
    const typingSpeed = isDeleting ? 50 : 100
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < word.length) {
          setCurrentText(word.substring(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 1500)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((currentWordIndex + 1) % ROTATING_WORDS.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, currentWordIndex])

  return (
    <div className="App">
      <h1>
        An AI tutor made for{' '}
        <span className="typing-container">
          <span className="typing-text" data-text={currentText}>
            {currentText}
          </span>
        </span>
        <span className="cursor">|</span>
      </h1>
      <p className="subtitle">
        Transform your notes into summaries, flashcards, and study guides in seconds
      </p>
      
      <div className="cta-group">
        <button className="cta-primary" onClick={() => navigate('/summarizer')}>
          Start Learning
        </button>
      </div>
    </div>
  )
}

export default LandingPage