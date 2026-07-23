import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { C, Button, Input } from '../components/ui';

interface Props { onSuccess: () => void; }

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && !url.includes('your_supabase') && !key.includes('your_supabase');
};

export default function Auth({ onSuccess }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !pw) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), pw);
      onSuccess();
    } catch (err: any) {
      const m = err?.message || '';
      if (m.includes('Invalid login')) setError('Incorrect email or password.');
      else setError(m || 'Sign in failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.background, display: 'flex' }}>
      {/* Left panel */}
      <div style={{ width: 440, background: C.sidebar, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', flexShrink: 0 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 8px 28px ${C.primary}40` }}>
            <Shield size={24} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.6px' }}>PharmaTrack</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>Manufacturer portal for registering medicine credentials and managing product authentication.</p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { title: 'Register medicines',      body: 'Upload product details and QR codes' },
            { title: 'Monitor authenticity',    body: 'See real-time scan data from the field' },
            { title: 'Manage recalls',          body: 'Issue and track product recalls instantly' },
          ].map(({ title, body }) => (
            <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0, marginTop: 8 }} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-up">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Sign in</h2>
          <p style={{ fontSize: 14, color: C.textTertiary, margin: '0 0 32px' }}>Access your manufacturer dashboard</p>

          {/* Show setup notice if Supabase not configured */}
          {!isConfigured() && (
            <div style={{ padding: '14px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 20, display: 'flex', gap: 10 }}>
              <AlertTriangle size={16} color="#A05E1A" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#A05E1A' }}>Supabase not configured</p>
                <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                  Open <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>.env</code> and replace the placeholder values with your Supabase project URL and anon key, then restart the server.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Email address" value={email} onChange={setEmail} placeholder="name@company.com" type="email" required icon={<Mail size={16} />} />

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password <span style={{ color: C.danger }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textTertiary, pointerEvents: 'none' }}><Lock size={16} /></div>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Your password" required
                  style={{ width: '100%', padding: '10px 42px 10px 38px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}12`; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textTertiary, cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '11px 14px', borderRadius: 10, background: `${C.danger}08`, border: `1px solid ${C.danger}20` }}>
                <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">Sign In to Dashboard</Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.textTertiary, marginTop: 28, lineHeight: 1.6 }}>
            Access restricted to registered manufacturers only.<br />Contact <a href="mailto:admin@pharmatrack.cm" style={{ color: C.primary }}>admin@pharmatrack.cm</a> to register.
          </p>
        </div>
      </div>
    </div>
  );
}
