import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Package, QrCode, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, Button, Input, Select, Textarea, Modal, Badge, EmptyState, Table, Td } from '../components/ui';
import type { Product } from '../lib/types';

const EMPTY_FORM = {
  product_name: '', batch_number: '', expiry_date: '', manufacturer: '',
  dosage_form: '', strength: '', country_of_origin: 'Cameroon',
  registration_number: '', active_ingredient: '', storage_conditions: '',
  units_produced: '', serial_code: '',
};

const DOSAGE_FORMS = [
  { value: '', label: 'Select dosage form…' },
  { value: 'Tablet',    label: 'Tablet'    },
  { value: 'Capsule',   label: 'Capsule'   },
  { value: 'Syrup',     label: 'Syrup'     },
  { value: 'Injection', label: 'Injection' },
  { value: 'Cream',     label: 'Cream'     },
  { value: 'Drops',     label: 'Drops'     },
  { value: 'Powder',    label: 'Powder'    },
  { value: 'Other',     label: 'Other'     },
];

export default function Medicines() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setFormError('');
    if (!form.product_name.trim()) { setFormError('Product name is required.'); return; }
    if (!form.batch_number.trim()) { setFormError('Batch number is required.'); return; }
    if (!form.expiry_date) { setFormError('Expiry date is required.'); return; }
    if (!form.manufacturer.trim()) { setFormError('Manufacturer name is required.'); return; }
    if (!form.dosage_form) { setFormError('Dosage form is required.'); return; }
    if (!form.serial_code.trim()) { setFormError('QR code string is required. Enter the exact code printed on the medicine packaging.'); return; }

    // Check for duplicate serial code
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('serial_code', form.serial_code.trim())
      .maybeSingle();
    if (existing) { setFormError('This QR code is already registered. Each code on the packaging is unique — check you entered it correctly.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('products').insert({
        manufacturer_id: user!.id,
        serial_code: form.serial_code.trim(),
        product_name: form.product_name.trim(),
        batch_number: form.batch_number.trim(),
        expiry_date: form.expiry_date,
        manufacturer: form.manufacturer.trim(),
        dosage_form: form.dosage_form,
        strength: form.strength.trim(),
        country_of_origin: form.country_of_origin.trim(),
        registration_number: form.registration_number.trim(),
        active_ingredient: form.active_ingredient.trim(),
        storage_conditions: form.storage_conditions.trim(),
        units_produced: form.units_produced ? parseInt(form.units_produced) : null,
        status: 'active',
      });
      if (error) throw error;
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this medicine? This cannot be undone.')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  const showQR = (product: Product) => {
    setSelected(product);
    setShowQRModal(true);
  };

  const filtered = products.filter(p =>
    !search.trim() ||
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.batch_number.toLowerCase().includes(search.toLowerCase()) ||
    p.serial_code.toLowerCase().includes(search.toLowerCase())
  );

  const days = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const statusBadge = (p: Product) => {
    const d = days(p.expiry_date);
    if (p.status === 'recalled') return <Badge label="Recalled" variant="danger" />;
    if (d <= 0) return <Badge label="Expired" variant="danger" />;
    if (d <= 90) return <Badge label="Expiring soon" variant="warning" />;
    return <Badge label="Active" variant="success" />;
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Medicines</h1>
          <p style={{ fontSize: 14, color: C.textTertiary, margin: 0 }}>{products.length} registered product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAddModal(true); }}>
          Register Medicine
        </Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <Input value={search} onChange={setSearch} placeholder="Search by name, batch number or serial code…" icon={<Search size={15} />} />
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table headers={['Medicine', 'Batch', 'Serial Code', 'Expiry', 'Status', 'Actions']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={6}>
              <EmptyState icon={Package} title="No medicines yet" body="Register your first medicine to enable QR code verification in the PharmaTrack app."
                action={<Button icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>Register Medicine</Button>}
              />
            </td></tr>
          ) : (
            filtered.map(p => (
              <tr key={p.id} style={{ transition: 'background 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surfaceElevated + '60'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Td>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: C.text }}>{p.product_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textTertiary }}>{p.dosage_form}{p.strength ? ` · ${p.strength}` : ''}</p>
                  </div>
                </Td>
                <Td mono>{p.batch_number}</Td>
                <Td mono>{p.serial_code}</Td>
                <Td>
                  <div>
                    <p style={{ margin: 0, fontSize: 13 }}>{new Date(p.expiry_date).toLocaleDateString('en-GB')}</p>
                    {days(p.expiry_date) > 0 && <p style={{ margin: '1px 0 0', fontSize: 11, color: C.textTertiary }}>{days(p.expiry_date)} days left</p>}
                  </div>
                </Td>
                <Td>{statusBadge(p)}</Td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelected(p); setShowViewModal(true); }} title="View details"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSecondary; }}>
                      <Eye size={14} />
                    </button>
                    <button onClick={() => showQR(p)} title="View QR code"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSecondary; }}>
                      <QrCode size={14} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} title="Delete"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.danger; (e.currentTarget as HTMLElement).style.color = C.danger; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSecondary; }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>

      </div>

      {/* Add medicine modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Medicine" width={640}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textTertiary, lineHeight: 1.6 }}>
            Enter the medicine credentials exactly as they appear on the packaging. The serial / QR code you register here is what users will scan to verify authenticity.
          </p>

          {/* QR code string — from the physical packaging */}
          <div style={{ padding: '16px', borderRadius: 14, border: `1.5px solid ${C.primary}25`, background: C.primaryBg }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <Info size={16} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.primary }}>QR Code or Barcode Already on the Packaging</p>
                <p style={{ margin: 0, fontSize: 12, color: C.primary + 'BB', lineHeight: 1.6 }}>
                  The QR code or barcode is printed by your printing facility on the medicine box before distribution. Enter the exact string it encodes — this is what PharmaTrack users will scan to verify authenticity. Read it using any barcode or QR scanner app.
                </p>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              QR Code or Barcode String <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="text"
              value={form.serial_code}
              onChange={e => upd('serial_code', e.target.value)}
              placeholder="e.g. 6001234567890 (EAN-13) or CM-PAR-2024-001 (QR code)"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.primary}30`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}12`; }}
              onBlur={e => { e.target.style.borderColor = C.primary + '30'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Product Name" value={form.product_name} onChange={v => upd('product_name', v)} placeholder="e.g. Paracetamol 500mg" required />
            </div>
            <Input label="Batch Number" value={form.batch_number} onChange={v => upd('batch_number', v)} placeholder="e.g. BN2024001" required />
            <Input label="Expiry Date" value={form.expiry_date} onChange={v => upd('expiry_date', v)} type="date" required min={new Date().toISOString().split('T')[0]} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Manufacturer Name" value={form.manufacturer} onChange={v => upd('manufacturer', v)} placeholder="e.g. Laborex Cameroun" required />
            </div>
            <Select label="Dosage Form" value={form.dosage_form} onChange={v => upd('dosage_form', v)} options={DOSAGE_FORMS} required />
            <Input label="Strength" value={form.strength} onChange={v => upd('strength', v)} placeholder="e.g. 500mg" />
            <Input label="Active Ingredient" value={form.active_ingredient} onChange={v => upd('active_ingredient', v)} placeholder="e.g. Paracetamol" />
            <Input label="Country of Origin" value={form.country_of_origin} onChange={v => upd('country_of_origin', v)} placeholder="e.g. Cameroon" />
            <Input label="Registration Number" value={form.registration_number} onChange={v => upd('registration_number', v)} placeholder="e.g. MINSANTE-2024-0042" />
            <Input label="Units Produced" value={form.units_produced} onChange={v => upd('units_produced', v)} type="number" placeholder="e.g. 10000" />
            <div style={{ gridColumn: '1 / -1' }}>
              <Textarea label="Storage Conditions" value={form.storage_conditions} onChange={v => upd('storage_conditions', v)} placeholder="e.g. Store below 30°C in a dry place away from light." rows={2} />
            </div>
          </div>

          {formError && (
            <div style={{ padding: '11px 14px', borderRadius: 10, background: `${C.danger}08`, border: `1px solid ${C.danger}20` }}>
              <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{formError}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} icon={<Package size={15} />}>Register Medicine</Button>
          </div>
        </div>
      </Modal>

      {/* View details modal */}
      {selected && (
        <Modal open={showViewModal} onClose={() => setShowViewModal(false)} title="Medicine Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Product Name',        val: selected.product_name         },
              { label: 'Serial / QR Code',    val: selected.serial_code,  mono: true },
              { label: 'Batch Number',        val: selected.batch_number, mono: true },
              { label: 'Expiry Date',         val: new Date(selected.expiry_date).toLocaleDateString('en-GB') },
              { label: 'Manufacturer',        val: selected.manufacturer         },
              { label: 'Dosage Form',         val: selected.dosage_form          },
              { label: 'Strength',            val: selected.strength             },
              { label: 'Active Ingredient',   val: selected.active_ingredient    },
              { label: 'Country of Origin',   val: selected.country_of_origin    },
              { label: 'Registration No.',    val: selected.registration_number  },
              { label: 'Units Produced',      val: selected.units_produced?.toLocaleString() },
              { label: 'Storage Conditions',  val: selected.storage_conditions   },
              { label: 'Registered On',       val: new Date(selected.created_at).toLocaleDateString('en-GB') },
            ].filter(r => r.val).map(({ label, val, mono }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.textTertiary, fontWeight: 500, flexShrink: 0, marginRight: 24 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => { setShowViewModal(false); showQR(selected); }} icon={<QrCode size={15} />} fullWidth>View QR Code</Button>
          </div>
        </Modal>
      )}

      {/* QR code reference modal */}
      {selected && (
        <Modal open={showQRModal} onClose={() => setShowQRModal(false)} title="Registered Code" width={440}>
          <div>
            {/* Explanation */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px', borderRadius: 12, background: C.primaryBg, marginBottom: 20 }}>
              <Info size={16} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: C.primary, lineHeight: 1.6 }}>
                The QR code or barcode is already printed on your medicine packaging. This is the string it encodes — PharmaTrack users scan it to verify authenticity against this registration.
              </p>
            </div>

            {/* Product info */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Medicine</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{selected.product_name}</p>
            </div>

            {/* The registered code */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Registered QR Code String</p>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: C.surfaceElevated, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <QrCode size={20} color={C.primary} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 14, fontFamily: 'monospace', fontWeight: 600, color: C.text, wordBreak: 'break-all', flex: 1 }}>{selected.serial_code}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(selected.serial_code)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Copy
                </button>
              </div>
            </div>

            {/* How to verify */}
            <div style={{ padding: '14px', borderRadius: 12, background: C.surfaceElevated, border: `1px solid ${C.border}` }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>How Verification Works</p>
              {[
                'User opens PharmaTrack and scans the QR code on the box',
                'App reads the code string and queries the database',
                'If it matches this registration → ✅ Authentic',
                'If not found → ⚠️ Unknown / possible counterfeit',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, flexShrink: 0, width: 16 }}>{i + 1}.</span>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
