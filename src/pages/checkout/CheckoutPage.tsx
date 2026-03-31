import React, { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [authLoading, isAuthenticated, navigate])

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await api.startCheckout(selectedPlan)
      if (response.data?.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$29.99',
      interval: '/month',
      description: 'Perfect for trying it out',
      features: [
        'Track 5 golf scores',
        'Monthly draw entry',
        'Charity selection',
        'Winnings tracking',
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$299.99',
      interval: '/year',
      description: 'Save 17% vs monthly',
      features: [
        'Track 5 golf scores',
        'Monthly draw entry',
        'Charity selection',
        'Winnings tracking',
        '12-month commitment',
      ],
      highlighted: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Join thousands of golfers making a difference
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-8 relative transition-all ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              } ${plan.highlighted ? 'md:scale-105 shadow-lg' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-muted-foreground mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.interval}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={selectedPlan === plan.id ? 'default' : 'outline'}
                onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
              >
                Select Plan
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : 'Continue to Checkout'}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
