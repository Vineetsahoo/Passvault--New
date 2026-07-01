import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPassport, FaIdCard, FaCreditCard, FaFingerprint,
  FaFileAlt, FaShieldAlt, FaUserShield,
  FaFilter, FaSort, FaSearch, FaHistory,
  FaCalendarAlt, FaDesktop, FaGlobe, FaCheckCircle,
  FaExclamationCircle, FaChevronDown, FaEye,
  FaClock, FaLock, FaAngleRight, FaInfoCircle,
  FaTimes, FaBell, FaKey, FaShieldVirus, FaSave,
  FaToggleOn, FaToggleOff, FaExclamation, FaSpinner
} from 'react-icons/fa';
import { historyAPI } from '../../services/api';

// ─── Interfaces (unchanged) ───────────────────────────────────────────────────

interface HistoryEvent {
  id: string;
  date: string;
  eventType: 'password' | 'document' | 'qrcode' | 'backup' | 'login' | 'settings';
  description: string;
  target: string;
  action: string;
  metadata?: any;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  success: boolean;
}

// ─── Newsprint Switch atom (mirrors BackUp.tsx Switch exactly) ────────────────

interface SettingToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
  badge?: string;
  badgeType?: 'recommended' | 'important' | 'critical';
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  checked, onChange, label, description, badge, badgeType,
}) => (
  <div className="flex items-start justify-between py-4 px-5 border-b border-[#E5E5E0] last:border-b-0 hover:bg-[#F9F9F7] transition-colors">
    <div className="flex-1 pr-6">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span
          className="font-black text-xs uppercase tracking-widest text-[#111111]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {label}
        </span>
        {badge && (
          <span
            className={`text-[0.6rem] px-2 py-0.5 font-black uppercase tracking-widest border ${
              badgeType === 'critical'
                ? 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]'
                : badgeType === 'important'
                  ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                  : 'bg-[#E5E5E0] text-[#111111] border-[#111111]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-[#525252] leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
        {description}
      </p>
    </div>

    {/* Exact Switch from BackUp.tsx */}
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className="w-14 h-7 bg-[#E5E5E0] border-2 border-[#111111] peer-focus:outline-none
                   peer-checked:after:translate-x-full after:content-['']
                   after:absolute after:top-[2px] after:left-[2px] after:bg-[#111111]
                   after:border-2 after:border-[#111111] after:h-5 after:w-6 after:transition-all
                   peer-checked:bg-[#CC0000]"
      />
    </label>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const History: React.FC = () => {
  // ── State (unchanged) ──────────────────────────────────────────────────────
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailId, setShowDetailId] = useState<string | null>(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState<boolean>(false);

  // API State
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Security Settings States
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    dataExportNotification: false,
    sessionTimeout: '30',
    passwordChangeReminder: true,
    breachMonitoring: true,
    deviceTracking: true,
    locationBasedAccess: false,
    biometricAuth: true,
  });

  const [settingsChanged, setSettingsChanged] = useState(false);

  // ── Effects & Handlers (unchanged) ────────────────────────────────────────
  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [page, filter, sortBy]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await historyAPI.getHistory({
        page,
        limit,
        type: filter !== 'all' ? filter : undefined,
        sortBy: sortBy === 'newest' ? '-createdAt' : 'createdAt',
      });
      if (response.data.success) {
        const formattedEvents = response.data.data.history.map((item: any, index: number) => ({
          id: item._id || item.id || `event-${index}-${Date.now()}`,
          date: item.timestamp || item.createdAt,
          eventType: item.type,
          description: item.description || `${item.action} ${item.type}`,
          target: item.target || item.title || 'Unknown',
          action: item.action,
          metadata: item.metadata,
          ipAddress: item.ipAddress,
          success: true,
        }));
        setHistoryEvents(formattedEvents);
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await historyAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSettingToggle = (setting: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting],
    }));
    setSettingsChanged(true);
  };

  const handleSessionTimeoutChange = (value: string) => {
    setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }));
    setSettingsChanged(true);
  };

  const handleSaveSettings = () => {
    console.log('Saving security settings:', securitySettings);
    setSettingsChanged(false);
    alert('Security settings saved successfully!');
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getEventIcon = (eventType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      password: <FaKey className="text-[#111111] w-5 h-5" />,
      document: <FaFileAlt className="text-[#111111] w-5 h-5" />,
      qrcode:   <FaCreditCard className="text-[#111111] w-5 h-5" />,
      backup:   <FaShieldAlt className="text-[#111111] w-5 h-5" />,
      login:    <FaPassport className="text-[#111111] w-5 h-5" />,
    };
    return (
      <div className="p-2.5 bg-[#F9F9F7] border-2 border-[#111111]">
        {iconMap[eventType] ?? <FaFingerprint className="text-[#111111] w-5 h-5" />}
      </div>
    );
  };

  const getSeverityColor = (action: string) => {
    switch (action) {
      case 'deleted': return 'text-[#CC0000] bg-[#F9F9F7] border-2 border-[#CC0000]';
      case 'updated': return 'text-[#111111] bg-[#E5E5E0] border-2 border-[#111111]';
      case 'created': return 'text-[#111111] bg-[#F9F9F7] border-2 border-[#111111]';
      default:        return 'text-[#111111] bg-[#F9F9F7] border-2 border-[#111111]';
    }
  };

  const getStatusBadge = (success: boolean) =>
    success ? (
      <span className="flex items-center gap-1 px-2.5 py-1 text-[0.65rem] font-black bg-[#F9F9F7] text-[#111111] border border-[#111111] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <FaCheckCircle size={10} /> SUCCESS
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2.5 py-1 text-[0.65rem] font-black bg-[#CC0000] text-[#F9F9F7] border border-[#CC0000] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <FaExclamationCircle size={10} /> FAILED
      </span>
    );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const eventTypes = [
    { id: 'all',      label: 'All Activities', icon: FaShieldAlt },
    { id: 'password', label: 'Passwords',       icon: FaKey },
    { id: 'document', label: 'Documents',       icon: FaFileAlt },
    { id: 'qrcode',   label: 'QR Codes',        icon: FaCreditCard },
    { id: 'backup',   label: 'Backups',          icon: FaShieldVirus },
    { id: 'login',    label: 'Logins',           icon: FaUserShield },
  ];

  const filteredEvents = historyEvents.filter(event => {
    if (
      searchTerm &&
      !event.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !event.target.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Animation variants (unchanged)
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="space-y-0 -mt-4 bg-[#F9F9F7]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
      }}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      {/* Mirrors BackupHeader exactly: off-white bg, border-b-4, newsprint-texture */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">

          {/* Left: editorial title block */}
          <div>
            <div
              className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SECURITY AUDIT &bull; ACTIVITY LOG
            </div>

            <h2
              className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              SECURITY<br />
              <span className="italic" style={{ color: "#CC0000" }}>TIMELINE</span>
            </h2>

            <p
              className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Monitor and track every access pattern, change, and security event to keep
              your sensitive information protected and fully auditable.
            </p>
          </div>

          {/* Right: action buttons — mirrors BackUp.tsx button pair */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
            <button
              onClick={() => setShowSecuritySettings(true)}
              className="px-6 py-4 border-2 border-[#111111] font-black uppercase text-xs tracking-widest transition-all bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] hard-shadow-hover flex items-center justify-center gap-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaLock /> SECURITY SETTINGS
            </button>

            <button
              className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaEye /> VIEW FULL LOGS
            </button>
          </div>
        </div>

        {/* Stats ticker bar — exact structure from BackupHeader */}
        <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-5 gap-0 bg-[#111111]">
          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [TOTAL EVENTS]
            </div>
            <div
              className="font-black text-[#111111] text-2xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {pagination.totalItems}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [PERIOD]
            </div>
            <div
              className="font-bold text-[#111111] text-xs flex items-center gap-1.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaCalendarAlt size={10} /> LAST 30 DAYS
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ACTIVE FILTER]
            </div>
            <div
              className="font-bold text-[#111111] text-sm uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {filter === 'all' ? 'ALL TYPES' : filter}
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [TOTAL ACTIVITIES]
            </div>
            <div
              className="font-bold text-[#111111] text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {stats ? stats.totalActivities : '—'}
            </div>
          </div>

          {/* Rightmost cell — always-visible sort toggle, mirrors SELECT ITEMS pattern */}
          <div className="col-span-2 md:col-span-1 bg-[#111111]">
            <button
              onClick={() => setSortBy(s => s === 'newest' ? 'oldest' : 'newest')}
              className="w-full h-full flex items-center justify-center gap-2 bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest p-4 hover:bg-[#CC0000] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaSort /> {sortBy === 'newest' ? 'NEWEST FIRST' : 'OLDEST FIRST'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ─────────────────────────────────────────────── */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7] overflow-hidden newsprint-texture">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

            {/* Search input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-[#111111]" />
              </div>
              <input
                type="text"
                placeholder="Search security events by description, target or location…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-b-2 border-[#111111] bg-[#F9F9F7] text-[#111111] focus:bg-[#E5E5E0] focus:outline-none transition-all font-bold"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Sort select */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#E5E5E0] border-2 border-[#111111] hover:bg-[#F9F9F7] transition-colors">
                <FaSort className="text-[#111111]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                  className="bg-transparent border-none text-xs focus:ring-0 text-[#111111] font-black uppercase tracking-widest cursor-pointer focus:outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="newest">NEWEST FIRST</option>
                  <option value="oldest">OLDEST FIRST</option>
                </select>
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border-2 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest ${
                  showFilters
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'hover:bg-[#E5E5E0] bg-[#F9F9F7] text-[#111111] border-[#111111]'
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaFilter />
                FILTERS
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#CC0000] text-[#F9F9F7] text-xs font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t-2 border-[#111111]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Event Type */}
                    <div>
                      <div
                        className="text-[0.6rem] font-black text-[#111111] uppercase tracking-widest mb-3 pb-2 border-b-2 border-[#111111]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        EVENT TYPE
                      </div>
                      <div className="space-y-2.5">
                        {eventTypes.map(type => (
                          <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-[#111111] accent-[#CC0000]"
                            />
                            <span
                              className="text-sm text-[#111111] font-bold uppercase tracking-widest group-hover:text-[#CC0000] transition-colors"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {type.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Severity */}
                    <div>
                      <div
                        className="text-[0.6rem] font-black text-[#111111] uppercase tracking-widest mb-3 pb-2 border-b-2 border-[#111111]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        SEVERITY
                      </div>
                      <div className="space-y-2.5">
                        {['High', 'Medium', 'Low'].map(lvl => (
                          <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 border-2 border-[#111111] accent-[#CC0000]" />
                            <span
                              className="text-sm text-[#111111] font-bold uppercase tracking-widest group-hover:text-[#CC0000] transition-colors"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {lvl}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <div
                        className="text-[0.6rem] font-black text-[#111111] uppercase tracking-widest mb-3 pb-2 border-b-2 border-[#111111]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        STATUS
                      </div>
                      <div className="space-y-2.5">
                        {['Success', 'Failed'].map(s => (
                          <label key={s} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 border-2 border-[#111111] accent-[#CC0000]" />
                            <span
                              className="text-sm text-[#111111] font-bold uppercase tracking-widest group-hover:text-[#CC0000] transition-colors"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {s}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors border-b-2 border-transparent hover:border-[#CC0000]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      RESET FILTERS
                    </button>
                    <button
                      className="px-6 py-2.5 bg-[#111111] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#CC0000] transition-colors border-2 border-[#111111]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      APPLY FILTERS
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category tab strip — sharp buttons on muted grey background */}
        <div className="bg-[#E5E5E0] border-t-2 border-[#111111] px-6 py-3">
          <div className="flex overflow-x-auto gap-2 pb-1">
            {eventTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className={`px-4 py-2.5 flex items-center gap-2 whitespace-nowrap transition-all border-2 font-black text-xs uppercase tracking-widest flex-shrink-0 ${
                  filter === type.id
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] border-[#111111]'
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <type.icon className={filter === type.id ? 'text-[#F9F9F7]' : 'text-[#111111]'} />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT STATES ─────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 space-y-4">

        {/* Loading */}
        {loading && page === 1 ? (
          <div className="border-4 border-[#111111] bg-[#F9F9F7] p-16 text-center newsprint-texture">
            <div className="mx-auto w-16 h-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
              <FaSpinner className="animate-spin text-2xl" />
            </div>
            <p
              className="text-[#111111] font-black uppercase tracking-widest text-xs"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              LOADING HISTORY…
            </p>
          </div>

        ) : error ? (
          /* Error state */
          <div className="border-4 border-[#CC0000] bg-[#F9F9F7] p-8 newsprint-texture">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]">
                <FaExclamationCircle className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3
                  className="font-black text-2xl text-[#CC0000] uppercase"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  ERROR LOADING HISTORY
                </h3>
                <p className="text-[#111111] mt-2 font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {error}
                </p>
                <button
                  onClick={() => fetchHistory()}
                  className="mt-5 px-6 py-3 bg-[#111111] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#CC0000] transition-colors border-2 border-[#111111]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  RETRY
                </button>
              </div>
            </div>
          </div>

        ) : filteredEvents.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-dashed border-[#111111] bg-[#F9F9F7] p-16 text-center newsprint-texture"
          >
            <div className="mx-auto w-20 h-20 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
              <FaHistory className="text-2xl" />
            </div>
            <h3
              className="text-2xl font-black text-[#111111] mb-2 uppercase tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              NO MATCHING ACTIVITY FOUND
            </h3>
            <p
              className="text-[#525252] max-w-md mx-auto mb-8 leading-relaxed"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Try adjusting your search terms or filters to view more results. Security events
              will appear here when they occur.
            </p>
            <button
              onClick={() => { setFilter('all'); setSearchTerm(''); }}
              className="px-8 py-4 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              RESET FILTERS
            </button>
          </motion.div>

        ) : (
          /* ── EVENT CARDS ─────────────────────────────────────────────────── */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredEvents.map(event => (
              <motion.div
                key={event.id}
                variants={cardVariants}
                layout
                className="border-2 border-[#111111] bg-white overflow-hidden hard-shadow-hover transition-all"
              >
                {/* Left accent stripe */}
                <div className="flex">
                  <div className={`w-1.5 flex-shrink-0 ${
                    event.action === 'deleted'              ? 'bg-[#CC0000]' :
                    event.action === 'updated'              ? 'bg-[#E5E5E0]' :
                    event.eventType === 'login'             ? 'bg-[#111111]' :
                    'bg-[#111111]'
                  }`} />

                  <div className="flex-1">
                    <div className="p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                        {/* Icon + metadata */}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getEventIcon(event.eventType)}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Badge row */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className="text-[0.6rem] font-black bg-[#E5E5E0] px-2 py-1 text-[#111111] uppercase tracking-widest"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {formatDate(event.date)}
                              </span>

                              {event.action && (
                                <span
                                  className={`px-2 py-1 text-[0.6rem] font-black uppercase tracking-widest ${getSeverityColor(event.action)}`}
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  {event.action}
                                </span>
                              )}

                              {getStatusBadge(event.success)}

                              <span
                                className="text-[0.6rem] font-black px-2 py-1 border-2 border-[#CC0000] text-[#CC0000] uppercase tracking-widest"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {event.eventType}
                              </span>
                            </div>

                            {/* Title & target */}
                            <h3
                              className="font-black text-[#111111] text-lg leading-tight"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {event.description}
                            </h3>
                            <p
                              className="text-[#525252] mt-1 border-l-2 border-[#CC0000] pl-2"
                              style={{ fontFamily: "'Lora', serif" }}
                            >
                              {event.target}
                            </p>

                            {/* Metadata chips */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {event.metadata?.device && (
                                <div
                                  className="flex items-center gap-1.5 text-[0.65rem] text-[#111111] bg-[#E5E5E0] px-2.5 py-1.5 border border-[#111111] uppercase tracking-widest font-bold"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  <FaDesktop size={10} /> {event.metadata.device}
                                </div>
                              )}
                              {event.ipAddress && (
                                <div
                                  className="flex items-center gap-1.5 text-[0.65rem] text-[#111111] bg-[#E5E5E0] px-2.5 py-1.5 border border-[#111111] uppercase tracking-widest font-bold"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  <FaGlobe size={10} /> {event.ipAddress}
                                </div>
                              )}
                              {event.metadata?.location && (
                                <div
                                  className="flex items-center gap-1.5 text-[0.65rem] text-[#111111] bg-[#E5E5E0] px-2.5 py-1.5 border border-[#111111] uppercase tracking-widest font-bold"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  <FaCalendarAlt size={10} /> {event.metadata.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detail toggle button */}
                        <button
                          onClick={() => setShowDetailId(showDetailId === event.id ? null : event.id)}
                          className={`self-start flex items-center gap-2 px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-colors border-2 flex-shrink-0 ${
                            showDetailId === event.id
                              ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                              : 'bg-[#E5E5E0] hover:bg-[#111111] hover:text-[#F9F9F7] text-[#111111] border-[#111111]'
                          }`}
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {showDetailId === event.id ? 'HIDE' : 'DETAILS'}
                          <FaChevronDown
                            className={`transition-transform duration-200 ${showDetailId === event.id ? 'rotate-180' : ''}`}
                            size={10}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ── DETAIL EXPAND PANEL ───────────────────────────── */}
                    <AnimatePresence>
                      {showDetailId === event.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden border-t-2 border-[#111111] bg-[#F9F9F7] newsprint-texture"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                            {/* Event Details cell */}
                            <div className="border-b-2 md:border-b-0 md:border-r-2 border-[#111111]">
                              {/* Cell header */}
                              <div className="bg-[#111111] text-[#F9F9F7] px-5 py-3 flex items-center gap-2">
                                <FaShieldAlt size={12} className="text-[#CC0000]" />
                                <span
                                  className="text-[0.6rem] font-black uppercase tracking-widest"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  EVENT DETAILS
                                </span>
                              </div>

                              {/* Cell body */}
                              <div className="p-5">
                                <dl className="space-y-3">
                                  {[
                                    { dt: 'EVENT ID',   dd: event.id,        mono: true },
                                    { dt: 'EVENT TYPE', dd: event.eventType,  mono: false },
                                    { dt: 'ACTION',     dd: event.action,     mono: false },
                                    { dt: 'DATE & TIME',dd: event.date,       mono: false },
                                  ].map(({ dt, dd, mono }) => (
                                    <div key={dt} className="flex gap-4">
                                      <dt
                                        className="w-28 flex-shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-[#525252]"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        {dt}
                                      </dt>
                                      <dd
                                        className={`text-sm font-bold text-[#111111] capitalize break-all ${
                                          mono ? 'font-mono bg-[#E5E5E0] px-2 py-0.5 text-xs' : ''
                                        }`}
                                        style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif" }}
                                      >
                                        {dd}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            </div>

                            {/* Access Information cell */}
                            <div>
                              {/* Cell header */}
                              <div className="bg-[#111111] text-[#F9F9F7] px-5 py-3 flex items-center gap-2">
                                <FaUserShield size={12} className="text-[#CC0000]" />
                                <span
                                  className="text-[0.6rem] font-black uppercase tracking-widest"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  ACCESS INFORMATION
                                </span>
                              </div>

                              {/* Cell body */}
                              <div className="p-5">
                                <dl className="space-y-3">
                                  {event.metadata?.device && (
                                    <div className="flex gap-4">
                                      <dt
                                        className="w-28 flex-shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-[#525252]"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        DEVICE
                                      </dt>
                                      <dd
                                        className="text-sm font-bold text-[#111111]"
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                      >
                                        {event.metadata.device}
                                      </dd>
                                    </div>
                                  )}
                                  {event.ipAddress && (
                                    <div className="flex gap-4">
                                      <dt
                                        className="w-28 flex-shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-[#525252]"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        IP ADDRESS
                                      </dt>
                                      <dd
                                        className="text-sm font-bold text-[#111111] font-mono bg-[#E5E5E0] px-2 py-0.5"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        {event.ipAddress}
                                      </dd>
                                    </div>
                                  )}
                                  {event.metadata?.location && (
                                    <div className="flex gap-4">
                                      <dt
                                        className="w-28 flex-shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-[#525252]"
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        LOCATION
                                      </dt>
                                      <dd
                                        className="text-sm font-bold text-[#111111]"
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                      >
                                        {event.metadata.location}
                                      </dd>
                                    </div>
                                  )}
                                  <div className="flex gap-4">
                                    <dt
                                      className="w-28 flex-shrink-0 text-[0.6rem] font-black uppercase tracking-widest text-[#525252]"
                                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                    >
                                      STATUS
                                    </dt>
                                    <dd>
                                      <span
                                        className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 border ${
                                          event.success
                                            ? 'bg-[#F9F9F7] text-[#111111] border-[#111111]'
                                            : 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]'
                                        }`}
                                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                      >
                                        {event.success ? 'SUCCESSFUL' : 'FAILED'}
                                      </span>
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </div>

                          {/* Detail footer — "View complete details" link */}
                          <div className="border-t-2 border-[#111111] px-5 py-3 bg-[#E5E5E0] flex justify-end">
                            <button
                              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors border-b-2 border-[#111111] hover:border-[#CC0000] pb-0.5"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              VIEW COMPLETE DETAILS <FaAngleRight size={12} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* ── LOAD MORE ──────────────────────────────────────────────── */}
            {filteredEvents.length > 0 && pagination.hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-4 border-2 border-[#111111] text-[#111111] bg-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hard-shadow-hover"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {loading ? (
                    <><FaSpinner className="animate-spin" /> LOADING…</>
                  ) : (
                    <><FaHistory /> LOAD MORE ACTIVITY</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── SECURITY SETTINGS MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSecuritySettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSecuritySettings(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col newsprint-texture"
            >

              {/* Modal Header — inverted black, exact RecoveryPanel pattern */}
              <div className="bg-[#111111] text-[#F9F9F7] p-6 border-b-4 border-[#CC0000] flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-5">
                  <div className="p-3 border-2 border-[#F9F9F7]">
                    <FaShieldAlt className="h-6 w-6 text-[#F9F9F7]" />
                  </div>
                  <div>
                    <h3
                      className="text-2xl font-black uppercase tracking-tight text-[#F9F9F7]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Security Settings
                    </h3>
                    <p
                      className="text-[#A3A3A3] text-sm mt-0.5"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      Configure your security preferences and access controls
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSecuritySettings(false)}
                  className="p-2 border border-[#404040] text-[#F9F9F7] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">

                {/* ── AUTHENTICATION & ACCESS SECTION ── */}
                <div className="border-2 border-[#111111]">
                  {/* Section header — inverted */}
                  <div className="bg-[#111111] text-[#F9F9F7] px-5 py-4 flex items-center gap-3 border-b-2 border-[#111111]">
                    <div className="p-2 border border-[#404040]">
                      <FaKey className="text-[#CC0000]" />
                    </div>
                    <span
                      className="font-black text-xs uppercase tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Authentication & Access
                    </span>
                  </div>

                  {/* Toggles */}
                  <div className="bg-white divide-y-0">
                    <SettingToggle
                      checked={securitySettings.twoFactorAuth}
                      onChange={() => handleSettingToggle('twoFactorAuth')}
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security with 2FA"
                      badge="Recommended"
                      badgeType="recommended"
                    />
                    <SettingToggle
                      checked={securitySettings.biometricAuth}
                      onChange={() => handleSettingToggle('biometricAuth')}
                      label="Biometric Authentication"
                      description="Use fingerprint or face recognition to sign in"
                    />
                    <SettingToggle
                      checked={securitySettings.locationBasedAccess}
                      onChange={() => handleSettingToggle('locationBasedAccess')}
                      label="Location-Based Access"
                      description="Restrict access from specific geographic locations"
                    />

                    {/* Session Timeout — special input row */}
                    <div className="py-4 px-5 border-t border-[#E5E5E0]">
                      <div
                        className="text-[0.6rem] font-black uppercase tracking-widest text-[#111111] mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        SESSION TIMEOUT
                      </div>
                      <p
                        className="text-sm text-[#525252] mb-3"
                        style={{ fontFamily: "'Lora', serif" }}
                      >
                        Auto logout after period of inactivity
                      </p>
                      <div className="relative">
                        <select
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => handleSessionTimeoutChange(e.target.value)}
                          className="w-full border-2 border-[#111111] bg-white text-[#111111] font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-1 appearance-none cursor-pointer"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="never">Never</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          <FaChevronDown size={10} className="text-[#111111]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ALERTS & NOTIFICATIONS SECTION ── */}
                <div className="border-2 border-[#111111]">
                  <div className="bg-[#111111] text-[#F9F9F7] px-5 py-4 flex items-center gap-3 border-b-2 border-[#111111]">
                    <div className="p-2 border border-[#404040]">
                      <FaBell className="text-[#CC0000]" />
                    </div>
                    <span
                      className="font-black text-xs uppercase tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Alerts & Notifications
                    </span>
                  </div>

                  <div className="bg-white divide-y-0">
                    <SettingToggle
                      checked={securitySettings.loginNotifications}
                      onChange={() => handleSettingToggle('loginNotifications')}
                      label="Login Notifications"
                      description="Get notified when someone logs into your account"
                    />
                    <SettingToggle
                      checked={securitySettings.suspiciousActivityAlerts}
                      onChange={() => handleSettingToggle('suspiciousActivityAlerts')}
                      label="Suspicious Activity Alerts"
                      description="Receive alerts for unusual account activity"
                      badge="Important"
                      badgeType="important"
                    />
                    <SettingToggle
                      checked={securitySettings.dataExportNotification}
                      onChange={() => handleSettingToggle('dataExportNotification')}
                      label="Data Export Notification"
                      description="Alert when your data is exported or downloaded"
                    />
                    <SettingToggle
                      checked={securitySettings.passwordChangeReminder}
                      onChange={() => handleSettingToggle('passwordChangeReminder')}
                      label="Password Change Reminder"
                      description="Remind to update passwords periodically"
                    />
                  </div>
                </div>

                {/* ── SECURITY MONITORING SECTION ── */}
                <div className="border-2 border-[#111111]">
                  <div className="bg-[#111111] text-[#F9F9F7] px-5 py-4 flex items-center gap-3 border-b-2 border-[#111111]">
                    <div className="p-2 border border-[#404040]">
                      <FaShieldVirus className="text-[#CC0000]" />
                    </div>
                    <span
                      className="font-black text-xs uppercase tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Security Monitoring
                    </span>
                  </div>

                  <div className="bg-white divide-y-0">
                    <SettingToggle
                      checked={securitySettings.breachMonitoring}
                      onChange={() => handleSettingToggle('breachMonitoring')}
                      label="Breach Monitoring"
                      description="Monitor for data breaches and compromised credentials"
                      badge="Critical"
                      badgeType="critical"
                    />
                    <SettingToggle
                      checked={securitySettings.deviceTracking}
                      onChange={() => handleSettingToggle('deviceTracking')}
                      label="Device Tracking"
                      description="Track and manage devices that access your account"
                    />
                  </div>
                </div>

                {/* Unsaved Changes Warning — mirrors ErrorDisplay red border pattern */}
                <AnimatePresence>
                  {settingsChanged && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border-4 border-[#CC0000] bg-[#F9F9F7] p-5 flex items-start gap-4"
                    >
                      <div className="p-3 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] flex-shrink-0">
                        <FaExclamation className="h-4 w-4" />
                      </div>
                      <div>
                        <h5
                          className="font-black uppercase tracking-tight text-[#CC0000]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          UNSAVED CHANGES
                        </h5>
                        <p
                          className="text-sm text-[#111111] mt-1"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          You have unsaved changes. Click <strong>"SAVE SETTINGS"</strong> to apply them.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Modal Footer — sharp buttons, exact BackUp.tsx action footer pattern */}
              <div className="bg-[#E5E5E0] border-t-4 border-[#111111] p-6 flex justify-between items-center flex-shrink-0">
                <button
                  onClick={() => setShowSecuritySettings(false)}
                  className="px-6 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  CANCEL
                </button>

                <button
                  onClick={handleSaveSettings}
                  disabled={!settingsChanged}
                  className={`px-8 py-3 font-black uppercase text-xs tracking-widest transition-colors flex items-center gap-2 border-2 ${
                    settingsChanged
                      ? 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000] hover:bg-[#990000] hover:border-[#990000]'
                      : 'bg-[#E5E5E0] text-[#525252] border-[#E5E5E0] cursor-not-allowed'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <FaSave />
                  SAVE SETTINGS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default History;