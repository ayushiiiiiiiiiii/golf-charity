import { Router, Request, Response } from 'express'
import { query } from '../services/database'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/user/charity
router.post('/charity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { charityId, percentage } = req.body

    if (!charityId || !percentage) {
      return res.status(400).json({ error: 'Charity ID and percentage required' })
    }

    if (percentage < 10 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 10 and 100' })
    }

    // Check if charity exists
    const charityResult = await query('SELECT id FROM charities WHERE id = $1', [charityId])
    if (charityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Charity not found' })
    }

    // Insert or update selection
    const result = await query(
      `INSERT INTO user_charity_selection (user_id, charity_id, contribution_percentage)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
       charity_id = $2, contribution_percentage = $3, updated_at = NOW()
       RETURNING id, user_id, charity_id, contribution_percentage`,
      [req.user.id, charityId, percentage]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Charity selection error:', error)
    res.status(500).json({ error: 'Failed to save charity selection' })
  }
})

// GET /api/user/charity
router.get('/charity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      `SELECT ucs.id, ucs.user_id, ucs.charity_id, ucs.contribution_percentage,
              c.name, c.image_url
       FROM user_charity_selection ucs
       JOIN charities c ON ucs.charity_id = c.id
       WHERE ucs.user_id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.json(null)
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Get charity selection error:', error)
    res.status(500).json({ error: 'Failed to fetch charity selection' })
  }
})

// PATCH /api/user/charity
router.patch('/charity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { charityId, percentage } = req.body

    if (!charityId || !percentage) {
      return res.status(400).json({ error: 'Charity ID and percentage required' })
    }

    if (percentage < 10 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 10 and 100' })
    }

    const result = await query(
      `UPDATE user_charity_selection
       SET charity_id = $1, contribution_percentage = $2, updated_at = NOW()
       WHERE user_id = $3
       RETURNING id, charity_id, contribution_percentage`,
      [charityId, percentage, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No charity selection found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update charity selection error:', error)
    res.status(500).json({ error: 'Failed to update charity selection' })
  }
})

export default router
