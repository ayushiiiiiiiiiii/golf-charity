import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Score {
  id: string
  score: number
  score_date: string
  created_at: string
}

interface Subscription {
  status: string
  plan_type?: string
  current_period_end?: string
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scores, setScores] = useState<Score[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [newScore, setNewScore] = useState('')
  const [newScoreDate, setNewScoreDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [scoresRes, subRes] = await Promise.all([api.getScores(), api.getSubscriptionStatus()])

      setScores(scoresRes.data || [])
      setSubscription(subRes.data || null)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScore || !newScoreDate) return

    setSubmitting(true)
    try {
      const result = await api.addScore(parseInt(newScore), newScoreDate)
      setScores([result.data[0], ...scores.slice(0, 4)])
      setNewScore('')
      setNewScoreDate(new Date().toISOString().split('T')[0])
    } catch (error: any) {
      console.error('Failed to add score:', error)
      alert(error.message || 'Failed to add score')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteScore = async (id: string) => {
    if (!confirm('Delete this score?')) return

    try {
      await api.deleteScore(id)
      setScores(scores.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete score:', error)
      alert('Failed to delete score')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.full_name}</h1>
      <p className="text-muted-foreground mb-8">Track your scores and manage your subscription</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Subscription Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          {!subscription || subscription.status !== 'active' ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">No active subscription</p>
              <Button
                size="sm"
                onClick={() => navigate({ to: '/checkout' })}
                className="w-full"
              >
                Subscribe Now
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Plan:</span>{' '}
                <span className="font-semibold capitalize">{subscription.plan_type}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-semibold capitalize text-green-600">{subscription.status}</span>
              </p>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground mt-4">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Score Entry */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add Score</h2>
          <form onSubmit={handleAddScore} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Score (1-45)</label>
              <Input
                type="number"
                min="1"
                max="45"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                placeholder="Enter score"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                type="date"
                value={newScoreDate}
                onChange={(e) => setNewScoreDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Score'}
            </Button>
          </form>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">This Month</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Scores entered:</span>{' '}
              <span className="text-2xl font-bold">{scores.length}</span>
            </p>
            {scores.length > 0 && (
              <>
                <p className="text-sm">
                  <span className="text-muted-foreground">Best:</span>{' '}
                  <span className="font-semibold">{Math.max(...scores.map((s) => s.score))}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Average:</span>{' '}
                  <span className="font-semibold">
                    {(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)}
                  </span>
                </p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Score History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Score History</h2>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/scores' })}>
            View All
          </Button>
        </div>

        {scores.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No scores recorded yet</p>
        ) : (
          <div className="space-y-2">
            {scores.map((score) => (
              <div key={score.id} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-semibold">{score.score}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(score.score_date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteScore(score.id)}
                  className="text-destructive"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Additional Actions */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Charity Selection</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which charity receives your contribution
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/charity' })}>
            Select Charity
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Your Winnings</h3>
          <p className="text-sm text-muted-foreground mb-4">Track your prizes and payouts</p>
          <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/winnings' })}>
            View Winnings
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
