import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface Props { onAuthSuccess: () => void; }
type Mode = 'login' | 'register';

// Moved OUTSIDE the Auth component — this was the bug causing inputs to lose
// focus on every keystroke (the component identity was recreated every render).
function Field({ type, value, onChange, placeholder, left, right, onEnter, colors }: {
  type: string; value: string; onChange: (v: string) => void; placeholder: string;
  left: React.ReactNode; right?: React.ReactNode; onEnter: () => void;
  colors: { primary: string; border: string; surface: string; text: string };
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: focused ? colors.primary : '#9CA3AF', pointerEvents: 'none', transition: 'color 0.2s' }}>{left}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') onEnter(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '15px 16px 15px 46px', paddingRight: right ? '46px' : '16px', borderRadius: 14, border: `1.5px solid ${focused ? colors.primary : colors.border}`, background: colors.surface, color: colors.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', boxShadow: focused ? `0 0 0 3px ${colors.primary}18` : 'none' }}
      />
      {right && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
    </div>
  );
}

export default function Auth({ onAuthSuccess }: Props) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const c = theme.colors;
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = language === 'fr'
    ? { signIn: 'Se connecter', register: 'Créer un compte', email: 'Adresse e-mail', password: 'Mot de passe', name: 'Nom complet', guest: 'Continuer en invité', welcome: 'Connectez-vous à votre compte', newAcc: 'Créer un nouveau compte' }
    : { signIn: 'Sign In', register: 'Register', email: 'Email address', password: 'Password', name: 'Full name', guest: 'Continue as Guest', welcome: 'Sign in to your account', newAcc: 'Create a new account' };

  const submit = async () => {
    setError('');
    if (!email.trim() || !pw) { setError(language === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.'); return; }
    if (mode === 'register' && !name.trim()) { setError(language === 'fr' ? 'Veuillez entrer votre nom.' : 'Please enter your name.'); return; }
    if (pw.length < 6) { setError(language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') await signIn(email.trim(), pw);
      else await signUp(email.trim(), pw, name.trim());
      onAuthSuccess();
    } catch (err: any) {
      const m = err?.message || '';
      if (m.includes('Invalid login')) setError(language === 'fr' ? 'E-mail ou mot de passe incorrect.' : 'Incorrect email or password.');
      else if (m.includes('already registered')) setError(language === 'fr' ? 'Ce compte existe déjà. Connectez-vous.' : 'Account exists. Sign in instead.');
      else if (m.includes('Email not confirmed')) setError(language === 'fr' ? 'Confirmez votre e-mail avant de vous connecter.' : 'Please confirm your email before signing in. Check your inbox.');
      else setError(m || (language === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', background: c.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 68, height: 68, borderRadius: 20, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 12px 36px ${c.primary}30` }}>
          <Shield size={34} color="#fff" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: c.text, margin: '0 0 6px', letterSpacing: '-0.5px' }}>PharmaTrack</h1>
        <p style={{ margin: 0, fontSize: 14, color: c.textTertiary }}>{mode === 'login' ? t.welcome : t.newAcc}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Tab */}
        <div style={{ display: 'flex', padding: 3, borderRadius: 14, background: c.surfaceElevated, marginBottom: 28, border: `1px solid ${c.border}` }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 11, border: 'none', background: mode === m ? c.surface : 'transparent', color: mode === m ? c.text : c.textTertiary, fontSize: 14, fontWeight: mode === m ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {m === 'login' ? t.signIn : t.register}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {mode === 'register' && (
            <Field type="text" value={name} onChange={setName} placeholder={t.name} left={<User size={17} />} onEnter={submit} colors={c} />
          )}
          <Field type="email" value={email} onChange={setEmail} placeholder={t.email} left={<Mail size={17} />} onEnter={submit} colors={c} />
          <Field
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={setPw}
            placeholder={t.password}
            left={<Lock size={17} />}
            onEnter={submit}
            colors={c}
            right={
              <button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer', display: 'flex', padding: 0 }}>
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
        </div>

        {error && (
          <div style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 14, background: `${c.danger}10`, border: `1px solid ${c.danger}30` }}>
            <p style={{ margin: 0, fontSize: 13, color: c.danger, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: loading ? c.border : c.primary, color: loading ? c.textTertiary : '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : `0 8px 28px ${c.primary}35`, transition: 'all 0.2s', marginBottom: 12 }}>
          {loading ? <div className="spin" style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${c.textTertiary}30`, borderTopColor: c.textTertiary }} /> : <>{mode === 'login' ? t.signIn : (language === 'fr' ? 'Créer le compte' : 'Create Account')} <ArrowRight size={17} /></>}
        </button>

        <button onClick={onAuthSuccess} style={{ width: '100%', padding: '13px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          {t.guest}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: c.textTertiary, marginTop: 24, lineHeight: 1.6 }}>
          {language === 'fr' ? 'Vos données sont chiffrées et stockées en sécurité sur Supabase.' : 'Your data is encrypted and stored securely on Supabase.'}
        </p>
      </div>
    </div>
  );
}
