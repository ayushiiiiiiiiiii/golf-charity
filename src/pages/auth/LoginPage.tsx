import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-indigo-100 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back.</h1>
        <p className="text-slate-500 mb-8">Sign in to support charities & track performance.</p>
        
        {error && <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input type="email" required placeholder="you@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input type="password" required placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50">
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 font-medium">
          Don't have an account?{' '}
          <button onClick={() => navigate({ to: '/auth/signup' })} className="text-indigo-600 font-semibold hover:underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
