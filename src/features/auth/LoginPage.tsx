import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  School,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    try {
      await login(email.trim(), password);
      navigate(fromLocation, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Email atau password salah.');
      }
    }
  };

  const fillQuickAccount = (sampleEmail: string, samplePass: string) => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-700/25">
            <School className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          IDN Keuangan Santri
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Portal Finansial Belanja & Tabungan Santri Asrama
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Main Login Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Login */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="Email Staf"
              type="email"
              placeholder="admin@idnsolo.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="mt-2"
            >
              Masuk ke Sistem
            </Button>
          </form>

          {/* Akun Referensi Server Backend */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Kredensial Staf Terdaftar di Server:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@idnsolo.com', 'admin123')}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500 text-left transition-colors"
              >
                <strong className="block text-slate-800">Admin</strong>
                <span className="text-[10px] text-slate-400">admin@idnsolo.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('kantin@idnsolo.com', 'staff123')}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500 text-left transition-colors"
              >
                <strong className="block text-slate-800">Staff Kantin</strong>
                <span className="text-[10px] text-slate-400">kantin@idnsolo.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('kafe@idnsolo.com', 'staff123')}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500 text-left transition-colors"
              >
                <strong className="block text-slate-800">Staff Kafe</strong>
                <span className="text-[10px] text-slate-400">kafe@idnsolo.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Terkoneksi ke REST API idn-keuangan Backend
        </p>
      </div>
    </div>
  );
};
