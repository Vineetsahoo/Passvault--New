import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt, FaBell, FaSync, FaKey, FaFingerprint,
  FaPassport, FaCreditCard, FaIdCard, FaLock, FaHistory,
  FaDownload, FaEye, FaCog, FaExclamationTriangle,
  FaUserShield, FaQrcode, FaUserLock, FaSave, FaCheck,
  FaDatabase, FaFileExport, FaFileImport, FaUserClock,
  FaGlobe, FaBiohazard, FaUserSecret, FaCloudDownloadAlt,
  FaChevronRight, FaChevronDown, FaTimes, FaToggleOn, FaSlidersH,
  FaChartLine, FaBars, FaInfoCircle, FaDesktop, FaCheckCircle
} from 'react-icons/fa';
import { IoShieldCheckmark } from "react-icons/io5";
import { HiCog, HiCog6Tooth, HiSparkles } from "react-icons/hi2";

// ─── Interfaces (unchanged) ───────────────────────────────────────────────────

interface SecuritySettings {
  twoFactor: boolean;
  masterPasswordExpiry: number;
  biometricUnlock: boolean;
  autoLock: number;
  passwordStrengthMinimum: 'medium' | 'strong';
  passwordComplexity: {
    minLength: number;
    requireNumbers: boolean;
    requireSymbols: boolean;
    requireMixedCase: boolean;
  };
  failedAttempts: {
    maxAttempts: number;
    lockoutDuration: number;
  };
  session: {
    timeout: number;
    requireReauthFor: string[];
  };
}

interface PassSettings {
  security: {
    twoFactor: boolean;
    masterPasswordExpiry: number;
    biometricUnlock: boolean;
    autoLock: number;
    passwordStrengthMinimum: 'medium' | 'strong';
  };
  passes: {
    autoExpirePasswords: number;
    warnBeforeExpiry: number;
    requireSecurityQuestions: boolean;
    allowEmergencyAccess: boolean;
    defaultPassValidityPeriod: number;
  };
  notifications: {
    securityAlerts: boolean;
    passExpiry: boolean;
    unauthorizedAccess: boolean;
    passwordBreaches: boolean;
    syncNotifications: boolean;
  };
  sync: {
    autoSync: boolean;
    syncFrequency: number;
    syncOnWifiOnly: boolean;
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface AdvancedSettings {
  dataManagement: {
    autoDelete: {
      enabled: boolean;
      oldPasswords: number;
      loginHistory: number;
    };
    export: {
      format: 'json' | 'csv' | 'encrypted';
      includeMetadata: boolean;
    };
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    animationsReduced: boolean;
  };
}

interface SettingsChangeEvent {
  category: string;
  key: string;
  value: any;
  timestamp: string;
}

// ─── Design-System Components ─────────────────────────────────────────────────

/**
 * SettingCard — mirrors the BackUp.tsx panel pattern:
 * black inverted header + off-white body with sharp 2px border.
 */
const SettingCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;          // kept for API compatibility, unused visually
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="border-2 border-[#111111] bg-[#F9F9F7] overflow-hidden newsprint-texture">
    {/* Inverted header */}
    <div className="bg-[#111111] text-[#F9F9F7] p-6 border-b-2 border-[#111111] flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="p-3 border-2 border-[#F9F9F7] flex items-center justify-center text-[#F9F9F7] flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3
          className="text-2xl font-black text-[#F9F9F7] uppercase tracking-tight leading-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h3>
        <p
          className="text-[#A3A3A3] text-sm mt-1 leading-relaxed"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {description}
        </p>
      </div>
    </div>

    {/* Body */}
    <div className="p-6 md:p-8 space-y-6 bg-[#F9F9F7]">
      {children}
    </div>
  </div>
);

/**
 * ToggleSwitch — exact Switch atom from BackUp.tsx, extended with
 * an editorial label + description row.
 */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between py-4 px-4 border border-[#E5E5E0] bg-white hover:border-[#111111] hover:bg-[#F9F9F7] transition-all group">
    <div className="pr-4 flex-1">
      <span
        className="font-black uppercase tracking-widest text-xs text-[#111111] block"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </span>
      {description && (
        <p
          className="text-sm text-[#525252] mt-1 leading-relaxed"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {description}
        </p>
      )}
    </div>

    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
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

/**
 * SettingSection — a labeled sub-section inside a SettingCard,
 * using JetBrains Mono for the uppercase heading and a 2px bottom border.
 */
const SettingSection: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, children, icon }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b-2 border-[#111111]">
      {icon && <span className="text-[#111111]">{icon}</span>}
      <h4
        className="font-black text-xs uppercase tracking-widest text-[#111111]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {title}
      </h4>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

// ─── Shared input / select / number field styles ──────────────────────────────
const inputCls =
  "w-full border-2 border-[#111111] bg-white text-[#111111] font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-1 transition-colors";

const selectCls =
  "w-full border-2 border-[#111111] bg-white text-[#111111] font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-1 transition-colors appearance-none cursor-pointer";

// ─── Main Component ───────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  // ── State (unchanged) ──────────────────────────────────────────────────────
  const [settings, setSettings] = useState<PassSettings>({
    security: {
      twoFactor: false,
      masterPasswordExpiry: 90,
      biometricUnlock: true,
      autoLock: 5,
      passwordStrengthMinimum: 'strong',
    },
    passes: {
      autoExpirePasswords: 180,
      warnBeforeExpiry: 14,
      requireSecurityQuestions: true,
      allowEmergencyAccess: false,
      defaultPassValidityPeriod: 365,
    },
    notifications: {
      securityAlerts: true,
      passExpiry: true,
      unauthorizedAccess: true,
      passwordBreaches: true,
      syncNotifications: true,
    },
    sync: {
      autoSync: true,
      syncFrequency: 15,
      syncOnWifiOnly: true,
      backupEnabled: true,
      backupFrequency: 'weekly',
    },
  });

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    dataManagement: {
      autoDelete: {
        enabled: false,
        oldPasswords: 365,
        loginHistory: 90,
      },
      export: {
        format: 'encrypted',
        includeMetadata: true,
      },
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      animationsReduced: false,
    },
  });

