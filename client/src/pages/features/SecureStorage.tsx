import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, HardDrive, Key, AlertTriangle, CheckCircle2, FileCheck,
  Settings, History, Download, CloudOff, KeyRound, Eye, EyeOff, LogIn,
  ArrowLeft, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import storageService from '../../services/storageService';
import backupService from '../../services/backupService';

// ─── Newsprint Design System ──────────────────────────────────────────────────
// Font imports + utility classes that enforce the print-press aesthetic.
// Mirrors QrScan.tsx / TerminalQrScanner.tsx exactly.
// ─────────────────────────────────────────────────────────────────────────────
const NewsprintStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');

    .np-serif  { font-family: 'Playfair Display', 'Times New Roman', serif; }
    .np-body   { font-family: 'Lora', Georgia, serif; }
    .np-sans   { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
    .np-mono   { font-family: 'JetBrains Mono', 'Courier New', monospace; }

    /* Zero radius — no exceptions */
    * { border-radius: 0px !important; }

    /* Hard offset shadow on hover — "newspaper cutout" lift */
    .np-hard-hover { transition: box-shadow 200ms ease-out, transform 200ms ease-out; }
    .np-hard-hover:hover { box-shadow: 4px 4px 0px 0px #111111; transform: translate(-2px, -2px); }

    /* Subtle newsprint dot grid on background */
    .np-dot-bg {
      background-color: #F9F9F7;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
    }

    /* Fine graph-paper line grid for inverted / heavy sections */
    .np-texture {
      position: relative;
    }
    .np-texture::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(0deg, transparent 98%, rgba(255,255,255,0.03) 100%),
        linear-gradient(90deg, transparent 98%, rgba(255,255,255,0.03) 100%);
      background-size: 3px 3px;
      pointer-events: none;
      opacity: 0.5;
    }

    /* Focus ring for keyboard nav */
    .np-focus:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px #F9F9F7, 0 0 0 4px #111111;
    }

    /* Custom scrollbar for audit log */
    .np-scroll::-webkit-scrollbar { width: 4px; }
    .np-scroll::-webkit-scrollbar-track { background: #F5F5F5; }
    .np-scroll::-webkit-scrollbar-thumb { background: #111111; }
  `}</style>
);

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper: newspaper masthead, edition bar, header, ornamental footer.
// Identical structure to QrScan.tsx's FeatureTemplate.
// ─────────────────────────────────────────────────────────────────────────────
interface FeatureTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  edition?: string;
  children: React.ReactNode;
}

const FeatureTemplate: React.FC<FeatureTemplateProps> = ({
  title, description, icon, edition, children
}) => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="np-dot-bg min-h-screen pt-28 pb-20 np-sans">
      <NewsprintStyles />
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">

        {/* ── Back button ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F9F9F7] border border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] np-mono np-focus"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            BACK TO HOME
          </button>
        </div>

        {/* ── Main bordered container ── */}
        <div className="border-4 border-[#111111] bg-[#F9F9F7] overflow-hidden">

          {/* Masthead / Edition bar */}
          <div className="bg-[#111111] px-6 py-2 flex items-center justify-between np-texture">
            <span className="text-[#A3A3A3] np-mono text-xs uppercase tracking-widest">
              {edition ?? 'SECURITY EDITION'}
            </span>
            <span className="text-[#737373] np-mono text-xs">{today}</span>
          </div>

          {/* ── Page header ── */}
          <div className="p-8 md:p-12 border-b-4 border-[#111111]">
            <div className="flex flex-col md:flex-row md:items-center gap-8">

              {/* Icon box */}
              <div className="border-2 border-[#111111] p-6 flex items-center justify-center w-24 h-24 flex-shrink-0 np-hard-hover cursor-default">
                {React.cloneElement(icon as React.ReactElement, {
                  className: 'h-12 w-12 text-[#111111]',
                  strokeWidth: 1.5
                })}
              </div>

              <div className="space-y-4">
                {/* Section badge */}
                <div className="inline-block border border-[#CC0000] bg-[#CC0000] px-4 py-1 text-xs font-black uppercase tracking-widest text-[#F9F9F7] np-mono">
                  FEATURE
                </div>
                {/* Headline — Newsprint drama */}
                <h1 className="text-4xl md:text-5xl font-black leading-[0.92] tracking-tight text-[#111111] np-serif">
                  {title}
                </h1>
                {/* Deck / subhead */}
                <p className="text-base leading-relaxed max-w-2xl text-[#525252] np-body border-l-2 border-[#E5E5E0] pl-4">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* ── Content area ── */}
          <div className="p-8 md:p-12">
            {children}
          </div>
        </div>

        {/* ── Ornamental footer divider ── */}
        <div className="mt-8 py-4 text-center np-serif text-xl text-[#A3A3A3] tracking-[1em]">
          &#x2727; &#x2727; &#x2727;
        </div>
        <div className="h-1 bg-[#111111]" />
      </div>
    </div>
  );
};

// ─── SectionHeader ─────────────────────────────────────────────────────────────
// Reusable panel header: grey band, icon + uppercase label, optional action slot.
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}> = ({ icon, title, action }) => (
  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between">
    <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
      {icon}
      {title}
    </h3>
    {action}
  </div>
);

// ─── SectionRule ──────────────────────────────────────────────────────────────
// Horizontal rule that optionally bears a centred section label.
// ─────────────────────────────────────────────────────────────────────────────
const SectionRule: React.FC<{ label?: string }> = ({ label }) =>
  label ? (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-[#111111]" />
      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">{label}</span>
      <div className="flex-1 h-px bg-[#111111]" />
    </div>
  ) : (
    <div className="h-px bg-[#111111] my-6" />
  );

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface StorageMetrics {
  totalStorage: string;
  usedStorage: string;
  encryptedFiles: number;
  lastBackup: Date;
}

interface SecurityStatus {
  status: 'secure' | 'warning' | 'critical';
  lastScan: Date;
  encryptionType: string;
  twoFactorEnabled: boolean;
}

interface SecurityAudit {
  id: string;
  timestamp: Date;
  action: string;
  ipAddress: string;
  location: string;
  status: 'success' | 'failed';
}

interface BackupStatus {
  lastBackup: Date;
  nextScheduled: Date;
  backupSize: string;
  location: string;
}

// ─── AuthPrompt ───────────────────────────────────────────────────────────────
// Shown when the user is not signed in. Matches the locked-state pattern in
// QrScan.tsx — bordered icon box, serif headline, primary CTA.
// ─────────────────────────────────────────────────────────────────────────────
const AuthPrompt = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F9F7] border border-[#111111] p-10 text-center">
      <div className="border-2 border-[#111111] p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Lock className="h-10 w-10 text-[#111111]" strokeWidth={1.5} />
      </div>
      <div className="space-y-3 mb-6">
        <h3 className="text-2xl font-black text-[#111111] np-serif">Sign In Required</h3>
        <p className="text-[#525252] np-body text-base leading-relaxed max-w-xs mx-auto">
          Please sign in to view your secure storage details
        </p>
      </div>
      <button
        onClick={() => navigate('/signin')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        SIGN IN NOW
      </button>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const SecureStorage = () => {
  // ── All state and logic below is preserved exactly from the original ──────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [metrics, setMetrics] = useState<StorageMetrics>({
    totalStorage: '0 GB',
    usedStorage: '0 B',
    encryptedFiles: 0,
    lastBackup: new Date()
  });

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    status: 'secure',
    lastScan: new Date(),
    encryptionType: 'AES-256',
    twoFactorEnabled: true
  });

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState<SecurityAudit[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    lastBackup: new Date(),
    nextScheduled: new Date(Date.now() + 86400000),
    backupSize: '0 B',
    location: 'Cloud Storage'
  });
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('XXXX-YYYY-ZZZZ-AAAA');

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // Check auth status
      const token = localStorage.getItem('accessToken');
      const authStatus = !!token;
      setIsAuthenticated(authStatus);

      if (authStatus) {
        try {
          setDataLoading(true);

          // Fetch storage metrics
          const storageMetricsResponse = await storageService.getStorageMetrics();
          const storageMetrics = storageMetricsResponse.metrics || storageMetricsResponse;

          // Format storage metrics
          const formatBytes = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
          };

          setMetrics({
            totalStorage: '10 GB', // Fixed limit
            usedStorage: formatBytes(storageMetrics.totalSize || storageMetrics.usedStorageBytes || 0),
            encryptedFiles: storageMetrics.totalItems || storageMetrics.encryptedFiles || 0,
            lastBackup: new Date()
          });

          // Fetch security status
          const secStatusResponse = await storageService.getSecurityStatus();
          const secStatus = secStatusResponse.status || secStatusResponse;

          setSecurityStatus({
            status: (secStatus.overallStatus || secStatus.status || 'secure') as 'secure' | 'warning' | 'critical',
            lastScan: new Date(secStatus.lastSecurityScan || secStatus.lastScan || Date.now()),
            encryptionType: secStatus.encryptionType || 'AES-256',
            twoFactorEnabled: secStatus.twoFactorEnabled || false
          });

          // Fetch backup stats
          const backupStats = await backupService.getBackupStats();

          if (backupStats.recentBackups && backupStats.recentBackups.length > 0) {
            const lastBackupData = backupStats.recentBackups[0];
            setBackupStatus({
              lastBackup: new Date(lastBackupData.createdAt),
              nextScheduled: new Date(Date.now() + 86400000), // 24 hours from now
              backupSize: formatBytes(lastBackupData.backupSize || 0),
              location: lastBackupData.location || 'Cloud Storage'
            });

            setMetrics(prev => ({
              ...prev,
              lastBackup: new Date(lastBackupData.createdAt)
            }));
          }

          // Fetch recovery key
          try {
            const keyResponse = await storageService.getRecoveryKey();
            setRecoveryKey(keyResponse.recoveryKey || 'XXXX-YYYY-ZZZZ-AAAA');
          } catch (keyErr) {
            console.log('Recovery key not available:', keyErr);
            setRecoveryKey('XXXX-YYYY-ZZZZ-AAAA');
          }

          setLoading(false);
          setDataLoading(false);
        } catch (err: any) {
          console.error('Failed to fetch security status:', err);
          setLoading(false);
          setDataLoading(false);
        }
      } else {
        setLoading(false);
        setDataLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, []);

  const handleToggleAuditLog = async () => {
    if (!showAuditLog && auditLog.length === 0) {
      // Fetch audit log when opening for the first time
      try {
        const auditResponse = await storageService.getSecurityAuditLog(20);

        // Map audit log to component format
        const mappedAuditLog: SecurityAudit[] = auditResponse.auditLog.map((entry: any) => ({
          id: entry.syncLogId,
          timestamp: new Date(entry.timestamp),
          action: entry.action,
          ipAddress: entry.deviceInfo?.ipAddress || 'Unknown',
          location: entry.deviceInfo?.location || 'Unknown',
          status: entry.status || 'success'
        }));

        setAuditLog(mappedAuditLog);
      } catch (err) {
        console.error('Failed to load audit log:', err);
      }
    }
    setShowAuditLog(!showAuditLog);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'critical': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  // ── Newsprint status map ───────────────────────────────────────────────────
  // Maps security status → Newsprint token styles:
  //  secure   → full inverted ink panel (authority, calm)
  //  warning  → red left-border on light ground (alert without panic)
  //  critical → editorial red background (maximum urgency)
  const STATUS_CONFIG = {
    secure: {
      containerClass: 'bg-[#111111] np-texture',
      icon: <CheckCircle2 className="h-6 w-6 text-[#F9F9F7]" strokeWidth={1.5} />,
      iconBorder: 'border border-[#F9F9F7]/20',
      headline: 'SYSTEMS SECURE',
      headlineClass: 'text-[#F9F9F7]',
      metaClass: 'text-[#737373]',
      badgeClass: 'bg-[#F9F9F7]/10 text-[#A3A3A3] border border-[#F9F9F7]/20',
      dot: 'bg-[#F9F9F7]'
    },
    warning: {
      containerClass: 'bg-[#F9F9F7] border-l-4 border-[#CC0000]',
      icon: <AlertTriangle className="h-6 w-6 text-[#CC0000]" strokeWidth={1.5} />,
      iconBorder: 'border border-[#CC0000]',
      headline: 'WARNING',
      headlineClass: 'text-[#CC0000]',
      metaClass: 'text-[#737373]',
      badgeClass: 'bg-[#F5F5F5] text-[#737373] border border-[#111111]',
      dot: 'bg-[#CC0000]'
    },
    critical: {
      containerClass: 'bg-[#CC0000] np-texture',
      icon: <AlertTriangle className="h-6 w-6 text-[#F9F9F7]" strokeWidth={1.5} />,
      iconBorder: 'border border-[#F9F9F7]/30',
      headline: 'CRITICAL',
      headlineClass: 'text-[#F9F9F7]',
      metaClass: 'text-[#F9F9F7]/60',
      badgeClass: 'bg-[#111111] text-[#F9F9F7] border border-[#111111]',
      dot: 'bg-[#F9F9F7]'
    }
  } as const;

  const cfg = STATUS_CONFIG[securityStatus.status] ?? STATUS_CONFIG.secure;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="Secure Storage"
        description="Your passes are encrypted and stored securely in the cloud."
        icon={<Shield />}
        edition="SECURITY EDITION"
      >
        {/* ════════════════════════════════════════════════════
            STATE A — Not authenticated
            ════════════════════════════════════════════════════ */}
        {!isAuthenticated ? (
          <AuthPrompt />

        /* ════════════════════════════════════════════════════
            STATE B — Loading
            ════════════════════════════════════════════════════ */
        ) : loading ? (
          <div className="border border-[#111111] bg-[#F5F5F5] p-12 text-center">
            <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-[#F9F9F7]">
              <Loader2 className="h-8 w-8 text-[#111111] animate-spin" strokeWidth={1.5} />
            </div>
            <p className="text-xs np-mono uppercase tracking-widest text-[#111111]">
              Loading security status...
            </p>
          </div>

        /* ════════════════════════════════════════════════════
            STATE C — Authenticated + data loaded
            ════════════════════════════════════════════════════ */
        ) : (
          <div>

            {/* ══ 1. Security Status Banner ══════════════════════════════ */}
            <div className={`relative overflow-hidden ${cfg.containerClass}`}>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                  {/* Left: icon + headline */}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 flex items-center justify-center ${cfg.iconBorder}`}>
                      {cfg.icon}
                    </div>
                    <div>
                      <p className={`text-xs np-mono uppercase tracking-widest mb-1 ${cfg.metaClass}`}>
                        Security Status
                      </p>
                      <h2 className={`text-3xl md:text-4xl font-black np-serif leading-tight tracking-tight ${cfg.headlineClass}`}>
                        {cfg.headline}
                      </h2>
                    </div>
                  </div>

                  {/* Right: last-scan badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 np-mono text-xs uppercase tracking-widest ${cfg.badgeClass}`}>
                    <span className={`inline-block w-1.5 h-1.5 ${cfg.dot} animate-pulse flex-shrink-0`} />
                    LAST SCAN: {securityStatus.lastScan.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section divider ── */}
            <SectionRule label="Storage" />

            {/* ══ 2. Storage Metrics — collapsed 2-col grid ══════════════ */}
            <div className="border border-[#111111] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#111111]">

                {/* — Left col: Storage Usage — */}
                <div>
                  <SectionHeader
                    icon={<HardDrive className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                    title="Storage Usage"
                  />
                  <div className="p-6 space-y-5">

                    {/* Big usage number */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-1">Used Storage</p>
                        <p className="text-3xl font-black text-[#111111] np-mono tabular-nums leading-none">
                          {metrics.usedStorage}
                        </p>
                        <p className="text-xs np-mono text-[#A3A3A3] mt-1 uppercase tracking-widest">
                          of {metrics.totalStorage}
                        </p>
                      </div>
                      <div className="border border-[#111111] px-3 py-1.5 bg-[#F5F5F5] flex-shrink-0">
                        <span className="text-xs np-mono uppercase tracking-widest text-[#111111] font-black">
                          75% FREE
                        </span>
                      </div>
                    </div>

                    {/* Flat newsprint progress bar — no gradient, no rounded ends */}
                    <div>
                      <div className="flex justify-between text-xs np-mono uppercase tracking-widest text-[#737373] mb-1.5">
                        <span>Usage</span>
                        <span>{metrics.usedStorage} / {metrics.totalStorage}</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#E5E5E0] border border-[#111111]">
                        <div
                          className="h-full bg-[#111111] transition-all duration-500"
                          style={{ width: '25%' }}
                        />
                      </div>
                    </div>

                    {/* Encrypted files stat block */}
                    <div className="border border-[#111111] bg-[#F5F5F5] flex items-center gap-4 p-4">
                      <div className="border border-[#111111] p-2 flex items-center justify-center bg-[#F9F9F7] flex-shrink-0">
                        <Lock className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-0.5">
                          Encrypted Files
                        </p>
                        <p className="text-2xl font-black text-[#111111] np-mono tabular-nums leading-none">
                          {metrics.encryptedFiles}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* — Right col: Security Settings — */}
                <div>
                  <SectionHeader
                    icon={<Lock className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                    title="Security Settings"
                  />
                  <div className="p-6 space-y-4">

                    {/* Encryption type */}
                    <div className="border border-[#111111] bg-[#F5F5F5] flex items-center gap-3 p-4">
                      <div className="border border-[#111111] p-2 bg-[#F9F9F7] flex items-center justify-center flex-shrink-0">
                        <Key className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-0.5">
                          Encryption Type
                        </p>
                        <p className="text-xl font-black text-[#111111] np-mono tracking-wider leading-tight">
                          {securityStatus.encryptionType}
                        </p>
                      </div>
                    </div>

                    {/* Two-Factor Authentication — newsprint toggle */}
                    <div className="border border-[#111111] overflow-hidden">
                      <div className="bg-[#F5F5F5] px-4 py-2 border-b border-[#111111]">
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] font-black">
                          Two-Factor Authentication
                        </p>
                      </div>
                      <label className="flex items-center justify-between gap-4 p-4 hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <Shield className="h-5 w-5 text-[#111111] flex-shrink-0" strokeWidth={1.5} />
                          <div className="min-w-0">
                            <p className="font-black text-xs uppercase tracking-widest text-[#111111] np-mono">
                              {securityStatus.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                            </p>
                            <p className="text-xs text-[#737373] np-mono mt-0.5 truncate">
                              Adds an extra layer of security
                            </p>
                          </div>
                        </div>

                        {/* Sharp-cornered newsprint toggle switch */}
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={securityStatus.twoFactorEnabled}
                            onChange={() => setSecurityStatus(prev => ({
                              ...prev,
                              twoFactorEnabled: !prev.twoFactorEnabled
                            }))}
                          />
                          <div
                            className={`w-12 h-6 border-2 border-[#111111] flex items-center transition-colors duration-200 cursor-pointer ${
                              securityStatus.twoFactorEnabled ? 'bg-[#111111]' : 'bg-[#F9F9F7]'
                            }`}
                            onClick={() => setSecurityStatus(prev => ({
                              ...prev,
                              twoFactorEnabled: !prev.twoFactorEnabled
                            }))}
                            role="presentation"
                          >
                            <div className={`w-4 h-4 border transition-all duration-200 mx-0.5 ${
                              securityStatus.twoFactorEnabled
                                ? 'translate-x-6 bg-[#F9F9F7] border-[#F9F9F7]'
                                : 'translate-x-0 bg-[#111111] border-[#111111]'
                            }`} />
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section divider ── */}
            <SectionRule label="Backup & Recovery" />

            {/* ══ 3. Backup & Recovery ════════════════════════════════════ */}
            <div className="border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<Download className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Backup & Recovery"
              />
              <div className="p-6 space-y-5">

                {/* Backup status — masthead strip + 4-col stat grid */}
                <div className="border border-[#111111] overflow-hidden">
                  <div className="bg-[#111111] px-4 py-2.5 np-texture flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-[#A3A3A3]" strokeWidth={1.5} />
                    <p className="text-xs np-mono uppercase tracking-widest text-[#A3A3A3]">
                      Backup Status — Data Is Securely Backed Up
                    </p>
                  </div>
                  {/* Collapsed 4-col stat grid — same pattern as type selector */}
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#111111]">
                    {[
                      { label: 'Last Backup',    value: backupStatus.lastBackup.toLocaleString() },
                      { label: 'Next Scheduled', value: backupStatus.nextScheduled.toLocaleString() },
                      { label: 'Backup Size',    value: backupStatus.backupSize },
                      { label: 'Location',       value: backupStatus.location },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 bg-[#F9F9F7]">
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-1">{label}</p>
                        <p className="text-sm font-black text-[#111111] np-mono leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons — split bottom bar (mirrors TerminalQrScanner action bar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#111111] overflow-hidden">
                  <button className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] border-r border-[#111111] transition-all duration-200 font-black text-xs uppercase tracking-widest np-mono min-h-[48px] np-focus">
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                    Backup Now
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black text-xs uppercase tracking-widest np-mono min-h-[48px] np-focus">
                    <CloudOff className="h-4 w-4" strokeWidth={1.5} />
                    Export Offline Backup
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section divider ── */}
            <SectionRule label="Recovery Key" />

            {/* ══ 4. Recovery Key ════════════════════════════════════════ */}
            <div className="border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<KeyRound className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Recovery Key"
              />
              <div className="p-6 space-y-4">

                {/* Warning notice — editorial red left-border, matches validation errors in QrScan */}
                <div className="border-l-4 border-[#CC0000] bg-[#F9F9F7] p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs font-black np-mono uppercase tracking-widest text-[#CC0000] mb-1">
                      Important Security Notice
                    </p>
                    <p className="text-sm text-[#525252] np-body leading-relaxed">
                      Store this key safely. You'll need it to recover your data if you lose access to your account.
                    </p>
                  </div>
                </div>

                {/* Recovery key display area */}
                <div className="border border-[#111111] bg-[#F5F5F5]">
                  <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Key value */}
                    <div className="flex-1">
                      <code className="block w-full bg-[#F9F9F7] border border-[#111111] px-4 py-3 np-mono text-[#111111] text-center tracking-[0.25em] text-lg font-black select-all">
                        {showRecoveryKey ? recoveryKey : '••••-••••-••••-••••'}
                      </code>
                    </div>
                    {/* Toggle visibility button */}
                    <button
                      onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                      aria-label={showRecoveryKey ? 'Hide Recovery Key' : 'Show Recovery Key'}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F9F9F7] border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black text-xs uppercase tracking-widest np-mono min-h-[44px] flex-shrink-0 np-focus"
                    >
                      {showRecoveryKey
                        ? <><EyeOff className="h-4 w-4" strokeWidth={1.5} />HIDE KEY</>
                        : <><Eye className="h-4 w-4" strokeWidth={1.5} />SHOW KEY</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section divider ── */}
            <SectionRule label="Recommendations" />

            {/* ══ 5. Security Recommendations ════════════════════════════ */}
            <div className="border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<AlertTriangle className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Security Recommendations"
              />

              {/* Divided editorial list — consistent with TerminalQrScanner's how-to list */}
              <ul className="divide-y divide-[#E5E5E0]">

                {/* Recommendation 1: Backups OK */}
                <li className="flex items-start gap-4 p-5 hover:bg-[#F5F5F5] transition-colors">
                  <div className="border border-[#111111] p-2 flex-shrink-0 bg-[#F9F9F7] mt-0.5">
                    <FileCheck className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">
                        Regular backups are enabled and up to date
                      </p>
                      <span className="bg-[#111111] text-[#F9F9F7] px-2 py-0.5 text-xs np-mono uppercase tracking-widest font-black flex-shrink-0">
                        OK
                      </span>
                    </div>
                    <p className="text-sm text-[#525252] np-body leading-relaxed">
                      Last backup was completed successfully
                    </p>
                  </div>
                </li>

                {/* Recommendation 2: Biometrics tip */}
                <li className="flex items-start gap-4 p-5 hover:bg-[#F5F5F5] transition-colors">
                  <div className="border border-[#111111] p-2 flex-shrink-0 bg-[#F9F9F7] mt-0.5">
                    <Settings className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">
                        Consider enabling biometric authentication
                      </p>
                      <span className="border border-[#CC0000] text-[#CC0000] px-2 py-0.5 text-xs np-mono uppercase tracking-widest font-black flex-shrink-0">
                        TIP
                      </span>
                    </div>
                    <p className="text-sm text-[#525252] np-body leading-relaxed">
                      Add an extra layer of security to your account
                    </p>
                    <button className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono min-h-[36px] np-focus">
                      ENABLE NOW
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            {/* ── Section divider ── */}
            <SectionRule label="Audit Log" />

            {/* ══ 6. Security Audit Log ══════════════════════════════════ */}
            <div className="border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<History className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Security Audit Log"
                action={
                  <button
                    onClick={handleToggleAuditLog}
                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[36px] np-focus ${
                      showAuditLog
                        ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                        : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                    }`}
                  >
                    {showAuditLog ? 'HIDE LOG' : 'SHOW LOG'}
                  </button>
                }
              />

              {/* Accordion panel — grid-rows technique matches design system spec */}
              <div className={`grid transition-all duration-300 ease-in-out ${
                showAuditLog ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}>
                <div className="overflow-hidden">
                  {auditLog.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-12 border-t border-[#E5E5E0]">
                      <div className="border-2 border-[#E5E5E0] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <History className="h-8 w-8 text-[#A3A3A3]" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs np-mono uppercase tracking-widest text-[#A3A3A3]">
                        No audit log entries found
                      </p>
                    </div>
                  ) : (
                    /* Entry list */
                    <div className="max-h-72 overflow-y-auto np-scroll divide-y divide-[#E5E5E0] border-t border-[#111111]">
                      {auditLog.map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-start gap-4 p-4 hover:bg-[#F5F5F5] transition-colors ${
                            log.status === 'failed'
                              ? 'border-l-4 border-[#CC0000]'
                              : 'border-l-4 border-[#111111]'
                          }`}
                        >
                          {/* Status icon */}
                          <div className={`border p-1.5 flex-shrink-0 mt-0.5 ${
                            log.status === 'success'
                              ? 'border-[#111111] bg-[#F9F9F7]'
                              : 'border-[#CC0000] bg-[#F9F9F7]'
                          }`}>
                            {log.status === 'success'
                              ? <CheckCircle2 className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
                              : <AlertTriangle className="h-4 w-4 text-[#CC0000]" strokeWidth={1.5} />
                            }
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111] leading-snug">
                                {log.action}
                              </p>
                              <span className={`text-xs px-2 py-0.5 np-mono uppercase tracking-widest font-black flex-shrink-0 ${
                                log.status === 'success'
                                  ? 'bg-[#111111] text-[#F9F9F7]'
                                  : 'bg-[#CC0000] text-[#F9F9F7]'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                              <span className="text-xs text-[#737373] np-mono">{log.timestamp.toLocaleString()}</span>
                              <span className="text-xs text-[#737373] np-mono">{log.ipAddress} · {log.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ── End of authenticated content ── */}

          </div>
        )}
      </FeatureTemplate>
      <Footer />
      <ScrollButton />
    </>
  );
};

export default SecureStorage;