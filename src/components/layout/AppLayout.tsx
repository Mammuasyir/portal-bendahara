import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export interface AppLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab: externalTab,
  onTabChange: externalTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<string>('dashboard');

  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const handleTabChange = externalTabChange || setInternalTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};
