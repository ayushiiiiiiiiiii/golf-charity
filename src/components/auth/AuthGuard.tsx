import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: '/auth/login', replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Validating session...
      </div>
    );
  }

  return <>{children}</>;
};
