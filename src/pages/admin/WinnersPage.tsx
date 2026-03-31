import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Winner {
  id: string
  user_id: string
  draw_id: string
  match_tier: number
  amount: number
  status: string
  proof_image_url?: string
  created_at: string
  profiles?: { full_name: string }
  draws?: { run_date: string }
}

const statusColors: Record<string, string> = {
  pending_verification: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-blue-100 text-blue-700',
}

const WinnersPage: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([])
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'approved' | 'paid'>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadWinners = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminWinners()
      setWinners(res.data || [])
    } catch (error) {
      console.error('Failed to load winners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWinners() }, [])

  const handleVerify = async (id: string, approved: boolean) => {
    setUpdating(id)
    try {
      await api.verifyWinner(id, approved)
      await loadWinners()
    } catch (err: any) {
      alert(err.message || 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setUpdating(id)
    try {
      await api.markWinnerPaid(id)
      await loadWinners()
    } catch (err: any) {
      alert(err.message || 'Failed to mark paid')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.status === filter)

  const totalPool = winners.reduce((sum, w) => sum + Number(w.amount || 0), 0)
  const totalPaid = winners.filter(w => w.status === 'paid').reduce((sum, w) => sum + Number(w.amount || 0), 0)
  const pendingCount = winners.filter(w => w.status === 'pending_verification').length

  const tierLabel = (tier: number) => {
    if (tier === 5) return '🏆 5-Match Jackpot'
    if (tier === 4) return '🥈 4-Match'
    return '🥉 3-Match'
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">Winners Management</h1>
        <p className="text-muted-foreground mt-1">Verify proof submissions and manage payouts</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="p-5 border-orange-100 bg-orange-50/40">
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
        </Card>
        <Card className="p-5 border-indigo-100 bg-indigo-50/40">
          <p className="text-sm text-slate-500">Total Winners</p>
          <p className="text-3xl font-bold text-indigo-600">{winners.length}</p>
        </Card>
        <Card className="p-5 border-teal-100 bg-teal-50/40">
          <p className="text-sm text-slate-500">Total Prize Pool</p>
          <p className="text-3xl font-bold text-teal-600">£{totalPool.toFixed(2)}</p>
        </Card>
        <Card className="p-5 border-green-100 bg-green-50/40">
          <p className="text-sm text-slate-500">Paid Out</p>
          <p className="text-3xl font-bold text-green-600">£{totalPaid.toFixed(2)}</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending_verification', label: '⏳ Pending' },
          { key: 'approved', label: '✅ Approved' },
          { key: 'paid', label: '💰 Paid' },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Winners List */}
      {loading ? (
        <p className="text-muted-foreground">Loading winners...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-muted-foreground">No winners found</p>
          <p className="text-xs text-slate-400 mt-2">Run a draw from Draw Management to select winners</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(winner => (
            <Card key={winner.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-lg">
                      {winner.profiles?.full_name || 'Unknown User'}
                    </h3>
                    <span className="text-sm font-medium">{tierLabel(winner.match_tier)}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[winner.status] || 'bg-slate-100 text-slate-600'}`}>
                      {winner.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex gap-6 text-sm text-slate-600">
                    <div>
                      <span className="text-slate-400">Prize: </span>
                      <span className="font-bold text-indigo-600">£{Number(winner.amount).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Draw: </span>
                      <span>{winner.draws?.run_date
                        ? new Date(winner.draws.run_date).toLocaleDateString('en-GB')
                        : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Proof Image */}
                  {winner.proof_image_url && (
                    <div className="mt-3">
                      <a
                        href={winner.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                      >
                        📸 View Proof Screenshot →
                      </a>
                    </div>
                  )}

                  {winner.status === 'pending_verification' && !winner.proof_image_url && (
                    <p className="text-xs text-orange-500 mt-2">⚠️ No proof uploaded yet</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {winner.status === 'pending_verification' && (
                    <>
                      <Button
                        size="sm"
                        disabled={updating === winner.id}
                        onClick={() => handleVerify(winner.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating === winner.id ? '...' : '✅ Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updating === winner.id}
                        onClick={() => handleVerify(winner.id, false)}
                      >
                        ❌ Reject
                      </Button>
                    </>
                  )}

                  {winner.status === 'approved' && (
                    <Button
                      size="sm"
                      disabled={updating === winner.id}
                      onClick={() => handleMarkPaid(winner.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updating === winner.id ? '...' : '💰 Mark Paid'}
                    </Button>
                  )}

                  {winner.status === 'paid' && (
                    <span className="text-xs text-green-600 font-semibold">✅ Completed</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default WinnersPage
