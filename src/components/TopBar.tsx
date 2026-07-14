import { Menu, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../lib/hooks/useAuth';
import { NotificationBell } from './NotificationBell';

interface TopBarProps {
  onMenuClick: () => void;
  demoMode?: boolean;
}

const titles: Record<string, string> = {
  '/': "Vue d'ensemble",
  '/bookings': 'Réservations',
  '/payments': 'Finances',
  '/rooms': 'Chambres',
  '/employees': 'Équipe',
  '/reviews': 'Avis Clients',
  '/settings': 'Paramètres',
};

export function TopBar({ onMenuClick, demoMode }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: auth } = useAuth();
  const logout = useLogout();
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const pathname = demoMode && location.pathname.startsWith('/demo')
    ? location.pathname.slice(5) || '/'
    : location.pathname;
  const title = titles[pathname] ?? 'Dashboard';

  const handleLogout = async () => {
    if (demoMode) {
      navigate('/', { replace: true });
      return;
    }
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-20 border-b border-[#1A1A1A]/10 px-6 lg:px-10 flex items-center justify-between bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 lg:hidden text-[#1A1A1A] opacity-50 hover:opacity-100 transition-opacity"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#1A1A1A]/30 hidden sm:block">Système de Gestion</span>
          <h2 className="text-lg font-serif text-[#1A1A1A]">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">{date}</p>
          <p className="text-sm font-medium tracking-tight text-[#1A1A1A]/70">
            {demoMode ? 'Mode démo' : (auth?.employee ? `${auth.employee.first_name} ${auth.employee.last_name}` : '')}
          </p>
        </div>
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="p-2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/70 transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
