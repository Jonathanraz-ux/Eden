import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth, useLogout } from '../lib/hooks/useAuth';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  UserRound,
  MessageSquareQuote,
  Settings,
  LogOut,
  Hotel,
  CreditCard,
  LogIn,
  Sparkles,
  Euro,
  FileText,
  BarChart3,
  Gauge,
  Image as ImageIcon,
  UtensilsCrossed,
  Gem,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  demoMode?: boolean;
}

const menuItems = [
  { path: '/', label: "Vue d'ensemble", icon: LayoutDashboard },
  { path: '/operations', label: 'Opérations', icon: Gauge },
  { path: '/front-desk', label: 'Réception', icon: LogIn },
  { path: '/housekeeping', label: 'Ménage', icon: Sparkles },
  { path: '/pricing', label: 'Tarifs', icon: Euro },
  { path: '/bookings', label: 'Réservations', icon: CalendarDays },
  { path: '/payments', label: 'Finances', icon: CreditCard },
  { path: '/invoicing', label: 'Facturation', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/guests', label: 'Clients', icon: UserRound },
  { path: '/rooms', label: 'Chambres', icon: BedDouble },
  { path: '/employees', label: 'Équipe', icon: Users },
  { path: '/gallery', label: 'Galerie', icon: ImageIcon },
  { path: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { path: '/services', label: 'Services', icon: Gem },
  { path: '/reviews', label: 'Avis Clients', icon: MessageSquareQuote },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar({ isOpen, setIsOpen, demoMode }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: auth } = useAuth();
  const logout = useLogout();
  const employee = auth?.employee;

  const initials = employee
    ? (
        (employee.first_name?.charAt(0) ?? '') +
        (employee.last_name?.charAt(0) ?? '')
      ).toUpperCase().trim() || '?'
    : 'AD';

  const handleLogout = async () => {
    if (demoMode) {
      navigate('/', { replace: true });
      return;
    }
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  const handleNavigate = (path: string) => {
    if (demoMode) {
      navigate('/demo' + (path === '/' ? '' : path));
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    if (demoMode) {
      const fullPath = '/demo' + (path === '/' ? '' : path);
      return location.pathname === fullPath;
    }
    return location.pathname === path;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-[#1A1A1A] text-[#FAF9F6] z-50 flex flex-col border-r border-white/5 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-8 pt-10 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h1 className="text-xl font-serif italic tracking-tight">L'Éden</h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-medium mt-0.5">Hôtel &amp; Lodge</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pt-6 pb-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200 group",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active && "text-[#C5A059]"
                )} />
                <span className="tracking-wide">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-[#C5A059]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mx-4 mb-6 border-t border-white/5 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-white/5 transition-colors group text-left"
            disabled={logout.isPending}
          >
            <div className="w-9 h-9 rounded-full bg-[#C5A059] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {demoMode ? <X className="w-4 h-4" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              {demoMode ? (
                <>
                  <p className="text-sm font-medium truncate text-[#C5A059]">Quitter la démo</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Retour à l'accueil</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium truncate">
                    {employee ? `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || 'Admin' : 'Admin'}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                    {employee?.job_title ?? 'Gestionnaire'}
                  </p>
                </>
              )}
            </div>
            <LogOut className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors shrink-0" />
          </button>
        </div>
      </motion.aside>
    </>
  );
}
