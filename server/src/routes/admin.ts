import { Router } from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  res.json([])
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'User updated' })
})

// GET /api/admin/winners
router.get('/winners', authenticateToken, requireAdmin, (req, res) => {
  res.json([])
})

// PATCH /api/admin/winners/:id/verify
router.patch('/winners/:id/verify', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Winner verified' })
})

// PATCH /api/admin/winners/:id/payout
router.patch('/winners/:id/payout', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Payout marked' })
})

// GET /api/admin/reports
router.get('/reports', authenticateToken, requireAdmin, (req, res) => {
  res.json({})
})

export default router
