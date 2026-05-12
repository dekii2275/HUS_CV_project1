import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AICopilot } from '../dashboard/AICopilot';
import { cn } from '../../utils/utils';

export const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background-muted font-sans text-text-primary relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] border border-border-subtle rounded-full opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] border border-border-subtle rounded-full opacity-10 pointer-events-none" />
      
      <TopBar />
      <Sidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <main className={cn(
        "pt-14 min-h-screen relative z-10 transition-all duration-300",
        isSidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Vertical Sidebar Text Decor */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[8px] tracking-[0.8em] font-bold text-text-muted whitespace-nowrap opacity-30 ml-2 pointer-events-none">
        OPERATIONAL SYSTEM / v2.0.4 / KINETIX STUDIO
      </div>

      <AICopilot />
    </div>
  );
};
