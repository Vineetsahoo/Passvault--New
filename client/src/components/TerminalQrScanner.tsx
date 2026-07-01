import React, { useState, useEffect } from 'react';
import {
  Terminal, QrCode, Clock, CheckCircle, XCircle, AlertCircle,
  Copy, Loader2, Smartphone
} from 'lucide-react';
import { terminalQrAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TerminalQrScannerProps {
  onScanSuccess?: (passData: any) => void;
}

interface QRSession {
  sessionId: string;
  qrData: string;
  expiresAt: number;
  expirySeconds: number;
  passType: string;
  status: 'active' | 'scanned' | 'expired';
}

// ─── Pass type templates ───────────────────────────────────────────────────────
const PASS_TEMPLATES = {
  'boarding-pass': {
    title: 'Boarding Pass',
    description: 'Boarding pass for flight',
    icon: '✈',
    airline: 'Sky Airlines',
    from: 'LAX',
    to: 'JFK',
    flight: 'SA123',
    seat: '12A',
    gate: 'B7',
    boarding: '10:30 AM',
    departure: '11:00 AM',
    date: new Date().toISOString().split('T')[0],
    passenger: 'John Doe',
    class: 'Economy',
    category: 'travel'
  },
  'event-ticket': {
    title: 'Event Ticket',
    description: 'Event ticket for music festival',
    icon: '▶',
    event: 'Summer Music Festival',
    venue: 'Madison Square Garden',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '7:00 PM',
    section: 'A',
    row: '12',
    seat: '5',
    price: '$150.00',
    ticketNumber: 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    category: 'entertainment'
  },
  'loyalty-card': {
    title: 'Loyalty Card',
    description: 'Loyalty card with rewards',
    icon: '◆',
    program: 'Gold Member',
    memberNumber: 'GOLD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    memberSince: '2024',
    points: Math.floor(Math.random() * 5000) + 1000,
    tier: 'Gold',
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: 'membership'
  },
  'parking-pass': {
    title: 'Parking Pass',
    description: 'Monthly parking permit',
    icon: 'P',
    location: 'Downtown Parking Garage',
    level: 'Level 3',
    spot: 'A-45',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vehicle: 'Toyota Camry',
    plate: 'ABC-' + Math.floor(Math.random() * 9000 + 1000),
    passNumber: 'PARK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    category: 'parking'
  },
  'gym-membership': {
    title: 'Gym Membership',
    description: 'Fitness center access pass',
    icon: '+',
    gym: 'FitLife Fitness Center',
    memberName: 'John Doe',
    membershipType: 'Premium',
    memberNumber: 'GYM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    facilities: 'All Access',
    category: 'fitness'
  }
} as const;

// ─── Newsprint utility styles ──────────────────────────────────────────────────
// TerminalQrScanner is embedded inside QrScan which already injects these,
// but if this component is ever used standalone, the <style> tag is here.
// The parent's `* { border-radius: 0 !important; }` rule covers the QR SVG
// container too, so no further overrides are needed.
// ─────────────────────────────────────────────────────────────────────────────
const TerminalStyles = () => (
  <style>{`
    .tqs-hard-hover { transition: box-shadow 200ms ease-out, transform 200ms ease-out; }
    .tqs-hard-hover:hover { box-shadow: 4px 4px 0px 0px #111111; transform: translate(-2px, -2px); }
    @keyframes tqs-scan-line {
      0%   { top: 0%; opacity: 1; }
      95%  { top: 100%; opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .tqs-scan-line {
      animation: tqs-scan-line 2.4s ease-in-out infinite;
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: #CC0000;
      box-shadow: 0 0 6px #CC0000;
    }
  `}</style>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Returns Newsprint token colours for the countdown timer.
 * ≤10s → editorial red (urgency), ≤30s → muted grey, else → ink black
 */
const getTimerColor = (seconds: number): string => {
  if (seconds <= 10) return '#CC0000';
  if (seconds <= 30) return '#737373';
  return '#111111';
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Reusable message bar — error or success variant */
const MessageBar: React.FC<{
  type: 'error' | 'success';
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => (
  <div className={`flex items-start gap-3 p-4 border-l-4 ${
    type === 'error'
      ? 'border-[#CC0000] bg-[#F9F9F7]'
      : 'border-[#111111] bg-[#F9F9F7]'
  }`}>
    {type === 'error'
      ? <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      : <CheckCircle className="h-5 w-5 text-[#111111] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
    }
    <span className={`text-xs np-mono uppercase tracking-wide flex-1 ${
      type === 'error' ? 'text-[#CC0000]' : 'text-[#111111]'
    }`}>
      {message}
    </span>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-[#A3A3A3] hover:text-[#111111] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss message"
      >
        <XCircle className="h-4 w-4" strokeWidth={1.5} />
      </button>
    )}
  </div>
);

/** Divider with optional centered label */
const SectionRule: React.FC<{ label?: string }> = ({ label }) =>
  label ? (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#E5E5E0]" />
      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">{label}</span>
      <div className="flex-1 h-px bg-[#E5E5E0]" />
    </div>
  ) : (
    <div className="h-px bg-[#E5E5E0]" />
  );

// ─── Main component ────────────────────────────────────────────────────────────
const TerminalQrScanner: React.FC<TerminalQrScannerProps> = ({ onScanSuccess }) => {
  const [session, setSession]               = useState<QRSession | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [success, setSuccess]               = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining]   = useState<number>(0);
  const [selectedPassType, setSelectedPassType] = useState<string>('boarding-pass');
  const [copied, setCopied]                 = useState(false);

  // ── Cleanup on unmount — cancel active session only ──────────────────────
  useEffect(() => {
    return () => {
      if (session && session.status === 'active') {
        terminalQrAPI.cancelSession(session.sessionId).catch(() => {
          // Session may already be cleaned up server-side; silently ignore.
        });
      }
    };
  }, [session]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        setError('QR code expired. Please generate a new one.');
        setSession(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  // ── Poll session status ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await terminalQrAPI.getSessionStatus(session.sessionId);
        console.log('📊 Session status:', response.data);

        if (response.data.data.scanned) {
          setSession({ ...session, status: 'scanned' });
          setSuccess('Pass created successfully — refreshing your passes...');
          setError(null);
          if (onScanSuccess) onScanSuccess(response.data.data);
          setTimeout(() => window.location.reload(), 3000);
        }
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 410) {
          // 410 Gone = session cleaned up after successful scan
          console.log('✅ Session completed (410/404) — pass created successfully');
          setSession({ ...session, status: 'scanned' });
          setSuccess('Pass created successfully — refreshing your passes...');
          setError(null);
          setTimeout(() => window.location.reload(), 3000);
        } else {
          console.error('❌ Error polling session:', err);
          setError(`Error: ${err.response?.data?.message || err.message}`);
        }
      }
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [session, onScanSuccess]);

  // ── API actions ───────────────────────────────────────────────────────────
  const generateQRSession = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const passData = PASS_TEMPLATES[selectedPassType as keyof typeof PASS_TEMPLATES];
      const response = await terminalQrAPI.generateSession({
        passType: selectedPassType,
        passData,
        expirySeconds: 60
      });
      if (response.data.success) {
        setSession({ ...response.data.data, status: 'active' });
        setTimeRemaining(response.data.data.expirySeconds);
        setSuccess('QR code ready — scan with your phone camera.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR session');
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelSession = async () => {
    if (!session) return;
    if (session.status !== 'active') { setSession(null); return; }
    try {
      await terminalQrAPI.cancelSession(session.sessionId);
      setSession(null);
      setSuccess('Session cancelled');
      setError(null);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 410) {
        console.log('✅ Session already cleaned up on backend');
        setSession(null);
        setSuccess('Session ended');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        console.error('❌ Error cancelling session:', err);
        setError(err.response?.data?.message || 'Failed to cancel session');
      }
    }
  };

  const copyUrl = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.qrData);
    setCopied(true);
    setSuccess('URL copied — open in phone browser if camera scan fails');
    setTimeout(() => {
      setCopied(false);
      setSuccess(null);
    }, 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden np-sans">
      <TerminalStyles />

      {/* ── Component Header — inverted ink bar ── */}
      <div className="bg-[#111111] p-4 border-b-2 border-[#CC0000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border border-[#F9F9F7]/20 p-2 flex items-center justify-center w-9 h-9">
              <Terminal className="h-4 w-4 text-[#F9F9F7]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-black text-[#F9F9F7] text-xs uppercase tracking-widest np-mono">
                Terminal QR Scanner
              </h3>
              <p className="text-[#737373] text-xs np-mono mt-0.5">
                Generate &amp; scan QR pass via phone camera
              </p>
            </div>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[#CC0000] animate-pulse" />
            <span className="text-[#A3A3A3] np-mono text-xs uppercase tracking-widest">
              {session ? 'SESSION ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 space-y-6">

        {/* Feedback messages */}
        {error   && <MessageBar type="error"   message={error}   onDismiss={() => setError(null)} />}
        {success && <MessageBar type="success" message={success} />}

        {/* ══════════════════════════════════════════════════════════════
            STATE A — No active session: pass-type picker + generate btn
            ══════════════════════════════════════════════════════════════ */}
        {!session ? (
          <>
            {/* Pass type selector — collapsed border button grid */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                Select Pass Type
              </label>

              {/*
                5 templates → 2 columns on mobile (3rd item in col-2 spans full width)
                On md+, show 3 items per row, keeping last row flush
              */}
              <div className="grid grid-cols-2 md:grid-cols-3 border border-[#111111]">
                {Object.entries(PASS_TEMPLATES).map(([key, template], idx, arr) => {
                  const isActive = selectedPassType === key;
                  // On a 3-col grid the 4th item (idx=3) starts the 2nd row;
                  // the 5th (idx=4) sits alone in col-1 and we want it to span 2 cols
                  // so the grid fills cleanly. `col-span-2 md:col-span-1` achieves this
                  // without breaking the md layout.
                  const isSoloOnMobile = arr.length === 5 && idx === 4;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPassType(key)}
                      className={[
                        'flex flex-col items-center justify-center gap-2 py-4 px-3',
                        'transition-all duration-200 min-h-[80px]',
                        'border-r border-b border-[#111111]',
                        // Remove right border for last column items
                        idx % 2 === 1 ? 'border-r-0 md:border-r border-[#111111]' : '',
                        idx % 3 === 2 ? 'md:border-r-0' : '',
                        // Span full width on mobile for the lone 5th item
                        isSoloOnMobile ? 'col-span-2 md:col-span-1' : '',
                        isActive
                          ? 'bg-[#111111] text-[#F9F9F7]'
                          : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]',
                      ].filter(Boolean).join(' ')}
                      aria-pressed={isActive}
                    >
                      {/* Monospace icon character — editorial aesthetic */}
                      <span className={`font-black np-mono text-lg leading-none ${isActive ? 'text-[#CC0000]' : 'text-[#111111]'}`}>
                        {template.icon}
                      </span>
                      <span className="font-black text-xs uppercase tracking-widest np-mono leading-tight text-center">
                        {template.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected type descriptor */}
              <div className="mt-0 px-4 py-2.5 bg-[#F5F5F5] border border-t-0 border-[#111111] flex items-center gap-2">
                <span className="text-[#CC0000] font-black np-mono text-xs">›</span>
                <span className="text-xs text-[#525252] np-body">
                  {PASS_TEMPLATES[selectedPassType as keyof typeof PASS_TEMPLATES]?.description}
                </span>
              </div>
            </div>

            {/* ── Generate button — full-width primary ── */}
            <button
              onClick={generateQRSession}
              disabled={isGenerating}
              className={[
                'w-full px-6 py-3.5 border font-black uppercase text-xs tracking-widest',
                'transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] np-mono',
                isGenerating
                  ? 'bg-[#E5E5E0] text-[#A3A3A3] border-[#A3A3A3] cursor-not-allowed'
                  : 'bg-[#111111] text-[#F9F9F7] border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111]'
              ].join(' ')}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  GENERATING QR CODE...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" strokeWidth={1.5} />
                  GENERATE QR CODE
                </>
              )}
            </button>

            {/* ── How it works — editorial instruction block ── */}
            <div className="border border-[#111111] overflow-hidden">
              {/* Inverted header */}
              <div className="bg-[#111111] px-4 py-2.5 flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-[#F9F9F7]" strokeWidth={1.5} />
                <span className="text-[#F9F9F7] text-xs font-black uppercase tracking-widest np-mono">
                  How It Works — No Terminal Required
                </span>
              </div>

              {/* Numbered steps */}
              <ol className="divide-y divide-[#E5E5E0]">
                {[
                  'Select a pass type above and click Generate QR Code',
                  'A QR code appears directly in your browser window',
                  'Scan with your phone\'s Camera app or Google Lens',
                  'Your pass is automatically saved to your account',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-4 px-4 py-3">
                    {/* Editorial red step number */}
                    <span className="flex-shrink-0 text-[#CC0000] font-black np-mono text-xs w-6 pt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[#525252] text-xs np-body leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              {/* Network note */}
              <div className="border-t border-[#111111] flex items-start gap-3 px-4 py-3 bg-[#F5F5F5]">
                <AlertCircle className="h-3.5 w-3.5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-xs text-[#525252] np-mono">
                  <strong className="text-[#111111]">Note:</strong> Your phone must be on the same WiFi network as your computer
                </p>
              </div>
            </div>
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════
             STATE B — Active session: show QR code and controls
             ══════════════════════════════════════════════════════════════ */
          <>
            {/* ── QR Code display panel ── */}
            <div className="border-2 border-[#111111] overflow-hidden">

              {/* Panel header */}
              <div className="bg-[#111111] px-4 py-3 flex items-center justify-between">
                <span className="text-[#F9F9F7] text-xs font-black uppercase tracking-widest np-mono flex items-center gap-2">
                  <Smartphone className="h-4 w-4" strokeWidth={1.5} />
                  Scan With Your Phone Camera
                </span>
                <span className="text-[#737373] text-xs np-mono">
                  No app needed
                </span>
              </div>

              {/* QR code with editorial red corner accents */}
              <div className="bg-[#F9F9F7] py-8 px-6 flex justify-center">
                <div className="relative inline-block">
                  {/* Targeting corners — pure CSS, no images */}
                  <span className="absolute top-0 left-0  w-7 h-7 border-t-4 border-l-4 border-[#CC0000]" />
                  <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#CC0000]" />
                  <span className="absolute bottom-0 left-0  w-7 h-7 border-b-4 border-l-4 border-[#CC0000]" />
                  <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#CC0000]" />

                  {/* Animated scan line */}
                  <div className="tqs-scan-line" />

                  {/* White QR field */}
                  <div className="bg-white p-5 border border-[#E5E5E0]">
                    {session.qrData ? (
                      <QRCodeSVG
                        value={session.qrData}
                        size={256}
                        level="H"
                        includeMargin={false}
                        bgColor="#FFFFFF"
                        fgColor="#111111"
                      />
                    ) : (
                      <div className="w-[256px] h-[256px] flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#A3A3A3]" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timer + pass info — collapsed two-column row */}
              <div className="border-t border-[#111111] grid grid-cols-2 divide-x divide-[#111111]">
                {/* Timer */}
                <div className="p-4">
                  <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-1">Time Remaining</p>
                  <p
                    className="text-4xl font-black np-mono tabular-nums leading-none transition-colors duration-300"
                    style={{ color: getTimerColor(timeRemaining) }}
                  >
                    {formatTime(timeRemaining)}
                  </p>
                  {timeRemaining <= 30 && timeRemaining > 0 && (
                    <p className="text-xs text-[#CC0000] np-mono uppercase tracking-wide mt-1.5 animate-pulse">
                      EXPIRING SOON
                    </p>
                  )}
                </div>

                {/* Pass info */}
                <div className="p-4">
                  <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-1">Pass Type</p>
                  <p className="font-black text-[#111111] np-mono text-sm uppercase tracking-wide leading-tight">
                    {PASS_TEMPLATES[selectedPassType as keyof typeof PASS_TEMPLATES]?.title}
                  </p>
                  <p className="text-xs text-[#A3A3A3] np-mono mt-1.5 truncate">
                    ID {session.sessionId.slice(0, 12)}…
                  </p>
                </div>
              </div>

              {/* Scan instructions — collapsed list, editorial formatting */}
              <div className="border-t border-[#111111] bg-[#F5F5F5]">
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs font-black uppercase tracking-widest np-mono text-[#111111] mb-2">How to Scan:</p>
                </div>
                <ul className="divide-y divide-[#E5E5E0]">
                  {[
                    { platform: 'iPhone',   tip: 'Open Camera app, point at QR code, tap banner' },
                    { platform: 'Android',  tip: 'Open Camera app or Google Lens, tap notification' },
                    { platform: 'Tip',      tip: 'Hold phone steady 6–12 inches from screen' },
                    { platform: 'WiFi',     tip: 'Phone must be on same network as computer' },
                  ].map(({ platform, tip }) => (
                    <li key={platform} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-[#CC0000] font-black np-mono text-xs flex-shrink-0 w-16 uppercase pt-0.5">
                        {platform}
                      </span>
                      <span className="text-[#525252] text-xs np-body leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons — split bottom bar */}
              <div className="border-t border-[#111111] grid grid-cols-2 divide-x divide-[#111111]">
                <button
                  onClick={cancelSession}
                  className="flex items-center justify-center gap-2 p-3 bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black text-xs uppercase tracking-widest np-mono min-h-[48px]"
                >
                  <XCircle className="h-4 w-4" strokeWidth={1.5} />
                  Cancel
                </button>
                <button
                  onClick={copyUrl}
                  className={`flex items-center justify-center gap-2 p-3 transition-all duration-200 font-black text-xs uppercase tracking-widest np-mono min-h-[48px] ${
                    copied
                      ? 'bg-[#111111] text-[#F9F9F7]'
                      : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                  }`}
                >
                  <Copy className="h-4 w-4" strokeWidth={1.5} />
                  {copied ? 'COPIED!' : 'Copy URL'}
                </button>
              </div>
            </div>

            {/* ── Status indicator ── */}
            {session.status === 'scanned' ? (
              /* Success — inverted ink panel with serif headline */
              <div className="bg-[#111111] border border-[#111111] flex flex-col items-center gap-4 p-8 text-center">
                <div className="border border-[#F9F9F7]/20 p-4 flex items-center justify-center w-16 h-16">
                  <CheckCircle className="h-8 w-8 text-[#F9F9F7]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-2">Scan Status</p>
                  <h4 className="text-2xl font-black text-[#F9F9F7] np-serif leading-tight">
                    Successfully Scanned!
                  </h4>
                  <p className="text-[#A3A3A3] text-xs np-mono mt-2 uppercase tracking-wider">
                    Pass added · Refreshing page...
                  </p>
                </div>
              </div>
            ) : (
              /* Waiting — subtle animated indicator */
              <div className="bg-[#F5F5F5] border border-[#111111] flex items-center justify-center gap-3 p-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#111111]" strokeWidth={1.5} />
                <span className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">
                  Waiting for scan...
                </span>
                {/* Dot-pulse progress */}
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="inline-block w-1 h-1 bg-[#111111] animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TerminalQrScanner;