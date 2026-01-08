import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
const port = process.env.PORT || 5175
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// In-memory user store for now. Replace with a database when ready.
const users = new Map()

const issueToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' })
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  if (users.has(email)) {
    return res.status(409).json({ error: 'Email already exists.' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = { id: Date.now().toString(), email, password: hashed, provider: 'local' }
  users.set(email, user)

  const token = issueToken(user)
  res.status(201).json({ token, user: { email: user.email } })
})

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body || {}

  const user = users.get(email)
  if (!user || user.provider != 'local') {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const matches = await bcrypt.compare(password, user.password)
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const token = issueToken(user)
  res.json({ token, user: { email: user.email } })
})

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {}

  if (!googleClient) {
    return res.status(500).json({ error: 'Google auth is not configured.' })
  }

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' })
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    })

    const payload = ticket.getPayload() || {}
    const email = payload.email
    const googleId = payload.sub

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google account is missing email.' })
    }

    let user = users.get(email)
    if (user && user.provider == 'local') {
      return res.status(409).json({ error: 'Email already registered with password.' })
    }

    if (!user) {
      user = { id: googleId, email, provider: 'google' }
      users.set(email, user)
    }

    const token = issueToken(user)
    res.json({ token, user: { email: user.email } })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(401).json({ error: 'Invalid Google credential.' })
  }
})

app.post('/api/fetch-url', async (req, res) => {
  const { url } = req.body || {}

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' })
  }

  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Only http/https URLs are allowed.' })
  }

  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' })
    if (!response.ok) {
      return res.status(400).json({ error: `Unable to fetch URL (status ${response.status})` })
    }
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text')) {
      return res.status(400).json({ error: 'URL must return text content.' })
    }
    let text = await response.text()
    // Trim excessively long responses
    const MAX_LEN = 50000
    if (text.length > MAX_LEN) {
      text = text.slice(0, MAX_LEN)
    }
    res.json({ content: text })
  } catch (error) {
    console.error('Fetch URL error:', error)
    res.status(500).json({ error: 'Failed to fetch URL.' })
  }
})

app.listen(port, () => {
  console.log(`Auth server running on http://localhost:${port}`)
})
