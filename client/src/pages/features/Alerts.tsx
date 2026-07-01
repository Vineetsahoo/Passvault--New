import React, { useState, useEffect } from 'react';
import {
  Clock, Bell, BellOff, Calendar, Settings, AlertTriangle, History,
  Clock4, Lock, LogIn, ArrowLeft, CreditCard, Ticket, RefreshCw, Trash2, CheckCircle, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import alertService, { Alert as AlertType } from '../../services/alertService';
import { supabase } from '../../services/supabaseClient';
import qrcodeService from '../../services/qrcodeService';

// ─── Newsprint Design System ──────────────────────────────────────────────────
// Font imports + utility classes that enforce the print-press aesthetic.
// Mirrors the system in QrScan.tsx so both pages feel like the same publication.
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
    .np-texture { position: relative; }
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

    /* Select — bottom-border only */
    .np-select {
      border: none;
      border-bottom: 2px solid #111111;
      background: transparent;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      outline: none;
      width: 100%;
      appearance: none;
      cursor: pointer;
      transition: background 150ms ease-out;
    }
    .np-select:focus { background: #F0F0F0; }

    /* Focus ring for keyboard nav */
    .np-focus:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px #F9F9F7, 0 0 0 4px #111111;
    }

    /* Spinner for loading states */
    @keyframes np-spin { to { transform: rotate(360deg); } }
    .np-spin { animation: np-spin 0.8s linear infinite; }
  `}</style>
);

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper: black masthead with edition label + date, four-sided
// heavy border container, ornamental footer divider. Matches QrScan exactly.
// ─────────────────────────────────────────────────────────────────────────────
interface FeatureTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  edition?: string;
  children: React.ReactNode;
}

const FeatureTemplate: React.FC<FeatureTemplateProps> = ({ title, description, icon, edition, children }) => {
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
              {edition ?? 'ALERTS EDITION'}
            </span>
            <span className="text-[#737373] np-mono text-xs">{today}</span>
          </div>

          {/* ── Page header ── */}
          <div className="p-8 md:p-12 border-b-4 border-[#111111]">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Icon box — gains hard shadow on hover */}
              <div className="border-2 border-[#111111] p-6 flex items-center justify-center w-24 h-24 flex-shrink-0 np-hard-hover cursor-default">
                {React.cloneElement(icon as React.ReactElement, {
                  className: 'h-12 w-12 text-[#111111]',
                  strokeWidth: 1.5
                })}
              </div>

              <div className="space-y-4">
                {/* Section badge — solid red, editorial authority */}
                <div className="inline-block border border-[#CC0000] bg-[#CC0000] px-4 py-1 text-xs font-black uppercase tracking-widest text-[#F9F9F7] np-mono">
                  FEATURE
                </div>
                {/* Headline */}
                <h1 className="text-4xl md:text-5xl font-black leading-[0.92] tracking-tight text-[#111111] np-serif">
                  {title}
                </h1>
                {/* Deck / subhead — left rule denotes secondary hierarchy */}
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

// ─── SectionHeader ────────────────────────────────────────────────────────────
// Inverted black bar with icon, title, optional count badge, optional action.
// Carries the same weight as a newspaper column heading.
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, badge, action }) => (
  <div className="bg-[#111111] px-4 py-3 flex items-center justify-between np-texture">
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[#F9F9F7] flex-shrink-0">{icon}</span>
      <h3 className="font-black text-[#F9F9F7] text-xs uppercase tracking-widest np-mono">
        {title}
      </h3>
      {badge}
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

// ─── AuthPrompt ───────────────────────────────────────────────────────────────
// Shown to unauthenticated users. Sharp borders, primary CTA inverts on hover.
// ─────────────────────────────────────────────────────────────────────────────
const AuthPrompt = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F9F7] border-2 border-[#111111] p-8 text-center np-sans">
      <div className="border-2 border-[#111111] p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Lock className="h-10 w-10 text-[#111111]" strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-black text-[#111111] mb-3 np-serif uppercase">
        Sign In Required
      </h3>
      <p className="text-[#525252] mb-6 np-body">
        Please sign in to manage your alerts
      </p>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const Alerts = () => {
  // ── State (unchanged) ───────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    advanceNotificationDays: 7
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadAlerts();
  }, []);

  // ── Auth + Data Loading (unchanged) ────────────────────────────────────────
  const checkAuthAndLoadAlerts = async () => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const accessToken = localStorage.getItem('accessToken');
    const isAuthenticated = authStatus && accessToken !== null;

    console.log('🔐 Auth check:', {
      isAuthenticated,
      authStatus,
      hasToken: !!accessToken,
      token: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
    });

    setIsAuthenticated(isAuthenticated);

    if (isAuthenticated) {
      console.log('✅ Authenticated - loading alerts');
      await loadAlerts();
    } else {
      console.warn('❌ Not authenticated - clearing alerts');
      setAlerts([]);
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    const token = localStorage.getItem('accessToken');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';

    if (!token || !isAuthFlag) {
      console.error('❌ Cannot load alerts - not authenticated');
      setAlerts([]);
      setError('Please sign in to view alerts');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting to load alerts...');

      try {
        console.log('📅 Checking for expirations...');
        const checkResult = await alertService.checkExpirations();
        console.log('✅ Expiration check result:', checkResult);
      } catch (checkErr: any) {
        console.warn('⚠️ Error checking expirations:', checkErr);
        console.warn('Error details:', checkErr.response?.data);

        if (checkErr.response?.status === 401 || checkErr.response?.status === 403) {
          console.error('🔒 Authentication failed during expiration check');
          // End the real Supabase session — onAuthStateChange in
          // supabaseClient.ts clears localStorage for us.
          supabase.auth.signOut();
          setIsAuthenticated(false);
          setAlerts([]);
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }
      }

      console.log('📥 Fetching alerts...');
      const response = await alertService.getAlerts({
        isResolved: false,
        sortBy: '-severity,-createdAt',
        limit: 100
      });

      console.log('📊 Alerts received:', response);
      console.log('📊 Number of alerts:', response.alerts?.length || 0);
      console.log('📊 Alerts data:', response.alerts);

      setAlerts(response.alerts || []);
    } catch (err: any) {
      console.error('❌ Error loading alerts:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error message:', err.message);

      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('🔒 Authentication failed - clearing session');
        // End the real Supabase session — onAuthStateChange in
        // supabaseClient.ts clears localStorage for us.
        supabase.auth.signOut();
        setIsAuthenticated(false);
        setAlerts([]);
        setError('Session expired. Please sign in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load alerts');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers (unchanged) ───────────────────────────────────────────────────
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await alertService.checkExpirations();
      await loadAlerts();
    } catch (err: any) {
      console.error('Error refreshing alerts:', err);
      setError(err.response?.data?.message || 'Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    } catch (err: any) {
      console.error('Error resolving alert:', err);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
    } catch (err: any) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleViewCard = (alert: AlertType) => {
    navigate('/features/qr-scan');
  };

  // ── Newsprint severity helpers ─────────────────────────────────────────────
  // Severity is expressed via left-border accent + badge treatment, not by
  // flooding entire card backgrounds with color. 99 % of the UI stays black/white.

  /** Hex colour for the 4 px left-border accent stripe on each alert card. */
  const getSeverityAccent = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#CC0000';
      case 'high':     return '#111111';
      case 'medium':   return '#737373';
      case 'low':      return '#A3A3A3';
      default:         return '#A3A3A3';
    }
  };

  /** Tailwind classes for the count/status badge (border + bg + text). */
  const getSeverityBadge = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]';
      case 'high':     return 'bg-[#111111] text-[#F9F9F7] border-[#111111]';
      case 'medium':   return 'bg-transparent text-[#111111] border-[#111111]';
      case 'low':      return 'bg-transparent text-[#737373] border-[#A3A3A3]';
      default:         return 'bg-transparent text-[#737373] border-[#111111]';
    }
  };

  /** Tailwind classes for the icon container box. */
  const getSeverityIconClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-[#CC0000] text-[#F9F9F7]';
      case 'high':     return 'bg-[#111111] text-[#F9F9F7]';
      case 'medium':   return 'bg-[#F5F5F5] text-[#111111] border border-[#111111]';
      case 'low':      return 'bg-[#F5F5F5] text-[#737373] border border-[#A3A3A3]';
      default:         return 'bg-[#F5F5F5] text-[#111111] border border-[#111111]';
    }
  };

  // ── Utility helpers (logic unchanged) ──────────────────────────────────────
  const getAlertIcon = (alertType: string) => {
    if (alertType === 'card_expiry') {
      return <CreditCard className="h-5 w-5" strokeWidth={1.5} />;
    } else if (alertType === 'pass_expiry') {
      return <Ticket className="h-5 w-5" strokeWidth={1.5} />;
    } else {
      return <Clock className="h-5 w-5" strokeWidth={1.5} />;
    }
  };

  const getDaysRemaining = (expiryDate: Date | undefined) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ── Alert categorisation (unchanged) ──────────────────────────────────────
  const cardPassAlerts = alerts.filter(alert =>
    alert.alertType === 'card_expiry' || alert.alertType === 'pass_expiry'
  );

  const expiredAlerts = cardPassAlerts.filter(alert => {
    const days = getDaysRemaining(alert.expiryDate);
    return days !== null && days <= 0;
  });

  const expiringAlerts = cardPassAlerts.filter(alert => {
    const days = getDaysRemaining(alert.expiryDate);
    return days !== null && days > 0;
  });

  const otherAlerts = alerts.filter(alert =>
    alert.alertType !== 'card_expiry' && alert.alertType !== 'pass_expiry'
  );

  // ── Shared refresh button (dark variant for section headers) ───────────────
  const refreshButton = (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-[#F9F9F7] border border-[#F9F9F7]/40 hover:border-[#F9F9F7] hover:bg-[#F9F9F7]/10 transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] np-focus"
    >
      <RefreshCw className={`h-3 w-3 ${refreshing ? 'np-spin' : ''}`} strokeWidth={1.5} />
      REFRESH
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="Expiration Alerts"
        description="Never miss an expiration date with smart notifications for your cards and passes."
        icon={<Clock className="h-8 w-8" />}
      >
        {!isAuthenticated ? (
          <AuthPrompt />
        ) : (
          <div className="space-y-6">

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1 — Notification Preferences
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<Settings className="h-4 w-4" strokeWidth={1.5} />}
                title="Notification Preferences"
              />

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* ── Toggle rows ── */}
                  <div className="space-y-3">

                    {/* Email Notifications */}
                    <div className="border border-[#111111] p-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors duration-200">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        {/* Sharp newsprint checkbox — inverts on check */}
                        <div className={`relative w-5 h-5 border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                          notificationPrefs.emailEnabled ? 'bg-[#111111] border-[#111111]' : 'bg-transparent border-[#111111]'
                        }`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={notificationPrefs.emailEnabled}
                            onChange={e => setNotificationPrefs(prev => ({
                              ...prev,
                              emailEnabled: e.target.checked
                            }))}
                          />
                          {notificationPrefs.emailEnabled && (
                            <Check className="h-3 w-3 text-[#F9F9F7]" strokeWidth={3} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-xs uppercase tracking-widest np-mono text-[#111111] block">
                            Email Notifications
                          </span>
                          <span className="text-xs text-[#737373] np-mono">Receive alerts via email</span>
                        </div>
                      </label>
                      <Bell
                        className={`h-4 w-4 flex-shrink-0 ml-3 transition-colors duration-200 ${
                          notificationPrefs.emailEnabled ? 'text-[#111111]' : 'text-[#A3A3A3]'
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Push Notifications */}
                    <div className="border border-[#111111] p-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors duration-200">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <div className={`relative w-5 h-5 border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                          notificationPrefs.pushEnabled ? 'bg-[#111111] border-[#111111]' : 'bg-transparent border-[#111111]'
                        }`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={notificationPrefs.pushEnabled}
                            onChange={e => setNotificationPrefs(prev => ({
                              ...prev,
                              pushEnabled: e.target.checked
                            }))}
                          />
                          {notificationPrefs.pushEnabled && (
                            <Check className="h-3 w-3 text-[#F9F9F7]" strokeWidth={3} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-xs uppercase tracking-widest np-mono text-[#111111] block">
                            Push Notifications
                          </span>
                          <span className="text-xs text-[#737373] np-mono">Browser &amp; mobile push alerts</span>
                        </div>
                      </label>
                      <Bell
                        className={`h-4 w-4 flex-shrink-0 ml-3 transition-colors duration-200 ${
                          notificationPrefs.pushEnabled ? 'text-[#111111]' : 'text-[#A3A3A3]'
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* ── Notification Timing ── */}
                  <div className="border border-[#111111] p-4">
                    <h4 className="text-xs font-black uppercase tracking-widest np-mono text-[#111111] mb-4 pb-2 border-b border-[#E5E5E0]">
                      Notification Timing
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs np-mono text-[#525252] uppercase tracking-widest whitespace-nowrap">
                        Notify me
                      </span>
                      <div className="relative flex-1 min-w-[100px]">
                        <select
                          value={notificationPrefs.advanceNotificationDays}
                          onChange={e => setNotificationPrefs(prev => ({
                            ...prev,
                            advanceNotificationDays: Number(e.target.value)
                          }))}
                          className="np-select"
                        >
                          {[3, 5, 7, 14, 30].map(days => (
                            <option key={days} value={days}>{days} days</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-xs np-mono text-[#525252] uppercase tracking-widest whitespace-nowrap">
                        before expiration
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E0] flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#A3A3A3]" strokeWidth={1.5} />
                      <span className="text-xs np-mono text-[#737373]">
                        Currently set to {notificationPrefs.advanceNotificationDays} days in advance
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ornamental section divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#111111]" />
              <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expired</span>
              <div className="flex-1 h-px bg-[#111111]" />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2 — Expired Cards & Passes (Always Visible)
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5} />}
                title="Expired Cards &amp; Passes"
                badge={
                  expiredAlerts.length > 0 ? (
                    <span className="ml-2 px-2 py-0.5 bg-[#CC0000] text-[#F9F9F7] text-xs font-black np-mono uppercase tracking-widest">
                      {expiredAlerts.length} EXPIRED
                    </span>
                  ) : undefined
                }
                action={refreshButton}
              />

              <div className="p-6">
                {expiredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {expiredAlerts.map(alert => {
                      const daysRemaining = getDaysRemaining(alert.expiryDate);
                      return (
                        <div
                          key={alert._id}
                          className="border border-[#111111] bg-[#F9F9F7] np-hard-hover"
                          style={{ borderLeft: '4px solid #CC0000' }}
                        >
                          <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                            {/* Left: icon + content */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="p-3 bg-[#CC0000] text-[#F9F9F7] flex-shrink-0">
                                {getAlertIcon(alert.alertType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Title + EXPIRED badge */}
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-black text-base np-serif text-[#111111]">
                                    {alert.title}
                                  </h4>
                                  <span className="px-2 py-0.5 text-xs font-black bg-[#CC0000] text-[#F9F9F7] np-mono uppercase tracking-widest flex-shrink-0">
                                    EXPIRED
                                  </span>
                                </div>

                                <p className="text-[#525252] text-sm np-body mb-3 leading-relaxed">
                                  {alert.message}
                                </p>

                                {/* Editorial metadata strip */}
                                <div className="space-y-1.5">
                                  {alert.metadata?.category && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Category</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black uppercase tracking-widest text-[#111111]">
                                        {alert.metadata.category}
                                      </span>
                                    </div>
                                  )}
                                  {alert.metadata?.expiryFormatted && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Calendar className="h-3 w-3 text-[#A3A3A3] flex-shrink-0" strokeWidth={1.5} />
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expiry</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black text-[#CC0000]">
                                        {alert.metadata.expiryFormatted}
                                      </span>
                                      <span className="np-mono text-xs text-[#737373]">
                                        ({alert.metadata.expiryDateString || (alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : 'N/A')})
                                      </span>
                                    </div>
                                  )}
                                  {!alert.metadata?.expiryFormatted && alert.expiryDate && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Calendar className="h-3 w-3 text-[#A3A3A3] flex-shrink-0" strokeWidth={1.5} />
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expired on</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black text-[#CC0000]">
                                        {new Date(alert.expiryDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: status badge + action buttons */}
                            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
                              <span className="px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] inline-flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                                {daysRemaining !== null && daysRemaining < 0
                                  ? `${Math.abs(daysRemaining)} DAYS AGO`
                                  : 'EXPIRED'}
                              </span>
                              <div className="flex items-center gap-2">
                                {alert.actionUrl && (
                                  <button
                                    onClick={() => handleViewCard(alert)}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest np-mono bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 min-h-[36px] np-focus"
                                  >
                                    VIEW &amp; RENEW
                                  </button>
                                )}
                                <button
                                  onClick={() => handleResolveAlert(alert._id)}
                                  className="p-2 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAlert(alert._id)}
                                  className="p-2 border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                  title="Delete Alert"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty state — dashed border, editorial copy */
                  <div className="border border-dashed border-[#A3A3A3] p-8 text-center">
                    <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest np-mono text-[#111111] mb-1">
                      No Expired Items
                    </p>
                    <p className="text-xs np-mono uppercase tracking-widest text-[#737373]">
                      All your cards and passes are current
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Ornamental section divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#111111]" />
              <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expiring Soon</span>
              <div className="flex-1 h-px bg-[#111111]" />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3 — Cards & Passes Expiring Soon (Always Visible)
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
              <SectionHeader
                icon={<Bell className="h-4 w-4" strokeWidth={1.5} />}
                title="Cards &amp; Passes Expiring Soon"
                badge={
                  expiringAlerts.length > 0 ? (
                    <span className="ml-2 px-2 py-0.5 border border-[#F9F9F7]/40 text-[#F9F9F7] text-xs font-black np-mono uppercase tracking-widest">
                      {expiringAlerts.length}
                    </span>
                  ) : undefined
                }
                action={refreshButton}
              />

              <div className="p-6">
                {expiringAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {expiringAlerts.map(alert => {
                      const daysRemaining = getDaysRemaining(alert.expiryDate);
                      return (
                        <div
                          key={alert._id}
                          className="border border-[#111111] bg-[#F9F9F7] np-hard-hover"
                          style={{ borderLeft: `4px solid ${getSeverityAccent(alert.severity)}` }}
                        >
                          <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                            {/* Left: icon + content */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`p-3 flex-shrink-0 ${getSeverityIconClass(alert.severity)}`}>
                                {getAlertIcon(alert.alertType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-base np-serif text-[#111111] mb-1">
                                  {alert.title}
                                </h4>
                                <p className="text-[#525252] text-sm np-body mb-3 leading-relaxed">
                                  {alert.message}
                                </p>

                                {/* Editorial metadata strip */}
                                <div className="space-y-1.5">
                                  {alert.metadata?.category && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Category</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black uppercase tracking-widest text-[#111111]">
                                        {alert.metadata.category}
                                      </span>
                                    </div>
                                  )}
                                  {alert.metadata?.expiryFormatted && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Calendar className="h-3 w-3 text-[#A3A3A3] flex-shrink-0" strokeWidth={1.5} />
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expiry</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black text-[#111111]">
                                        {alert.metadata.expiryFormatted}
                                      </span>
                                      <span className="np-mono text-xs text-[#737373]">
                                        ({alert.metadata.expiryDateString || (alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : 'N/A')})
                                      </span>
                                    </div>
                                  )}
                                  {!alert.metadata?.expiryFormatted && alert.expiryDate && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Calendar className="h-3 w-3 text-[#A3A3A3] flex-shrink-0" strokeWidth={1.5} />
                                      <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Expires</span>
                                      <span className="h-px w-3 bg-[#A3A3A3] flex-shrink-0" />
                                      <span className="np-mono text-xs font-black text-[#111111]">
                                        {new Date(alert.expiryDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: days-left badge + action buttons */}
                            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
                              {daysRemaining !== null && (
                                <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono border inline-flex items-center gap-1.5 ${getSeverityBadge(alert.severity)}`}>
                                  <Clock4 className="h-3 w-3" strokeWidth={2} />
                                  {daysRemaining} {daysRemaining === 1 ? 'DAY' : 'DAYS'} LEFT
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                {alert.actionUrl && (
                                  <button
                                    onClick={() => handleViewCard(alert)}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest np-mono bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 min-h-[36px] np-focus"
                                  >
                                    VIEW CARD
                                  </button>
                                )}
                                <button
                                  onClick={() => handleResolveAlert(alert._id)}
                                  className="p-2 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAlert(alert._id)}
                                  className="p-2 border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                  title="Delete Alert"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-[#A3A3A3] p-8 text-center">
                    <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest np-mono text-[#111111] mb-1">
                      Nothing Expiring Soon
                    </p>
                    <p className="text-xs np-mono uppercase tracking-widest text-[#737373]">
                      Your cards and passes are valid for a while
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 4 — No Alerts State
                Only shown when there are no card/pass alerts after loading.
            ══════════════════════════════════════════════════════════════ */}
            {cardPassAlerts.length === 0 && !loading && (
              <>
                {/* ── Ornamental section divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#111111]" />
                  <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Status</span>
                  <div className="flex-1 h-px bg-[#111111]" />
                </div>

                <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
                  <SectionHeader
                    icon={<Bell className="h-4 w-4" strokeWidth={1.5} />}
                    title="Card &amp; Pass Expiration Alerts"
                    action={refreshButton}
                  />
                  <div className="p-6">
                    {loading ? (
                      /* Loading state */
                      <div className="py-10 text-center">
                        <div className="border-2 border-[#111111] p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                          <div className="w-5 h-5 border-2 border-[#111111] border-t-transparent np-spin" />
                        </div>
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373]">
                          Loading Alerts...
                        </p>
                      </div>
                    ) : error ? (
                      /* Error state */
                      <div className="border border-[#CC0000] p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest np-mono text-[#CC0000] mb-2">
                            {error}
                          </p>
                          <button
                            onClick={handleRefresh}
                            className="text-xs np-mono uppercase tracking-widest text-[#111111] underline decoration-[#111111] hover:text-[#CC0000] hover:decoration-[#CC0000] transition-colors duration-200"
                          >
                            TRY AGAIN
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Truly empty state */
                      <div className="border border-dashed border-[#A3A3A3] p-10 text-center">
                        <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <BellOff className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest np-mono text-[#111111] mb-1">
                          No Expiration Alerts
                        </p>
                        <p className="text-xs np-mono uppercase tracking-widest text-[#737373] mb-6">
                          Your cards and passes are all up to date
                        </p>
                        <button
                          onClick={handleRefresh}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
                        >
                          <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                          CHECK FOR UPDATES
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 5 — Other Alerts (only shown when present)
            ══════════════════════════════════════════════════════════════ */}
            {otherAlerts.length > 0 && (
              <>
                {/* ── Ornamental section divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#111111]" />
                  <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Other</span>
                  <div className="flex-1 h-px bg-[#111111]" />
                </div>

                <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
                  <SectionHeader
                    icon={<History className="h-4 w-4" strokeWidth={1.5} />}
                    title="Other Alerts"
                    badge={
                      <span className="ml-2 px-2 py-0.5 border border-[#F9F9F7]/40 text-[#F9F9F7] text-xs font-black np-mono uppercase tracking-widest">
                        {otherAlerts.length}
                      </span>
                    }
                  />
                  <div className="p-6">
                    <div className="space-y-3">
                      {otherAlerts.map(alert => (
                        <div
                          key={alert._id}
                          className="border border-[#111111] bg-[#F9F9F7] p-4 flex items-center justify-between gap-4 np-hard-hover"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="border border-[#111111] p-2 flex items-center justify-center w-10 h-10 flex-shrink-0">
                              <Clock className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-black text-xs uppercase tracking-widest np-mono text-[#111111] truncate">
                                {alert.title}
                              </h5>
                              <p className="text-sm text-[#525252] np-body mt-0.5 truncate">
                                {alert.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleResolveAlert(alert._id)}
                              className="p-2 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                              title="Mark as Resolved"
                            >
                              <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert._id)}
                              className="p-2 border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                              title="Delete Alert"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </FeatureTemplate>
      <Footer />
      <ScrollButton />
    </>
  );
};

export default Alerts;