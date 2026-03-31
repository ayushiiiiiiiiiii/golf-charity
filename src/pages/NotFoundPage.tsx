import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    </div>
  )
}

export default NotFoundPage
