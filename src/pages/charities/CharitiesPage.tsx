import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Charity {
  id: string
  name: string
  description: string
  image_url: string
  website_url: string
  is_featured: boolean
  is_spotlight: boolean
}

const CharitiesPage: React.FC = () => {
  const navigate = useNavigate()
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharities()
  }, [search])

  const loadCharities = async () => {
    setLoading(true)
    try {
      const res = await api.getCharities(search || undefined)
      setCharities(res.data || [])
    } catch (error) {
      console.error('Failed to load charities:', error)
    } finally {
      setLoading(false)
    }
  }

  const spotlight = charities.filter(c => c.is_spotlight)
  const featured = charities.filter(c => c.is_featured && !c.is_spotlight)
  const others = charities.filter(c => !c.is_featured && !c.is_spotlight)

  const CharityCard = ({ charity, large = false }: { charity: Charity, large?: boolean }) => (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => navigate({ to: `/charities/${charity.id}` })}
    >
      <div className={`relative ${large ? 'h-56' : 'h-40'} bg-gradient-to-br from-indigo-100 to-teal-100 overflow-hidden`}>
        {charity.image_url ? (
          <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🤝</div>
        )}
        {charity.is_spotlight && (
          <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Spotlight</span>
        )}
        {charity.is_featured && !charity.is_spotlight && (
          <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">Featured</span>
        )}
      </div>
      <div className="p-5">
        <h3 className={`font-semibold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors ${large ? 'text-xl' : 'text-base'}`}>
          {charity.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{charity.description}</p>
        <Button size="sm" className="w-full" variant={large ? 'default' : 'outline'}>Learn More</Button>
      </div>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Our Charity Partners</h1>
        <p className="text-slate-500 mb-6">
          A portion of every subscription goes directly to your chosen charity.
        </p>
        <Input
          type="text"
          placeholder="🔍 Search charities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading charities...</p>
      ) : charities.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-4">🤝</p>
          <p className="text-muted-foreground">No charities found matching your search</p>
        </Card>
      ) : (
        <>
          {/* Spotlight Section */}
          {spotlight.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-purple-700">⭐ Spotlight</h2>
                <span className="text-sm text-slate-400">Hand-picked by our team</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {spotlight.map(c => <CharityCard key={c.id} charity={c} large />)}
              </div>
            </div>
          )}

          {/* Featured Section */}
          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-indigo-700">Featured</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featured.map(c => <CharityCard key={c.id} charity={c} />)}
              </div>
            </div>
          )}

          {/* All Other Charities */}
          {others.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-700">
                {spotlight.length === 0 && featured.length === 0 ? 'All Charities' : 'More Charities'}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {others.map(c => <CharityCard key={c.id} charity={c} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CharitiesPage
