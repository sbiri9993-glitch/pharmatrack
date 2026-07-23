import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  User, Moon, Sun, Globe, Shield, Bell,
  ChevronRight, LogOut, Info, Lock, Eye, EyeOff, X,
} from 'lucide-react';

interface Props { onSignOut: () => void; }

// Moved outside the component so it doesn't get recreated (and its toggle
// animation reset) on every Profile re-render.
function Toggle({ on, onToggle, primary, border }: { on: boolean; onToggle: () => void; primary: string; border: string }) {
  return (
    <div onClick={onToggle} style={{ width: 42, height: 24, borderRadius: 12, background: on ? primary : border, position: 'relative', cursor: 'pointer', transition: 'background 0.22s ease', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'left 0.22s ease' }} />
    </div>
  );
}

function Section({ title, color }: { title: string; color: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '28px 0 8px', paddingLeft: 2 }}>{title}</p>;
}

function Row({ icon: Icon, label, sub, right, onClick, danger, colors }: {
  icon: React.ElementType; label: string; sub?: string;
  right?: React.ReactNode; onClick?: () => void; danger?: boolean;
  colors: { danger: string; surfaceElevated: string; textSecondary: string; text: string; textTertiary: string };
}) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: onClick ? 'pointer' : 'default', borderRadius: 4 }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = colors.surfaceElevated; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? `${colors.danger}10` : colors.surfaceElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={danger ? colors.danger : colors.textSecondary} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: danger ? colors.danger : colors.text }}>{label}</p>
        {sub && <p style={{ margin: '1px 0 0', fontSize: 12, color: colors.textTertiary }}>{sub}</p>}
      </div>
      {right ?? (onClick ? <ChevronRight size={15} color={colors.textTertiary} /> : null)}
    </div>
  );
}

