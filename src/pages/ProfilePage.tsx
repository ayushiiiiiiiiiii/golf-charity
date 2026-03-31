import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [charityPercentage, setCharityPercentage] = useState(10)
  const [subscription, setSubscription] = useState<any>(null)
  const [charity, setCharity] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [subRes, profileRes] = await Promise.all([
          api.getSubscriptionStatus(),
          api.getUserCharitySelection()
        ])
        setSubscription(subRes.data)
        if (profileRes.data) {
          setCharityPercentage(profileRes.data.charity_percentage || 10)
          setCharity(profileRes.data.charities)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      if (charityPercentage < 10) {
        alert('Minimum charity contribution is 10%')
        return
      }

      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          charity_percentage: charityPercentage
        })
        .eq('id', authUser.id)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Profile Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and charity preferences</p>

      {/* Subscription Status Card */}
      <Card className="p-6 mb-6 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-white">
        <h2 className="text-lg font-semibold mb-3 text-indigo-900">Subscription Status</h2>
        {subscription?.status === 'active' ? (
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Active
            </span>
            <span className="text-sm text-slate-600 capitalize">{subscription.plan_type} Plan</span>
            {subscription.current_period_end && (
              <span className="text-xs text-slate-400">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Inactive
            </span>
            <span className="text-sm text-slate-500">No active subscription</span>
          </div>
        )}
      </Card>

      {/* Edit Profile Form */}
      <Card className="p-8 mb-6">
        <h2 className="text-xl font-semibold mb-6 text-slate-800">Personal Information</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Charity Contribution: <span className="text-indigo-600 font-bold">{charityPercentage}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={charityPercentage}
              onChange={(e) => setCharityPercentage(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Min: 10%</span>
              <span>Max: 100%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Minimum 10% of your subscription fee is donated to your selected charity.
            </p>
          </div>

          {/* Selected Charity */}
          {charity && (
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
              <p className="text-sm font-medium text-teal-900">Supporting: <span className="font-bold">{charity.name}</span></p>
              <p className="text-xs text-teal-600 mt-1">{charity.description}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
              ✅ Profile updated successfully!
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      {/* Account Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">Account Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Role</span>
            <span className="capitalize font-medium text-indigo-600">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Member Since</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProfilePage
