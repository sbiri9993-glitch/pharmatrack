import { Shield, LayoutDashboard, Package, AlertTriangle, BarChart2, LogOut, ChevronRight, Flag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../ui';

type Page = 'dashboard' | 'medicines' | 'recalls' | 'analytics' | 'reports' | 'admin';

interface Props {
  current: Page;
  onChange: (p: Page) => void;
  onSignOut: () => void;
}

const MANUFACTURER_NAV = [
  { key: 'dashboard'  as Page, icon: LayoutDashboard, label: 'Dashboard'  },
  { key: 'medicines'  as Page, icon: Package,          label: 'Medicines'  },
  { key: 'recalls'    as Page, icon: AlertTriangle,    label: 'Recalls'    },
  { key: 'reports'    as Page, icon: Flag,             label: 'Reports'    },
  { key: 'analytics'  as Page, icon: BarChart2,        label: 'Analytics'  },
];

const ADMIN_NAV = [
  { key: 'admin'      as Page, icon: ShieldCheck,      label: 'Regulatory Overview' },
];

export default function Sidebar({ current, onChange, onSignOut }: Props) {
  const { user, isAdmin } = useAuth();
  const nav = isAdmin ? ADMIN_NAV : MANUFACTURER_NAV;

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: C.sidebar, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isAdmin ? '#1A6FB5' : C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: '#fff' }}>PharmaTrack</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {isAdmin ? 'Regulatory Portal' : 'Manufacturer Portal'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div style={{ marginTop: 12, padding: '5px 10px', borderRadius: 20, background: 'rgba(26,111,181,0.2)', display: 'inline-block' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#5B9FE0', letterSpacing: '0.04em' }}>MINSANTE ACCOUNT</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ key, icon: Icon, label }) => {
          const active = current === key;
          return (
            <button key={key} onClick={() => onChange(key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: active ? 'rgba(29,158,117,0.15)' : 'transparent', color: active ? C.sidebarActive : C.sidebarText, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: active ? 600 : 400, transition: 'all 0.18s', width: '100%' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.user_metadata?.company || user?.email?.split('@')[0] || 'Manufacturer'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
        </div>
        <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, width: '100%', transition: 'all 0.18s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
