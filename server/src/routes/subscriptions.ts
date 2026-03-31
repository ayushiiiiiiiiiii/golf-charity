import express, { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import {
  PLANS,
  createCheckoutSession,
  getSubscriptionStatus,
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  cancelSubscription,
} from '../services/stripe'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// GET /api/subscriptions/plans
router.get('/plans', (req: Request, res: Response) => {
  res.json([
    { id: 'monthly', name: 'Monthly', price: 29.99, interval: 'month' },
    { id: 'yearly', name: 'Yearly', price: 299.99, interval: 'year' },
  ])
})

// GET /api/subscriptions/status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const status = await getSubscriptionStatus(req.user.id)
    res.json(status || { status: 'inactive' })
  } catch (error) {
    console.error('Get subscription status error:', error)
    res.status(500).json({ error: 'Failed to get subscription status' })
  }
})

// POST /api/subscriptions/checkout
router.post('/checkout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { planType } = req.body

    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' })
    }

    const session = await createCheckoutSession(req.user.id, planType as 'monthly' | 'yearly')
    res.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// POST /api/subscriptions/webhook
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
      }

      res.json({ received: true })
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(400).json({ error: 'Webhook error' })
    }
  }
)

// POST /api/subscriptions/cancel
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await cancelSubscription(req.user.id)
    res.json({ message: 'Subscription canceled at end of period' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

export default router
