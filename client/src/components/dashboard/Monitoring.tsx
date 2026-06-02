import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash,
  FaGlobe, FaServer, FaDatabase, FaWifi, FaClock, FaChartLine,
  FaBell, FaDownload, FaShare, FaFilter, FaSync, FaPlay, FaPause,
  FaFireAlt, FaUserSecret, FaLock, FaUnlock, FaKey, FaExclamationCircle,
  FaTimesCircle, FaInfoCircle, FaChevronRight, FaChevronDown, FaSearch,
  FaRocket, FaBug, FaFileAlt, FaHistory, FaMapMarkerAlt, FaFingerprint,
  FaRadiation, FaSkull, FaCrosshairs, FaFlag, FaBullseye, FaTimes,
  FaSort, FaPlus, FaCog, FaRegCheckCircle, FaRegCopy, FaDice, FaExpand,
  FaNetworkWired, FaRegDotCircle, FaCircle, FaWaveSquare, FaArrowUp, FaSpinner
} from 'react-icons/fa';
import { FaShieldVirus, FaBinoculars, FaSignal } from 'react-icons/fa6';
import { monitoringAPI } from '../../services/api';
import alertService, { Alert } from '../../services/alertService';

// ─── Interfaces (unchanged) ───────────────────────────────────────────────────

interface RealTimeMetric {
  timestamp: number;
  value: number;
  label: string;
}

interface NetworkActivityData {
  timestamp: number;
  inbound: number;
  outbound: number;
  blocked: number;
}

interface SecurityScore {
  timestamp: number;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

interface BreachAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'data-breach' | 'suspicious-login' | 'password-compromise' | 'dark-web' | 'phishing' | 'malware';
  title: string;
  description: string;
  affectedAccounts: string[];
  source: string;
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  risk_score: number;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  recommendations: string[];
}

interface MonitoringStats {
  total_alerts: number;
  critical_alerts: number;
  monitored_accounts: number;
  dark_web_mentions: number;
  security_score: number;
  last_scan: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  scanned_databases: number;
  active_threats: number;
  resolved_threats: number;
}

interface ThreatIntelligence {
  id: string;
  threat_type: 'botnet' | 'malware' | 'phishing' | 'data_broker' | 'leak';
  description: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  indicators: string[];
  ttps: string[];
}

interface DarkWebMention {
  id: string;
  site: string;
  content_snippet: string;
  credential_type: string;
  confidence: number;
  discovered_at: string;
  hash: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Monitoring: React.FC = () => {

  // ── All state, logic, and handlers are 100% preserved ──────────────────────

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'risk_score'>('timestamp');
  const [showThreatDetails, setShowThreatDetails] = useState<string | null>(null);
  const [showFullScanModal, setShowFullScanModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);

  const [scanResults, setScanResults] = useState<{
    scannedItems: number;
    threatsFound: number;
    vulnerabilities: number;
    status: 'idle' | 'scanning' | 'completed';
  }>({
    scannedItems: 0,
    threatsFound: 0,
    vulnerabilities: 0,
    status: 'idle'
  });

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, securityRes, performanceRes, alertsRes, dbAlertsRes] = await Promise.all([
        monitoringAPI.getDashboard(
          selectedTimeframe === '24h' ? 'today' :
          selectedTimeframe === '7d' ? 'week' :
          selectedTimeframe === '30d' ? 'month' :
          'week'
        ),
        monitoringAPI.getSecurity(),
        monitoringAPI.getPerformance(),
        monitoringAPI.getAlerts({ limit: 20 }),
        alertService.getAlerts({ limit: 50, isResolved: false }).catch(() => ({ alerts: [], pagination: { current: 1, pages: 0, total: 0 } }))
      ]);

      let allAlerts: any[] = [];
      if (dashboardRes.data.success) {
        setDashboardData(dashboardRes.data.data);
      }
      if (securityRes.data.success) {
        setSecurityData(securityRes.data.data);
      }
      if (performanceRes.data.success) {
        setPerformanceData(performanceRes.data.data);
      }
      if (alertsRes.data.success) {
        const formattedAlerts = alertsRes.data.data.alerts.map((alert: any) => ({
          id: alert.id,
          severity: alert.severity,
          type: alert.type,
          title: alert.title,
          description: alert.message,
          affectedAccounts: [],
          source: 'System Alert',
          detectedAt: new Date(alert.timestamp).toLocaleString(),
          status: 'active',
          risk_score: alert.severity === 'critical' ? 90 : alert.severity === 'high' ? 70 : alert.severity === 'medium' ? 50 : 30,
          recommendations: [alert.action || 'Review and take appropriate action']
        }));
        allAlerts = [...allAlerts, ...formattedAlerts];
      }

