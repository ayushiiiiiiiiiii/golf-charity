import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Charity {
  id: string
  name: string
  description: string
  image_url?: string
  website_url?: string
}

const CharitySelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const [charities, setCharities] = useState<Charity[]>([])
  const [selected, setSelected] = useState<Charity | null>(null)
  const [percentage, setPercentage] = useState(10)
  const [currentSelection, setCurrentSelection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [charitiesRes, profileRes] = await Promise.all([
          api.getCharities(),
          api.getUserCharitySelection()
        ])

        const list: Charity[] = charitiesRes.data || []
        setCharities(list)

        // Load current charity selection from profile
        if (profileRes.data?.selected_charity_id) {
          const currentCharity = list.find(c => c.id === profileRes.data.selected_charity_id)
          setCurrentSelection({
            charity: currentCharity || null,
            percentage: profileRes.data.charity_percentage || 10
          })
          setSelected(currentCharity || null)
          setPercentage(profileRes.data.charity_percentage || 10)
        } else if (list.length > 0) {
          setSelected(list[0])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.selectCharity(selected.id, percentage)
      setCurrentSelection({ charity: selected, percentage })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Failed to save charity selection:', error)
      alert(error.message || 'Failed to save charity selection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-muted-foreground">Loading charities...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Choose Your Charity</h1>
      <p className="text-slate-500 mb-8">
        A portion of your subscription will be donated to your chosen charity every month.
      </p>

      {/* Current Selection Banner */}
      {currentSelection?.charity && (
        <Card className="p-5 mb-8 bg-gradient-to-r from-teal-50 to-green-50 border-teal-200">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Currently Supporting</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
              🤝
            </div>
            <div>
              <p className="font-semibold text-slate-800">{currentSelection.charity.name}</p>
              <p className="text-sm text-teal-700 font-medium">{currentSelection.percentage}% of your subscription</p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {charities.length === 0 && (
        <Card className="p-12 text-center mb-8">
          <p className="text-4xl mb-4">🤝</p>
          <p className="text-muted-foreground mb-2">No charities available yet</p>
          <p className="text-xs text-slate-400">Ask an admin to add charities from the admin panel</p>
        </Card>
      )}

      {/* Charity Grid */}
      {charities.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {charities.map((charity) => (
            <Card
              key={charity.id}
              className={`p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selected?.id === charity.id
                  ? 'ring-2 ring-indigo-500 bg-indigo-50/30'
                  : 'hover:border-indigo-200'
              }`}
              onClick={() => setSelected(charity)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected?.id === charity.id ? 'bg-indigo-100' : 'bg-slate-100'
                }`}>
                  {charity.image_url
                    ? <img src={charity.image_url} alt={charity.name} className="w-12 h-12 rounded-xl object-cover" />
                    : '🤝'
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 truncate">{charity.name}</h3>
                    {selected?.id === charity.id && (
                      <span className="text-indigo-600 text-lg flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{charity.description}</p>
                  {charity.website_url && (
                    <a
                      href={charity.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-500 hover:underline mt-1 block"
                      onClick={e => e.stopPropagation()}
                    >
                      Visit website →
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Percentage Slider */}
      {selected && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-1 text-slate-800">Set Contribution Percentage</h3>
          <p className="text-sm text-slate-500 mb-5">How much of your subscription should go to <span className="font-semibold text-indigo-600">{selected.name}</span>?</p>

          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl font-bold text-indigo-600">{percentage}%</span>
            <div className="text-sm text-slate-500">
              {percentage === 10 && <span>Minimum required contribution</span>}
              {percentage > 10 && percentage < 50 && <span>Thank you for your generosity! 🙏</span>}
              {percentage >= 50 && <span className="text-green-600 font-semibold">Amazing! You're a champion! 🏆</span>}
            </div>
          </div>

          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            className="w-full accent-indigo-600 mb-2"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>10% (minimum)</span>
            <span>100%</span>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
          ✅ Charity selection saved! Your contribution will be applied from your next billing cycle.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saving || !selected}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? 'Saving...' : '💚 Save Selection'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate({ to: '/dashboard' })}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default CharitySelectionPage
