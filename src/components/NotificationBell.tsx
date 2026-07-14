import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Clock, AlertTriangle, Info, CreditCard, CalendarCheck } from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '../lib/hooks/useNotifications';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';

const categoryIcons: Record<string, typeof Bell> = {
  confirmation: CalendarCheck,
  reminder: Clock,
  alert: AlertTriangle,
  promotion: Info,
  invoice: CreditCard,
  internal: Info,
  urgent: AlertTriangle,
};

const categoryColors: Record<string, string> = {
  confirmation: 'text-emerald-500',
  reminder: 'text-amber-500',
  alert: 'text-red-500',
  promotion: 'text-blue-500',
  invoice: 'text-violet-500',
  internal: 'text-gray-500',
  urgent: 'text-rose-500',
};

export function NotificationBell() {
  const hotelId = useCurrentHotelId();
  const { data: notifications } = useNotifications(hotelId ?? '');
  const markAsRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = (notifications ?? []).filter(n => !readIds.has(n.id)).length;

  const handleMarkRead = async (notificationId: string) => {
    setReadIds(prev => new Set(prev).add(notificationId));
    try {
      await markAsRead.mutateAsync({ notificationId, recipientId: notificationId });
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = () => {
    if (!notifications) return;
    const ids = new Set(readIds);
    notifications.forEach(n => ids.add(n.id));
    setReadIds(ids);
    triggerToast('Toutes les notifications marquées comme lues');
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/70 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white shadow-2xl border border-[#1A1A1A]/10 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]/5">
            <h3 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-rose-500">({unreadCount} non lues)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[9px] uppercase tracking-[0.15em] font-semibold text-[#C5A059] hover:text-[#1A1A1A] transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Tout lire
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {(!notifications || notifications.length === 0) ? (
              <div className="px-5 py-12 text-center">
                <Bell className="w-8 h-8 mx-auto text-[#1A1A1A]/10 mb-3" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const Icon = categoryIcons[n.category] ?? Bell;
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={cn(
                      "w-full text-left px-5 py-4 border-b border-[#1A1A1A]/5 hover:bg-[#FAF9F6] transition-colors group",
                      !isRead && "bg-amber-50/40"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("mt-0.5 shrink-0", categoryColors[n.category] ?? 'text-gray-400')}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-xs font-medium truncate",
                            !isRead ? "text-[#1A1A1A]" : "text-[#1A1A1A]/60"
                          )}>
                            {n.title}
                          </p>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#1A1A1A]/50 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[9px] text-[#1A1A1A]/30 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
