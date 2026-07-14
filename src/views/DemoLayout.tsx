import { DemoModeProvider } from '../lib/demo-mode';
import { AdminLayout } from '../components/AdminLayout';

export function DemoLayout() {
  return (
    <DemoModeProvider>
      <AdminLayout demoMode />
    </DemoModeProvider>
  );
}
