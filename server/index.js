import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
const port = process.env.PORT || 5175
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'

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

// Placeholder: expects { email, googleId } until OAuth is wired up.
app.post('/api/auth/google', (req, res) => {
  const { email, googleId } = req.body || {}

  if (!email || !googleId) {
    return res.status(400).json({ error: 'Email and Google ID are required.' })
  }

  let user = users.get(email)
  if (!user) {
    user = { id: googleId, email, provider: 'google' }
    users.set(email, user)
  }

  const token = issueToken(user)
  res.json({ token, user: { email: user.email } })
})

app.listen(port, () => {
  console.log(`Auth server running on http://localhost:${port}`)
})
