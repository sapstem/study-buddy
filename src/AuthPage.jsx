import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AuthPage() {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus('Missing Google client ID. Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.')
      return
    }

    const existingScript = document.querySelector('script[data-google-identity]')
    if (existingScript) {
      initializeGoogle()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = initializeGoogle
    script.onerror = () => setStatus('Failed to load Google Identity Services.')
    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.onerror = null
    }
  }, [])

  const initializeGoogle = () => {
    if (!window.google || !googleButtonRef.current) {
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential
    })

    googleButtonRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'continue_with'
    })

    setGoogleReady(true)
  }

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setStatus('Google sign-in failed. Please try again.')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const result = await postJson('/api/auth/google', { credential: response.credential })
      localStorage.setItem('auth_token', result.token)
      navigate('/summarizer')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()

    if (!email || !password) {
      setStatus('Email and password are required.')
      return
    }

    setLoading(true)
    setStatus('')

    const endpoint = mode == 'signin' ? '/api/auth/signin' : '/api/auth/signup'

    try {
      const result = await postJson(endpoint, { email, password })
      localStorage.setItem('auth_token', result.token)
      navigate('/summarizer')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">Sage</p>
        <h1>{mode == 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-subtitle">
          {mode == 'signin'
            ? 'Sign in to access your summaries and study tools.'
            : 'Sign up to save summaries and sync across devices.'}
        </p>

        <div className="auth-google" ref={googleButtonRef} />
        {!googleReady && (
          <button className="auth-google-fallback" type="button" disabled>
            Loading Google sign-in...
          </button>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={handleEmailSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Working...' : mode == 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {status && <p className="auth-status">{status}</p>}

        <p className="auth-footer">
          {mode == 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            className="auth-link"
            type="button"
            onClick={() => setMode(mode == 'signin' ? 'signup' : 'signin')}
          >
            {mode == 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const postJson = async (path, payload) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  let data = null
  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || 'Request failed.'
    throw new Error(message)
  }

  return data
}

export default AuthPage
