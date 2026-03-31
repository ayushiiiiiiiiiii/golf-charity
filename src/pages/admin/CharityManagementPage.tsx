import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface Charity {
  id: string
  name: string
  description: string
  website_url: string
  image_url: string
  created_at: string
}

const CharityManagementPage: React.FC = () => {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', website_url: '', image_url: '', is_featured: false, is_spotlight: false })
  const [success, setSuccess] = useState('')

  const loadCharities = async () => {
    setLoading(true)
    try {
      const res = await api.getCharities()
      setCharities(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCharities() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('charities').insert([form])
      if (error) throw error
      setSuccess('Charity added successfully!')
      setForm({ name: '', description: '', website_url: '', image_url: '' })
      setShowForm(false)
      loadCharities()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to add charity')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charity?')) return
    try {
      const { error } = await supabase.from('charities').delete().eq('id', id)
      if (error) throw error
      loadCharities()
    } catch (err: any) {
      alert(err.message || 'Failed to delete charity')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Charity Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit and manage charity listings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Charity'}
        </Button>
      </div>

      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
          ✅ {success}
        </div>
      )}

      {/* Add Charity Form */}
      {showForm && (
        <Card className="p-6 mb-8 border-indigo-100 bg-indigo-50/30">
          <h2 className="text-xl font-semibold mb-4 text-indigo-900">New Charity</h2>
          <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Charity Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. British Heart Foundation" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Website URL</label>
              <Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description *</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description of the charity" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Image URL</label>
              <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://image-url.com/..." />
            </div>
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Mark as Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_spotlight} onChange={e => setForm({ ...form, is_spotlight: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                <span className="text-sm font-medium text-slate-700">Mark as Spotlight</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Charity'}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Charity List */}
      {loading ? (
        <p className="text-muted-foreground">Loading charities...</p>
      ) : charities.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No charities added yet</p>
          <Button onClick={() => setShowForm(true)}>Add First Charity</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {charities.map(charity => (
            <Card key={charity.id} className="p-5 flex gap-4">
              {charity.image_url && (
                <img src={charity.image_url} alt={charity.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{charity.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{charity.description}</p>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">{charity.website_url}</a>
                )}
              </div>
              <div className="flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(charity.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default CharityManagementPage
