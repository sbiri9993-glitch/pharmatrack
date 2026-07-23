import { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Search, QrCode, X } from 'lucide-react';
import ResultCard, { type ScanResult } from '../components/result/ResultCard';

interface ScannerProps {
  onGoToReport?: (prefill: { code?: string; productName?: string }) => void;
}

export default function Scanner({ onGoToReport }: ScannerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [code, setCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const qrRef = useRef<any>(null);

  const verify = useCallback(async (raw: string) => {
    if (!raw.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('serial_code', raw.trim())
        .maybeSingle();

      if (pErr) throw pErr;

      if (!product) {
        setResult({ type: 'unknown', scannedCode: raw.trim() });
        await logScan(raw.trim(), 'unknown', null);
        return;
      }

      const { data: recall } = await supabase
        .from('recalls')
        .select('*')
        .eq('batch_number', product.batch_number)
        .is('resolved_at', null)
        .maybeSingle();

      if (recall) {
        setResult({ type: 'recalled', product, recall, scannedCode: raw.trim() });
        await logScan(raw.trim(), 'recalled', product.id);
        return;
      }

      const { data: prev } = await supabase
        .from('scan_logs')
        .select('created_at')
        .eq('code_scanned', raw.trim())
        .order('created_at', { ascending: true });

      if (prev && prev.length > 0) {
        setResult({ type: 'duplicate', product, previousScans: prev, scannedCode: raw.trim() });
        await logScan(raw.trim(), 'duplicate', product.id);
        return;
      }

      setResult({ type: 'authentic', product, scannedCode: raw.trim() });
      await logScan(raw.trim(), 'authentic', product.id);
    } catch {
      setResult({ type: 'unknown', scannedCode: raw.trim() });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logScan = async (code: string, resultType: string, productId: string | null) => {
    if (!user) return;
    await supabase.from('scan_logs').insert({ code_scanned: code, user_id: user.id, result: resultType, product_id: productId });
  };

  const startCamera = async () => {
    setScanning(true);
    setCameraReady(false);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });
      qrRef.current = scanner;
      // Rectangular box works better for barcodes, still captures QR codes fine
      await scanner.start({ facingMode: 'environment' }, { fps: 12, qrbox: { width: 280, height: 120 } },
        (decoded: string) => { scanner.stop().catch(() => {}); qrRef.current = null; setScanning(false); setCameraReady(false); verify(decoded); },
        () => {}
      );
      setCameraReady(true);
    } catch { setScanning(false); setShowManual(true); }
  };

  const stopCamera = async () => {
    if (qrRef.current) { try { await qrRef.current.stop(); } catch {} qrRef.current = null; }
    setScanning(false);
    setCameraReady(false);
  };

  useEffect(() => () => { if (qrRef.current) qrRef.current.stop().catch(() => {}); }, []);

  if (result) return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, padding: '20px 18px 100px', overflowY: 'auto' }}>
      <ResultCard
        result={result}
        onScanAgain={() => { setResult(null); setCode(''); }}
        onReport={() => onGoToReport?.({ code: result.scannedCode, productName: result.product?.product_name })}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.background, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '24px 22px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>PharmaTrack</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: c.text, margin: '0 0 6px', letterSpacing: '-0.6px' }}>Scan Medicine</h1>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: 0 }}>Scan the QR code or barcode on the packaging</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 22px 0' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          {scanning ? (
            /* Camera view */
            <div>
              <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', backgroundColor: '#000', aspectRatio: '1', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>
                <div id="qr-reader" style={{ width: '100%', height: '100%' }} />
                {cameraReady && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {/* Dark overlay with transparent scan window in the centre */}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
                    {/* Transparent window — matches the qrbox dimensions ratio (280×120) */}
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '82%', height: '35%',
                      background: 'transparent',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                      borderRadius: 8,
                    }} />
                    {/* Corner brackets on the window */}
                    {(['tl','tr','bl','br'] as const).map(p => (
                      <div key={p} style={{
                        position: 'absolute',
                        width: 28, height: 28,
                        top: p.includes('t') ? 'calc(50% - 17.5% - 0px)' : undefined,
                        bottom: p.includes('b') ? 'calc(50% - 17.5% - 0px)' : undefined,
                        left: p.includes('l') ? '9%' : undefined,
                        right: p.includes('r') ? '9%' : undefined,
                        borderTop: p.includes('t') ? `2.5px solid ${c.primary}` : 'none',
                        borderBottom: p.includes('b') ? `2.5px solid ${c.primary}` : 'none',
                        borderLeft: p.includes('l') ? `2.5px solid ${c.primary}` : 'none',
                        borderRight: p.includes('r') ? `2.5px solid ${c.primary}` : 'none',
                        borderRadius: p==='tl'?'5px 0 0 0':p==='tr'?'0 5px 0 0':p==='bl'?'0 0 0 5px':'0 0 5px 0',
                      }} />
                    ))}
                    {/* Animated scan line */}
                    <div className="scan-line" style={{
                      position: 'absolute',
                      left: '10%', right: '10%',
                      height: 1.5,
                      background: c.primary,
                      boxShadow: `0 0 8px ${c.primary}`,
                      top: '50%',
                    }} />
                  </div>
                )}
                <button onClick={stopCamera} style={{ position: 'absolute', bottom: 16, right: 16, width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              {/* Format hint below camera */}
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 14 }}>
                {['QR Code', 'Barcode (EAN/Code128)', 'Data Matrix'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.primary }} />
                    <span style={{ fontSize: 11, color: c.textTertiary, fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: c.textTertiary, marginTop: 8, lineHeight: 1.6 }}>
                Align the code within the frame
              </p>
            </div>
          ) : (
            <>
              {/* Main scan button — the signature element */}
              <button onClick={startCamera} className="glow" style={{ width: '100%', aspectRatio: '1', borderRadius: 28, border: `1.5px solid ${c.border}`, background: c.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${c.primary}40` }}>
                  <Camera size={44} color="#fff" strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: c.text, letterSpacing: '-0.3px' }}>Tap to Scan</p>
                  <p style={{ margin: '5px 0 0', fontSize: 13, color: c.textTertiary }}>QR codes and barcodes</p>
                </div>
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: c.border }} />
                <span style={{ fontSize: 12, color: c.textTertiary, fontWeight: 500 }}>or enter code</span>
                <div style={{ flex: 1, height: 1, background: c.border }} />
              </div>

              {/* Manual entry */}
              <button onClick={() => setShowManual(v => !v)} style={{ width: '100%', padding: '14px 16px', borderRadius: 18, border: `1.5px solid ${showManual ? c.primary : c.border}`, background: c.surface, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'border-color 0.2s', marginBottom: showManual ? 10 : 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: c.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={18} color={c.primary} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text }}>Enter code manually</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: c.textTertiary }}>Type the code from the box</p>
                </div>
              </button>

              {showManual && (
                <div style={{ background: c.surface, borderRadius: 18, padding: 14, border: `1.5px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }}><Search size={15} /></div>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verify(code); }} placeholder="e.g. CM-PAR-2024-001"
                      style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.surfaceElevated, color: c.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = c.primary; }} onBlur={e => { e.target.style.borderColor = c.border; }}
                    />
                  </div>
                  <button onClick={() => verify(code)} disabled={!code.trim() || loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: !code.trim() || loading ? c.border : c.primary, color: !code.trim() || loading ? c.textTertiary : '#fff', fontSize: 14, fontWeight: 600, cursor: !code.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    {loading ? <div className="spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Verify Medicine'}
                  </button>
                </div>
              )}

              {loading && !showManual && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
                  <div className="spin" style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${c.border}`, borderTopColor: c.primary }} />
                  <p style={{ margin: 0, fontSize: 14, color: c.textSecondary }}>Checking database…</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!scanning && !loading && (
        <p style={{ padding: '20px 24px 100px', fontSize: 12, color: c.textTertiary, textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
          The QR code or barcode is printed on the medicine packaging by the manufacturer.
        </p>
      )}
    </div>
  );
}
