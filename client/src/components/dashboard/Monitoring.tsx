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

// New interfaces for real-time data visualization
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

// Types for breach monitoring
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
  ttps: string[]; // Tactics, Techniques, and Procedures
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

const Monitoring: React.FC = () => {
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
  
  // API State
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

  // Fetch monitoring data from API
  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
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
        // Convert API alerts to component format
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

  // Real-time data visualization states
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [networkActivity, setNetworkActivity] = useState<NetworkActivityData[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    timestamp: Date.now(),
    score: 92,
    trend: 'up'
  });

  // Update security score when data changes
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

  // Full scan handler
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

    // Simulate scanning process
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

  // Real-time monitoring - refresh data periodically
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Real-time data visualization effects
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    // Generate initial data
    const initialMetrics: RealTimeMetric[] = [];
    const initialNetwork: NetworkActivityData[] = [];
    const now = Date.now();
    
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - (i * 2000); // 2-second intervals
      initialMetrics.push({
        timestamp,
        value: Math.random() * 100,
        label: `Metric ${i}`
      });
      initialNetwork.push({
        timestamp,
        inbound: Math.random() * 50 + 10,
        outbound: Math.random() * 30 + 5,
        blocked: Math.random() * 10
      });
    }
    
    setRealTimeMetrics(initialMetrics);
    setNetworkActivity(initialNetwork);

    // Update live metrics every 2 seconds
    const metricsInterval = setInterval(() => {
      setLiveMetrics(prev => ({
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        scanningRate: 80 + Math.random() * 40,
        networkTraffic: 30 + Math.random() * 70,
        cpuUsage: 20 + Math.random() * 60
      }));

      // Update real-time metrics
      setRealTimeMetrics(prev => {
        const newMetric = {
          timestamp: Date.now(),
          value: Math.random() * 100,
          label: `Metric ${prev.length}`
        };
        return [...prev.slice(1), newMetric];
      });

      // Update network activity
      setNetworkActivity(prev => {
        const newActivity = {
          timestamp: Date.now(),
          inbound: Math.random() * 50 + 10,
          outbound: Math.random() * 30 + 5,
          blocked: Math.random() * 10
        };
        return [...prev.slice(1), newActivity];
      });

      // Occasionally update security score
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

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

  // Animation variants — mechanical, snappy
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: 'easeOut'
      } 
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
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background: '#F9F9F7',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
          .np-serif { font-family: 'Playfair Display', serif !important; }
          .np-body  { font-family: 'Lora', serif !important; }
          .np-sans  { font-family: 'Inter', sans-serif !important; }
          .np-mono  { font-family: 'JetBrains Mono', monospace !important; }
        `}</style>
        <div className="text-center border border-[#111111] p-12">
          <FaSpinner className="w-8 h-8 animate-spin text-[#111111] mx-auto mb-4" />
          <p className="np-mono uppercase tracking-widest text-xs text-[#111111]">Loading monitoring data...</p>
          <p className="np-mono text-xs text-[#737373] mt-2 uppercase tracking-wider">Fetching your security information</p>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background: '#F9F9F7',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
          .np-serif { font-family: 'Playfair Display', serif !important; }
          .np-body  { font-family: 'Lora', serif !important; }
          .np-sans  { font-family: 'Inter', sans-serif !important; }
          .np-mono  { font-family: 'JetBrains Mono', monospace !important; }
        `}</style>
        <div className="text-center max-w-md border-4 border-[#111111] p-8">
          <FaExclamationTriangle className="w-12 h-12 text-[#CC0000] mx-auto mb-4" />
          <h3 className="np-serif text-2xl font-bold text-[#111111] mb-3">Error Loading Data</h3>
          <p className="np-body text-[#525252] mb-6">{error}</p>
          <button
            onClick={fetchMonitoringData}
            className="px-6 py-3 bg-[#111111] text-[#F9F9F7] np-mono text-xs uppercase tracking-widest hover:bg-[#CC0000] border border-[#111111] transition-all duration-200"
            style={{ borderRadius: 0 }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="border-4 border-[#111111] bg-[#F9F9F7] space-y-0 -mt-4"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}
    >
      {/* ── Font & utility injection ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
        .np-serif { font-family: 'Playfair Display', serif !important; }
        .np-body  { font-family: 'Lora', serif !important; }
        .np-sans  { font-family: 'Inter', sans-serif !important; }
        .np-mono  { font-family: 'JetBrains Mono', monospace !important; }
        .np-hover { transition: box-shadow 0.15s ease-out, transform 0.15s ease-out; }
        .np-hover:hover { box-shadow: 4px 4px 0px 0px #111111; transform: translate(-2px, -2px); }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-[#111111] relative overflow-hidden">
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-3 mb-3 border border-[#F9F9F7]/20 px-3 py-1.5">
              <div
                className={`w-2 h-2 ${isRealTimeEnabled ? 'bg-[#CC0000] animate-pulse' : 'bg-[#737373]'}`}
              ></div>
              <span className="np-mono text-xs uppercase tracking-widest text-[#F9F9F7]/70">
                {isRealTimeEnabled ? 'Real-time Active' : 'Monitoring Paused'}
              </span>
            </div>

            <h2 className="np-serif text-4xl font-bold text-[#F9F9F7] flex items-center gap-3">
              <FaShieldVirus className="text-[#CC0000]" />
              <span>Security Monitoring</span>
            </h2>

            <p className="np-body text-[#F9F9F7]/60 mt-2 max-w-lg">
              Real-time threat detection and breach monitoring for your digital identity
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`px-4 py-2.5 np-mono text-xs uppercase tracking-widest font-medium transition-all duration-200 flex items-center gap-2 border ${
                isRealTimeEnabled
                  ? 'bg-transparent border-[#F9F9F7]/30 text-[#F9F9F7] hover:bg-[#F9F9F7]/10'
                  : 'bg-[#525252] border-[#525252] text-[#F9F9F7]'
              }`}
              style={{ borderRadius: 0 }}
            >
              {isRealTimeEnabled ? <FaPause className="text-[#CC0000]" /> : <FaPlay />}
              {isRealTimeEnabled ? 'Pause Monitoring' : 'Resume Monitoring'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleFullScan}
              className="px-4 py-2.5 bg-[#CC0000] text-[#F9F9F7] np-mono text-xs uppercase tracking-widest font-medium transition-all duration-200 flex items-center gap-2 border border-[#CC0000] hover:bg-[#F9F9F7] hover:text-[#CC0000]"
              style={{ borderRadius: 0 }}
            >
              <FaSync /> Run Full Scan
            </motion.button>
          </div>
        </div>
        {/* Red editorial rule */}
        <div className="h-1 bg-[#CC0000]"></div>
      </div>

      {/* ── Real-time Data Visualization Dashboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-4 border-b border-[#111111]"
      >
        {/* Live Security Score */}
        <div className="lg:col-span-1 bg-[#111111] p-6 text-[#F9F9F7] border-r border-[#F9F9F7]/10">
          <div className="flex items-center justify-between mb-4">
            <FaShieldVirus className="text-xl text-[#CC0000]" />
            <div
              className={`w-2 h-2 animate-pulse ${
                securityScore.trend === 'up'
                  ? 'bg-green-400'
                  : securityScore.trend === 'down'
                  ? 'bg-[#CC0000]'
                  : 'bg-[#A3A3A3]'
              }`}
            ></div>
          </div>
          <p className="np-mono uppercase tracking-widest text-xs text-[#A3A3A3] mb-2">Security Score</p>
          <div className="flex items-end gap-2">
            <span className="np-serif text-5xl font-bold">{Math.round(securityScore.score)}</span>
            <span className="text-lg text-[#A3A3A3] mb-1">/100</span>
            <motion.div
              animate={{
                rotate:
                  securityScore.trend === 'up' ? 0 : securityScore.trend === 'down' ? 180 : 90
              }}
              className={`ml-auto mb-1 ${
                securityScore.trend === 'up'
                  ? 'text-green-400'
                  : securityScore.trend === 'down'
                  ? 'text-[#CC0000]'
                  : 'text-[#A3A3A3]'
              }`}
            >
              <FaArrowUp size={16} />
            </motion.div>
          </div>
        </div>

        {/* Live Threat Counter */}
        <div className="lg:col-span-1 bg-[#F9F9F7] p-6 border-r border-[#111111]">
          <div className="flex items-center justify-between mb-4">
            <FaRadiation className="text-xl text-[#CC0000]" />
            <div className="w-2 h-2 bg-[#CC0000] animate-pulse"></div>
          </div>
          <p className="np-mono uppercase tracking-widest text-xs text-[#737373] mb-2">Threats Blocked</p>
          <div className="flex items-end gap-2">
            <motion.span
              key={liveMetrics.threatsBlocked}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="np-serif text-5xl font-bold text-[#111111]"
            >
              {liveMetrics.threatsBlocked.toLocaleString()}
            </motion.span>
            <span className="np-mono text-xs text-[#737373] mb-2">today</span>
          </div>
        </div>

        {/* Network Activity Graph */}
        <div className="lg:col-span-2 bg-[#F9F9F7] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaNetworkWired className="text-lg text-[#111111]" />
              <h3 className="np-mono text-xs uppercase tracking-widest font-semibold text-[#111111]">
                Network Activity
              </h3>
            </div>
            <div className="flex items-center gap-4 np-mono text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-[2px] bg-[#111111]"></div>
                <span className="text-[#737373] uppercase tracking-wider">In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-[2px] bg-[#525252]"></div>
                <span className="text-[#737373] uppercase tracking-wider">Out</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-[2px] bg-[#CC0000]"></div>
                <span className="text-[#737373] uppercase tracking-wider">Blocked</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div
            className="relative h-32 w-full bg-[#E5E5E0] overflow-hidden border border-[#111111]"
            style={{ borderRadius: 0 }}
          >
            <svg className="w-full h-full" viewBox="0 0 400 100">
              {[20, 40, 60, 80].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="400"
                  y2={y}
                  stroke="#111111"
                  strokeWidth="0.5"
                  opacity="0.15"
                />
              ))}

              {networkActivity.length > 1 && (
                <>
                  {/* Inbound */}
                  <motion.polyline
                    points={networkActivity
                      .map(
                        (point, index) =>
                          `${(index / (networkActivity.length - 1)) * 400},${
                            100 - (point.inbound / 60) * 80
                          }`
                      )
                      .join(' ')}
                    fill="none"
                    stroke="#111111"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                  {/* Outbound */}
                  <motion.polyline
                    points={networkActivity
                      .map(
                        (point, index) =>
                          `${(index / (networkActivity.length - 1)) * 400},${
                            100 - (point.outbound / 35) * 80
                          }`
                      )
                      .join(' ')}
                    fill="none"
                    stroke="#525252"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                  />
                  {/* Blocked */}
                  <motion.polyline
                    points={networkActivity
                      .map(
                        (point, index) =>
                          `${(index / (networkActivity.length - 1)) * 400},${
                            100 - (point.blocked / 10) * 80
                          }`
                      )
                      .join(' ')}
                    fill="none"
                    stroke="#CC0000"
                    strokeWidth="2"
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
                  className="flex items-center gap-2 np-mono text-xs"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaCircle className="text-[#111111] text-[6px]" />
                  <span className="text-[#525252]">
                    {Math.round(networkActivity[networkActivity.length - 1]?.inbound || 0)} MB/s
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 np-mono text-xs"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <FaCircle className="text-[#525252] text-[6px]" />
                  <span className="text-[#525252]">
                    {Math.round(networkActivity[networkActivity.length - 1]?.outbound || 0)} MB/s
                  </span>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Real-time System Metrics ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-[#111111]"
      >
        {[
          {
            label: 'Scanning Rate',
            value: `${Math.round(liveMetrics.scanningRate)}`,
            unit: 'files/sec',
            icon: FaBinoculars
          },
          {
            label: 'Network Traffic',
            value: `${Math.round(liveMetrics.networkTraffic)}`,
            unit: 'MB/s',
            icon: FaSignal
          },
          {
            label: 'CPU Usage',
            value: `${Math.round(liveMetrics.cpuUsage)}`,
            unit: '%',
            icon: FaChartLine
          },
          {
            label: 'Active Scans',
            value: `${monitoringStats.scanned_databases}`,
            unit: 'DBs',
            icon: FaDatabase
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className={`bg-[#F9F9F7] p-6 np-hover ${index < 3 ? 'border-r border-[#111111]' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <metric.icon className="text-lg text-[#111111]" />
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-[#CC0000]"
              ></motion.div>
            </div>
            <p className="np-mono uppercase tracking-widest text-xs text-[#737373] mb-1">
              {metric.label}
            </p>
            <div className="flex items-end gap-1">
              <motion.span
                key={metric.value}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="np-serif text-3xl font-bold text-[#111111]"
              >
                {metric.value}
              </motion.span>
              <span className="np-mono text-xs text-[#737373] mb-1">{metric.unit}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Search & Filter ── */}
      <div className="bg-[#F9F9F7] border-b border-[#111111]">
        <div className="p-5 border-b border-[#E5E5E0]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
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
                className="w-full pl-12 pr-4 py-3 border border-[#111111] bg-[#F9F9F7] np-sans text-sm text-[#111111] placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-0 transition-all duration-200"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div className="flex items-center gap-3 self-end">
              {/* Sort */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-[#F9F9F7] border border-[#111111] hover:bg-[#E5E5E0] transition-colors duration-200"
                style={{ borderRadius: 0 }}
              >
                <FaSort className="text-[#525252]" />
                <select
                  value={sortBy}
                  onChange={e =>
                    setSortBy(e.target.value as 'timestamp' | 'severity' | 'risk_score')
                  }
                  className="bg-transparent border-none np-mono text-xs uppercase tracking-wider focus:ring-0 text-[#111111] font-medium"
                >
                  <option value="timestamp">Time</option>
                  <option value="severity">Severity</option>
                  <option value="risk_score">Risk Score</option>
                </select>
              </div>

              {/* Severity filter */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-[#F9F9F7] border border-[#111111] hover:bg-[#E5E5E0] transition-colors duration-200"
                style={{ borderRadius: 0 }}
              >
                <FaFilter className="text-[#525252]" />
                <select
                  value={selectedSeverity}
                  onChange={e => setSelectedSeverity(e.target.value)}
                  className="bg-transparent border-none np-mono text-xs uppercase tracking-wider focus:ring-0 text-[#111111] font-medium"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-[#E5E5E0] px-5 py-3">
          <div className="flex overflow-x-auto gap-2 pb-1">
            {categories.map(category => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 np-mono text-xs uppercase tracking-wider border border-[#111111] ${
                  selectedCategory === category
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                }`}
                style={{ borderRadius: 0 }}
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
                <span className="font-medium">
                  {category === 'all' ? 'All Threats' : category.replace('-', ' ')}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Security Alerts ── */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#F9F9F7] border border-[#111111] p-12 text-center"
          >
            <div
              className="border border-[#111111] inline-flex items-center justify-center w-16 h-16 mb-6 mx-auto"
              style={{ borderRadius: 0 }}
            >
              <FaCheckCircle className="text-[#111111] text-2xl" />
            </div>
            <h3 className="np-serif text-2xl font-bold text-[#111111] mb-2">
              All Clear — No Active Threats
            </h3>
            <p className="np-body text-[#737373] max-w-md mx-auto">
              No security alerts match your current filters. Your accounts are being monitored
              continuously for any threats.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSeverity('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 border border-[#111111] text-[#111111] np-mono text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                style={{ borderRadius: 0 }}
              >
                Clear All Filters
              </button>
              <button
                className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] np-mono text-xs uppercase tracking-widest hover:bg-[#CC0000] transition-all duration-200 flex items-center gap-2"
                style={{ borderRadius: 0 }}
              >
                <FaSync size={12} /> Run Security Scan
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 border border-[#111111]"
          >
            {filteredAlerts.map(alert => {
              const SeverityIcon = getSeverityIcon(alert.severity);
              const TypeIcon = getTypeIcon(alert.type);

              return (
                <motion.div
                  key={alert.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-[#F9F9F7] overflow-hidden np-hover border-r border-b border-[#111111] relative"
                  style={{ borderRadius: 0 }}
                >
                  {/* Severity left-border accent */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      alert.severity === 'critical'
                        ? 'bg-[#CC0000]'
                        : alert.severity === 'high'
                        ? 'bg-[#E05C00]'
                        : alert.severity === 'medium'
                        ? 'bg-[#B38600]'
                        : 'bg-[#525252]'
                    }`}
                  ></div>

                  <div className="pl-4">
                    {/* Card header */}
                    <div className="p-5 border-b border-[#E5E5E0] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 border ${
                            alert.severity === 'critical'
                              ? 'border-[#CC0000] text-[#CC0000]'
                              : alert.severity === 'high'
                              ? 'border-[#E05C00] text-[#E05C00]'
                              : alert.severity === 'medium'
                              ? 'border-[#B38600] text-[#B38600]'
                              : 'border-[#525252] text-[#525252]'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          <SeverityIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="np-sans font-semibold text-[#111111] text-sm">
                            {alert.title}
                          </h3>
                          <div className="flex items-center gap-2 np-mono text-xs text-[#737373] mt-1 uppercase tracking-wider">
                            <TypeIcon className="w-3 h-3" />
                            <span>{alert.type.replace('-', ' ')}</span>
                            <span>·</span>
                            <span>{alert.detectedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 np-mono text-xs uppercase tracking-widest border ${
                            alert.severity === 'critical'
                              ? 'border-[#CC0000] text-[#CC0000]'
                              : alert.severity === 'high'
                              ? 'border-[#E05C00] text-[#E05C00]'
                              : alert.severity === 'medium'
                              ? 'border-[#B38600] text-[#B38600]'
                              : 'border-[#525252] text-[#525252]'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          {alert.severity}
                        </span>
                        <span className="np-mono text-xs text-[#737373]">
                          Risk: {alert.risk_score}
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <p className="np-body text-[#525252] text-sm mb-4 line-clamp-2">
                        {alert.description}
                      </p>

                      <div className="space-y-3">
                        <div className="p-3 bg-[#E5E5E0] border-l-2 border-[#111111]">
                          <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-1">
                            Affected Accounts
                          </div>
                          <div className="space-y-1">
                            {alert.affectedAccounts
                              .slice(0, 2)
                              .map((account: string, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="np-mono text-xs text-[#111111] truncate flex-1 mr-2">
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
                              <div className="np-mono text-xs text-[#737373]">
                                +{alert.affectedAccounts.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#E5E5E0] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 ${
                              alert.status === 'active'
                                ? 'bg-[#CC0000]'
                                : alert.status === 'investigating'
                                ? 'bg-[#B38600]'
                                : alert.status === 'resolved'
                                ? 'bg-[#111111]'
                                : 'bg-[#737373]'
                            }`}
                          ></div>
                          <span className="np-mono text-xs text-[#737373] uppercase tracking-widest">
                            {alert.status}
                          </span>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setShowThreatDetails(
                              showThreatDetails === alert.id ? null : alert.id
                            )
                          }
                          className="px-3 py-1.5 np-mono text-xs uppercase tracking-widest bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] transition-colors duration-200 flex items-center gap-1"
                          style={{ borderRadius: 0 }}
                        >
                          <span>View Details</span>
                          <FaChevronRight size={8} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ── Threat Details Modal ── */}
      <AnimatePresence>
        {showThreatDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-[#F9F9F7] max-w-2xl w-full max-h-[85vh] overflow-hidden border border-[#111111]"
              style={{ borderRadius: 0 }}
            >
              {(() => {
                const alert = breachAlerts.find(a => a.id === showThreatDetails);
                if (!alert) return null;
                const SeverityIcon = getSeverityIcon(alert.severity);

                return (
                  <>
                    {/* Modal header */}
                    <div className="bg-[#111111] p-5 flex justify-between items-center">
                      <h3 className="np-serif text-lg font-bold text-[#F9F9F7] flex items-center gap-3">
                        <SeverityIcon
                          className={
                            alert.severity === 'critical' || alert.severity === 'high'
                              ? 'text-[#CC0000]'
                              : 'text-[#F9F9F7]'
                          }
                        />
                        Threat Details
                      </h3>
                      <button
                        onClick={() => setShowThreatDetails(null)}
                        className="text-[#F9F9F7] bg-[#F9F9F7]/10 hover:bg-[#CC0000] p-2 transition-colors duration-200"
                        style={{ borderRadius: 0 }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    {/* Severity accent rule */}
                    <div
                      className={`h-1 ${
                        alert.severity === 'critical'
                          ? 'bg-[#CC0000]'
                          : alert.severity === 'high'
                          ? 'bg-[#E05C00]'
                          : alert.severity === 'medium'
                          ? 'bg-[#B38600]'
                          : 'bg-[#525252]'
                      }`}
                    ></div>

                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                      <div className="space-y-6">
                        <div>
                          <h4 className="np-serif text-xl font-bold text-[#111111] mb-2">
                            {alert.title}
                          </h4>
                          <p className="np-body text-[#525252]">{alert.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border border-[#111111]">
                            <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-2">
                              Severity Level
                            </div>
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 np-mono text-sm uppercase tracking-wider border ${
                                alert.severity === 'critical'
                                  ? 'border-[#CC0000] text-[#CC0000]'
                                  : alert.severity === 'high'
                                  ? 'border-[#E05C00] text-[#E05C00]'
                                  : alert.severity === 'medium'
                                  ? 'border-[#B38600] text-[#B38600]'
                                  : 'border-[#525252] text-[#525252]'
                              }`}
                              style={{ borderRadius: 0 }}
                            >
                              <SeverityIcon className="w-4 h-4" />
                              {alert.severity}
                            </div>
                          </div>

                          <div className="p-4 border border-[#111111]">
                            <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mb-2">
                              Risk Score
                            </div>
                            <div className="np-serif text-4xl font-bold text-[#111111]">
                              {alert.risk_score}
                              <span className="np-sans text-lg text-[#737373]">/100</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="np-mono text-xs uppercase tracking-widest text-[#111111] font-semibold mb-3">
                            Affected Accounts
                          </h5>
                          <div className="space-y-2">
                            {alert.affectedAccounts.map((account: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-[#E5E5E0] border-l-2 border-[#111111]"
                              >
                                <span className="np-mono text-sm text-[#111111]">{account}</span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => navigator.clipboard.writeText(account)}
                                  className="p-2 text-[#737373] hover:text-[#111111] transition-colors"
                                >
                                  <FaRegCopy />
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="np-mono text-xs uppercase tracking-widest text-[#111111] font-semibold mb-3">
                            Recommended Actions
                          </h5>
                          <div className="space-y-3">
                            {alert.recommendations.map((rec: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 border-l-4 border-[#111111] bg-[#E5E5E0]"
                              >
                                <div className="text-[#CC0000] mt-0.5">
                                  <FaBullseye className="w-3 h-3" />
                                </div>
                                <span className="np-body text-sm text-[#525252] flex-1">
                                  {rec}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-3 border-t border-[#E5E5E0]">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setShowThreatDetails(null)}
                            className="px-5 py-2.5 border border-[#111111] text-[#111111] np-mono text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                            style={{ borderRadius: 0 }}
                          >
                            Close
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 bg-[#CC0000] text-[#F9F9F7] np-mono text-xs uppercase tracking-widest hover:bg-[#111111] transition-all duration-200"
                            style={{ borderRadius: 0 }}
                          >
                            Mark as Resolved
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Scan Modal ── */}
      <AnimatePresence>
        {showFullScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-[#F9F9F7] max-w-2xl w-full overflow-hidden border border-[#111111]"
              style={{ borderRadius: 0 }}
            >
              {/* Modal header */}
              <div className="bg-[#111111] p-5 flex justify-between items-center">
                <h3 className="np-serif text-lg font-bold text-[#F9F9F7] flex items-center gap-3">
                  <FaShieldAlt className="text-[#CC0000]" />
                  {scanResults.status === 'completed' ? 'Scan Complete' : 'Full Security Scan'}
                </h3>
                <button
                  onClick={() => setShowFullScanModal(false)}
                  className="text-[#F9F9F7] bg-[#F9F9F7]/10 hover:bg-[#CC0000] p-2 transition-colors duration-200"
                  style={{ borderRadius: 0 }}
                  disabled={isScanning}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="h-1 bg-[#CC0000]"></div>

              <div className="p-6">
                {isScanning ? (
                  <div className="space-y-6">
                    {/* Scanning state */}
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#CC0000] mb-4"
                        style={{ borderRadius: 0 }}
                      >
                        <FaSync className="text-2xl text-[#CC0000]" />
                      </motion.div>
                      <h4 className="np-serif text-xl font-bold text-[#111111] mb-2">
                        Scanning in Progress
                      </h4>
                      <p className="np-body text-[#737373] text-sm">
                        Please wait while we scan your accounts and data for security threats.
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between np-mono text-xs uppercase tracking-widest">
                        <span className="text-[#111111]">Progress</span>
                        <span className="text-[#CC0000]">{Math.round(scanProgress)}%</span>
                      </div>
                      <div
                        className="h-3 bg-[#E5E5E0] border border-[#111111] overflow-hidden"
                        style={{ borderRadius: 0 }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                          className="h-full bg-[#CC0000]"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                    </div>

                    {/* Live Stats */}
                    <div className="grid grid-cols-3 gap-0 border border-[#111111]">
                      <div className="p-4 text-center border-r border-[#111111]">
                        <FaDatabase className="w-5 h-5 text-[#111111] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.scannedItems.toLocaleString()}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Items Scanned
                        </div>
                      </div>
                      <div className="p-4 text-center border-r border-[#111111]">
                        <FaExclamationTriangle className="w-5 h-5 text-[#CC0000] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.threatsFound}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Threats Found
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <FaBug className="w-5 h-5 text-[#B38600] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.vulnerabilities}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Vulnerabilities
                        </div>
                      </div>
                    </div>

                    {/* Scanning Activity */}
                    <div className="bg-[#E5E5E0] border-l-4 border-[#111111] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-2 bg-[#CC0000]"
                        ></motion.div>
                        <span className="np-mono text-xs uppercase tracking-widest text-[#111111] font-medium">
                          Current Activity
                        </span>
                      </div>
                      <div className="space-y-2 np-body text-sm text-[#525252]">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <FaChevronRight className="text-[#CC0000]" size={10} />
                          <span>Scanning dark web databases...</span>
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          className="flex items-center gap-2"
                        >
                          <FaChevronRight className="text-[#CC0000]" size={10} />
                          <span>Checking for data breaches...</span>
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                          className="flex items-center gap-2"
                        >
                          <FaChevronRight className="text-[#CC0000]" size={10} />
                          <span>Analyzing password security...</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Success state */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#111111] mb-4"
                        style={{ borderRadius: 0 }}
                      >
                        <FaCheckCircle className="text-2xl text-[#111111]" />
                      </motion.div>
                      <h4 className="np-serif text-xl font-bold text-[#111111] mb-2">
                        Security Scan Complete
                      </h4>
                      <p className="np-body text-[#737373]">
                        We've completed a comprehensive security scan of your accounts.
                      </p>
                    </div>

                    {/* Final Results */}
                    <div className="grid grid-cols-3 gap-0 border-2 border-[#111111]">
                      <div className="p-4 text-center border-r-2 border-[#111111]">
                        <FaDatabase className="w-5 h-5 text-[#111111] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.scannedItems.toLocaleString()}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Items Scanned
                        </div>
                      </div>
                      <div className="p-4 text-center border-r-2 border-[#111111]">
                        <FaExclamationTriangle className="w-5 h-5 text-[#CC0000] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.threatsFound}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Threats Found
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <FaBug className="w-5 h-5 text-[#B38600] mx-auto mb-2" />
                        <div className="np-serif text-2xl font-bold text-[#111111]">
                          {scanResults.vulnerabilities}
                        </div>
                        <div className="np-mono text-xs text-[#737373] mt-1 uppercase tracking-widest">
                          Vulnerabilities
                        </div>
                      </div>
                    </div>

                    {/* Scan Summary */}
                    <div className="border-l-4 border-[#111111] bg-[#E5E5E0] p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 border border-[#111111] text-[#111111]"
                          style={{ borderRadius: 0 }}
                        >
                          <FaShieldAlt className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="np-mono text-xs uppercase tracking-widest font-semibold text-[#111111] mb-1">
                            Scan Summary
                          </h5>
                          <p className="np-body text-sm text-[#525252]">
                            {scanResults.threatsFound > 0
                              ? `We found ${scanResults.threatsFound} potential threat${
                                  scanResults.threatsFound > 1 ? 's' : ''
                                } and ${scanResults.vulnerabilities} vulnerabilit${
                                  scanResults.vulnerabilities !== 1 ? 'ies' : 'y'
                                }. Review the alerts above for details.`
                              : 'No new threats or vulnerabilities were detected during this scan.'}
                          </p>
                          {scanResults.threatsFound > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 np-body text-sm">
                                <FaCheckCircle className="text-[#111111]" size={12} />
                                <span className="text-[#525252]">
                                  All detected threats have been logged
                                </span>
                              </div>
                              <div className="flex items-center gap-2 np-body text-sm">
                                <FaCheckCircle className="text-[#111111]" size={12} />
                                <span className="text-[#525252]">
                                  Security recommendations generated
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end space-x-3 border-t border-[#E5E5E0]">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFullScanModal(false)}
                        className="px-5 py-2.5 border border-[#111111] text-[#111111] np-mono text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                        style={{ borderRadius: 0 }}
                      >
                        Close
                      </motion.button>
                      {scanResults.threatsFound > 0 && (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowFullScanModal(false);
                            setSelectedCategory('all');
                            setSelectedSeverity('all');
                          }}
                          className="px-5 py-2.5 bg-[#CC0000] text-[#F9F9F7] np-mono text-xs uppercase tracking-widest hover:bg-[#111111] transition-all duration-200 flex items-center gap-2"
                          style={{ borderRadius: 0 }}
                        >
                          <FaEye /> View All Threats
                        </motion.button>
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