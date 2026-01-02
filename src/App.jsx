import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import LandingPage from './LandingPage'
import AuthPage from './AuthPage'
import SummarizerPage from './SummarizerPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <video autoPlay loop muted playsInline className="video-background">
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <nav className="nav">
        <Link to="/" className="logo">Sage</Link>
        <Link to="/auth">
          <button className="nav-cta">Get Started</button>
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/summarizer" element={<SummarizerPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App