import { useState, useEffect } from 'react';
import { Shield, Scan, CheckCircle2, AlertTriangle, ChevronRight, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props { onComplete: () => void; }
type Lang = 'en' | 'fr';

const SLIDES = [
  {
    icon: Shield,
    tag: 'WELCOME',
    title: 'Guard Every\nMedicine',
    body: 'Scan any medicine in seconds and know if it\'s safe. Built for Cameroon.',
    accent: '#1D9E75',
  },
  {
    icon: Scan,
    tag: 'HOW IT WORKS',
    title: 'One Scan.\nInstant Answer.',
    body: 'Point your camera at the QR code printed on any medicine packaging.',
    accent: '#1A6FB5',
  },
  {
    icon: CheckCircle2,
    tag: 'RESULTS',
    title: 'Clear Verdict.\nEvery Time.',
    body: 'Authentic, counterfeit, recalled, or unknown — with full product details.',
    accent: '#2D7A3A',
  },
  {
    icon: AlertTriangle,
    tag: 'COMMUNITY',
    title: 'Report.\nProtect Others.',
    body: 'Flag suspicious medicines and alert health authorities in your region.',
    accent: '#A05E1A',
  },
];

function LangPicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [sel, setSel] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const langs = [
    { code: 'en' as Lang, flag: '🇬🇧', name: 'English', hint: 'Continue in English' },
    { code: 'fr' as Lang, flag: '🇫🇷', name: 'Français', hint: 'Continuer en Français' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: c.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
      {/* Mark */}
      <div style={{ textAlign: 'center', marginBottom: 52, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(-12px)', transition: 'all 0.5s ease' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 12px 40px ${c.primary}30` }}>
          <Shield size={36} color="#fff" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: c.text, letterSpacing: '-0.8px', marginBottom: 6 }}>PharmaTrack</h1>
        <p style={{ fontSize: 13, color: c.textTertiary, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>Medicine Verifier</p>
      </div>

      {/* Lang label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, opacity: mounted ? 1 : 0, transition: 'all 0.5s ease 0.1s' }}>
        <Globe size={13} color={c.textTertiary} />
        <span style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select language</span>
      </div>

      {/* Options */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {langs.map(({ code, flag, name, hint }, i) => {
          const active = sel === code;
          return (
            <button key={code} onClick={() => setSel(code)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, border: `1.5px solid ${active ? c.primary : c.border}`, background: active ? c.primaryBg : c.surface, cursor: 'pointer', textAlign: 'left', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)', transition: `all 0.4s ease ${0.15 + i * 0.07}s` }}>
              <span style={{ fontSize: 28 }}>{flag}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: c.text }}>{name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: c.textTertiary }}>{hint}</p>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? c.primary : c.border}`, background: active ? c.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                {active && <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.5 6L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={() => onSelect(sel)} style={{ width: '100%', maxWidth: 320, padding: '16px', borderRadius: 16, border: 'none', background: c.primary, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 28px ${c.primary}35`, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)', transition: 'all 0.4s ease 0.28s' }}>
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function Onboarding({ onComplete }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [lang, setLang] = useState<Lang | null>(null);
  const [step, setStep] = useState(0);
  const [vis, setVis] = useState(false);

  useEffect(() => { if (localStorage.getItem('pharmatrack-onboarding-done')) onComplete(); }, [onComplete]);
  useEffect(() => {
    if (!lang) return;
    setVis(false);
    const t = setTimeout(() => setVis(true), 80);
    return () => clearTimeout(t);
  }, [step, lang]);

  if (!lang) return <LangPicker onSelect={l => { localStorage.setItem('pharmatrack-lang', l); setLang(l); }} />;

  const s = SLIDES[step];
  const Icon = s.icon;
  const isLast = step === 3;
  const go = (d: 1 | -1) => { setVis(false); setTimeout(() => setStep(p => p + d), 200); };
  const done = () => { localStorage.setItem('pharmatrack-onboarding-done', 'true'); onComplete(); };

  return (
    <div style={{ minHeight: '100dvh', background: c.background, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} color="#fff" strokeWidth={1.5} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: c.text }}>PharmaTrack</span>
        </div>
        <button onClick={done} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: c.textTertiary, cursor: 'pointer', padding: '4px 0' }}>
          {lang === 'fr' ? 'Passer' : 'Skip'}
        </button>
      </div>

      {/* Progress */}
      <div style={{ padding: '14px 24px 0' }}>
        <div style={{ height: 2, background: c.border, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step + 1) / 4) * 100}%`, background: s.accent, borderRadius: 2, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.3s ease' }} />
        </div>
      </div>

      {/* Icon */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 0' }}>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'scale(0.88)', transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ width: 200, height: 200, borderRadius: '50%', background: s.accent + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s.accent}20` }}>
            <div style={{ width: 140, height: 140, borderRadius: '50%', background: s.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 16px 48px ${s.accent}40` }}>
                <Icon size={40} color="#fff" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <div style={{ padding: '28px 28px 0', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all 0.4s ease 0.08s' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.tag}</span>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, color: c.text, margin: '10px 0 14px', lineHeight: 1.1, letterSpacing: '-0.8px', whiteSpace: 'pre-line' }}>{s.title}</h2>
        <p style={{ fontSize: 15, color: c.textSecondary, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
      </div>

      {/* Nav */}
      <div style={{ padding: '24px 24px max(24px, env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {SLIDES.map((sl, i) => (
            <div key={i} onClick={() => { setVis(false); setTimeout(() => setStep(i), 200); }} style={{ height: 3, width: i === step ? 24 : 6, borderRadius: 2, background: i === step ? s.accent : c.border, transition: 'all 0.3s ease', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => go(-1)} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronRight size={20} color={c.textSecondary} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <button onClick={() => isLast ? done() : go(1)} style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: s.accent, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 28px ${s.accent}35`, transition: 'background 0.3s ease, box-shadow 0.3s ease' }}>
            {isLast ? (lang === 'fr' ? 'Commencer' : 'Get Started') : (lang === 'fr' ? 'Suivant' : 'Next')}
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
