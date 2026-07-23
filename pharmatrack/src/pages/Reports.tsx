import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Flag, ChevronRight, ChevronLeft, CheckCircle2, MapPin, Package, AlertTriangle, FileText, Info } from 'lucide-react';

type Reason = 'counterfeit' | 'packaging_damage' | 'wrong_medicine' | 'suspicious_seller' | 'other';
type Step = 1 | 2 | 3 | 4;
interface Form { code_scanned: string; reason: Reason | ''; description: string; pharmacy_name: string; pharmacy_location: string; product_name: string; }

const EMPTY: Form = { code_scanned: '', reason: '', description: '', pharmacy_name: '', pharmacy_location: '', product_name: '' };
const REASONS: { key: Reason; label: string; sub: string; icon: React.ElementType }[] = [
  { key: 'counterfeit',       label: 'Counterfeit Medicine',  sub: 'QR code or packaging appears fake',        icon: AlertTriangle },
  { key: 'packaging_damage',  label: 'Damaged Packaging',     sub: 'Tampered seal, broken box or unusual smell', icon: Package },
  { key: 'wrong_medicine',    label: 'Wrong Medicine Inside', sub: 'Contents do not match the label',          icon: FileText },
  { key: 'suspicious_seller', label: 'Suspicious Seller',     sub: 'Seller behaved unusually or threatened you', icon: Flag },
  { key: 'other',             label: 'Other Concern',         sub: 'Something else that seemed wrong',          icon: Info },
];

