import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Smartphone, Laptop, Computer, AlertCircle, Check, Settings,
  Clock, Database, Lock, LogIn, ArrowLeft, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import syncService from '../../services/syncService';
import deviceService from '../../services/deviceService';

// ─── Interfaces ───────────────────────────────────────────────────────────────
// Unchanged from original
// ─────────────────────────────────────────────────────────────────────────────

interface SyncDevice {
  id: string;
  name: string;
  type: 'mobile' | 'laptop' | 'desktop';
  lastSynced: Date;
  status: 'synced' | 'syncing' | 'error';
}

interface SyncStats {
  totalSyncs: number;
  lastWeekSyncs: number;
  dataTransferred: string;
  syncSuccess: number;
}

interface SyncHistory {
  id: string;
  timestamp: Date;
  status: 'success' | 'failed';
  details: string;
}

// ─── Newsprint Design System ──────────────────────────────────────────────────
// Font imports + utility classes that enforce the print-press aesthetic
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
  `}</style>
);

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper with newspaper masthead: edition bar, bordered container,
// ornamental divider footer. Matches the QrScan FeatureTemplate exactly.
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
              {edition ?? 'FEATURE EDITION'}
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
                  strokeWidth: 1.5,
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

// ─── AuthPrompt ───────────────────────────────────────────────────────────────
// Newsprint-style sign-in gate — replaces the original indigo-gradient version.
// Visual pattern matches QrScan's auth lock state exactly.
// ─────────────────────────────────────────────────────────────────────────────
const AuthPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F9F9F7] border border-[#111111] p-10 text-center">
      {/* Lock icon — bordered box */}
      <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
        <Lock className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
      </div>

      {/* Badge */}
      <div className="inline-block border border-[#111111] px-3 py-0.5 np-mono text-xs uppercase tracking-widest text-[#111111] mb-4">
        AUTH REQUIRED
      </div>

      <h3 className="text-2xl font-black text-[#111111] np-serif mb-3">
        Sign In Required
      </h3>
      <p className="text-[#525252] mb-7 np-body text-sm leading-relaxed max-w-sm mx-auto">
        Please sign in to manage your device sync settings
      </p>

      <button
        onClick={() => navigate('/signin')}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        SIGN IN NOW
      </button>
    </div>
  );
};

// ─── Ornamental Section Divider ───────────────────────────────────────────────
// Thin ruled line with centred label — separates major content blocks.
// ─────────────────────────────────────────────────────────────────────────────
const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-[#111111]" />
    <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">{label}</span>
    <div className="flex-1 h-px bg-[#111111]" />
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
// Reusable grey header bar used at the top of every card/panel.
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  aside?: React.ReactNode;
}> = ({ icon, title, aside }) => (
  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between">
    <h3 className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {aside}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sync — Main Component
// All state, effects, and service calls are 100% unchanged from original.
// Only the render / JSX layer has been updated to match the Newsprint system.
// ─────────────────────────────────────────────────────────────────────────────
const Sync = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoading, setDataLoading]         = useState(true);
  const [isSyncing, setIsSyncing]             = useState(false);
  const [lastSync, setLastSync]               = useState<Date | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [devices, setDevices]                 = useState<SyncDevice[]>([]);
  const [showSettings, setShowSettings]       = useState(false);
  const [syncStats, setSyncStats]             = useState<SyncStats>({
    totalSyncs: 0,
    lastWeekSyncs: 0,
    dataTransferred: '0 B',
    syncSuccess: 0,
  });
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);

  // ── Unchanged helper ──────────────────────────────────────────────────────
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':  return <Smartphone className="h-5 w-5" strokeWidth={1.5} />;
      case 'laptop':  return <Laptop     className="h-5 w-5" strokeWidth={1.5} />;
      case 'desktop': return <Computer   className="h-5 w-5" strokeWidth={1.5} />;
      default:        return null;
    }
  };

  // ── Unchanged handleManualSync ────────────────────────────────────────────
  const handleManualSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // Get all devices and trigger sync for each
      const devicesResponse = await deviceService.getDevices();

      if (devicesResponse.devices.length === 0) {
        setError('No devices found to sync');
        setIsSyncing(false);
        return;
      }

      // Use the first device or current device for sync
      const primaryDevice =
        devicesResponse.devices.find((d: any) => d.isPrimary) ||
        devicesResponse.devices[0];

      // Initiate sync
      const syncResponse = await syncService.initiateSync({
        deviceId: primaryDevice._id,
        syncType: 'manual',
        dataTypes: ['passwords', 'documents', 'settings', 'notes', 'qrcodes'],
      });

      // Update devices to syncing status
      setDevices(prev => prev.map(device => ({ ...device, status: 'syncing' })));

      // Poll for sync completion
      const syncLogId = syncResponse.syncLog.id;
      let pollCount = 0;
      const maxPolls = 30; // Max 30 seconds

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await syncService.getSyncStatus(syncLogId);

          if (statusResponse.syncStatus === 'completed') {
            clearInterval(pollInterval);
            setLastSync(new Date(statusResponse.completedAt!));

            // Send notification
            await syncService.notifySyncCompleted(statusResponse);

            // Update all devices to synced
            setDevices(prev =>
              prev.map(device => ({ ...device, status: 'synced', lastSynced: new Date() }))
            );

            // Refresh sync stats
            const stats = await syncService.getSyncStats();
            const successRate =
              stats.totalSyncs > 0
                ? Math.round((stats.completedSyncs / stats.totalSyncs) * 100)
                : 0;

            setSyncStats(prev => ({
              ...prev,
              totalSyncs: stats.totalSyncs,
              dataTransferred: syncService.formatDataSize(stats.totalDataSynced || 0),
              syncSuccess: successRate,
            }));

            // Refresh sync history
            const recentSyncs = await syncService.getRecentSyncs(5);
            const mappedHistory: SyncHistory[] = recentSyncs.map((sync: any) => ({
              id: sync._id,
              timestamp: new Date(sync.completedAt || sync.startedAt),
              status: sync.syncStatus === 'completed' ? 'success' : 'failed',
              details:
                sync.syncStatus === 'completed'
                  ? `Synced ${sync.totalItems || 0} items (${syncService.formatDataSize(sync.dataSynced || 0)})`
                  : sync.error?.message || 'Sync failed',
            }));
            setSyncHistory(mappedHistory);

            setIsSyncing(false);
          } else if (statusResponse.syncStatus === 'failed') {
            clearInterval(pollInterval);
            const errorMsg =
              statusResponse.error?.message || 'Sync failed. Please try again.';
            setError(errorMsg);

            // Send failure notification
            await syncService.notifySyncFailed(errorMsg);

            setDevices(prev => prev.map(device => ({ ...device, status: 'error' })));
            setIsSyncing(false);
          }

          pollCount++;
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setError('Sync timed out. Please try again.');
            setIsSyncing(false);
          }
        } catch (pollErr) {
          console.error('Error polling sync status:', pollErr);
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to initiate sync:', err);
      setError(err.response?.data?.message || 'Sync failed. Please try again.');
      setIsSyncing(false);

      // Revert devices to previous status
      setDevices(prev => prev.map(device => ({ ...device, status: 'synced' })));
    }
  };

  // ── Unchanged useEffect ───────────────────────────────────────────────────
  useEffect(() => {
    const checkAuthAndLoadDevices = async () => {
      // Check auth status
      const token = localStorage.getItem('accessToken');
      const authStatus = !!token;
      setIsAuthenticated(authStatus);

      if (authStatus) {
        try {
          setDataLoading(true);

          // Fetch devices from API
          const devicesResponse = await deviceService.getDevices();

          // Map devices to sync format
          const mappedDevices: SyncDevice[] = devicesResponse.devices.map((device: any) => ({
            id: device._id,
            name: device.deviceName,
            type:
              device.deviceType === 'smartphone'
                ? 'mobile'
                : device.deviceType === 'desktop' || device.deviceType === 'laptop'
                  ? device.deviceType
                  : 'desktop',
            lastSynced: device.lastSyncedAt ? new Date(device.lastSyncedAt) : new Date(),
            status:
              device.status === 'syncing'
                ? 'syncing'
                : device.lastSyncedAt
                  ? 'synced'
                  : 'error',
          }));

          setDevices(mappedDevices);

          // Fetch sync statistics
          const stats = await syncService.getSyncStats();

          // Calculate success rate
          const successRate =
            stats.totalSyncs > 0
              ? Math.round((stats.completedSyncs / stats.totalSyncs) * 100)
              : 0;

          // Get recent syncs for last week calculation
          const now = new Date();
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const lastWeekSyncs =
            stats.recentSyncs?.filter(
              (sync: any) => new Date(sync.startedAt) >= lastWeek
            ).length || 0;

          setSyncStats({
            totalSyncs: stats.totalSyncs,
            lastWeekSyncs: lastWeekSyncs,
            dataTransferred: syncService.formatDataSize(stats.totalDataSynced || 0),
            syncSuccess: successRate,
          });

          // Set last sync time from most recent sync
          if (stats.recentSyncs && stats.recentSyncs.length > 0) {
            const mostRecent = stats.recentSyncs[0];
            setLastSync(new Date(mostRecent.completedAt || mostRecent.startedAt));
          }

          // Fetch recent sync history
          const recentSyncs = await syncService.getRecentSyncs(5);
          const mappedHistory: SyncHistory[] = recentSyncs.map((sync: any) => ({
            id: sync._id,
            timestamp: new Date(sync.completedAt || sync.startedAt),
            status: sync.syncStatus === 'completed' ? 'success' : 'failed',
            details:
              sync.syncStatus === 'completed'
                ? `Synced ${sync.totalItems || 0} items (${syncService.formatDataSize(sync.dataSynced || 0)})`
                : sync.error?.message || 'Sync failed',
          }));
          setSyncHistory(mappedHistory);

          setDataLoading(false);
        } catch (err: any) {
          console.error('Failed to load sync data:', err);
          setError(err.response?.data?.message || 'Failed to load sync data');
          setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    };

    checkAuthAndLoadDevices();
  }, []);

  // ── Device status → Newsprint token mapping ───────────────────────────────
  const deviceStatusStyle = {
    synced:  { label: 'SYNCED',  bg: 'bg-[#111111]', text: 'text-[#F9F9F7]', border: 'border-[#111111]' },
    syncing: { label: 'SYNCING', bg: 'bg-[#404040]', text: 'text-[#F9F9F7]', border: 'border-[#404040]' },
    error:   { label: 'ERROR',   bg: 'bg-[#CC0000]', text: 'text-[#F9F9F7]', border: 'border-[#CC0000]' },
  } as const;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="Auto-Sync"
        description="Changes sync automatically across all your devices. Experience seamless synchronisation with real-time updates."
        icon={<RefreshCw />}
        edition="SYNC EDITION"
      >
        {/* ── Unauthenticated gate ── */}
        {!isAuthenticated ? (
          <AuthPrompt />

        ) : /* ── Loading state ── */ dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="border-2 border-[#111111] p-5 w-20 h-20 flex items-center justify-center mb-6">
              <RefreshCw
                className="h-10 w-10 text-[#111111] animate-spin"
                strokeWidth={1.5}
              />
            </div>
            <p className="np-mono text-xs uppercase tracking-[0.2em] text-[#737373]">
              LOADING SYNC DATA...
            </p>
          </div>

        ) : (
          /* ── Authenticated + loaded content ── */
          <div className="space-y-6">

            {/* ── Error banner ── */}
            {error && (
              <div className="border border-[#CC0000] border-l-4 bg-[#F9F9F7] p-4 flex items-start gap-3">
                <AlertCircle
                  className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <span className="np-mono text-xs uppercase tracking-wider text-[#CC0000] font-black flex-1">
                  {error}
                </span>
                <button
                  onClick={() => setError(null)}
                  className="text-[#A3A3A3] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus"
                  aria-label="Dismiss error"
                >
                  <XCircle className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SYNC STATUS — inverted editorial headline block
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#111111] np-texture overflow-hidden">
              {/* Sub-masthead */}
              <div className="px-5 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">
                  LIVE STATUS
                </span>
                {lastSync && (
                  <span className="np-mono text-xs text-[#737373]">
                    LAST SYNCED · {lastSync.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Icon + headline */}
                <div className="flex items-center gap-6">
                  <div className="border-2 border-[#F9F9F7]/20 p-4 flex items-center justify-center flex-shrink-0">
                    <RefreshCw
                      className={`h-10 w-10 text-[#F9F9F7] ${isSyncing ? 'animate-spin' : ''}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-[#F9F9F7] np-serif leading-tight">
                      Sync Status
                    </h3>
                    <p className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3] mt-1.5">
                      {isSyncing
                        ? 'SYNCHRONISING DATA ACROSS DEVICES...'
                        : 'ALL DEVICES UP TO DATE'}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`flex items-center justify-center gap-2 px-6 py-3 font-black uppercase text-xs tracking-widest np-mono transition-all duration-200 min-h-[44px] flex-shrink-0 np-focus
                    ${isSyncing
                      ? 'bg-[#2a2a2a] text-[#737373] border border-[#3a3a3a] cursor-not-allowed'
                      : 'bg-[#F9F9F7] text-[#111111] border border-transparent hover:bg-transparent hover:text-[#F9F9F7] hover:border-[#F9F9F7]'
                    }`}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                    strokeWidth={1.5}
                  />
                  {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
                </button>
              </div>
            </div>

            {/* ── Ornamental divider ── */}
            <SectionDivider label="Statistics & Settings" />

            {/* ══════════════════════════════════════════════════════════════
                STATS + SETTINGS — collapsed 2-column grid
            ══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-[#111111] overflow-hidden">

              {/* ── Sync Statistics ── */}
              <div className="border-b md:border-b-0 md:border-r border-[#111111]">
                <SectionHeader
                  icon={<Database className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                  title="Sync Statistics"
                />

                {/* 2×2 collapsed stat cells */}
                <div className="grid grid-cols-2">
                  {([
                    { label: 'TOTAL SYNCS',      value: String(syncStats.totalSyncs),      highlight: false },
                    { label: 'LAST 7 DAYS',       value: String(syncStats.lastWeekSyncs),   highlight: false },
                    { label: 'DATA TRANSFERRED',  value: syncStats.dataTransferred,         highlight: false },
                    { label: 'SUCCESS RATE',      value: `${syncStats.syncSuccess}%`,       highlight: true  },
                  ] as const).map((stat, i) => (
                    <div
                      key={i}
                      className={`p-5 border-[#111111]
                        ${i % 2 === 0 ? 'border-r' : ''}
                        ${i < 2 ? 'border-b' : ''}
                      `}
                    >
                      <p className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-2">
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-black np-serif ${
                        stat.highlight ? 'text-[#CC0000]' : 'text-[#111111]'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sync Settings ── */}
              <div>
                <SectionHeader
                  icon={<Settings className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                  title="Sync Settings"
                  aside={
                    <button
                      className="np-mono text-xs uppercase tracking-widest text-[#111111] border border-[#111111] px-3 py-1 hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 np-focus"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      CONFIGURE
                    </button>
                  }
                />

                <div>
                  {([
                    { label: 'Auto-Sync Enabled' },
                    { label: 'Sync on Wi-Fi Only' },
                    { label: 'Background Sync'    },
                  ]).map((setting, i) => (
                    <label
                      key={i}
                      className={`flex items-center justify-between px-5 py-4 hover:bg-[#F5F5F5] transition-colors duration-200 cursor-pointer
                        ${i < 2 ? 'border-b border-[#E5E5E0]' : ''}
                      `}
                    >
                      {/* Hidden checkbox preserves original functionality */}
                      <input type="checkbox" className="sr-only" defaultChecked />

                      <span className="np-mono text-xs uppercase tracking-widest text-[#111111]">
                        {setting.label.toUpperCase()}
                      </span>

                      {/* Newsprint-style rectangular ON / OFF toggle */}
                      <div className="border-2 border-[#111111] flex flex-shrink-0 overflow-hidden">
                        <div className="px-3 py-1 bg-[#111111] text-[#F9F9F7] np-mono text-xs font-black">
                          ON
                        </div>
                        <div className="px-3 py-1 bg-transparent text-[#A3A3A3] np-mono text-xs font-black border-l border-[#111111]">
                          OFF
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Ornamental divider ── */}
            <SectionDivider label="Connected Devices" />

            {/* ══════════════════════════════════════════════════════════════
                CONNECTED DEVICES — collapsed 3-column grid
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<Smartphone className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Connected Devices"
                aside={
                  devices.length > 0 ? (
                    <span className="np-mono text-xs uppercase tracking-widest text-[#737373]">
                      {devices.length} DEVICE{devices.length !== 1 ? 'S' : ''}
                    </span>
                  ) : undefined
                }
              />

              {devices.length === 0 ? (
                /* Empty state */
                <div className="p-14 text-center">
                  <div className="border-2 border-[#E5E5E0] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-[#A3A3A3]" strokeWidth={1} />
                  </div>
                  <p className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-2">
                    NO DEVICES CONNECTED
                  </p>
                  <p className="np-body text-sm text-[#A3A3A3]">
                    Your registered devices will appear here
                  </p>
                </div>
              ) : (
                /* Device grid — collapsed borders */
                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(devices.length, 3)}`}>
                  {devices.map((device, idx) => {
                    const s = deviceStatusStyle[device.status];

                    return (
                      <div
                        key={device.id}
                        className={`p-5 np-hard-hover border-[#111111]
                          ${idx < devices.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''}
                        `}
                      >
                        {/* Top row: icon + status badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="border border-[#111111] p-2 flex items-center justify-center text-[#111111]">
                            {getDeviceIcon(device.type)}
                          </div>
                          <span className={`${s.bg} ${s.text} px-2.5 py-0.5 np-mono text-xs font-black uppercase tracking-widest`}>
                            {s.label}
                          </span>
                        </div>

                        {/* Device name */}
                        <h4 className="font-black text-[#111111] text-sm np-mono uppercase tracking-wide mb-2 leading-snug">
                          {device.name}
                        </h4>

                        {/* Last synced timestamp */}
                        <div className="flex items-center gap-1.5 text-[#737373] mb-2">
                          <Clock className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                          <span className="np-mono text-xs">
                            {device.lastSynced.toLocaleString()}
                          </span>
                        </div>

                        {/* Status sub-label */}
                        {device.status === 'synced' && (
                          <div className="flex items-center gap-1.5 text-[#111111]">
                            <Check className="h-3 w-3" strokeWidth={2} />
                            <span className="np-mono text-xs uppercase tracking-widest">
                              ALL DATA SYNCHRONIZED
                            </span>
                          </div>
                        )}
                        {device.status === 'syncing' && (
                          <div className="flex items-center gap-1.5 text-[#404040]">
                            <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                            <span className="np-mono text-xs uppercase tracking-widest">
                              SYNC IN PROGRESS
                            </span>
                          </div>
                        )}
                        {device.status === 'error' && (
                          <div className="flex items-center gap-1.5 text-[#CC0000]">
                            <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
                            <span className="np-mono text-xs uppercase tracking-widest">
                              SYNC ERROR
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Ornamental divider ── */}
            <SectionDivider label="Sync Activity" />

            {/* ══════════════════════════════════════════════════════════════
                SYNC HISTORY — flat editorial activity list
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<Clock className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Recent Sync Activity"
              />

              {syncHistory.length === 0 ? (
                /* Empty state */
                <div className="p-14 text-center">
                  <div className="border-2 border-[#E5E5E0] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-[#A3A3A3]" strokeWidth={1} />
                  </div>
                  <p className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-2">
                    NO SYNC ACTIVITY YET
                  </p>
                  <p className="np-body text-sm text-[#A3A3A3]">
                    Sync history will appear here after your first sync
                  </p>
                </div>
              ) : (
                /* Activity rows */
                <div>
                  {syncHistory.map((activity, idx) => (
                    <div
                      key={activity.id}
                      className={`p-4 hover:bg-[#F5F5F5] transition-colors duration-200
                        ${idx < syncHistory.length - 1 ? 'border-b border-[#E5E5E0]' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between gap-4">

                        {/* Icon + detail */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`border p-2 flex items-center justify-center flex-shrink-0 ${
                              activity.status === 'success'
                                ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                                : 'border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]'
                            }`}
                          >
                            {activity.status === 'success'
                              ? <Check        className="h-4 w-4" strokeWidth={2}   />
                              : <AlertCircle  className="h-4 w-4" strokeWidth={1.5} />
                            }
                          </div>
                          <div>
                            <div className="np-mono text-xs uppercase tracking-wider text-[#111111] font-black leading-snug">
                              {activity.details}
                            </div>
                            <div className="np-mono text-xs text-[#737373] mt-0.5">
                              {activity.timestamp.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`flex-shrink-0 px-3 py-1 np-mono text-xs font-black uppercase tracking-widest border ${
                            activity.status === 'success'
                              ? 'bg-transparent text-[#111111] border-[#111111]'
                              : 'bg-[#CC0000]  text-[#F9F9F7]  border-[#CC0000]'
                          }`}
                        >
                          {activity.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </FeatureTemplate>
      <Footer />
      <ScrollButton />
    </>
  );
};

export default Sync;