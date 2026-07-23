import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, Button, Input, Select, Textarea, Modal, Badge, EmptyState, Table, Td } from '../components/ui';
import type { Product, Recall } from '../lib/types';

interface RecallWithProduct extends Recall {
  product_name?: string;
}

const SEVERITY_OPTIONS = [
  { value: '',         label: 'Select severity…' },
  { value: 'low',      label: 'Low — Minor quality issue, low health risk'      },
  { value: 'moderate', label: 'Moderate — Potential health risk if used'        },
  { value: 'high',     label: 'High — Serious health risk, stop use immediately'},
];

const EMPTY_FORM = {
  product_id: '',
  batch_number: '',
  reason: '',
  severity: '',
  reference_number: '',
  return_instructions: '',
  hotline_phone: '',
};

export default function Recalls() {
  const { user } = useAuth();
  const [recalls, setRecalls] = useState<RecallWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load manufacturer's products
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('manufacturer_id', user.id);
      const prodList = (prods as Product[]) || [];
      setProducts(prodList);

      // Load recalls for those batches
      if (prodList.length === 0) { setRecalls([]); setLoading(false); return; }
      const { data: recallData } = await supabase
        .from('recalls')
        .select('*')
        .in('batch_number', prodList.map(p => p.batch_number))
        .order('created_at', { ascending: false });

      const enriched = ((recallData as Recall[]) || []).map(r => ({
        ...r,
        product_name: prodList.find(p => p.batch_number === r.batch_number)?.product_name,
      }));
      setRecalls(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const upd = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    // Auto-fill batch number when product is selected
    if (k === 'product_id') {
      const prod = products.find(p => p.id === v);
      if (prod) setForm(f => ({ ...f, product_id: v, batch_number: prod.batch_number }));
    }
  };

  const save = async () => {
    setFormError('');
    if (!form.product_id) { setFormError('Please select a product.'); return; }
    if (!form.reason.trim()) { setFormError('Recall reason is required.'); return; }
    if (!form.severity) { setFormError('Please select a severity level.'); return; }
    if (!form.reference_number.trim()) { setFormError('Reference number is required.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('recalls').insert({
        product_id: form.product_id,
        batch_number: form.batch_number,
        reason: form.reason.trim(),
        severity: form.severity,
        reference_number: form.reference_number.trim(),
        return_instructions: form.return_instructions.trim() || null,
        hotline_phone: form.hotline_phone.trim() || null,
        resolved_at: null,
      });
      if (error) throw error;

      // Mark product as recalled
      await supabase.from('products').update({ status: 'recalled' }).eq('id', form.product_id);

      setShowAdd(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to issue recall. Please try again.');
    } finally { setSaving(false); }
  };

  const resolve = async (recall: RecallWithProduct) => {
    if (!confirm(`Mark recall ${recall.reference_number} as resolved? The product status will be updated to active.`)) return;
    setResolving(recall.id);
    try {
      await supabase.from('recalls').update({ resolved_at: new Date().toISOString() }).eq('id', recall.id);
      // Restore product status
      if (recall.product_id) {
        await supabase.from('products').update({ status: 'active' }).eq('id', recall.product_id);
      }
      loadData();
    } catch (err) {
      console.error(err);
    } finally { setResolving(null); }
  };

  const filtered = recalls.filter(r =>
    !search.trim() ||
    (r.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
    r.batch_number.toLowerCase().includes(search.toLowerCase()) ||
    r.reference_number.toLowerCase().includes(search.toLowerCase())
  );

  const active = recalls.filter(r => !r.resolved_at).length;
  const resolved = recalls.filter(r => r.resolved_at).length;

  const severityBadge = (s: string) => {
    const map: Record<string, 'danger' | 'warning' | 'neutral'> = {
      high: 'danger', moderate: 'warning', low: 'neutral',
    };
    return <Badge label={s.charAt(0).toUpperCase() + s.slice(1)} variant={map[s] || 'neutral'} />;
  };

  const productOptions = [
    { value: '', label: 'Select a product…' },
    ...products.map(p => ({ value: p.id, label: `${p.product_name} — Batch ${p.batch_number}` })),
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Recalls</h1>
          <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>
            <span style={{ color: C.danger, fontWeight: 600 }}>{active} active</span>
            {resolved > 0 && <span style={{ color: C.textTertiary }}> · {resolved} resolved</span>}
          </p>
        </div>
        <Button variant="danger" icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); }}>
          Issue Recall
        </Button>
      </div>

      {/* Active recall banner */}
      {active > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: `${C.danger}08`, border: `1px solid ${C.danger}20`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color={C.danger} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: C.danger, lineHeight: 1.5 }}>
            <strong>{active} active recall{active !== 1 ? 's' : ''}</strong> — Users scanning affected products will see a recall warning in the PharmaTrack app.
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <Input value={search} onChange={setSearch} placeholder="Search recalls by product, batch or reference…" icon={<Search size={15} />} />
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table headers={['Product', 'Batch', 'Reference', 'Reason', 'Severity', 'Status', 'Actions']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={7}>
              <EmptyState
                icon={AlertTriangle}
                title="No recalls"
                body="No recalls have been issued yet. Issue a recall to immediately alert users scanning affected medicine batches."
              />
            </td></tr>
          ) : (
            filtered.map(r => (
              <tr key={r.id}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceElevated + '60'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Td>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: C.text }}>{r.product_name || '—'}</p>
                  </div>
                </Td>
                <Td mono>{r.batch_number}</Td>
                <Td mono>{r.reference_number}</Td>
                <Td>
                  <p style={{ margin: 0, fontSize: 13, color: C.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>
                    {r.reason}
                  </p>
                </Td>
                <Td>{severityBadge(r.severity)}</Td>
                <Td>
                  {r.resolved_at
                    ? <Badge label="Resolved" variant="success" />
                    : <Badge label="Active" variant="danger" />}
                </Td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                  {!r.resolved_at && (
                    <button
                      onClick={() => resolve(r)}
                      disabled={resolving === r.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: resolving === r.id ? 'not-allowed' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.success; (e.currentTarget as HTMLElement).style.color = C.success; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSecondary; }}
                    >
                      {resolving === r.id
                        ? <span className="spin" style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #ccc', borderTopColor: C.success, display: 'inline-block' }} />
                        : <CheckCircle2 size={13} />}
                      Mark Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Issue recall modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Issue Product Recall" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${C.danger}06`, border: `1px solid ${C.danger}15` }}>
            <p style={{ margin: 0, fontSize: 13, color: C.danger, lineHeight: 1.6 }}>
              Issuing a recall will immediately alert all PharmaTrack users who scan products from the affected batch. This action cannot be reversed — only marked as resolved.
            </p>
          </div>

          <Select
            label="Affected Product"
            value={form.product_id}
            onChange={v => upd('product_id', v)}
            options={productOptions}
            required
          />

          {form.batch_number && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.surfaceElevated, border: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.textTertiary }}>
                Batch number: <span style={{ fontFamily: 'monospace', color: C.text, fontWeight: 600 }}>{form.batch_number}</span>
              </p>
            </div>
          )}

          <Select
            label="Severity Level"
            value={form.severity}
            onChange={v => upd('severity', v)}
            options={SEVERITY_OPTIONS}
            required
          />

          <Input
            label="Reference Number"
            value={form.reference_number}
            onChange={v => upd('reference_number', v)}
            placeholder="e.g. RECALL-2024-001"
            required
            hint="Unique identifier for this recall. Will be shown to users."
          />

          <Textarea
            label="Reason for Recall"
            value={form.reason}
            onChange={v => upd('reason', v)}
            placeholder="Describe why this batch is being recalled and what risk it poses…"
            rows={3}
            required
          />

          <Textarea
            label="Return Instructions"
            value={form.return_instructions}
            onChange={v => upd('return_instructions', v)}
            placeholder="How should users return or dispose of this medicine?"
            rows={2}
          />

          <Input
            label="Hotline Phone"
            value={form.hotline_phone}
            onChange={v => upd('hotline_phone', v)}
            placeholder="e.g. +237 6XX XXX XXX"
            hint="Optional. Users will see a tap-to-call button in the app."
          />

          {formError && (
            <div style={{ padding: '11px 14px', borderRadius: 10, background: `${C.danger}08`, border: `1px solid ${C.danger}20` }}>
              <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{formError}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="danger" onClick={save} loading={saving} icon={<AlertTriangle size={15} />}>
              Issue Recall
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
