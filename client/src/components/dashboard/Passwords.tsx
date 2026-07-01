import React, { useState, useMemo, useRef, useEffect } from 'react';
import { passwordAPI } from '../../services/api';
import alertService from '../../services/alertService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaKey, FaEye, FaEyeSlash, FaCopy, FaEdit, FaTrash, FaPlus,
  FaSearch, FaFilter, FaSort, FaShieldAlt, FaDice, FaFolder, FaCreditCard, FaIdCard, FaAddressCard, FaFileAlt,
  FaExclamationTriangle, FaCheckCircle, FaChevronRight, FaTimes, FaLock, FaGlobe, FaRocket,
  FaFingerprint, FaUserShield, FaDigitalTachograph, FaRegCopy, FaRegCheckCircle,
  FaClipboard, FaClipboardCheck, FaDatabase, FaAngleRight, FaInfoCircle, FaCog,
  FaSpinner
} from 'react-icons/fa';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  lastUpdated: string;
  category: string;
  strength: 'weak' | 'medium' | 'strong';
  notes?: string;
  isFavorite?: boolean;
  passType: 'account' | 'payment' | 'identity' | 'license' | 'document';
  expiryDate?: string;
  issuer?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolvePassType = (category: string): Password['passType'] => {
  switch (category) {
    case 'finance':   return 'payment';
    case 'identity':  return 'identity';
    case 'license':   return 'license';
    case 'document':  return 'document';
    default:          return 'account';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const Passwords = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [passwords, setPasswords]           = useState<Password[]>([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);

  const [showPassword, setShowPassword]     = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy]                 = useState<'title' | 'lastUpdated'>('title');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [generatedPassword, setGeneratedPassword]         = useState('');
  const [showAddEditModal, setShowAddEditModal]           = useState(false);
  const [selectedPassword, setSelectedPassword]           = useState<Password | null>(null);

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode]           = useState('');
  const [pendingPasswordId, setPendingPasswordId]         = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading]     = useState(false);

  const categories = ['all', 'identity', 'payment', 'finance', 'license', 'document'];

  // Motion variants (preserved from original)
  const containerVariants = {
    hidden:  { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } }
  };
  const cardVariants = {
    hidden:  { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    hover:   { y: -4 }
  };

  const [passwordOptions, setPasswordOptions] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers:   true,
    includeSymbols:   true
  });

  const [websiteUrl, setWebsiteUrl]                         = useState('');
  const [platformSpecificPassword, setPlatformSpecificPassword] = useState('');

  // ─── Password Generation Logic (untouched) ──────────────────────────────────

  const generatePassword = () => {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers:   '0123456789',
      symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    let chars = '';
    if (passwordOptions.includeUppercase) chars += charset.uppercase;
    if (passwordOptions.includeLowercase) chars += charset.lowercase;
    if (passwordOptions.includeNumbers)   chars += charset.numbers;
    if (passwordOptions.includeSymbols)   chars += charset.symbols;
    let password = '';
    for (let i = 0; i < passwordOptions.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
  };

  const generatePlatformSpecificPassword = () => {
    if (!websiteUrl.trim()) { setPlatformSpecificPassword(''); return; }
    let domain = '';
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
    const platformRules: { [key: string]: { length: number; symbols: boolean; numbers: boolean; uppercase: boolean } } = {
      'facebook.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'instagram.com': { length: 14, symbols: true, numbers: true, uppercase: true },
      'twitter.com': { length: 15, symbols: true, numbers: true, uppercase: true },
      'x.com': { length: 15, symbols: true, numbers: true, uppercase: true },
      'linkedin.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'google.com': { length: 20, symbols: true, numbers: true, uppercase: true },
      'gmail.com': { length: 20, symbols: true, numbers: true, uppercase: true },
      'yahoo.com': { length: 18, symbols: true, numbers: true, uppercase: true },
      'outlook.com': { length: 18, symbols: true, numbers: true, uppercase: true },
      'github.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'stackoverflow.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'reddit.com': { length: 15, symbols: true, numbers: true, uppercase: true },
      'youtube.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'netflix.com': { length: 14, symbols: true, numbers: true, uppercase: true },
      'amazon.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'paypal.com': { length: 20, symbols: true, numbers: true, uppercase: true },
      'apple.com': { length: 18, symbols: true, numbers: true, uppercase: true },
      'microsoft.com': { length: 18, symbols: true, numbers: true, uppercase: true },
      'dropbox.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'twitch.tv': { length: 15, symbols: true, numbers: true, uppercase: true },
      'discord.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'slack.com': { length: 16, symbols: true, numbers: true, uppercase: true },
      'zoom.us': { length: 16, symbols: true, numbers: true, uppercase: true },
      'default': { length: 14, symbols: true, numbers: true, uppercase: true }
    };
    const rules = platformRules[domain] || platformRules['default'];
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers:   '0123456789',
      symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    let chars = charset.lowercase;
    if (rules.uppercase) chars += charset.uppercase;
    if (rules.numbers)   chars += charset.numbers;
    if (rules.symbols)   chars += charset.symbols;
    let password = '';
    if (rules.uppercase) password += charset.uppercase.charAt(Math.floor(Math.random() * charset.uppercase.length));
    if (rules.numbers)   password += charset.numbers.charAt(Math.floor(Math.random() * charset.numbers.length));
    if (rules.symbols)   password += charset.symbols.charAt(Math.floor(Math.random() * charset.symbols.length));
    password += charset.lowercase.charAt(Math.floor(Math.random() * charset.lowercase.length));
    for (let i = password.length; i < rules.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setPlatformSpecificPassword(password);
  };

  const getPlatformInfo = (url: string) => {
    if (!url) return null;
    let domain = '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = urlObj.hostname.replace('www.', '');
    } catch {
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
    const platformInfo: { [key: string]: { name: string; color: string; icon: string } } = {
      'facebook.com':   { name: 'Facebook',     color: 'bg-blue-600',   icon: '📘' },
      'instagram.com':  { name: 'Instagram',    color: 'bg-gradient-to-r from-purple-400 to-pink-400', icon: '📷' },
      'twitter.com':    { name: 'Twitter/X',    color: 'bg-black',      icon: '🐦' },
      'x.com':          { name: 'X (Twitter)',  color: 'bg-black',      icon: '❌' },
      'linkedin.com':   { name: 'LinkedIn',     color: 'bg-blue-700',   icon: '💼' },
      'google.com':     { name: 'Google',       color: 'bg-red-500',    icon: '🔍' },
      'gmail.com':      { name: 'Gmail',        color: 'bg-red-500',    icon: '📧' },
      'github.com':     { name: 'GitHub',       color: 'bg-gray-800',   icon: '💻' },
      'youtube.com':    { name: 'YouTube',      color: 'bg-red-600',    icon: '📹' },
      'netflix.com':    { name: 'Netflix',      color: 'bg-red-600',    icon: '🎬' },
      'amazon.com':     { name: 'Amazon',       color: 'bg-orange-500', icon: '🛒' },
      'paypal.com':     { name: 'PayPal',       color: 'bg-blue-500',   icon: '💳' },
      'apple.com':      { name: 'Apple',        color: 'bg-gray-900',   icon: '🍎' },
      'microsoft.com':  { name: 'Microsoft',    color: 'bg-blue-600',   icon: '🏢' },
      'dropbox.com':    { name: 'Dropbox',      color: 'bg-blue-500',   icon: '📦' },
      'discord.com':    { name: 'Discord',      color: 'bg-indigo-600', icon: '🎮' },
      'slack.com':      { name: 'Slack',        color: 'bg-purple-600', icon: '💬' },
      'zoom.us':        { name: 'Zoom',         color: 'bg-blue-500',   icon: '📹' }
    };
    return platformInfo[domain] || { name: domain, color: 'bg-gray-500', icon: '🌐' };
  };

  // ─── Strength Helpers (preserved) ───────────────────────────────────────────

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':   return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default:       return 'bg-gray-500';
    }
  };

  const getPasswordStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'weak':   return <span className="flex items-center text-red-500 text-xs font-medium"><FaExclamationTriangle className="mr-1" /> Weak</span>;
      case 'medium': return <span className="flex items-center text-yellow-500 text-xs font-medium"><FaShieldAlt className="mr-1" /> Medium</span>;
      case 'strong': return <span className="flex items-center text-green-500 text-xs font-medium"><FaCheckCircle className="mr-1" /> Strong</span>;
      default: return null;
    }
  };

  // ─── Filtered & Sorted Passwords ────────────────────────────────────────────

  const filteredPasswords = useMemo(() => {
    return passwords
      .filter(p =>
        (selectedCategory === 'all' || p.category === selectedCategory) &&
        (p.title.toLowerCase().includes(search.toLowerCase()) ||
         p.username.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
  }, [passwords, search, selectedCategory, sortBy]);

  // ─── Copy Helper ────────────────────────────────────────────────────────────

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enhancedCopyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedText(null), 2000);
  };

  // ─── Pass-type Icon Helper (newsprint: all icons inherit parent color) ───────

  const getPassTypeIcon = (passType: string) => {
    switch (passType) {
      case 'payment':  return <FaCreditCard />;
      case 'identity': return <FaIdCard />;
      case 'license':  return <FaAddressCard />;
      case 'document': return <FaFileAlt />;
      default:         return <FaKey />;
    }
  };

  // ─── API Handlers (untouched) ────────────────────────────────────────────────

  const fetchPasswords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await passwordAPI.getPasswords({ limit: 100 });
      const items = res?.data?.data?.passwords || [];
      const mapped = items.map((p: any) => ({
        id:          p._id,
        title:       p.title,
        username:    p.username || '',
        password:    '••••••••',
        lastUpdated: p.updatedAt || p.createdAt,
        category:    p.category || 'other',
        strength:    p.strength || 'medium',
        notes:       p.notes || '',
        passType:    p.passType || 'account',
        expiryDate:  p.expiresAt || p.expiryDate || undefined,
        issuer:      p.website || p.issuer || ''
      }));
      setPasswords(mapped);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPasswords(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await passwordAPI.deletePassword(id);
      setPasswords(prev => prev.filter(p => p.id !== id));
      await alertService.createAlert({
        alertType: 'security_scan', severity: 'low',
        title: 'Credential removed', message: 'A credential was removed from your vault',
        relatedTo: 'password', relatedId: id,
      });
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete item');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await passwordAPI.toggleFavorite(id);
      const isFavorite = res?.data?.data?.isFavorite;
      setPasswords(prev => prev.map(p => p.id === id ? { ...p, isFavorite } : p));
    } catch (err) {
      console.error('Toggle favorite error', err);
    }
  };

  const handleMarkCompromised = async (id: string) => {
    try {
      await passwordAPI.markCompromised(id);
      setPasswords(prev => prev.map(p => p.id === id ? { ...p, strength: 'weak' } : p));
      await alertService.createAlert({
        alertType: 'breach', severity: 'high',
        title: 'Compromised credential detected', message: 'A credential was marked as compromised',
        relatedTo: 'password', relatedId: id, actionRequired: true, actionLabel: 'Review'
      });
    } catch (err) {
      console.error('Mark compromised error', err);
    }
  };

  const handleShowPassword = async (id: string) => {
    if (showPassword === id) { setShowPassword(null); return; }
    try {
      setLoading(true);
      await passwordAPI.requestAccess(id);
      setPendingPasswordId(id);
      setVerificationCode('');
      setVerificationModalOpen(true);
    } catch (err) {
      console.error('Request access error', err);
      alert('Failed to request access code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccess = async () => {
    if (!pendingPasswordId || !verificationCode) return;
    setVerificationLoading(true);
    try {
      const res = await passwordAPI.verifyAccess(pendingPasswordId, verificationCode);
      const pw = res?.data?.data?.password;
      if (pw) {
        setPasswords(prev => prev.map(p => p.id === pendingPasswordId ? { ...p, password: pw.password } : p));
        setShowPassword(pendingPasswordId);
        setVerificationModalOpen(false);
        setPendingPasswordId(null);
      }
    } catch (err: any) {
      console.error('Verify access error', err);
      alert(err?.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title:     String(formData.get('title')     || '').trim(),
      username:  String(formData.get('username')  || '').trim(),
      password:  String(formData.get('password')  || '').trim(),
      category:  String(formData.get('category')  || 'other'),
      website:   String(formData.get('website')   || '').trim(),
      expiresAt: String(formData.get('expiryDate')|| '').trim(),
      notes:     String(formData.get('notes')     || '').trim(),
    };
    if (!payload.title || !payload.password) { setError('Title and password are required'); return; }
    setSaving(true); setError(null);
    try {
      if (selectedPassword) {
        const response = await passwordAPI.updatePassword(selectedPassword.id, payload);
        const updated = response?.data?.data?.password;
        setPasswords(prev => prev.map(item => item.id === selectedPassword.id ? {
          ...item,
          title:       updated?.title       || payload.title,
          username:    updated?.username    || payload.username,
          category:    updated?.category   || payload.category,
          notes:       updated?.notes      || payload.notes,
          expiryDate:  updated?.expiresAt  || payload.expiresAt,
          issuer:      updated?.website    || payload.website,
          lastUpdated: updated?.updatedAt  || new Date().toISOString(),
          passType:    resolvePassType(updated?.category || payload.category),
        } : item));
        await alertService.createAlert({
          alertType: 'security_scan', severity: 'low',
          title: 'Credential updated', message: `Credential "${payload.title}" was updated`,
          relatedTo: 'password', relatedId: selectedPassword.id,
        });
      } else {
        const response = await passwordAPI.createPassword(payload);
        const created = response?.data?.data?.password;
        if (created) {
          setPasswords(prev => [{
            id:          created._id,
            title:       created.title,
            username:    created.username   || payload.username,
            password:    '••••••••',
            lastUpdated: created.updatedAt  || created.createdAt || new Date().toISOString(),
            category:    created.category   || payload.category,
            strength:    created.strength   || 'medium',
            notes:       created.notes      || payload.notes,
            isFavorite:  created.isFavorite,
            passType:    resolvePassType(created.category || payload.category),
            expiryDate:  created.expiresAt  || payload.expiresAt || undefined,
            issuer:      created.website    || payload.website,
          }, ...prev]);
        }
        await alertService.createAlert({
          alertType: 'security_scan', severity: 'low',
          title: 'Credential created', message: `Credential "${payload.title}" was added to your vault`,
          relatedTo: 'password', relatedId: created?._id,
        });
      }
      setShowAddEditModal(false);
      setSelectedPassword(null);
      event.currentTarget.reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save credential');
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived stats ───────────────────────────────────────────────────────────
  const strongCount = passwords.filter(p => p.strength === 'strong').length;
  const weakCount   = passwords.filter(p => p.strength === 'weak').length;

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div
      className="bg-[#F9F9F7]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}
    >
      {/* ─── Font & Utility Styles ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
        .np-serif  { font-family: 'Playfair Display', 'Times New Roman', serif; }
        .np-body   { font-family: 'Lora', Georgia, serif; }
        .np-sans   { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
        .np-mono   { font-family: 'JetBrains Mono', 'Courier New', monospace; }
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
          z-index: 0;
        }
        .hard-shadow-hover { transition: all 0.2s ease-out; }
        .hard-shadow-hover:hover {
          box-shadow: 4px 4px 0px 0px #111111;
          transform: translate(-2px, -2px);
        }
        .np-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          background: #111111;
          cursor: pointer;
          border: 2px solid #111111;
          border-radius: 0;
        }
        .np-range::-webkit-slider-runnable-track {
          height: 8px;
          background: #E5E5E0;
          border: 2px solid #111111;
        }
        .np-checkbox {
          -webkit-appearance: none;
          appearance: none;
          width: 20px; height: 20px;
          border: 2px solid #111111;
          background: white;
          cursor: pointer;
          position: relative;
        }
        .np-checkbox:checked { background-color: #111111; }
        .np-checkbox:checked::after {
          content: '';
          position: absolute;
          top: 2px; left: 5px;
          width: 5px; height: 9px;
          border: 2px solid #F9F9F7;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — PAGE HEADER
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          {/* Left: Title block */}
          <div>
            <div
              className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SECURE VAULT &bull; CREDENTIALS
            </div>
            <h2
              className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              CREDENTIAL<br />
              <span className="italic" style={{ color: "#CC0000" }}>VAULT</span>
            </h2>
            <p
              className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Manage, organize, and secure all your passwords and digital credentials in one fortified vault.
            </p>
          </div>

          {/* Right: Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
            <button
              onClick={() => setShowPasswordGenerator(v => !v)}
              className={`px-6 py-4 border-2 border-[#111111] np-sans font-black uppercase text-xs tracking-widest transition-all ${
                showPasswordGenerator
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] hard-shadow-hover'
              }`}
            >
              {showPasswordGenerator ? 'HIDE GENERATOR' : 'GENERATOR'}
            </button>
            <button
              onClick={() => { setSelectedPassword(null); setShowAddEditModal(true); }}
              className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
            >
              <FaPlus /> ADD CREDENTIAL
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-4 gap-0 bg-[#111111] relative z-10">
          <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[TOTAL CREDENTIALS]</div>
            <div className="font-black text-[#111111] flex items-center gap-2 text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              <FaKey className="text-lg" /> {passwords.length}
            </div>
          </div>
          <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[STRONG PASSWORDS]</div>
            <div className="font-black text-[#111111] text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>{strongCount}</div>
          </div>
          <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[WEAK / AT RISK]</div>
            <div className={`font-black text-xl ${weakCount > 0 ? 'text-[#CC0000]' : 'text-[#111111]'}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              {weakCount}
            </div>
          </div>
          <div className="col-span-1 bg-[#F9F9F7] border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
            <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[ACTIVE FILTER]</div>
            <div className="font-bold text-[#111111] text-sm np-sans">
              {selectedCategory === 'all' ? 'ALL CATEGORIES' : selectedCategory.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — ERROR DISPLAY
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 border-b-4 border-[#CC0000] bg-[#F9F9F7] newsprint-texture"
          >
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
              <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] flex-shrink-0">
                <FaExclamationTriangle className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-2xl text-[#CC0000] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                  VAULT ERROR DETECTED
                </h3>
                <p className="text-[#111111] mt-2 font-bold np-sans">{error}</p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={() => setError(null)}
                    className="px-6 py-3 border-2 border-[#111111] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                  >
                    DISMISS
                  </button>
                  <button
                    onClick={fetchPasswords}
                    className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                  >
                    <FaSearch /> RETRY
                  </button>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-2 border border-[#111111] hover:bg-[#E5E5E0] text-[#111111] flex-shrink-0"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — SEARCH & FILTER BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="border-b-4 border-[#111111] bg-[#F9F9F7]">
        {/* Search row */}
        <div className="p-5 border-b-2 border-[#111111]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-stretch">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-[#111111]" />
              </div>
              <input
                type="text"
                placeholder="SEARCH TITLE, USERNAME, OR ISSUER..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full pl-12 pr-4 py-4 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] focus:bg-[#E5E5E0] focus:outline-none transition-all font-black uppercase text-xs tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            {/* Sort + Filter controls */}
            <div className="flex items-stretch gap-0 border-2 border-[#111111]">
              <div className="flex items-center px-4 border-r-2 border-[#111111] bg-[#E5E5E0]">
                <FaSort className="text-[#111111]" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'lastUpdated')}
                className="bg-[#F9F9F7] border-none text-xs focus:ring-0 text-[#111111] font-black uppercase tracking-widest px-4 py-4 appearance-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <option value="title">SORT BY NAME</option>
                <option value="lastUpdated">SORT BY UPDATED</option>
              </select>
              <button className="px-4 border-l-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#E5E5E0] transition-colors text-[#111111]">
                <FaFilter />
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-[#E5E5E0] px-5 py-3">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-[#111111] scrollbar-track-transparent">
            {categories.map((category, idx) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-3 flex items-center gap-2 whitespace-nowrap transition-all border-2 np-sans font-black uppercase text-xs tracking-widest flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111] z-10'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] border-[#111111]'
                } ${idx > 0 ? '-ml-[2px]' : ''}`}
              >
                {category === 'all'      && <FaDatabase />}
                {category === 'identity' && <FaIdCard />}
                {category === 'payment'  && <FaCreditCard />}
                {category === 'finance'  && <FaFolder />}
                {category === 'license'  && <FaAddressCard />}
                {category === 'document' && <FaFileAlt />}
                <span>{category === 'all' ? 'ALL ITEMS' : category.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — PASSWORD GENERATOR PANEL
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPasswordGenerator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b-4 border-[#111111] bg-[#F9F9F7]"
          >
            {/* Generator header — inverted */}
            <div className="bg-[#111111] text-[#F9F9F7] px-8 py-6 flex justify-between items-center border-b-4 border-[#CC0000]">
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                  <FaLock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                    PASSWORD GENERATOR
                  </h3>
                  <p className="text-sm mt-1 text-[#A3A3A3]" style={{ fontFamily: "'Lora', serif" }}>
                    Forge an unbreakable credential with precision controls.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordGenerator(false)}
                className="p-3 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Website URL */}
              <div className="space-y-3">
                <label className="block text-[0.65rem] font-bold uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  WEBSITE URL <span className="text-[#525252]">(OPTIONAL — PLATFORM-SPECIFIC RULES)</span>
                </label>
                <div className="relative flex items-center border-2 border-[#111111]">
                  <div className="absolute left-4 pointer-events-none">
                    <FaGlobe className="text-[#111111]" />
                  </div>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => { setWebsiteUrl(e.target.value); setPlatformSpecificPassword(''); }}
                    placeholder="e.g., facebook.com, github.com, netflix.com"
                    className="w-full pl-12 pr-4 py-4 bg-[#F9F9F7] focus:bg-[#E5E5E0] text-[#111111] font-bold focus:outline-none transition-all np-sans"
                  />
                </div>
              </div>

              {/* Platform recognition */}
              {websiteUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#E5E5E0] p-4 border-2 border-[#111111] flex items-center gap-4"
                >
                  <div className="w-12 h-12 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center text-xl flex-shrink-0">
                    {getPlatformInfo(websiteUrl)?.icon || '🌐'}
                  </div>
                  <div>
                    <h4 className="font-black text-[#111111] uppercase tracking-wide np-sans">
                      {getPlatformInfo(websiteUrl)?.name}
                    </h4>
                    <p className="text-[0.65rem] text-[#525252] uppercase tracking-widest mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      PLATFORM RECOGNIZED &bull; OPTIMIZED RULES APPLIED
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Generated password display — inverted */}
              <div className="bg-[#111111] text-[#F9F9F7] p-5 flex items-center gap-4 border-2 border-[#111111]">
                <input
                  type="text"
                  readOnly
                  value={websiteUrl ? platformSpecificPassword : generatedPassword}
                  placeholder={websiteUrl ? 'PLATFORM PASSWORD WILL APPEAR HERE' : 'YOUR SECURE PASSWORD WILL APPEAR HERE'}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg tracking-widest text-[#F9F9F7] placeholder-[#737373]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button
                  onClick={() => enhancedCopyToClipboard(websiteUrl ? platformSpecificPassword : generatedPassword, 'generated')}
                  className="px-4 py-3 border-2 border-[#F9F9F7] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors flex items-center gap-2 np-sans font-black uppercase text-xs tracking-widest flex-shrink-0"
                >
                  {copiedText === 'generated'
                    ? <><FaClipboardCheck /> COPIED!</>
                    : <><FaClipboard /> COPY</>}
                </button>
              </div>

              {/* Length slider */}
              <div className="p-6 border-2 border-[#111111] bg-white">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-black text-[#111111] uppercase tracking-widest text-xs np-mono">PASSWORD LENGTH</label>
                  <span className="text-sm bg-[#111111] text-[#F9F9F7] px-3 py-1.5 border-2 border-[#111111] np-mono">
                    {passwordOptions.length} CHARS
                  </span>
                </div>
                <input
                  type="range" min="8" max="32"
                  value={passwordOptions.length}
                  onChange={(e) => setPasswordOptions({ ...passwordOptions, length: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#E5E5E0] appearance-none cursor-pointer np-range"
                />
                <div className="flex justify-between text-[0.65rem] text-[#525252] mt-2 uppercase tracking-widest font-bold np-mono">
                  <span>8</span><span>20</span><span>32</span>
                </div>
              </div>

              {/* Charset checkboxes — 2×2 grid */}
              <div className="grid grid-cols-2 border-2 border-[#111111]">
                {[
                  { key: 'includeUppercase', label: 'UPPERCASE LETTERS', sub: 'A – Z' },
                  { key: 'includeLowercase', label: 'LOWERCASE LETTERS', sub: 'a – z' },
                  { key: 'includeNumbers',   label: 'NUMBERS',           sub: '0 – 9' },
                  { key: 'includeSymbols',   label: 'SPECIAL CHARS',     sub: '! @ # $ % ^' },
                ].map(({ key, label, sub }, i) => (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-5 cursor-pointer transition-colors hover:bg-[#E5E5E0] ${
                      (passwordOptions as any)[key] ? 'bg-[#F9F9F7]' : 'bg-[#E5E5E0] opacity-60'
                    } ${i % 2 === 0 ? 'border-r-2 border-[#111111]' : ''} ${i < 2 ? 'border-b-2 border-[#111111]' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={(passwordOptions as any)[key]}
                      onChange={() => setPasswordOptions({ ...passwordOptions, [key]: !(passwordOptions as any)[key] })}
                      className="np-checkbox flex-shrink-0"
                    />
                    <div>
                      <div className="font-black text-[#111111] text-xs uppercase tracking-widest np-sans">{label}</div>
                      <div className="text-[0.65rem] text-[#525252] mt-0.5 np-mono">{sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-4 p-4 bg-[#E5E5E0] border-2 border-[#111111]">
                <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] flex-shrink-0">
                  <FaShieldAlt />
                </div>
                <p className="text-sm text-[#111111]" style={{ fontFamily: "'Lora', serif" }}>
                  Strong passwords are at least 12 characters combining uppercase, lowercase, numbers, and symbols.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-4 border-[#111111]">
                <button
                  onClick={websiteUrl ? generatePlatformSpecificPassword : generatePassword}
                  className="flex-1 px-6 py-4 bg-[#CC0000] text-[#F9F9F7] border-2 border-[#CC0000] flex items-center justify-center gap-2 hover:bg-[#990000] transition-colors np-sans font-black uppercase text-xs tracking-widest"
                >
                  <FaDice /> {websiteUrl ? 'GENERATE PLATFORM PASSWORD' : 'GENERATE STRONG PASSWORD'}
                </button>
                <button
                  onClick={() => {
                    const pw = websiteUrl ? platformSpecificPassword : generatedPassword;
                    if (pw && selectedPassword) setShowPasswordGenerator(false);
                  }}
                  disabled={!(websiteUrl ? platformSpecificPassword : generatedPassword) || !selectedPassword}
                  className={`px-6 py-4 flex items-center justify-center gap-2 np-sans font-black uppercase text-xs tracking-widest border-2 transition-colors ${
                    (websiteUrl ? platformSpecificPassword : generatedPassword) && selectedPassword
                      ? 'bg-[#111111] text-[#F9F9F7] border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111]'
                      : 'bg-[#E5E5E0] text-[#525252] cursor-not-allowed border-[#111111]'
                  }`}
                >
                  <FaCheckCircle /> USE THIS PASSWORD
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5 — LOADING STATE
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#111111] text-[#F9F9F7] p-8 border-b-4 border-[#CC0000]"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 border-2 border-[#F9F9F7] flex-shrink-0">
                <FaKey className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                  LOADING VAULT
                </h3>
                <p className="text-[#A3A3A3] text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>
                  Decrypting and verifying credentials…
                </p>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-8 border-2 border-t-[#CC0000] border-[#F9F9F7] animate-spin"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6 — PASSWORD GRID
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 md:p-8">
        {filteredPasswords.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-16 border-4 border-dashed border-[#111111] text-center"
          >
            <div className="mx-auto w-20 h-20 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
              <FaSearch className="text-2xl" />
            </div>
            <h3
              className="text-2xl font-black text-[#111111] mb-2 uppercase tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              NO CREDENTIALS FOUND
            </h3>
            <p className="text-[#525252] max-w-md mx-auto mb-8" style={{ fontFamily: "'Lora', serif" }}>
              No items match your current search or filters. Try adjusting your criteria or add a new credential to your vault.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => { setSelectedCategory('all'); setSearch(''); }}
                className="px-6 py-3 border-2 border-[#111111] text-[#111111] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
              >
                CLEAR FILTERS
              </button>
              <button
                onClick={() => { setSelectedPassword(null); setShowAddEditModal(true); }}
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#990000] flex items-center gap-2 transition-colors"
              >
                <FaPlus /> ADD FIRST CREDENTIAL
              </button>
            </div>
          </motion.div>
        ) : (
          /* Password card grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredPasswords.map(password => (
              <motion.div
                key={password.id}
                variants={cardVariants}
                className="border-2 border-[#111111] bg-white hard-shadow-hover overflow-hidden flex flex-col"
              >
                {/* Strength strip */}
                <div className={`h-1.5 w-full flex-shrink-0 ${
                  password.strength === 'strong' ? 'bg-[#111111]' :
                  password.strength === 'medium' ? 'bg-[#525252]' :
                  'bg-[#CC0000]'
                }`} />

                {/* Card header */}
                <div className="p-5 border-b-2 border-[#111111] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="p-3 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] flex-shrink-0">
                      {getPassTypeIcon(password.passType)}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-black text-[#111111] truncate"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {password.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {password.issuer && (
                          <span className="text-xs text-[#525252] truncate" style={{ fontFamily: "'Lora', serif" }}>
                            {password.issuer}
                          </span>
                        )}
                        {password.expiryDate && (
                          <span
                            className="text-[0.6rem] px-2 py-0.5 border border-[#111111] text-[#111111] font-bold uppercase tracking-widest flex-shrink-0"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            EXP {new Date(password.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedPassword(password as Password); setShowAddEditModal(true); }}
                      className="p-2.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                      title="Edit credential"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => { if (confirm('Are you sure you want to delete this item?')) handleDelete(password.id as string); }}
                      className="p-2.5 border-2 border-[#CC0000] bg-[#F9F9F7] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors"
                      title="Delete credential"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-3 flex-1">
                  {/* Username row */}
                  <div className="flex items-center justify-between p-3 bg-[#F9F9F7] border-2 border-[#111111]">
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >USERNAME</div>
                      <div className="font-bold text-[#111111] truncate np-sans">{password.username}</div>
                    </div>
                    <button
                      onClick={() => enhancedCopyToClipboard(password.username, `user-${password.id}`)}
                      className={`ml-2 p-2.5 border-2 transition-colors flex-shrink-0 ${
                        copiedText === `user-${password.id}`
                          ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                          : 'border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                      }`}
                    >
                      {copiedText === `user-${password.id}` ? <FaRegCheckCircle /> : <FaRegCopy />}
                    </button>
                  </div>

                  {/* Password row */}
                  <div className="flex items-center justify-between p-3 bg-[#F9F9F7] border-2 border-[#111111]">
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >PASSWORD</div>
                      <div
                        className="text-[#111111] tracking-widest"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {showPassword === password.id ? password.password : '••••••••'}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleShowPassword(password.id as string)}
                        className="p-2.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                      >
                        {showPassword === password.id ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={() => enhancedCopyToClipboard(password.password, `pass-${password.id}`)}
                        className={`p-2.5 border-2 transition-colors ${
                          copiedText === `pass-${password.id}`
                            ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                            : 'border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                        }`}
                      >
                        {copiedText === `pass-${password.id}` ? <FaRegCheckCircle /> : <FaRegCopy />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t-2 border-[#111111] flex items-center justify-between gap-2 bg-[#F9F9F7]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 bg-[#111111] flex-shrink-0"></div>
                    <span
                      className="text-[0.6rem] text-[#525252] uppercase tracking-widest font-bold truncate"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {password.category.toUpperCase()}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 border-2 text-[0.6rem] font-black uppercase tracking-widest flex-shrink-0 ${
                    password.strength === 'strong' ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]' :
                    password.strength === 'medium' ? 'border-[#525252] text-[#525252]' :
                    'border-[#CC0000] text-[#CC0000]'
                  }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {password.strength === 'strong' ? <FaCheckCircle size={8} /> :
                     password.strength === 'medium' ? <FaShieldAlt size={8} /> :
                     <FaExclamationTriangle size={8} />}
                    {password.strength.toUpperCase()}
                  </div>
                </div>

                {/* Last updated strip */}
                <div className="px-5 py-2 border-t border-[#E5E5E0] bg-white">
                  <span
                    className="text-[0.6rem] text-[#525252] uppercase tracking-widest font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    UPDATED {new Date(password.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — ADD / EDIT CREDENTIAL
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/75 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal header — inverted */}
              <div className="bg-[#111111] text-[#F9F9F7] px-8 py-6 flex justify-between items-center border-b-4 border-[#CC0000]">
                <div className="flex items-center gap-4">
                  <div className="p-2 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                    {selectedPassword ? <FaEdit className="h-5 w-5" /> : <FaPlus className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {selectedPassword ? 'EDIT CREDENTIAL' : 'ADD CREDENTIAL'}
                    </h3>
                    <p className="text-[#A3A3A3] text-xs mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                      {selectedPassword ? 'Update your stored credential.' : 'Secure a new credential in the vault.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-108px)]">
                <form className="space-y-5" onSubmit={handleSubmitPassword}>
                  {/* Title */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">TITLE</label>
                    <input
                      type="text"
                      defaultValue={selectedPassword?.title}
                      name="title"
                      className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold transition-all np-sans"
                      placeholder="Enter credential title"
                      required
                    />
                  </div>

                  {/* Category + Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">CATEGORY</label>
                      <select
                        defaultValue={selectedPassword?.category || 'finance'}
                        name="category"
                        className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold uppercase appearance-none np-sans"
                      >
                        <option value="finance">FINANCE</option>
                        <option value="identity">IDENTITY</option>
                        <option value="payment">PAYMENT</option>
                        <option value="license">LICENSE</option>
                        <option value="document">DOCUMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">TYPE</label>
                      <select
                        defaultValue={selectedPassword?.passType || 'account'}
                        name="passType"
                        className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold uppercase appearance-none np-sans"
                      >
                        <option value="account">ACCOUNT</option>
                        <option value="payment">PAYMENT</option>
                        <option value="identity">IDENTITY</option>
                        <option value="license">LICENSE</option>
                        <option value="document">DOCUMENT</option>
                      </select>
                    </div>
                  </div>

                  {/* Issuer */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">ISSUER / ORGANIZATION</label>
                    <input
                      type="text"
                      defaultValue={selectedPassword?.issuer}
                      name="website"
                      className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold transition-all np-sans"
                      placeholder="e.g., Bank Name, Service Provider"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">USERNAME / ID</label>
                    <input
                      type="text"
                      defaultValue={selectedPassword?.username}
                      name="username"
                      className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold transition-all np-sans"
                      placeholder="Enter your username or ID"
                      required
                    />
                  </div>

                  {/* Password + strength */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">PASSWORD</label>
                    <div className="relative">
                      <input
                        type="password"
                        defaultValue={selectedPassword?.password}
                        name="password"
                        className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none pr-24 transition-all"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        placeholder="Enter a secure password"
                        required
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button type="button" className="p-1.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors">
                          <FaEye size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="p-1.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#CC0000] hover:text-[#F9F9F7] hover:border-[#CC0000] transition-colors"
                        >
                          <FaDice size={12} />
                        </button>
                      </div>
                    </div>
                    {/* Strength indicator */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex gap-1 flex-1">
                        <div className={`h-1.5 flex-1 border border-[#111111] ${selectedPassword?.strength ? 'bg-[#CC0000]' : 'bg-transparent'}`}></div>
                        <div className={`h-1.5 flex-1 border border-[#111111] ${selectedPassword?.strength === 'medium' || selectedPassword?.strength === 'strong' ? 'bg-[#525252]' : 'bg-transparent'}`}></div>
                        <div className={`h-1.5 flex-1 border border-[#111111] ${selectedPassword?.strength === 'strong' ? 'bg-[#111111]' : 'bg-transparent'}`}></div>
                      </div>
                      <span className="text-[0.65rem] uppercase tracking-widest text-[#525252] font-bold np-mono">
                        {!selectedPassword ? 'N/A' : selectedPassword.strength === 'strong' ? 'STRONG' : selectedPassword.strength === 'medium' ? 'MEDIUM' : 'WEAK'}
                      </span>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">EXPIRY DATE</label>
                    <input
                      type="date"
                      defaultValue={(selectedPassword && selectedPassword.expiryDate) ? selectedPassword.expiryDate.split('T')[0] : ''}
                      name="expiryDate"
                      className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-bold np-sans"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-2 np-mono">NOTES</label>
                    <textarea
                      defaultValue={selectedPassword?.notes}
                      name="notes"
                      className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none resize-none text-[#111111]"
                      style={{ fontFamily: "'Lora', serif" }}
                      rows={3}
                      placeholder="Add any additional notes or details"
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="pt-4 flex justify-end gap-4 border-t-4 border-[#111111]">
                    <button
                      type="button"
                      onClick={() => setShowAddEditModal(false)}
                      className="px-6 py-3 border-2 border-[#111111] text-[#111111] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {saving
                        ? <><FaSpinner className="animate-spin" /> SAVING…</>
                        : selectedPassword ? 'UPDATE CREDENTIAL' : 'SAVE CREDENTIAL'
                      }
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — DEVICE VERIFICATION
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {verificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/75"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-md overflow-hidden"
            >
              {/* Modal header — inverted */}
              <div className="bg-[#111111] text-[#F9F9F7] px-8 py-6 flex justify-between items-center border-b-4 border-[#CC0000]">
                <div className="flex items-center gap-4">
                  <div className="p-2 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                    <FaShieldAlt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                      DEVICE VERIFICATION
                    </h3>
                    <p className="text-[#A3A3A3] text-xs mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                      Identity confirmation required.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationModalOpen(false)}
                  className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-8 space-y-6">
                <p className="text-[#525252] leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                  For your security, a 6-digit verification code has been dispatched to your linked devices. Enter it below to unlock this credential.
                </p>

                <div>
                  <label className="block text-[0.65rem] font-black text-[#111111] uppercase tracking-widest mb-3 np-mono">
                    VERIFICATION CODE
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="● ● ● ● ● ●"
                    className="w-full px-4 py-5 text-center text-3xl tracking-[0.5em] border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] focus:outline-none text-[#111111] font-black transition-all"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t-4 border-[#111111]">
                  <button
                    onClick={() => setVerificationModalOpen(false)}
                    className="px-6 py-3 border-2 border-[#111111] text-[#111111] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleVerifyAccess}
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] np-sans font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {verificationLoading
                      ? <><FaSpinner className="animate-spin" /> VERIFYING…</>
                      : 'VERIFY ACCESS'
                    }
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

export default Passwords;