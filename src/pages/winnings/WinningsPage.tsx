import React, { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface Winning {
  id: string
  draw_id: string
  match_tier: number
  amount: number
  status: string
  proof_image_url?: string
  created_at: string
  draws?: { run_date: string }
}

const statusColors: Record<string, string> = {
  pending_verification: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-blue-100 text-blue-700',
}

const WinningsPage: React.FC = () => {
  const [winnings, setWinnings] = useState<Winning[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadWinnings = async () => {
    setLoading(true)
    try {
      const res = await api.getUserWinners()
      setWinnings(res.data || [])
    } catch (error) {
      console.error('Failed to load winnings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWinnings() }, [])

  const handleUploadProof = async (winningId: string, file: File) => {
    setUploading(winningId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileName = `${user.id}/${winningId}_${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(fileName)

      await api.submitVerification(winningId, urlData.publicUrl)
      await loadWinnings()
      alert('✅ Proof uploaded! Admin will review your submission.')
    } catch (err: any) {
      alert(err.message || 'Failed to upload proof')
    } finally {
      setUploading(null)
    }
  }

  const totalWon = winnings.reduce((sum, w) => sum + Number(w.amount || 0), 0)
  const paidOut = winnings.filter(w => w.status === 'paid').reduce((sum, w) => sum + Number(w.amount || 0), 0)

  const tierLabel = (tier: number) => {
    if (tier === 5) return '🏆 5-Number Match (Jackpot)'
    if (tier === 4) return '🥈 4-Number Match'
    return '🥉 3-Number Match'
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Your Winnings</h1>
      <p className="text-slate-500 mb-8">Track your prizes and submit verification proof</p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <p className="text-sm text-slate-500 mb-1">Total Won</p>
          <p className="text-3xl font-bold text-indigo-600">£{totalWon.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
          <p className="text-sm text-slate-500 mb-1">Paid Out</p>
          <p className="text-3xl font-bold text-green-600">£{paidOut.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <p className="text-sm text-slate-500 mb-1">Total Prizes</p>
          <p className="text-3xl font-bold text-amber-600">{winnings.length}</p>
        </Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading winnings...</p>
      ) : winnings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <p className="font-semibold text-slate-700 mb-2">No winnings yet</p>
          <p className="text-sm text-slate-400">Keep participating in monthly draws to win prizes!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {winnings.map(winning => (
            <Card key={winning.id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{tierLabel(winning.match_tier)}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Draw: {winning.draws?.run_date
                      ? new Date(winning.draws.run_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">£{Number(winning.amount).toFixed(2)}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize mt-1 inline-block ${statusColors[winning.status] || 'bg-slate-100 text-slate-600'}`}>
                    {winning.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {winning.status === 'pending_verification' && (
                <div className="border-t pt-4">
                  {winning.proof_image_url ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 font-medium">✅ Proof submitted — awaiting admin review</span>
                      <a href={winning.proof_image_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 underline">View proof</a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-orange-600 font-medium mb-3">
                        📸 Upload a screenshot of your scores to verify this prize
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { fileInputRefs.current[winning.id] = el }}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadProof(winning.id, file)
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={uploading === winning.id}
                          onClick={() => fileInputRefs.current[winning.id]?.click()}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {uploading === winning.id ? 'Uploading...' : '📸 Upload Proof Screenshot'}
                        </Button>
                        <p className="text-xs text-slate-400">JPG, PNG accepted</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {winning.status === 'approved' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-green-600 font-medium">✅ Verified! Payment will be processed shortly.</p>
                </div>
              )}

              {winning.status === 'rejected' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-red-600 font-medium">❌ Proof was rejected. Please contact support.</p>
                </div>
              )}

              {winning.status === 'paid' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-blue-600 font-medium">💰 Payment completed! Check your account.</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default WinningsPage
