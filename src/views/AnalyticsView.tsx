import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, TrendingDown, CalendarDays, BedDouble, CreditCard, XCircle, Clock, Users, Loader2 } from 'lucide-react';
import { cn, formatCents } from '../lib/utils';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRevenueByMonth, useRevenueByDay, usePaymentMethodBreakdown, useOccupancyByRoomType, useBookingStatusDistribution, useCancellationRate, useTotalRevenue, useAvgStayDuration } from '../lib/hooks/useAnalytics';
import { BOOKING_STATUS_LABELS } from '../lib/constants';
import { Skeleton } from '../components/Skeleton';

const tabs = [
  { key: 'overview', label: 'Aperçu' },
  { key: 'revenue', label: 'Revenus' },
  { key: 'occupancy', label: 'Occupation' },
  { key: 'bookings', label: 'Réservations' },
];

const CHART_COLORS = ['#1A1A1A', '#C5A059', '#6B7280', '#9CA3AF', '#D1D5DB', '#4B5563'];
const PIE_COLORS = ['#C5A059', '#1A1A1A', '#6B7280', '#9CA3AF', '#D1D5DB'];

const methodLabels: Record<string, string> = {
  card: 'Carte',
  cash: 'Espèces',
  transfer: 'Virement',
  mobile_money: 'Mobile Money',
  check: 'Chèque',
  crypto: 'Crypto',
};

const statusLabels: Record<string, string> = BOOKING_STATUS_LABELS;

function StatCard({ icon: Icon, label, value, trend, loading }: { icon: any; label: string; value: string; trend?: { dir: 'up' | 'down'; pct: number }; loading?: boolean }) {
  return (
    <div className="bg-white border border-[#1A1A1A]/10 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-[#FAF9F6]"><Icon className="w-4 h-4 text-[#C5A059]" /></div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold", trend.dir === 'up' ? 'text-emerald-600' : 'text-red-600')}>
            {trend.dir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.pct}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-3 w-32" /></div>
      ) : (
        <>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{value}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-1">{label}</p>
        </>
      )}
    </div>
  );
}

