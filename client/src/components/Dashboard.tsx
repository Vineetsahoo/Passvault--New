import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollButton from './ScrollButton';
import Passwords from './dashboard/Passwords';
import History from './dashboard/History';
import Notifications from './dashboard/Notifications';
import Settings from './dashboard/Settings';
import BackUp from './dashboard/BackUp';
import Transactions from './dashboard/Transactions';
import UserProfile from './dashboard/UserProfile';
import Monitoring from './dashboard/Monitoring';
import {
  FaHome, FaBell, FaCog, FaChartBar, FaBookmark,
  FaQuestionCircle, FaSignOutAlt, FaBars, FaTimes, FaUser,
  FaLock, FaHistory, FaSync, FaSearch, FaShieldAlt, FaChartLine, FaKey, FaExclamationCircle,
  FaExclamation, FaCheckCircle, FaDatabase, FaUserCircle,
  FaFingerprint, FaShieldVirus, FaUserSecret, FaPassport,
  FaIdBadge, FaFileContract, FaUnlock, FaLockOpen, FaPlus, FaDice, FaFileImport, FaCheck,
  FaExclamationTriangle, FaChevronRight, FaChevronDown, FaQrcode, FaArrowRight, FaBolt,
  FaSave, FaPalette, FaEyeSlash, FaEye, FaToggleOn, FaToggleOff, FaInfoCircle
} from 'react-icons/fa';
import { FaSquarePollHorizontal, FaEllipsis } from 'react-icons/fa6';
import { monitoringAPI, historyAPI, deviceAPI, backupAPI, sharingAPI, passwordAPI } from '../services/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SubMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  notification?: number;
  component: React.ReactNode;
  subMenu?: SubMenuItem[];
  description?: string;
}

interface DashboardStats {
  totalPasswords: number;
  strongPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  securityScore: number;
  breachedAccounts: number;
  lastBackup: string;
  profileCompletion: number;
  passwordsExpiringSoon: number;
  lastPasswordChange: string;
  securityIncidents: number;
  masterPasswordStrength: number;
  twoFactorEnabled: boolean;
  credentialsShared: number;
}

interface RecentActivity {
  id: string;
  type: 'login' | 'password_change' | 'sync' | 'security_alert';
  description: string;
  timestamp: string;
}

interface SecurityAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
}

interface PasswordActivity {
  id: string;
  type: 'creation' | 'modification' | 'access' | 'sharing' | 'breach';
  credential: string;
  action: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

interface ActivityItem {
  id: string;
  type: 'password_change' | 'login' | 'security_alert' | 'sync' | 'share' | 'backup' | 'export';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  severity?: 'low' | 'medium' | 'high';
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

// ─── Newsprint Switch Component ──────────────────────────────────────────────

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-14 h-7 bg-[#E5E5E0] border-2 border-[#111111] peer-focus:outline-none
                   peer-checked:after:translate-x-full after:content-['']
                   after:absolute after:top-[2px] after:left-[2px] after:bg-[#111111]
                   after:border-2 after:border-[#111111] after:h-5 after:w-6 after:transition-all
                   peer-checked:bg-[#CC0000]"></div>
    {label && (
      <span className="ml-3 text-xs font-black uppercase tracking-widest text-[#111111]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    )}
  </label>
);

// ─── Sidebar Item ─────────────────────────────────────────────────────────────

const SidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  notification?: number;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, notification, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center w-full p-3 transition-all duration-200 group relative border-l-4 ${isActive
      ? 'bg-[#111111] text-[#F9F9F7] border-l-[#CC0000]'
      : 'text-[#111111] hover:bg-[#E5E5E0] border-l-transparent'
      }`}
  >
    <div className={`flex items-center justify-center w-8 h-8 mr-3 border ${isActive
      ? 'border-[#F9F9F7] bg-transparent'
      : 'border-[#111111] bg-[#F9F9F7] group-hover:bg-[#111111] group-hover:text-[#F9F9F7] group-hover:border-[#111111]'
      }`}>
      <Icon className="text-base" />
    </div>
    <span className="text-xs font-black uppercase tracking-widest"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {label}
    </span>
    {notification && (
      <div className={`ml-auto flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-black ${isActive ? 'bg-[#CC0000] text-[#F9F9F7]' : 'bg-[#CC0000] text-[#F9F9F7]'
        }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {notification}
      </div>
    )}
  </motion.button>
);

// ─── Sidebar Profile ──────────────────────────────────────────────────────────

const SidebarProfile: React.FC<{
  profile: UserProfile;
  onClick: () => void;
  isActive: boolean;
  onLogout: () => void;
}> = ({ profile, onClick, isActive, onLogout }) => (
  <div className="mt-auto pt-4 space-y-3 border-t-4 border-[#111111]">
    <div className="border-2 border-[#111111] bg-[#F9F9F7]">
      <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 p-4 ${isActive ? 'bg-[#E5E5E0]' : 'hover:bg-[#E5E5E0]'
          } transition-colors`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 border-2 border-[#111111] bg-[#F9F9F7] flex items-center justify-center text-[#111111] text-lg font-black"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border border-[#111111] bg-[#CC0000]"></div>
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <div className="text-sm font-black text-[#111111] truncate"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile.name}
          </div>
          <div className="text-[10px] uppercase tracking-widest font-mono text-[#525252] truncate">
            {profile.email}
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 border-t-2 border-[#111111] ${isActive ? 'max-h-24' : 'max-h-0'
        }`}>
        <div className="p-3 space-y-1">
          <button className="w-full text-left text-[10px] text-[#111111] hover:bg-[#E5E5E0] font-black uppercase tracking-widest p-2 flex items-center"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaUserCircle className="mr-2" /> VIEW PROFILE
          </button>
          <button className="w-full text-left text-[10px] text-[#111111] hover:bg-[#E5E5E0] font-black uppercase tracking-widest p-2 flex items-center"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaCog className="mr-2" /> SETTINGS
          </button>
        </div>
      </div>
    </div>

    <button
      onClick={onLogout}
      className="flex items-center w-full p-4 text-[#F9F9F7] bg-[#111111] border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <FaSignOutAlt className="mr-3" />
      <span>LOGOUT</span>
    </button>
  </div>
);

// ─── Quick Action Button ──────────────────────────────────────────────────────

const QuickActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  color: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7]
      transition-all duration-200 group hover:shadow-[4px_4px_0px_0px_#111111]
      hover:-translate-x-0.5 hover:-translate-y-0.5"
  >
    <div className="flex flex-col items-center text-center">
      <div className="p-3 mb-3 border border-[#111111] group-hover:border-[#F9F9F7]">
        <Icon className="w-6 h-6 text-[#111111] group-hover:text-[#F9F9F7]" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    </div>
  </button>
);

// ─── Stats Card ───────────────────────────────────────────────────────────────

const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
  color?: string;
  alert?: boolean;
}> = ({ title, value, icon: Icon, description, trend, alert = false }) => (
  <div className="p-6 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#E5E5E0] transition-colors
    hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 border ${alert ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#111111]'} bg-[#F9F9F7] text-[#111111]`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend !== undefined && (
        <div className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest border ${trend > 0 ? 'border-[#CC0000] text-[#CC0000] bg-red-50' : 'border-[#111111] text-[#111111]'
          }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {trend > 0 ? `+${trend}` : trend}
        </div>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-3xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
        {value}
      </h3>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#525252] mt-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-[#A3A3A3] mt-2" style={{ fontFamily: "'Lora', serif" }}>
          {description}
        </p>
      )}
    </div>
  </div>
);

