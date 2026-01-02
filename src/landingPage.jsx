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
          A smarter way to study for{' '}
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
  <h2 className="section-title">Smarter ways to review, all in one place</h2>
  <p className="section-subtitle">Upload your material once, and get clean summaries, highlighted key concepts, flashcards, quizzes, and a chat tutor that sticks to your content.</p>

  <div className="features-grid">
    <div className="feature-card">
      <div className="feature-icon">SUM</div>
      <h3>Clear summaries</h3>
      <p>Distilled topic overviews that surface key ideas without the noise.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">KEY</div>
      <h3>Keyword highlights</h3>
      <p>Instant key takeaways for quick revision and class recaps.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">CARD</div>
      <h3>Flashcards</h3>
      <p>Active recall practice generated from your notes to lock it in.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">QUIZ</div>
      <h3>Exam quizzes</h3>
      <p>Self-testing with targeted questions so you know what sticks.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">CHAT</div>
      <h3>AI chat tutor</h3>
      <p>Ask questions and get answers grounded in your uploaded content.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">SYNC</div>
      <h3>Topic overviews</h3>
      <p>Organized breakdowns by concept so you can study by theme.</p>
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

      <footer className="site-footer">
        <div className="footer-brand">
          <h3>Sage</h3>
          <p>AI-powered study support built for clarity, speed, and confidence.</p>
        </div>
        <div className="footer-links">
          <a href="#">Blogs</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact Us</a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sage. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
