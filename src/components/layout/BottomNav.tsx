import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  History,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const BOTTOM_ITEMS = [
  { id: 'dashboard', label: 'Ringkasan', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'rekap-spp', label: 'SPP', icon: <CalendarCheck className="w-5 h-5" />, adminOnly: true },
  { id: 'belanja', label: 'Belanja', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'tabungan', label: 'Tabungan', icon: <Wallet className="w-5 h-5" />, adminOnly: true },
  { id: 'riwayat', label: 'Riwayat', icon: <History className="w-5 h-5" /> },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { isAdmin } = useAuth();
  const visibleItems = BOTTOM_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors touch-target
                ${isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'}
              `}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-teal-50 text-teal-700' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
