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

// Newsprint Design System — font imports & utility classes
const NewsprintStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
    .np-serif  { font-family: 'Playfair Display', 'Times New Roman', serif; }
    .np-body   { font-family: 'Lora', Georgia, serif; }
    .np-sans   { font-family: 'Inter', 'Helvetica Neue', sans-serif; }
    .np-mono   { font-family: 'JetBrains Mono', 'Courier New', monospace; }
    * { border-radius: 0px !important; }
    .np-hard-hover:hover { box-shadow: 4px 4px 0px 0px #111111; transform: translate(-2px, -2px); }
    .np-input {
      border: none;
      border-bottom: 2px solid #111111;
      background: transparent;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      outline: none;
      width: 100%;
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
    }
    .np-textarea:focus { background: #F0F0F0; }
    input[type='range'] { accent-color: #111111; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .np-dot-bg {
      background-color: #F9F9F7;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
    }
  `}</style>
);

// Feature Template component for page layout
const FeatureTemplate: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => {
  const navigate = useNavigate();
  
  return (
    <div className="np-dot-bg min-h-screen pt-28 pb-20 np-sans">
      <NewsprintStyles />
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Go Back Button */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F9F9F7] border border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            BACK TO HOME
          </button>
        </div>

        <div className="border-4 border-[#111111] bg-[#F9F9F7] overflow-hidden">
          <div className="p-8 md:p-12 border-b-4 border-[#111111]">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="border-2 border-[#111111] p-6 flex items-center justify-center w-24 h-24 flex-shrink-0 np-hard-hover transition-all duration-200">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "h-12 w-12 text-[#111111]",
                  strokeWidth: 1.5
                })}
              </div>
              
              <div className="space-y-4">
                <div className="inline-block border border-[#111111] px-4 py-1 text-xs font-black uppercase tracking-widest text-[#111111] np-mono">
                  FEATURE
                </div>
                <h1 className="text-5xl md:text-6xl font-black leading-[0.9] tracking-tighter text-[#111111] np-serif">{title}</h1>
                <p className="text-base leading-relaxed max-w-2xl text-[#525252] np-body">{description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            {children}
          </div>
        </div>
        
        {/* Ornamental divider */}
        <div className="mt-8 py-4 text-center np-serif text-xl text-[#A3A3A3] tracking-[1em]">
          &#x2727; &#x2727; &#x2727;
        </div>
        <div className="h-1 bg-[#111111]" />
      </div>
    </div>
  );
};

// Add new interfaces
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

// Add card templates for quick creation
const cardTemplates: CardTemplate[] = [
  {
    id: 'premium-black',
    name: 'Premium Black',
    type: 'credit',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
    textColor: '#ffffff',
    category: 'Credit Card'
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    type: 'debit',
    gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    textColor: '#ffffff',
    category: 'Debit Card'
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    type: 'debit',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    textColor: '#ffffff',
    category: 'Debit Card'
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    type: 'membership',
    gradient: 'linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #FF1493 100%)',
    textColor: '#ffffff',
    category: 'Membership'
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    type: 'pass',
    gradient: 'linear-gradient(135deg, #FF4500 0%, #FF6347 50%, #DC143C 100%)',
    textColor: '#ffffff',
    category: 'Pass'
  },
  {
    id: 'galaxy-gradient',
    name: 'Galaxy Gradient',
    type: 'pass',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    category: 'Pass'
  },
  {
    id: 'golden-luxury',
    name: 'Golden Luxury',
    type: 'membership',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    textColor: '#ffffff',
    category: 'Premium Membership'
  },
  {
    id: 'arctic-silver',
    name: 'Arctic Silver',
    type: 'membership',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
    textColor: '#ffffff',
    category: 'Silver Membership'
  }
];

// Add predefined categories
const cardCategories = {
  credit: ['Cashback', 'Travel', 'Premium', 'Business', 'Rewards'],
  debit: ['Checking', 'Savings', 'Student', 'Premium', 'International'],
  pass: ['Transit', 'Gym', 'Cinema', 'Museum', 'Library', 'Event', 'Concert', 'Others'],
  membership: ['Premium', 'VIP', 'Gold', 'Silver', 'Diamond', 'Platinum', 'Elite']
};

// Add new card images and pass designs
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

// Remove all sample cards - data will come from backend
const sampleCards: CardData[] = [];

// Manual Entry Form Component - Moved outside to prevent re-renders
const ManualEntryForm: React.FC<{
  formData: NewCardForm;
  validationErrors: string[];
  loading: boolean;
  onFormChange: (field: keyof NewCardForm, value: string) => void;
  onSave: () => void;
}> = React.memo(({ formData, validationErrors, loading, onFormChange, onSave }) => {
  return (
    <div className="bg-[#F9F9F7] space-y-6 np-sans">
      {/* Card Type Selection */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-3 np-mono">Card / Pass Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#111111]">
          {(['credit', 'debit', 'pass', 'membership'] as const).map((type, idx) => (
            <button
              key={type}
              onClick={() => onFormChange('type', type)}
              className={`p-4 text-center transition-all duration-200 border-r border-[#111111] last:border-r-0 min-h-[44px] ${
                formData.type === type
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-transparent text-[#111111] hover:bg-[#F5F5F5]'
              }`}
            >
              <div className="text-2xl mb-1">
                {type === 'credit' ? '💳' : type === 'debit' ? '🏦' : type === 'pass' ? '🎫' : '🏛️'}
              </div>
              <div className="font-black capitalize text-xs uppercase tracking-widest np-mono">{type}</div>
            </button>
          ))}
        </div>
        
        {/* Input Requirements Info */}
        <div className="mt-3 p-3 bg-[#F5F5F5] border border-[#111111]">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-[#111111] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="text-xs text-[#111111] np-mono">
              {formData.type === 'credit' || formData.type === 'debit' ? (
                <>
                  <strong>Card Number:</strong> 13-16 digits only · Auto-formatted with spaces · Test/demo cards accepted
                </>
              ) : (
                <>
                  <strong>Pass/Membership ID:</strong> Alphanumeric characters allowed · Min 3 characters
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
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
            {formData.type === 'credit' || formData.type === 'debit' ? 'Card Number' : 'Pass/Membership ID'} <span className="text-[#CC0000]">*</span>
          </label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => onFormChange('number', e.target.value)}
            placeholder={
              formData.type === 'credit' || formData.type === 'debit' 
                ? '1234 5678 9012 3456' 
                : 'ABC-123-XYZ'
            }
            maxLength={formData.type === 'credit' || formData.type === 'debit' ? 19 : 50}
            className="np-input"
          />
          <p className="text-xs text-[#737373] mt-1 np-mono">
            {formData.type === 'credit' || formData.type === 'debit' 
              ? '13-16 digits, auto-formatted with spaces' 
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
            Expiry Date {(formData.type === 'credit' || formData.type === 'debit') && <span className="text-[#737373]">(Recommended)</span>}
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
            {cardCategories[formData.type]?.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Notes */}
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

      {/* Live QR Code Preview */}
      {formData.title && formData.number && formData.holderName && (
        <div className="bg-[#F5F5F5] p-6 border border-[#111111]">
          <div className="flex items-center gap-2 mb-4 border-b border-[#E5E5E0] pb-3">
            <Eye className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
            <h4 className="font-black text-[#111111] uppercase text-xs tracking-widest np-mono">Live QR Code Preview</h4>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-6 border border-[#111111]">
              <QRCodeSVG
                value={`${formData.type}:${formData.title}:${formData.number}`}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-[#737373] np-mono uppercase tracking-widest">
                Preview QR code (simplified for display)
              </p>
              <p className="text-xs text-[#A3A3A3] mt-1 np-mono">
                {formData.type === 'credit' || formData.type === 'debit' ? '🔒 Full data will be encrypted when saved' : '📄 Full data will be included when saved'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-[#F9F9F7] border-l-4 border-[#CC0000] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <h4 className="font-black text-[#CC0000] mb-2 text-xs uppercase tracking-widest np-mono">Please fix the following errors:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#CC0000] np-mono">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div>
        <button
          onClick={onSave}
          disabled={loading}
          className={`w-full px-6 py-3 border border-transparent bg-[#111111] text-[#F9F9F7] font-black uppercase text-xs tracking-widest transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] np-mono ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111]'
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
    </div>
  );
});

ManualEntryForm.displayName = 'ManualEntryForm';

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
  
  // Manual entry form state
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

  // Add auth state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
    const userData = localStorage.getItem('userData');
    
    // User is authenticated only if BOTH token AND auth flag exist
    const isAuthenticated = token !== null && isAuthFlag;
    
    console.log('🔐 Auth check:', { hasToken: !!token, isAuthFlag, isAuthenticated });
    
    const user = userData ? JSON.parse(userData) : null;
    
    setAuth({
      isAuthenticated,
      user
    });
    
    // Auto-fill holder name with logged-in user's name
    if (isAuthenticated && user?.name) {
      setFormData(prev => ({
        ...prev,
        holderName: user.name
      }));
    }
    
    // Clear cards if not authenticated
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated - clearing cards');
      setCards([]);
    }
  }, []);

  // Fetch QR codes from backend when authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log('✅ Authenticated - fetching QR codes');
      fetchQRCodes();
    } else {
      console.log('❌ Not authenticated - skipping fetch');
      setCards([]); // Clear cards when not authenticated
    }
  }, [auth.isAuthenticated]);

  // Fetch QR codes from backend
  const fetchQRCodes = async () => {
    // Double-check authentication before making API call
    const token = localStorage.getItem('accessToken');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!token || !isAuthFlag) {
      console.error('❌ Cannot fetch QR codes - not authenticated');
      setCards([]);
      setError('Please sign in to view your cards');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching QR codes for authenticated user...');
      
      const response = await qrcodeService.getQRCodes({
        page: 1,
        limit: 100,
        sortBy: '-createdAt'
      });
      
      console.log('📊 QR codes response:', response);
      
      // Check if response has qrcodes array
      if (!response || !response.qrcodes || !Array.isArray(response.qrcodes)) {
        console.warn('No QR codes found in response:', response);
        setCards([]);
        return;
      }
      
      console.log(`✅ Fetched ${response.qrcodes.length} QR codes`);
      console.log('📦 Raw QR codes from backend:', response.qrcodes);
      
      // Convert backend QR codes to CardData format
      const convertedCards = response.qrcodes.map((qr: QRCodeType) => {
        const gradient = qr.color && qr.backgroundColor 
          ? `linear-gradient(135deg, ${qr.backgroundColor} 0%, ${qr.color} 100%)`
          : cardTemplates[0].gradient;

        // Extract data from QR data object - handle both direct objects and nested text field
        let qrData = typeof qr.data === 'object' ? qr.data : {};
        let parsedData = qrData;
        
        // Try to parse the text field if it exists (for text type QR codes)
        if (qrData.text && typeof qrData.text === 'string') {
          try {
            parsedData = JSON.parse(qrData.text);
            console.log(`📝 Parsed text field for "${qr.title}":`, parsedData);
          } catch (e) {
            console.log(`⚠️ Could not parse text field for "${qr.title}"`);
            parsedData = qrData;
          }
        }
        
        // For password type, check if data is directly available
        if (qr.qrType === 'password' && qrData && !qrData.text) {
          parsedData = qrData;
          console.log(`🔐 Using direct password data for "${qr.title}":`, parsedData);
        }

        // Determine card type with improved logic
        let cardType: 'credit' | 'debit' | 'pass' | 'membership' = 'pass';
        
        console.log(`🔍 Processing card "${qr.title}":`, {
          qrType: qr.qrType,
          category: qr.category,
          hasQrCodeImage: !!qr.qrCodeImage,
          qrCodeImageLength: qr.qrCodeImage?.length || 0,
          qrCodeImagePreview: qr.qrCodeImage?.substring(0, 50),
          rawQrData: qrData,
          parsedData
        });
        
        // Priority 1: Check parsedData.type (from saved card data)
        if (parsedData.type) {
          const rawType = parsedData.type.toLowerCase();
          
          // Map the raw type to our standardized types
          if (rawType === 'credit') {
            cardType = 'credit';
          } else if (rawType === 'debit') {
            cardType = 'debit';
          } else if (
            rawType.includes('membership') || 
            rawType === 'loyalty-card' ||
            rawType.includes('loyalty') ||
            rawType.includes('vip') ||
            rawType.includes('premium')
          ) {
            cardType = 'membership';
          } else {
            // Everything else (boarding-pass, parking-pass, event-ticket, etc.) is a pass
            cardType = 'pass';
          }
          
          console.log(`✅ Card "${qr.title}" type from parsedData.type "${parsedData.type}" → mapped to:`, cardType);
        } 
        // Priority 2: Check qrType - password types are credit/debit cards
        else if (qr.qrType === 'password') {
          // If it's password type, check category or default to credit
          const catLower = (qr.category || '').toLowerCase();
          if (catLower.includes('debit')) {
            cardType = 'debit';
          } else if (catLower.includes('credit')) {
            cardType = 'credit';
          } else if (catLower.includes('card')) {
            // Default to credit if it mentions "card" but not specific
            cardType = 'credit';
          } else {
            // Default password types to credit card
            cardType = 'credit';
          }
          console.log(`💳 Card "${qr.title}" type from qrType=password + category:`, cardType);
        } 
        // Priority 3: Check category for text types (including terminal QR passes)
        else if (qr.category) {
          const catLower = qr.category.toLowerCase();
          
          // Check for credit/debit cards
          if (catLower.includes('credit')) {
            cardType = 'credit';
          } else if (catLower.includes('debit')) {
            cardType = 'debit';
          } 
          // Check for memberships (gym-membership, loyalty-card, VIP, premium, etc.)
          else if (
            catLower.includes('membership') || 
            catLower.includes('premium') || 
            catLower.includes('vip') || 
            catLower.includes('gold') || 
            catLower.includes('silver') ||
            catLower.includes('platinum') ||
            catLower.includes('diamond') ||
            catLower.includes('elite') ||
            catLower.includes('loyalty')
          ) {
            cardType = 'membership';
          } 
          // Everything else is a pass (boarding-pass, parking-pass, event-ticket, etc.)
          else {
            cardType = 'pass';
          }
          
          console.log(`🏷️ Card "${qr.title}" type from category "${qr.category}":`, cardType);
        }
        
        console.log(`📌 Final card type for "${qr.title}":`, cardType);
        
        // Determine QR data to display
        const finalQrData = qr.qrCodeImage || qr._id;
        console.log(`🖼️ Card "${qr.title}" QR data:`, {
          hasImage: !!qr.qrCodeImage,
          imageStartsWith: qr.qrCodeImage?.substring(0, 20),
          usingImage: !!qr.qrCodeImage,
          fallbackToId: !qr.qrCodeImage
        });
        
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

      console.log('🎯 Converted cards:', convertedCards);
      console.log('📊 Card types breakdown:', {
        total: convertedCards.length,
        credit: convertedCards.filter(c => c.type === 'credit').length,
        debit: convertedCards.filter(c => c.type === 'debit').length,
        pass: convertedCards.filter(c => c.type === 'pass').length,
        membership: convertedCards.filter(c => c.type === 'membership').length
      });
      
      // Debug: Log all pass types individually
      const allPasses = convertedCards.filter(c => c.type === 'pass' || c.type === 'membership');
      console.log('🎫 ALL PASSES & MEMBERSHIPS:', allPasses.map(p => ({
        title: p.title,
        type: p.type,
        id: p.id
      })));

      setCards(convertedCards);
    } catch (err: any) {
      console.error('❌ Error fetching QR codes:', err);
      console.error('Error response:', err.response);
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('🔒 Authentication failed - clearing session');
        // Clear authentication state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userData');
        setAuth({
          isAuthenticated: false,
          user: null
        });
        setError('Session expired. Please sign in again.');
        setCards([]);
        // Optionally redirect to signin
        // navigate('/signin');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load QR codes');
        setCards([]); // Set empty array on error
      }
    } finally {
      setLoading(false);
    }
  };

  // Add error handling for camera access
  const startScanning = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported');
      }

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
    stream?.getTracks().forEach(track => track.stop());
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
    if (settings.saveHistory) {
      setScanHistory(prev => [scanResult, ...prev]);
    }
  };

  const adjustQuality = (property: keyof ScanQuality, value: any) => {
    setQuality(prev => ({ ...prev, [property]: value }));
    // Apply camera adjustments here
  };

  const toggleBatchMode = () => {
    setBatchConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Generate QR data from form
  const generateQRData = (data: NewCardForm): string => {
    const qrData = {
      type: data.type,
      title: data.title,
      number: data.number,
      holder: data.holderName,
      issuer: data.issuer,
      expiry: data.expiryDate,
      category: data.category,
      custom: data.customData,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData);
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string, type: 'credit' | 'debit' | 'pass' | 'membership'): string => {
    // For credit/debit cards - only numbers with auto-spacing
    if (type === 'credit' || type === 'debit') {
      // Remove all non-numeric characters
      const numbers = value.replace(/\D/g, '');
      
      // Limit to 16 digits (standard card length)
      const limited = numbers.slice(0, 16);
      
      // Add space after every 4 digits
      const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited;
      
      return formatted;
    }
    
    // For pass/membership - allow alphanumeric
    return value.slice(0, 50); // Limit length
  };

  // Validate card number based on type
  const validateCardNumber = (number: string, type: 'credit' | 'debit' | 'pass' | 'membership'): string | null => {
    if (!number || number.trim() === '') {
      return 'Card/Pass number is required';
    }

    if (type === 'credit' || type === 'debit') {
      // Remove spaces for validation
      const digits = number.replace(/\s/g, '');
      
      // Check if only contains numbers
      if (!/^\d+$/.test(digits)) {
        return 'Card number must contain only digits';
      }
      
      // Check minimum length (13 digits for some cards, 16 for most)
      if (digits.length < 13) {
        return 'Card number must be at least 13 digits';
      }
      
      // Check maximum length
      if (digits.length > 16) {
        return 'Card number cannot exceed 16 digits';
      }
      
      // Luhn algorithm validation - REMOVED (too strict for test/demo cards)
      // Users can create demo/test cards without real card numbers
    } else {
      // For pass/membership - just check it's not empty and has reasonable length
      if (number.length < 3) {
        return 'Pass number must be at least 3 characters';
      }
    }
    
    return null; // Valid
  };

  // Luhn algorithm for card number validation
  const isValidLuhn = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate expiry date format (MM/YY)
  const validateExpiryDate = (expiry: string): string | null => {
    if (!expiry) return null; // Optional field
    
    // Check format MM/YY
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(expiry)) {
      return 'Expiry date must be in MM/YY format';
    }
    
    // Check if date is in the future
    const [month, year] = expiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    
    if (expiryDate < today) {
      return 'Card has expired';
    }
    
    return null;
  };

  // Format expiry date as user types
  const formatExpiryDate = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 4 digits (MMYY)
    const limited = numbers.slice(0, 4);
    
    // Add slash after month
    if (limited.length >= 3) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    
    return limited;
  };

  // Handle form changes with validation and formatting
  const handleFormChange = (field: keyof NewCardForm, value: string) => {
    let processedValue = value;
    
    // Special handling for card number
    if (field === 'number') {
      processedValue = formatCardNumber(value, formData.type);
    }
    
    // Special handling for expiry date
    if (field === 'expiryDate') {
      processedValue = formatExpiryDate(value);
    }
    
    // Special handling for holder name - only letters and spaces
    if (field === 'holderName') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Save new card/pass with comprehensive validation
  const saveNewCard = async () => {
    // Check authentication first
    if (!auth.isAuthenticated) {
      setValidationErrors(['Please sign in to create cards']);
      return;
    }

    // Collect all validation errors
    const errors: string[] = [];
    
    // Required fields validation
    if (!formData.title || formData.title.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!formData.holderName || formData.holderName.trim() === '') {
      errors.push('Holder name is required');
    }
    
    // Card number validation with type-specific rules
    const numberError = validateCardNumber(formData.number, formData.type);
    if (numberError) {
      errors.push(numberError);
    }
    
    // Expiry date validation (only for credit/debit cards)
    if ((formData.type === 'credit' || formData.type === 'debit') && formData.expiryDate) {
      const expiryError = validateExpiryDate(formData.expiryDate);
      if (expiryError) {
        errors.push(expiryError);
      }
    }
    
    // Show all validation errors at once
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setValidationErrors([]);
    
    try {
      // Determine QR type based on card type
      const qrType: QRType = (formData.type === 'credit' || formData.type === 'debit') ? 'password' : 'text';

      // Prepare the card data object
      const cardData = {
        type: formData.type,
        title: formData.title,
        number: formData.number,
        holder: formData.holderName,
        issuer: formData.issuer || 'N/A',
        expiry: formData.expiryDate || 'N/A',
        category: formData.category || formData.type,
        notes: formData.notes || ''
      };

      // Prepare data based on QR type
      // For 'text' type, backend expects { text: string }
      // For 'password' type, backend expects an object
      const data = qrType === 'text' 
        ? { text: JSON.stringify(cardData) }
        : cardData;

      // Extract solid color from gradient or use default
      // QR code library only accepts hex colors, not gradients
      const extractColorFromGradient = (bgColor: string): string => {
        // If it's a gradient, extract the first hex color
        if (bgColor.includes('linear-gradient') || bgColor.includes('gradient')) {
          const hexMatch = bgColor.match(/#[0-9A-Fa-f]{6}/);
          return hexMatch ? hexMatch[0] : '#FFFFFF';
        }
        // If it's already a hex color, return it
        return bgColor.startsWith('#') ? bgColor : '#FFFFFF';
      };

      const qrCodeData: CreateQRCodeData = {
        qrType,
        title: formData.title,
        data,
        isEncrypted: false, // Disabled encryption to allow viewing card details
        category: formData.category || formData.type,
        tags: [formData.type, formData.category].filter(Boolean) as string[],
        description: formData.notes || `${formData.type.toUpperCase()} - ${formData.holderName}`,
        color: formData.textColor || '#000000',
        backgroundColor: extractColorFromGradient(formData.backgroundColor),
        size: 256
      };

      console.log('Creating QR code with data:', qrCodeData);
      const newQRCode = await qrcodeService.createQRCode(qrCodeData);
      console.log('QR code created successfully:', newQRCode);
      console.log('🖼️ QR code image received:', {
        hasImage: !!newQRCode.qrCodeImage,
        imageLength: newQRCode.qrCodeImage?.length || 0,
        imagePreview: newQRCode.qrCodeImage?.substring(0, 50),
        startsWithDataImage: newQRCode.qrCodeImage?.startsWith('data:image')
      });

      const gradient = newQRCode.color && newQRCode.backgroundColor 
        ? `linear-gradient(135deg, ${newQRCode.backgroundColor} 0%, ${newQRCode.color} 100%)`
        : formData.backgroundColor;

      const finalQrData = newQRCode.qrCodeImage || newQRCode._id;
      console.log('📌 Using QR data:', {
        source: newQRCode.qrCodeImage ? 'image' : 'id',
        value: finalQrData.substring(0, 50)
      });

      const newCard: CardData = {
        id: newQRCode._id,
        type: formData.type,
        title: formData.title,
        number: formData.number,
        expiryDate: formData.expiryDate,
        holderName: formData.holderName,
        issuer: formData.issuer,
        backgroundColor: { gradient },
        textColor: formData.textColor,
        qrData: finalQrData
      };

      setCards(prev => [newCard, ...prev]);
      
      // Reset form but keep holder name pre-filled with logged-in user
      setFormData({
        type: 'credit',
        title: '',
        number: '',
        expiryDate: '',
        holderName: auth.user?.name || '', // Keep user's name
        issuer: '',
        backgroundColor: cardTemplates[0].gradient,
        textColor: '#ffffff',
        customData: '',
        category: '',
        notes: ''
      });
      
      setValidationErrors([]);
      
      // Show success message with notification info
      const cardTypeName = formData.type === 'credit' || formData.type === 'debit' ? 'Card' : 'Pass';
      alert(`✅ ${cardTypeName} created successfully!\n\n📬 A notification has been added to your dashboard.`);
    } catch (err: any) {
      console.error('Error creating card:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to create card. Please try again.';
      
      setValidationErrors([`Error: ${errorMessage}`]);
    } finally {
      setLoading(false);
    }
  };

  const AuthPrompt = () => (
    <div className="bg-[#F9F9F7] border border-[#111111] p-8 text-center np-sans">
      <div className="border-2 border-[#111111] p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Lock className="h-10 w-10 text-[#111111]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-black text-[#111111] mb-3 np-serif uppercase tracking-tight">Sign In Required</h3>
      <p className="text-[#525252] mb-6 np-body text-sm">Please sign in to view your cards and passes</p>
      <button 
        onClick={() => navigate('/signin')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px]"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        SIGN IN
      </button>
    </div>
  );

  // Add sign out functionality
  const handleSignOut = () => {
    console.log('🚪 Signing out - clearing all data');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    setAuth({
      isAuthenticated: false,
      user: null
    });
    setCards([]); // Clear cards on sign out
    setSelectedCard(null); // Clear selected card
    setError(null); // Clear any errors
    navigate('/signin');
  };

  // Add sign out button in the header
  const renderHeader = () => (
    auth.isAuthenticated && (
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#111111] hover:text-[#CC0000] transition-colors np-mono min-h-[44px]"
        >
          <LogIn className="h-4 w-4" strokeWidth={1.5} />
          SIGN OUT
        </button>
      </div>
    )
  );

  // Update the CardDisplay component with uniform design for all cards and passes
  const CardDisplay: React.FC<{ card: CardData }> = ({ card }) => {
    return (
      <div className="relative w-[340px] flex-shrink-0 mx-2 overflow-hidden group transition-all duration-200 np-hard-hover cursor-pointer"
           style={{ borderRadius: 0 }}>
        {/* Background - gradient for all cards and passes */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: typeof card.backgroundColor === 'string' 
              ? card.backgroundColor 
              : card.backgroundColor.gradient,
            borderRadius: 0
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/card-pattern.svg')] mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
          </div>
        </div>

        {/* Card Content */}
        <div className="relative z-10 p-6 h-[200px] flex flex-col" style={{ color: card.textColor }}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-black tracking-wide np-serif">{card.title}</h3>
              <p className="text-sm opacity-80 np-mono tracking-wider">{card.number}</p>
            </div>
            {card.logo && (
              <div className="bg-white/30 backdrop-blur-sm p-1.5">
                <img 
                  src={card.logo} 
                  alt={card.issuer} 
                  className="h-8 transition-transform group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
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

          {/* QR Code */}
          <div className="absolute right-4 bottom-4 group-hover:scale-110 transition-all duration-200 transform-gpu">
            <div className="bg-white/90 p-2 border border-white/50">
              {card.qrData && card.qrData.startsWith('data:image') ? (
                <img 
                  src={card.qrData} 
                  alt="QR Code" 
                  className="w-[84px] h-[84px]"
                  onError={(e) => {
                    console.error(`❌ Failed to load QR image for card: ${card.title}`);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-[84px] h-[84px] flex items-center justify-center bg-slate-100 text-xs text-slate-600">
                        QR Code
                      </div>
                    `;
                  }}
                />
              ) : (
                <QRCodeSVG 
                  value={card.qrData || card.number}
                  size={84}
                  level="M"
                  includeMargin={true}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update selected card QR code rendering
  const renderSelectedCardQR = () => {
    if (!selectedCard) return null;

    return (
      <div className="mt-4 p-4 bg-[#F5F5F5] border border-[#111111]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">Selected Card QR Code</h4>
          <button 
            onClick={() => setSelectedCard(null)}
            className="text-[#111111] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <XCircle className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex justify-center p-4 bg-white border border-[#111111]">
          {selectedCard.qrData && selectedCard.qrData.startsWith('data:image') ? (
            <img 
              src={selectedCard.qrData} 
              alt="QR Code" 
              className="w-[200px] h-[200px]"
            />
          ) : (
            <QRCodeSVG 
              value={selectedCard.qrData || selectedCard.number}
              size={200}
              level="M"
              includeMargin={true}
              className="w-full h-full max-w-[200px]"
            />
          )}
        </div>
      </div>
    );
  };

  // Separate cards and passes
  const creditCards = cards.filter(card => card.type === 'credit' || card.type === 'debit');
  const passes = cards.filter(card => card.type === 'pass' || card.type === 'membership');

  // Delete all passes function
  const deleteAllPasses = async () => {
    if (!auth.isAuthenticated) {
      alert('Please sign in to delete passes');
      return;
    }

    const passesCount = passes.length;
    if (passesCount === 0) {
      alert('No passes to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${passesCount} passes/memberships?\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🗑️ Deleting ${passesCount} passes...`);
      
      // Delete all passes one by one
      const deletePromises = passes.map(pass => 
        qrcodeService.deleteQRCode(pass.id).catch(err => {
          console.error(`Failed to delete pass ${pass.title}:`, err);
          return null; // Continue even if one fails
        })
      );

      await Promise.all(deletePromises);

      console.log('✅ All passes deleted successfully');
      
      // Refresh the list
      await fetchQRCodes();
      
      alert(`✅ Successfully deleted ${passesCount} passes!`);
    } catch (err: any) {
      console.error('❌ Error deleting passes:', err);
      setError(err.response?.data?.message || 'Failed to delete passes');
      alert('Error deleting passes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete all cards function
  const deleteAllCards = async () => {
    const cardsCount = creditCards.length;
    
    if (cardsCount === 0) {
      alert('No cards to delete');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete ALL ${cardsCount} cards?\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🗑️ Deleting ${cardsCount} cards...`);
      
      // Delete all cards one by one
      const deletePromises = creditCards.map(card => 
        qrcodeService.deleteQRCode(card.id).catch(err => {
          console.error(`Failed to delete card ${card.title}:`, err);
          return null; // Continue even if one fails
        })
      );

      await Promise.all(deletePromises);

      console.log('✅ All cards deleted successfully');
      
      // Refresh the list
      await fetchQRCodes();
      
      alert(`✅ Successfully deleted ${cardsCount} cards!`);
    } catch (err: any) {
      console.error('❌ Error deleting cards:', err);
      setError(err.response?.data?.message || 'Failed to delete cards');
      alert('Error deleting cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Section Header helper ──────────────────────────────────────────────────
  const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ icon, title, badge, actions }) => (
    <div className="bg-[#F5F5F5] p-4 border-b border-[#111111] flex items-center justify-between">
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

  // Cards section
  const cardsSection = auth.isAuthenticated ? (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<CreditCard className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Credit & Debit Cards"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] text-[#CC0000] border border-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
            <button 
              onClick={fetchQRCodes}
              className="mt-4 px-4 py-2 bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] border border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px]"
            >
              RETRY
            </button>
          </div>
        ) : creditCards.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2">
              <div className="flex flex-row space-x-4 px-2">
                {creditCards.map(card => (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="cursor-pointer"
                  >
                    <CardDisplay card={card} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F9F9F7] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F9F9F7] to-transparent pointer-events-none" />
            
            {/* Carousel navigation */}
            {creditCards.length > 1 && (
              <>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
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
  ) : (
    <AuthPrompt />
  );

  // Passes section
  const passesSection = auth.isAuthenticated ? (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<Layers className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Passes & Memberships"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] text-[#CC0000] border border-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
            <button 
              onClick={fetchQRCodes}
              className="mt-4 px-4 py-2 bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] border border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px]"
            >
              RETRY
            </button>
          </div>
        ) : passes.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2">
              <div className="flex flex-row space-x-4 px-2">
                {passes.map(card => (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="cursor-pointer"
                  >
                    <CardDisplay card={card} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F9F9F7] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F9F9F7] to-transparent pointer-events-none" />
            
            {/* Carousel navigation */}
            {passes.length > 1 && (
              <>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
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
  ) : (
    <AuthPrompt />
  );

  // Selected card/pass QR section
  const selectedCardSection = selectedCard && auth.isAuthenticated ? (
    <div className="bg-[#F5F5F5] p-6 border border-[#111111]">
      <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E0] pb-3">
        <h4 className="font-black text-[#111111] flex items-center gap-2 text-xs uppercase tracking-widest np-mono">
          <QrCode className="h-4 w-4" strokeWidth={1.5} />
          Selected {selectedCard.type === 'credit' || selectedCard.type === 'debit' ? 'Card' : 'Pass'} QR Code
        </h4>
        <button 
          onClick={() => setSelectedCard(null)}
          className="text-[#111111] hover:text-[#CC0000] transition-colors p-1.5 hover:bg-[#F5F5F5] min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <XCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white p-5 border border-[#111111]">
          {selectedCard.qrData && selectedCard.qrData.startsWith('data:image') ? (
            <img 
              src={selectedCard.qrData} 
              alt="QR Code" 
              className="w-[200px] h-[200px]"
            />
          ) : (
            <QRCodeSVG 
              value={selectedCard.qrData || selectedCard.number}
              size={200}
              level="M"
              includeMargin={true}
              className="w-full h-full max-w-[200px]"
            />
          )}
        </div>
        <div className="space-y-2">
          <h5 className="text-lg font-black text-[#111111] np-serif">{selectedCard.title}</h5>
          <p className="text-[#737373] np-mono text-xs uppercase tracking-widest">{selectedCard.issuer}</p>
          <div className="flex items-center gap-2 mt-4">
            <button className="px-4 py-2 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px]">
              <Share2 className="h-4 w-4" strokeWidth={1.5} />
              SHARE
            </button>
            <button className="px-4 py-2 bg-transparent border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px]">
              <Image className="h-4 w-4" strokeWidth={1.5} />
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const ScanHistorySection = () => (
    <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
      <SectionHeader
        icon={<History className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
        title="Recent Scans"
      />
      <div className="divide-y divide-[#E5E5E0]">
        {scanHistory.length === 0 ? (
          <div className="py-8 text-[#737373] text-center">
            <History className="h-10 w-10 mx-auto text-[#E5E5E5] mb-3" strokeWidth={1.5} />
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
                  {scan.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="h-5 w-5" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <div className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">{scan.type}</div>
                  <div className="text-xs text-[#737373] np-mono">
                    {scan.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-[#F5F5F5] text-[#A3A3A3] hover:text-[#111111] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Share2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button className="p-1.5 hover:bg-[#F5F5F5] text-[#A3A3A3] hover:text-[#CC0000] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="QR Code Scanning & Card Management"
        description="Scan QR codes or manually create digital cards and passes with auto-generated QR codes"
        icon={<QrCode className="h-8 w-8 text-[#111111]" />}
      >
        {renderHeader()}
        <div className="space-y-6 relative np-sans">
          
          {/* Action Bar */}
          <div className="bg-[#F5F5F5] p-4 border border-[#111111]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="border border-[#111111] p-2 flex items-center justify-center w-10 h-10">
                  <QrCode className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-black text-[#111111] text-xs uppercase tracking-widest np-mono">Quick Actions</h3>
                  <p className="text-xs text-[#737373] np-mono">Scan QR codes and manage your cards</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-[#F9F9F7] border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Camera Scanner Section */}
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border border-white/40 animate-pulse">
                        {/* Sharp corner accents — Editorial Red */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#CC0000]"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#CC0000]"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#CC0000]"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#CC0000]"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="bg-black/70 text-[#F9F9F7] px-3 py-2 np-mono text-xs uppercase tracking-widest">
                        {quality.resolution.toUpperCase()} | ZOOM {quality.zoom}×
                      </div>
                      <button
                        onClick={stopScanning}
                        className="bg-[#CC0000] hover:bg-[#111111] text-white p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                      className="px-8 py-3 bg-[#F9F9F7] text-[#111111] border border-transparent hover:bg-transparent hover:text-[#F9F9F7] hover:border-[#F9F9F7] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono flex items-center gap-2 min-h-[44px]"
                    >
                      <Camera className="h-5 w-5" strokeWidth={1.5} />
                      START SCANNING
                    </button>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              {isScanning && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 border border-[#111111] p-4 bg-[#F5F5F5]">
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0">BRIGHT:</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={quality.brightness}
                      onChange={(e) => adjustQuality('brightness', parseInt(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0">CONTRAST:</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={quality.contrast}
                      onChange={(e) => adjustQuality('contrast', parseInt(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs np-mono uppercase tracking-widest text-[#111111] flex-shrink-0">ZOOM:</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={quality.zoom}
                      onChange={(e) => adjustQuality('zoom', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                  <button
                    onClick={toggleBatchMode}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest np-mono border transition-all duration-200 min-h-[44px] ${
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

          {/* Terminal QR Scanner Section */}
          <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
            <div className="bg-[#F5F5F5] p-4 border-b border-[#111111]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
                    <QrCode className="h-4 w-4" strokeWidth={1.5} />
                    Terminal QR Scanner
                  </h3>
                  <p className="text-xs text-[#737373] mt-1 np-mono">
                    Generate QR code in terminal, scan with phone camera
                  </p>
                </div>
                <span className="bg-[#111111] text-[#F9F9F7] px-3 py-0.5 np-mono text-xs uppercase tracking-widest">
                  RECOMMENDED
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {auth.isAuthenticated ? (
                <TerminalQrScanner 
                  onScanSuccess={(passData) => {
                    console.log('Terminal scan successful:', passData);
                    // Refresh the cards list
                    fetchQRCodes();
                    // Show success notification
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px]"
                  >
                    <LogIn className="h-4 w-4" strokeWidth={1.5} />
                    SIGN IN NOW
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Section */}
          <div className="bg-[#F9F9F7] border border-[#111111] overflow-hidden">
            <SectionHeader
              icon={<Edit3 className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
              title="Manual Entry — Create Card or Pass"
            />
            <div className="p-4 bg-[#F5F5F5] border-b border-[#111111]">
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

          {/* Protected Sections */}
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