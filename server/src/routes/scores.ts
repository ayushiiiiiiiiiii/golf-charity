import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../services/database'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to enforce 5-score rolling window
const enforceRollingWindow = async (userId: string) => {
  const result = await query(
    `SELECT id FROM golf_scores WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  )

  const countResult = await query(`SELECT COUNT(*) as count FROM golf_scores WHERE user_id = $1`, [
    userId,
  ])

  if (parseInt(countResult.rows[0].count) >= 5 && result.rows.length > 0) {
    await query(`DELETE FROM golf_scores WHERE id = $1`, [result.rows[0].id])
  }
}

// POST /api/scores
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { score, scoreDate } = req.body

    if (!score || !scoreDate) {
      return res.status(400).json({ error: 'Score and date required' })
    }

    if (score < 1 || score > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45' })
    }

    const inputDate = new Date(scoreDate)
    if (inputDate > new Date()) {
      return res.status(400).json({ error: 'Cannot enter future dates' })
    }

    // Enforce rolling window
    await enforceRollingWindow(req.user.id)

    // Insert new score
    const result = await query(
      `INSERT INTO golf_scores (id, user_id, score, score_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, score, score_date, created_at`,
      [uuidv4(), req.user.id, score, inputDate.toISOString().split('T')[0]]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create score error:', error)
    res.status(500).json({ error: 'Failed to create score' })
  }
})

// GET /api/scores
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      `SELECT id, score, score_date, created_at, updated_at
       FROM golf_scores
       WHERE user_id = $1
       ORDER BY score_date DESC
       LIMIT 5`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get scores error:', error)
    res.status(500).json({ error: 'Failed to fetch scores' })
  }
})

// PATCH /api/scores/:id
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { score, scoreDate } = req.body

    if (!score) {
      return res.status(400).json({ error: 'Score required' })
    }

    if (score < 1 || score > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45' })
    }

    // Check ownership
    const checkResult = await query(
      `SELECT user_id FROM golf_scores WHERE id = $1`,
      [req.params.id]
    )

    if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== req.user.id) {
      return res.status(404).json({ error: 'Score not found' })
    }

    const updateDate = scoreDate
      ? new Date(scoreDate).toISOString().split('T')[0]
      : undefined

    const result = await query(
      `UPDATE golf_scores
       SET score = $1 ${updateDate ? ', score_date = $2' : ''}, updated_at = NOW()
       WHERE id = $3
       RETURNING id, score, score_date, created_at, updated_at`,
      updateDate ? [score, updateDate, req.params.id] : [score, req.params.id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update score error:', error)
    res.status(500).json({ error: 'Failed to update score' })
  }
})

// DELETE /api/scores/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check ownership
    const checkResult = await query(
      `SELECT user_id FROM golf_scores WHERE id = $1`,
      [req.params.id]
    )

    if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== req.user.id) {
      return res.status(404).json({ error: 'Score not found' })
    }

    await query(`DELETE FROM golf_scores WHERE id = $1`, [req.params.id])

    res.json({ message: 'Score deleted' })
  } catch (error) {
    console.error('Delete score error:', error)
    res.status(500).json({ error: 'Failed to delete score' })
  }
})

export default router