export function AnalyticsView() {
  const hotelId = useCurrentHotelId();
  const [tab, setTab] = useState<'overview' | 'revenue' | 'occupancy' | 'bookings'>('overview');
  const [revenueDays, setRevenueDays] = useState(30);

  const { data: revenueMonthly, isLoading: loadingMonthly } = useRevenueByMonth(hotelId ?? '');
  const { data: revenueDaily, isLoading: loadingDaily } = useRevenueByDay(hotelId ?? '');
  const { data: paymentMethods, isLoading: loadingMethods } = usePaymentMethodBreakdown(hotelId ?? '');
  const { data: occupancyTypes, isLoading: loadingOccupancy } = useOccupancyByRoomType(hotelId ?? '');
  const { data: bookingStatusDist, isLoading: loadingStatusDist } = useBookingStatusDistribution(hotelId ?? '');
  const { data: cancellationRate, isLoading: loadingCancellation } = useCancellationRate(hotelId ?? '');
  const { data: totalRevenue, isLoading: loadingTotalRev } = useTotalRevenue(hotelId ?? '');
  const { data: avgStay, isLoading: loadingAvgStay } = useAvgStayDuration(hotelId ?? '');

  const revenueData = revenueDays === 30 ? revenueDaily : revenueMonthly;

  const totalOccupied = useMemo(() =>
    occupancyTypes?.reduce((s, o) => s + o.occupied, 0) ?? 0,
    [occupancyTypes]
  );
  const totalRooms = useMemo(() =>
    occupancyTypes?.reduce((s, o) => s + o.total, 0) ?? 0,
    [occupancyTypes]
  );
  const overallOccupancy = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  const totalBookingCount = useMemo(() =>
    bookingStatusDist?.reduce((s, b) => s + b.count, 0) ?? 0,
    [bookingStatusDist]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-[#1A1A1A]">Analytics & Rapports</h1>
        <p className="text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-2">Indicateurs clés et tendances</p>
      </div>

      <div className="flex gap-1 mb-8 p-1 bg-[#FAF9F6] w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all",
              tab === t.key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CreditCard} label="Revenu total" value={formatCents(totalRevenue ?? 0)} loading={loadingTotalRev} />
            <StatCard icon={CalendarDays} label="Réservations" value={String(totalBookingCount)} loading={loadingStatusDist} />
            <StatCard icon={BedDouble} label="Taux d'occupation" value={`${overallOccupancy}%`} loading={loadingOccupancy} />
            <StatCard icon={XCircle} label="Taux d'annulation" value={`${cancellationRate ?? 0}%`} loading={loadingCancellation} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Revenus Mensuels</h3>
              {loadingMonthly ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueMonthly}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C5A059" stopOpacity={0.15} /><stop offset="95%" stopColor="#C5A059" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.06} />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCents(v)} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue_cents" stroke="#C5A059" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Occupation par Type de Chambre</h3>
              {loadingOccupancy ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={occupancyTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.06} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="room_type" tick={{ fontSize: 11, fill: '#1A1A1A' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Bar dataKey="rate" fill="#1A1A1A" radius={[0, 2, 2, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Répartition des Paiements</h3>
              {loadingMethods ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentMethods} dataKey="total_cents" nameKey="method" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {paymentMethods?.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCents(v)} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Legend formatter={(v: string) => <span className="text-[10px] uppercase tracking-[0.1em] text-[#1A1A1A]/60">{methodLabels[v] ?? v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Statuts des Réservations</h3>
              {loadingStatusDist ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <div className="space-y-3">
                  {bookingStatusDist?.map((b, i) => (
                    <div key={b.status} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="flex-1 text-xs text-[#1A1A1A]/70">{statusLabels[b.status] ?? b.status}</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">{b.count}</span>
                      <div className="w-24 h-1.5 bg-[#FAF9F6] overflow-hidden">
                        <div className="h-full bg-[#1A1A1A] transition-all" style={{ width: `${totalBookingCount > 0 ? (b.count / totalBookingCount) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Revenue Tab ─── */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {[{ label: '30 jours', value: 30 }, { label: '12 mois', value: 12 }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setRevenueDays(opt.value)}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold transition-all", revenueDays === opt.value ? "bg-[#1A1A1A] text-white" : "bg-[#FAF9F6] text-[#1A1A1A]/50 border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30")}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 p-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">
              {revenueDays === 30 ? 'Revenus Quotidiens' : 'Revenus Mensuels'}
            </h3>
            {(revenueDays === 30 ? loadingDaily : loadingMonthly) ? (
              <div className="flex items-center justify-center h-72"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C5A059" stopOpacity={0.12} /><stop offset="95%" stopColor="#C5A059" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.06} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCents(v)} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue_cents" stroke="#C5A059" strokeWidth={2} fill="url(#revGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Répartition par Méthode</h3>
              {loadingMethods ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentMethods} dataKey="total_cents" nameKey="method" cx="50%" cy="50%" outerRadius={100} innerRadius={55}>
                      {paymentMethods?.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCents(v)} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Legend formatter={(v: string) => <span className="text-[10px] uppercase tracking-[0.1em] text-[#1A1A1A]/60">{methodLabels[v] ?? v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Top Méthodes par Volume</h3>
              {loadingMethods ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods
                    ?.sort((a, b) => b.total_cents - a.total_cents)
                    .map((m) => {
                      const total = paymentMethods.reduce((s, x) => s + x.total_cents, 0);
                      const pct = total > 0 ? Math.round((m.total_cents / total) * 100) : 0;
                      return (
                        <div key={m.method}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#1A1A1A]/70">{methodLabels[m.method] ?? m.method}</span>
                            <span className="text-xs font-medium text-[#1A1A1A]">{pct}%</span>
                          </div>
                          <div className="h-2 bg-[#FAF9F6] overflow-hidden">
                            <div className="h-full bg-[#C5A059] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-[#1A1A1A]/40 mt-0.5">{m.count} transactions · {formatCents(m.total_cents)}</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Occupancy Tab ─── */}
      {tab === 'occupancy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={BedDouble} label="Occupation globale" value={`${overallOccupancy}%`} loading={loadingOccupancy} />
            <StatCard icon={Users} label="Chambres occupées" value={`${totalOccupied}/${totalRooms}`} loading={loadingOccupancy} />
            <StatCard icon={Clock} label="Séjour moyen" value={avgStay ? `${avgStay} jours` : '—'} loading={loadingAvgStay} />
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 p-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Occupation par Type de Chambre</h3>
            {loadingOccupancy ? (
              <div className="flex items-center justify-center h-72"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
            ) : (
              <div className="space-y-5">
                {occupancyTypes?.map((o) => (
                  <div key={o.room_type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1A1A1A]">{o.room_type}</span>
                      <span className="text-xs text-[#1A1A1A]/50">{o.occupied}/{o.total} · {o.rate}%</span>
                    </div>
                    <div className="h-3 bg-[#FAF9F6] overflow-hidden">
                      <div className="h-full bg-[#1A1A1A] transition-all" style={{ width: `${o.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Bookings Tab ─── */}
      {tab === 'bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={CalendarDays} label="Total réservations" value={String(totalBookingCount)} loading={loadingStatusDist} />
            <StatCard icon={XCircle} label="Taux d'annulation" value={`${cancellationRate ?? 0}%`} loading={loadingCancellation} />
            <StatCard icon={Clock} label="Durée moyenne" value={avgStay ? `${avgStay} jours` : '—'} loading={loadingAvgStay} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Distribution par Statut</h3>
              {loadingStatusDist ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingStatusDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.06} />
                    <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => statusLabels[v] ?? v} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Réservations']} labelFormatter={(l) => statusLabels[l] ?? l} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#1A1A1A" radius={[2, 2, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-[#1A1A1A]/10 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-6">Répartition des Statuts</h3>
              {loadingStatusDist ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={bookingStatusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} innerRadius={55}>
                      {bookingStatusDist?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip labelFormatter={(l) => statusLabels[l] ?? l} contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
                    <Legend formatter={(v: string) => <span className="text-[10px] uppercase tracking-[0.1em] text-[#1A1A1A]/60">{statusLabels[v] ?? v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
