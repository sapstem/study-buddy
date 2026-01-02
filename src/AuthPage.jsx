import { useState } from 'react'
import './AuthPage.css'

function AuthPage() {
  const [mode, setMode] = useState('signin')

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

        <button className="auth-google" type="button">
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="????????" />

          <button className="auth-submit" type="button">
            {mode == 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

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

export default AuthPage