  const [showVerification, setShowVerification] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'advanced'>('general');
  const [isSaved, setIsSaved] = useState(true);
  const [settingsHistory, setSettingsHistory] = useState<SettingsChangeEvent[]>([]);
  const [showChangesHistory, setShowChangesHistory] = useState(false);

  // ── Handlers (unchanged) ───────────────────────────────────────────────────
  const handleSensitiveAction = (action: string) => {
    setCurrentAction(action);
    setShowVerification(true);
  };

  const updateSettings = (category: keyof PassSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  const handleSettingsChange = (category: keyof PassSettings, key: string, value: any) => {
    updateSettings(category, key, value);
    setSettingsHistory(prev => [
      { category, key, value, timestamp: new Date().toISOString() },
      ...prev,
    ]);
    setIsSaved(false);
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: { id: 'general' | 'security' | 'advanced'; label: string; icon: React.ReactNode }[] = [
    { id: 'general',  label: 'GENERAL',  icon: <FaCog /> },
    { id: 'security', label: 'SECURITY', icon: <FaShieldAlt /> },
    { id: 'advanced', label: 'ADVANCED', icon: <FaSlidersH /> },
  ];

  // ── Helper: category badge colour (newsprint) ──────────────────────────────
  const getCategoryBadge = (cat: string) => {
    const map: Record<string, string> = {
      security:      'bg-[#111111] text-[#F9F9F7] border-[#111111]',
      notifications: 'bg-[#E5E5E0] text-[#111111] border-[#111111]',
      passes:        'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]',
      sync:          'bg-white text-[#111111] border-[#111111]',
    };
    return map[cat] ?? 'bg-[#E5E5E0] text-[#111111] border-[#111111]';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-0 -mt-4 bg-[#F9F9F7]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">

          {/* Left: title block */}
          <div>
            <div
              className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              CONFIGURATION &bull; PREFERENCES
            </div>

            <h2
              className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              VAULT<br />
              <span className="italic" style={{ color: "#CC0000" }}>SETTINGS</span>
            </h2>

            <p
              className="mt-6 text-lg text-[#525252] max-w-xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Configure security preferences, pass management rules, and personalise
              your vault experience across all registered devices.
            </p>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
            <button
              onClick={() => setShowChangesHistory(!showChangesHistory)}
              className={`px-6 py-4 border-2 border-[#111111] font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 hard-shadow-hover
                ${showChangesHistory
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
                }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <FaHistory />
              {showChangesHistory ? 'HIDE LOG' : 'CHANGE LOG'}
            </button>

            <button
              onClick={() => setIsSaved(true)}
              className={`px-8 py-4 font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2
                ${isSaved
                  ? 'bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000]'
                  : 'bg-[#CC0000] text-[#F9F9F7] hover:bg-[#990000]'
                }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isSaved ? <FaCheck /> : <FaSave />}
              {isSaved ? 'SAVED' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>

        {/* Stats ticker bar */}
        <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-4 gap-0 bg-[#111111]">
          <div className="bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [LAST UPDATED]
            </div>
            <div
              className="font-bold text-[#111111] text-xs"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Today
            </div>
          </div>

          <div className="bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [2FA STATUS]
            </div>
            <div
              className="font-bold text-[#111111] text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {settings.security.twoFactor ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>

          <div className="bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [AUTO-LOCK]
            </div>
            <div
              className="font-black text-[#111111] text-2xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {settings.security.autoLock}
              <span
                className="text-sm font-bold ml-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                MIN
              </span>
            </div>
          </div>

          <div className="bg-[#F9F9F7] border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div
              className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [SYNC]
            </div>
            <div
              className="font-bold text-[#111111] text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {settings.sync.autoSync ? 'AUTO ENABLED' : 'MANUAL'}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────────── */}
      <div className="bg-[#F9F9F7] border-b-4 border-[#111111] flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-8 py-5 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all border-r-2 border-[#111111] flex-shrink-0
              ${activeTab === tab.id
                ? 'bg-[#111111] text-[#F9F9F7]'
                : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="text-[0.55rem] border border-[#CC0000] text-[#CC0000] px-1.5 py-0.5 font-black tracking-widest ml-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ACTIVE
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center pr-6">
          <span
            className="text-[0.6rem] text-[#525252] uppercase tracking-widest font-bold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {settingsHistory.length} PENDING CHANGE{settingsHistory.length !== 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid gap-6"
          >

            {/* ══════════════════ SECURITY TAB ══════════════════ */}
            {activeTab === 'security' && (
              <>
                {/* Authentication & Access */}
                <SettingCard
                  icon={<IoShieldCheckmark className="w-6 h-6" />}
                  title="Authentication & Access"
                  description="Configure login, access control, and session management"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <SettingSection
                      title="Two-Factor Authentication"
                      icon={<FaQrcode />}
                    >
                      {/* 2FA info banner */}
                      <div className="border-l-4 border-[#CC0000] pl-4 py-2 bg-white border border-[#E5E5E0] border-l-0 pr-4">
                        <p
                          className="text-sm text-[#525252] leading-relaxed"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          Two-factor authentication adds an extra layer of security to your account.
                        </p>
                        <button
                          onClick={() => handleSensitiveAction('2fa')}
                          className="mt-3 px-5 py-2.5 bg-[#111111] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#CC0000] transition-colors flex items-center gap-2"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          SET UP 2FA <FaChevronRight size={10} />
                        </button>
                      </div>

                      <ToggleSwitch
                        checked={settings.security.biometricUnlock}
                        onChange={(checked) => handleSettingsChange('security', 'biometricUnlock', checked)}
                        label="Biometric Authentication"
                        description="Use fingerprint or face recognition to unlock"
                      />
                    </SettingSection>

                    <SettingSection
                      title="Session Security"
                      icon={<FaUserLock />}
                    >
                      {/* Auto-lock slider */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          AUTO-LOCK AFTER INACTIVITY
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={settings.security.autoLock}
                            onChange={(e) => handleSettingsChange('security', 'autoLock', Number(e.target.value))}
                            className="w-full h-2 bg-[#E5E5E0] appearance-none cursor-pointer accent-[#111111]"
                          />
                          <span
                            className="w-14 px-2 py-1.5 text-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] font-black text-sm flex-shrink-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {settings.security.autoLock}m
                          </span>
                        </div>
                      </div>

                      {/* Master Password Expiry */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          MASTER PASSWORD EXPIRY
                        </label>
                        <div className="relative">
                          <select
                            value={settings.security.masterPasswordExpiry}
                            onChange={(e) => handleSettingsChange('security', 'masterPasswordExpiry', Number(e.target.value))}
                            className={selectCls}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days</option>
                            <option value={180}>180 days</option>
                            <option value={365}>1 year</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <FaChevronDown size={10} className="text-[#111111]" />
                          </div>
                        </div>
                      </div>
                    </SettingSection>
                  </div>

                  {/* Password Requirements divider */}
                  <div className="pt-6 mt-2 border-t-2 border-[#111111]">
                    <SettingSection
                      title="Password Requirements"
                      icon={<FaKey />}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strength toggle */}
                        <div className="border-2 border-[#111111] bg-white p-4">
                          <label
                            className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            MINIMUM PASSWORD STRENGTH
                          </label>
                          <div className="flex border-2 border-[#111111] overflow-hidden">
                            {(['medium', 'strong'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                onClick={() => handleSettingsChange('security', 'passwordStrengthMinimum', lvl)}
                                className={`flex-1 py-2.5 font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2
                                  ${settings.security.passwordStrengthMinimum === lvl
                                    ? 'bg-[#111111] text-[#F9F9F7]'
                                    : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                                  }`}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                <span
                                  className={`w-2 h-2 border ${
                                    lvl === 'medium'
                                      ? 'bg-[#CC0000] border-[#CC0000]'
                                      : 'bg-[#111111] border-[#111111]'
                                  }`}
                                />
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Info note */}
                        <div className="border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] p-4 flex items-start gap-3">
                          <FaInfoCircle className="text-[#CC0000] mt-0.5 flex-shrink-0" />
                          <p
                            className="text-sm text-[#A3A3A3] leading-relaxed"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Strong passwords protect your sensitive information from unauthorised access.
                          </p>
                        </div>
                      </div>
                    </SettingSection>
                  </div>
                </SettingCard>
              </>
            )}

            {/* ══════════════════ GENERAL TAB ══════════════════ */}
            {activeTab === 'general' && (
              <>
                {/* Pass Management */}
                <SettingCard
                  icon={<FaPassport className="w-6 h-6" />}
                  title="Pass Management"
                  description="Configure pass handling and validity periods"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <SettingSection
                      title="Pass Validity"
                      icon={<FaUserClock />}
                    >
                      {/* Default validity */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          DEFAULT PASS VALIDITY PERIOD
                        </label>
                        <div className="relative">
                          <select
                            value={settings.passes.defaultPassValidityPeriod}
                            onChange={(e) => handleSettingsChange('passes', 'defaultPassValidityPeriod', Number(e.target.value))}
                            className={selectCls}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value={180}>6 months</option>
                            <option value={365}>1 year</option>
                            <option value={730}>2 years</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <FaChevronDown size={10} className="text-[#111111]" />
                          </div>
                        </div>
                        <p
                          className="text-xs text-[#525252] mt-2"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          All new passes will be valid for this period by default.
                        </p>
                      </div>

                      {/* Expiry warning slider */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          EXPIRY WARNING PERIOD
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="90"
                            value={settings.passes.warnBeforeExpiry}
                            onChange={(e) => handleSettingsChange('passes', 'warnBeforeExpiry', Number(e.target.value))}
                            className="w-full h-2 bg-[#E5E5E0] appearance-none cursor-pointer accent-[#111111]"
                          />
                          <span
                            className="w-14 px-2 py-1.5 text-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] font-black text-sm flex-shrink-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {settings.passes.warnBeforeExpiry}d
                          </span>
                        </div>
                      </div>
                    </SettingSection>

                    <SettingSection
                      title="Security Features"
                      icon={<FaUserShield />}
                    >
                      {/* Enhanced protection banner */}
                      <div className="border-l-4 border-[#CC0000] pl-4 py-3 bg-white border border-[#E5E5E0] border-l-0 pr-4">
                        <h5
                          className="font-black text-xs uppercase tracking-widest text-[#111111] mb-1 flex items-center gap-2"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <FaShieldAlt className="text-[#CC0000]" /> Enhanced Protection
                        </h5>
                        <p
                          className="text-sm text-[#525252] leading-relaxed"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          Enable additional security features to protect your most sensitive passes.
                        </p>
                      </div>

                      <ToggleSwitch
                        checked={settings.passes.requireSecurityQuestions}
                        onChange={(checked) => handleSettingsChange('passes', 'requireSecurityQuestions', checked)}
                        label="Security Questions"
                        description="Require security questions for sensitive passes"
                      />

                      <ToggleSwitch
                        checked={settings.passes.allowEmergencyAccess}
                        onChange={(checked) => handleSettingsChange('passes', 'allowEmergencyAccess', checked)}
                        label="Emergency Access"
                        description="Allow trusted contacts to request emergency access"
                      />
                    </SettingSection>
                  </div>
                </SettingCard>

                {/* Notifications */}
                <SettingCard
                  icon={<FaBell className="w-6 h-6" />}
                  title="Notifications"
                  description="Configure alerts and notification preferences"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <SettingSection
                      title="Security Alerts"
                      icon={<FaExclamationTriangle />}
                    >
                      <ToggleSwitch
                        checked={settings.notifications.securityAlerts}
                        onChange={(checked) => handleSettingsChange('notifications', 'securityAlerts', checked)}
                        label="Security Alerts"
                        description="Receive alerts about security events"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.unauthorizedAccess}
                        onChange={(checked) => handleSettingsChange('notifications', 'unauthorizedAccess', checked)}
                        label="Unauthorized Access Attempts"
                        description="Get notified of suspicious login attempts"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.passwordBreaches}
                        onChange={(checked) => handleSettingsChange('notifications', 'passwordBreaches', checked)}
                        label="Password Breach Alerts"
                        description="Get alerts if your data appears in a breach"
                      />
                    </SettingSection>

                    <SettingSection
                      title="Pass Notifications"
                      icon={<FaPassport />}
                    >
                      {/* Notification channels info */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h6
                              className="font-black text-xs uppercase tracking-widest text-[#111111]"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              Notification Channels
                            </h6>
                            <p
                              className="text-xs text-[#525252] mt-0.5"
                              style={{ fontFamily: "'Lora', serif" }}
                            >
                              How would you like to be notified?
                            </p>
                          </div>
                          <button
                            className="text-[0.6rem] font-black uppercase tracking-widest border border-[#111111] px-3 py-1.5 hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-[#111111]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            CONFIGURE
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['EMAIL', 'PUSH', 'SMS'].map((ch) => (
                            <span
                              key={ch}
                              className={`px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest border ${
                                ch === 'EMAIL'
                                  ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                                  : 'bg-white text-[#525252] border-[#E5E5E0]'
                              }`}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>

                      <ToggleSwitch
                        checked={settings.notifications.passExpiry}
                        onChange={(checked) => handleSettingsChange('notifications', 'passExpiry', checked)}
                        label="Pass Expiry Reminders"
                        description="Get reminded when passes are about to expire"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.syncNotifications}
                        onChange={(checked) => handleSettingsChange('notifications', 'syncNotifications', checked)}
                        label="Sync Notifications"
                        description="Get notified about sync status and events"
                      />
                    </SettingSection>
                  </div>
                </SettingCard>

                {/* Sync Settings */}
                <SettingCard
                  icon={<FaSync className="w-6 h-6" />}
                  title="Sync Settings"
                  description="Manage synchronisation frequency and data transfer rules"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <SettingSection
                      title="Sync Behaviour"
                      icon={<FaSync />}
                    >
                      <ToggleSwitch
                        checked={settings.sync.autoSync}
                        onChange={(checked) => handleSettingsChange('sync', 'autoSync', checked)}
                        label="Automatic Sync"
                        description="Automatically synchronise changes across devices"
                      />
                      <ToggleSwitch
                        checked={settings.sync.syncOnWifiOnly}
                        onChange={(checked) => handleSettingsChange('sync', 'syncOnWifiOnly', checked)}
                        label="Wi-Fi Only"
                        description="Restrict sync to Wi-Fi connections to save mobile data"
                      />

                      {/* Sync frequency */}
                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          SYNC FREQUENCY (MINUTES)
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={settings.sync.syncFrequency}
                            onChange={(e) => handleSettingsChange('sync', 'syncFrequency', Number(e.target.value))}
                            className="w-full h-2 bg-[#E5E5E0] appearance-none cursor-pointer accent-[#111111]"
                          />
                          <span
                            className="w-14 px-2 py-1.5 text-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] font-black text-sm flex-shrink-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {settings.sync.syncFrequency}m
                          </span>
                        </div>
                      </div>
                    </SettingSection>

                    <SettingSection
                      title="Backup Schedule"
                      icon={<FaDatabase />}
                    >
                      <ToggleSwitch
                        checked={settings.sync.backupEnabled}
                        onChange={(checked) => handleSettingsChange('sync', 'backupEnabled', checked)}
                        label="Automatic Backups"
                        description="Keep automatic encrypted backups of your vault"
                      />

                      <div className="border-2 border-[#111111] bg-white p-4">
                        <label
                          className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          BACKUP FREQUENCY
                        </label>
                        <div className="flex border-2 border-[#111111] overflow-hidden">
                          {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                            <button
                              key={freq}
                              onClick={() => handleSettingsChange('sync', 'backupFrequency', freq)}
                              className={`flex-1 py-2.5 font-black uppercase text-xs tracking-widest transition-colors
                                ${settings.sync.backupFrequency === freq
                                  ? 'bg-[#111111] text-[#F9F9F7]'
                                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                                }`}
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>
                    </SettingSection>
                  </div>
                </SettingCard>
              </>
            )}

            {/* ══════════════════ ADVANCED TAB ══════════════════ */}
            {activeTab === 'advanced' && (
              <>
                {/* Data Management */}
                <SettingCard
                  icon={<FaDatabase className="w-6 h-6" />}
                  title="Data Management"
                  description="Configure data retention, auto-cleanup, and export settings"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <SettingSection
                      title="Auto-Cleanup"
                      icon={<FaChartLine />}
                    >
                      <ToggleSwitch
                        checked={advancedSettings.dataManagement.autoDelete.enabled}
                        onChange={(checked) => {
                          setAdvancedSettings(prev => ({
                            ...prev,
                            dataManagement: {
                              ...prev.dataManagement,
                              autoDelete: { ...prev.dataManagement.autoDelete, enabled: checked },
                            },
                          }));
                        }}
                        label="Auto-delete old data"
                        description="Automatically remove outdated information"
                      />

                      <AnimatePresence>
                        {advancedSettings.dataManagement.autoDelete.enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 border-l-4 border-[#CC0000] pl-4 mt-3">
                              {/* Old passwords retention */}
                              <div className="border-2 border-[#111111] bg-white p-4">
                                <label
                                  className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-2"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  OLD PASSWORDS RETENTION
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="30"
                                    value={advancedSettings.dataManagement.autoDelete.oldPasswords}
                                    onChange={(e) => {
                                      setAdvancedSettings(prev => ({
                                        ...prev,
                                        dataManagement: {
                                          ...prev.dataManagement,
                                          autoDelete: {
                                            ...prev.dataManagement.autoDelete,
                                            oldPasswords: Number(e.target.value),
                                          },
                                        },
                                      }));
                                    }}
                                    className={inputCls}
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                  />
                                  <span
                                    className="text-xs text-[#525252] font-bold uppercase tracking-widest whitespace-nowrap"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                  >
                                    DAYS
                                  </span>
                                </div>
                              </div>

                              {/* Login history retention */}
                              <div className="border-2 border-[#111111] bg-white p-4">
                                <label
                                  className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-2"
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  LOGIN HISTORY RETENTION
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="7"
                                    value={advancedSettings.dataManagement.autoDelete.loginHistory}
                                    onChange={(e) => {
                                      setAdvancedSettings(prev => ({
                                        ...prev,
                                        dataManagement: {
                                          ...prev.dataManagement,
                                          autoDelete: {
                                            ...prev.dataManagement.autoDelete,
                                            loginHistory: Number(e.target.value),
                                          },
                                        },
                                      }));
                                    }}
                                    className={inputCls}
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                  />
                                  <span
                                    className="text-xs text-[#525252] font-bold uppercase tracking-widest whitespace-nowrap"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                  >
                                    DAYS
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SettingSection>

                    <SettingSection
                      title="Data Export"
                      icon={<FaFileExport />}
                    >
                      <div className="space-y-4">
                        {/* Export format */}
                        <div className="border-2 border-[#111111] bg-white p-4">
                          <label
                            className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-3"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            EXPORT FORMAT
                          </label>
                          <div className="flex border-2 border-[#111111] overflow-hidden">
                            {(['json', 'csv', 'encrypted'] as const).map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => {
                                  setAdvancedSettings(prev => ({
                                    ...prev,
                                    dataManagement: {
                                      ...prev.dataManagement,
                                      export: { ...prev.dataManagement.export, format: fmt },
                                    },
                                  }));
                                }}
                                className={`flex-1 py-2.5 font-black uppercase text-xs tracking-widest transition-colors
                                  ${advancedSettings.dataManagement.export.format === fmt
                                    ? 'bg-[#111111] text-[#F9F9F7]'
                                    : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                                  }`}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                          <p
                            className="text-xs text-[#525252] mt-2 leading-relaxed"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Encrypted format provides the highest level of security for your exported data.
                          </p>
                        </div>

                        <button
                          onClick={() => handleSensitiveAction('export')}
                          className="w-full px-4 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <FaFileExport /> EXPORT ALL DATA
                        </button>
                      </div>
                    </SettingSection>
                  </div>
                </SettingCard>

                {/* Emergency Access */}
                <SettingCard
                  icon={<FaUserShield className="w-6 h-6" />}
                  title="Emergency Access"
                  description="Configure trusted contacts and recovery options"
                  color=""
                >
                  <div className="space-y-6">
                    {/* Warning banner — inverted red */}
                    <div className="border-4 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] p-6 flex flex-col md:flex-row items-start gap-5">
                      <div className="p-3 border-2 border-[#F9F9F7] flex-shrink-0">
                        <FaExclamationTriangle className="text-[#F9F9F7] h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4
                          className="font-black text-xl text-[#F9F9F7] uppercase tracking-tight mb-2"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          Emergency Access Controls
                        </h4>
                        <p
                          className="text-sm text-[#F9F9F7] leading-relaxed opacity-90"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          Emergency access allows designated contacts to request access to your vault in case of
                          emergency. This is a sensitive security feature that should be configured carefully.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => handleSensitiveAction('contacts')}
                            className="px-5 py-3 bg-[#F9F9F7] text-[#CC0000] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors flex items-center gap-2"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            <FaUserShield /> TRUSTED CONTACTS
                          </button>
                          <button
                            onClick={() => handleSensitiveAction('recovery')}
                            className="px-5 py-3 border-2 border-[#F9F9F7] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#F9F9F7] hover:text-[#CC0000] transition-colors flex items-center gap-2"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            <FaKey /> RECOVERY OPTIONS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SettingCard>

                {/* Accessibility */}
                <SettingCard
                  icon={<FaEye className="w-6 h-6" />}
                  title="Accessibility"
                  description="Adjust display and interaction preferences"
                  color=""
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingSection title="Display" icon={<FaDesktop />}>
                      <ToggleSwitch
                        checked={advancedSettings.accessibility.highContrast}
                        onChange={(checked) => {
                          setAdvancedSettings(prev => ({
                            ...prev,
                            accessibility: { ...prev.accessibility, highContrast: checked },
                          }));
                        }}
                        label="High Contrast"
                        description="Increase colour contrast for better readability"
                      />
                      <ToggleSwitch
                        checked={advancedSettings.accessibility.largeText}
                        onChange={(checked) => {
                          setAdvancedSettings(prev => ({
                            ...prev,
                            accessibility: { ...prev.accessibility, largeText: checked },
                          }));
                        }}
                        label="Large Text"
                        description="Increase text size across the application"
                      />
                    </SettingSection>

                    <SettingSection title="Motion" icon={<FaSlidersH />}>
                      <ToggleSwitch
                        checked={advancedSettings.accessibility.animationsReduced}
                        onChange={(checked) => {
                          setAdvancedSettings(prev => ({
                            ...prev,
                            accessibility: { ...prev.accessibility, animationsReduced: checked },
                          }));
                        }}
                        label="Reduce Motion"
                        description="Minimise animations and motion effects"
                      />

                      <div className="border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] p-4 flex items-start gap-3">
                        <FaInfoCircle className="text-[#CC0000] mt-0.5 flex-shrink-0" />
                        <p
                          className="text-sm text-[#A3A3A3] leading-relaxed"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          These settings affect all animations within the vault application and are
                          saved locally to your device.
                        </p>
                      </div>
                    </SettingSection>
                  </div>
                </SettingCard>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CHANGE LOG PANEL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showChangesHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-6 md:mx-8 mb-8 border-2 border-[#111111] overflow-hidden newsprint-texture"
          >
            {/* Panel header — inverted */}
            <div className="bg-[#111111] text-[#F9F9F7] p-6 flex items-center justify-between border-b-2 border-[#111111]">
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-[#F9F9F7]">
                  <FaHistory className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-black text-[#F9F9F7] uppercase tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Change Log
                  </h3>
                  <p
                    className="text-[#A3A3A3] text-sm mt-0.5"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    Track modifications to your settings and preferences
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className="text-[0.6rem] text-[#A3A3A3] font-bold uppercase tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {settingsHistory.length} CHANGE{settingsHistory.length !== 1 ? 'S' : ''}
                </span>
                <button
                  onClick={() => setShowChangesHistory(false)}
                  className="p-2 border border-[#404040] text-[#F9F9F7] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Empty state */}
            {settingsHistory.length === 0 ? (
              <div className="p-16 text-center bg-[#F9F9F7]">
                <div className="mx-auto w-16 h-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
                  <FaHistory className="text-2xl" />
                </div>
                <h4
                  className="text-2xl font-black text-[#111111] mb-2 uppercase tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  NO CHANGES YET
                </h4>
                <p
                  className="text-[#525252] max-w-sm mx-auto"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  When you modify settings, they'll appear here for easy tracking.
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto bg-[#F9F9F7]">
                  <table className="min-w-full divide-y-2 divide-[#111111]">
                    <thead className="bg-[#E5E5E0]">
                      <tr>
                        {['DATE & TIME', 'CATEGORY', 'SETTING', 'NEW VALUE'].map((col) => (
                          <th
                            key={col}
                            className="px-6 py-3 text-left text-[0.6rem] font-black uppercase tracking-widest text-[#111111] border-r border-[#111111] last:border-r-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E0]">
                      {settingsHistory.slice(0, 10).map((change, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="hover:bg-[#E5E5E0] transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap border-r border-[#E5E5E0]">
                            <div className="flex flex-col">
                              <span
                                className="text-xs font-bold text-[#111111]"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                {new Date(change.timestamp).toLocaleDateString()}
                              </span>
                              <span
                                className="text-[0.6rem] text-[#525252] uppercase tracking-widest mt-0.5"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {new Date(change.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap border-r border-[#E5E5E0]">
                            <span
                              className={`inline-block px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest border ${getCategoryBadge(change.category)}`}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {change.category}
                            </span>
                          </td>

                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-black text-[#111111] border-r border-[#E5E5E0]"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {change.key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {typeof change.value === 'boolean' ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest border ${
                                  change.value
                                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                                    : 'bg-white text-[#525252] border-[#E5E5E0]'
                                }`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {change.value ? <FaCheckCircle /> : <FaTimes />}
                                {change.value ? 'ENABLED' : 'DISABLED'}
                              </span>
                            ) : (
                              <span
                                className="text-xs font-bold border-2 border-[#111111] bg-[#F9F9F7] px-2 py-1 text-[#111111]"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {change.value.toString()}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="p-5 border-t-2 border-[#111111] bg-[#E5E5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span
                    className="text-xs text-[#525252] font-bold uppercase tracking-widest"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Changes are automatically tracked and synced across your devices
                  </span>
                  <div className="flex gap-3">
                    {settingsHistory.length > 10 && (
                      <button
                        className="px-4 py-2 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        VIEW ALL {settingsHistory.length}
                      </button>
                    )}
                    <button
                      onClick={() => setSettingsHistory([])}
                      className="px-4 py-2 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      CLEAR LOG
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VERIFICATION MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full overflow-hidden newsprint-texture"
            >
              {/* Modal header — inverted */}
              <div className="bg-[#111111] text-[#F9F9F7] py-5 px-6 flex justify-between items-center border-b-4 border-[#CC0000]">
                <h3
                  className="text-xl font-black uppercase tracking-tight text-[#F9F9F7] flex items-center gap-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <div className="p-2 border-2 border-[#F9F9F7]">
                    <FaLock className="text-[#F9F9F7]" />
                  </div>
                  Security Verification
                </h3>
                <button
                  onClick={() => setShowVerification(false)}
                  className="p-2 border border-[#404040] text-[#F9F9F7] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-8">
                <div className="mb-6 flex items-start gap-5">
                  <div className="p-4 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] flex-shrink-0">
                    <FaUserShield className="h-6 w-6" />
                  </div>
                  <div>
                    <h4
                      className="font-black text-xl text-[#111111] uppercase tracking-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Verify Your Identity
                    </h4>
                    <p
                      className="text-[#525252] mt-2 leading-relaxed border-l-4 border-[#CC0000] pl-3"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      For your security, please verify your identity to make changes to{' '}
                      <strong className="text-[#111111]">{currentAction}</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-[0.65rem] font-black uppercase tracking-widest text-[#111111] mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      MASTER PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        className={inputCls + " pr-10"}
                        placeholder="Enter your master password"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <FaLock className="text-[#525252]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-[#111111] flex justify-end gap-3">
                    <button
                      onClick={() => setShowVerification(false)}
                      className="px-6 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      CANCEL
                    </button>
                    <button
                      className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaCheck /> VERIFY & CONTINUE
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;