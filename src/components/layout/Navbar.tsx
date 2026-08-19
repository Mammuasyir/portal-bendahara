import React from 'react';
import { School, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export interface NavbarProps {
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, roleLabel, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight leading-tight block">
                IDN Keuangan Santri
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistem Belanja & Tabungan Asrama
              </span>
            </div>
          </div>

          {/* Right Section: User Info, Role Badge & Logout */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <Badge variant={isAdmin ? 'primary' : 'secondary'} size="sm">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>

            {/* Profile Avatar / Info */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 font-bold text-xs">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Staf Keuangan'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none">
                  {user?.email || '-'}
                </p>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
