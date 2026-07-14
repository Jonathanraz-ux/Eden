import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { hotelService } from '../services/hotelService';
import { useDemoMode, demoMutationSuccess } from '../demo-mode';
import { DEMO_HOTEL_ID, demoEmployees } from '../../data/demo-data';

const demoAuthData = {
  user: { id: 'demo-user', email: 'demo@eden-hotel.com' } as any,
  employee: { ...demoEmployees[0], hotel_id: DEMO_HOTEL_ID },
};

export function useAuth() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      if (demoMode) return demoAuthData;
      const session = await authService.getSession();
      if (!session?.user) return { user: null, employee: null };

      let employee = null;
      try {
        employee = await authService.getCurrentEmployee(session.user.id);
      } catch (e) {
        console.warn('[useAuth] Could not load employee profile:', e);
      }

      if (!employee) {
        try {
          const defaultHotel = await hotelService.getDefault();
          if (defaultHotel) {
            employee = await authService.registerEmployee({
              hotelId: defaultHotel.id,
              authUserId: session.user.id,
              firstName: 'Admin',
              lastName: 'Système',
              email: session.user.email ?? '',
            });
          }
        } catch (e) {
          console.warn('[useAuth] Auto-registration failed:', e);
        }
      }

      return { user: session.user, employee };
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const authData = await authService.login(email, password);
      const user = authData.session?.user ?? null;

      let employee = null;
      if (user) {
        try {
          employee = await authService.getCurrentEmployee(user.id);
        } catch (e) {
          console.warn('[useLogin] Could not load employee profile:', e);
        }

        if (!employee) {
          try {
            const defaultHotel = await hotelService.getDefault();
            if (defaultHotel) {
              employee = await authService.registerEmployee({
                hotelId: defaultHotel.id,
                authUserId: user.id,
                firstName: 'Admin',
                lastName: 'Système',
                email: user.email ?? '',
              });
            }
          } catch (e) {
            console.warn('[useLogin] Auto-registration failed:', e);
          }
        }
      }

      return { user, employee };
    },
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'session'], data);
    },
    onError: (error) => {
      console.error('[useLogin] Mutation error:', error);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: () => {
      if (demoMode) return demoMutationSuccess();
      return authService.logout();
    },
    onSuccess: () => {
      console.log('[useLogout] Logout success, clearing cache');
      qc.setQueryData(['auth', 'session'], { user: null, employee: null });
      qc.clear();
    },
  });
}

export function useDefaultHotel() {
  return useQuery({
    queryKey: ['default_hotel'],
    queryFn: () => hotelService.getDefault(),
    staleTime: 300_000,
  });
}

export function useCurrentHotelId(): string | undefined {
  const { demoMode } = useDemoMode();
  const { data } = useAuth();
  const { data: defaultHotel } = useDefaultHotel();
  if (demoMode) return DEMO_HOTEL_ID;
  return data?.employee?.hotel_id ?? defaultHotel?.id;
}
