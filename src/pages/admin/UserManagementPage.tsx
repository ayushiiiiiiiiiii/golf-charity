import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string
  role: string
  charity_percentage: number
  created_at: string
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminUsers()
      setUsers(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const toggleRole = async (userId: string, currentRole: string) => {
    setUpdating(userId)
    const newRole = currentRole === 'admin' ? 'subscriber' : 'admin'
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    subscriber: 'bg-green-100 text-green-700',
    public: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">User Management</h1>
        <p className="text-muted-foreground mt-1">{users.length} registered users</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No users registered yet</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Charity %</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Joined</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{user.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{user.id.slice(0, 8)}...</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[user.role] || roleColors.public}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{user.charity_percentage || 10}%</td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating === user.id}
                      onClick={() => toggleRole(user.id, user.role)}
                      className={user.role === 'admin' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}
                    >
                      {updating === user.id ? '...' : user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

export default UserManagementPage