// Standalone modal for changing password — kept outside Profile() so it
// isn't recreated (and its input focus lost) on every Profile re-render.
function PasswordModal({ onClose, colors, isFr }: {
  onClose: () => void;
  colors: { primary: string; danger: string; border: string; surface: string; text: string; textSecondary: string; textTertiary: string; background: string };
  isFr: boolean;
}) {
  const { updatePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const c = colors;

  const submit = async () => {
    setError('');
    if (pw.length < 6) { setError(isFr ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.'); return; }
    if (pw !== confirmPw) { setError(isFr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await updatePassword(pw);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err?.message || (isFr ? 'Échec de la mise à jour.' : 'Failed to update password.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: c.background, borderRadius: '24px 24px 0 0', padding: '24px 20px calc(24px + env(safe-area-inset-bottom))', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: c.text, margin: 0 }}>
            {isFr ? 'Changer le mot de passe' : 'Change Password'}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: c.surface, color: c.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none"><path d="M2 9L9 16L22 2" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>
              {isFr ? 'Mot de passe mis à jour !' : 'Password updated!'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><Lock size={16} /></div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder={isFr ? 'Nouveau mot de passe' : 'New password'}
                  style={{ width: '100%', padding: '13px 44px 13px 40px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = c.primary; }}
                  onBlur={e => { e.target.style.borderColor = c.border; }}
                />
                <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><Lock size={16} /></div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                  placeholder={isFr ? 'Confirmer le mot de passe' : 'Confirm new password'}
                  style={{ width: '100%', padding: '13px 14px 13px 40px', borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = c.primary; }}
                  onBlur={e => { e.target.style.borderColor = c.border; }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 14, background: `${c.danger}10`, border: `1px solid ${c.danger}30` }}>
                <p style={{ margin: 0, fontSize: 13, color: c.danger }}>{error}</p>
              </div>
            )}

            <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: loading ? c.border : c.primary, color: loading ? c.textTertiary : '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <div className="spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                : (isFr ? 'Mettre à jour' : 'Update Password')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Profile({ onSignOut }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage(); // real shared language state
  const c = theme.colors;
  const [alerts, setAlerts] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isFr = language === 'fr';
  const T = isFr ? {
    profile: 'Profil', guestUser: 'Invité', notSignedIn: 'Non connecté', guest: 'Invité',
    preferences: 'Préférences', darkMode: 'Mode sombre', lightMode: 'Mode clair', switchApp: "Changer l'apparence de l'app",
    recallAlerts: 'Alertes de rappel', recallSub: 'Être notifié des rappels de médicaments',
    language: 'Langue', account: 'Compte', changePw: 'Changer le mot de passe', updatePw: 'Mettre à jour votre mot de passe',
    privacy: 'Politique de confidentialité', privacySub: 'Comment nous traitons vos données',
    about: 'À propos', version: 'Version 1.0.0 · Projet de fin d\'études', builtFor: 'Conçu pour le Cameroun', builtSub: 'Lutte contre les faux médicaments depuis 2026',
    session: 'Session', signOut: 'Se déconnecter', signOutSub: 'Vous devrez vous reconnecter', confirm: 'Voulez-vous vraiment vous déconnecter ?', cancel: 'Annuler',
  } : {
    profile: 'Profile', guestUser: 'Guest User', notSignedIn: 'Not signed in', guest: 'Guest',
    preferences: 'Preferences', darkMode: 'Dark Mode', lightMode: 'Light Mode', switchApp: 'Switch app appearance',
    recallAlerts: 'Recall Alerts', recallSub: 'Get notified about medicine recalls',
    language: 'Language', account: 'Account', changePw: 'Change Password', updatePw: 'Update your account password',
    privacy: 'Privacy Policy', privacySub: 'How we handle your data',
    about: 'About', version: 'Version 1.0.0 · BTech Final Year Project', builtFor: 'Built for Cameroon', builtSub: 'Fighting counterfeit medicines since 2026',
    session: 'Session', signOut: 'Sign Out', signOutSub: 'You will need to sign in again', confirm: 'Are you sure you want to sign out?', cancel: 'Cancel',
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } catch {}
    localStorage.removeItem('pharmatrack-onboarding-done');
    onSignOut();
  };

  const Divider = () => <div style={{ height: 1, background: c.border, margin: '0 16px' }} />;
  const rowColors = { danger: c.danger, surfaceElevated: c.surfaceElevated, textSecondary: c.textSecondary, text: c.text, textTertiary: c.textTertiary };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, fontFamily: "'Inter', sans-serif", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>PharmaTrack</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: c.text, margin: 0, letterSpacing: '-0.6px' }}>{T.profile}</h1>
      </div>

      <div style={{ padding: '20px 20px 0' }}>

        {/* User card — reflects real auth state */}
        <div style={{ background: c.surface, borderRadius: 20, border: `1px solid ${c.border}`, padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: c.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${c.primary}20` }}>
            <User size={24} color={c.primary} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: c.text, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.user_metadata?.name || user?.email?.split('@')[0] || T.guestUser}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: c.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || T.notSignedIn}
            </p>
          </div>
          {!user && (
            <span style={{ fontSize: 11, fontWeight: 700, color: c.primary, background: c.primaryBg, padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>{T.guest}</span>
          )}
        </div>

        {/* Preferences */}
        <Section title={T.preferences} color={c.textTertiary} />
        <div style={{ background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Row
            icon={theme.isDark ? Sun : Moon}
            label={theme.isDark ? T.lightMode : T.darkMode}
            sub={T.switchApp}
            right={<Toggle on={theme.isDark} onToggle={toggleTheme} primary={c.primary} border={c.border} />}
            colors={rowColors}
          />
          <Divider />
          <Row
            icon={Bell}
            label={T.recallAlerts}
            sub={T.recallSub}
            right={<Toggle on={alerts} onToggle={() => setAlerts(v => !v)} primary={c.primary} border={c.border} />}
            colors={rowColors}
          />
          <Divider />
          <Row
            icon={Globe}
            label={T.language}
            sub={language === 'en' ? 'English' : 'Français'}
            colors={rowColors}
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                {(['en', 'fr'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    style={{ padding: '5px 11px', borderRadius: 8, border: `1.5px solid ${language === l ? c.primary : c.border}`, background: language === l ? c.primaryBg : 'transparent', color: language === l ? c.primary : c.textTertiary, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', fontFamily: "'Inter', sans-serif" }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        {/* Account */}
        <Section title={T.account} color={c.textTertiary} />
        <div style={{ background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Row
            icon={Lock}
            label={T.changePw}
            sub={user ? T.updatePw : (isFr ? 'Connectez-vous pour changer votre mot de passe' : 'Sign in to change your password')}
            onClick={user ? () => setShowPasswordModal(true) : undefined}
            colors={rowColors}
          />
          <Divider />
          <Row icon={Shield} label={T.privacy} sub={T.privacySub} onClick={() => {}} colors={rowColors} />
        </div>

        {/* About */}
        <Section title={T.about} color={c.textTertiary} />
        <div style={{ background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Row icon={Info} label="PharmaTrack" sub={T.version} right={<span style={{ fontSize: 12, color: c.textTertiary, fontWeight: 500 }}>v1.0.0</span>} colors={rowColors} />
          <Divider />
          <Row icon={Shield} label={T.builtFor} sub={T.builtSub} right={<span style={{ fontSize: 18 }}>🇨🇲</span>} colors={rowColors} />
        </div>

        {/* Sign out */}
        <Section title={T.session} color={c.textTertiary} />
        <div style={{ background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {!confirmOut ? (
            <Row icon={LogOut} label={T.signOut} sub={T.signOutSub} danger onClick={() => setConfirmOut(true)} colors={rowColors} />
          ) : (
            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: c.text }}>{T.confirm}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmOut(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: 'transparent', color: c.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {T.cancel}
                </button>
                <button onClick={handleSignOut} disabled={signingOut} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: c.danger, color: '#fff', fontSize: 14, fontWeight: 600, cursor: signingOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Inter', sans-serif" }}>
                  {signingOut
                    ? <div className="spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <><LogOut size={15} /> {T.signOut}</>}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          colors={{ primary: c.primary, danger: c.danger, border: c.border, surface: c.surface, text: c.text, textSecondary: c.textSecondary, textTertiary: c.textTertiary, background: c.background }}
          isFr={isFr}
        />
      )}
    </div>
  );
}
