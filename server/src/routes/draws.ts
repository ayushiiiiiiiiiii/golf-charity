import { Router, Request, Response } from 'express'
import { query } from '../services/database'
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth'
import { getOrCreateCurrentDraw, simulateDraw, publishDraw, getCurrentDraw } from '../services/draws'

const router = Router()

// GET /api/draws/current
router.get('/current', async (req: Request, res: Response) => {
  try {
    const draw = await getOrCreateCurrentDraw()
    res.json(draw)
  } catch (error) {
    console.error('Get current draw error:', error)
    res.status(500).json({ error: 'Failed to get current draw' })
  }
})

// GET /api/draws/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, draw_month, draw_numbers, total_participants, total_prize_pool, status, published_at
       FROM draws
       WHERE status = 'published'
       ORDER BY draw_month DESC
       LIMIT 12`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Get draw history error:', error)
    res.status(500).json({ error: 'Failed to get draw history' })
  }
})

// GET /api/draws/:id/results
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT d.id, d.draw_numbers, d.draw_month, d.total_prize_pool,
              dr.tier, dr.number_of_winners, dr.prize_per_winner
       FROM draws d
       LEFT JOIN draw_results dr ON d.id = dr.draw_id
       WHERE d.id = $1`,
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draw not found' })
    }

    const draw = {
      id: result.rows[0].id,
      drawNumbers: result.rows[0].draw_numbers,
      drawMonth: result.rows[0].draw_month,
      totalPrizePool: result.rows[0].total_prize_pool,
      results: result.rows
        .filter((r) => r.tier)
        .map((r) => ({
          tier: r.tier,
          winners: r.number_of_winners,
          prizePerWinner: r.prize_per_winner,
        })),
    }

    res.json(draw)
  } catch (error) {
    console.error('Get draw results error:', error)
    res.status(500).json({ error: 'Failed to get draw results' })
  }
})

// POST /api/draws/simulate (admin)
router.post('/simulate', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const simulated = await simulateDraw()
    res.json(simulated)
  } catch (error) {
    console.error('Simulate draw error:', error)
    res.status(500).json({ error: 'Failed to simulate draw' })
  }
})

// POST /api/draws/publish (admin)
router.post('/publish', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { drawNumbers, winners } = req.body

    if (!drawNumbers || !Array.isArray(winners)) {
      return res.status(400).json({ error: 'Invalid simulation data' })
    }

    const simulated = {
      drawId: (await getCurrentDraw())?.id,
      drawNumbers,
      winners,
      totalParticipants: winners.length,
      totalPool: winners.reduce((sum: number, w: any) => sum + w.prizeAmount, 0),
      prizes: { tier5: 0, tier4: 0, tier3: 0 },
    }

    await publishDraw(simulated)
    res.json({ message: 'Draw published successfully' })
  } catch (error) {
    console.error('Publish draw error:', error)
    res.status(500).json({ error: 'Failed to publish draw' })
  }
})

export default router
