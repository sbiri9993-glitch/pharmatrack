import { useTheme } from '../../contexts/ThemeContext';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle, AlertCircle, Copy, Share2, Phone, Calendar, Building2, Pill, Package, Flag, RotateCcw, Info } from 'lucide-react';

export type ScanResult = {
  type: 'authentic' | 'counterfeit' | 'duplicate' | 'recalled' | 'unknown';
  product?: {
    product_name: string; batch_number: string; expiry_date: string;
    manufacturer: string; dosage_form?: string; strength?: string;
    country_of_origin?: string; registration_number?: string;
  };
  recall?: {
    reason: string; severity?: string; reference_number?: string;
    return_instructions?: string; hotline_phone?: string;
  };
  previousScans?: { created_at: string }[];
  scannedCode?: string;
};

const VERDICT = {
  authentic:   { icon: CheckCircle2,  color: '#2D7A3A', bg: '#F0F7F1', label: 'Authentic',          heading: 'Verified Authentic',      sub: 'This medicine is registered and safe to use.' },
  counterfeit: { icon: AlertTriangle, color: '#C93535', bg: '#FDF2F2', label: 'Counterfeit',         heading: 'Counterfeit Detected',    sub: 'Do not use this medicine. It may be dangerous.' },
  duplicate:   { icon: AlertCircle,   color: '#A05E1A', bg: '#FDF7EF', label: 'Duplicate Scan',      heading: 'Already Scanned Before',  sub: 'This code has been used before. Be cautious.' },
  recalled:    { icon: ShieldAlert,   color: '#C93535', bg: '#FDF2F2', label: 'Recalled',            heading: 'Medicine Recalled',       sub: 'Stop using this medicine immediately.' },
  unknown:     { icon: HelpCircle,    color: '#525252', bg: '#F5F5F5', label: 'Not Found',           heading: 'Not in Database',         sub: 'This code was not found. See possible reasons below.' },
};

function Row({ icon: Icon, label, value, c }: { icon: React.ElementType; label: string; value?: string; c: any }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: c.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={c.textTertiary} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 600, color: c.text }}>{value}</p>
      </div>
    </div>
  );
}