// ─── Activity Feed Item ───────────────────────────────────────────────────────

const ActivityFeedItem: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
  const severityBorder = {
    high: 'border-l-[#CC0000]',
    medium: 'border-l-[#525252]',
    low: 'border-l-[#111111]',
  };

  return (
    <div className={`p-4 border-b-2 border-[#E5E5E0] hover:bg-[#E5E5E0] transition-colors border-l-4 ${activity.severity ? severityBorder[activity.severity] : 'border-l-[#111111]'
      }`}>
      <div className="flex items-start space-x-4">
        <div className={`p-2 border-2 flex-shrink-0 ${activity.severity === 'high' ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#111111] text-[#111111]'
          }`}>
          <activity.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-black text-[#111111] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                {activity.title}
              </h4>
              <p className="text-xs text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>
                {activity.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activity.severity === 'high' && (
                <span className="text-[9px] px-2 py-0.5 border border-[#CC0000] text-[#CC0000] font-black uppercase tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  URGENT
                </span>
              )}
              <span className="text-[10px] uppercase tracking-widest font-mono text-[#A3A3A3] whitespace-nowrap">
                {activity.timestamp}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────

const SidebarToggle: React.FC<{ isExpanded: boolean; onClick: () => void }> = ({ isExpanded, onClick }) => (
  <button
    onClick={onClick}
    className="p-3 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 group"
    aria-label={isExpanded ? 'Close sidebar' : 'Open sidebar'}
  >
    <div className="w-6 h-5 flex flex-col justify-between relative">
      <div className={`w-6 h-0.5 bg-[#111111] group-hover:bg-[#F9F9F7] transition-transform origin-center ${isExpanded ? 'rotate-45 translate-y-[9px]' : ''
        }`} />
      <div className={`w-6 h-0.5 bg-[#111111] group-hover:bg-[#F9F9F7] transition-opacity ${isExpanded ? 'opacity-0' : 'opacity-100'
        }`} />
      <div className={`w-6 h-0.5 bg-[#111111] group-hover:bg-[#F9F9F7] transition-transform origin-center ${isExpanded ? '-rotate-45 -translate-y-[9px]' : ''
        }`} />
    </div>
  </button>
);

// ─── Dashboard Home ───────────────────────────────────────────────────────────

const DashboardHome: React.FC<{
  dashboardStats: DashboardStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentActivities: ActivityItem[];
  onNavigate: (path: string) => void;
}> = ({ dashboardStats, searchQuery, setSearchQuery, recentActivities, onNavigate }) => {
  const navigate = useNavigate();

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizationSettings, setCustomizationSettings] = useState({
    showQuickActions: true,
    showPasswordStats: true,
    showSecurityAlerts: true,
    showProfileCompletion: true,
    showRecentActivity: true,
    compactMode: false,
    darkModePreview: false,
    animationsEnabled: true,
    quickActionsLayout: 'grid' as 'grid' | 'list',
    theme: 'default' as 'default' | 'minimal' | 'vibrant'
  });
  const [settingsChanged, setSettingsChanged] = useState(false);

  const handleCustomizationToggle = (setting: keyof typeof customizationSettings) => {
    setCustomizationSettings(prev => ({
      ...prev,
      [setting]: typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting]
    }));
    setSettingsChanged(true);
  };

  const handleLayoutChange = (layout: 'grid' | 'list') => {
    setCustomizationSettings(prev => ({ ...prev, quickActionsLayout: layout }));
    setSettingsChanged(true);
  };

  const handleThemeChange = (theme: 'default' | 'minimal' | 'vibrant') => {
    setCustomizationSettings(prev => ({ ...prev, theme }));
    setSettingsChanged(true);
  };

  const handleSaveCustomization = () => {
    localStorage.setItem('dashboardCustomization', JSON.stringify(customizationSettings));
    setSettingsChanged(false);
    alert('Dashboard customization saved successfully!');
    setShowCustomizeModal(false);
  };

  const handleResetCustomization = () => {
    setCustomizationSettings({
      showQuickActions: true,
      showPasswordStats: true,
      showSecurityAlerts: true,
      showProfileCompletion: true,
      showRecentActivity: true,
      compactMode: false,
      darkModePreview: false,
      animationsEnabled: true,
      quickActionsLayout: 'grid',
      theme: 'default'
    });
    setSettingsChanged(true);
  };

  const handleBackupNowClick = () => onNavigate('backup');

  const securityScoreLabel =
    dashboardStats.securityScore > 80 ? 'STRONG' :
      dashboardStats.securityScore > 60 ? 'FAIR' : 'WEAK';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).toUpperCase();

  return (
    <div
      className="space-y-0 -mt-4"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}
    >

      {/* ── HERO EDITORIAL BANNER ── */}
      <section className="border-b-4 border-[#111111]">
        {/* Masthead strip */}
        <div className="bg-[#111111] px-6 py-3 flex items-center justify-between border-b-2 border-[#CC0000]">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A3A3A3]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {today}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A3A3A3]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            SECURE VAULT EDITION
          </span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#CC0000]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A3A3A3]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ENCRYPTED
            </span>
          </div>
        </div>

        {/* Main hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#F9F9F7]">
          {/* Left – Welcome headline */}
          <div className="lg:col-span-8 p-8 border-r-0 lg:border-r-4 border-[#111111] border-b-4 lg:border-b-0">
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#525252]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ■ DASHBOARD OVERVIEW
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-[#111111] leading-[0.9] tracking-tighter mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              WELCOME<br />
              <span className="italic" style={{ color: "#CC0000" }}>BACK</span>
            </h1>
            <p className="text-base text-[#525252] mb-8 max-w-lg" style={{ fontFamily: "'Lora', serif" }}>
              All your credentials, monitored and secured in a single encrypted vault.
            </p>
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="SEARCH PASSWORDS, NOTES, OR CARDS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-12 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111]
                  placeholder-[#A3A3A3] focus:outline-none focus:border-[#CC0000] transition-colors
                  text-xs font-mono uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#A3A3A3]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                CTRL+K
              </div>
            </div>
          </div>

          {/* Right – Security Score + quick stats */}
          <div className="lg:col-span-4 flex flex-col divide-y-2 divide-[#111111]">
            {/* Security score block */}
            <div className="p-6 bg-[#111111] flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A3A3A3] block mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                SECURITY SCORE
              </span>
              <div className="flex items-end gap-4 mb-4">
                <span className="text-6xl font-black text-[#F9F9F7] leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {dashboardStats.securityScore}
                </span>
                <div className="pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F9F9F7]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    /100
                  </span>
                  <div className={`mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${dashboardStats.securityScore > 80 ? 'bg-[#F9F9F7] text-[#111111]' :
                    dashboardStats.securityScore > 60 ? 'bg-[#525252] text-[#F9F9F7]' :
                      'bg-[#CC0000] text-[#F9F9F7]'
                    }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {securityScoreLabel}
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-[#333333] border border-[#525252]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboardStats.securityScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full ${dashboardStats.securityScore > 80 ? 'bg-[#F9F9F7]' :
                    dashboardStats.securityScore > 60 ? 'bg-[#A3A3A3]' : 'bg-[#CC0000]'
                    }`}
                />
              </div>
            </div>

            {/* Two small stats */}
            <div className="grid grid-cols-2 divide-x-2 divide-[#111111]">
              <div className="p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#525252] block mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  PASSWORDS
                </span>
                <span className="text-3xl font-black text-[#111111]"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {dashboardStats.totalPasswords}
                </span>
              </div>
              <div className="p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#525252] block mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ALERTS
                </span>
                <span className={`text-3xl font-black ${dashboardStats.securityIncidents > 0 ? 'text-[#CC0000]' : 'text-[#111111]'
                  }`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  {dashboardStats.securityIncidents}
                </span>
              </div>
            </div>

            {/* Last backup */}
            <div className="p-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#525252]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                LAST BACKUP
              </span>
              <span className="text-xs font-black text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {dashboardStats.lastBackup}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      {customizationSettings.showQuickActions && (
        <section className="border-b-4 border-[#111111]">
          {/* Section header */}
          <div className="bg-[#E5E5E0] border-b-4 border-[#111111] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#111111]"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                QUICK ACTIONS
              </h2>
            </div>
            <button
              onClick={() => setShowCustomizeModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-xs font-black uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <FaCog className="w-3 h-3" />
              CUSTOMIZE
            </button>
          </div>

          {/* Action grid - 4 columns, newspaper layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x-2 divide-[#111111]">

            {/* QR Scanner – spanning 2 rows visually via padding */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/features/qr-scan')}
              className="col-span-2 md:col-span-2 p-8 bg-[#111111] text-[#F9F9F7] border-b-2 md:border-b-0 border-[#F9F9F7]
                hover:bg-[#CC0000] transition-colors group text-left min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <FaQrcode className="w-10 h-10" />
                  <FaArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-2xl font-black mb-2 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  QR SCANNER
                </h3>
                <p className="text-sm text-[#A3A3A3] group-hover:text-[#F9F9F7]"
                  style={{ fontFamily: "'Lora', serif" }}>
                  Scan codes to access credentials instantly.
                </p>
              </div>
              <div className="flex gap-4 mt-6">
                {['∞ SCANS', '✓ SECURE', '⚡ FAST'].map((stat) => (
                  <span key={stat} className="text-[10px] font-black uppercase tracking-widest border border-[#525252] group-hover:border-[#F9F9F7] px-2 py-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {stat}
                  </span>
                ))}
              </div>
            </motion.button>

            {/* Right column – 4 smaller action cards */}
            <div className="col-span-2 grid grid-cols-2 divide-x-2 divide-y-2 divide-[#111111]">

              {/* Security Scan */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/features/secure-storage')}
                className="p-6 bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors group text-left
                  hover:shadow-[4px_4px_0px_0px_#CC0000] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <FaShieldAlt className="w-6 h-6 text-[#CC0000] mb-3 group-hover:text-[#CC0000]" />
                <h4 className="text-sm font-black uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  SECURITY SCAN
                </h4>
                <p className="text-xs text-[#525252] group-hover:text-[#A3A3A3]"
                  style={{ fontFamily: "'Lora', serif" }}>
                  Detect threats in real-time.
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#CC0000]"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#CC0000] group-hover:text-[#CC0000]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    SCANNING
                  </span>
                </div>
              </motion.button>

              {/* Quick Sync */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/features/sync')}
                className="p-6 bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors group text-left
                  hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <FaSync className="w-6 h-6 text-[#111111] mb-3 group-hover:text-[#F9F9F7]" />
                <h4 className="text-sm font-black uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  QUICK SYNC
                </h4>
                <p className="text-xs text-[#525252] group-hover:text-[#A3A3A3]"
                  style={{ fontFamily: "'Lora', serif" }}>
                  Sync across all devices.
                </p>
                <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  LAST: 2M AGO
                </div>
              </motion.button>

              {/* Import/Export */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('backup')}
                className="p-6 bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors group text-left
                  hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <FaFileImport className="w-6 h-6 text-[#111111] mb-3 group-hover:text-[#F9F9F7]" />
                <h4 className="text-sm font-black uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  IMPORT/EXPORT
                </h4>
                <p className="text-xs text-[#525252] group-hover:text-[#A3A3A3]"
                  style={{ fontFamily: "'Lora', serif" }}>
                  Backup & migrate data.
                </p>
                <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  156 ITEMS READY
                </div>
              </motion.button>

              {/* Add Password */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('passwords')}
                className="p-6 bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors group text-left
                  hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <FaPlus className="w-6 h-6 text-[#111111] mb-3 group-hover:text-[#F9F9F7]" />
                <h4 className="text-sm font-black uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ADD PASSWORD
                </h4>
                <p className="text-xs text-[#525252] group-hover:text-[#A3A3A3]"
                  style={{ fontFamily: "'Lora', serif" }}>
                  Create secure credentials.
                </p>
                <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-[#111111] group-hover:text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  QUICK CREATE →
                </div>
              </motion.button>
            </div>
          </div>

          {/* Bottom row: Multi-device / Alerts / Pass Sharing */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-t-2 border-[#111111] divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#111111]">
            {[
              {
                icon: FaSync, label: 'MULTI DEVICE', sub: '5 DEVICES CONNECTED',
                desc: 'Access your vault on any device.',
                onClick: () => navigate('/features/multi-device')
              },
              {
                icon: FaBell, label: 'ALERTS', sub: `${dashboardStats.securityIncidents} ACTIVE`,
                desc: 'Security notifications & breach alerts.',
                onClick: () => navigate('/features/alerts'),
                urgent: dashboardStats.securityIncidents > 0
              },
              {
                icon: FaFileContract, label: 'PASS SHARING', sub: `${dashboardStats.credentialsShared} SHARED`,
                desc: 'Securely share credentials.',
                onClick: () => navigate('/features/sharing')
              },
            ].map(({ icon: Icon, label, sub, desc, onClick, urgent }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={`p-6 text-left flex items-start gap-4 hover:bg-[#E5E5E0] transition-colors group
                  hover:shadow-[inset_4px_0px_0px_0px_#111111]`}
              >
                <div className={`p-3 border-2 flex-shrink-0 ${urgent ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#111111] text-[#111111]'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {label}
                  </h4>
                  <p className="text-xs text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>{desc}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest mt-2 block ${urgent ? 'text-[#CC0000]' : 'text-[#A3A3A3]'
                    }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {sub}
                  </span>
                </div>
                <FaArrowRight className="ml-auto text-[#A3A3A3] group-hover:text-[#111111] flex-shrink-0 mt-1" />
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* ── PASSWORD STATUS STATS ── */}
      {customizationSettings.showPasswordStats && (
        <section className="border-b-4 border-[#111111]">
          <div className="bg-[#E5E5E0] border-b-4 border-[#111111] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#111111]"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                PASSWORD STATUS
              </h2>
            </div>
            <button
              className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors"
              onClick={() => onNavigate('passwords')}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              MANAGE ALL <FaChevronRight className="ml-1" size={10} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x-0 lg:divide-x-2 divide-y-2 lg:divide-y-0 divide-[#111111]">
            <StatsCard
              title="Total Passwords"
              value={dashboardStats.totalPasswords}
              icon={FaKey}
              description="5 categories"
              trend={5}
            />
            <StatsCard
              title="Strong Passwords"
              value={dashboardStats.strongPasswords}
              icon={FaShieldAlt}
              description="Secure & robust"
            />
            <StatsCard
              title="Weak Passwords"
              value={dashboardStats.weakPasswords}
              icon={FaExclamationTriangle}
              description="Need attention"
              trend={-2}
              alert={dashboardStats.weakPasswords > 0}
            />
            <StatsCard
              title="Reused Passwords"
              value={dashboardStats.reusedPasswords}
              icon={FaSync}
              description="Multiple accounts"
              trend={2}
              alert={dashboardStats.reusedPasswords > 0}
            />
          </div>
        </section>
      )}

      {/* ── SECURITY STATUS + BACKUP ── */}
      {customizationSettings.showSecurityAlerts && (
        <section className="border-b-4 border-[#111111]">
          <div className="bg-[#E5E5E0] border-b-4 border-[#111111] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#CC0000]"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                SECURITY STATUS
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#111111]">
            {/* Security Alerts Panel */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 border-2 ${dashboardStats.securityIncidents > 0 ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#111111] text-[#111111]'}`}>
                    <FaExclamationCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Security Alerts
                    </h3>
                    <p className="text-xs text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                      Risk assessment & threats
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 ${dashboardStats.securityIncidents > 0
                  ? 'border-[#CC0000] text-[#CC0000]'
                  : 'border-[#111111] text-[#111111]'
                  }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {dashboardStats.securityIncidents > 0 ? 'ACTION NEEDED' : 'ALL CLEAR'}
                </span>
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className={`text-5xl font-black ${dashboardStats.securityIncidents > 0 ? 'text-[#CC0000]' : 'text-[#111111]'}`}
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {dashboardStats.securityIncidents}
                </span>
                <span className="text-base font-black text-[#525252] pb-1"
                  style={{ fontFamily: "'Lora', serif" }}>
                  incidents
                </span>
              </div>

              <div className="space-y-3">
                {dashboardStats.breachedAccounts > 0 && (
                  <div className="border-l-4 border-[#CC0000] p-4 bg-[#F9F9F7] border border-[#CC0000]">
                    <div className="flex items-start gap-3">
                      <FaExclamation className="text-[#CC0000] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-black text-[#CC0000] text-sm"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          DATA BREACH ALERT
                        </div>
                        <p className="text-xs text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>
                          {dashboardStats.breachedAccounts} {dashboardStats.breachedAccounts === 1 ? 'account' : 'accounts'} found in data breaches
                        </p>
                      </div>
                      <button className="text-xs font-black uppercase tracking-widest text-[#CC0000] hover:underline flex-shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        REVIEW →
                      </button>
                    </div>
                  </div>
                )}

                {dashboardStats.securityIncidents === 0 && (
                  <div className="border-l-4 border-[#111111] p-4 bg-[#F9F9F7] border border-[#E5E5E0]">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="text-[#111111] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-black text-[#111111] text-sm"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ALL SECURE
                        </div>
                        <p className="text-xs text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>
                          No security incidents detected in the last 30 days
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Backup Panel */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 border-2 border-[#111111] text-[#111111]">
                    <FaDatabase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Latest Backup
                    </h3>
                    <p className="text-xs text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                      Automatic cloud protection
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-[#111111] flex items-center gap-1.5 text-[#111111]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <FaCheckCircle className="text-[#111111]" />
                  AUTO-BACKUP ON
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <div className="text-2xl font-black text-[#111111]"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {dashboardStats.lastBackup}
                </div>
                <span className="text-xs text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  NEXT BACKUP SCHEDULED IN 22 HOURS
                </span>
              </div>

              <div className="border-2 border-[#111111] p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <div className="font-black text-[#111111] text-sm"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      Backup Protection
                    </div>
                    <p className="text-xs text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>
                      AES-256 encrypted, stored securely in the cloud.
                    </p>
                  </div>
                  <button
                    onClick={handleBackupNowClick}
                    className="px-6 py-3 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7]
                      transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <FaSync />
                    BACKUP NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PROFILE COMPLETION ── */}
      {customizationSettings.showProfileCompletion && (
        <section className="border-b-4 border-[#111111]">
          <div className="bg-[#E5E5E0] border-b-4 border-[#111111] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#111111]"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                PROFILE STATUS
              </h2>
            </div>
            <button
              onClick={() => onNavigate('user-profile')}
              className="text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              COMPLETE PROFILE →
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Completion bar */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#525252]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    COMPLETION
                  </span>
                  <span className="text-2xl font-black text-[#111111]"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dashboardStats.profileCompletion}%
                  </span>
                </div>
                <div className="w-full h-4 border-2 border-[#111111] bg-[#F9F9F7]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardStats.profileCompletion}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#111111]"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#CC0000]"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#525252]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    PREMIUM ACTIVE
                  </span>
                </div>
              </div>

              {/* Status items */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: FaCheckCircle,
                    label: 'TWO-FACTOR AUTH',
                    status: dashboardStats.twoFactorEnabled ? 'ENABLED' : 'NOT SET',
                    ok: dashboardStats.twoFactorEnabled
                  },
                  {
                    icon: FaCheckCircle,
                    label: 'RECOVERY EMAIL',
                    status: 'VERIFIED',
                    ok: true
                  },
                  {
                    icon: FaKey,
                    label: 'MASTER PASSWORD',
                    status: `${dashboardStats.masterPasswordStrength}% STRENGTH`,
                    ok: dashboardStats.masterPasswordStrength > 70
                  },
                ].map(({ icon: Icon, label, status, ok }) => (
                  <div key={label} className={`p-4 border-2 ${ok ? 'border-[#111111]' : 'border-[#CC0000]'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 border ${ok ? 'border-[#111111] text-[#111111]' : 'border-[#CC0000] text-[#CC0000]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#111111]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {label}
                        </div>
                        <div className={`text-xs font-black mt-1 ${ok ? 'text-[#525252]' : 'text-[#CC0000]'}`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── RECENT ACTIVITY ── */}
      {customizationSettings.showRecentActivity && (
        <section className="border-b-4 border-[#111111]">
          <div className="bg-[#E5E5E0] border-b-4 border-[#111111] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#111111]"></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                RECENT ACTIVITY
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative border-2 border-[#111111]">
                <select
                  className="appearance-none bg-[#F9F9F7] text-[#111111] py-2 px-4 pr-8 text-xs font-black uppercase tracking-widest focus:outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="all">ALL ACTIVITY</option>
                  <option value="login">LOGINS</option>
                  <option value="security">SECURITY</option>
                  <option value="changes">CHANGES</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#111111]">
                  <FaChevronDown size={10} />
                </div>
              </div>
              <button
                className="px-4 py-2 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7]
                  transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-1"
                onClick={() => onNavigate('history')}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                VIEW ALL <FaChevronRight size={10} className="ml-1" />
              </button>
            </div>
          </div>

          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            animate="show"
          >
            {recentActivities.slice(0, 4).map((activity) => (
              <motion.div
                key={activity.id}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
              >
                <ActivityFeedItem activity={activity} />
              </motion.div>
            ))}
          </motion.div>

          {recentActivities.length === 0 && (
            <div className="p-12 text-center border-4 border-dashed border-[#E5E5E0] m-6">
              <FaHistory className="mx-auto text-4xl text-[#E5E5E0] mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-[#A3A3A3]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                NO RECENT ACTIVITY
              </p>
            </div>
          )}

          <div className="p-4 border-t-2 border-[#111111] bg-[#E5E5E0] text-center">
            <button
              className="text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors flex items-center justify-center gap-1 mx-auto"
              onClick={() => onNavigate('history')}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              VIEW ALL ACTIVITY <FaChevronRight size={10} className="ml-1" />
            </button>
          </div>
        </section>
      )}

      {/* ── CUSTOMIZATION MODAL ── */}
      <AnimatePresence>
        {showCustomizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCustomizeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#111111] p-6 flex justify-between items-start border-b-4 border-[#CC0000]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <FaPalette className="text-[#CC0000]" />
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#F9F9F7]"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      CUSTOMIZE DASHBOARD
                    </h3>
                  </div>
                  <p className="text-xs text-[#A3A3A3]" style={{ fontFamily: "'Lora', serif" }}>
                    Personalize your dashboard layout and appearance
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="text-[#F9F9F7] hover:text-[#CC0000] p-2 border-2 border-[#525252] hover:border-[#CC0000] transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">

                  {/* Visible Sections */}
                  <div className="border-2 border-[#111111]">
                    <div className="bg-[#E5E5E0] p-4 border-b-2 border-[#111111]">
                      <h4 className="font-black text-[#111111] uppercase tracking-widest flex items-center gap-2 text-sm"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <FaEye /> VISIBLE SECTIONS
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'showQuickActions', label: 'QUICK ACTIONS', desc: 'Show quick action buttons' },
                        { key: 'showPasswordStats', label: 'PASSWORD STATS', desc: 'Display password stats cards' },
                        { key: 'showSecurityAlerts', label: 'SECURITY ALERTS', desc: 'Show security status cards' },
                        { key: 'showProfileCompletion', label: 'PROFILE STATUS', desc: 'Display profile completion' },
                        { key: 'showRecentActivity', label: 'RECENT ACTIVITY', desc: 'Show activity timeline' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 border-2 border-[#E5E5E0] hover:border-[#111111] transition-colors">
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-[#111111]"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {label}
                            </div>
                            <p className="text-xs text-[#525252] mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                              {desc}
                            </p>
                          </div>
                          <Switch
                            checked={customizationSettings[key as keyof typeof customizationSettings] as boolean}
                            onChange={() => handleCustomizationToggle(key as keyof typeof customizationSettings)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout & Appearance */}
                  <div className="border-2 border-[#111111]">
                    <div className="bg-[#E5E5E0] p-4 border-b-2 border-[#111111]">
                      <h4 className="font-black text-[#111111] uppercase tracking-widest flex items-center gap-2 text-sm"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <FaPalette /> APPEARANCE & LAYOUT
                      </h4>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Quick Actions Layout */}
                      <div className="border-2 border-[#E5E5E0] p-4">
                        <div className="text-xs font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          QUICK ACTIONS LAYOUT
                        </div>
                        <div className="flex gap-3">
                          {[
                            { value: 'grid', label: 'GRID', preview: 'grid' },
                            { value: 'list', label: 'LIST', preview: 'list' },
                          ].map(({ value, label, preview }) => (
                            <button
                              key={value}
                              onClick={() => handleLayoutChange(value as 'grid' | 'list')}
                              className={`flex-1 p-4 border-2 transition-all ${customizationSettings.quickActionsLayout === value
                                ? 'border-[#CC0000] bg-[#111111] text-[#F9F9F7]'
                                : 'border-[#E5E5E0] hover:border-[#111111]'
                                }`}
                            >
                              <div className={`mb-2 ${preview === 'grid' ? 'grid grid-cols-2 gap-1' : 'space-y-1'}`}>
                                {[1, 2, 3, 4].map((i) => (
                                  <div key={i} className={`${customizationSettings.quickActionsLayout === value ? 'bg-[#525252]' : 'bg-[#E5E5E0]'
                                    } ${preview === 'grid' ? 'h-6' : 'h-2 w-full'}`} />
                                ))}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional toggles */}
                      {[
                        { key: 'compactMode', label: 'COMPACT MODE', desc: 'Reduce spacing for more content' },
                        { key: 'animationsEnabled', label: 'ANIMATIONS', desc: 'Enable motion & transitions' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 border-2 border-[#E5E5E0] hover:border-[#111111] transition-colors">
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-[#111111]"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {label}
                            </div>
                            <p className="text-xs text-[#525252] mt-0.5" style={{ fontFamily: "'Lora', serif" }}>{desc}</p>
                          </div>
                          <Switch
                            checked={customizationSettings[key as keyof typeof customizationSettings] as boolean}
                            onChange={() => handleCustomizationToggle(key as keyof typeof customizationSettings)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t-4 border-[#111111] bg-[#E5E5E0] flex flex-wrap justify-between items-center gap-4">
                <button
                  onClick={handleResetCustomization}
                  className="px-6 py-3 border-2 border-[#111111] text-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] font-black uppercase text-xs tracking-widest transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  RESET TO DEFAULT
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCustomizeModal(false)}
                    className="px-6 py-3 border-2 border-[#111111] text-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] font-black uppercase text-xs tracking-widest transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSaveCustomization}
                    disabled={!settingsChanged}
                    className="px-8 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <FaSave />
                    SAVE CHANGES
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    localStorage.getItem('mockAuth') === 'true'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({
    id: '',
    name: 'User',
    email: '',
    role: 'Free User',
    avatar: 'https://via.placeholder.com/150',
    lastLogin: new Date().toISOString()
  });

  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPasswords: 0,
    strongPasswords: 0,
    weakPasswords: 0,
    reusedPasswords: 0,
    securityScore: 0,
    breachedAccounts: 0,
    lastBackup: 'Never',
    profileCompletion: 0,
    passwordsExpiringSoon: 0,
    lastPasswordChange: 'Never',
    securityIncidents: 0,
    masterPasswordStrength: 0,
    twoFactorEnabled: false,
    credentialsShared: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) setIsExpanded(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsExpanded(!isExpanded);
  };

  const sidebarItems: NavItem[] = [
    { icon: FaHome, label: 'Dashboard', path: 'dashboard', description: 'Overview and quick actions', component: <div className="p-6">Dashboard Component</div> },
    { icon: FaLock, label: 'Passwords', path: 'passwords', description: 'Manage your stored passwords', component: <Passwords /> },
    { icon: FaBell, label: 'Notifications', path: 'notifications', description: 'View alerts and updates', notification: 3, component: <Notifications /> },
    { icon: FaShieldVirus, label: 'Monitoring', path: 'monitoring', description: 'Real-time breach monitoring', component: <Monitoring /> },
    { icon: FaHistory, label: 'History', path: 'history', component: <History /> },
    { icon: FaCog, label: 'Settings', path: 'settings', component: <Settings /> },
    { icon: FaFileImport, label: 'Transactions', path: 'transactions', description: 'View your transactions', component: <Transactions /> },
    { icon: FaDatabase, label: 'Backup', path: 'backup', description: 'Manage your data backups', component: <BackUp /> }
  ];

  const handleNavigation = (path: string) => {
    setCurrentFeature(path);
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setCurrentFeature('user-profile');
    getCurrentComponent();
    if (window.innerWidth <= 1024) setIsExpanded(false);
  };

  const getCurrentComponent = () => {
    if (currentFeature === 'user-profile') return <UserProfile />;
    const item = sidebarItems.find(item => item.path === currentFeature);
    return item?.component || <div className="p-6">Dashboard Component</div>;
  };

  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', email: '', role: 'Free User' });

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setUserProfile({
          name: parsedData.name || 'User',
          email: parsedData.email || '',
          role: parsedData.subscription?.plan === 'premium' ? 'Premium User' :
            parsedData.subscription?.plan === 'enterprise' ? 'Enterprise User' : 'Free User'
        });
        setUser(prev => ({
          ...prev,
          id: parsedData.id || parsedData._id || '',
          name: parsedData.name || 'User',
          email: parsedData.email || '',
          role: parsedData.subscription?.plan === 'premium' ? 'Premium User' :
            parsedData.subscription?.plan === 'enterprise' ? 'Enterprise User' : 'Free User'
        }));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const initializeDashboard = useCallback(async () => {
    try {
      const mockAuth = localStorage.getItem('mockAuth') === 'true';
      const isAuthenticatedToken = localStorage.getItem('isAuthenticated') === 'true';
      const userToken = localStorage.getItem('userToken');
      const token = localStorage.getItem('token');
      const accessToken = localStorage.getItem('accessToken');

      const authStatus = mockAuth || isAuthenticatedToken || !!userToken || !!token || !!accessToken;
      setIsAuthenticated(authStatus);

      if (!authStatus) {
        navigate('/signin', { replace: true });
        return;
      }

      setError(null);

      const userData = localStorage.getItem('userData');
      const mockUser = localStorage.getItem('mockUser');

      if (userData || mockUser) {
        try {
          const parsedUser = JSON.parse(userData || mockUser || '{}');
          setUserProfile({
            name: parsedUser.name || parsedUser.username || 'User',
            email: parsedUser.email || '',
            role: parsedUser.role || 'Free User'
          });
          setUser(prev => ({
            ...prev,
            name: parsedUser.name || parsedUser.username || 'User',
            email: parsedUser.email || '',
          }));
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }

      try {
        const dashboardResponse = await monitoringAPI.getDashboard('week');
        const userData = localStorage.getItem('userData');
        const parsedUserData = userData ? JSON.parse(userData) : {};

        const [devicesResponse, sharingResponse, passwordStatsResponse, expiringPasswordsResponse] = await Promise.allSettled([
          deviceAPI.getDeviceStats().catch(() => null),
          sharingAPI.getStats().catch(() => null),
          passwordAPI.getStats().catch(() => null),
          passwordAPI.getExpiring(30).catch(() => null),
        ]);

        if (dashboardResponse.data?.data) {
          const apiData = dashboardResponse.data.data;

          let profileCompletion = 0;
          if (parsedUserData.name) profileCompletion += 20;
          if (parsedUserData.email) profileCompletion += 20;
          if (parsedUserData.twoFactorEnabled) profileCompletion += 20;
          if (parsedUserData.recoveryEmail) profileCompletion += 20;
          if (parsedUserData.masterPassword) profileCompletion += 20;

          const totalPasswords = apiData.overview?.totalPasswords || 0;
          const strongCount = Math.round((apiData.security?.score || 0) / 100 * totalPasswords);

          let devicesStats = { activeDevices: 0, totalDevices: 0 };
          if (devicesResponse.status === 'fulfilled' && devicesResponse.value?.data) devicesStats = devicesResponse.value.data;

          let sharingStats = { sharedCount: 0 };
          if (sharingResponse.status === 'fulfilled' && sharingResponse.value?.data) sharingStats = sharingResponse.value.data;

          let passwordStats = {
            total: totalPasswords,
            strong: strongCount,
            weak: apiData.security?.weakPasswords || Math.max(0, totalPasswords - strongCount),
            medium: 0,
            reused: apiData.security?.reusedPasswords || 0,
            compromised: apiData.security?.breachedAccounts || 0,
          };

          if (passwordStatsResponse.status === 'fulfilled' && passwordStatsResponse.value?.data?.data?.overall) {
            const overall = passwordStatsResponse.value.data.data.overall;
            passwordStats = {
              total: overall.total || passwordStats.total,
              strong: (overall.strong || 0) + (overall.veryStrong || 0),
              weak: overall.weak || passwordStats.weak,
              medium: overall.medium || 0,
              reused: apiData.security?.reusedPasswords || 0,
              compromised: overall.compromised || passwordStats.compromised,
            };
          }

          const passwordsExpiringSoon =
            expiringPasswordsResponse.status === 'fulfilled' && expiringPasswordsResponse.value?.data?.data?.passwords
              ? expiringPasswordsResponse.value.data.data.passwords.length
              : apiData.security?.expiredPasswords || 0;

          setDashboardStats({
            totalPasswords: passwordStats.total,
            strongPasswords: passwordStats.strong,
            weakPasswords: passwordStats.weak,
            reusedPasswords: passwordStats.reused,
            securityScore: apiData.security?.score || apiData.overview?.securityScore || 0,
            breachedAccounts: passwordStats.compromised,
            lastBackup: apiData.backup?.lastBackup ? new Date(apiData.backup.lastBackup).toLocaleDateString() : 'Recently synced',
            profileCompletion: profileCompletion,
            passwordsExpiringSoon: passwordsExpiringSoon,
            lastPasswordChange: apiData.security?.lastPasswordChange ? new Date(apiData.security.lastPasswordChange).toLocaleDateString() : 'Never',
            securityIncidents: apiData.alerts?.length || 0,
            masterPasswordStrength: parsedUserData.masterPassword ? 92 : 0,
            twoFactorEnabled: parsedUserData.twoFactorEnabled || false,
            credentialsShared: sharingStats.sharedCount || 0
          });
        }
      } catch (dashboardError) {
        console.error('Failed to fetch dashboard data:', dashboardError);
        setError('Failed to load dashboard data');
      }

      try {
        const historyResponse = await historyAPI.getRecent(6);

        if (historyResponse.data?.data?.items) {
          const activities: ActivityItem[] = historyResponse.data.data.items.map((item: any, index: number) => {
            const iconMap: { [key: string]: any } = {
              'login': FaUserSecret,
              'password': FaKey,
              'security_alert': FaExclamationTriangle,
              'sync': FaSync,
              'share': FaFileContract,
              'backup': FaDatabase,
              'document': FaDatabase,
              'qrcode': FaQrcode
            };

            return {
              id: item._id || `activity-${index}`,
              type: item.type || 'login',
              title: item.title || 'Activity',
              description: item.description || 'Recent activity',
              timestamp: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : 'Recently',
              icon: iconMap[item.type] || FaHistory,
              severity: item.severity || 'low'
            };
          });
          setRecentActivities(activities);
        }
      } catch (historyError) {
        console.error('Failed to fetch activity history:', historyError);
      }

      setCurrentFeature('dashboard');

    } catch (error) {
      console.error('Dashboard initialization error:', error);
      setError('Error loading dashboard. Please try again later.');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const mockAuth = localStorage.getItem('mockAuth') === 'true';
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userToken = localStorage.getItem('userToken');
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');

    if (!mockAuth && !isAuthenticated && !userToken && !token && !accessToken) {
      navigate('/signin', { replace: true });
      return;
    }
    initializeDashboard();
  }, [initializeDashboard, navigate]);

  useEffect(() => {
    initializeDashboard();
    const handleStorageChange = () => {
      const authStatus =
        localStorage.getItem('mockAuth') === 'true' ||
        localStorage.getItem('isAuthenticated') === 'true' ||
        !!localStorage.getItem('userToken') ||
        !!localStorage.getItem('token') ||
        !!localStorage.getItem('accessToken');
      setIsAuthenticated(authStatus);
      if (!authStatus) navigate('/signin', { replace: true });
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeDashboard, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('mockAuth');
    localStorage.removeItem('mockUser');
    localStorage.removeItem('userToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('storage'));
    navigate('/signin', { replace: true });
  };

  // ─── Loading Screen ──────────────────────────────────────────────────────────

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9F9F7]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}>
        <div className="text-center">
          <div className="inline-block border-4 border-[#111111] border-t-[#CC0000] w-12 h-12 animate-spin mb-6"></div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#525252]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            LOADING VAULT...
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F7]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}>
      <Navbar />

      <div className="h-20"></div>

      {/* Error toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 right-4 p-4 border-2 border-[#CC0000] bg-[#F9F9F7] text-[#111111] z-50 max-w-md"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 border border-[#CC0000] text-[#CC0000]">
              <FaExclamationCircle size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {error}
            </span>
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 p-1 text-[#525252] hover:text-[#CC0000] transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </motion.div>
      )}

      {/* Sidebar toggle */}
      <div className="fixed top-24 left-4 z-50">
        <SidebarToggle isExpanded={isExpanded} onClick={toggleSidebar} />
      </div>

      {/* Sidebar */}
      <motion.nav
        initial={false}
        animate={{
          width: isExpanded ? '280px' : '0px',
          opacity: isExpanded ? 1 : 0,
          transition: { duration: 0.25 }
        }}
        className="fixed left-0 top-20 h-[calc(100%-5rem)] bg-[#F9F9F7] border-r-4 border-[#111111] z-40 overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        <div className="p-0 h-full flex flex-col w-[280px]">

          {/* Sidebar masthead */}
          <div className="bg-[#111111] p-6 border-b-4 border-[#CC0000]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#F9F9F7] flex items-center justify-center">
                <FaSquarePollHorizontal className="text-[#F9F9F7] text-xl" />
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-[#F9F9F7]"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  VAULT
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  SECURE DASHBOARD
                </div>
              </div>
            </div>
          </div>

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto py-4 border-b-2 border-[#E5E5E0]">
            <div className="px-4 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3A3A3]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                MAIN MENU
              </span>
            </div>
            {sidebarItems.slice(0, 3).map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                isActive={currentFeature === item.path}
                notification={item.notification}
                onClick={() => handleNavigation(item.path)}
              />
            ))}

            <div className="px-4 mt-6 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3A3A3]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                MANAGEMENT
              </span>
            </div>
            {sidebarItems.slice(3).map((item, index) => (
              <SidebarItem
                key={index + 3}
                icon={item.icon}
                label={item.label}
                isActive={currentFeature === item.path}
                notification={item.notification}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </div>

          <div className="p-4">
            <SidebarProfile
              profile={userProfile}
              onClick={handleProfileClick}
              isActive={currentFeature === 'user-profile'}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </motion.nav>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 pt-4 px-4 md:px-8 pb-8 ${isExpanded ? 'lg:pl-[296px]' : 'pl-4'
        } mt-16`}>
        <div className="max-w-screen-xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {currentFeature === 'dashboard'
                ? <DashboardHome
                  dashboardStats={dashboardStats}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  recentActivities={recentActivities}
                  onNavigate={handleNavigation}
                />
                : getCurrentComponent()
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className={`mt-auto transition-all duration-300 ${isExpanded ? 'lg:ml-[280px]' : 'ml-0'}`}>
        <Footer />
        <ScrollButton />
      </div>
    </div>
  );
};

export default Dashboard;