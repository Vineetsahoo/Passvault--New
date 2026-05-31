import React, { useState, useEffect } from 'react';
import {
  Users, AlertCircle, Plus, Clock, XCircle, Link, Copy, UserPlus,
  Shield, History, Settings2, Users2, Lock, LogIn, ArrowLeft, CheckCircle,
  Trash2, Save, FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import { sharingAPI, qrCodesAPI, isLoggedIn, getStoredUser } from '../../services/api';
import { validationUtils, getValidationClassName } from '../../utils/validation';

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

    /* Form fields — bottom-border only */
    .np-input {
      border: none;
      border-bottom: 2px solid #111111;
      background: transparent;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      outline: none;
      width: 100%;
      transition: background 150ms ease-out;
    }
    .np-input:focus { background: #F0F0F0; }
    .np-input::placeholder { color: #A3A3A3; }
    .np-input-error { border-bottom-color: #CC0000 !important; }

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

    .np-textarea {
      border: 2px solid #111111;
      background: transparent;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      outline: none;
      width: 100%;
      resize: vertical;
      transition: background 150ms ease-out;
    }
    .np-textarea:focus { background: #F0F0F0; }
    .np-textarea-error { border-color: #CC0000 !important; }

    /* Focus ring for keyboard nav */
    .np-focus:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px #F9F9F7, 0 0 0 4px #111111;
    }

    /* Checkbox newsprint style */
    input[type='checkbox'].np-checkbox {
      appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid #111111;
      background: transparent;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
    }
    input[type='checkbox'].np-checkbox:checked {
      background: #111111;
    }
    input[type='checkbox'].np-checkbox:checked::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 4px;
      width: 5px;
      height: 9px;
      border: 2px solid #F9F9F7;
      border-top: none;
      border-left: none;
      transform: rotate(45deg);
    }
  `}</style>
);

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface SharedPass {
  _id: string;
  pass: {
    _id: string;
    title: string;
    type?: string;
    qrType?: string;
    cardNumber?: string;
  };
  recipient: {
    email: string;
    name: string;
  };
  accessLevel: 'read' | 'edit';
  status: 'active' | 'pending' | 'revoked' | 'expired';
  expiresAt?: string;
  lastAccessed?: string;
  createdAt: string;
}

interface ShareTemplate {
  _id: string;
  name: string;
  description?: string;
  accessLevel: 'read' | 'edit';
  expiryDays: number;
  restrictions: string[];
  permissions?: {
    canDownload?: boolean;
    canPrint?: boolean;
    canShare?: boolean;
  };
  usageCount: number;
}

interface ShareLog {
  _id: string;
  action: 'shared' | 'revoked' | 'modified' | 'accessed';
  timestamp: string;
  recipient: {
    email: string;
  };
  performedBy: {
    name: string;
  };
  details?: {
    reason?: string;
  };
}

interface Pass {
  _id: string;
  title: string;
  qrType?: string;
  type?: string;
  category?: string;
}

interface FeatureTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

// ─── Reusable UI primitives ────────────────────────────────────────────────────

/** Black header bar used at the top of every bordered section card */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between gap-4">
    <div>
      <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
        {icon}
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-[#737373] mt-0.5 np-mono">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/** Horizontal ornamental rule with centred label — separates major sections */
const OrnamentalDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="flex-1 h-px bg-[#111111]" />
    <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3] whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-[#111111]" />
  </div>
);

/** Status pill — maps share status to newsprint-appropriate badge style */
const StatusBadge: React.FC<{ status: SharedPass['status'] }> = ({ status }) => {
  const styles: Record<SharedPass['status'], string> = {
    active:  'bg-[#111111] text-[#F9F9F7]',
    pending: 'border border-[#111111] text-[#111111]',
    revoked: 'bg-[#CC0000] text-[#F9F9F7]',
    expired: 'border border-[#737373] text-[#737373]',
  };
  return (
    <span className={`inline-block px-3 py-0.5 np-mono text-xs font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
};

/** Log action colour mapping — returns newsprint-appropriate icon wrapper */
const logActionMeta = (action: ShareLog['action']) => {
  switch (action) {
    case 'shared':   return { bg: 'bg-[#111111]',  icon: <UserPlus   className="h-3 w-3 text-[#F9F9F7]" strokeWidth={1.5} /> };
    case 'revoked':  return { bg: 'bg-[#CC0000]',  icon: <XCircle    className="h-3 w-3 text-[#F9F9F7]" strokeWidth={1.5} /> };
    case 'accessed': return { bg: 'bg-[#525252]',  icon: <Shield     className="h-3 w-3 text-[#F9F9F7]" strokeWidth={1.5} /> };
    case 'modified': return { bg: 'bg-[#737373]',  icon: <Settings2  className="h-3 w-3 text-[#F9F9F7]" strokeWidth={1.5} /> };
    default:         return { bg: 'bg-[#A3A3A3]',  icon: <History    className="h-3 w-3 text-[#F9F9F7]" strokeWidth={1.5} /> };
  }
};

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper: edition bar, bordered masthead, ornamental footer.
// Matches QrScan.tsx exactly.
// ─────────────────────────────────────────────────────────────────────────────
const FeatureTemplate: React.FC<FeatureTemplateProps> = ({ title, description, icon, children }) => {
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
              SHARING EDITION
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
                {/* Headline */}
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
const AuthPrompt = () => {
  const navigate = useNavigate();
  return (
    <div className="border border-[#111111] bg-[#F9F9F7] p-10 text-center">
      <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
      </div>
      <div className="inline-block border border-[#111111] px-3 py-0.5 np-mono text-xs uppercase tracking-widest mb-3">
        ACCESS RESTRICTED
      </div>
      <h3 className="font-black text-[#111111] mb-2 np-serif text-2xl">Sign In Required</h3>
      <p className="text-[#525252] mb-6 text-sm np-body max-w-xs mx-auto leading-relaxed">
        Please sign in to manage your shared passes
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

// ─── Sharing (main component) ─────────────────────────────────────────────────
const Sharing: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sharedPasses, setSharedPasses] = useState<SharedPass[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [shareTemplates, setShareTemplates] = useState<ShareTemplate[]>([]);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const [batchEmails, setBatchEmails] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const [userPasses, setUserPasses] = useState<Pass[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state
  const [shareForm, setShareForm] = useState({
    passId: '',
    recipientEmail: '',
    recipientName: '',
    accessLevel: 'read' as 'read' | 'edit',
    expiryDays: 30,
    restrictions: [] as string[],
    message: ''
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    accessLevel: 'read' as 'read' | 'edit',
    expiryDays: 30,
    restrictions: [] as string[],
    permissions: {
      canDownload: false,
      canPrint: false,
      canShare: false
    }
  });

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const authStatus = isLoggedIn();
      setIsAuthenticated(authStatus);
      if (authStatus) {
        await Promise.all([
          loadSharedPasses(),
          loadTemplates(),
          loadStats(),
          loadUserPasses()
        ]);
      }
    };
    checkAuthAndLoadData();
  }, []);

  const loadUserPasses = async () => {
    try {
      const response = await qrCodesAPI.getCodes({ limit: 100 });
      if (response.data.success) {
        setUserPasses(response.data.qrCodes || []);
      }
    } catch (err: any) {
      console.error('Load passes error:', err);
    }
  };

  const loadSharedPasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sharingAPI.getMyShares({ status: 'active' });
      if (response.data.success) {
        setSharedPasses(response.data.data.shares);
      }
    } catch (err: any) {
      console.error('Load shares error:', err);
      setError(err.response?.data?.message || 'Failed to load shared passes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await sharingAPI.getTemplates();
      if (response.data.success) {
        setShareTemplates(response.data.data.templates);
      }
    } catch (err: any) {
      console.error('Load templates error:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await sharingAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Load stats error:', err);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await sharingAPI.getLogs({ limit: 20 });
      if (response.data.success) {
        setShareLogs(response.data.data.logs);
      }
    } catch (err: any) {
      console.error('Load logs error:', err);
    }
  };

  const handleSharePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);
    setSuccess(null);

    const validation = validationUtils.shareForm(
      {
        passId: shareForm.passId,
        recipientEmail: shareForm.recipientEmail,
        recipientName: shareForm.recipientName,
        expiryDays: shareForm.expiryDays,
        message: shareForm.message
      },
      userPasses
    );

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const response = await sharingAPI.sharePass({
        passId: shareForm.passId,
        recipientEmail: shareForm.recipientEmail,
        recipientName: shareForm.recipientName,
        accessLevel: shareForm.accessLevel,
        expiryDays: shareForm.expiryDays,
        restrictions: shareForm.restrictions,
        message: shareForm.message
      });
      if (response.data.success) {
        setSuccess('Pass shared successfully!');
        setShowAddForm(false);
        setValidationErrors({});
        setShareForm({
          passId: '',
          recipientEmail: '',
          recipientName: '',
          accessLevel: 'read',
          expiryDays: 30,
          restrictions: [],
          message: ''
        });
        await loadSharedPasses();
        await loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to share pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke access to this pass?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await sharingAPI.revokeAccess(shareId, 'Access revoked by owner');
      if (response.data.success) {
        setSuccess('Access revoked successfully');
        await loadSharedPasses();
        await loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareLink = async () => {
    const passValidation = validationUtils.passSelection(shareForm.passId, userPasses);
    if (!passValidation.valid) {
      setError(passValidation.error!);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await sharingAPI.generateLink({
        passId: shareForm.passId,
        accessLevel: shareForm.accessLevel,
        expiryHours: 24,
        maxUses: 10
      });
      if (response.data.success) {
        setShareLink(response.data.data.shareUrl);
        setSuccess('Share link generated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchShare = async () => {
    const emailValidation = validationUtils.batchEmails(batchEmails);
    if (!emailValidation.valid) {
      setError(emailValidation.error!);
      return;
    }
    const passValidation = validationUtils.passSelection(shareForm.passId, userPasses);
    if (!passValidation.valid) {
      setError(passValidation.error!);
      return;
    }
    const emails = emailValidation.validEmails!;
    setIsLoading(true);
    setError(null);
    try {
      const response = await sharingAPI.batchShare({
        passId: shareForm.passId,
        recipients: emails.map(email => ({ email: email.trim() })),
        accessLevel: shareForm.accessLevel,
        expiryDays: shareForm.expiryDays,
        templateId: selectedTemplate || undefined
      });
      if (response.data.success) {
        const { success, failed } = response.data.data;
        setSuccess(`Shared with ${success.length} recipients. ${failed.length} failed.`);
        setBatchEmails('');
        await loadSharedPasses();
        await loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to batch share');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLogs = async () => {
    if (!showLogs) {
      await loadLogs();
    }
    setShowLogs(!showLogs);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    const validation = validationUtils.templateForm({
      name: templateForm.name,
      expiryDays: templateForm.expiryDays,
      restrictions: templateForm.restrictions
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const response = await sharingAPI.createTemplate(templateForm);
      if (response.data.success) {
        setSuccess('Template created successfully!');
        setValidationErrors({});
        setTemplateForm({
          name: '',
          accessLevel: 'read',
          expiryDays: 30,
          restrictions: [],
          permissions: { canDownload: false, canPrint: false, canShare: false }
        });
        setShowTemplateForm(false);
        await loadTemplates();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await sharingAPI.deleteTemplate(templateId);
      if (response.data.success) {
        setSuccess('Template deleted successfully!');
        await loadTemplates();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTemplateRestriction = (restriction: string) => {
    setTemplateForm(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction]
    }));
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="Pass Sharing"
        description="Share passes securely with family and friends. Control access levels, set expiry windows, and track activity — all in one place."
        icon={<Users className="h-8 w-8" />}
      >
        {!isAuthenticated ? (
          <AuthPrompt />
        ) : (
          <div className="space-y-8 np-sans">

            {/* ── Error alert ── */}
            {error && (
              <div className="border border-[#CC0000] bg-[#F9F9F7] p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-[#CC0000] text-xs np-mono uppercase tracking-wide flex-1 font-black">
                  {error}
                </span>
                <button
                  onClick={() => setError(null)}
                  className="text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] p-1 transition-colors np-focus flex-shrink-0"
                >
                  <XCircle className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* ── Success alert ── */}
            {success && (
              <div className="border border-[#111111] bg-[#F5F5F5] p-4 flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-[#111111] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-[#111111] text-xs np-mono uppercase tracking-wide flex-1 font-black">
                  {success}
                </span>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] p-1 transition-colors np-focus flex-shrink-0"
                >
                  <XCircle className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* ─────────────── Stats ─────────────── */}
            {stats && (
              <>
                <OrnamentalDivider label="Overview" />
                <div className="grid grid-cols-2 md:grid-cols-4 border border-[#111111]">
                  {[
                    { label: 'ACTIVE',  value: stats.totalActive,  accent: false },
                    { label: 'PENDING', value: stats.totalPending, accent: false },
                    { label: 'REVOKED', value: stats.totalRevoked, accent: true  },
                    { label: 'EXPIRED', value: stats.totalExpired, accent: false },
                  ].map((stat, i, arr) => (
                    <div
                      key={stat.label}
                      className={`p-5 text-center ${i < arr.length - 1 ? 'border-r border-[#111111]' : ''}`}
                    >
                      <div className={`text-4xl font-black np-serif leading-none ${stat.accent ? 'text-[#CC0000]' : 'text-[#111111]'}`}>
                        {stat.value ?? 0}
                      </div>
                      <div className="text-xs np-mono uppercase tracking-widest text-[#737373] mt-2">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ─────────────── Share New Pass ─────────────── */}
            <OrnamentalDivider label="Share New Pass" />

            {/* Section toolbar */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-black text-[#111111] np-serif text-2xl leading-tight">
                  Pass Sharing Management
                </h2>
                <p className="text-xs text-[#737373] np-mono uppercase tracking-widest mt-1">
                  Grant recipients access to your passes
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 font-black uppercase text-xs tracking-widest np-mono border transition-all duration-200 min-h-[44px] np-focus flex-shrink-0 ${
                  showAddForm
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-[#F9F9F7] text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                }`}
              >
                {showAddForm
                  ? <><XCircle className="h-4 w-4" strokeWidth={1.5} />CANCEL</>
                  : <><Plus className="h-4 w-4" strokeWidth={1.5} />SHARE PASS</>
                }
              </button>
            </div>

            {/* ── Share form ── */}
            {showAddForm && (
              <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
                <SectionHeader
                  icon={<UserPlus className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                  title="Share with New User"
                  subtitle="Configure access for the recipient and select a pass"
                />
                <form onSubmit={handleSharePass} className="p-6 space-y-6">

                  {/* Pass selector */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                      Select Pass to Share <span className="text-[#CC0000]">*</span>
                    </label>
                    <select
                      value={shareForm.passId}
                      onChange={(e) => setShareForm(prev => ({ ...prev, passId: e.target.value }))}
                      required
                      className="np-select"
                    >
                      <option value="">Select a pass...</option>
                      {userPasses.map(pass => (
                        <option key={pass._id} value={pass._id}>
                          {pass.title} ({pass.qrType || pass.type || 'Pass'})
                        </option>
                      ))}
                    </select>
                    {userPasses.length === 0 && (
                      <p className="text-xs text-[#CC0000] np-mono mt-1 uppercase tracking-wide">
                        No passes found. Create a pass first in the QR Scan feature.
                      </p>
                    )}
                  </div>

                  {/* Recipient email + name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                        Recipient Email <span className="text-[#CC0000]">*</span>
                      </label>
                      <input
                        type="email"
                        value={shareForm.recipientEmail}
                        onChange={(e) => {
                          setShareForm(prev => ({ ...prev, recipientEmail: e.target.value }));
                          const v = validationUtils.email(e.target.value);
                          setValidationErrors(prev => ({ ...prev, recipientEmail: v.valid ? '' : v.error! }));
                        }}
                        onBlur={(e) => {
                          const v = validationUtils.email(e.target.value);
                          if (!v.valid) setValidationErrors(prev => ({ ...prev, recipientEmail: v.error! }));
                        }}
                        required
                        placeholder="recipient@example.com"
                        className={`np-input ${validationErrors.recipientEmail ? 'np-input-error' : ''}`}
                      />
                      {validationErrors.recipientEmail && (
                        <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-1 np-mono">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {validationErrors.recipientEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                        Recipient Name{' '}
                        <span className="text-[#737373] normal-case font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={shareForm.recipientName}
                        onChange={(e) => {
                          setShareForm(prev => ({ ...prev, recipientName: e.target.value }));
                          const v = validationUtils.recipientName(e.target.value);
                          setValidationErrors(prev => ({ ...prev, recipientName: v.valid ? '' : v.error! }));
                        }}
                        placeholder="Full name"
                        className={`np-input ${validationErrors.recipientName ? 'np-input-error' : ''}`}
                      />
                      {validationErrors.recipientName && (
                        <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-1 np-mono">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {validationErrors.recipientName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Access level + expiry */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                        Access Level
                      </label>
                      {/* Collapsed-border toggle grid — same pattern as ManualEntryForm type selector */}
                      <div className="grid grid-cols-2 border border-[#111111]">
                        {([
                          { value: 'read', label: 'READ ONLY',    icon: <Shield   className="h-4 w-4" strokeWidth={1.5} /> },
                          { value: 'edit', label: 'FULL ACCESS',  icon: <Settings2 className="h-4 w-4" strokeWidth={1.5} /> },
                        ] as const).map((opt, i, arr) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setShareForm(prev => ({ ...prev, accessLevel: opt.value }))}
                            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 transition-all duration-200
                              ${i < arr.length - 1 ? 'border-r border-[#111111]' : ''} min-h-[64px] np-focus
                              ${shareForm.accessLevel === opt.value
                                ? 'bg-[#111111] text-[#F9F9F7]'
                                : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'}`}
                            aria-pressed={shareForm.accessLevel === opt.value}
                          >
                            {opt.icon}
                            <span className="font-black text-xs uppercase tracking-widest np-mono leading-none">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={shareForm.expiryDays}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 30;
                          setShareForm(prev => ({ ...prev, expiryDays: value }));
                          const v = validationUtils.expiryDays(value);
                          setValidationErrors(prev => ({ ...prev, expiryDays: v.valid ? '' : v.error! }));
                        }}
                        className={`np-input ${validationErrors.expiryDays ? 'np-input-error' : ''}`}
                      />
                      <p className="text-xs text-[#737373] mt-1 np-mono">Range: 1–365 days</p>
                      {validationErrors.expiryDays && (
                        <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-1 np-mono">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {validationErrors.expiryDays}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                      Message{' '}
                      <span className="text-[#737373] normal-case font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={shareForm.message}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setShareForm(prev => ({ ...prev, message: e.target.value }));
                          const v = validationUtils.message(e.target.value);
                          setValidationErrors(prev => ({ ...prev, message: v.valid ? '' : v.error! }));
                        }
                      }}
                      placeholder="Add a message for the recipient..."
                      rows={3}
                      maxLength={500}
                      className={`np-textarea ${validationErrors.message ? 'np-textarea-error' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-[#737373] np-mono">
                        {shareForm.message.length}/500
                      </span>
                      {validationErrors.message && (
                        <p className="text-xs text-[#CC0000] flex items-center gap-1 np-mono">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed np-focus"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-[#F9F9F7] border-t-transparent animate-spin" />
                          SENDING...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                          SEND INVITATION
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 bg-[#F9F9F7] text-[#111111] border border-[#111111] hover:bg-[#E5E5E0] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─────────────── Sharing Templates ─────────────── */}
            <OrnamentalDivider label="Sharing Templates" />

            <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<Settings2 className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Sharing Templates"
                subtitle="Reusable configurations — apply a template to share with consistent settings"
                action={
                  <button
                    onClick={() => setShowTemplateForm(!showTemplateForm)}
                    className={`inline-flex items-center gap-2 px-4 py-2 font-black uppercase text-xs tracking-widest np-mono border transition-all duration-200 min-h-[36px] np-focus ${
                      showTemplateForm
                        ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                        : 'bg-[#F9F9F7] text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                    }`}
                  >
                    {showTemplateForm
                      ? <><XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />CANCEL</>
                      : <><Plus className="h-3.5 w-3.5" strokeWidth={1.5} />NEW TEMPLATE</>
                    }
                  </button>
                }
              />

              {/* Template creation form */}
              {showTemplateForm && (
                <form onSubmit={handleCreateTemplate} className="p-6 border-b border-[#111111] bg-[#F5F5F5] space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                      Template Name <span className="text-[#CC0000]">*</span>
                    </label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => {
                        setTemplateForm({ ...templateForm, name: e.target.value });
                        const v = validationUtils.templateName(e.target.value);
                        setValidationErrors(prev => ({ ...prev, templateName: v.valid ? '' : v.error! }));
                      }}
                      placeholder="e.g., Family Members, Trusted Friends, Work Colleagues"
                      className={`np-input ${validationErrors.templateName ? 'np-input-error' : ''}`}
                      required
                    />
                    {validationErrors.templateName && (
                      <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-1 np-mono">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.templateName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                        Access Level
                      </label>
                      <div className="grid grid-cols-2 border border-[#111111]">
                        {([
                          { value: 'read', label: 'VIEW ONLY' },
                          { value: 'edit', label: 'FULL ACCESS' },
                        ] as const).map((opt, i, arr) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTemplateForm({ ...templateForm, accessLevel: opt.value })}
                            className={`py-3 px-2 font-black text-xs uppercase tracking-widest np-mono transition-all duration-200
                              ${i < arr.length - 1 ? 'border-r border-[#111111]' : ''} min-h-[44px] np-focus
                              ${templateForm.accessLevel === opt.value
                                ? 'bg-[#111111] text-[#F9F9F7]'
                                : 'bg-transparent text-[#111111] hover:bg-[#E5E5E0]'}`}
                            aria-pressed={templateForm.accessLevel === opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                        Expiry (Days)
                      </label>
                      <input
                        type="number"
                        value={templateForm.expiryDays}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setTemplateForm({ ...templateForm, expiryDays: value });
                          const v = validationUtils.expiryDays(value);
                          setValidationErrors(prev => ({ ...prev, templateExpiryDays: v.valid ? '' : v.error! }));
                        }}
                        min="1"
                        max="365"
                        className={`np-input ${validationErrors.templateExpiryDays ? 'np-input-error' : ''}`}
                      />
                      {validationErrors.templateExpiryDays && (
                        <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-1 np-mono">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.templateExpiryDays}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                      Permissions
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { key: 'canDownload', label: 'Can Download' },
                        { key: 'canPrint',    label: 'Can Print'    },
                        { key: 'canShare',    label: 'Can Re-share' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={templateForm.permissions[key as keyof typeof templateForm.permissions]}
                            onChange={(e) => setTemplateForm({
                              ...templateForm,
                              permissions: { ...templateForm.permissions, [key]: e.target.checked }
                            })}
                            className="np-checkbox"
                          />
                          <span className="text-xs text-[#111111] np-mono uppercase tracking-wide font-black">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                      Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'no-download', label: 'NO DOWNLOAD' },
                        { value: 'no-print',    label: 'NO PRINT'    },
                        { value: 'no-share',    label: 'NO RE-SHARE' },
                        { value: 'no-export',   label: 'NO EXPORT'   },
                        { value: 'view-only',   label: 'VIEW ONLY'   },
                      ].map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => toggleTemplateRestriction(r.value)}
                          className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 np-focus ${
                            templateForm.restrictions.includes(r.value)
                              ? 'bg-[#CC0000] text-[#F9F9F7] border-[#CC0000]'
                              : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#737373] np-mono mt-2">
                      Note: "View Only" restriction overrides all permissions. Individual restrictions target specific actions.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 np-focus"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-[#F9F9F7] border-t-transparent animate-spin" />
                        CREATING...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" strokeWidth={1.5} />
                        CREATE TEMPLATE
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Templates list */}
              <div className="p-6">
                {shareTemplates.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#E5E5E0]">
                    <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Settings2 className="h-8 w-8 text-[#111111]" strokeWidth={1} />
                    </div>
                    <p className="font-black text-[#111111] np-mono text-xs uppercase tracking-widest mb-1">
                      No templates yet
                    </p>
                    <p className="text-xs text-[#737373] np-mono mb-4">
                      Create templates to quickly share passes with consistent settings
                    </p>
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                      CREATE FIRST TEMPLATE
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shareTemplates.map(template => (
                      <div
                        key={template._id}
                        className="border border-[#111111] overflow-hidden np-hard-hover bg-[#F9F9F7]"
                      >
                        {/* Template card header */}
                        <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-[#111111] text-sm np-serif leading-snug truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-[#737373] np-mono mt-0.5">
                              Used {template.usageCount || 0} times
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-block px-2 py-0.5 np-mono text-xs font-black uppercase tracking-widest border ${
                              template.accessLevel === 'edit'
                                ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                                : 'border-[#111111] text-[#111111]'
                            }`}>
                              {template.accessLevel === 'edit' ? 'FULL' : 'VIEW'}
                            </span>
                            <button
                              onClick={() => handleDeleteTemplate(template._id)}
                              className="border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] p-1.5 transition-colors np-focus"
                              title="Delete template"
                              aria-label="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>

                        {/* Template card body */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                            <span className="text-xs np-mono text-[#525252]">
                              Expires after{' '}
                              <span className="font-black text-[#111111]">
                                {template.expiryDays} days
                              </span>
                            </span>
                          </div>

                          {/* Permissions */}
                          {template.permissions && Object.values(template.permissions).some(v => v) && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest np-mono text-[#737373] mb-1.5">
                                Permissions
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {template.permissions.canDownload && (
                                  <span className="inline-block border border-[#111111] px-2 py-0.5 text-xs np-mono uppercase tracking-wide text-[#111111]">
                                    DOWNLOAD
                                  </span>
                                )}
                                {template.permissions.canPrint && (
                                  <span className="inline-block border border-[#111111] px-2 py-0.5 text-xs np-mono uppercase tracking-wide text-[#111111]">
                                    PRINT
                                  </span>
                                )}
                                {template.permissions.canShare && (
                                  <span className="inline-block border border-[#111111] px-2 py-0.5 text-xs np-mono uppercase tracking-wide text-[#111111]">
                                    RE-SHARE
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Restrictions */}
                          {template.restrictions && template.restrictions.length > 0 ? (
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest np-mono text-[#737373] mb-1.5">
                                Restrictions
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {template.restrictions.map(r => (
                                  <span
                                    key={r}
                                    className="inline-block border border-[#CC0000] text-[#CC0000] px-2 py-0.5 text-xs np-mono uppercase tracking-wide"
                                  >
                                    {r.replace('-', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-block border border-[#E5E5E0] text-[#737373] px-2 py-0.5 text-xs np-mono uppercase tracking-wide">
                              No restrictions
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedTemplate(template._id);
                              setShareForm(prev => ({
                                ...prev,
                                accessLevel: template.accessLevel,
                                expiryDays: template.expiryDays,
                                restrictions: template.restrictions || []
                              }));
                              setSuccess(`Template "${template.name}" applied to share form!`);
                            }}
                            className="w-full mt-1 py-2 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[36px] np-focus"
                          >
                            <FileCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                            USE THIS TEMPLATE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─────────────── Quick Share Link ─────────────── */}
            <OrnamentalDivider label="Quick Share Link" />

            <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<Link className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Quick Share Link"
                subtitle="Generate a temporary link · expires in 24 hrs · max 10 uses"
              />
              <div className="p-6 space-y-6">
                {/* Pass selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                    Select Pass to Share
                  </label>
                  <select
                    value={shareForm.passId}
                    onChange={(e) => setShareForm({ ...shareForm, passId: e.target.value })}
                    className="np-select"
                  >
                    <option value="">Choose a pass...</option>
                    {userPasses.map(pass => (
                      <option key={pass._id} value={pass._id}>
                        {pass.title} ({pass.qrType || pass.type || 'Pass'})
                      </option>
                    ))}
                  </select>
                  {userPasses.length === 0 && (
                    <p className="text-xs text-[#CC0000] np-mono mt-1 uppercase tracking-wide">
                      No passes available. Create a pass first!
                    </p>
                  )}
                </div>

                {/* Access level toggle */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
                    Access Level
                  </label>
                  <div className="inline-grid grid-cols-2 border border-[#111111]">
                    {([
                      { value: 'read', label: 'VIEW ONLY'   },
                      { value: 'edit', label: 'FULL ACCESS' },
                    ] as const).map((opt, i, arr) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setShareForm({ ...shareForm, accessLevel: opt.value })}
                        className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest np-mono transition-all duration-200
                          ${i < arr.length - 1 ? 'border-r border-[#111111]' : ''} min-h-[40px] np-focus
                          ${shareForm.accessLevel === opt.value
                            ? 'bg-[#111111] text-[#F9F9F7]'
                            : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'}`}
                        aria-pressed={shareForm.accessLevel === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link display row */}
                <div className={`border ${shareLink ? 'border-[#111111] bg-[#F5F5F5]' : 'border-[#E5E5E0]'} p-4`}>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="np-input flex-1"
                      placeholder="Generated link will appear here..."
                    />
                    {!shareLink ? (
                      <button
                        onClick={generateShareLink}
                        disabled={!shareForm.passId || isLoading}
                        className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed np-focus"
                      >
                        {isLoading
                          ? <div className="h-4 w-4 border-2 border-[#F9F9F7] border-t-transparent animate-spin" />
                          : <Link className="h-4 w-4" strokeWidth={1.5} />
                        }
                        GENERATE LINK
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          setSuccess('Link copied to clipboard!');
                        }}
                        className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[44px] np-focus"
                      >
                        <Copy className="h-4 w-4" strokeWidth={1.5} />
                        COPY
                      </button>
                    )}
                  </div>

                  {shareLink && (
                    <div className="mt-4 pt-3 border-t border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2 text-xs np-mono text-[#525252]">
                          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Expires in 24 hours
                        </div>
                        <div className="flex items-center gap-2 text-xs np-mono text-[#525252]">
                          <Users2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Max 10 uses
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShareLink('');
                          setSuccess('Link cleared. You can generate a new one.');
                        }}
                        className="text-xs text-[#CC0000] np-mono uppercase tracking-wide hover:underline np-focus"
                      >
                        Clear &amp; generate new
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─────────────── Batch Share ─────────────── */}
            <OrnamentalDivider label="Batch Share" />

            <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<Users2 className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Batch Share"
                subtitle="Share with multiple recipients at once · one email per line"
              />
              <div className="p-6 space-y-5">
                <div className="bg-[#F5F5F5] border border-[#111111] p-4">
                  <p className="text-xs text-[#525252] np-mono mb-3 uppercase tracking-wide">
                    Enter email addresses below — one per line
                  </p>
                  <textarea
                    value={batchEmails}
                    onChange={(e) => {
                      setBatchEmails(e.target.value);
                      if (e.target.value.trim()) {
                        const v = validationUtils.batchEmails(e.target.value);
                        setValidationErrors(prev => ({ ...prev, batchEmails: v.valid ? '' : v.error! }));
                      } else {
                        setValidationErrors(prev => ({ ...prev, batchEmails: '' }));
                      }
                    }}
                    placeholder={`john@example.com\njane@example.com\nalex@example.com`}
                    className={`np-textarea h-28 ${validationErrors.batchEmails ? 'np-textarea-error' : ''}`}
                  />
                  {validationErrors.batchEmails && (
                    <p className="text-xs text-[#CC0000] flex items-center gap-1 mt-2 np-mono">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.batchEmails}
                    </p>
                  )}
                  {batchEmails.trim() && !validationErrors.batchEmails && (
                    <p className="text-xs text-[#111111] flex items-center gap-1 mt-2 np-mono font-black">
                      <CheckCircle className="h-3 w-3" strokeWidth={2} />
                      {batchEmails.split('\n').filter(e => e.trim()).length} valid email(s) ready
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="np-select flex-1"
                  >
                    <option value="">Select sharing template (optional)</option>
                    {shareTemplates.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBatchShare}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 np-focus"
                  >
                    {isLoading
                      ? <div className="h-4 w-4 border-2 border-[#F9F9F7] border-t-transparent animate-spin" />
                      : <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                    }
                    SHARE WITH ALL
                  </button>
                </div>
              </div>
            </div>

            {/* ─────────────── Current Shares ─────────────── */}
            <OrnamentalDivider label="Active Shares" />

            {isLoading ? (
              <div className="border border-[#111111] p-10 text-center bg-[#F9F9F7]">
                <div className="inline-block h-8 w-8 border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
                <p className="text-xs np-mono uppercase tracking-widest text-[#737373]">
                  Loading shared passes...
                </p>
              </div>
            ) : (
              <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
                <SectionHeader
                  icon={<Users className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                  title="Currently Shared With"
                  subtitle={`${sharedPasses.length} active share${sharedPasses.length !== 1 ? 's' : ''}`}
                />
                <div className="p-6">
                  {sharedPasses.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#E5E5E0]">
                      <div className="border-2 border-[#111111] p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                        <Users className="h-7 w-7 text-[#111111]" strokeWidth={1} />
                      </div>
                      <p className="font-black text-[#111111] np-mono text-xs uppercase tracking-widest mb-1">
                        No passes shared yet
                      </p>
                      <p className="text-xs text-[#737373] np-mono">
                        Share your passes with family and friends
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sharedPasses.map(pass => (
                        <div
                          key={pass._id}
                          className="border border-[#111111] overflow-hidden np-hard-hover"
                        >
                          {/* Share row header */}
                          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="border border-[#111111] p-1.5 flex-shrink-0">
                                <Users className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0">
                                <span className="font-black text-[#111111] text-sm np-serif block truncate">
                                  {pass.recipient.email}
                                </span>
                                {pass.recipient.name && (
                                  <span className="text-xs text-[#737373] np-mono block truncate">
                                    {pass.recipient.name}
                                  </span>
                                )}
                                {pass.pass && (
                                  <span className="text-xs text-[#525252] np-mono block truncate mt-0.5">
                                    {pass.pass.title}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={pass.status} />
                          </div>

                          {/* Share row meta */}
                          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                                <span className="text-xs np-mono text-[#525252]">
                                  Access:{' '}
                                  <span className="font-black text-[#111111]">
                                    {pass.accessLevel === 'edit' ? 'Full Access' : 'View Only'}
                                  </span>
                                </span>
                              </div>
                              {pass.expiresAt && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-[#737373]" strokeWidth={1.5} />
                                  <span className="text-xs np-mono text-[#525252]">
                                    Expires:{' '}
                                    <span className="font-black text-[#111111]">
                                      {new Date(pass.expiresAt).toLocaleDateString()}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleRevokeAccess(pass._id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[36px] disabled:opacity-50 np-focus flex-shrink-0"
                            >
                              <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                              REVOKE ACCESS
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─────────────── Activity Logs ─────────────── */}
            <OrnamentalDivider label="Activity Logs" />

            <div className="border border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<History className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Activity Logs"
                subtitle="Recent sharing activity — shared, revoked, accessed, modified"
                action={
                  <button
                    onClick={handleToggleLogs}
                    className={`inline-flex items-center gap-2 px-4 py-2 font-black uppercase text-xs tracking-widest np-mono border transition-all duration-200 min-h-[36px] np-focus ${
                      showLogs
                        ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                        : 'bg-[#F9F9F7] text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {showLogs ? 'HIDE LOGS' : 'SHOW LOGS'}
                  </button>
                }
              />

              {showLogs && (
                <div className="p-6">
                  {shareLogs.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#E5E5E0]">
                      <div className="border-2 border-[#111111] p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                        <History className="h-7 w-7 text-[#111111]" strokeWidth={1} />
                      </div>
                      <p className="font-black text-[#111111] np-mono text-xs uppercase tracking-widest mb-1">
                        No activity logs yet
                      </p>
                      <p className="text-xs text-[#737373] np-mono">
                        Share activity will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0 border border-[#111111]">
                      {shareLogs.map((log, idx) => {
                        const meta = logActionMeta(log.action);
                        return (
                          <div
                            key={log._id}
                            className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between hover:bg-[#F5F5F5] transition-colors ${
                              idx < shareLogs.length - 1 ? 'border-b border-[#E5E5E0]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`${meta.bg} p-1.5 flex-shrink-0`}>
                                {meta.icon}
                              </div>
                              <div className="text-sm">
                                <span className="font-black text-xs np-mono uppercase tracking-wide text-[#111111]">
                                  {log.action}
                                </span>
                                <span className="text-xs np-mono text-[#525252]"> with </span>
                                <span className="font-black text-xs np-mono text-[#111111]">
                                  {log.recipient.email}
                                </span>
                                {log.details?.reason && (
                                  <span className="text-xs text-[#737373] np-mono block mt-0.5">
                                    {log.details.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-[#737373] np-mono sm:text-right flex-shrink-0">
                              <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="text-[#A3A3A3]">by {log.performedBy.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

export default Sharing;