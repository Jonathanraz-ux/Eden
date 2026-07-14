import { useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('[AuthGuard] Render — isLoading:', isLoading, '| user:', data?.user?.email ?? 'null', '| path:', location.pathname);

  useEffect(() => {
    if (!isLoading && !data?.user) {
      console.log('[AuthGuard] No user found after loading. Redirecting to /login');
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [isLoading, data, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#C5A059] border-t-transparent animate-spin" />
          <p className="text-sm text-[#1A1A1A]/50 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data?.user) return null;

  return <>{children}</>;
}
