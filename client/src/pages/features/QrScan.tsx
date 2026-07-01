import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { QrCode, Camera, Settings, History, CheckCircle2, XCircle, Image, 
         RotateCcw, Layers, ZoomIn, ZoomOut, Lightbulb, Filter, Share2, 
         CreditCard, ChevronLeft, ChevronRight, ArrowUpCircle, Lock, LogIn, Trash2, AlertCircle, ArrowLeft,
         Plus, Edit3, Save, Download, Eye, EyeOff, Palette, Type, Calendar, User, Building, Check, Share, Loader2, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import TerminalQrScanner from '../../components/TerminalQrScanner';
import qrcodeService, { QRCode as QRCodeType, QRCodeType as QRType, CreateQRCodeData } from '../../services/qrcodeService';
import { supabase } from '../../services/supabaseClient';

// ─── Newsprint Design System ─────────────────────────────────────────────────
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

    input[type='range'] { accent-color: #111111; }

    /* Hide scrollbars on carousel containers */
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

    /* Focus ring for keyboard nav */
    .np-focus:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px #F9F9F7, 0 0 0 4px #111111;
    }
  `}</style>
);

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper with newspaper masthead: edition bar, bordered container,
// ornamental divider footer.
// ─────────────────────────────────────────────────────────────────────────────
const FeatureTemplate: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  edition?: string;
  children: React.ReactNode;
}> = ({ title, description, icon, edition, children }) => {
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
              <div
                className="border-2 border-[#111111] p-6 flex items-center justify-center w-24 h-24 flex-shrink-0 np-hard-hover cursor-default"
              >
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

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface CardData {
  id: string;
  type: 'credit' | 'debit' | 'pass' | 'membership';
  title: string;
  number: string;
  expiryDate?: string;
  holderName: string;
  issuer: string;
  backgroundColor: string | { gradient: string };
  textColor: string;
  qrData: string;
  logo?: string;
}

interface NewCardForm {
  type: 'credit' | 'debit' | 'pass' | 'membership';
  title: string;
  number: string;
  expiryDate: string;
  holderName: string;
  issuer: string;
  backgroundColor: string;
  textColor: string;
  customData: string;
  category: string;
  notes: string;
}

interface CardTemplate {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'pass' | 'membership';
  gradient: string;
  textColor: string;
  category: string;
}

interface ScanResult {
  id: string;
  timestamp: Date;
  type: 'pass' | 'ticket' | 'membership';
  content: string;
  status: 'success' | 'failed';
}

interface ScanSettings {
  enableAutoFocus: boolean;
  enableBeep: boolean;
  enableVibration: boolean;
  saveHistory: boolean;
  preferredCamera: 'back' | 'front';
}

interface ScanQuality {
  brightness: number;
  contrast: number;
  zoom: number;
  resolution: 'low' | 'medium' | 'high';
}

interface BatchScanConfig {
  enabled: boolean;
  delay: number;
  maxItems: number;
  autoSave: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string; } | null;
}

// ─── Card templates & categories ──────────────────────────────────────────────
const cardTemplates: CardTemplate[] = [
  { id: 'premium-black', name: 'Premium Black', type: 'credit', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)', textColor: '#ffffff', category: 'Credit Card' },
  { id: 'ocean-blue', name: 'Ocean Blue', type: 'debit', gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)', textColor: '#ffffff', category: 'Debit Card' },
  { id: 'emerald-green', name: 'Emerald Green', type: 'debit', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', textColor: '#ffffff', category: 'Debit Card' },
  { id: 'royal-purple', name: 'Royal Purple', type: 'membership', gradient: 'linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #FF1493 100%)', textColor: '#ffffff', category: 'Membership' },
  { id: 'sunset-orange', name: 'Sunset Orange', type: 'pass', gradient: 'linear-gradient(135deg, #FF4500 0%, #FF6347 50%, #DC143C 100%)', textColor: '#ffffff', category: 'Pass' },
  { id: 'galaxy-gradient', name: 'Galaxy Gradient', type: 'pass', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff', category: 'Pass' },
  { id: 'golden-luxury', name: 'Golden Luxury', type: 'membership', gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)', textColor: '#ffffff', category: 'Premium Membership' },
  { id: 'arctic-silver', name: 'Arctic Silver', type: 'membership', gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)', textColor: '#ffffff', category: 'Silver Membership' }
];

const cardCategories = {
  credit: ['Cashback', 'Travel', 'Premium', 'Business', 'Rewards'],
  debit: ['Checking', 'Savings', 'Student', 'Premium', 'International'],
  pass: ['Transit', 'Gym', 'Cinema', 'Museum', 'Library', 'Event', 'Concert', 'Others'],
  membership: ['Premium', 'VIP', 'Gold', 'Silver', 'Diamond', 'Platinum', 'Elite']
};

const cardImages = {
  mastercard: '/images/mastercard-logo.png',
  visa: '/images/visa-logo.png',
  amex: '/images/amex-logo.png',
  cinema: '/images/cinema-logo.png',
  transit: '/images/transit-logo.png',
  membership: '/images/membership-logo.png'
};

const passDesigns = {
  membership: '/images/membership-pass.svg',
  gym: '/images/gym-pass.svg',
  cinema: '/images/cinema-pass.svg',
  transit: '/images/transit-pass.svg',
  library: '/images/library-pass.svg',
  event: '/images/event-pass.svg'
};

const sampleCards: CardData[] = [];

// ─── TYPE SELECTOR ICONS ──────────────────────────────────────────────────────
// Map card types to a concise icon + label pair; emojis removed for editorial
// consistency — lucide icons used throughout.
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  credit: { icon: <CreditCard className="h-5 w-5" strokeWidth={1.5} />, label: 'Credit' },
  debit:  { icon: <CreditCard className="h-5 w-5" strokeWidth={1.5} />, label: 'Debit'  },
  pass:   { icon: <Layers     className="h-5 w-5" strokeWidth={1.5} />, label: 'Pass'   },
  membership: { icon: <Building className="h-5 w-5" strokeWidth={1.5} />, label: 'Member' },
};

// ─── ManualEntryForm ──────────────────────────────────────────────────────────
// Memoised to prevent re-renders on parent state changes.
// All styling follows the Newsprint token system.
// ─────────────────────────────────────────────────────────────────────────────
const ManualEntryForm: React.FC<{
  formData: NewCardForm;
  validationErrors: string[];
  loading: boolean;
  onFormChange: (field: keyof NewCardForm, value: string) => void;
  onSave: () => void;
}> = React.memo(({ formData, validationErrors, loading, onFormChange, onSave }) => {
  return (
    <div className="bg-[#F9F9F7] space-y-6 np-sans">

      {/* ── Card / Pass Type selector ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">
          Card / Pass Type
        </label>
        {/* Collapsed border grid — no double lines */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-[#111111]">
          {(['credit', 'debit', 'pass', 'membership'] as const).map((type) => {
            const meta = TYPE_META[type];
            const active = formData.type === type;
            return (
              <button
                key={type}
                onClick={() => onFormChange('type', type)}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-2 text-center transition-all duration-200
                  border-r border-[#111111] last:border-r-0 min-h-[72px] np-focus
                  ${active
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'
                  }`}
                aria-pressed={active}
              >
                <span className={active ? 'text-[#F9F9F7]' : 'text-[#111111]'}>
                  {meta.icon}
                </span>
                <span className="font-black text-xs uppercase tracking-widest np-mono leading-none">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input-requirements info bar */}
        <div className="mt-0 p-3 bg-[#F5F5F5] border border-t-0 border-[#111111] flex items-start gap-2">
          <Info className="h-4 w-4 text-[#111111] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-xs text-[#111111] np-mono">
            {formData.type === 'credit' || formData.type === 'debit'
              ? <><strong>Card Number:</strong> 13–16 digits only · Auto-formatted with spaces · Test/demo cards accepted</>
              : <><strong>Pass/Membership ID:</strong> Alphanumeric characters allowed · Min 3 characters</>
            }
          </p>
        </div>
      </div>

      {/* ── Basic information fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            Title <span className="text-[#CC0000]">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormChange('title', e.target.value)}
            placeholder="e.g., Premium Credit Card"
            className="np-input"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            {formData.type === 'credit' || formData.type === 'debit' ? 'Card Number' : 'Pass/Membership ID'}{' '}
            <span className="text-[#CC0000]">*</span>
          </label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => onFormChange('number', e.target.value)}
            placeholder={formData.type === 'credit' || formData.type === 'debit' ? '1234 5678 9012 3456' : 'ABC-123-XYZ'}
            maxLength={formData.type === 'credit' || formData.type === 'debit' ? 19 : 50}
            className="np-input"
          />
          <p className="text-xs text-[#737373] mt-1 np-mono">
            {formData.type === 'credit' || formData.type === 'debit'
              ? '13–16 digits, auto-formatted with spaces'
              : 'Alphanumeric characters allowed'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            Holder Name <span className="text-[#CC0000]">*</span>
          </label>
          <input
            type="text"
            value={formData.holderName}
            onChange={(e) => onFormChange('holderName', e.target.value)}
            placeholder="John Doe"
            className="np-input"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            Issuer / Organization
          </label>
          <input
            type="text"
            value={formData.issuer}
            onChange={(e) => onFormChange('issuer', e.target.value)}
            placeholder="Bank Name, Company"
            className="np-input"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            Expiry Date{' '}
            {(formData.type === 'credit' || formData.type === 'debit') && (
              <span className="text-[#737373]">(Recommended)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.expiryDate}
            onChange={(e) => onFormChange('expiryDate', e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
            className="np-input"
          />
          <p className="text-xs text-[#737373] mt-1 np-mono">Format: MM/YY (e.g., 12/25)</p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => onFormChange('category', e.target.value)}
            className="np-select"
          >
            <option value="">Select Category</option>
            {cardCategories[formData.type]?.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Additional notes ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
          Additional Notes
        </label>
        <textarea
          value={formData.customData}
          onChange={(e) => onFormChange('customData', e.target.value)}
          placeholder="Any additional information..."
          rows={3}
          className="np-textarea"
        />
      </div>

      {/* ── Live QR preview ── */}
      {formData.title && formData.number && formData.holderName && (
        <div className="bg-[#F5F5F5] border border-[#111111]">
          {/* Preview header */}
          <div className="bg-[#111111] px-4 py-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#F9F9F7]" strokeWidth={1.5} />
            <span className="font-black text-[#F9F9F7] uppercase text-xs tracking-widest np-mono">
              Live QR Preview
            </span>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="bg-white p-6 border border-[#E5E5E0]">
              <QRCodeSVG
                value={`${formData.type}:${formData.title}:${formData.number}`}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-[#737373] np-mono uppercase tracking-widest">
                Preview QR — simplified for display
              </p>
              <p className="text-xs text-[#A3A3A3] np-mono">
                {formData.type === 'credit' || formData.type === 'debit'
                  ? '🔒 Full data encrypted when saved'
                  : '📄 Full data included when saved'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Validation errors ── */}
      {validationErrors.length > 0 && (
        <div className="bg-[#F9F9F7] border-l-4 border-[#CC0000] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <h4 className="font-black text-[#CC0000] mb-2 text-xs uppercase tracking-widest np-mono">
                Please fix the following errors:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#CC0000] np-mono">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <button
        onClick={onSave}
        disabled={loading}
        className={`w-full px-6 py-3 border font-black uppercase text-xs tracking-widest transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] np-mono np-focus ${
          loading
            ? 'bg-[#E5E5E0] text-[#A3A3A3] border-[#A3A3A3] cursor-not-allowed'
            : 'bg-[#111111] text-[#F9F9F7] border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111]'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
            SAVING...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" strokeWidth={1.5} />
            SAVE {formData.type === 'credit' || formData.type === 'debit' ? 'CARD' : 'PASS'}
          </>
        )}
      </button>
    </div>
  );
});

ManualEntryForm.displayName = 'ManualEntryForm';

// ─── Main component ────────────────────────────────────────────────────────────
const QrScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [settings, setSettings] = useState<ScanSettings>({
    enableAutoFocus: true,
    enableBeep: true,
    enableVibration: true,
    saveHistory: true,
    preferredCamera: 'back'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [quality, setQuality] = useState<ScanQuality>({
    brightness: 100,
    contrast: 100,
    zoom: 1,
    resolution: 'high'
  });
  const [batchConfig, setBatchConfig] = useState<BatchScanConfig>({
    enabled: false,
    delay: 1000,
    maxItems: 10,
    autoSave: true
  });
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewCardForm>({
    type: 'credit',
    title: '',
    number: '',
    expiryDate: '',
    holderName: '',
    issuer: '',
    backgroundColor: cardTemplates[0].gradient,
    textColor: '#ffffff',
    customData: '',
    category: '',
    notes: ''
  });

  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });

  // ── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token       = localStorage.getItem('accessToken');
    const isAuthFlag  = localStorage.getItem('isAuthenticated') === 'true';
    const userData    = localStorage.getItem('userData');
    const isAuthenticated = token !== null && isAuthFlag;
    const user        = userData ? JSON.parse(userData) : null;

    console.log('🔐 Auth check:', { hasToken: !!token, isAuthFlag, isAuthenticated });
    setAuth({ isAuthenticated, user });

    if (isAuthenticated && user?.name) {
      setFormData(prev => ({ ...prev, holderName: user.name }));
    }
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated — clearing cards');
      setCards([]);
    }
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log('✅ Authenticated — fetching QR codes');
      fetchQRCodes();
    } else {
      console.log('❌ Not authenticated — skipping fetch');
      setCards([]);
    }
  }, [auth.isAuthenticated]);

  // ── Fetch QR codes ─────────────────────────────────────────────────────────
  const fetchQRCodes = async () => {
    const token      = localStorage.getItem('accessToken');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';

    if (!token || !isAuthFlag) {
      console.error('❌ Cannot fetch QR codes — not authenticated');
      setCards([]);
      setError('Please sign in to view your cards');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching QR codes for authenticated user...');
      const response = await qrcodeService.getQRCodes({ page: 1, limit: 100, sortBy: '-createdAt' });
      console.log('📊 QR codes response:', response);

      if (!response || !response.qrcodes || !Array.isArray(response.qrcodes)) {
        console.warn('No QR codes found in response:', response);
        setCards([]);
        return;
      }

      console.log(`✅ Fetched ${response.qrcodes.length} QR codes`);

      const convertedCards = response.qrcodes.map((qr: QRCodeType) => {
        const gradient = qr.color && qr.backgroundColor
          ? `linear-gradient(135deg, ${qr.backgroundColor} 0%, ${qr.color} 100%)`
          : cardTemplates[0].gradient;

        let qrData    = typeof qr.data === 'object' ? qr.data : {};
        let parsedData = qrData;

        if (qrData.text && typeof qrData.text === 'string') {
          try {
            parsedData = JSON.parse(qrData.text);
          } catch { parsedData = qrData; }
        }

        if (qr.qrType === 'password' && qrData && !qrData.text) {
          parsedData = qrData;
        }

        let cardType: 'credit' | 'debit' | 'pass' | 'membership' = 'pass';

        if (parsedData.type) {
          const rawType = parsedData.type.toLowerCase();
          if (rawType === 'credit') cardType = 'credit';
          else if (rawType === 'debit') cardType = 'debit';
          else if (rawType.includes('membership') || rawType === 'loyalty-card' ||
                   rawType.includes('loyalty') || rawType.includes('vip') || rawType.includes('premium')) {
            cardType = 'membership';
          } else cardType = 'pass';
        } else if (qr.qrType === 'password') {
          const catLower = (qr.category || '').toLowerCase();
          cardType = catLower.includes('debit') ? 'debit' : 'credit';
        } else if (qr.category) {
          const catLower = qr.category.toLowerCase();
          if (catLower.includes('credit')) cardType = 'credit';
          else if (catLower.includes('debit')) cardType = 'debit';
          else if (catLower.includes('membership') || catLower.includes('premium') ||
                   catLower.includes('vip') || catLower.includes('gold') ||
                   catLower.includes('silver') || catLower.includes('platinum') ||
                   catLower.includes('diamond') || catLower.includes('elite') ||
                   catLower.includes('loyalty')) {
            cardType = 'membership';
          } else cardType = 'pass';
        }

        const finalQrData = qr.qrCodeImage || qr._id;

        return {
          id: qr._id,
          type: cardType,
          title: qr.title,
          number: parsedData.number || qrData.number || qrData.id || '****',
          expiryDate: parsedData.expiry || qrData.expiry || (qr.expiresAt ? new Date(qr.expiresAt).toLocaleDateString() : undefined),
          holderName: parsedData.holder || qrData.holder || auth.user?.name || 'Card Holder',
          issuer: parsedData.issuer || qrData.issuer || qr.category || 'Issuer',
          backgroundColor: { gradient },
          textColor: '#ffffff',
          qrData: finalQrData,
        };
      });

      setCards(convertedCards);
    } catch (err: any) {
      console.error('❌ Error fetching QR codes:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // End the real Supabase session — onAuthStateChange in
        // supabaseClient.ts clears localStorage for us.
        supabase.auth.signOut();
        setAuth({ isAuthenticated: false, user: null });
        setError('Session expired. Please sign in again.');
        setCards([]);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load QR codes');
        setCards([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const startScanning = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access not supported');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: settings.preferredCamera === 'back' ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      setValidationErrors([`Camera access failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    }
  };

  const stopScanning = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setIsScanning(false);
  };

  const handleScanResult = (result: string) => {
    const scanResult: ScanResult = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'pass',
      content: result,
      status: 'success'
    };
    setLastScan(scanResult);
    if (settings.saveHistory) setScanHistory(prev => [scanResult, ...prev]);
  };

  const adjustQuality = (property: keyof ScanQuality, value: any) => {
    setQuality(prev => ({ ...prev, [property]: value }));
  };

  const toggleBatchMode = () => {
    setBatchConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const generateQRData = (data: NewCardForm): string => {
    return JSON.stringify({
      type: data.type, title: data.title, number: data.number,
      holder: data.holderName, issuer: data.issuer, expiry: data.expiryDate,
      category: data.category, custom: data.customData,
      timestamp: new Date().toISOString()
    });
  };

  const formatCardNumber = (value: string, type: 'credit' | 'debit' | 'pass' | 'membership'): string => {
    if (type === 'credit' || type === 'debit') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return value.replace(/[^a-zA-Z0-9\-\s]/g, '').slice(0, 50);
  };

  const validateCardNumber = (number: string, type: string): string | null => {
    const clean = number.replace(/\s/g, '');
    if (!clean) return 'Card/Pass number is required';
    if (type === 'credit' || type === 'debit') {
      if (!/^\d+$/.test(clean)) return 'Card number must contain only digits';
      if (clean.length < 13 || clean.length > 16) return 'Card number must be 13–16 digits';
    } else {
      if (clean.length < 3) return 'Pass number must be at least 3 characters';
    }
    return null;
  };

  const isValidLuhn = (cardNumber: string): boolean => {
    let sum = 0, isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiryDate = (expiry: string): string | null => {
    if (!expiry) return null;
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(expiry)) return 'Expiry date must be in MM/YY format';
    const [month, year] = expiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    if (expiryDate < new Date()) return 'Card has expired';
    return null;
  };

  const formatExpiryDate = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 4);
    return numbers.length >= 3 ? `${numbers.slice(0, 2)}/${numbers.slice(2)}` : numbers;
  };

  const handleFormChange = (field: keyof NewCardForm, value: string) => {
    let processedValue = value;
    if (field === 'number')     processedValue = formatCardNumber(value, formData.type);
    if (field === 'expiryDate') processedValue = formatExpiryDate(value);
    if (field === 'holderName') processedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const saveNewCard = async () => {
    if (!auth.isAuthenticated) { setValidationErrors(['Please sign in to create cards']); return; }

    const errors: string[] = [];
    if (!formData.title?.trim())     errors.push('Title is required');
    if (!formData.holderName?.trim()) errors.push('Holder name is required');
    const numberError = validateCardNumber(formData.number, formData.type);
    if (numberError) errors.push(numberError);
    if ((formData.type === 'credit' || formData.type === 'debit') && formData.expiryDate) {
      const expiryError = validateExpiryDate(formData.expiryDate);
      if (expiryError) errors.push(expiryError);
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setValidationErrors([]);

    try {
      const qrType: QRType = (formData.type === 'credit' || formData.type === 'debit') ? 'password' : 'text';
      const cardData = {
        type: formData.type, title: formData.title, number: formData.number,
        holder: formData.holderName, issuer: formData.issuer || 'N/A',
        expiry: formData.expiryDate || 'N/A',
        category: formData.category || formData.type,
        notes: formData.notes || ''
      };
      const data = qrType === 'text' ? { text: JSON.stringify(cardData) } : cardData;

      const extractColorFromGradient = (bg: string): string => {
        if (bg.includes('gradient')) {
          const m = bg.match(/#[0-9A-Fa-f]{6}/);
          return m ? m[0] : '#FFFFFF';
        }
        return bg.startsWith('#') ? bg : '#FFFFFF';
      };

      const qrCodeData: CreateQRCodeData = {
        qrType, title: formData.title, data, isEncrypted: false,
        category: formData.category || formData.type,
        tags: [formData.type, formData.category].filter(Boolean) as string[],
        description: formData.notes || `${formData.type.toUpperCase()} — ${formData.holderName}`,
        color: formData.textColor || '#000000',
        backgroundColor: extractColorFromGradient(formData.backgroundColor),
        size: 256
      };

      const newQRCode = await qrcodeService.createQRCode(qrCodeData);
      const gradient  = newQRCode.color && newQRCode.backgroundColor
        ? `linear-gradient(135deg, ${newQRCode.backgroundColor} 0%, ${newQRCode.color} 100%)`
        : formData.backgroundColor;
      const finalQrData = newQRCode.qrCodeImage || newQRCode._id;

      const newCard: CardData = {
        id: newQRCode._id, type: formData.type, title: formData.title,
        number: formData.number, expiryDate: formData.expiryDate,
        holderName: formData.holderName, issuer: formData.issuer,
        backgroundColor: { gradient }, textColor: formData.textColor,
        qrData: finalQrData
      };

      setCards(prev => [newCard, ...prev]);
      setFormData({
        type: 'credit', title: '', number: '', expiryDate: '',
        holderName: auth.user?.name || '', issuer: '',
        backgroundColor: cardTemplates[0].gradient, textColor: '#ffffff',
        customData: '', category: '', notes: ''
      });
      setValidationErrors([]);
      const cardTypeName = formData.type === 'credit' || formData.type === 'debit' ? 'Card' : 'Pass';
      alert(`✅ ${cardTypeName} created successfully!\n\n📬 A notification has been added to your dashboard.`);
    } catch (err: any) {
      console.error('Error creating card:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create card. Please try again.';
      setValidationErrors([`Error: ${msg}`]);
    } finally {
      setLoading(false);
    }
  };

  // ── Auth UI helpers ────────────────────────────────────────────────────────
  const AuthPrompt = () => (
    <div className="bg-[#F9F9F7] border border-[#111111] p-8 text-center np-sans">
      <div className="border-2 border-[#111111] p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Lock className="h-10 w-10 text-[#111111]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-black text-[#111111] mb-3 np-serif uppercase tracking-tight">Sign In Required</h3>
      <p className="text-[#525252] mb-6 np-body text-sm">Please sign in to view your cards and passes</p>
      <button
        onClick={() => navigate('/signin')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        SIGN IN
      </button>
    </div>
  );

  const handleSignOut = async () => {
    // End the real Supabase session — onAuthStateChange in
    // supabaseClient.ts clears localStorage for us.
    await supabase.auth.signOut();
    setAuth({ isAuthenticated: false, user: null });
    setCards([]);
    setSelectedCard(null);
    setError(null);
    navigate('/signin');
  };

  // ── CardDisplay ────────────────────────────────────────────────────────────
  // Cards render with their gradient backgrounds (editorial choice: gradient
  // is appropriate for physical card simulation). Corners remain sharp.
  // ─────────────────────────────────────────────────────────────────────────
  const CardDisplay: React.FC<{ card: CardData }> = ({ card }) => (
    <div
      className="relative w-[340px] flex-shrink-0 mx-2 overflow-hidden group transition-all duration-200 np-hard-hover cursor-pointer"
      style={{ borderRadius: 0 }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: typeof card.backgroundColor === 'string'
            ? card.backgroundColor
            : card.backgroundColor.gradient,
          borderRadius: 0
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/card-pattern.svg')] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
        </div>
      </div>

      {/* Card content */}
      <div className="relative z-10 p-6 h-[200px] flex flex-col" style={{ color: card.textColor }}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-wide np-serif">{card.title}</h3>
            <p className="text-sm opacity-80 np-mono tracking-wider">{card.number}</p>
          </div>
          {card.logo && (
            <div className="bg-white/30 p-1.5">
              <img
                src={card.logo}
                alt={card.issuer}
                className="h-8 transition-transform group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div>
            <p className="text-sm opacity-90 uppercase tracking-widest font-black np-mono">{card.holderName}</p>
            {card.expiryDate && (
              <p className="text-xs opacity-80 mt-1 np-mono">Valid Thru: {card.expiryDate}</p>
            )}
          </div>
          <div className="text-xs opacity-70 uppercase tracking-widest np-mono">{card.issuer}</div>
        </div>

        {/* QR Code — bottom-right inset */}
        <div className="absolute right-4 bottom-4 group-hover:scale-110 transition-all duration-200 transform-gpu">
          <div className="bg-white/90 p-2 border border-white/50">
            {card.qrData && card.qrData.startsWith('data:image') ? (
              <img
                src={card.qrData}
                alt="QR Code"
                className="w-[84px] h-[84px]"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                  t.parentElement!.innerHTML = `<div class="w-[84px] h-[84px] flex items-center justify-center bg-slate-100 text-xs text-slate-600">QR Code</div>`;
                }}
              />
            ) : (
              <QRCodeSVG value={card.qrData || card.number} size={84} level="M" includeMargin={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── renderSelectedCardQR (inline panel, not used in main render directly) ──
  const renderSelectedCardQR = () => {
    if (!selectedCard) return null;
    return (
      <div className="mt-4 p-4 bg-[#F5F5F5] border border-[#111111]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">
            Selected Card QR Code
          </h4>
          <button
            onClick={() => setSelectedCard(null)}
            className="text-[#111111] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <XCircle className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex justify-center p-4 bg-white border border-[#111111]">
          {selectedCard.qrData && selectedCard.qrData.startsWith('data:image') ? (
            <img src={selectedCard.qrData} alt="QR Code" className="w-[200px] h-[200px]" />
          ) : (
            <QRCodeSVG value={selectedCard.qrData || selectedCard.number} size={200} level="M" includeMargin={true} />
          )}
        </div>
      </div>
    );
  };

  // ── Delete helpers ─────────────────────────────────────────────────────────
  const creditCards = cards.filter(c => c.type === 'credit' || c.type === 'debit');
  const passes      = cards.filter(c => c.type === 'pass'   || c.type === 'membership');

  const deleteAllPasses = async () => {
    if (!auth.isAuthenticated) { alert('Please sign in to delete passes'); return; }
    if (passes.length === 0) { alert('No passes to delete'); return; }
    if (!window.confirm(`Are you sure you want to delete ALL ${passes.length} passes/memberships?\n\nThis action cannot be undone!`)) return;
    setLoading(true); setError(null);
    try {
      await Promise.all(passes.map(p => qrcodeService.deleteQRCode(p.id).catch(() => null)));
      await fetchQRCodes();
      alert(`✅ Successfully deleted ${passes.length} passes!`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete passes');
      alert('Error deleting passes. Please try again.');
    } finally { setLoading(false); }
  };

  const deleteAllCards = async () => {
    if (creditCards.length === 0) { alert('No cards to delete'); return; }
    if (!window.confirm(`⚠️ Are you sure you want to delete ALL ${creditCards.length} cards?\n\nThis action cannot be undone!`)) return;
    setLoading(true); setError(null);
    try {
      await Promise.all(creditCards.map(c => qrcodeService.deleteQRCode(c.id).catch(() => null)));
      await fetchQRCodes();
      alert(`✅ Successfully deleted ${creditCards.length} cards!`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete cards');
      alert('Error deleting cards. Please try again.');
    } finally { setLoading(false); }
  };

  // ── SectionHeader ──────────────────────────────────────────────────────────
  const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ icon, title, badge, actions }) => (
    <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between">
      <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
        {icon}
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {badge}
        {actions}
      </div>
    </div>
  );

  // ── Settings Panel ─────────────────────────────────────────────────────────
  // Renders when showSettings is toggled. Provides toggle controls for all
  // ScanSettings fields following the Newsprint token system.
  // ─────────────────────────────────────────────────────────────────────────
  const SettingsPanel = () => (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<Settings className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Scanner Settings"
        actions={
          <button
            onClick={() => setShowSettings(false)}
            className="text-[#111111] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus"
            aria-label="Close settings"
          >
            <XCircle className="h-4 w-4" strokeWidth={1.5} />
          </button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#111111]">
          {/* Camera preference */}
          <div className="p-4 border-r border-b border-[#111111]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Preferred Camera</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Back or front-facing lens</p>
              </div>
              <div className="flex border border-[#111111]">
                {(['back', 'front'] as const).map(cam => (
                  <button
                    key={cam}
                    onClick={() => setSettings(s => ({ ...s, preferredCamera: cam }))}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono transition-all duration-200 min-h-[44px] border-r border-[#111111] last:border-r-0 ${
                      settings.preferredCamera === cam
                        ? 'bg-[#111111] text-[#F9F9F7]'
                        : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {cam}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-focus */}
          <div className="p-4 border-b border-[#111111]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Auto Focus</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Continuous camera focus</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, enableAutoFocus: !s.enableAutoFocus }))}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] ${
                  settings.enableAutoFocus
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                {settings.enableAutoFocus ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Beep on scan */}
          <div className="p-4 border-r border-b border-[#111111]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Scan Beep</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Audio feedback on success</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, enableBeep: !s.enableBeep }))}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] ${
                  settings.enableBeep
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                {settings.enableBeep ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Vibration */}
          <div className="p-4 border-b border-[#111111]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Vibration</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Haptic feedback on scan</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, enableVibration: !s.enableVibration }))}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] ${
                  settings.enableVibration
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                {settings.enableVibration ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Save history */}
          <div className="p-4 border-r border-[#111111] md:border-b-0 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Save History</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Log scans for review</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, saveHistory: !s.saveHistory }))}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] ${
                  settings.saveHistory
                    ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                    : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                {settings.saveHistory ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">Resolution</p>
                <p className="text-xs text-[#737373] np-mono mt-0.5">Camera capture quality</p>
              </div>
              <div className="flex border border-[#111111]">
                {(['low', 'medium', 'high'] as const).map(res => (
                  <button
                    key={res}
                    onClick={() => setQuality(q => ({ ...q, resolution: res }))}
                    className={`px-2.5 py-1.5 text-xs font-black uppercase tracking-widest np-mono transition-all duration-200 min-h-[44px] border-r border-[#111111] last:border-r-0 ${
                      quality.resolution === res
                        ? 'bg-[#111111] text-[#F9F9F7]'
                        : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {res.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Sections built as variables for readability ────────────────────────────

  // Cards section
  const cardsSection = auth.isAuthenticated ? (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<CreditCard className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Credit &amp; Debit Cards"
        badge={
          <span className="bg-[#111111] text-[#F9F9F7] px-3 py-0.5 np-mono text-xs uppercase tracking-widest">
            {creditCards.length} Cards
          </span>
        }
        actions={
          creditCards.length > 0 ? (
            <button
              onClick={deleteAllCards}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] text-[#CC0000] border border-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] np-focus"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              DELETE ALL
            </button>
          ) : undefined
        }
      />
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto text-[#111111] animate-spin mb-3" strokeWidth={1.5} />
            <p className="text-[#737373] np-mono text-xs uppercase tracking-widest">Loading your cards...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-[#CC0000]">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-black np-mono text-xs uppercase">{error}</p>
            <button onClick={fetchQRCodes} className="mt-4 px-4 py-2 bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] border border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus">
              RETRY
            </button>
          </div>
        ) : creditCards.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2">
              <div className="flex flex-row space-x-4 px-2">
                {creditCards.map(card => (
                  <div key={card.id} onClick={() => setSelectedCard(card)} className="cursor-pointer">
                    <CardDisplay card={card} />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F9F9F7] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F9F9F7] to-transparent pointer-events-none" />
            {creditCards.length > 1 && (
              <>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center np-focus">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center np-focus">
                    <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-[#737373]">
            <CreditCard className="h-10 w-10 mx-auto text-[#E5E5E5] mb-3" strokeWidth={1.5} />
            <p className="font-black text-xs uppercase tracking-widest np-mono">No credit or debit cards</p>
            <p className="text-xs text-[#A3A3A3] mt-1 np-mono">Add your first card to get started</p>
          </div>
        )}
      </div>
    </div>
  ) : <AuthPrompt />;

  // Passes section
  const passesSection = auth.isAuthenticated ? (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<Layers className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Passes &amp; Memberships"
        badge={
          <span className="bg-[#111111] text-[#F9F9F7] px-3 py-0.5 np-mono text-xs uppercase tracking-widest">
            {passes.length} Passes
          </span>
        }
        actions={
          passes.length > 0 ? (
            <button
              onClick={deleteAllPasses}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] text-[#CC0000] border border-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] np-focus"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              DELETE ALL
            </button>
          ) : undefined
        }
      />
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto text-[#111111] animate-spin mb-3" strokeWidth={1.5} />
            <p className="text-[#737373] np-mono text-xs uppercase tracking-widest">Loading your passes...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-[#CC0000]">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-black np-mono text-xs uppercase">{error}</p>
            <button onClick={fetchQRCodes} className="mt-4 px-4 py-2 bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] border border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus">
              RETRY
            </button>
          </div>
        ) : passes.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2">
              <div className="flex flex-row space-x-4 px-2">
                {passes.map(card => (
                  <div key={card.id} onClick={() => setSelectedCard(card)} className="cursor-pointer">
                    <CardDisplay card={card} />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F9F9F7] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F9F9F7] to-transparent pointer-events-none" />
            {passes.length > 1 && (
              <>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center np-focus">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center np-focus">
                    <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-[#737373]">
            <Layers className="h-10 w-10 mx-auto text-[#E5E5E5] mb-3" strokeWidth={1.5} />
            <p className="font-black text-xs uppercase tracking-widest np-mono">No passes or memberships</p>
            <p className="text-xs text-[#A3A3A3] mt-1 np-mono">Add your first pass to get started</p>
          </div>
        )}
      </div>
    </div>
  ) : <AuthPrompt />;

  // Selected card QR section
  const selectedCardSection = selectedCard && auth.isAuthenticated ? (
    <div className="bg-[#F5F5F5] border border-[#111111] overflow-hidden">
      {/* Inverted header */}
      <div className="bg-[#111111] px-4 py-3 flex items-center justify-between">
        <h4 className="font-black text-[#F9F9F7] flex items-center gap-2 text-xs uppercase tracking-widest np-mono">
          <QrCode className="h-4 w-4" strokeWidth={1.5} />
          Selected {selectedCard.type === 'credit' || selectedCard.type === 'debit' ? 'Card' : 'Pass'} — QR Code
        </h4>
        <button
          onClick={() => setSelectedCard(null)}
          className="text-[#A3A3A3] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus"
          aria-label="Close QR panel"
        >
          <XCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center gap-6">
        {/* QR code */}
        <div className="relative flex-shrink-0">
          {/* Editorial red corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#CC0000]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#CC0000]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#CC0000]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#CC0000]" />
          <div className="bg-white p-5 border border-[#111111]">
            {selectedCard.qrData && selectedCard.qrData.startsWith('data:image') ? (
              <img src={selectedCard.qrData} alt="QR Code" className="w-[200px] h-[200px]" />
            ) : (
              <QRCodeSVG value={selectedCard.qrData || selectedCard.number} size={200} level="M" includeMargin={true} />
            )}
          </div>
        </div>

        {/* Card meta + actions */}
        <div className="space-y-3 flex-1">
          <h5 className="text-2xl font-black text-[#111111] np-serif leading-tight">{selectedCard.title}</h5>
          <p className="text-[#737373] np-mono text-xs uppercase tracking-widest border-l-2 border-[#CC0000] pl-3">
            {selectedCard.issuer}
          </p>
          {selectedCard.holderName && (
            <p className="text-xs text-[#525252] np-mono uppercase tracking-widest">{selectedCard.holderName}</p>
          )}
          {selectedCard.expiryDate && (
            <p className="text-xs text-[#A3A3A3] np-mono">Valid Thru: {selectedCard.expiryDate}</p>
          )}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E5E5E0]">
            <button className="px-4 py-2 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px] np-focus">
              <Share2 className="h-4 w-4" strokeWidth={1.5} />
              SHARE
            </button>
            <button className="px-4 py-2 bg-transparent border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px] np-focus">
              <Image className="h-4 w-4" strokeWidth={1.5} />
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Scan history
  const ScanHistorySection = () => (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<History className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Recent Scans"
        badge={
          scanHistory.length > 0 ? (
            <span className="bg-[#111111] text-[#F9F9F7] px-3 py-0.5 np-mono text-xs uppercase tracking-widest">
              {scanHistory.length}
            </span>
          ) : undefined
        }
      />
      <div className="divide-y divide-[#E5E5E0]">
        {scanHistory.length === 0 ? (
          <div className="py-10 text-[#737373] text-center">
            <div className="border border-[#E5E5E0] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <History className="h-8 w-8 text-[#E5E5E5]" strokeWidth={1.5} />
            </div>
            <p className="font-black text-xs uppercase tracking-widest np-mono">No scan history</p>
            <p className="text-xs text-[#A3A3A3] mt-1 np-mono">Your scan results will appear here</p>
          </div>
        ) : (
          scanHistory.slice(0, 5).map(scan => (
            <div key={scan.id} className="p-5 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 border ${
                  scan.status === 'success'
                    ? 'border-[#111111] text-[#111111]'
                    : 'border-[#CC0000] text-[#CC0000]'
                }`}>
                  {scan.status === 'success'
                    ? <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                    : <XCircle className="h-5 w-5" strokeWidth={1.5} />
                  }
                </div>
                <div>
                  <div className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">{scan.type}</div>
                  <div className="text-xs text-[#737373] np-mono">{scan.timestamp.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 text-[#A3A3A3] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus" aria-label="Share scan">
                  <Share2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button className="p-1.5 text-[#A3A3A3] hover:text-[#CC0000] hover:bg-[#F5F5F5] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus" aria-label="Delete scan">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="QR Code Scanning &amp; Card Management"
        description="Scan QR codes or manually create digital cards and passes with auto-generated QR codes"
        icon={<QrCode className="h-8 w-8 text-[#111111]" />}
        edition="QR PASS EDITION"
      >
        {/* ── Sign-out / user bar ── */}
        {auth.isAuthenticated && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E5E5E0]">
            <span className="text-xs np-mono text-[#737373] uppercase tracking-widest">
              Signed in as <span className="text-[#111111] font-black">{auth.user?.name || auth.user?.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors np-mono min-h-[44px] np-focus"
            >
              <LogIn className="h-4 w-4" strokeWidth={1.5} />
              SIGN OUT
            </button>
          </div>
        )}

        <div className="space-y-6 relative np-sans">

          {/* ── Action Bar ── */}
          <div className="bg-[#111111] np-texture">
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="border border-[#F9F9F7]/20 p-2 flex items-center justify-center w-10 h-10">
                  <QrCode className="h-5 w-5 text-[#F9F9F7]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-black text-[#F9F9F7] text-xs uppercase tracking-widest np-mono">Quick Actions</h3>
                  <p className="text-xs text-[#A3A3A3] np-mono">Scan QR codes and manage your cards</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Settings toggle */}
                <button
                  onClick={() => setShowSettings(v => !v)}
                  className={`p-2 border transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center np-focus ${
                    showSettings
                      ? 'bg-[#F9F9F7] text-[#111111] border-[#F9F9F7]'
                      : 'bg-transparent text-[#F9F9F7] border-[#F9F9F7]/30 hover:border-[#F9F9F7] hover:bg-[#F9F9F7]/10'
                  }`}
                  aria-label="Toggle settings"
                  aria-expanded={showSettings}
                >
                  <Settings className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            {/* Sub-metadata strip */}
            <div className="px-5 py-1.5 border-t border-[#F9F9F7]/10 flex items-center gap-4">
              <span className="text-[#737373] np-mono text-xs">
                {cards.length} Total Items
              </span>
              <span className="text-[#737373]">·</span>
              <span className={`np-mono text-xs ${auth.isAuthenticated ? 'text-[#A3A3A3]' : 'text-[#CC0000]'}`}>
                {auth.isAuthenticated ? '● AUTHENTICATED' : '○ NOT SIGNED IN'}
              </span>
            </div>
          </div>

          {/* ── Settings Panel (conditional) ── */}
          {showSettings && <SettingsPanel />}

          {/* ─────────────── Ornamental section divider ─────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#111111]" />
            <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Camera Scanner</span>
            <div className="flex-1 h-px bg-[#111111]" />
          </div>

          {/* ── Camera Scanner Section ── */}
          <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
            <SectionHeader
              icon={<Camera className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
              title="QR Code Scanner"
            />
            <div className="p-6">
              <div className="relative aspect-video bg-[#111111] overflow-hidden">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      style={{
                        filter: `brightness(${quality.brightness}%) contrast(${quality.contrast}%)`,
                        transform: `scale(${quality.zoom})`
                      }}
                    />
                    {/* Scan target overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border border-white/40 animate-pulse">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#CC0000]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#CC0000]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#CC0000]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#CC0000]" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="bg-black/70 text-[#F9F9F7] px-3 py-2 np-mono text-xs uppercase tracking-widest">
                        {quality.resolution.toUpperCase()} | ZOOM {quality.zoom}×
                      </div>
                      <button
                        onClick={stopScanning}
                        className="bg-[#CC0000] hover:bg-[#111111] text-white p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center np-focus"
                      >
                        <XCircle className="h-6 w-6" strokeWidth={1.5} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#F9F9F7]">
                    <div className="border-2 border-[#F9F9F7]/30 p-6 mb-6">
                      <Camera className="h-16 w-16" strokeWidth={1} />
                    </div>
                    <h4 className="text-xl font-black mb-2 np-serif uppercase tracking-wide">Ready to Scan</h4>
                    <p className="text-[#A3A3A3] text-center mb-6 max-w-md np-mono text-xs uppercase tracking-wider">
                      Position a QR code within the frame to scan
                    </p>
                    <button
                      onClick={startScanning}
                      className="px-8 py-3 bg-[#F9F9F7] text-[#111111] border border-transparent hover:bg-transparent hover:text-[#F9F9F7] hover:border-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px] np-focus"
                    >
                      <Camera className="h-5 w-5" strokeWidth={1.5} />
                      START SCANNING
                    </button>
                  </div>
                )}
              </div>

              {/* Scanner controls — visible only when active */}
              {isScanning && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 border border-[#111111] p-4 bg-[#F5F5F5]">
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0 w-16">BRIGHT:</label>
                    <input type="range" min="50" max="150" value={quality.brightness}
                      onChange={(e) => adjustQuality('brightness', parseInt(e.target.value))} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0 w-20">CONTRAST:</label>
                    <input type="range" min="50" max="150" value={quality.contrast}
                      onChange={(e) => adjustQuality('contrast', parseInt(e.target.value))} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0 w-12">ZOOM:</label>
                    <input type="range" min="1" max="3" step="0.1" value={quality.zoom}
                      onChange={(e) => adjustQuality('zoom', parseFloat(e.target.value))} className="flex-1" />
                  </div>
                  <button
                    onClick={toggleBatchMode}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] np-focus ${
                      batchConfig.enabled
                        ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                        : 'bg-transparent text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                    }`}
                  >
                    {batchConfig.enabled ? '● BATCH ON' : 'BATCH MODE'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────── Ornamental section divider ─────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#111111]" />
            <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Terminal Scanner</span>
            <div className="flex-1 h-px bg-[#111111]" />
          </div>

          {/* ── Terminal QR Scanner ── */}
          <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
            <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
                    <QrCode className="h-4 w-4" strokeWidth={1.5} />
                    Terminal QR Scanner
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5 np-mono">
                    Generate QR code in terminal · scan with phone camera
                  </p>
                </div>
                <span className="bg-[#CC0000] text-[#F9F9F7] px-3 py-0.5 np-mono text-xs uppercase tracking-widest font-black">
                  RECOMMENDED
                </span>
              </div>
            </div>
            <div className="p-6">
              {auth.isAuthenticated ? (
                <TerminalQrScanner
                  onScanSuccess={(passData) => {
                    console.log('Terminal scan successful:', passData);
                    fetchQRCodes();
                    alert(`✅ Pass created successfully!\n\n📬 ${passData.title} has been added to your collection.`);
                  }}
                />
              ) : (
                <div className="bg-[#F9F9F7] border border-[#111111] p-6 text-center">
                  <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-black text-[#111111] mb-2 text-xs uppercase tracking-widest np-mono">Sign In Required</h4>
                  <p className="text-[#525252] mb-4 text-sm np-body">
                    Please sign in to use the Terminal QR Scanner
                  </p>
                  <button
                    onClick={() => navigate('/signin')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] np-focus"
                  >
                    <LogIn className="h-4 w-4" strokeWidth={1.5} />
                    SIGN IN NOW
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────── Ornamental section divider ─────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#111111]" />
            <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Manual Entry</span>
            <div className="flex-1 h-px bg-[#111111]" />
          </div>

          {/* ── Manual Entry Section ── */}
          <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
            <SectionHeader
              icon={<Edit3 className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
              title="Manual Entry — Create Card or Pass"
            />
            <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#111111]">
              <p className="text-xs text-[#737373] np-mono">Fill in the details below to generate a digital card with QR code</p>
            </div>
            <div className="p-6">
              <ManualEntryForm
                formData={formData}
                validationErrors={validationErrors}
                loading={loading}
                onFormChange={handleFormChange}
                onSave={saveNewCard}
              />
            </div>
          </div>

          {/* ── Protected Sections (cards, passes, QR detail, history) ── */}
          {auth.isAuthenticated ? (
            <>
              {cardsSection}
              {passesSection}
              {selectedCardSection}
              <ScanHistorySection />
            </>
          ) : (
            <AuthPrompt />
          )}

        </div>
      </FeatureTemplate>
      <Footer />
      <ScrollButton />
    </>
  );
};

export default QrScan;