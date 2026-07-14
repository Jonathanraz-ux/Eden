import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { AdminLayout } from './components/AdminLayout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { getSupabase } from './lib/supabase';

function AuthStateSync() {
  const qc = useQueryClient();

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;

    try {
      const supabase = getSupabase();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthSync] onAuthStateChange:', event, 'user:', session?.user?.email ?? 'null');

        if (event === 'SIGNED_IN') {
          qc.setQueryData(['auth', 'session'], { user: session?.user ?? null, employee: null });
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            qc.setQueryData(['auth', 'session'], (old: any) => ({
              user: session.user,
              employee: old?.employee ?? null,
            }));
          }
        } else if (event === 'SIGNED_OUT') {
          qc.setQueryData(['auth', 'session'], { user: null, employee: null });
        }
      });
      sub = subscription;
    } catch (e) {
      console.error('[AuthSync] Failed to subscribe:', e);
    }

    return () => { sub?.unsubscribe(); };
  }, [qc]);

  return null;
}

import { FrontDeskView } from './views/FrontDeskView';
import { HousekeepingView } from './views/HousekeepingView';
import { RoomsView } from './views/RoomsView';
import { GuestsView } from './views/GuestsView';
import { BookingsView } from './views/BookingsView';
import { PricingView } from './views/PricingView';
import { PaymentsView } from './views/PaymentsView';
import { InvoicingView } from './views/InvoicingView';
import { AnalyticsView } from './views/AnalyticsView';
import { OperationsCenterView } from './views/OperationsCenterView';
import { EmployeesView } from './views/EmployeesView';
import { ReviewsView } from './views/ReviewsView';
import { SettingsView } from './views/SettingsView';
import { GalleryView } from './views/GalleryView';
import { RestaurantView } from './views/RestaurantView';
import { ServicesView } from './views/ServicesView';
import { DemoLayout } from './views/DemoLayout';

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AdminLayout />
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthStateSync />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="front-desk" element={<FrontDeskView />} />
          <Route path="housekeeping" element={<HousekeepingView />} />
          <Route path="rooms" element={<RoomsView />} />
          <Route path="bungalows" element={<Navigate to="/rooms" replace />} />
          <Route path="guests" element={<GuestsView />} />
          <Route path="bookings" element={<BookingsView />} />
          <Route path="pricing" element={<PricingView />} />
          <Route path="payments" element={<PaymentsView />} />
          <Route path="invoicing" element={<InvoicingView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="operations" element={<OperationsCenterView />} />
          <Route path="employees" element={<EmployeesView />} />
          <Route path="gallery" element={<GalleryView />} />
          <Route path="restaurant" element={<RestaurantView />} />
          <Route path="services" element={<ServicesView />} />
          <Route path="reviews" element={<ReviewsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/demo" element={<DemoLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="front-desk" element={<FrontDeskView />} />
          <Route path="housekeeping" element={<HousekeepingView />} />
          <Route path="rooms" element={<RoomsView />} />
          <Route path="guests" element={<GuestsView />} />
          <Route path="bookings" element={<BookingsView />} />
          <Route path="pricing" element={<PricingView />} />
          <Route path="payments" element={<PaymentsView />} />
          <Route path="invoicing" element={<InvoicingView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="operations" element={<OperationsCenterView />} />
          <Route path="employees" element={<EmployeesView />} />
          <Route path="gallery" element={<GalleryView />} />
          <Route path="restaurant" element={<RestaurantView />} />
          <Route path="services" element={<ServicesView />} />
          <Route path="reviews" element={<ReviewsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
