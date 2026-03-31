import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
       if (!isAuthenticated) {
          navigate({ to: '/auth/login', replace: true });
       } else if (!isAdmin) {
          navigate({ to: '/dashboard', replace: true });
       }
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
         Verifying credentials...
       </div>
    );
  }

  return <>{children}</>;
};