function Card({ children, c, mb = 12 }: { children: React.ReactNode; c: any; mb?: number }) {
  return (
    <div style={{ background: c.surface, borderRadius: 20, border: `1px solid ${c.border}`, padding: '18px', marginBottom: mb, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  );
}

export default function ResultCard({ result, onScanAgain, onReport }: { result: ScanResult; onScanAgain: () => void; onReport?: () => void; }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const v = VERDICT[result.type];
  const Icon = v.icon;
  const copy = (t: string) => navigator.clipboard.writeText(t).catch(() => {});
  const days = result.product ? Math.ceil((new Date(result.product.expiry_date).getTime() - Date.now()) / 86400000) : 999;
  const expired = days <= 0;
  const expiringSoon = days > 0 && days <= 90;

  const ScanAgainBtn = () => (
    <button onClick={onScanAgain} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
      <RotateCcw size={15} /> Scan Another
    </button>
  );

  return (
    <div className="fade-up" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Verdict banner */}
      <div style={{ borderRadius: 20, background: v.bg, border: `1px solid ${v.color}20`, padding: '24px 20px', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: `0 4px 24px ${v.color}12` }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: v.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: `1.5px solid ${v.color}25` }}>
          <Icon size={36} color={v.color} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: v.color, margin: '0 0 6px', letterSpacing: '-0.3px' }}>{v.heading}</h2>
        <p style={{ margin: 0, fontSize: 14, color: c.textSecondary, lineHeight: 1.55 }}>{v.sub}</p>
        {(expired || expiringSoon) && result.type === 'authentic' && (
          <div style={{ marginTop: 12, padding: '5px 14px', borderRadius: 20, background: expired ? `${c.danger}12` : `${c.warning}12`, border: `1px solid ${expired ? c.danger : c.warning}25` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: expired ? c.danger : c.warning }}>{expired ? 'This medicine has expired' : `Expires in ${days} days`}</span>
          </div>
        )}
      </div>

      {/* Authentic details */}
      {result.type === 'authentic' && result.product && (
        <Card c={c} mb={14}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: c.text, margin: '0 0 18px', letterSpacing: '-0.3px' }}>{result.product.product_name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: result.product.registration_number ? 16 : 0 }}>
            <Row icon={Package}   label="Batch"        value={result.product.batch_number} c={c} />
            <Row icon={Calendar}  label="Expiry"       value={new Date(result.product.expiry_date).toLocaleDateString()} c={c} />
            <Row icon={Building2} label="Manufacturer" value={result.product.manufacturer} c={c} />
            <Row icon={Pill}      label="Form"         value={result.product.dosage_form} c={c} />
            <Row icon={Pill}      label="Strength"     value={result.product.strength} c={c} />
            <Row icon={Flag}      label="Origin"       value={result.product.country_of_origin} c={c} />
          </div>
          {result.product.registration_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: c.surfaceElevated, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>REG</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: c.text, flex: 1 }}>{result.product.registration_number}</span>
              <button onClick={() => copy(result.product!.registration_number!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textTertiary, display: 'flex', padding: 0 }}><Copy size={14} /></button>
            </div>
          )}
        </Card>
      )}

      {/* Counterfeit */}
      {result.type === 'counterfeit' && (
        <Card c={c} mb={14}>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${c.danger}08`, border: `1px solid ${c.danger}20` }}>
            <p style={{ margin: 0, fontSize: 13, color: c.danger, lineHeight: 1.65 }}>Do not consume this medicine. Return it to the pharmacy where you bought it and report it immediately using the button below.</p>
          </div>
        </Card>
      )}

      {/* Duplicate */}
      {result.type === 'duplicate' && result.product && (
        <Card c={c} mb={14}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: c.text, margin: '0 0 14px' }}>{result.product.product_name}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: c.textSecondary }}>Times this code was scanned</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: c.warning }}>{(result.previousScans?.length || 0) + 1}×</span>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${c.warning}08`, border: `1px solid ${c.warning}20` }}>
            <p style={{ margin: 0, fontSize: 13, color: c.warning, lineHeight: 1.65 }}>This packaging code was previously scanned. It may indicate reused packaging or a counterfeit product.</p>
          </div>
        </Card>
      )}

      {/* Recalled */}
      {result.type === 'recalled' && result.recall && (
        <Card c={c} mb={14}>
          {result.product && <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: c.text, margin: '0 0 14px' }}>{result.product.product_name}</h3>}
          {result.recall.severity && (
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: `${c.danger}12`, fontSize: 11, fontWeight: 700, color: c.danger, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{result.recall.severity} severity</span>
          )}
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recall reason</p>
          <p style={{ margin: '0 0 14px', fontSize: 14, color: c.text, lineHeight: 1.6 }}>{result.recall.reason}</p>
          {result.recall.return_instructions && (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: `${c.danger}08`, marginBottom: result.recall.hotline_phone ? 12 : 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: c.danger, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Return Instructions</p>
              <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.6 }}>{result.recall.return_instructions}</p>
            </div>
          )}
          {result.recall.hotline_phone && (
            <a href={`tel:${result.recall.hotline_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 14, background: c.primaryBg, textDecoration: 'none', marginTop: 4 }}>
              <Phone size={17} color={c.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: c.primary }}>Call Hotline: {result.recall.hotline_phone}</span>
            </a>
          )}
        </Card>
      )}

      {/* Unknown */}
      {result.type === 'unknown' && (
        <Card c={c} mb={14}>
          {result.scannedCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: c.surfaceElevated, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: c.text, flex: 1 }}>{result.scannedCode}</span>
              <button onClick={() => copy(result.scannedCode!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textTertiary, display: 'flex', padding: 0 }}><Copy size={14} /></button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: c.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={15} color={c.textTertiary} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: c.textSecondary, lineHeight: 1.65 }}>This does not always mean the medicine is fake. Possible reasons:</p>
          </div>
          {['The manufacturer has not registered this medicine yet', 'The QR code may have been tampered with', 'This could be a counterfeit product'].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: c.textTertiary, flexShrink: 0, marginTop: 1 }}>·</span>
              <p style={{ margin: 0, fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>{r}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Actions */}
      {['counterfeit', 'duplicate', 'unknown'].includes(result.type) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button onClick={onReport} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: c.danger, color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', boxShadow: `0 6px 20px ${c.danger}30` }}>
            <Flag size={15} /> Report
          </button>
          <button style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
            <Share2 size={15} /> Share
          </button>
        </div>
      )}
      {result.type === 'authentic' && (
        <button style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', marginBottom: 10 }}>
          <Share2 size={15} /> Share Result
        </button>
      )}
      <ScanAgainBtn />
    </div>
  );
}
