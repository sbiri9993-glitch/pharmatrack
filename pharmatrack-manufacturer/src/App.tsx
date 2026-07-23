import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Recalls from './pages/Recalls';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import AdminOverview from './pages/AdminOverview';
import { C } from './components/ui';
import { isSupabaseReady } from './lib/supabase';

type Page = 'dashboard' | 'medicines' | 'recalls' | 'analytics' | 'reports' | 'admin';

function AppContent() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  // Admin accounts land on the regulatory overview, not the manufacturer dashboard
  useEffect(() => {
    if (isAdmin) setPage('admin');
  }, [isAdmin]);

  // Loading spinner — only shown when Supabase IS configured and checking session
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.background, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <span className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.primary, display: 'inline-block' }} />
        <p style={{ fontSize: 13, color: C.textTertiary, margin: 0 }}>Loading…</p>
      </div>
    );
  }

  // If Supabase IS configured but no user — show sign in
  if (isSupabaseReady() && !user) {
    return <Auth onSuccess={() => window.location.reload()} />;
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.background }}>
      <Sidebar current={page} onChange={setPage} onSignOut={handleSignOut} />
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: 'calc(100vw - 240px)' }}>
        {isAdmin ? (
          // Admin accounts only ever see the regulatory overview
          <AdminOverview />
        ) : (
          <>
            {page === 'dashboard' && <Dashboard />}
            {page === 'medicines' && <Medicines />}
            {page === 'recalls'   && <Recalls />}
            {page === 'reports'   && <Reports />}
            {page === 'analytics' && <Analytics />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
