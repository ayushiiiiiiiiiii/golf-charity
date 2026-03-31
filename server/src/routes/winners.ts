import { Router, Request, Response } from 'express'
import { query } from '../services/database'
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/winners
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      `SELECT w.id, w.draw_id, w.tier, w.matched_numbers, w.prize_amount,
              w.verification_status, w.payment_status, w.verified_at, w.paid_at,
              d.draw_month, wv.proof_image_url
       FROM winners w
       JOIN draws d ON w.draw_id = d.id
       LEFT JOIN winner_verification wv ON w.id = wv.winner_id
       WHERE w.user_id = $1
       ORDER BY d.draw_month DESC`,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get winners error:', error)
    res.status(500).json({ error: 'Failed to fetch winners' })
  }
})

// POST /api/winners/verify
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { winnerId, proofImageUrl } = req.body

    if (!winnerId || !proofImageUrl) {
      return res.status(400).json({ error: 'Winner ID and proof image required' })
    }

    // Check ownership
    const winnerResult = await query('SELECT user_id FROM winners WHERE id = $1', [winnerId])
    if (winnerResult.rows.length === 0 || winnerResult.rows[0].user_id !== req.user.id) {
      return res.status(404).json({ error: 'Winner not found' })
    }

    // Submit verification
    const result = await query(
      `INSERT INTO winner_verification (id, winner_id, proof_image_url)
       VALUES (gen_random_uuid(), $1, $2)
       RETURNING id, winner_id, proof_image_url`,
      [winnerId, proofImageUrl]
    )

    // Update verification status
    await query(
      `UPDATE winners SET verification_status = 'pending', verification_submitted_at = NOW()
       WHERE id = $1`,
      [winnerId]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Submit verification error:', error)
    res.status(500).json({ error: 'Failed to submit verification' })
  }
})

// GET /api/admin/winners
router.get('/admin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, tier } = req.query

    let sql = `SELECT w.id, w.user_id, w.draw_id, w.tier, w.matched_numbers, w.prize_amount,
                      w.verification_status, w.payment_status, w.verified_at, w.paid_at,
                      d.draw_month, u.email, u.full_name,
                      wv.proof_image_url, wv.admin_notes
               FROM winners w
               JOIN draws d ON w.draw_id = d.id
               JOIN users u ON w.user_id = u.id
               LEFT JOIN winner_verification wv ON w.id = wv.winner_id
               WHERE 1=1`

    const params: any[] = []

    if (status) {
      sql += ` AND w.verification_status = $${params.length + 1}`
      params.push(status)
    }

    if (tier) {
      sql += ` AND w.tier = $${params.length + 1}`
      params.push(tier)
    }

    sql += ' ORDER BY d.draw_month DESC, w.created_at DESC'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Get admin winners error:', error)
    res.status(500).json({ error: 'Failed to fetch winners' })
  }
})

// PATCH /api/admin/winners/:id/verify
router.patch('/:id/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { verified, notes } = req.body

    const verificationStatus = verified ? 'verified' : 'rejected'

    const result = await query(
      `UPDATE winners
       SET verification_status = $1, verified_at = NOW()
       WHERE id = $2
       RETURNING id, verification_status, verified_at`,
      [verificationStatus, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Winner not found' })
    }

    if (notes) {
      await query(
        `UPDATE winner_verification SET admin_notes = $1, admin_id = $2 WHERE winner_id = $3`,
        [notes, req.user.id, req.params.id]
      )
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Verify winner error:', error)
    res.status(500).json({ error: 'Failed to verify winner' })
  }
})

// PATCH /api/admin/winners/:id/payout
router.patch('/:id/payout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE winners
       SET payment_status = 'paid', paid_at = NOW()
       WHERE id = $1
       RETURNING id, payment_status, paid_at`,
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Winner not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Mark payout error:', error)
    res.status(500).json({ error: 'Failed to mark payout' })
  }
})

export default router
