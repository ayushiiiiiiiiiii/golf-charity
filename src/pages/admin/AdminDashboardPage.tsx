import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

const AdminDashboardPage: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number | string>('-')
  const [totalPool, setTotalPool] = useState<number | string>('-')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, drawsRes] = await Promise.all([
          api.getAdminUsers(),
          api.getDrawHistory()
        ])
        
        setTotalUsers(usersRes.data.length || 0)
        
        const total = (drawsRes.data.data || drawsRes.data || []).reduce(
           (sum: number, draw: any) => sum + (Number(draw.prize_pool) || 0), 0
        )
        setTotalPool(`£${total.toFixed(2)}`)
      } catch (err) {
        console.error("Failed to fetch admin stats", err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in zoom-in duration-500">
      <h1 className="text-4xl font-bold mb-8 text-slate-800">Admin Control Center</h1>
      <p className="text-slate-500 mb-8">Platform analytics overview</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 shadow-sm border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
          <h2 className="text-xl font-semibold mb-4 text-indigo-900">Registered Users</h2>
          <p className="text-5xl font-bold text-indigo-600">{totalUsers}</p>
        </Card>
        
         <Card className="p-8 shadow-sm border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
          <h2 className="text-xl font-semibold mb-4 text-teal-900">Total Lifetime Draw Pools</h2>
          <p className="text-5xl font-bold text-teal-600">{totalPool}</p>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboardPage
