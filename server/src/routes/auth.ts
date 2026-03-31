import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../services/database'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to generate JWT
const generateToken = (userId: string, email: string, role: string = 'user') => {
  return jwt.sign(
    { sub: userId, email, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  )
}

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user exists
    const existingResult = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    // Create user (without Supabase auth, we store password directly)
    const result = await query(
      'INSERT INTO users (id, email, full_name, role, is_active, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, role',
      [userId, email, fullName, 'user', true, hashedPassword]
    )

    const user = result.rows[0]

    // Generate token
    const token = generateToken(userId, email, 'user')

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Signup failed' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Find user
    const result = await query(
      'SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // In a production app, you might invalidate the token here
  res.json({ message: 'Logged out successfully' })
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      'SELECT id, email, full_name, role FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = generateToken(req.user.id, req.user.email, req.user.role)
  res.json({ token })
})

export default router
