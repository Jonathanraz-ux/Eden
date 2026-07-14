import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Sparkles, Wrench, CreditCard, ArrowRight, Loader2, Users, BedDouble, Clock, CheckCircle2, Undo2, Eye, EyeOff, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useOperationsSummary } from '../lib/hooks/useOperations';
import { Skeleton } from '../components/Skeleton';
import { getCompletedTaskIds, markTaskCompleted, unmarkTaskCompleted } from '../lib/taskStorage';
import type { OperationTask } from '../lib/services/operationsService';

const typeConfig: Record<OperationTask['type'], { icon: any; color: string; bg: string }> = {
  check_in: { icon: LogIn, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  check_out: { icon: LogOut, color: 'text-blue-600', bg: 'bg-blue-50' },
  cleaning: { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  maintenance: { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
  payment_pending: { icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
  room_unassigned: { icon: BedDouble, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const priorityOrder: Record<OperationTask['priority'], number> = { high: 0, medium: 1, low: 2 };

const typeLabels: Record<OperationTask['type'], string> = {
  check_in: 'Arrivées',
  check_out: 'Départs',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
  payment_pending: 'Paiements',
  room_unassigned: 'Sans chambre',
};

const priorityLabels: Record<OperationTask['priority'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

function StatCard({ icon: Icon, label, value, href, color, detail }: { icon: any; label: string; value: number | string; href: string; color?: string; detail?: string | null }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(href)} className="bg-white border border-[#1A1A1A]/10 p-5 text-left hover:shadow-sm transition-shadow group relative">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-sm", color ?? 'bg-[#FAF9F6]')}>
          <Icon className={cn("w-4 h-4", color ? 'text-white' : 'text-[#C5A059]')} />
        </div>
        <ArrowRight className="w-4 h-4 text-[#1A1A1A]/20 group-hover:text-[#1A1A1A]/50 transition-colors" />
      </div>
      <p className="text-2xl font-semibold text-[#1A1A1A]">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-1">{label}</p>
      {detail && (
        <p className="text-[9px] text-red-500 mt-1.5 font-medium">{detail}</p>
      )}
    </button>
  );
}

function TaskRow({ task, isCompleted, onToggle }: { task: OperationTask; isCompleted: boolean; onToggle: (id: string) => void }) {
  const navigate = useNavigate();
  const cfg = typeConfig[task.type];
  const Icon = cfg.icon;

  const priorityDot = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-300';

  const actionLabel = task.type === 'check_in' ? 'Check-in' : task.type === 'check_out' ? 'Check-out' : 'Voir';

  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-3.5 border-b border-[#1A1A1A]/5 last:border-0 transition-colors group",
      isCompleted ? "bg-[#FAF9F6]" : "hover:bg-[#FAF9F6]"
    )}>
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "p-1.5 rounded-sm border transition-all shrink-0",
          isCompleted
            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
            : "border-[#1A1A1A]/10 text-transparent hover:border-[#1A1A1A]/30 hover:text-[#1A1A1A]/20"
        )}
        title={isCompleted ? 'Marquer non traitée' : 'Marquer traitée'}
      >
        <CheckCircle2 className="w-4 h-4" />
      </button>
      <div className={cn("p-2 rounded-sm", cfg.bg)}>
        <Icon className={cn("w-4 h-4", cfg.color)} />
      </div>
      <span className={cn("w-2 h-2 rounded-full shrink-0", priorityDot)} title={task.priority} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCompleted ? "text-[#1A1A1A]/30 line-through" : "text-[#1A1A1A]")}>
          {task.title}
        </p>
        <p className={cn("text-[10px] uppercase tracking-[0.1em] mt-0.5", isCompleted ? "text-[#1A1A1A]/20" : "text-[#1A1A1A]/40")}>
          {task.subtitle}
        </p>
      </div>
      {!isCompleted && (
        <button
          onClick={() => navigate(task.href)}
          className="opacity-0 group-hover:opacity-100 px-3.5 py-2 text-[9px] uppercase tracking-[0.2em] font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-all shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function OperationsCenterView() {
  const hotelId = useCurrentHotelId();
  const { data, isLoading } = useOperationsSummary(hotelId ?? '');
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedSet, setCompletedSet] = useState<Set<string>>(() => getCompletedTaskIds());
  const [activeTypeFilter, setActiveTypeFilter] = useState<OperationTask['type'] | null>(null);
  const [activePriorityFilter, setActivePriorityFilter] = useState<OperationTask['priority'] | null>(null);

  const handleToggleTask = useCallback((taskId: string) => {
    setCompletedSet(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
        unmarkTaskCompleted(taskId);
      } else {
        next.add(taskId);
        markTaskCompleted(taskId);
      }
      return next;
    });
  }, []);

  const sortedTasks = useMemo(() => {
    if (!data?.tasks) return [];
    return [...data.tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [data?.tasks]);

  const visibleTasks = useMemo(() => {
    let filtered = showCompleted ? sortedTasks : sortedTasks.filter(t => !completedSet.has(t.id));
    if (activeTypeFilter) filtered = filtered.filter(t => t.type === activeTypeFilter);
    if (activePriorityFilter) filtered = filtered.filter(t => t.priority === activePriorityFilter);
    return filtered;
  }, [sortedTasks, showCompleted, completedSet, activeTypeFilter, activePriorityFilter]);

  const pendingCount = useMemo(() => sortedTasks.filter(t => !completedSet.has(t.id)).length, [sortedTasks, completedSet]);
  const urgentCount = useMemo(() => sortedTasks.filter(t => t.priority === 'high' && !completedSet.has(t.id)).length, [sortedTasks, completedSet]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-[#1A1A1A]">Centre d'Opérations</h1>
            {!isLoading && urgentCount > 0 && (
              <span className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold bg-red-50 text-red-700 border border-red-200/60 rounded-full">
                {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-2">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i}><Skeleton className="h-28" /></div>)}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            <StatCard icon={LogIn} label="Arrivées" value={data?.arrivalsToday ?? 0} href="/front-desk" color="bg-emerald-600" detail={data?.overdueArrivals ? `+${data.overdueArrivals} en retard` : null} />
            <StatCard icon={LogOut} label="Départs" value={data?.departuresToday ?? 0} href="/front-desk" color="bg-blue-600" detail={data?.overdueDepartures ? `+${data.overdueDepartures} en retard` : null} />
            <StatCard icon={Sparkles} label="À nettoyer" value={data?.toClean ?? 0} href="/housekeeping" color="bg-amber-600" />
            <StatCard icon={Wrench} label="Maintenance" value={data?.inMaintenance ?? 0} href="/housekeeping" color="bg-orange-600" />
            <StatCard icon={CreditCard} label="Paiements en attente" value={data?.pendingPayments ?? 0} href="/payments" color="bg-red-600" />
            <StatCard icon={Users} label="Réservations actives" value={data?.activeBookings ?? 0} href="/bookings" />
            <StatCard icon={Building2} label="Taux d'occupation" value={data?.totalRooms ? `${Math.round((data.occupiedRooms / data.totalRooms) * 100)}%` : '—'} href="/front-desk" />
          </div>

          {(data?.overdueArrivals ?? 0) > 0 || (data?.overdueDepartures ?? 0) > 0 ? (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200/60 rounded-sm">
              <Clock className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-[10px] uppercase tracking-[0.15em] text-red-700 font-medium">
                {[
                  data?.overdueArrivals ? `${data.overdueArrivals} arrivée${data.overdueArrivals > 1 ? 's' : ''} en retard` : '',
                  data?.overdueDepartures ? `${data.overdueDepartures} départ${data.overdueDepartures > 1 ? 's' : ''} en retard` : '',
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          ) : null}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#1A1A1A]/30 font-medium mr-1">Filtrer :</span>
            <button
              onClick={() => setActiveTypeFilter(null)}
              className={cn(
                "px-2.5 py-1.5 text-[9px] uppercase tracking-[0.15em] font-medium rounded-sm border transition-all",
                !activeTypeFilter && !activePriorityFilter
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "text-[#1A1A1A]/40 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
              )}
            >
              Toutes
            </button>
            {(Object.keys(typeConfig) as OperationTask['type'][]).map(type => {
              const cfg = typeConfig[type];
              const Icon = cfg.icon;
              const count = sortedTasks.filter(t => t.type === type && !completedSet.has(t.id)).length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(activeTypeFilter === type ? null : type)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.15em] font-medium rounded-sm border transition-all",
                    activeTypeFilter === type
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "text-[#1A1A1A]/40 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {typeLabels[type]}
                  {count > 0 && <span className={cn("ml-1", activeTypeFilter === type ? "text-white/50" : "text-[#1A1A1A]/20")}>({count})</span>}
                </button>
              );
            })}
            <span className="w-px h-4 bg-[#1A1A1A]/10 mx-1" />
            <select
              value={activePriorityFilter ?? ''}
              onChange={e => setActivePriorityFilter((e.target.value as OperationTask['priority']) || null)}
              className="px-2.5 py-1.5 text-[9px] uppercase tracking-[0.15em] font-medium rounded-sm border border-[#1A1A1A]/10 text-[#1A1A1A]/40 bg-transparent appearance-none cursor-pointer hover:border-[#1A1A1A]/30 focus:outline-none"
            >
              <option value="">Toute priorité</option>
              {(['high', 'medium', 'low'] as const).map(p => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-[#1A1A1A]/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/10">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#C5A059]" />
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]">
                  Tâches du jour
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {completedSet.size > 0 && (
                  <button
                    onClick={() => {
                      setCompletedSet(new Set());
                      localStorage.removeItem('ops_completed_tasks');
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.15em] font-medium text-[#1A1A1A]/30 hover:text-red-600 transition-colors"
                  >
                    <Undo2 className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] font-medium rounded-sm border transition-all",
                    showCompleted
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "text-[#1A1A1A]/40 border-transparent hover:border-[#1A1A1A]/10"
                  )}
                >
                  {showCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showCompleted ? 'Masquer traités' : 'Voir traités'}
                </button>
                <span className="text-[10px] text-[#1A1A1A]/40">
                  {pendingCount} tâche{pendingCount > 1 ? 's' : ''}
                  {completedSet.size > 0 && <span className="text-[#1A1A1A]/20"> · {completedSet.size} traitée{completedSet.size > 1 ? 's' : ''}</span>}
                </span>
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-emerald-50 rounded-full mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {showCompleted ? 'Aucune tâche traitée' : 'Tout est en ordre'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/30 mt-1">
                  {showCompleted ? 'Les tâches complétées apparaîtront ici' : 'Aucune tâche en attente'}
                </p>
              </div>
            ) : (
              visibleTasks.map(task => (
                <div key={task.id}>
                  <TaskRow
                    task={task}
                    isCompleted={completedSet.has(task.id)}
                    onToggle={handleToggleTask}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
