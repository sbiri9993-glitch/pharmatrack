import React, { useState } from 'react';

// ── Colors ─────────────────────────────────────────────────────────────────────
export const C = {
  primary:        '#1D9E75',
  primaryDark:    '#0F6E56',
  primaryBg:      '#EBF7F2',
  danger:         '#C93535',
  dangerBg:       '#FDF2F2',
  warning:        '#A05E1A',
  warningBg:      '#FDF7EF',
  success:        '#2D7A3A',
  successBg:      '#F0F7F1',
  text:           '#0A0A0A',
  textSecondary:  '#525252',
  textTertiary:   '#A3A3A3',
  border:         '#E5E5E5',
  borderStrong:   '#D4D4D4',
  surface:        '#FFFFFF',
  surfaceElevated:'#F5F5F5',
  background:     '#FAFAFA',
  sidebar:        '#0F1923',
  sidebarText:    '#CBD5E1',
  sidebarActive:  '#1D9E75',
};

// ── Button ─────────────────────────────────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, type = 'button', fullWidth, icon }: BtnProps) {
  const bg = variant === 'primary' ? C.primary : variant === 'danger' ? C.danger : variant === 'secondary' ? C.surface : 'transparent';
  const color = variant === 'primary' || variant === 'danger' ? '#fff' : variant === 'secondary' ? C.text : C.textSecondary;
  const border = variant === 'secondary' ? `1.5px solid ${C.border}` : variant === 'ghost' ? 'none' : 'none';
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 24px' : '10px 18px';
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;
  const shadow = variant === 'primary' ? `0 4px 16px ${C.primary}30` : variant === 'danger' ? `0 4px 16px ${C.danger}25` : 'none';

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ padding: pad, borderRadius: 10, border, background: disabled || loading ? C.surfaceElevated : bg, color: disabled || loading ? C.textTertiary : color, fontSize, fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: disabled || loading ? 'none' : shadow, transition: 'all 0.18s', width: fullWidth ? '100%' : 'auto', whiteSpace: 'nowrap' }}
    >
      {loading ? <span className="spin" style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block' }} /> : icon}
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  min?: string;
}

export function Input({ label, value, onChange, placeholder, type = 'text', required, hint, error, icon, disabled, min }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? C.primary : C.textTertiary, pointerEvents: 'none', transition: 'color 0.2s' }}>{icon}</div>}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} required={required} min={min}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: `10px 14px 10px ${icon ? '38px' : '14px'}`, borderRadius: 10, border: `1.5px solid ${error ? C.danger : focused ? C.primary : C.border}`, background: disabled ? C.surfaceElevated : C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s', boxShadow: focused && !error ? `0 0 0 3px ${C.primary}12` : error ? `0 0 0 3px ${C.danger}10` : 'none' }}
        />
      </div>
      {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.danger }}>{error}</p>}
      {hint && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.textTertiary }}>{hint}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

export function Select({ label, value, onChange, options, required }: SelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${focused ? C.primary : C.border}`, background: C.surface, color: value ? C.text : C.textTertiary, fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 0.18s', boxShadow: focused ? `0 0 0 3px ${C.primary}12` : 'none' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows = 3, required }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${focused ? C.primary : C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.18s', boxShadow: focused ? `0 0 0 3px ${C.primary}12` : 'none' }}
      />
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
export function Badge({ label, variant }: { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }) {
  const map = {
    success: { color: C.success, bg: C.successBg },
    danger:  { color: C.danger,  bg: C.dangerBg  },
    warning: { color: C.warning, bg: C.warningBg },
    neutral: { color: C.textSecondary, bg: C.surfaceElevated },
  };
  const { color, bg } = map[variant];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: bg, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color, delta }: { label: string; value: string | number; icon: React.ElementType; color: string; delta?: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {delta && <span style={{ fontSize: 12, fontWeight: 600, color: delta.startsWith('+') ? C.success : C.danger }}>{delta}</span>}
      </div>
      <p style={{ margin: '0 0 4px', fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.8px' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{label}</p>
    </Card>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="scale-in" style={{ position: 'relative', background: C.surface, borderRadius: 20, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.3px' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceElevated, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ElementType; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: C.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon size={32} color={C.textTertiary} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320 }}>{body}</p>
      {action}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading }: { headers: string[]; children: React.ReactNode; loading?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} style={{ padding: '48px', textAlign: 'center' }}>
              <span className="spin" style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.primary, display: 'inline-block' }} />
            </td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td style={{ padding: '13px 16px', fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>
      {children}
    </td>
  );
}
