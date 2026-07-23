import { useState, useEffect } from 'react';
import { Package, Scan, ShieldCheck, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, StatCard, Card, Badge } from '../components/ui';
import type { Product } from '../lib/types';

interface Stats {
  totalProducts: number;
  totalScans: number;
  authenticRate: number;
  activeRecalls: number;
}

interface RecentScan {
  id: string;
  code_scanned: string;
  result: string;
  created_at: string;
  product_name?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalScans: 0, authenticRate: 0, activeRecalls: 0 });
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch products for this manufacturer
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('manufacturer_id', user.id)
          .order('created_at', { ascending: false });

        const prods = (products as Product[]) || [];

        // Fetch active recalls
        const { count: recallCount } = await supabase
          .from('recalls')
          .select('*', { count: 'exact', head: true })
          .in('batch_number', prods.map(p => p.batch_number))
          .is('resolved_at', null);

        // Fetch scan logs for this manufacturer's products
        const productIds = prods.map(p => p.id);
        const { data: scanData } = await supabase
          .from('scan_logs')
          .select('id, code_scanned, result, created_at, product_id')
          .in('product_id', productIds.length > 0 ? productIds : ['none'])
          .order('created_at', { ascending: false })
          .limit(100);

        const scans = scanData || [];
        const authentic = scans.filter(s => s.result === 'authentic').length;
        const rate = scans.length > 0 ? Math.round((authentic / scans.length) * 100) : 0;

        setStats({
          totalProducts: prods.length,
          totalScans: scans.length,
          authenticRate: rate,
          activeRecalls: recallCount || 0,
        });

        // Recent scans with product name
        const recent = scans.slice(0, 8).map(s => {
          const prod = prods.find(p => p.id === s.product_id);
          return { ...s, product_name: prod?.product_name };
        });
        setRecentScans(recent);
        setRecentProducts(prods.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const resultBadge = (result: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
      authentic:   { label: 'Authentic',   variant: 'success' },
      counterfeit: { label: 'Counterfeit', variant: 'danger'  },
      recalled:    { label: 'Recalled',    variant: 'danger'  },
      duplicate:   { label: 'Duplicate',   variant: 'warning' },
      unknown:     { label: 'Unknown',     variant: 'neutral' },
    };
    const cfg = map[result] || { label: result, variant: 'neutral' as const };
    return <Badge label={cfg.label} variant={cfg.variant} />;
  };

  function ago(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>Overview of your registered medicines and scan activity</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Medicines" value={loading ? '…' : stats.totalProducts} icon={Package} color={C.primary} />
        <StatCard label="Total Scans" value={loading ? '…' : stats.totalScans.toLocaleString()} icon={Scan} color="#1A6FB5" />
        <StatCard label="Authentic Rate" value={loading ? '…' : `${stats.authenticRate}%`} icon={ShieldCheck} color={C.success} />
        <StatCard label="Active Recalls" value={loading ? '…' : stats.activeRecalls} icon={AlertTriangle} color={stats.activeRecalls > 0 ? C.danger : C.textTertiary} />
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Recent scans */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scan size={18} color={C.primary} />
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Recent Scans</h3>
            </div>
            <span style={{ fontSize: 12, color: C.textTertiary }}>{stats.totalScans} total</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <span className="spin" style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.primary, display: 'inline-block' }} />
            </div>
          ) : recentScans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 14, color: C.textTertiary }}>No scans yet. Scans will appear here once users verify your medicines.</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px', gap: 12, padding: '8px 12px', marginBottom: 4 }}>
                {['Medicine', 'Code', 'Result', 'Time'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {recentScans.map((s, i) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px', gap: 12, padding: '11px 12px', borderRadius: 10, background: i % 2 === 0 ? 'transparent' : C.surfaceElevated + '60', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.product_name || '—'}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.code_scanned}</span>
                  <span>{resultBadge(s.result)}</span>
                  <span style={{ fontSize: 12, color: C.textTertiary }}>{ago(s.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent medicines */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Package size={18} color={C.primary} />
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Recent Medicines</h3>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <span className="spin" style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.primary, display: 'inline-block' }} />
            </div>
          ) : recentProducts.length === 0 ? (
            <p style={{ fontSize: 14, color: C.textTertiary, textAlign: 'center', padding: '24px 0' }}>No medicines registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentProducts.map(p => {
                const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
                const expired = days <= 0;
                const soon = days > 0 && days <= 90;
                return (
                  <div key={p.id} style={{ padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.textTertiary, fontFamily: 'monospace' }}>{p.batch_number}</p>
                      </div>
                      <Badge
                        label={expired ? 'Expired' : soon ? `${days}d` : 'Active'}
                        variant={expired ? 'danger' : soon ? 'warning' : 'success'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
