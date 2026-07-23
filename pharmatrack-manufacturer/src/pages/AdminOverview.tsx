import { useState, useEffect } from 'react';
import { Flag, Search, AlertTriangle, Package, FileText, HelpCircle, MapPin, Calendar, Building2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { C, Input, Card, Badge, EmptyState, Table, Td, Textarea } from '../components/ui';
import type { Report, Product } from '../lib/types';

interface ReportWithManufacturer extends Report {
  manufacturer_name?: string;
}

const REASON_META: Record<string, { label: string; icon: React.ElementType }> = {
  counterfeit:        { label: 'Counterfeit Medicine',  icon: AlertTriangle },
  packaging_damage:   { label: 'Damaged Packaging',     icon: Package       },
  wrong_medicine:     { label: 'Wrong Medicine Inside', icon: FileText      },
  suspicious_seller:  { label: 'Suspicious Seller',     icon: Flag          },
  other:               { label: 'Other Concern',         icon: HelpCircle    },
};

const STATUS_OPTIONS: { value: Report['status']; label: string }[] = [
  { value: 'pending',       label: 'Pending Review' },
  { value: 'investigating', label: 'Investigating'  },
  { value: 'resolved',      label: 'Resolved'       },
  { value: 'dismissed',     label: 'Dismissed'      },
];

export default function AdminOverview() {
  const [reports, setReports] = useState<ReportWithManufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Report['status']>('all');
  const [selected, setSelected] = useState<ReportWithManufacturer | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // As admin, RLS lets this see EVERY report across all manufacturers
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: productData } = await supabase
        .from('products')
        .select('id, manufacturer');

      const productMap = new Map((productData as Product[] | null)?.map(p => [p.id, p.manufacturer]) || []);

      const enriched = ((reportData as Report[]) || []).map(r => ({
        ...r,
        manufacturer_name: r.product_id ? productMap.get(r.product_id) : undefined,
      }));
      setReports(enriched);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openReport = (r: ReportWithManufacturer) => {
    setSelected(r);
    setNote(r.manufacturer_response || '');
  };

  const updateStatus = async (status: Report['status']) => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from('reports').update({
        status,
        manufacturer_response: note.trim() || selected.manufacturer_response,
        resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
      }).eq('id', selected.id);
      setSelected(null);
      load();
    } finally { setSaving(false); }
  };

  const filtered = reports.filter(r => {
    const fm = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const sm = !q ||
      (r.product_name || '').toLowerCase().includes(q) ||
      (r.manufacturer_name || '').toLowerCase().includes(q) ||
      (r.code_scanned || '').toLowerCase().includes(q);
    return fm && sm;
  });

  const pending = reports.filter(r => r.status === 'pending').length;
  const investigating = reports.filter(r => r.status === 'investigating').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const statusBadge = (s: Report['status']) => {
    const map: Record<Report['status'], { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
      pending:       { label: 'Pending',       variant: 'warning' },
      investigating: { label: 'Investigating', variant: 'neutral' },
      resolved:      { label: 'Resolved',      variant: 'success' },
      dismissed:     { label: 'Dismissed',     variant: 'neutral' },
    };
    return <Badge label={map[s].label} variant={map[s].variant} />;
  };

  function ago(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color={C.primary} />
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>Regulatory Overview</h1>
        </div>
        <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>All reports filed across every registered manufacturer</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Reports',  val: reports.length, color: C.text },
          { label: 'Pending',        val: pending,         color: C.warning },
          { label: 'Investigating',  val: investigating,   color: '#1A6FB5' },
          { label: 'Resolved',       val: resolved,        color: C.success },
        ].map(({ label, val, color }) => (
          <Card key={label}>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.6px' }}>{val}</p>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <Input value={search} onChange={setSearch} placeholder="Search by product, manufacturer or code…" icon={<Search size={15} />} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table headers={['Reason', 'Product', 'Manufacturer', 'Code', 'Filed', 'Status']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={6}>
              <EmptyState icon={Flag} title="No reports" body="No reports have been filed by any user yet." />
            </td></tr>
          ) : (
            filtered.map(r => {
              const meta = REASON_META[r.reason] || REASON_META.other;
              const Icon = meta.icon;
              return (
                <tr key={r.id} onClick={() => openReport(r)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceElevated + '60'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={15} color={C.textTertiary} />
                      <span style={{ fontWeight: 600 }}>{meta.label}</span>
                    </div>
                  </Td>
                  <Td>{r.product_name || '—'}</Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={13} color={C.textTertiary} />
                      {r.manufacturer_name || 'Unlinked'}
                    </div>
                  </Td>
                  <Td mono>{r.code_scanned || '—'}</Td>
                  <Td>{ago(r.created_at)}</Td>
                  <Td>{statusBadge(r.status)}</Td>
                </tr>
              );
            })
          )}
        </Table>
      </div>

      {/* Detail — reuse a simple inline panel instead of importing Modal twice */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
          <div className="scale-in" style={{ position: 'relative', background: C.surface, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Report Details</h3>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceElevated, cursor: 'pointer', color: C.textSecondary, fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: C.surfaceElevated }}>
                {(() => { const M = REASON_META[selected.reason] || REASON_META.other; const I = M.icon; return <I size={18} color={C.danger} />; })()}
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{(REASON_META[selected.reason] || REASON_META.other).label}</span>
                <div style={{ marginLeft: 'auto' }}>{statusBadge(selected.status)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {[
                  { icon: Package,   label: 'Product',      val: selected.product_name },
                  { icon: Building2, label: 'Manufacturer', val: selected.manufacturer_name || 'Unlinked product' },
                  { icon: FileText,  label: 'Code',         val: selected.code_scanned, mono: true },
                  { icon: MapPin,    label: 'Pharmacy',     val: selected.pharmacy_name },
                  { icon: MapPin,    label: 'Location',     val: selected.pharmacy_location },
                  { icon: Calendar,  label: 'Filed',        val: new Date(selected.created_at).toLocaleString('en-GB') },
                ].filter(r => r.val).map(({ icon: Icon, label, val, mono }, i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <Icon size={14} color={C.textTertiary} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.textTertiary, width: 100, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>User's Description</p>
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: C.surfaceElevated, border: `1px solid ${C.border}` }}>
                    <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{selected.description}</p>
                  </div>
                </div>
              )}

              {selected.manufacturer_response && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manufacturer's Response</p>
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: C.primaryBg }}>
                    <p style={{ margin: 0, fontSize: 13, color: C.primary, lineHeight: 1.6 }}>{selected.manufacturer_response}</p>
                  </div>
                </div>
              )}

              <Textarea label="Regulatory Notes" value={note} onChange={setNote} placeholder="Add an official note about this investigation…" rows={3} />

              <div>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Update Status</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => updateStatus(o.value)} disabled={saving}
                      style={{
                        padding: '9px 16px', borderRadius: 10,
                        border: `1.5px solid ${selected.status === o.value ? C.primary : C.border}`,
                        background: selected.status === o.value ? C.primaryBg : C.surface,
                        color: selected.status === o.value ? C.primary : C.textSecondary,
                        fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
