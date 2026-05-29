import React, { useState, useMemo, useRef, useEffect } from 'react';
import { passwordAPI } from '../../services/api';
import alertService from '../../services/alertService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaKey, FaEye, FaEyeSlash, FaCopy, FaEdit, FaTrash, FaPlus, 
  FaSearch, FaFilter, FaSort, FaShieldAlt, FaDice, FaFolder, FaCreditCard, FaIdCard, FaAddressCard, FaFileAlt,
  FaExclamationTriangle, FaCheckCircle, FaChevronRight, FaTimes, FaLock,FaGlobe,FaRocket,
  FaFingerprint, FaUserShield, FaDigitalTachograph, FaRegCopy, FaRegCheckCircle,
  FaClipboard, FaClipboardCheck, FaDatabase, FaAngleRight, FaInfoCircle, FaCog
} from 'react-icons/fa';

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

const resolvePassType = (category: string): Password['passType'] => {
  switch (category) {
    case 'finance':
      return 'payment';
    case 'identity':
      return 'identity';
    case 'license':
      return 'license';
    case 'document':
      return 'document';
    default:
      return 'account';
  }
};

const Passwords = () => {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'lastUpdated'>('title');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingPasswordId, setPendingPasswordId] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const categories = ['all', 'identity', 'payment', 'finance', 'license', 'document'];

  // Simple motion variants locally defined for the newsprint-styled cards
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -4 }
  };

  const [passwordOptions, setPasswordOptions] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true
  });

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [platformSpecificPassword, setPlatformSpecificPassword] = useState('');

  const generatePassword = () => {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let chars = '';
    if (passwordOptions.includeUppercase) chars += charset.uppercase;
    if (passwordOptions.includeLowercase) chars += charset.lowercase;
    if (passwordOptions.includeNumbers) chars += charset.numbers;
    if (passwordOptions.includeSymbols) chars += charset.symbols;

    let password = '';
    for (let i = 0; i < passwordOptions.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
  };

  const generatePlatformSpecificPassword = () => {
    if (!websiteUrl.trim()) {
      setPlatformSpecificPassword('');
      return;
    }

    // Extract domain from URL
    let domain = '';
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }

    // Platform-specific password rules
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
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let chars = charset.lowercase; // Always include lowercase
    if (rules.uppercase) chars += charset.uppercase;
    if (rules.numbers) chars += charset.numbers;
    if (rules.symbols) chars += charset.symbols;

    let password = '';
    
    // Ensure at least one character from each required type
    if (rules.uppercase) password += charset.uppercase.charAt(Math.floor(Math.random() * charset.uppercase.length));
    if (rules.numbers) password += charset.numbers.charAt(Math.floor(Math.random() * charset.numbers.length));
    if (rules.symbols) password += charset.symbols.charAt(Math.floor(Math.random() * charset.symbols.length));
    password += charset.lowercase.charAt(Math.floor(Math.random() * charset.lowercase.length));

    // Fill the rest randomly
    for (let i = password.length; i < rules.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Shuffle the password
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
      'facebook.com': { name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
      'instagram.com': { name: 'Instagram', color: 'bg-gradient-to-r from-purple-400 to-pink-400', icon: '📷' },
      'twitter.com': { name: 'Twitter/X', color: 'bg-black', icon: '🐦' },
      'x.com': { name: 'X (Twitter)', color: 'bg-black', icon: '❌' },
      'linkedin.com': { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
      'google.com': { name: 'Google', color: 'bg-red-500', icon: '🔍' },
      'gmail.com': { name: 'Gmail', color: 'bg-red-500', icon: '📧' },
      'github.com': { name: 'GitHub', color: 'bg-gray-800', icon: '💻' },
      'youtube.com': { name: 'YouTube', color: 'bg-red-600', icon: '📹' },
      'netflix.com': { name: 'Netflix', color: 'bg-red-600', icon: '🎬' },
      'amazon.com': { name: 'Amazon', color: 'bg-orange-500', icon: '🛒' },
      'paypal.com': { name: 'PayPal', color: 'bg-blue-500', icon: '💳' },
      'apple.com': { name: 'Apple', color: 'bg-gray-900', icon: '🍎' },
      'microsoft.com': { name: 'Microsoft', color: 'bg-blue-600', icon: '🏢' },
      'dropbox.com': { name: 'Dropbox', color: 'bg-blue-500', icon: '📦' },
      'discord.com': { name: 'Discord', color: 'bg-indigo-600', icon: '🎮' },
      'slack.com': { name: 'Slack', color: 'bg-purple-600', icon: '💬' },
      'zoom.us': { name: 'Zoom', color: 'bg-blue-500', icon: '📹' }
    };

    return platformInfo[domain] || { name: domain, color: 'bg-gray-500', icon: '🌐' };
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPasswordStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'weak': 
        return <span className="flex items-center text-red-500 text-xs font-medium">
          <FaExclamationTriangle className="mr-1" /> Weak
        </span>;
      case 'medium': 
        return <span className="flex items-center text-yellow-500 text-xs font-medium">
          <FaShieldAlt className="mr-1" /> Medium
        </span>;
      case 'strong': 
        return <span className="flex items-center text-green-500 text-xs font-medium">
          <FaCheckCircle className="mr-1" /> Strong
        </span>;
      default: return null;
    }
  };

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

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enhancedCopyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const getPassTypeIcon = (passType: string) => {
    switch (passType) {
      case 'payment': return <FaCreditCard className="text-green-600" />;
      case 'identity': return <FaIdCard className="text-blue-600" />;
      case 'license': return <FaAddressCard className="text-purple-600" />;
      case 'document': return <FaFileAlt className="text-orange-600" />;
      default: return <FaKey className="text-indigo-600" />;
    }
  };

  // Fetch passwords from backend
  const fetchPasswords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await passwordAPI.getPasswords({ limit: 100 });
      // API returns { success, message, data: { passwords, pagination } }
      const items = res?.data?.data?.passwords || [];
      const mapped = items.map((p: any) => ({
        id: p._id,
        title: p.title,
        username: p.username || '',
        password: '••••••••',
        lastUpdated: p.updatedAt || p.createdAt,
        category: p.category || 'other',
        strength: p.strength || 'medium',
        notes: p.notes || '',
        passType: p.passType || 'account',
        expiryDate: p.expiresAt || p.expiryDate || undefined,
        issuer: p.website || p.issuer || ''
      }));
      setPasswords(mapped);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await passwordAPI.deletePassword(id);
      setPasswords(prev => prev.filter(p => p.id !== id));
      // create a low-severity alert so Notifications and dashboard can pick it up
      await alertService.createAlert({
        alertType: 'security_scan',
        severity: 'low',
        title: 'Credential removed',
        message: 'A credential was removed from your vault',
        relatedTo: 'password',
        relatedId: id,
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
      // Update local state
      setPasswords(prev => prev.map(p => p.id === id ? { ...p, strength: 'weak' } : p));
      await alertService.createAlert({
        alertType: 'breach',
        severity: 'high',
        title: 'Compromised credential detected',
        message: 'A credential was marked as compromised',
        relatedTo: 'password',
        relatedId: id,
        actionRequired: true,
        actionLabel: 'Review'
      });
    } catch (err) {
      console.error('Mark compromised error', err);
    }
  };

  const handleShowPassword = async (id: string) => {
    if (showPassword === id) {
      setShowPassword(null);
      return;
    }
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
      title: String(formData.get('title') || '').trim(),
      username: String(formData.get('username') || '').trim(),
      password: String(formData.get('password') || '').trim(),
      category: String(formData.get('category') || 'other'),
      website: String(formData.get('website') || '').trim(),
      expiresAt: String(formData.get('expiryDate') || '').trim(),
      notes: String(formData.get('notes') || '').trim(),
    };

    if (!payload.title || !payload.password) {
      setError('Title and password are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (selectedPassword) {
        const response = await passwordAPI.updatePassword(selectedPassword.id, payload);
        const updated = response?.data?.data?.password;
        setPasswords(prev => prev.map(item => item.id === selectedPassword.id ? {
          ...item,
          title: updated?.title || payload.title,
          username: updated?.username || payload.username,
          category: updated?.category || payload.category,
          notes: updated?.notes || payload.notes,
          expiryDate: updated?.expiresAt || payload.expiresAt,
          issuer: updated?.website || payload.website,
          lastUpdated: updated?.updatedAt || new Date().toISOString(),
          passType: resolvePassType(updated?.category || payload.category),
        } : item));
        await alertService.createAlert({
          alertType: 'security_scan',
          severity: 'low',
          title: 'Credential updated',
          message: `Credential "${payload.title}" was updated`,
          relatedTo: 'password',
          relatedId: selectedPassword.id,
        });
      } else {
        const response = await passwordAPI.createPassword(payload);
        const created = response?.data?.data?.password;
        if (created) {
          setPasswords(prev => [
            {
              id: created._id,
              title: created.title,
              username: created.username || payload.username,
              password: '••••••••',
              lastUpdated: created.updatedAt || created.createdAt || new Date().toISOString(),
              category: created.category || payload.category,
              strength: created.strength || 'medium',
              notes: created.notes || payload.notes,
              isFavorite: created.isFavorite,
              passType: resolvePassType(created.category || payload.category),
              expiryDate: created.expiresAt || payload.expiresAt || undefined,
              issuer: created.website || payload.website,
            },
            ...prev,
          ]);
        }
        await alertService.createAlert({
          alertType: 'security_scan',
          severity: 'low',
          title: 'Credential created',
          message: `Credential "${payload.title}" was added to your vault`,
          relatedTo: 'password',
          relatedId: created?._id,
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

      /* Enhanced search and filter section */
  return (
  <div className="space-y-6">
    <div className="border-4 border-[#111111] bg-[#F9F9F7] overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-[#111111]" />
              </div>
              <input
                type="text"
                placeholder="Search by title, username, or issuer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-b-2 border-[#111111] bg-[#F9F9F7] text-[#111111] focus:bg-[#E5E5E0] focus:outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 self-end">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#E5E5E0] border-2 border-[#111111] hover:bg-[#F9F9F7] transition-colors">
                <FaSort className="text-[#111111]" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'title' | 'lastUpdated')}
                  className="bg-transparent border-none text-sm focus:ring-0 text-[#111111] font-black"
                >
                  <option value="title">Sort by name</option>
                  <option value="lastUpdated">Sort by last updated</option>
                </select>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="p-3.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] transition-all hover:bg-[#E5E5E0]"
              >
                <FaFilter className="text-[#111111]" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Categories selector with pill design */}
        <div className="bg-[#E5E5E0] border-t-2 border-[#111111] px-5 py-3">
          <div className="flex overflow-x-auto gap-2 scrollbar-thin scrollbar-thumb-[#111111] scrollbar-track-transparent pb-1">
            {categories.map(category => (
              <motion.button
                key={category}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2.5 flex items-center gap-2 whitespace-nowrap transition-all border-2 ${
                  selectedCategory === category 
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]' 
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] border-[#111111]'
                }`}
              >
                {{
                  'all': <FaDatabase className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />,
                  'identity': <FaIdCard className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />,
                  'payment': <FaCreditCard className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />,
                  'finance': <FaFolder className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />,
                  'license': <FaAddressCard className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />,
                  'document': <FaFileAlt className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />
                }[category] || <FaDatabase className={selectedCategory === category ? 'text-[#F9F9F7]' : 'text-[#111111]'} />}
                <span className="font-black">{category === 'all' ? 'All Items' : category}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

    
      <AnimatePresence>
        {showPasswordGenerator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#F9F9F7] border-4 border-[#111111] overflow-hidden"
          >
            <div className="bg-[#E5E5E0] p-5 border-b-4 border-[#111111] flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                <div className="p-2 border-2 border-[#111111] bg-[#F9F9F7] mr-3 flex items-center justify-center">
                  <FaLock className="text-[#111111]" />
                </div>
                Password Generator
              </h3>
              <button 
                onClick={() => setShowPasswordGenerator(false)}
                className="p-2 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Website URL Input for Platform-Specific Generation */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Website URL (Optional - for platform-specific passwords)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      setPlatformSpecificPassword('');
                    }}
                    placeholder="e.g., facebook.com, github.com, netflix.com"
                    className="w-full px-4 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:bg-[#E5E5E0] transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FaGlobe className="text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Leave empty for generic password or enter a website to generate platform-optimized password
                </p>
              </div>

              {/* Platform Recognition */}
              {websiteUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#F9F9F7] p-4 border-2 border-[#111111]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#111111] bg-[#F9F9F7] flex items-center justify-center text-[#111111] text-lg">
                      {getPlatformInfo(websiteUrl)?.icon || '🌐'}
                    </div>

                    <div>
                      <h4 className="font-black text-[#111111]">
                        {getPlatformInfo(websiteUrl)?.name}
                      </h4>

                      <p className="text-sm text-[#111111]">
                        Platform recognized • Optimized password rules applied
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="bg-[#F9F9F7] p-4 border-2 border-[#111111] flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={websiteUrl ? platformSpecificPassword : generatedPassword}
                  placeholder={websiteUrl ? "Platform-specific password will appear here" : "Your secure password will appear here"}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-lg text-[#111111]"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => enhancedCopyToClipboard(websiteUrl ? platformSpecificPassword : generatedPassword, 'generated')}
                  className="p-2.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] transition-colors flex items-center gap-2 font-black"
                  title="Copy to clipboard"
                >
                  {copiedText === 'generated' ? (
                    <>
                      <FaClipboardCheck className="text-[#111111]" /> 
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaClipboard /> 
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              <div className="bg-[#F9F9F7] p-5 border-2 border-[#111111]">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-black text-[#111111]">Password Length</label>
                  <span className="text-sm font-mono bg-[#E5E5E0] text-[#111111] px-2.5 py-1 border-2 border-[#111111]">
                    {passwordOptions.length} chars
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={passwordOptions.length}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    length: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-[#E5E5E0] appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>8</span>
                  <span>20</span>
                  <span>32</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-[#F9F9F7] border-2 border-[#111111] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={passwordOptions.includeUppercase}
                    onChange={() => setPasswordOptions({
                      ...passwordOptions,
                      includeUppercase: !passwordOptions.includeUppercase
                    })}
                    className="border-2 border-[#111111] h-5 w-5"
                  />
                  <div>
                    <div className="font-black text-[#111111]">Uppercase Letters</div>
                    <div className="text-xs text-[#111111]">A-Z</div>
                  </div>
                </motion.label>
                
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-[#F9F9F7] border-2 border-[#111111] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={passwordOptions.includeLowercase}
                    onChange={() => setPasswordOptions({
                      ...passwordOptions,
                      includeLowercase: !passwordOptions.includeLowercase
                    })}
                    className="border-2 border-[#111111] h-5 w-5"
                  />
                  <div>
                    <div className="font-black text-[#111111]">Lowercase Letters</div>
                    <div className="text-xs text-[#111111]">a-z</div>
                  </div>
                </motion.label>
                
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-[#F9F9F7] border-2 border-[#111111] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={passwordOptions.includeNumbers}
                    onChange={() => setPasswordOptions({
                      ...passwordOptions,
                      includeNumbers: !passwordOptions.includeNumbers
                    })}
                    className="border-2 border-[#111111] h-5 w-5"
                  />
                  <div>
                    <div className="font-black text-[#111111]">Numbers</div>
                    <div className="text-xs text-[#111111]">0-9</div>
                  </div>
                </motion.label>
                
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-[#F9F9F7] border-2 border-[#111111] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={passwordOptions.includeSymbols}
                    onChange={() => setPasswordOptions({
                      ...passwordOptions,
                      includeSymbols: !passwordOptions.includeSymbols
                    })}
                    className="border-2 border-[#111111] h-5 w-5"
                  />
                  <div>
                    <div className="font-black text-[#111111]">Special Characters</div>
                    <div className="text-xs text-[#111111]">!@#$%^&*</div>
                  </div>
                </motion.label>
              </div>
              
              <div className="flex items-center p-3 bg-[#F9F9F7] border-2 border-[#111111]">
                <div className="p-2 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] mr-3">
                  <FaInfoCircle />
                </div>
                <p className="text-sm text-[#111111]">
                  Strong passwords should be at least 12 characters and include a mix of letters, numbers, and symbols.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={websiteUrl ? generatePlatformSpecificPassword : generatePassword}
                  className="flex-1 px-5 py-3.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] flex items-center justify-center gap-2 hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors font-black"
                >
                  <FaDice /> {websiteUrl ? 'Generate Platform Password' : 'Generate Strong Password'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const currentPassword = websiteUrl ? platformSpecificPassword : generatedPassword;
                    if (currentPassword && selectedPassword) {
                      // Logic to use the generated password
                      setShowPasswordGenerator(false);
                    }
                  }}
                  disabled={!(websiteUrl ? platformSpecificPassword : generatedPassword) || !selectedPassword}
                  className={`px-5 py-3.5 flex items-center justify-center gap-2 font-black ${
                    (websiteUrl ? platformSpecificPassword : generatedPassword) && selectedPassword 
                      ? 'bg-[#111111] text-[#F9F9F7] border-2 border-[#111111]' 
                      : 'bg-[#E5E5E0] text-[#111111] cursor-not-allowed border-2 border-[#111111]'
                  }`}
                >
                  <FaCheckCircle /> Use This Password
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {filteredPasswords.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-4 border-[#111111] bg-[#F9F9F7] p-12 text-center"
        >
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-[#111111] bg-[#E5E5E0]"></div>
            <div className="relative border-4 border-[#111111] bg-[#F9F9F7] w-full h-full flex items-center justify-center">
              <FaSearch className="text-[#111111] text-2xl" />
            </div>
          </div>
          <h3 className="text-xl font-black text-[#111111] mb-2">No credentials found</h3>
          <p className="text-[#111111] max-w-md mx-auto">
            No items match your current search or filters. Try adjusting your criteria or add a new item to your vault.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => {setSelectedCategory('all'); setSearch('');}} className="px-5 py-2.5 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] font-black hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors">
              Clear filters
            </button>
            <button 
              onClick={() => {
                setSelectedPassword(null);
                setShowAddEditModal(true);
              }}
              className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors flex items-center gap-2"
            >
              <FaPlus size={12} /> Add New Item
            </button>
          </div>
        </motion.div>
      ) : (
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
              whileHover="hover"
              className="border-l-4 border-b-2 border-r-2 border-t-2 border-[#111111] bg-[#F9F9F7] overflow-hidden"
            >
              <div className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  password.strength === 'strong' ? 'bg-[#111111]' :
                  password.strength === 'medium' ? 'bg-[#525252]' :
                  'bg-[#CC0000]'
                }`}></div>
                
                <div className="p-5 border-b-2 border-[#111111] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 border-2 border-[#111111] bg-[#F9F9F7]`}>
                      {getPassTypeIcon(password.passType)}
                    </div>
                    <div>
                      <h3 className="font-black text-[#111111]">{password.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#111111]">
                        <span>{password.issuer}</span>
                        {password.expiryDate && (
                          <span className="px-2 py-0.5 border-2 border-[#111111] text-xs text-[#111111]">
                            Expires {new Date(password.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] transition-colors"
                      onClick={() => {
                        setSelectedPassword(password as Password);
                        setShowAddEditModal(true);
                      }}
                    >
                      <FaEdit />
                    </motion.button>
                      <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] transition-colors"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this item?")) {
                          handleDelete(password.id as string);
                        }
                      }}
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[#F9F9F7] border-2 border-[#111111] transition-colors">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Username</div>
                        <div className="font-medium">{password.username}</div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => enhancedCopyToClipboard(password.username, `user-${password.id}`)}
                        className={`p-2 border-2 border-[#111111] bg-[#F9F9F7] transition-colors ${
                          copiedText === `user-${password.id}` 
                            ? 'bg-[#E5E5E0] text-[#111111]' 
                            : 'hover:bg-[#E5E5E0] text-[#111111]'
                        }`}
                      >
                        {copiedText === `user-${password.id}` ? <FaRegCheckCircle /> : <FaRegCopy />}
                      </motion.button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-[#F9F9F7] border-2 border-[#111111] transition-colors">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Password</div>
                        <div className="font-medium font-mono">
                          {showPassword === password.id ? password.password : '••••••••'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleShowPassword(password.id as string)}
                          className="p-2 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111]"
                        >
                          {showPassword === password.id ? <FaEyeSlash /> : <FaEye />}
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => enhancedCopyToClipboard(password.password, `pass-${password.id}`)}
                          className={`p-2 border-2 border-[#111111] bg-[#F9F9F7] ${
                            copiedText === `pass-${password.id}` 
                              ? 'bg-[#E5E5E0] text-[#111111]' 
                              : 'hover:bg-[#E5E5E0] text-[#111111]'
                          }`}
                        >
                          {copiedText === `pass-${password.id}` ? <FaRegCheckCircle /> : <FaRegCopy />}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t-2 border-[#111111] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#111111]"></div>
                      <span className="text-xs text-[#111111]">Last updated {password.lastUpdated}</span>
                    </div>
                    <div className={`px-3 py-1 text-xs font-black flex items-center gap-1.5 border-2 ${
                      password.strength === 'strong' ? 'bg-[#F9F9F7] text-[#111111] border-[#111111]' : 
                        password.strength === 'medium' ? 'bg-[#E5E5E0] text-[#111111] border-[#111111]' : 
                        'bg-[#F9F9F7] text-[#CC0000] border-2 border-[#CC0000]'
                      }`}>
                      {password.strength === 'strong' ? <FaCheckCircle size={10} /> : 
                       password.strength === 'medium' ? <FaShieldAlt size={10} /> : 
                       <FaExclamationTriangle size={10} />}
                      {password.strength.charAt(0).toUpperCase() + password.strength.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Enhanced Add/Edit Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full max-h-[85vh] overflow-hidden"
            >
              <div className="p-5 flex justify-between items-center bg-[#111111]">
                <h3 className="text-xl font-black text-[#F9F9F7] flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {selectedPassword ? (
                    <>
                      <FaEdit /> Edit Credential
                    </>
                  ) : (
                    <>
                      <FaPlus /> Add New Credential
                    </>
                  )}
                </h3>
                <button 
                  onClick={() => setShowAddEditModal(false)}
                  className="p-2 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                <form className="space-y-5" onSubmit={handleSubmitPassword}>
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Title</label>
                    <input 
                      type="text" 
                      defaultValue={selectedPassword?.title}
                      name="title"
                      className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none" 
                      placeholder="Enter credential title"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-[#111111] mb-2">Category</label>
                      <select 
                        defaultValue={selectedPassword?.category || 'finance'}
                        name="category"
                        className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none"
                      >
                        <option value="finance">Finance</option>
                        <option value="identity">Identity</option>
                        <option value="payment">Payment</option>
                        <option value="license">License</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-black text-[#111111] mb-2">Credential Type</label>
                      <select 
                        defaultValue={selectedPassword?.passType || 'account'}
                        name="passType"
                        className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none"
                      >
                        <option value="account">Account</option>
                        <option value="payment">Payment</option>
                        <option value="identity">Identity</option>
                        <option value="license">License</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Issuer/Organization</label>
                    <input 
                      type="text" 
                      defaultValue={selectedPassword?.issuer}
                      name="website"
                      className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none" 
                      placeholder="e.g., Bank Name, Service Provider"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Username/ID</label>
                    <input 
                      type="text" 
                      defaultValue={selectedPassword?.username}
                      name="username"
                      className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none" 
                      placeholder="Enter your username or ID"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        defaultValue={selectedPassword?.password}
                        name="password"
                        className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none pr-20" 
                        placeholder="Enter a secure password"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <button type="button" className="p-1 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111]">
                          <FaEye />
                        </button>
                        <button type="button" className="p-1 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] ml-1">
                          <FaDice />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#E5E5E0] overflow-hidden">
                          <div className={`h-full ${
                            selectedPassword?.strength === 'strong' ? 'bg-[#111111] w-full' : 
                            selectedPassword?.strength === 'medium' ? 'bg-[#525252] w-2/3' : 
                            'bg-[#CC0000] w-1/3'
                          }`}></div>
                        </div>
                        <span className="text-xs text-[#111111]">
                          {selectedPassword?.strength === 'strong' ? 'Strong password' : 
                          selectedPassword?.strength === 'medium' ? 'Medium strength' : 
                          'Weak password'}
                        </span>
                      </div>
                      <button type="button" className="text-xs text-[#111111] hover:text-[#CC0000] font-black">
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Expiry Date</label>
                    <input 
                      type="date" 
                      defaultValue={(selectedPassword && selectedPassword.expiryDate) ? selectedPassword.expiryDate.split('T')[0] : ''}
                      name="expiryDate"
                      className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-[#111111] mb-2">Notes</label>
                    <textarea 
                      defaultValue={selectedPassword?.notes}
                      name="notes"
                      className="w-full px-3 py-3 border-2 border-[#111111] bg-[#F9F9F7] focus:outline-none resize-none" 
                      rows={3}
                      placeholder="Add any additional notes or details"
                    ></textarea>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3 border-t-2 border-[#111111]">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowAddEditModal(false)}
                      className="px-5 py-2.5 border-2 border-[#111111] text-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] font-black"
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111] font-black"
                    >
                      {saving ? 'Saving...' : (selectedPassword ? 'Update' : 'Save')}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Verification Modal */}
        {verificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FaShieldAlt /> Device Verification Required
                </h3>
                <button 
                  onClick={() => setVerificationModalOpen(false)}
                  className="text-indigo-100 hover:text-white transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  For your security, we've sent a 6-digit verification code to your linked devices and notifications. 
                  Please enter it below to reveal this password.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                  <input 
                    type="text" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors" 
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    onClick={() => setVerificationModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleVerifyAccess}
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                  >
                    {verificationLoading ? 'Verifying...' : 'Verify Access'}
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
