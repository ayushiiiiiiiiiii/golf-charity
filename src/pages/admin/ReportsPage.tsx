import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'

const ReportsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [draws, setDraws] = useState<any[]>([])
  const [winnings, setWinnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, drawsRes, winnersRes] = await Promise.all([
          api.getAdminUsers(),
          api.getDrawHistory(),
          api.getAdminWinners()
        ])
        setUsers(usersRes.data || [])
        setDraws(drawsRes.data || [])
        setWinnings(winnersRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const totalPool = draws.reduce((sum, d) => sum + (Number(d.prize_pool) || 0), 0)
  const totalPaid = winnings.filter(w => w.status === 'paid').reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  const adminCount = users.filter(u => u.role === 'admin').length
  const subscriberCount = users.filter(u => u.role === 'subscriber').length

  const stats = [
    { label: 'Total Users', value: users.length, color: 'indigo', icon: '👥' },
    { label: 'Subscribers', value: subscriberCount, color: 'green', icon: '✅' },
    { label: 'Admins', value: adminCount, color: 'purple', icon: '🔑' },
    { label: 'Total Draws Run', value: draws.length, color: 'teal', icon: '🎯' },
    { label: 'Total Prize Pool', value: `£${totalPool.toFixed(2)}`, color: 'amber', icon: '💰' },
    { label: 'Total Paid Out', value: `£${totalPaid.toFixed(2)}`, color: 'emerald', icon: '🏆' },
  ]

  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-50 to-white border-indigo-100 text-indigo-600',
    green: 'from-green-50 to-white border-green-100 text-green-600',
    purple: 'from-purple-50 to-white border-purple-100 text-purple-600',
    teal: 'from-teal-50 to-white border-teal-100 text-teal-600',
    amber: 'from-amber-50 to-white border-amber-100 text-amber-600',
    emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-600',
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Platform-wide statistics and performance metrics</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading analytics...</p>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {stats.map(stat => (
              <Card key={stat.label} className={`p-6 bg-gradient-to-br border ${colorMap[stat.color]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Draw History Table */}
          <Card className="overflow-hidden mb-8">
            <div className="p-6 border-b bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-800">Draw History</h2>
            </div>
            {draws.length === 0 ? (
              <p className="p-6 text-muted-foreground">No draws have been run yet</p>
            ) : (
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-600">Type</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-600">Prize Pool</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draws.map(draw => (
                    <tr key={draw.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm">{new Date(draw.run_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm capitalize">{draw.draw_type}</td>
                      <td className="p-4 text-sm font-medium">£{Number(draw.prize_pool).toFixed(2)}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-green-100 text-green-700">{draw.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default ReportsPage
