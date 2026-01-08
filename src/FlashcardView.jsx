import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './FlashcardView.css'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

function FlashcardView({ conversation }) {
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    // Load flashcards from localStorage
    const key = `flashcards:${conversation.id}`
    const saved = localStorage.getItem(key)
    
    if (saved) {
      setFlashcards(JSON.parse(saved))
    }
  }, [conversation.id])

  const generateFlashcards = async () => {
    if (!genAI) {
      alert('Missing API key')
      return
    }

    setLoading(true)
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      const prompt = `
You are a study assistant creating flashcards. Based on the following content, create 5-10 flashcards.

Content:
${conversation.text}

Summary: ${conversation.summary}

Create flashcards in JSON format:
[
  { "question": "What is...", "answer": "..." },
  { "question": "Define...", "answer": "..." }
]

Make questions clear and answers concise. Focus on key concepts, definitions, and important facts.
Return ONLY valid JSON array, no markdown formatting.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text().replace(/```json|```/g, '').trim()
      const cards = JSON.parse(text)

      // Save to localStorage
      const key = `flashcards:${conversation.id}`
      localStorage.setItem(key, JSON.stringify(cards))
      
      setFlashcards(cards)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Failed to generate flashcards:', error)
      alert('Failed to generate flashcards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  if (loading) {
    return (
      <div className="flashcard-loading">
        <div className="loading-spinner"></div>
        <p>Generating flashcards...</p>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="flashcard-empty">
        <div className="empty-icon">🃏</div>
        <h2>No Flashcards Yet</h2>
        <p>Generate flashcards from your content to start studying.</p>
        <button className="generate-btn" onClick={generateFlashcards}>
          Generate Flashcards
        </button>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <h3>Flashcards</h3>
        <div className="flashcard-actions">
          <span className="card-counter">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <button className="regenerate-btn" onClick={generateFlashcards}>
            🔄 Regenerate
          </button>
        </div>
      </div>

      <div className="flashcard-wrapper">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-front">
            <div className="card-label">Question</div>
            <div className="card-content">
              {currentCard.question}
            </div>
            <div className="flip-hint">Click to flip</div>
          </div>
          <div className="flashcard-back">
            <div className="card-label">Answer</div>
            <div className="card-content">
              {currentCard.answer}
            </div>
            <div className="flip-hint">Click to flip</div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button 
          className="nav-btn prev" 
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
        >
          ← Previous
        </button>
        <button 
          className="nav-btn next" 
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default FlashcardView