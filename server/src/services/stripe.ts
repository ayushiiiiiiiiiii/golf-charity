import Stripe from 'stripe'
import { query } from './database'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export const PLANS = {
  monthly: {
    id: 'price_monthly',
    name: 'Monthly',
    amount: 2999, // $29.99
    interval: 'month',
  },
  yearly: {
    id: 'price_yearly',
    name: 'Yearly',
    amount: 29999, // $299.99
    interval: 'year',
  },
}

export const createCheckoutSession = async (userId: string, planType: 'monthly' | 'yearly') => {
  const plan = PLANS[planType]

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Golf Charity ${plan.name} Subscription`,
            description: 'Track golf scores and support charities through monthly draws',
          },
          unit_amount: plan.amount,
          recurring: {
            interval: plan.interval,
            interval_count: 1,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: (await query('SELECT email FROM users WHERE id = $1', [userId])).rows[0]
      ?.email,
    metadata: {
      userId,
      planType,
    },
    success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
  })

  return session
}

export const getSubscriptionStatus = async (userId: string) => {
  const result = await query(
    'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const subscription = result.rows[0]

  if (subscription.stripe_subscription_id) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      )
      return {
        ...subscription,
        stripeStatus: stripeSubscription.status,
      }
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error)
    }
  }

  return subscription
}

export const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const { userId, planType } = session.metadata as { userId: string; planType: string }

  if (!session.subscription) {
    return
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string)

  await query(
    `INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id, plan_type, status,
      current_period_start, current_period_end, amount_paid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = $5, current_period_start = $6, current_period_end = $7`,
    [
      userId,
      stripeSubscription.id,
      stripeSubscription.customer,
      planType,
      stripeSubscription.status,
      new Date(stripeSubscription.current_period_start * 1000),
      new Date(stripeSubscription.current_period_end * 1000),
      (stripeSubscription.items.data[0]?.price?.unit_amount || 0) / 100,
    ]
  )
}

export const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  await query(
    `UPDATE subscriptions
     SET status = $1, current_period_start = $2, current_period_end = $3, updated_at = NOW()
     WHERE stripe_subscription_id = $4`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
    ]
  )
}

export const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  await query(
    `UPDATE subscriptions
     SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  )
}

export const cancelSubscription = async (userId: string) => {
  const result = await query(
    'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2 LIMIT 1',
    [userId, 'active']
  )

  if (result.rows.length === 0) {
    throw new Error('No active subscription found')
  }

  const { stripe_subscription_id } = result.rows[0]

  await stripe.subscriptions.update(stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  await query(
    'UPDATE subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE stripe_subscription_id = $1',
    [stripe_subscription_id]
  )
}
