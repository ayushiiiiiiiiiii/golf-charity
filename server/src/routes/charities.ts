import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../services/database'
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/charities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, filter } = req.query

    let sql = 'SELECT id, name, description, image_url, website, impact_area, region, is_featured, is_spotlight FROM charities'
    const params: any[] = []

    if (search) {
      sql += ' WHERE name ILIKE $1 OR description ILIKE $1'
      params.push(`%${search}%`)
    }

    sql += ' ORDER BY is_featured DESC, is_spotlight DESC, name'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Get charities error:', error)
    res.status(500).json({ error: 'Failed to fetch charities' })
  }
})

// GET /api/charities/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, image_url, website, impact_area, region, is_featured, is_spotlight FROM charities WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Charity not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Get charity error:', error)
    res.status(500).json({ error: 'Failed to fetch charity' })
  }
})

// POST /api/charities (admin)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, website, impactArea, region } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name required' })
    }

    const result = await query(
      `INSERT INTO charities (id, name, description, image_url, website, impact_area, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, image_url, website, impact_area, region`,
      [uuidv4(), name, description, imageUrl, website, impactArea, region]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create charity error:', error)
    res.status(500).json({ error: 'Failed to create charity' })
  }
})

// PATCH /api/charities/:id (admin)
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, website, impactArea, region, isFeatured, isSpotlight } =
      req.body

    const result = await query(
      `UPDATE charities
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           image_url = COALESCE($3, image_url),
           website = COALESCE($4, website),
           impact_area = COALESCE($5, impact_area),
           region = COALESCE($6, region),
           is_featured = COALESCE($7, is_featured),
           is_spotlight = COALESCE($8, is_spotlight)
       WHERE id = $9
       RETURNING id, name, description, image_url, website, impact_area, region, is_featured, is_spotlight`,
      [name, description, imageUrl, website, impactArea, region, isFeatured, isSpotlight, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Charity not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update charity error:', error)
    res.status(500).json({ error: 'Failed to update charity' })
  }
})

// DELETE /api/charities/:id (admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM charities WHERE id = $1 RETURNING id', [
      req.params.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Charity not found' })
    }

    res.json({ message: 'Charity deleted' })
  } catch (error) {
    console.error('Delete charity error:', error)
    res.status(500).json({ error: 'Failed to delete charity' })
  }
})

export default router
