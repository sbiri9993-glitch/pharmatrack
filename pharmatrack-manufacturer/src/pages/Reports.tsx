import { useState, useEffect } from 'react';
import { Flag, Search, MessageSquare, AlertTriangle, Package, FileText, User as UserIcon, HelpCircle, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, Button, Input, Textarea, Modal, Badge, EmptyState, Table, Td } from '../components/ui';
import type { Report } from '../lib/types';

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

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Report['status']>('all');
  const [selected, setSelected] = useState<Report | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // RLS ensures this only returns reports on products this manufacturer owns
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports((data as Report[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openReport = (r: Report) => {
    setSelected(r);
    setResponse(r.manufacturer_response || '');
  };

  const updateStatus = async (status: Report['status']) => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from('reports').update({
        status,
        manufacturer_response: response.trim() || null,
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
      (r.code_scanned || '').toLowerCase().includes(q) ||
      (r.pharmacy_name || '').toLowerCase().includes(q);
    return fm && sm;
  });

  const pending = reports.filter(r => r.status === 'pending').length;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Reports</h1>
          <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>User reports filed about your products</p>
        </div>
        {pending > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: 20, background: `${C.warning}12`, border: `1px solid ${C.warning}30` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>{pending} pending review</span>
          </div>
        )}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <Input value={search} onChange={setSearch} placeholder="Search by product, code or pharmacy…" icon={<Search size={15} />} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table headers={['Reason', 'Product', 'Code', 'Pharmacy', 'Filed', 'Status']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={6}>
              <EmptyState icon={Flag} title="No reports"
                body="No user reports have been filed about your products yet. Reports appear here when a user flags a medicine as suspicious." />
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
                  <Td mono>{r.code_scanned || '—'}</Td>
                  <Td>{r.pharmacy_name || '—'}</Td>
                  <Td>{ago(r.created_at)}</Td>
                  <Td>{statusBadge(r.status)}</Td>
                </tr>
              );
            })
          )}
        </Table>
      </div>

      {/* Report detail modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Report Details" width={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Reason */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: C.surfaceElevated }}>
              {(() => { const M = REASON_META[selected.reason] || REASON_META.other; const I = M.icon; return <I size={18} color={C.danger} />; })()}
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{(REASON_META[selected.reason] || REASON_META.other).label}</span>
              <div style={{ marginLeft: 'auto' }}>{statusBadge(selected.status)}</div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {[
                { icon: Package,   label: 'Product',   val: selected.product_name },
                { icon: FileText,  label: 'Code',      val: selected.code_scanned, mono: true },
                { icon: MapPin,    label: 'Pharmacy',  val: selected.pharmacy_name },
                { icon: MapPin,    label: 'Location',  val: selected.pharmacy_location },
                { icon: Calendar,  label: 'Filed',     val: new Date(selected.created_at).toLocaleString('en-GB') },
              ].filter(r => r.val).map(({ icon: Icon, label, val, mono }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <Icon size={14} color={C.textTertiary} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.textTertiary, width: 80, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>User's Description</p>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: C.surfaceElevated, border: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{selected.description}</p>
                </div>
              </div>
            )}

            {/* Anonymous notice */}
            {!selected.user_id && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: `${C.primary}08` }}>
                <UserIcon size={14} color={C.primary} />
                <span style={{ fontSize: 12, color: C.primary }}>This report was filed anonymously</span>
              </div>
            )}

            {/* Response */}
            <Textarea
              label="Your Response / Internal Notes"
              value={response}
              onChange={setResponse}
              placeholder="Add notes about your investigation or response to this report…"
              rows={3}
            />

            {/* Status actions */}
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
        </Modal>
      )}
    </div>
  );
}
