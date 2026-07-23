import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { isSupabaseReady } from './lib/supabase';
import { Scan, History as HistoryIcon, Flag, User } from 'lucide-react';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import Scanner from './pages/Scanner';
import History from './pages/History';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import './i18n';

type Page = 'scanner' | 'history' | 'reports' | 'profile';
type AppView = 'onboarding' | 'auth' | 'app';

function AppContent() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const c = theme.colors;
  const [view, setView] = useState<AppView>('onboarding');
  const [page, setPage] = useState<Page>('scanner');
  const [reportPrefill, setReportPrefill] = useState<{ code?: string; productName?: string } | undefined>(undefined);

  useEffect(() => {
    try {
      const done = localStorage.getItem('pharmatrack-onboarding-done');
      if (!done) { setView('onboarding'); return; }
      setView('auth');
    } catch {
      setView('onboarding');
    }
  }, []);

  useEffect(() => {
    if (!loading && user && view === 'auth') setView('app');
  }, [user, loading, view]);

  // Only show loading spinner when Supabase is configured and checking session
  if (loading && isSupabaseReady()) {
    return (
      <div style={{
        minHeight: '100dvh', background: c.background,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `2.5px solid ${c.border}`,
          borderTopColor: c.primary,
          animation: 'spin 0.75s linear infinite',
        }} />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <Onboarding onComplete={() => setView('auth')} />;
  }

  // Skip auth when Supabase not configured
  if (view === 'auth' && !isSupabaseReady()) {
    return <Auth onAuthSuccess={() => setView('app')} />;
  }

  if (view === 'auth') {
    return <Auth onAuthSuccess={() => setView('app')} />;
  }

  const tabs: { key: Page; icon: typeof Scan; label: string }[] = [
    { key: 'scanner', icon: Scan,        label: 'Scan'    },
    { key: 'history', icon: HistoryIcon, label: 'History' },
    { key: 'reports', icon: Flag,        label: 'Report'  },
    { key: 'profile', icon: User,        label: 'Profile' },
  ];

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', backgroundColor: c.background,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ flex: 1 }}>
        {page === 'scanner' && (
          <Scanner onGoToReport={(prefill) => { setReportPrefill(prefill); setPage('reports'); }} />
        )}
        {page === 'history' && <History />}
        {page === 'reports' && <Reports prefill={reportPrefill} />}
        {page === 'profile' && (
          <Profile onSignOut={() => { setView('onboarding'); setPage('scanner'); }} />
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: 'sticky', bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        backgroundColor: c.surface,
        borderTop: `1px solid ${c.border}`,
        zIndex: 10,
      }}>
        {tabs.map(({ key, icon: Icon, label }) => {
          const active = page === key;
          const isReport = key === 'reports';
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: isReport ? '0' : '5px 18px',
                border: 'none', background: 'none', cursor: 'pointer',
                color: active ? (isReport ? c.danger : c.primary) : c.textTertiary,
                transition: 'color 0.2s',
              }}
            >
              {isReport ? (
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: active ? c.danger : c.surface,
                  border: `1.5px solid ${active ? 'transparent' : c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22,
                  boxShadow: active ? `0 6px 20px ${c.danger}35` : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={21} color={active ? '#fff' : c.textTertiary} strokeWidth={active ? 2.5 : 1.5} />
                </div>
              ) : (
                <Icon size={21} strokeWidth={active ? 2.5 : 1.5} />
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
