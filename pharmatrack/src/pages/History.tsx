import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle, AlertCircle, Search, SlidersHorizontal, Calendar, ChevronRight } from 'lucide-react';

type ResultType = 'authentic' | 'counterfeit' | 'duplicate' | 'recalled' | 'unknown';
interface ScanLog { id: string; code_scanned: string; result: ResultType; created_at: string; product?: { product_name: string; manufacturer: string } | null; }
type Filter = 'all' | ResultType;

const CFG: Record<ResultType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  authentic:   { icon: CheckCircle2,  color: '#2D7A3A', bg: '#F0F7F1', label: 'Authentic'   },
  counterfeit: { icon: AlertTriangle, color: '#C93535', bg: '#FDF2F2', label: 'Counterfeit' },
  recalled:    { icon: ShieldAlert,   color: '#C93535', bg: '#FDF2F2', label: 'Recalled'    },
  duplicate:   { icon: AlertCircle,   color: '#A05E1A', bg: '#FDF7EF', label: 'Duplicate'   },
  unknown:     { icon: HelpCircle,    color: '#525252', bg: '#F5F5F5', label: 'Unknown'     },
};

function ago(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function History() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!user) { setLogs([]); setLoading(false); return; }
      const { data } = await supabase
        .from('scan_logs')
        .select('id, code_scanned, result, created_at, product:products(product_name, manufacturer)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs((data as ScanLog[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = logs.filter(l => {
    const fm = filter === 'all' || l.result === filter;
    const q = search.toLowerCase();
    const sm = !q || l.code_scanned.toLowerCase().includes(q) || (l.product?.product_name || '').toLowerCase().includes(q) || (l.product?.manufacturer || '').toLowerCase().includes(q);
    return fm && sm;
  });

  const grouped: Record<string, ScanLog[]> = {};
  filtered.forEach(l => {
    const d = new Date(l.created_at), t = new Date(), y = new Date(t);
    y.setDate(t.getDate() - 1);
    const lbl = d.toDateString() === t.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!grouped[lbl]) grouped[lbl] = [];
    grouped[lbl].push(l);
  });

  const total = logs.length;
  const auth = logs.filter(l => l.result === 'authentic').length;
  const flagged = logs.filter(l => ['counterfeit', 'recalled'].includes(l.result)).length;
  const rate = total > 0 ? Math.round((auth / total) * 100) : 0;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'authentic', label: 'Authentic' },
    { key: 'counterfeit', label: 'Counterfeit' },
    { key: 'recalled', label: 'Recalled' },
    { key: 'duplicate', label: 'Duplicate' },
    { key: 'unknown', label: 'Unknown' },
  ];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, fontFamily: "'Inter', sans-serif", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>PharmaTrack</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: c.text, margin: '0 0 20px', letterSpacing: '-0.6px' }}>History</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[{ label: 'Scans', val: total, color: c.text }, { label: 'Authentic', val: auth, color: '#2D7A3A' }, { label: 'Flagged', val: flagged, color: '#C93535' }, { label: 'Safe Rate', val: `${rate}%`, color: c.primary }].map(({ label, val, color }) => (
            <div key={label} style={{ background: c.surface, borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: `1px solid ${c.border}` }}>
              <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{val}</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: c.textTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: showFilters ? 12 : 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><Search size={15} /></div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines…"
              style={{ width: '100%', padding: '12px 12px 12px 37px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = c.primary; }} onBlur={e => { e.target.style.borderColor = c.border; }}
            />
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${showFilters ? c.primary : c.border}`, background: showFilters ? c.primaryBg : c.surface, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0, color: showFilters ? c.primary : c.textSecondary, transition: 'all 0.2s' }}>
            <SlidersHorizontal size={15} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter</span>
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              const color = key === 'authentic' ? '#2D7A3A' : key === 'counterfeit' || key === 'recalled' ? '#C93535' : key === 'duplicate' ? '#A05E1A' : key === 'unknown' ? '#525252' : c.primary;
              return (
                <button key={key} onClick={() => setFilter(key)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? color : c.border}`, background: active ? color : 'transparent', color: active ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s' }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 14 }}>
            <div className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: `2.5px solid ${c.border}`, borderTopColor: c.primary }} />
            <p style={{ margin: 0, fontSize: 14, color: c.textTertiary }}>Loading your history…</p>
          </div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 14, color: c.textSecondary }}>Sign in to see your scan history.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: c.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Calendar size={32} color={c.textTertiary} />
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: c.text }}>{search || filter !== 'all' ? 'No results' : 'No scans yet'}</h3>
            <p style={{ margin: 0, fontSize: 14, color: c.textSecondary, lineHeight: 1.6 }}>{search || filter !== 'all' ? 'Try a different search or filter' : 'Scan a medicine to see your history here'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: c.border }} />
                <span style={{ fontSize: 11, color: c.textTertiary }}>{items.length}</span>
              </div>
              <div style={{ background: c.surface, borderRadius: 20, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {items.map((log, i) => {
                  const cfg = CFG[log.result];
                  const Icon = cfg.icon;
                  return (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < items.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={19} color={cfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.product?.product_name || log.code_scanned}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: c.textTertiary }}>{log.product?.manufacturer || 'Unknown'} · {ago(log.created_at)}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>{cfg.label}</span>
                      <ChevronRight size={14} color={c.border} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
