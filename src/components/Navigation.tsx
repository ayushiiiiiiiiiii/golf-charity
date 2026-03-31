import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, user, logout } = useAuth()

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div
          className="text-2xl font-bold cursor-pointer"
          onClick={() => navigate({ to: '/' })}
        >
          GolfCharity
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate({ to: '/charities' })}
                className="text-sm hover:text-primary"
              >
                Charities
              </button>
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="text-sm hover:text-primary"
              >
                Dashboard
              </button>

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50 font-semibold">
                      🔑 Admin ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin' })}>
                      📊 Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin/users' })}>
                      👥 User Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin/charities' })}>
                      🤝 Charity Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin/draws' })}>
                      🎯 Draw Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin/winners' })}>
                      🏆 Winners
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin/reports' })}>
                      📈 Reports
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{user?.full_name}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate({ to: '/charities' })}
                className="text-sm hover:text-primary"
              >
                Charities
              </button>
              <Button variant="outline" onClick={() => navigate({ to: '/auth/login' })}>
                Sign In
              </Button>
              <Button onClick={() => navigate({ to: '/auth/signup' })}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
