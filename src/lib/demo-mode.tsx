import { createContext, useContext, type ReactNode } from 'react';
import { triggerToast } from '../components/Toast';

// ---------------------------------------------------------------------------
// Demo Mode Context
// ---------------------------------------------------------------------------

interface DemoModeContextValue {
  demoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextValue>({ demoMode: false });

export function useDemoMode(): DemoModeContextValue {
  return useContext(DemoModeContext);
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  return (
    <DemoModeContext.Provider value={{ demoMode: true }}>
      {children}
    </DemoModeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Demo Mutation Helper
// ---------------------------------------------------------------------------

const DEMO_TOAST = 'Action simulée avec succès. Aucune donnée réelle n\'a été modifiée.';

export function demoMutationResult<T>(data: T): Promise<T> {
  triggerToast(DEMO_TOAST);
  return Promise.resolve(data);
}

export function demoMutationSuccess(): Promise<void> {
  triggerToast(DEMO_TOAST);
  return Promise.resolve();
}