      if (dbAlertsRes && dbAlertsRes.alerts) {
        const dbFormattedAlerts = dbAlertsRes.alerts.map((alert: Alert) => ({
          id: alert._id,
          severity: alert.severity,
          type: alert.alertType,
          title: alert.title,
          description: alert.message,
          affectedAccounts: alert.relatedTo ? [alert.relatedTo] : [],
          source: 'System Event',
          detectedAt: new Date(alert.createdAt).toLocaleString(),
          status: alert.isResolved ? 'resolved' : 'active',
          risk_score: alert.severity === 'critical' ? 95 : alert.severity === 'high' ? 75 : alert.severity === 'medium' ? 55 : 35,
          recommendations: alert.actionLabel ? [alert.actionLabel] : ['Review and take appropriate action']
        }));
        allAlerts = [...allAlerts, ...dbFormattedAlerts];
      }
      setAlertsData(allAlerts);
    } catch (err: any) {
      console.error('Failed to fetch monitoring data:', err);
      setError(err.response?.data?.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const monitoringStats = useMemo(() => {
    if (!dashboardData) {
      return {
        total_alerts: 0,
        critical_alerts: 0,
        monitored_accounts: 0,
        dark_web_mentions: 0,
        security_score: 0,
        last_scan: 'Never',
        threat_level: 'low' as const,
        scanned_databases: 0,
        active_threats: 0,
        resolved_threats: 0
      };
    }

    return {
      total_alerts: dashboardData.overview?.totalPasswords + dashboardData.overview?.totalDocuments || 0,
      critical_alerts: securityData?.metrics?.compromised || 0,
      monitored_accounts: dashboardData.overview?.totalPasswords || 0,
      dark_web_mentions: 0,
      security_score: dashboardData.security?.score || 0,
      last_scan: 'Just now',
      threat_level: dashboardData.security?.score > 80 ? 'low' : dashboardData.security?.score > 60 ? 'medium' : 'high' as const,
      scanned_databases: 15420,
      active_threats: alertsData.filter((a: any) => a.status === 'active').length,
      resolved_threats: alertsData.filter((a: any) => a.status === 'resolved').length
    };
  }, [dashboardData, securityData, alertsData]);

  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [networkActivity, setNetworkActivity] = useState<NetworkActivityData[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    timestamp: Date.now(),
    score: 92,
    trend: 'up'
  });

  useEffect(() => {
    if (securityData?.securityScore !== undefined) {
      setSecurityScore(prev => ({
        timestamp: Date.now(),
        score: securityData.securityScore,
        trend: securityData.securityScore > prev.score ? 'up' : securityData.securityScore < prev.score ? 'down' : 'stable'
      }));
    }
  }, [securityData]);

  const [liveMetrics, setLiveMetrics] = useState({
    threatsBlocked: 0,
    scanningRate: 0,
    networkTraffic: 0,
    cpuUsage: 0
  });

  const breachAlerts = useMemo(() => {
    return alertsData;
  }, [alertsData]);

  const categories = useMemo(() => {
    const types = Array.from(new Set(alertsData.map((a: any) => a.type)));
    return ['all', ...types];
  }, [alertsData]);

  const handleFullScan = () => {
    setShowFullScanModal(true);
    setIsScanning(true);
    setScanProgress(0);
    setScanResults({
      scannedItems: 0,
      threatsFound: 0,
      vulnerabilities: 0,
      status: 'scanning'
    });

    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(scanInterval);
          setIsScanning(false);
          setScanResults(prev => ({
            ...prev,
            status: 'completed'
          }));
          return 100;
        }
        return newProgress;
      });

      setScanResults(prev => ({
        ...prev,
        scannedItems: prev.scannedItems + Math.floor(Math.random() * 50 + 10),
        threatsFound: prev.threatsFound + (Math.random() < 0.3 ? 1 : 0),
        vulnerabilities: prev.vulnerabilities + (Math.random() < 0.2 ? 1 : 0)
      }));
    }, 500);
  };

  useEffect(() => {
    if (!isRealTimeEnabled) return;
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 60000);
    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const initialMetrics: RealTimeMetric[] = [];
    const initialNetwork: NetworkActivityData[] = [];
    const now = Date.now();

    for (let i = 29; i >= 0; i--) {
      const timestamp = now - (i * 2000);
      initialMetrics.push({ timestamp, value: Math.random() * 100, label: `Metric ${i}` });
      initialNetwork.push({
        timestamp,
        inbound: Math.random() * 50 + 10,
        outbound: Math.random() * 30 + 5,
        blocked: Math.random() * 10
      });
    }

    setRealTimeMetrics(initialMetrics);
    setNetworkActivity(initialNetwork);

    const metricsInterval = setInterval(() => {
      setLiveMetrics(prev => ({
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        scanningRate: 80 + Math.random() * 40,
        networkTraffic: 30 + Math.random() * 70,
        cpuUsage: 20 + Math.random() * 60
      }));

      setRealTimeMetrics(prev => {
        const newMetric = { timestamp: Date.now(), value: Math.random() * 100, label: `Metric ${prev.length}` };
        return [...prev.slice(1), newMetric];
      });

      setNetworkActivity(prev => {
        const newActivity = {
          timestamp: Date.now(),
          inbound: Math.random() * 50 + 10,
          outbound: Math.random() * 30 + 5,
          blocked: Math.random() * 10
        };
        return [...prev.slice(1), newActivity];
      });

      if (Math.random() < 0.1) {
        setSecurityScore(prev => {
          const change = (Math.random() - 0.5) * 4;
          const newScore = Math.max(0, Math.min(100, prev.score + change));
          return {
            timestamp: Date.now(),
            score: newScore,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
          };
        });
      }
    }, 2000);

    return () => clearInterval(metricsInterval);
  }, [isRealTimeEnabled]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return FaRadiation;
      case 'high': return FaFireAlt;
      case 'medium': return FaExclamationTriangle;
      case 'low': return FaInfoCircle;
      default: return FaInfoCircle;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'data-breach': return FaDatabase;
      case 'suspicious-login': return FaUserSecret;
      case 'dark-web': return FaSkull;
      case 'phishing': return FaBug;
      case 'malware': return FaRadiation;
      default: return FaExclamationCircle;
    }
  };

  const filteredAlerts = useMemo(() => {
    return breachAlerts
      .filter(alert => {
        const matchesCategory = selectedCategory === 'all' || alert.type === selectedCategory;
        const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
        const matchesSearch: boolean = searchQuery === '' ||
          alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.affectedAccounts.some((account: string) => account.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSeverity && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'severity') {
          const severityOrder: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        if (sortBy === 'risk_score') {
          return b.risk_score - a.risk_score;
        }
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      });
  }, [breachAlerts, selectedCategory, selectedSeverity, searchQuery, sortBy]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    hover: {
      y: -2,
      x: -2,
      boxShadow: '4px 4px 0px 0px #111111',
      transition: { duration: 0.15 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  // ── Shared style block ─────────────────────────────────────────────────────
  const styleBlock = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
      .np-serif { font-family: 'Playfair Display', serif !important; }
      .np-body  { font-family: 'Lora', serif !important; }
      .np-sans  { font-family: 'Inter', sans-serif !important; }
      .np-mono  { font-family: 'JetBrains Mono', monospace !important; }
      .sharp-corners { border-radius: 0px !important; }
      .np-hover { transition: box-shadow 0.15s ease-out, transform 0.15s ease-out; }
      .np-hover:hover { box-shadow: 4px 4px 0px 0px #111111; transform: translate(-2px, -2px); }
      .hard-shadow { box-shadow: 4px 4px 0px 0px #111111; }
      .newsprint-texture { position: relative; }
      .newsprint-texture::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(0deg, transparent 98%, rgba(0,0,0,0.02) 100%),
          linear-gradient(90deg, transparent 98%, rgba(0,0,0,0.02) 100%);
        background-size: 3px 3px;
        pointer-events: none;
        opacity: 0.5;
      }
    `}</style>
  );

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px] bg-[#F9F9F7]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        {styleBlock}
        <div className="border-4 border-[#111111] bg-[#F9F9F7] p-12 text-center">
          <div className="p-4 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] inline-flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <FaSync className="w-8 h-8" />
            </motion.div>
          </div>
          <p
            className="font-black text-lg uppercase tracking-widest text-[#111111]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            LOADING INTELLIGENCE FEED
          </p>
          <p
            className="text-xs text-[#525252] mt-2 uppercase tracking-widest"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Fetching security telemetry...
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="h-1 w-8 bg-[#CC0000]"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px] bg-[#F9F9F7] p-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        {styleBlock}
        <div className="border-4 border-[#CC0000] bg-[#F9F9F7] p-8 max-w-lg w-full newsprint-texture">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] shrink-0">
              <FaExclamationCircle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3
                className="font-black text-2xl text-[#CC0000] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                SYSTEM ERROR DETECTED
              </h3>
              <p
                className="text-[#111111] mt-2 font-bold"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {error}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => setError(null)}
                  className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  DISMISS
                </button>
                <button
                  onClick={fetchMonitoringData}
                  className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <FaSync /> RETRY OPERATION
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="bg-[#F9F9F7] space-y-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}
    >
      {styleBlock}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── PAGE HEADER                                                   ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">

          {/* Left: Title block */}
          <div>
            <div
              className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              DATA SECURITY &bull; REAL-TIME MONITORING
            </div>
            <h2
              className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              THREAT &amp;<br />
              <span className="italic" style={{ color: "#CC0000" }}>MONITOR</span>
            </h2>
            <p
              className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Real-time breach detection and threat intelligence for your digital identity across every connected system.
            </p>
          </div>

          {/* Right: Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`px-6 py-4 border-2 border-[#111111] font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                !isRealTimeEnabled
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] np-hover'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isRealTimeEnabled
                ? <><FaPause /> PAUSE MONITORING</>
                : <><FaPlay /> RESUME MONITORING</>
              }
            </button>

            <button
              onClick={handleFullScan}
              className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaSync /> RUN FULL SCAN
            </button>
          </div>
        </div>

        {/* ── Header Stats Bar ── */}
        <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-5 gap-0 bg-[#111111]">

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [SECURITY SCORE]
            </div>
            <div
              className="font-black text-[#111111] flex items-center gap-2 text-2xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <FaShieldAlt className="text-lg" />
              {Math.round(securityScore.score)}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [LAST SCAN]
            </div>
            <div
              className="font-bold text-[#111111] text-xs"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {monitoringStats.last_scan}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [THREAT LEVEL]
            </div>
            <div
              className={`font-bold text-sm ${
                monitoringStats.threat_level === 'high' || monitoringStats.threat_level === 'critical'
                  ? 'text-[#CC0000]'
                  : 'text-[#111111]'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {monitoringStats.threat_level.toUpperCase()}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ACTIVE THREATS]
            </div>
            <div
              className="font-bold text-[#111111] text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {monitoringStats.active_threats} DETECTED
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#111111]">
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className="w-full h-full flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest p-4 transition-colors text-[#F9F9F7] hover:bg-[#CC0000]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isRealTimeEnabled
                ? <><FaCircle className="text-[#CC0000] animate-pulse text-[8px]" /> LIVE</>
                : <><FaPause /> PAUSED</>
              }
            </button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── LIVE INTELLIGENCE FEED                                        ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[#111111]">

        {/* Inverted section header */}
        <div className="bg-[#111111] text-[#F9F9F7] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7]">
              <FaShieldVirus className="h-6 w-6" />
            </div>
            <div>
              <h3
                className="text-2xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                LIVE INTELLIGENCE FEED
              </h3>
              <p
                className="text-[#A3A3A3] mt-1"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Telemetry refreshed every 2 seconds.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 border px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest ${
              isRealTimeEnabled ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#404040] text-[#A3A3A3]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <motion.div
              className={`w-2 h-2 ${isRealTimeEnabled ? 'bg-[#CC0000]' : 'bg-[#737373]'}`}
              animate={isRealTimeEnabled ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {isRealTimeEnabled ? 'STREAM ACTIVE' : 'STREAM PAUSED'}
          </div>
        </div>

        {/* Metric grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-4"
        >

          {/* Live Security Score — inverted cell */}
          <div className="lg:col-span-1 bg-[#111111] p-8 text-[#F9F9F7] border-r border-[#404040]">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#404040] pb-4">
              <div
                className="text-[0.65rem] text-[#A3A3A3] font-bold uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [SECURITY SCORE]
              </div>
              <motion.div
                className={`w-2 h-2 ${
                  securityScore.trend === 'up' ? 'bg-green-400' :
                  securityScore.trend === 'down' ? 'bg-[#CC0000]' : 'bg-[#A3A3A3]'
                }`}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span
                className="font-black text-5xl tracking-tighter leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {Math.round(securityScore.score)}
              </span>
              <span
                className="text-[#A3A3A3] mb-1 text-lg"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                /100
              </span>
              <motion.div
                animate={{
                  rotate: securityScore.trend === 'up' ? 0 :
                          securityScore.trend === 'down' ? 180 : 90
                }}
                className={`ml-auto mb-2 ${
                  securityScore.trend === 'up' ? 'text-green-400' :
                  securityScore.trend === 'down' ? 'text-[#CC0000]' : 'text-[#A3A3A3]'
                }`}
              >
                <FaArrowUp size={16} />
              </motion.div>
            </div>
            {/* Score bar */}
            <div className="h-2 border border-[#404040] bg-[#222]">
              <motion.div
                className="h-full bg-[#CC0000]"
                style={{ width: `${securityScore.score}%` }}
                initial={{ width: '0%' }}
                animate={{ width: `${securityScore.score}%` }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </div>
          </div>

          {/* Threats Blocked */}
          <div className="lg:col-span-1 bg-[#F9F9F7] p-8 border-r border-[#111111] hover:bg-[#E5E5E0] transition-colors">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#111111] pb-4">
              <div
                className="text-[0.65rem] text-[#CC0000] font-bold uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [THREATS BLOCKED]
              </div>
              <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                <FaRadiation className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <motion.span
                key={liveMetrics.threatsBlocked}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="font-black text-4xl tracking-tighter text-[#111111]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {liveMetrics.threatsBlocked.toLocaleString()}
              </motion.span>
            </div>
            <div
              className="text-xs font-bold text-[#525252] uppercase tracking-widest border-l-2 border-[#111111] pl-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              TODAY
            </div>
          </div>

          {/* Network Activity Chart — spans 2 cols */}
          <div className="lg:col-span-2 bg-[#F9F9F7] p-8">
            <div className="flex items-center justify-between mb-4 border-b-2 border-[#111111] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                  <FaNetworkWired className="h-4 w-4" />
                </div>
                <div>
                  <div
                    className="text-[0.65rem] text-[#CC0000] font-bold uppercase tracking-widest"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    [NETWORK ACTIVITY]
                  </div>
                </div>
              </div>
              <div
                className="flex items-center gap-4 text-[0.6rem] font-bold uppercase tracking-widest text-[#525252]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-[2px] bg-[#111111]"></div>
                  <span>IN</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-[2px] bg-[#525252]"></div>
                  <span>OUT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-[2px] bg-[#CC0000]"></div>
                  <span>BLOCKED</span>
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative h-28 w-full bg-[#E5E5E0] border-2 border-[#111111] overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                {[25, 50, 75].map(y => (
                  <line
                    key={y}
                    x1="0" y1={y} x2="400" y2={y}
                    stroke="#111111" strokeWidth="0.5" opacity="0.15"
                  />
                ))}
                {networkActivity.length > 1 && (
                  <>
                    <motion.polyline
                      points={networkActivity.map((p, i) =>
                        `${(i / (networkActivity.length - 1)) * 400},${100 - (p.inbound / 60) * 80}`
                      ).join(' ')}
                      fill="none" stroke="#111111" strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                    <motion.polyline
                      points={networkActivity.map((p, i) =>
                        `${(i / (networkActivity.length - 1)) * 400},${100 - (p.outbound / 35) * 80}`
                      ).join(' ')}
                      fill="none" stroke="#525252" strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.15 }}
                    />
                    <motion.polyline
                      points={networkActivity.map((p, i) =>
                        `${(i / (networkActivity.length - 1)) * 400},${100 - (p.blocked / 10) * 80}`
                      ).join(' ')}
                      fill="none" stroke="#CC0000" strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </>
                )}
              </svg>
              {networkActivity.length > 0 && (
                <div className="absolute top-2 right-2 space-y-1">
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaCircle className="text-[#111111] text-[5px]" />
                    <span
                      className="text-[0.6rem] text-[#525252] font-bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {Math.round(networkActivity[networkActivity.length - 1]?.inbound || 0)} MB/s
                    </span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <FaCircle className="text-[#525252] text-[5px]" />
                    <span
                      className="text-[0.6rem] text-[#525252] font-bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {Math.round(networkActivity[networkActivity.length - 1]?.outbound || 0)} MB/s
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── SYSTEM METRICS ROW                                            ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b-4 border-[#111111]"
      >
        {[
          { label: 'Scanning Rate', value: `${Math.round(liveMetrics.scanningRate)}`, unit: 'files/sec', icon: FaBinoculars, index: 0 },
          { label: 'Network Traffic', value: `${Math.round(liveMetrics.networkTraffic)}`, unit: 'MB/s', icon: FaSignal, index: 1 },
          { label: 'CPU Usage', value: `${Math.round(liveMetrics.cpuUsage)}`, unit: '%', icon: FaChartLine, index: 2 },
          { label: 'Active Databases', value: `${monitoringStats.scanned_databases.toLocaleString()}`, unit: 'DBs', icon: FaDatabase, index: 3 }
        ].map((metric) => (
          <motion.div
            key={metric.label}
            className={`bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors np-hover ${
              metric.index < 3 ? 'border-r border-[#111111]' : ''
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: metric.index * 0.05 }}
          >
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#111111] pb-4">
              <h3
                className="text-xl font-black text-[#111111] uppercase tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {metric.label.toUpperCase()}
              </h3>
              <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                <metric.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <motion.span
                key={metric.value}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="font-black text-4xl tracking-tighter text-[#111111]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {metric.value}
              </motion.span>
              <span
                className="text-[0.65rem] border border-[#111111] text-[#111111] px-2 py-0.5 uppercase tracking-widest font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {metric.unit}
              </span>
            </div>

            <div className="pt-3 border-t border-[#111111] flex items-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 bg-[#CC0000]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="text-[0.6rem] text-[#525252] uppercase tracking-widest font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {isRealTimeEnabled ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── ALERT LOG & BREACH INTELLIGENCE                               ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[#111111]">

        {/* Inverted section header */}
        <div className="bg-[#111111] text-[#F9F9F7] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7]">
              <FaShieldAlt className="h-6 w-6" />
            </div>
            <div>
              <h3
                className="text-3xl font-black tracking-tighter uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ALERT LOG
              </h3>
              <p
                className="text-[#A3A3A3] mt-1"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} matching current filters
              </p>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex flex-wrap items-center gap-3">
            {(['24h', '7d', '30d'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-2 border font-black text-xs uppercase tracking-widest transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]'
                    : 'border-[#404040] text-[#A3A3A3] hover:border-[#F9F9F7] hover:text-[#F9F9F7]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-6 bg-[#F9F9F7] border-b-2 border-[#111111]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

            {/* Search input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-[#737373]" />
              </div>
              <input
                type="text"
                placeholder="Search alerts by title, description, or affected accounts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-[#111111] bg-white font-bold text-sm text-[#111111] placeholder-[#737373] focus:outline-none focus:ring-0"
                style={{ fontFamily: "'Inter', sans-serif", borderRadius: 0 }}
              />
            </div>

            <div className="flex items-center gap-3 self-end flex-wrap">

              {/* Sort */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-[#111111] hover:bg-[#E5E5E0] transition-colors cursor-pointer"
              >
                <FaSort className="text-[#525252]" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'timestamp' | 'severity' | 'risk_score')}
                  className="bg-transparent border-none font-black text-xs uppercase tracking-widest focus:ring-0 text-[#111111] cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="timestamp">SORT: TIME</option>
                  <option value="severity">SORT: SEVERITY</option>
                  <option value="risk_score">SORT: RISK</option>
                </select>
              </div>

              {/* Severity filter */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-[#111111] hover:bg-[#E5E5E0] transition-colors cursor-pointer"
              >
                <FaFilter className="text-[#525252]" />
                <select
                  value={selectedSeverity}
                  onChange={e => setSelectedSeverity(e.target.value)}
                  className="bg-transparent border-none font-black text-xs uppercase tracking-widest focus:ring-0 text-[#111111] cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="all">ALL SEVERITIES</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-[#E5E5E0] px-6 py-4 border-b-2 border-[#111111]">
          <div className="flex overflow-x-auto gap-3 pb-1">
            {categories.map(category => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 font-black text-xs uppercase tracking-widest border-2 border-[#111111] ${
                  selectedCategory === category
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: 0 }}
              >
                {(
                  {
                    all: (
                      <FaShieldAlt
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#CC0000]'}
                      />
                    ),
                    'data-breach': (
                      <FaDatabase
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'}
                      />
                    ),
                    'dark-web': (
                      <FaSkull
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'}
                      />
                    ),
                    'suspicious-login': (
                      <FaUserSecret
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'}
                      />
                    ),
                    phishing: (
                      <FaBug
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'}
                      />
                    ),
                    malware: (
                      <FaRadiation
                        className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#CC0000]'}
                      />
                    )
                  } as Record<string, JSX.Element>
                )[category] || (
                  <FaShieldAlt
                    className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#CC0000]'}
                  />
                )}
                {category === 'all' ? 'ALL THREATS' : category.replace('-', ' ').toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── ALERT CARDS                                                   ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 md:p-8">
        {filteredAlerts.length === 0 ? (

          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 border-4 border-dashed border-[#111111]"
          >
            <div className="mx-auto w-20 h-20 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
              <FaCheckCircle className="text-3xl" />
            </div>
            <h3
              className="text-3xl font-black text-[#111111] mb-2 uppercase tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ALL CLEAR
            </h3>
            <p
              className="text-[#525252] max-w-md mx-auto mb-8"
              style={{ fontFamily: "'Lora', serif" }}
            >
              No security alerts match your current filters. Your accounts are being continuously monitored for threats.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSeverity('all');
                  setSearchQuery('');
                }}
                className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                CLEAR ALL FILTERS
              </button>
              <button
                onClick={handleFullScan}
                className="px-8 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaSync /> RUN SECURITY SCAN
              </button>
            </div>
          </motion.div>

        ) : (

          /* Alert card grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredAlerts.map(alert => {
              const SeverityIcon = getSeverityIcon(alert.severity);
              const TypeIcon = getTypeIcon(alert.type);

              return (
                <motion.div
                  key={alert.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="border-2 border-[#111111] bg-white np-hover overflow-hidden"
                  style={{ borderRadius: 0 }}
                >
                  {/* Severity accent bar at top */}
                  <div
                    className={`h-1 w-full ${
                      alert.severity === 'critical' ? 'bg-[#CC0000]' :
                      alert.severity === 'high'     ? 'bg-[#E05C00]' :
                      alert.severity === 'medium'   ? 'bg-[#B38600]' :
                                                      'bg-[#525252]'
                    }`}
                  />

                  {/* Card header */}
                  <div className="p-5 border-b-2 border-[#111111] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 border-2 shrink-0 ${
                          alert.severity === 'critical' ? 'border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]' :
                          alert.severity === 'high'     ? 'border-[#E05C00] bg-[#E05C00] text-[#F9F9F7]' :
                          alert.severity === 'medium'   ? 'border-[#B38600] text-[#B38600]' :
                                                          'border-[#525252] text-[#525252]'
                        }`}
                      >
                        <SeverityIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3
                          className="font-black text-lg text-[#111111] leading-tight"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {alert.title}
                        </h3>
                        <div
                          className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-widest text-[#525252] mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{alert.type.replace(/-/g, ' ')}</span>
                          <span className="w-1 h-1 bg-[#525252] inline-block" />
                          <span>{alert.detectedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Severity badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[0.65rem] px-2 py-1 border font-black uppercase tracking-widest ${
                          alert.severity === 'critical' ? 'border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]' :
                          alert.severity === 'high'     ? 'border-[#E05C00] text-[#E05C00]' :
                          alert.severity === 'medium'   ? 'border-[#B38600] text-[#B38600]' :
                                                          'border-[#525252] text-[#525252]'
                        }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span
                        className="text-[0.6rem] text-[#525252] font-bold"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        RISK: {alert.risk_score}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <p
                      className="text-[#525252] text-sm mb-5 line-clamp-2 leading-relaxed"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      {alert.description}
                    </p>

                    {alert.affectedAccounts.length > 0 && (
                      <div className="border-l-4 border-[#111111] bg-[#E5E5E0] p-3 mb-5">
                        <div
                          className="text-[0.6rem] font-bold uppercase tracking-widest text-[#525252] mb-2"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          AFFECTED ACCOUNTS
                        </div>
                        <div className="space-y-1">
                          {alert.affectedAccounts.slice(0, 2).map((account: string, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <span
                                className="text-xs text-[#111111] font-bold truncate flex-1 mr-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {account}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigator.clipboard.writeText(account)}
                                className="p-1 text-[#737373] hover:text-[#111111] transition-colors"
                              >
                                <FaRegCopy className="w-3 h-3" />
                              </motion.button>
                            </div>
                          ))}
                          {alert.affectedAccounts.length > 2 && (
                            <div
                              className="text-[0.6rem] text-[#737373] font-bold uppercase tracking-widest"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              +{alert.affectedAccounts.length - 2} MORE
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card footer */}
                    <div className="pt-4 border-t-2 border-[#111111] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 ${
                            alert.status === 'active'       ? 'bg-[#CC0000]' :
                            alert.status === 'investigating'? 'bg-[#B38600]' :
                            alert.status === 'resolved'     ? 'bg-[#111111]' :
                                                              'bg-[#737373]'
                          }`}
                        />
                        <span
                          className="text-[0.6rem] font-bold text-[#525252] uppercase tracking-widest"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setShowThreatDetails(showThreatDetails === alert.id ? null : alert.id)
                        }
                        className="px-4 py-2 bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest hover:bg-[#CC0000] transition-colors flex items-center gap-1.5"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        VIEW DETAILS
                        <FaChevronRight size={8} />
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── THREAT DETAILS MODAL                                          ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showThreatDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowThreatDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-2xl w-full max-h-[90vh] overflow-hidden hard-shadow"
              style={{ borderRadius: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const alert = breachAlerts.find(a => a.id === showThreatDetails);
                if (!alert) return null;
                const SeverityIcon = getSeverityIcon(alert.severity);

                return (
                  <>
                    {/* Modal header */}
                    <div className="bg-[#111111] p-6 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7]">
                          <SeverityIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3
                            className="text-2xl font-black text-[#F9F9F7] uppercase tracking-widest"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            THREAT DETAILS
                          </h3>
                          <p
                            className="text-[#A3A3A3] text-sm mt-1"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Full intelligence report
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowThreatDetails(null)}
                        className="p-3 border-2 border-[#F9F9F7] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {/* Severity accent bar */}
                    <div
                      className={`h-1 ${
                        alert.severity === 'critical' ? 'bg-[#CC0000]' :
                        alert.severity === 'high'     ? 'bg-[#E05C00]' :
                        alert.severity === 'medium'   ? 'bg-[#B38600]' :
                                                        'bg-[#525252]'
                      }`}
                    />

                    <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)] space-y-8">

                      {/* Title + description */}
                      <div>
                        <h4
                          className="text-3xl font-black text-[#111111] mb-3 tracking-tighter uppercase"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {alert.title}
                        </h4>
                        <p
                          className="text-[#525252] leading-relaxed border-l-4 border-[#111111] pl-4"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          {alert.description}
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-[#111111] bg-white p-5">
                          <div
                            className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-3"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            [SEVERITY LEVEL]
                          </div>
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 font-black text-xs uppercase tracking-widest ${
                              alert.severity === 'critical' ? 'border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]' :
                              alert.severity === 'high'     ? 'border-[#E05C00] text-[#E05C00]' :
                              alert.severity === 'medium'   ? 'border-[#B38600] text-[#B38600]' :
                                                              'border-[#525252] text-[#525252]'
                            }`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <SeverityIcon className="w-4 h-4" />
                            {alert.severity.toUpperCase()}
                          </div>
                        </div>

                        <div className="border-2 border-[#111111] bg-white p-5">
                          <div
                            className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-3"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            [RISK SCORE]
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-4xl font-black text-[#111111] tracking-tighter"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {alert.risk_score}
                            </span>
                            <span
                              className="text-[#525252] font-bold"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              /100
                            </span>
                          </div>
                          <div className="mt-2 h-2 border border-[#111111] bg-white">
                            <div
                              className="h-full bg-[#CC0000]"
                              style={{ width: `${alert.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Affected Accounts */}
                      {alert.affectedAccounts.length > 0 && (
                        <div>
                          <div
                            className="font-black text-[#111111] uppercase tracking-widest text-xs flex items-center gap-2 border-b-2 border-[#111111] pb-2 mb-4"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <FaDatabase /> AFFECTED ACCOUNTS ({alert.affectedAccounts.length})
                          </div>
                          <div className="space-y-2">
                            {alert.affectedAccounts.map((account: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border-2 border-[#111111] bg-white hover:bg-[#E5E5E0] transition-colors"
                              >
                                <span
                                  className="text-sm font-bold text-[#111111]"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  {account}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => navigator.clipboard.writeText(account)}
                                  className="p-2 border border-[#111111] text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0] transition-colors"
                                >
                                  <FaRegCopy />
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div>
                        <div
                          className="font-black text-[#111111] uppercase tracking-widest text-xs flex items-center gap-2 border-b-2 border-[#111111] pb-2 mb-4"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <FaBullseye /> RECOMMENDED ACTIONS
                        </div>
                        <div className="space-y-3">
                          {alert.recommendations.map((rec: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-4 border-l-4 border-[#111111] bg-[#E5E5E0]"
                            >
                              <FaChevronRight className="text-[#CC0000] mt-0.5 shrink-0" size={10} />
                              <span
                                className="text-sm text-[#525252] flex-1 leading-relaxed"
                                style={{ fontFamily: "'Lora', serif" }}
                              >
                                {rec}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Modal footer */}
                      <div className="pt-6 border-t-4 border-[#111111] flex flex-wrap justify-end gap-4">
                        <button
                          onClick={() => setShowThreatDetails(null)}
                          className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          CLOSE
                        </button>
                        <button
                          className="px-8 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <FaCheckCircle /> MARK AS RESOLVED
                        </button>
                      </div>

                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── FULL SCAN MODAL                                               ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showFullScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isScanning && setShowFullScanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-lg w-full max-h-[90vh] overflow-y-auto hard-shadow"
              style={{ borderRadius: 0 }}
              onClick={e => e.stopPropagation()}
            >

              {/* Modal header */}
              <div className="p-6 flex justify-between items-center bg-[#111111] text-[#F9F9F7]">
                <h3
                  className="text-2xl font-black uppercase tracking-widest flex items-center gap-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <FaShieldAlt />
                  {scanResults.status === 'completed' ? 'SCAN COMPLETE' : 'FULL SECURITY SCAN'}
                </h3>
                <button
                  onClick={() => !isScanning && setShowFullScanModal(false)}
                  disabled={isScanning}
                  className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors disabled:opacity-50"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="h-1 bg-[#CC0000]" />

              <div className="p-8">
                {isScanning ? (

                  /* ── Scanning State ── */
                  <div className="space-y-8">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="inline-flex items-center justify-center w-24 h-24 border-4 border-[#CC0000] bg-white mb-6"
                      >
                        <FaSync className="text-4xl text-[#CC0000]" />
                      </motion.div>
                      <h4
                        className="text-2xl font-black text-[#111111] uppercase mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        SCANNING IN PROGRESS
                      </h4>
                      <p
                        className="text-[#525252] text-sm"
                        style={{ fontFamily: "'Lora', serif" }}
                      >
                        Please wait while we scan your accounts for security threats.
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-3">
                      <div
                        className="flex justify-between text-xs font-bold uppercase tracking-widest"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        <span className="text-[#525252]">PROGRESS</span>
                        <span className="text-[#CC0000]">{Math.round(scanProgress)}%</span>
                      </div>
                      <div className="w-full h-4 border-2 border-[#111111] bg-white">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                          className="h-full bg-[#CC0000]"
                          transition={{ type: 'spring', damping: 20 }}
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[25, 50, 75, 100].map(step => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 border ${
                              scanProgress >= step
                                ? 'bg-[#CC0000] border-[#CC0000]'
                                : 'bg-transparent border-[#E5E5E0]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Live stats */}
                    <div className="grid grid-cols-3 gap-0 border-2 border-[#111111]">
                      <div className="p-4 text-center border-r-2 border-[#111111]">
                        <FaDatabase className="w-6 h-6 text-[#111111] mx-auto mb-2" />
                        <div
                          className="text-2xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.scannedItems.toLocaleString()}
                        </div>
                        <div
                          className="text-[0.6rem] text-[#525252] font-bold uppercase tracking-widest mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          SCANNED
                        </div>
                      </div>
                      <div className="p-4 text-center border-r-2 border-[#111111]">
                        <FaExclamationTriangle className="w-6 h-6 text-[#CC0000] mx-auto mb-2" />
                        <div
                          className="text-2xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.threatsFound}
                        </div>
                        <div
                          className="text-[0.6rem] text-[#525252] font-bold uppercase tracking-widest mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          THREATS
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <FaBug className="w-6 h-6 text-[#B38600] mx-auto mb-2" />
                        <div
                          className="text-2xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.vulnerabilities}
                        </div>
                        <div
                          className="text-[0.6rem] text-[#525252] font-bold uppercase tracking-widest mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          VULNS
                        </div>
                      </div>
                    </div>

                    {/* Activity log */}
                    <div className="border-2 border-[#111111] bg-white p-5">
                      <div className="flex items-center gap-3 mb-4 border-b-2 border-[#111111] pb-3">
                        <motion.div
                          className="w-3 h-3 bg-[#CC0000] border border-[#111111]"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span
                          className="text-xs font-black uppercase tracking-widest text-[#111111]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          CURRENT ACTIVITY
                        </span>
                      </div>
                      <div
                        className="space-y-2 text-sm text-[#525252] font-bold"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {[
                          'Scanning dark web databases...',
                          'Checking for data breaches...',
                          'Analyzing password security...'
                        ].map((msg, i) => (
                          <motion.div
                            key={msg}
                            className="flex items-center gap-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          >
                            <FaChevronRight className="text-[#CC0000]" size={10} />
                            <span>{msg}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Warning notice */}
                    <div className="bg-[#111111] text-[#F9F9F7] p-4 flex items-start gap-4">
                      <FaExclamationTriangle className="text-xl shrink-0 mt-1 text-[#CC0000]" />
                      <div
                        className="text-sm"
                        style={{ fontFamily: "'Lora', serif" }}
                      >
                        <p
                          className="font-black uppercase tracking-widest text-[0.65rem] mb-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          DO NOT CLOSE THE APPLICATION
                        </p>
                        <p>Your system is being scanned. Please wait for the operation to complete.</p>
                      </div>
                    </div>
                  </div>

                ) : (

                  /* ── Completed State ── */
                  <div className="space-y-8">
                    <div className="text-center py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-24 h-24 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] mb-6"
                      >
                        <FaCheckCircle className="text-4xl" />
                      </motion.div>
                      <h4
                        className="text-3xl font-black text-[#111111] mb-2 uppercase"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        SCAN COMPLETE
                      </h4>
                      <p
                        className="text-[#525252]"
                        style={{ fontFamily: "'Lora', serif" }}
                      >
                        Comprehensive security scan of your accounts is done.
                      </p>
                    </div>

                    {/* Final results */}
                    <div className="grid grid-cols-3 gap-0 border-2 border-[#111111]">
                      <div className="p-5 text-center border-r-2 border-[#111111]">
                        <FaDatabase className="w-6 h-6 text-[#111111] mx-auto mb-3" />
                        <div
                          className="text-3xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.scannedItems.toLocaleString()}
                        </div>
                        <div
                          className="text-[0.6rem] font-bold uppercase tracking-widest text-[#525252] mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          ITEMS SCANNED
                        </div>
                      </div>
                      <div className="p-5 text-center border-r-2 border-[#111111]">
                        <FaExclamationTriangle className="w-6 h-6 text-[#CC0000] mx-auto mb-3" />
                        <div
                          className="text-3xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.threatsFound}
                        </div>
                        <div
                          className="text-[0.6rem] font-bold uppercase tracking-widest text-[#525252] mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          THREATS FOUND
                        </div>
                      </div>
                      <div className="p-5 text-center">
                        <FaBug className="w-6 h-6 text-[#B38600] mx-auto mb-3" />
                        <div
                          className="text-3xl font-black text-[#111111]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {scanResults.vulnerabilities}
                        </div>
                        <div
                          className="text-[0.6rem] font-bold uppercase tracking-widest text-[#525252] mt-1"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          VULNERABILITIES
                        </div>
                      </div>
                    </div>

                    {/* Scan summary */}
                    <div className="border-l-4 border-[#111111] bg-[#E5E5E0] p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] shrink-0">
                          <FaShieldAlt className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-xs font-black uppercase tracking-widest text-[#111111] mb-2"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            SCAN SUMMARY
                          </div>
                          <p
                            className="text-sm text-[#525252] leading-relaxed"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            {scanResults.threatsFound > 0
                              ? `Found ${scanResults.threatsFound} potential threat${scanResults.threatsFound > 1 ? 's' : ''} and ${scanResults.vulnerabilities} vulnerabilit${scanResults.vulnerabilities !== 1 ? 'ies' : 'y'}. Review the alerts above for details.`
                              : 'No new threats or vulnerabilities were detected during this scan.'}
                          </p>
                          {scanResults.threatsFound > 0 && (
                            <div className="mt-4 space-y-2">
                              {[
                                'All detected threats have been logged',
                                'Security recommendations generated'
                              ].map(item => (
                                <div
                                  key={item}
                                  className="flex items-center gap-2 text-sm font-bold text-[#525252]"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  <FaCheckCircle className="text-[#111111]" size={12} />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modal footer */}
                    <div className="pt-6 border-t-4 border-[#111111] flex flex-wrap justify-end gap-4">
                      <button
                        onClick={() => setShowFullScanModal(false)}
                        className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        CLOSE
                      </button>
                      {scanResults.threatsFound > 0 && (
                        <button
                          onClick={() => {
                            setShowFullScanModal(false);
                            setSelectedCategory('all');
                            setSelectedSeverity('all');
                          }}
                          className="px-8 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <FaEye /> VIEW ALL THREATS
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Monitoring;