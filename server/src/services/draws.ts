import { query } from './database'

// Generate random 5-number draw (1-45)
export const generateRandomDraw = (): number[] => {
  const numbers = new Set<number>()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

// Find matching numbers between user scores and draw
export const findMatches = (userScores: number[], drawNumbers: number[]): number[] => {
  return userScores.filter((score) => drawNumbers.includes(score))
}

// Determine prize tier based on matches (3, 4, or 5)
export const getPrizeTier = (matches: number[]): number | null => {
  const matchCount = matches.length
  if (matchCount >= 5) return 5
  if (matchCount === 4) return 4
  if (matchCount === 3) return 3
  return null
}

// Get current month's draw
export const getCurrentDraw = async () => {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthDate = monthStart.toISOString().split('T')[0]

  const result = await query('SELECT * FROM draws WHERE draw_month = $1', [monthDate])
  return result.rows[0] || null
}

// Create or get current month's draw
export const getOrCreateCurrentDraw = async () => {
  let draw = await getCurrentDraw()

  if (!draw) {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthDate = monthStart.toISOString().split('T')[0]

    const result = await query(
      `INSERT INTO draws (id, draw_month, status)
       VALUES (gen_random_uuid(), $1, 'pending')
       RETURNING *`,
      [monthDate]
    )
    draw = result.rows[0]
  }

  return draw
}

// Simulate draw (preview results without publishing)
export const simulateDraw = async () => {
  const draw = await getOrCreateCurrentDraw()

  // Get all active subscriber scores from previous month
  const scoresResult = await query(
    `SELECT gs.user_id, gs.score, s.status
     FROM golf_scores gs
     JOIN subscriptions s ON gs.user_id = s.user_id
     WHERE s.status = 'active'
     AND EXTRACT(YEAR FROM gs.score_date) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')
     AND EXTRACT(MONTH FROM gs.score_date) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
     ORDER BY gs.user_id`
  )

  // Group scores by user (max 5 most recent per user)
  const userScores: { [key: string]: number[] } = {}
  scoresResult.rows.forEach((row) => {
    if (!userScores[row.user_id]) {
      userScores[row.user_id] = []
    }
    if (userScores[row.user_id].length < 5) {
      userScores[row.user_id].push(row.score)
    }
  })

  // Generate draw numbers
  const drawNumbers = generateRandomDraw()

  // Find winners
  const winners: any[] = []
  for (const [userId, scores] of Object.entries(userScores)) {
    const matches = findMatches(scores, drawNumbers)
    const tier = getPrizeTier(matches)

    if (tier) {
      winners.push({
        user_id: userId,
        matched_numbers: matches,
        tier,
      })
    }
  }

  // Calculate prize pools (simplified: equal distribution)
  const totalParticipants = Object.keys(userScores).length
  const monthlyFee = 29.99 // Average of monthly/yearly
  const totalPool = totalParticipants * monthlyFee

  const tier5Prize = (totalPool * 0.4) / Math.max(winners.filter((w) => w.tier === 5).length, 1)
  const tier4Prize = (totalPool * 0.35) / Math.max(winners.filter((w) => w.tier === 4).length, 1)
  const tier3Prize = (totalPool * 0.25) / Math.max(winners.filter((w) => w.tier === 3).length, 1)

  return {
    drawId: draw.id,
    drawNumbers,
    totalParticipants,
    totalPool,
    winners: winners.map((w) => ({
      ...w,
      prizeAmount:
        w.tier === 5 ? tier5Prize : w.tier === 4 ? tier4Prize : tier3Prize,
    })),
    prizes: {
      tier5: tier5Prize,
      tier4: tier4Prize,
      tier3: tier3Prize,
    },
  }
}

// Publish draw results
export const publishDraw = async (simulated: any) => {
  // Update draw record
  await query(
    `UPDATE draws
     SET draw_numbers = $1, status = 'published', published_at = NOW(), 
         total_participants = $2, total_prize_pool = $3
     WHERE id = $4`,
    [JSON.stringify(simulated.drawNumbers), simulated.totalParticipants, simulated.totalPool, simulated.drawId]
  )

  // Create prize pool record
  await query(
    `INSERT INTO prize_pools (id, draw_id, month, total_subscriptions, monthly_fee_per_subscriber, total_pool, tier_5_pool, tier_4_pool, tier_3_pool)
     VALUES (gen_random_uuid(), $1, NOW()::date, $2, $3, $4, $5, $6, $7)`,
    [
      simulated.drawId,
      simulated.totalParticipants,
      29.99,
      simulated.totalPool,
      simulated.prizes.tier5 * Math.max(simulated.winners.filter((w: any) => w.tier === 5).length, 1),
      simulated.prizes.tier4 * Math.max(simulated.winners.filter((w: any) => w.tier === 4).length, 1),
      simulated.prizes.tier3 * Math.max(simulated.winners.filter((w: any) => w.tier === 3).length, 1),
    ]
  )

  // Create draw results and winners
  for (const winner of simulated.winners) {
    // Create draw result entry
    await query(
      `INSERT INTO draw_results (id, draw_id, tier, number_of_winners, prize_per_winner, total_tier_prize)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       ON CONFLICT (draw_id, tier) DO UPDATE SET
       number_of_winners = excluded.number_of_winners,
       prize_per_winner = excluded.prize_per_winner,
       total_tier_prize = excluded.total_tier_prize`,
      [
        simulated.drawId,
        winner.tier,
        simulated.winners.filter((w: any) => w.tier === winner.tier).length,
        winner.prizeAmount,
        winner.prizeAmount * simulated.winners.filter((w: any) => w.tier === winner.tier).length,
      ]
    )

    // Create winner record
    await query(
      `INSERT INTO winners (id, user_id, draw_id, tier, matched_numbers, prize_amount, verification_status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending')`,
      [winner.user_id, simulated.drawId, winner.tier, JSON.stringify(winner.matched_numbers), winner.prizeAmount]
    )
  }
}
