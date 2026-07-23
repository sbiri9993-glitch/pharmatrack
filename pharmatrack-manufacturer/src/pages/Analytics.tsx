import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, MapPin, Package, Scan, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, Card, Badge } from '../components/ui';
import type { Product } from '../lib/types';

interface ScanLog {
  id: string;
  result: string;
  created_at: string;
  product_id: string;
  product_name?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('manufacturer_id', user.id);
        const prodList = (prods as Product[]) || [];
        setProducts(prodList);

        if (prodList.length === 0) { setScans([]); setLoading(false); return; }

        const since = new Date();
        since.setDate(since.getDate() - range);

        const { data: scanData } = await supabase
          .from('scan_logs')
          .select('id, result, created_at, product_id')
          .in('product_id', prodList.map(p => p.id))
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: true });

        const enriched = ((scanData as ScanLog[]) || []).map(s => ({
          ...s,
          product_name: prodList.find(p => p.id === s.product_id)?.product_name,
        }));
        setScans(enriched);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    load();
  }, [user, range]);

  // Compute stats
  const total = scans.length;
  const authentic = scans.filter(s => s.result === 'authentic').length;
  const counterfeit = scans.filter(s => s.result === 'counterfeit').length;
  const duplicate = scans.filter(s => s.result === 'duplicate').length;
  const unknown = scans.filter(s => s.result === 'unknown').length;
  const recalled = scans.filter(s => s.result === 'recalled').length;
  const rate = total > 0 ? Math.round((authentic / total) * 100) : 0;

  // Daily scan counts for chart
  const dailyCounts: Record<string, number> = {};
  scans.forEach(s => {
    const day = s.created_at.split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const days = Object.entries(dailyCounts).slice(-14);
  const maxCount = Math.max(...days.map(([, v]) => v), 1);

  // Per-product scan counts
  const perProduct: Record<string, { name: string; count: number; authentic: number }> = {};
  scans.forEach(s => {
    if (!perProduct[s.product_id]) {
      perProduct[s.product_id] = { name: s.product_name || s.product_id, count: 0, authentic: 0 };
    }
    perProduct[s.product_id].count++;
    if (s.result === 'authentic') perProduct[s.product_id].authentic++;
  });
  const topProducts = Object.values(perProduct).sort((a, b) => b.count - a.count).slice(0, 6);

  // Result breakdown
  const breakdown = [
    { label: 'Authentic',   count: authentic,   color: C.success,       pct: total ? Math.round((authentic / total) * 100) : 0 },
    { label: 'Counterfeit', count: counterfeit, color: C.danger,        pct: total ? Math.round((counterfeit / total) * 100) : 0 },
    { label: 'Duplicate',   count: duplicate,   color: C.warning,       pct: total ? Math.round((duplicate / total) * 100) : 0 },
    { label: 'Unknown',     count: unknown,     color: C.textTertiary,  pct: total ? Math.round((unknown / total) * 100) : 0 },
    { label: 'Recalled',    count: recalled,    color: '#C93535',       pct: total ? Math.round((recalled / total) * 100) : 0 },
  ].filter(b => b.count > 0);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Analytics</h1>
          <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>Scan activity for your registered medicines</p>
        </div>
        {/* Date range selector */}
        <div style={{ display: 'flex', background: C.surfaceElevated, borderRadius: 10, padding: 3, border: `1px solid ${C.border}`, gap: 2 }}>
          {([7, 30, 90] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: range === r ? C.surface : 'transparent', color: range === r ? C.text : C.textTertiary, fontSize: 13, fontWeight: range === r ? 600 : 500, cursor: 'pointer', transition: 'all 0.18s', boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <span className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.primary, display: 'inline-block' }} />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Scans',    val: total,     icon: Scan,         color: C.primary },
              { label: 'Authentic',      val: authentic, icon: ShieldCheck,  color: C.success },
              { label: 'Flagged',        val: counterfeit + recalled, icon: AlertTriangle, color: C.danger },
              { label: 'Authentic Rate', val: `${rate}%`, icon: TrendingUp,  color: rate >= 90 ? C.success : rate >= 70 ? C.warning : C.danger },
            ].map(({ label, val, icon: Icon, color }) => (
              <Card key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.8px' }}>{val}</p>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
            {/* Daily scan chart */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <BarChart2 size={18} color={C.primary} />
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Daily Scans — Last {range} days</h3>
              </div>
              {days.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: 14, color: C.textTertiary }}>No scan data for this period.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
                  {days.map(([day, count]) => (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
                      title={`${day}: ${count} scan${count !== 1 ? 's' : ''}`}>
                      <span style={{ fontSize: 10, color: C.textTertiary, fontWeight: 600 }}>{count > 0 ? count : ''}</span>
                      <div style={{ width: '100%', background: C.primary, borderRadius: '4px 4px 0 0', height: `${Math.max((count / maxCount) * 100, count > 0 ? 4 : 0)}%`, minHeight: count > 0 ? 4 : 0, transition: 'height 0.3s ease', opacity: 0.85 }} />
                      <span style={{ fontSize: 9, color: C.textTertiary, transform: 'rotate(-45deg)', whiteSpace: 'nowrap', transformOrigin: 'top center', marginTop: 4 }}>
                        {new Date(day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Result breakdown */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <ShieldCheck size={18} color={C.primary} />
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Result Breakdown</h3>
              </div>
              {total === 0 ? (
                <p style={{ fontSize: 14, color: C.textTertiary, textAlign: 'center', padding: '24px 0' }}>No scans in this period.</p>
              ) : (
                <>
                  {/* Stacked bar */}
                  <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', marginBottom: 20 }}>
                    {breakdown.map(({ label, color, pct }) => (
                      <div key={label} style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} title={`${label}: ${pct}%`} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {breakdown.map(({ label, count, color, pct }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 14, color: C.textSecondary }}>{label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{count}</span>
                        <span style={{ fontSize: 12, color: C.textTertiary, width: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Top products */}
          {topProducts.length > 0 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Package size={18} color={C.primary} />
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Most Scanned Products</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {topProducts.map((p, i) => {
                  const authRate = p.count > 0 ? Math.round((p.authentic / p.count) * 100) : 0;
                  return (
                    <div key={p.name} style={{ padding: '14px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceElevated + '60' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4, flex: 1 }}>{p.name}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textTertiary, flexShrink: 0 }}>#{i + 1}</span>
                      </div>
                      <p style={{ margin: '0 0 6px', fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>{p.count}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${authRate}%`, background: authRate >= 80 ? C.success : authRate >= 60 ? C.warning : C.danger, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: authRate >= 80 ? C.success : authRate >= 60 ? C.warning : C.danger, flexShrink: 0 }}>{authRate}%</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textTertiary }}>authentic rate</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
