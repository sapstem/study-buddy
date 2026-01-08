import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import AuthPage from './AuthPage'
import SummarizerPage from './SummarizerPage'
import './App.css'
import ConversationView from './ConversationView'

function RequireAuth({ children }) {
  const token = localStorage.getItem('auth_token')
  return token ? children : <Navigate to="/auth" replace />
}

function AppFrame() {
  const location = useLocation()
  const isSummarizer = location.pathname.startsWith('/summarizer')

  return (
    <>
      {!isSummarizer && (
        <>
          <video autoPlay loop muted playsInline className="video-background">
            <source src="/background.mp4" type="video/mp4" />
          </video>

          <nav className="nav">
            <Link to="/" className="logo">Sage</Link>
            <Link to="/auth">
              <button className="nav-cta">Get Started</button>
            </Link>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/summarizer" element={(
          <RequireAuth>
            <SummarizerPage />
          </RequireAuth>
        )}
        />
        <Route path="/conversation/:id" element={(
          <RequireAuth>
            <ConversationView />
          </RequireAuth>
        )}
        />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppFrame />
    </BrowserRouter>
  )
}

export default App
