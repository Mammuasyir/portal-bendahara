import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { RekapSPPPage } from './features/rekapSpp/RekapSPPPage';
import { BelanjaPage } from './features/belanja/BelanjaPage';
import { TabunganPage } from './features/tabungan/TabunganPage';
import { RiwayatPage } from './features/riwayat/RiwayatPage';

// Root redirect handler
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppLayout activeTab="dashboard" onTabChange={(tab) => navigate(`/${tab}`)}>
      <DashboardPage onNavigateTab={(tab) => navigate(`/${tab}`)} />
    </AppLayout>
  );
};

const RekapSPPView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppLayout activeTab="rekap-spp" onTabChange={(tab) => navigate(`/${tab}`)}>
      <RekapSPPPage />
    </AppLayout>
  );
};

const BelanjaView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppLayout activeTab="belanja" onTabChange={(tab) => navigate(`/${tab}`)}>
      <BelanjaPage />
    </AppLayout>
  );
};

const TabunganView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppLayout activeTab="tabungan" onTabChange={(tab) => navigate(`/${tab}`)}>
      <TabunganPage />
    </AppLayout>
  );
};

const RiwayatView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppLayout activeTab="riwayat" onTabChange={(tab) => navigate(`/${tab}`)}>
      <RiwayatPage />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Main Feature Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rekap-spp"
            element={
              <ProtectedRoute requireAdmin>
                <RekapSPPView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/belanja"
            element={
              <ProtectedRoute>
                <BelanjaView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tabungan"
            element={
              <ProtectedRoute requireAdmin>
                <TabunganView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat"
            element={
              <ProtectedRoute>
                <RiwayatView />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
