import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toast } from './Toast';
import { DemoBanner } from './DemoBanner';

interface AdminLayoutProps {
  demoMode?: boolean;
}

export function AdminLayout({ demoMode }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] font-sans text-[#1A1A1A]">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        demoMode={demoMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {demoMode && <DemoBanner />}
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} demoMode={demoMode} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <Toast />
    </div>
  );
}
