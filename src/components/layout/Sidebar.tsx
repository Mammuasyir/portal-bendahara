import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  History,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard Ringkasan', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'rekap-spp', label: 'Dashboard SPP', icon: <CalendarCheck className="w-5 h-5" />, adminOnly: true },
  { id: 'belanja', label: 'Kasir Belanja Santri', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'tabungan', label: 'Tabungan & Setor SPP', icon: <Wallet className="w-5 h-5" />, adminOnly: true },
  { id: 'riwayat', label: 'Riwayat per NISN', icon: <History className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { isAdmin } = useAuth();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex-shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Menu Utama
        </p>
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-bold shadow-sm border border-teal-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
