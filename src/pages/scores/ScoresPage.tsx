import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
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

const ScoresPage: React.FC = () => {
  const navigate = useNavigate()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    loadScores()
  }, [])

  const loadScores = async () => {
    setLoading(true)
    try {
      const res = await api.getScores()
      setScores(res.data.data || [])
    } catch (error) {
      console.error('Failed to load scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditStart = (score: Score) => {
    setEditingId(score.id)
    setEditScore(String(score.score))
    setEditDate(score.score_date)
  }

  const handleEditSave = async () => {
    if (!editingId || !editScore || !editDate) return

    try {
      await api.updateScore(editingId, parseInt(editScore), editDate)
      setScores(
        scores.map((s) =>
          s.id === editingId ? { ...s, score: parseInt(editScore), score_date: editDate } : s
        )
      )
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update score:', error)
      alert('Failed to update score')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this score?')) return

    try {
      await api.deleteScore(id)
      setScores(scores.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete score:', error)
      alert('Failed to delete score')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Your Golf Scores</h1>
        <Button onClick={() => navigate({ to: '/dashboard' })}>Back to Dashboard</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading scores...</p>
      ) : scores.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No scores recorded yet</p>
          <Button onClick={() => navigate({ to: '/dashboard' })}>Add Your First Score</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {scores.map((score) => (
            <Card key={score.id} className="p-4">
              {editingId === score.id ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="45"
                      value={editScore}
                      onChange={(e) => setEditScore(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button size="sm" onClick={handleEditSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{score.score}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(score.score_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recorded {new Date(score.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditStart(score)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(score.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScoresPage
