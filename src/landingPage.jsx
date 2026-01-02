import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

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
    <div className="landing-page">
      {/* Hero Section - Your existing content */}
      <section className="hero-section">
        <h1 className="hero-title">
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
          <button className="cta-primary" onClick={() => navigate('/auth')}>
            Start Learning
          </button>
        </div>
      </section>

      {/* New Features Section - Add this below */}
      <section className="features-section">
        <h2 className="section-title">Powerful Learning Features</h2>
        <p className="section-subtitle">Everything you need to study smarter</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Summarizer</h3>
            <p>Get concise summaries of long lectures, articles, or textbooks in seconds. Perfect for quick reviews.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎴</div>
            <h3>Smart Flashcards</h3>
            <p>Automatically generate flashcards from your notes with spaced repetition for better retention.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your learning progress with detailed analytics and personalized study recommendations.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Quick Study Guides</h3>
            <p>Generate study guides with key concepts, important dates, and practice questions tailored to you.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Paste Your Notes</h3>
            <p>Copy and paste any text - lecture notes, articles, or textbook excerpts</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Magic</h3>
            <p>Our AI analyzes your content and identifies key concepts</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Results</h3>
            <p>Receive summaries, flashcards, and study guides instantly</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <h3>Study & Review</h3>
            <p>Use the generated materials to study efficiently</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <h2>Ready to Transform Your Study Habits?</h2>
        <p>Join students who are already learning smarter with AI</p>
        <button className="cta-primary" onClick={() => navigate('/auth')}>
          Start Learning Now
        </button>
      </section>
    </div>
  )
}

export default LandingPage