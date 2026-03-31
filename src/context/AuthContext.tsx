import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'public' | 'subscriber' | 'admin'
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, activeToken: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setUser({
          id: userId,
          email: userEmail || '',
          full_name: data.full_name || 'User',
          role: data.role as 'public' | 'subscriber' | 'admin',
        })
        setToken(activeToken)
      } else {
         setUser({
            id: userId,
            email: userEmail || '',
            full_name: 'User',
            role: 'public'
         })
         setToken(activeToken)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.access_token, session.user.email)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.access_token, session.user.email)
      } else {
        setUser(null)
        setToken(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
       setLoading(false)
       throw error
    }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
    })
    
    if (error) {
       setLoading(false)
       throw error
    }
    if (!data.session) {
      setLoading(false)
      throw new Error('Please check your email to verify your account before logging in.')
    }
  }

  const logout = async () => {
    localStorage.removeItem('mock_sub')
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
