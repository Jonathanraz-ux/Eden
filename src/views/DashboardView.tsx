import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from '../components/StarRating';
import { BOOKING_STATUS_LABELS as statusLabels } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '../components/Skeleton';
import { useBookings } from '../lib/hooks/useBookings';
import { usePayments } from '../lib/hooks/usePayments';
import { useReviews } from '../lib/hooks/useReviews';
import { useRooms } from '../lib/hooks/useRooms';
import { useCurrentHotelId } from '../lib/hooks/useAuth';

function formatCents(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) return `${(euros / 1000).toFixed(1)}k €`;
  return `${euros.toFixed(0)} €`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  checked_in: 'secondary',
  checked_out: 'secondary',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
  expired: 'outline',
};

export function DashboardView() {
  const hotelId = useCurrentHotelId();
  const { data: bookings, isLoading: loadingBookings } = useBookings(hotelId ?? '');
  const { data: payments, isLoading: loadingPayments } = usePayments(hotelId ?? '');
  const { data: reviews, isLoading: loadingReviews } = useReviews(hotelId ?? '');
  const { data: rooms, isLoading: loadingRooms } = useRooms(hotelId ?? '');

  const loading = loadingBookings || loadingPayments || loadingReviews || loadingRooms;

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const prevMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 1, 1), [now]);
  const prevMonthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59), [now]);

  const stats = useMemo(() => {
    if (!bookings || !payments || !reviews || !rooms) return null;

    const activeBookings = bookings.filter(b =>
      !['completed', 'cancelled', 'no_show', 'expired'].includes(b.status)
    );
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

    const thisMonthRevenue = payments
      .filter(p => p.status === 'success' && new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const lastMonthRevenue = payments
      .filter(p => p.status === 'success' && new Date(p.created_at) >= prevMonthStart && new Date(p.created_at) < monthStart)
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const revenueTrend = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0;

    const thisMonthBookings = bookings.filter(b => new Date(b.created_at) >= monthStart).length;
    const lastMonthBookings = bookings.filter(b => new Date(b.created_at) >= prevMonthStart && new Date(b.created_at) < monthStart).length;
    const bookingsTrend = lastMonthBookings > 0
      ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : thisMonthBookings > 0 ? 100 : 0;

    const thisMonthRevenuePerRoom = payments
      .filter(p => p.status === 'success' && new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const lastMonthRevenuePerRoom = payments
      .filter(p => p.status === 'success' && new Date(p.created_at) >= prevMonthStart && new Date(p.created_at) < monthStart)
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const occupancyTrend = lastMonthRevenuePerRoom > 0
      ? Math.round(((thisMonthRevenuePerRoom - lastMonthRevenuePerRoom) / lastMonthRevenuePerRoom) * 100)
      : thisMonthRevenuePerRoom > 0 ? 100 : 0;

    const thisMonthReviews = reviews.filter(r => new Date(r.created_at) >= monthStart);
    const lastMonthReviews = reviews.filter(r => new Date(r.created_at) >= prevMonthStart && new Date(r.created_at) < monthStart);
    const thisMonthAvg = thisMonthReviews.length > 0
      ? thisMonthReviews.reduce((sum, r) => sum + r.rating, 0) / thisMonthReviews.length
      : 0;
    const lastMonthAvg = lastMonthReviews.length > 0
      ? lastMonthReviews.reduce((sum, r) => sum + r.rating, 0) / lastMonthReviews.length
      : 0;
    const ratingTrend = lastMonthAvg > 0
      ? Math.round((thisMonthAvg - lastMonthAvg) * 10)
      : thisMonthAvg > 0 ? 5 : 0;

    return {
      revenue: totalRevenue,
      activeBookings: activeBookings.length,
      occupancy: occupancyRate,
      rating: avgRating,
      revenueTrend,
      bookingsTrend,
      occupancyTrend,
      ratingTrend,
    };
  }, [bookings, payments, reviews, rooms, monthStart, prevMonthStart]);

  const revenueChart = useMemo(() => {
    if (!payments) return [];
    const monthly: Record<string, number> = {};
    payments
      .filter(p => p.status === 'success')
      .forEach(p => {
        const month = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        monthly[month] = (monthly[month] ?? 0) + p.amount_cents;
      });
    return Object.entries(monthly).map(([name, value]) => ({ name, revenu: Math.round(value / 100) }));
  }, [payments]);

  const recentBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.slice(0, 5);
  }, [bookings]);

  const recentReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.slice(0, 4);
  }, [reviews]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader className="pb-2">
                <Skeleton className="w-24 h-3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-32 h-8 mb-3" />
                <Skeleton className="w-20 h-3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="w-40 h-3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[340px]" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[5, 4].map((rows, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-36 h-3" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {Array.from({ length: rows }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 px-6 py-4">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="w-32 h-3" />
                        <Skeleton className="w-24 h-2" />
                      </div>
                      <Skeleton className="w-16 h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiItems = stats ? [
    { label: 'Revenu Total', value: formatCents(stats.revenue), trend: stats.revenueTrend },
    { label: 'Réservations Actives', value: String(stats.activeBookings), trend: stats.bookingsTrend },
    { label: "Taux d'Occupation", value: `${stats.occupancy}%`, trend: stats.occupancyTrend },
    { label: 'Note Moyenne', value: String(stats.rating), trend: stats.ratingTrend },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiItems.map((stat, i) => (
          <Card
            key={i}
            size="sm"
            className={cn(
              "transition-all duration-200 hover:shadow-sm",
              i === 3 && "bg-[#C5A059] text-white border-[#C5A059] ring-[#C5A059]"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={cn(
                "text-[9px] uppercase tracking-[0.25em] font-semibold",
                i === 3 ? "text-white/70" : "text-muted-foreground"
              )}>
                {stat.label}
              </CardTitle>
              {stat.trend > 0
                ? <TrendingUp className={cn("w-4 h-4", i === 3 ? "text-white/60" : "text-emerald-500")} />
                : <TrendingDown className={cn("w-4 h-4", i === 3 ? "text-white/60" : "text-red-400")} />
              }
            </CardHeader>
            <CardContent>
              <h3 className={cn(
                "text-3xl font-serif tracking-tight",
                i === 3 ? "text-white" : "text-[#1A1A1A]"
              )}>
                {stat.value}
              </h3>
              <p className={cn(
                "text-[10px] mt-2 font-medium",
                i === 3 ? "text-white/60" : (
                  stat.trend > 0 ? "text-emerald-600" : "text-red-500"
                )
              )}>
                {stat.trend > 0 ? '+' : ''}{stat.trend}% vs mois dernier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">
            Évolution des Revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            {revenueChart.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">Aucune donnée de revenus</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C5A059" stopOpacity={0.25} />
                      <stop offset="60%" stopColor="#C5A059" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#C5A059" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" strokeOpacity={0.06} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#1A1A1A', opacity: 0.35, fontSize: 10, textTransform: 'uppercase' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#1A1A1A', opacity: 0.35, fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}€`}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A1A',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 14px',
                    }}
                    labelStyle={{ color: '#FAF9F6', opacity: 0.6, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em' }}
                    itemStyle={{ color: '#C5A059', fontWeight: 600, fontSize: '13px' }}
                    formatter={(value: number) => [`${value} €`, 'Revenu']}
                  />
                  <Area type="monotone" dataKey="revenu" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenu)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">
              Réservations Récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="px-6 py-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 text-center">
                Aucune réservation récente
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">Réservation</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">Dates</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">Montant</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">Statut</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs font-serif text-muted-foreground">
                              {booking.booking_reference?.charAt(0) ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-[#1A1A1A]">{booking.booking_reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
                      </TableCell>
                      <TableCell className="text-sm font-serif text-[#1A1A1A]">{formatCents(booking.total_amount_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[booking.status] ?? 'outline'} className="text-[9px] uppercase tracking-wider">
                          {statusLabels[booking.status] ?? booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[9px] uppercase tracking-[0.25em] font-semibold text-muted-foreground">
              Derniers Avis Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 text-center">
                Aucun avis récent
              </div>
            ) : (
              <div className="divide-y">
                {recentReviews.map((review) => (
                  <div key={review.id} className="px-6 py-5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs font-medium text-muted-foreground">
                            {(review as any).guest?.first_name?.charAt(0) ?? 'C'}
                            {(review as any).guest?.last_name?.charAt(0) ?? ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {(review as any).guest?.first_name ?? 'Client'} {(review as any).guest?.last_name ?? ''}
                          </p>
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <StarRating
                        rating={review.rating}
                        starClassName="w-3 h-3"
                        inactiveClassName="text-muted-foreground/20"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/70 italic leading-relaxed line-clamp-2">
                      &ldquo;{review.comment ?? '—'}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
