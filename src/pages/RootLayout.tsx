import React from 'react'
import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const RootLayout: React.FC = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default RootLayout