export default function Reports({ prefill }: { prefill?: { code?: string; productName?: string } }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Form>({
    ...EMPTY,
    code_scanned: prefill?.code || '',
    product_name: prefill?.productName || '',
    reason: prefill?.code ? 'counterfeit' : '', // pre-select the likely reason coming from a scan
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const upd = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Resolve the product this report is about (if a code was given/prefilled)
      // so the manufacturer and regulators can actually see it.
      let productId: string | null = null;
      if (form.code_scanned.trim()) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('serial_code', form.code_scanned.trim())
          .maybeSingle();
        productId = product?.id ?? null;
      }

      const { error: err } = await supabase.from('reports').insert({
        user_id: user?.id || null,
        product_id: productId,
        code_scanned: form.code_scanned || null,
        reason: form.reason,
        description: form.description,
        pharmacy_name: form.pharmacy_name || null,
        pharmacy_location: form.pharmacy_location || null,
        product_name: form.product_name || null,
      });
      if (err) throw err;
      setSubmitted(true);
    } catch { setError('Failed to submit. Check your connection and try again.'); }
    finally { setSubmitting(false); }
  };

  const accent = c.danger;
  const inp: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 13, border: `1.5px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "'Inter', sans-serif" };
  const onF = (e: any) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}12`; };
  const onB = (e: any) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none'; };
  const Label = ({ text, opt = false }: { text: string; opt?: boolean }) => (
    <label style={{ fontSize: 11, fontWeight: 700, color: c.textTertiary, display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {text}{opt && <span style={{ fontWeight: 400, color: c.textTertiary, marginLeft: 4 }}>(optional)</span>}
    </label>
  );

  if (submitted) return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
      <div className="scale-in" style={{ width: 88, height: 88, borderRadius: '50%', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: `0 12px 40px ${c.primary}35` }}>
        <CheckCircle2 size={44} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: c.text, margin: '0 0 10px', letterSpacing: '-0.4px' }}>Report Submitted</h2>
      <p style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 280 }}>Thank you for helping protect your community. Health authorities have been notified.</p>
      <div style={{ padding: '13px 18px', borderRadius: 14, background: c.surfaceElevated, border: `1px solid ${c.border}`, marginBottom: 28, width: '100%', maxWidth: 300 }}>
        <p style={{ margin: 0, fontSize: 12, color: c.textTertiary }}>Reference <span style={{ fontFamily: 'monospace', fontWeight: 700, color: c.text }}>RPT-{Date.now().toString().slice(-7)}</span></p>
      </div>
      <button onClick={() => { setForm(EMPTY); setStep(1); setSubmitted(false); }} style={{ width: '100%', maxWidth: 300, padding: '15px', borderRadius: 14, border: 'none', background: c.primary, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 28px ${c.primary}35`, fontFamily: "'Inter', sans-serif" }}>
        Submit Another Report
      </button>
    </div>
  );

  const canNext = step === 1 ? !!form.reason : true;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>PharmaTrack</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: c.text, margin: '0 0 6px', letterSpacing: '-0.6px' }}>Report Medicine</h1>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: '0 0 22px' }}>Help protect your community from counterfeit drugs</p>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6 }}>
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: step > n ? c.primary : step === n ? c.primary : c.surfaceElevated, border: `1.5px solid ${step >= n ? c.primary : c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                {step > n
                  ? <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <span style={{ fontSize: 11, fontWeight: 700, color: step === n ? '#fff' : c.textTertiary }}>{n}</span>}
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: step > n ? c.primary : c.border, margin: '0 3px', transition: 'background 0.4s' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 20px 0', overflowY: 'auto', paddingBottom: 120 }}>

        {/* Step 1: Reason */}
        {step === 1 && (
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>What is the issue?</h3>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: '0 0 18px' }}>Select the reason for your report</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {REASONS.map(({ key, label, sub, icon: Icon }) => {
                const active = form.reason === key;
                return (
                  <button key={key} onClick={() => upd('reason', key)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 16, border: `1.5px solid ${active ? accent : c.border}`, background: active ? `${accent}06` : c.surface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? `${accent}12` : c.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={active ? accent : c.textTertiary} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: c.textTertiary }}>{sub}</p>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? accent : c.border}`, background: active ? accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
                      {active && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Medicine */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>Medicine details</h3>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: '0 0 20px' }}>Tell us about the medicine you are reporting</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><Label text="Medicine name" /><input type="text" value={form.product_name} onChange={e => upd('product_name', e.target.value)} placeholder="e.g. Paracetamol 500mg" style={inp} onFocus={onF} onBlur={onB} /></div>
              <div><Label text="QR code or barcode" opt /><input type="text" value={form.code_scanned} onChange={e => upd('code_scanned', e.target.value)} placeholder="e.g. CM-PAR-2024-001" style={inp} onFocus={onF} onBlur={onB} /></div>
              <div><Label text="What did you notice?" /><textarea value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Describe what seemed wrong with this medicine or packaging…" rows={4} style={{ ...inp, resize: 'vertical', lineHeight: '1.6' }} onFocus={onF} onBlur={onB} /></div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>Where did you buy it?</h3>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: '0 0 20px' }}>Helps authorities locate the source</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label text="Pharmacy or seller name" opt />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><Package size={16} /></div>
                  <input type="text" value={form.pharmacy_name} onChange={e => upd('pharmacy_name', e.target.value)} placeholder="e.g. Pharmacie Centrale" style={{ ...inp, paddingLeft: 42 }} onFocus={onF} onBlur={onB} />
                </div>
              </div>
              <div>
                <Label text="Location or address" opt />
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><MapPin size={16} /></div>
                  <input type="text" value={form.pharmacy_location} onChange={e => upd('pharmacy_location', e.target.value)} placeholder="e.g. Avenue Kennedy, Yaoundé" style={{ ...inp, paddingLeft: 42 }} onFocus={onF} onBlur={onB} />
                </div>
              </div>
              <div style={{ padding: '13px 14px', borderRadius: 13, background: c.primaryBg, border: `1px solid ${c.primary}20`, display: 'flex', gap: 10 }}>
                <Info size={15} color={c.primary} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: c.primary, lineHeight: 1.6 }}>Location is optional. Your report can be submitted anonymously.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>Review your report</h3>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: '0 0 20px' }}>Check everything before submitting</p>
            <div style={{ background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`, overflow: 'hidden', marginBottom: 16 }}>
              {[
                { label: 'Reason', val: REASONS.find(r => r.key === form.reason)?.label || '—' },
                { label: 'Medicine', val: form.product_name || '—' },
                { label: 'Code', val: form.code_scanned || '—' },
                { label: 'Pharmacy', val: form.pharmacy_name || 'Not provided' },
                { label: 'Location', val: form.pharmacy_location || 'Not provided' },
              ].map(({ label, val }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <span style={{ fontSize: 13, color: c.textTertiary, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, color: c.text, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                </div>
              ))}
              {form.description && (
                <div style={{ padding: '13px 16px', borderTop: `1px solid ${c.border}` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</p>
                  <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.6 }}>{form.description}</p>
                </div>
              )}
            </div>
            {error && (
              <div style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 14, background: `${c.danger}08`, border: `1px solid ${c.danger}20` }}>
                <p style={{ margin: 0, fontSize: 13, color: c.danger }}>{error}</p>
              </div>
            )}
            <div style={{ padding: '13px 14px', borderRadius: 13, background: `${accent}06`, border: `1px solid ${accent}18`, display: 'flex', gap: 10 }}>
              <AlertTriangle size={15} color={accent} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: accent, lineHeight: 1.6 }}>False reports are a serious offence. Only submit if you genuinely believe this medicine is harmful.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'sticky', bottom: 0, padding: '13px 20px max(13px, env(safe-area-inset-bottom))', backgroundColor: c.background, borderTop: `1px solid ${c.border}`, display: 'flex', gap: 10 }}>
        {step > 1 && (
          <button onClick={() => setStep(s => (s - 1) as Step)} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft size={20} color={c.textSecondary} />
          </button>
        )}
        <button
          onClick={() => { if (!canNext) return; if (step < 4) setStep(s => (s + 1) as Step); else submit(); }}
          disabled={!canNext || submitting}
          style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: !canNext || submitting ? c.border : accent, color: !canNext || submitting ? c.textTertiary : '#fff', fontSize: 15, fontWeight: 600, cursor: !canNext || submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: !canNext || submitting ? 'none' : `0 8px 24px ${accent}30`, transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" }}>
          {submitting
            ? <div className="spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            : step === 4 ? <><Flag size={16} /> Submit Report</> : <>Next <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
