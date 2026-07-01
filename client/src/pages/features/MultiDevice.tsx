import React, { useState, useEffect } from 'react';
import {
  Smartphone, Laptop, Monitor, Tablet,
  Plus, AlertCircle, Activity, SignalHigh,
  MonitorSmartphone, Power, Trash2,
  Shield,
  Tag,
  Users,
  Lock,
  Settings2,
  RefreshCw,
  LogIn,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ScrollButton from '../../components/ScrollButton';
import deviceService from '../../services/deviceService';
import syncService from '../../services/syncService';

// ─── Newsprint Design System ─────────────────────────────────────────────────
// Font imports + utility classes enforcing the print-press aesthetic.
// The global `* { border-radius: 0 }` rule nukes every rounded corner in the
// subtree — no per-element overrides needed.
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

    /* Fine graph-paper line grid for inverted/heavy sections */
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

    /* Form fields — bottom-border only, monospace */
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
      color: #111111;
    }
    .np-input:focus { background: #F0F0F0; }
    .np-input::placeholder { color: #A3A3A3; }
    .np-input:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Focus ring for keyboard nav */
    .np-focus:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px #F9F9F7, 0 0 0 4px #111111;
    }

    /* Animated loading sweep */
    @keyframes np-sweep {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }
    .np-loading-sweep::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 25%;
      background: #111111;
      animation: np-sweep 1.1s ease-in-out infinite;
    }
  `}</style>
);

// ─── SectionHeader ─────────────────────────────────────────────────────────────
// Reusable panel header: flat grey bar with icon, label, optional action slot.
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}> = ({ icon, title, action }) => (
  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#111111] flex items-center justify-between">
    <h3 className="font-black flex items-center gap-2 text-[#111111] text-xs uppercase tracking-widest np-mono">
      {icon}
      {title}
    </h3>
    {action}
  </div>
);

// ─── FeatureTemplate ──────────────────────────────────────────────────────────
// Page-level wrapper: newsprint masthead, bordered container, ornamental footer.
// Matches the pattern established in QrScan.tsx exactly.
// ─────────────────────────────────────────────────────────────────────────────
interface FeatureTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  edition?: string;
  children: React.ReactNode;
}

const FeatureTemplate: React.FC<FeatureTemplateProps> = ({
  title, description, icon, edition, children
}) => {
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
              {edition ?? 'DEVICE MANAGEMENT EDITION'}
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
interface Device {
  id: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'laptop' | 'desktop';
  lastActive: Date;
  status: 'online' | 'offline' | 'idle';
  browser?: string;
  os?: string;
  isCurrentDevice: boolean;
}

interface DeviceGroup {
  id: string;
  name: string;
  devices: string[];
}

interface DevicePermission {
  canSync: boolean;
  canShare: boolean;
  canModify: boolean;
  requiresVerification: boolean;
}

// ─── AuthPrompt ───────────────────────────────────────────────────────────────
// Unauthenticated state — lock icon, sign-in CTA in newsprint style.
// ─────────────────────────────────────────────────────────────────────────────
const AuthPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="border border-[#111111] bg-[#F9F9F7] p-8 text-center">
      <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mx-auto mb-6">
        <Lock className="h-8 w-8 text-[#111111]" strokeWidth={1.5} />
      </div>
      <h3 className="font-black text-[#111111] mb-2 text-xs uppercase tracking-widest np-mono">
        Sign In Required
      </h3>
      <p className="text-[#525252] mb-6 text-sm np-body">
        Please sign in to manage your devices
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

// ─── MultiDevice ──────────────────────────────────────────────────────────────
const MultiDevice = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceLimit] = useState(5);
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    online: 0,
    offline: 0
  });
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [devicePermissions, setDevicePermissions] = useState<Record<string, DevicePermission>>({});

  // New state for device registration
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDeviceId, setVerificationDeviceId] = useState<string | null>(null);
  const [verificationDeviceName, setVerificationDeviceName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartphone': return <Smartphone className="h-4 w-4" strokeWidth={1.5} />;
      case 'tablet':     return <Tablet     className="h-4 w-4" strokeWidth={1.5} />;
      case 'laptop':     return <Laptop     className="h-4 w-4" strokeWidth={1.5} />;
      case 'desktop':    return <Monitor    className="h-4 w-4" strokeWidth={1.5} />;
      default:           return <MonitorSmartphone className="h-4 w-4" strokeWidth={1.5} />;
    }
  };

  useEffect(() => {
    const checkAuthAndLoadDevices = async () => {
      // Check auth status
      const token = localStorage.getItem('accessToken');
      const authStatus = !!token;
      setIsAuthenticated(authStatus);

      console.log('🔐 Auth Status:', authStatus);
      console.log('🎫 Token exists:', !!token);

      if (authStatus) {
        try {
          setDataLoading(true);

          console.log('📡 Fetching devices from API...');
          // Fetch devices from API
          const devicesResponse = await deviceService.getDevices();

          console.log('✅ Devices response:', devicesResponse);

          // Map API devices to component format
          const mappedDevices: Device[] = devicesResponse.devices.map((device: any) => ({
            id: device._id,
            name: device.deviceName,
            type: device.deviceType === 'mobile' ? 'smartphone' : device.deviceType,
            lastActive: new Date(device.lastActiveAt),
            status: device.status === 'syncing' ? 'idle' : device.status,
            browser: device.browser,
            os: device.operatingSystem,
            isCurrentDevice: device.isPrimary
          }));

          console.log('📱 Mapped devices:', mappedDevices);
          setDevices(mappedDevices);

          // Set device stats
          setDeviceStats({
            total: devicesResponse.stats.total,
            online: devicesResponse.stats.online,
            offline: devicesResponse.stats.offline
          });
          console.log('📊 Device stats:', devicesResponse.stats);

          // Fetch device statistics for additional info
          const stats = await deviceService.getDeviceStats();
          console.log('📈 Additional stats:', stats);

          // Initialize device permissions from API data
          const permissions: Record<string, DevicePermission> = {};
          devicesResponse.devices.forEach((device: any) => {
            permissions[device._id] = {
              canSync: device.syncEnabled,
              canShare: device.isTrusted,
              canModify: device.isTrusted,
              requiresVerification: !device.isVerified
            };
          });
          setDevicePermissions(permissions);

          setLoading(false);
          setDataLoading(false);
        } catch (err: any) {
          console.error('❌ Failed to load devices:', err);
          console.error('❌ Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          });
          setError(err.response?.data?.message || 'Failed to load devices');
          setLoading(false);
          setDataLoading(false);
        }
      } else {
        setLoading(false);
        setDataLoading(false);
      }
    };

    checkAuthAndLoadDevices();
  }, []);

  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to remove this device? This action cannot be undone.')) {
      return;
    }

    try {
      const device = devices.find(d => d.id === deviceId);
      const deviceName = device?.name || 'Unknown Device';

      await deviceService.deleteDevice(deviceId, deviceName);

      setDevices(prev => prev.filter(device => device.id !== deviceId));
      setDeviceStats(prev => ({
        ...prev,
        total: prev.total - 1
      }));

      setDevicePermissions(prev => {
        const newPerms = { ...prev };
        delete newPerms[deviceId];
        return newPerms;
      });
    } catch (err: any) {
      console.error('Failed to remove device:', err);
      setError(err.response?.data?.message || 'Failed to remove device');
    }
  };

  const handleUpdateDeviceName = async (deviceId: string, newName: string) => {
    try {
      await deviceService.updateDevice(deviceId, {
        deviceName: newName
      });

      setDevices(prev => prev.map(device =>
        device.id === deviceId ? { ...device, name: newName } : device
      ));
    } catch (err: any) {
      console.error('Failed to update device name:', err);
      setError(err.response?.data?.message || 'Failed to update device name');
    }
  };

  const handleUpdateDevicePermissions = async (deviceId: string, permissions: Partial<DevicePermission>) => {
    try {
      const updateData: any = {};

      if ('canSync' in permissions) {
        updateData.syncEnabled = permissions.canSync;
      }
      if ('canShare' in permissions || 'canModify' in permissions) {
        updateData.isTrusted = permissions.canShare || permissions.canModify;
      }

      await deviceService.updateDevice(deviceId, updateData);

      setDevicePermissions(prev => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], ...permissions }
      }));
    } catch (err: any) {
      console.error('Failed to update device permissions:', err);
      setError(err.response?.data?.message || 'Failed to update device permissions');
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    try {
      setDevices(prev => prev.map(device =>
        device.id === deviceId ? { ...device, status: 'idle' } : device
      ));

      const response = await deviceService.triggerSync(deviceId);

      setTimeout(() => {
        setDevices(prev => prev.map(device =>
          device.id === deviceId ? { ...device, status: 'online', lastActive: new Date() } : device
        ));
      }, 2000);

    } catch (err: any) {
      console.error('Failed to sync device:', err);
      setError(err.response?.data?.message || 'Failed to sync device');

      setDevices(prev => prev.map(device =>
        device.id === deviceId ? { ...device, status: 'online' } : device
      ));
    }
  };

  const handleRegisterDevice = async () => {
    if (!newDeviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);

      const deviceInfo = deviceService.getCurrentDeviceInfo();

      console.log('Registering device with info:', {
        deviceName: newDeviceName,
        ...deviceInfo
      });

      const registeredDevice = await deviceService.registerDevice({
        deviceName: newDeviceName,
        deviceType: deviceInfo.deviceType!,
        operatingSystem: deviceInfo.operatingSystem!,
        browser: deviceInfo.browser!,
      });

      console.log('Device registered successfully:', registeredDevice);

      const newDevice: Device = {
        id: registeredDevice._id,
        name: registeredDevice.deviceName,
        type: registeredDevice.deviceType === 'mobile' ? 'smartphone' : registeredDevice.deviceType,
        lastActive: new Date(registeredDevice.lastActiveAt),
        status: registeredDevice.status === 'syncing' ? 'idle' : registeredDevice.status,
        browser: registeredDevice.browser || deviceInfo.browser || 'Unknown',
        os: registeredDevice.operatingSystem || deviceInfo.operatingSystem || 'Unknown',
        isCurrentDevice: false
      };

      setDevices(prev => [...prev, newDevice]);

      setDeviceStats(prev => ({
        ...prev,
        total: prev.total + 1,
        online: prev.online + 1
      }));

      setDevicePermissions(prev => ({
        ...prev,
        [registeredDevice._id]: {
          canSync: registeredDevice.syncEnabled !== undefined ? registeredDevice.syncEnabled : true,
          canShare: registeredDevice.isTrusted !== undefined ? registeredDevice.isTrusted : false,
          canModify: registeredDevice.isTrusted !== undefined ? registeredDevice.isTrusted : false,
          requiresVerification: registeredDevice.isTrusted !== undefined ? !registeredDevice.isTrusted : true
        }
      }));

      setRegistrationSuccess(true);
      setNewDeviceName('');

      setTimeout(() => {
        setShowAddDevice(false);
        setRegistrationSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Failed to register device:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      let errorMessage = 'Failed to register device';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        errorMessage = err.response.data.errors.join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelAddDevice = () => {
    setShowAddDevice(false);
    setNewDeviceName('');
    setRegistrationSuccess(false);
    setError(null);
  };

  const handleOpenVerificationModal = (deviceId: string, deviceName: string) => {
    setVerificationDeviceId(deviceId);
    setVerificationDeviceName(deviceName);
    setShowVerificationModal(true);
    setVerificationCode('');
    setVerificationError(null);
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationDeviceId(null);
    setVerificationDeviceName('');
    setVerificationCode('');
    setVerificationError(null);
  };

  const handleVerifyDevice = async () => {
    if (!verificationDeviceId || !verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationError('Code must be 6 digits');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationError(null);

      const result = await deviceService.verifyDevice(
        verificationDeviceId,
        verificationCode,
        verificationDeviceName
      );

      if (result.success) {
        setVerificationError('✓ Device verified successfully!');

        setTimeout(() => {
          handleCloseVerificationModal();
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      setVerificationError(
        err.response?.data?.message || 'Verification failed. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationDeviceId) return;

    try {
      setIsResendingCode(true);
      setVerificationError(null);

      await deviceService.resendVerificationCode(verificationDeviceId);
      setVerificationError('✓ New code sent! Check the backend console.');

      setTimeout(() => {
        setVerificationError(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to resend code:', err);
      setVerificationError(
        err.response?.data?.message || 'Failed to resend code'
      );
    } finally {
      setIsResendingCode(false);
    }
  };

  // ── Status helpers ─────────────────────────────────────────────────────────
  // Returns newsprint-appropriate border/text/dot classes for each status.
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'online':  return 'border-[#111111] text-[#111111] bg-[#111111]/5';
      case 'idle':    return 'border-[#A3A3A3] text-[#A3A3A3]';
      case 'offline': return 'border-[#E5E5E0] text-[#A3A3A3]';
      default:        return 'border-[#E5E5E0] text-[#A3A3A3]';
    }
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'online':  return 'bg-[#111111]';
      case 'idle':    return 'bg-[#A3A3A3]';
      case 'offline': return 'bg-[#E5E5E0]';
      default:        return 'bg-[#E5E5E0]';
    }
  };

  const getDeviceHeaderClass = (status: string) => {
    switch (status) {
      case 'online':  return 'bg-[#111111]';
      case 'idle':    return 'bg-[#A3A3A3]';
      case 'offline': return 'bg-[#E5E5E0]';
      default:        return 'bg-[#E5E5E0]';
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <FeatureTemplate
        title="Multi-Device Access"
        description="Access your passes from any device, anywhere. Manage permissions, sync data, and verify trusted devices from a single command centre."
        icon={<MonitorSmartphone />}
      >
        {!isAuthenticated ? (
          <AuthPrompt />
        ) : dataLoading ? (

          /* ── Loading state ─────────────────────────────────────────────── */
          <div className="py-20 text-center border border-[#111111] bg-[#F9F9F7]">
            <div className="relative w-48 h-3 bg-[#E5E5E0] border border-[#111111] mx-auto mb-6 overflow-hidden np-loading-sweep" />
            <p className="text-[#111111] np-mono text-xs uppercase tracking-widest">
              Loading Device Data...
            </p>
          </div>

        ) : (
          <div className="space-y-0">

            {/* ── Error Banner ─────────────────────────────────────────────── */}
            {error && (
              <div className="border border-[#CC0000] bg-[#F9F9F7] p-4 flex items-center gap-3 mb-6">
                <AlertCircle className="h-4 w-4 text-[#CC0000] flex-shrink-0" strokeWidth={1.5} />
                <span className="text-[#111111] np-mono text-xs uppercase tracking-widest">{error}</span>
              </div>
            )}

            {/* ─────────────── Ornamental section divider ─────────────── */}
            <div className="flex items-center gap-3 mb-0">
              <div className="flex-1 h-px bg-[#111111]" />
              <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Overview</span>
              <div className="flex-1 h-px bg-[#111111]" />
            </div>

            {/* ── Device Usage Stats ──────────────────────────────────────── */}
            <div className="border border-[#111111] border-t-0 bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<Activity className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Device Usage"
              />

              <div className="p-6">
                {/* Stats grid — collapsed borders, no double lines */}
                <div className="grid grid-cols-3 border border-[#111111] mb-6">
                  <div className="p-4 border-r border-[#111111] text-center">
                    <div className="np-mono text-2xl font-black text-[#111111] leading-none">
                      {deviceStats.total}
                    </div>
                    <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mt-1.5">
                      Total
                    </div>
                  </div>
                  <div className="p-4 border-r border-[#111111] text-center">
                    <div className="np-mono text-2xl font-black text-[#111111] leading-none">
                      {deviceStats.online}
                    </div>
                    <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mt-1.5">
                      Online
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="np-mono text-2xl font-black text-[#111111] leading-none">
                      {deviceStats.offline}
                    </div>
                    <div className="np-mono text-xs uppercase tracking-widest text-[#737373] mt-1.5">
                      Offline
                    </div>
                  </div>
                </div>

                {/* Flat progress bar — no gradients, no rounded corners */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="np-mono text-xs uppercase tracking-widest text-[#111111]">
                      {devices.length} of {deviceLimit} slots used
                    </span>
                    <span className="np-mono text-xs text-[#737373]">
                      {deviceLimit - devices.length} remaining
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#E5E5E0] border border-[#111111] overflow-hidden">
                    <div
                      className="h-full bg-[#111111] transition-all duration-300"
                      style={{ width: `${(devices.length / deviceLimit) * 100}%` }}
                    />
                  </div>
                  <div className="np-mono text-xs text-right text-[#737373] mt-1">
                    {Math.round((devices.length / deviceLimit) * 100)}% USED
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────── Ornamental section divider ─────────────── */}
            <div className="flex items-center gap-3 mt-8 mb-0">
              <div className="flex-1 h-px bg-[#111111]" />
              <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Groups</span>
              <div className="flex-1 h-px bg-[#111111]" />
            </div>

            {/* ── Device Groups ───────────────────────────────────────────── */}
            <div className="border border-t-0 border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<Users className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Device Groups"
              />
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {deviceGroups.length === 0 && (
                  <div className="md:col-span-2 border border-dashed border-[#A3A3A3] p-6 text-center">
                    <p className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">
                      No device groups configured
                    </p>
                  </div>
                )}
                {deviceGroups.map(group => (
                  <div key={group.id} className="border border-[#111111] overflow-hidden np-hard-hover">
                    {/* Group header */}
                    <div className="bg-[#F5F5F5] px-4 py-2 border-b border-[#111111] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-[#111111]" strokeWidth={1.5} />
                        <span className="font-black text-xs uppercase tracking-widest np-mono text-[#111111]">
                          {group.name}
                        </span>
                      </div>
                      <span className="np-mono text-xs text-[#737373] uppercase tracking-wider">
                        {group.devices.length} DEVICES
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {group.devices.map(deviceId => {
                          const device = devices.find(d => d.id === deviceId);
                          return device && (
                            <span
                              key={deviceId}
                              className="text-xs px-3 py-1.5 flex items-center gap-1.5 border border-[#111111] bg-[#F9F9F7] np-mono text-[#111111]"
                            >
                              {getDeviceIcon(device.type)}
                              {device.name}
                              <span className={`w-1.5 h-1.5 ${getStatusDotClass(device.status)}`} />
                            </span>
                          );
                        })}
                        <button className="text-xs px-3 py-1.5 flex items-center gap-1.5 border border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 np-mono np-focus">
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─────────────── Ornamental section divider ─────────────── */}
            <div className="flex items-center gap-3 mt-8 mb-0">
              <div className="flex-1 h-px bg-[#111111]" />
              <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Connected Devices</span>
              <div className="flex-1 h-px bg-[#111111]" />
            </div>

            {/* ── Connected Devices ───────────────────────────────────────── */}
            <div className="border border-t-0 border-[#111111] bg-[#F9F9F7] overflow-hidden">
              <SectionHeader
                icon={<SignalHigh className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                title="Connected Devices"
                action={
                  devices.length < deviceLimit ? (
                    <button
                      onClick={() => setShowAddDevice(!showAddDevice)}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[36px] np-focus"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      ADD DEVICE
                    </button>
                  ) : undefined
                }
              />

              <div className="p-6">
                {loading ? (

                  /* ── Device list loading ── */
                  <div className="border border-[#111111] p-8 text-center bg-[#F5F5F5]">
                    <div className="relative w-32 h-2 bg-[#E5E5E0] border border-[#111111] mx-auto mb-4 overflow-hidden np-loading-sweep" />
                    <p className="np-mono text-xs uppercase tracking-widest text-[#737373]">Loading devices...</p>
                  </div>

                ) : devices.length === 0 ? (

                  /* ── Empty state ── */
                  <div className="border border-dashed border-[#A3A3A3] p-10 text-center">
                    <div className="border border-[#A3A3A3] p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <MonitorSmartphone className="h-6 w-6 text-[#A3A3A3]" strokeWidth={1.5} />
                    </div>
                    <p className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3] mb-1">No devices registered</p>
                    <p className="text-sm text-[#737373] np-body">Add a device to get started</p>
                  </div>

                ) : (
                  <div className="space-y-4">
                    {devices.map(device => (
                      <div key={device.id} className="border border-[#111111] bg-[#F9F9F7] overflow-hidden np-hard-hover">

                        {/* Status stripe — 2px coloured top rule */}
                        <div className={`h-0.5 ${getDeviceHeaderClass(device.status)}`} />

                        {/* ── Device card header ── */}
                        <div className="p-4 border-b border-[#111111]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Device type icon in bordered box */}
                              <div className="border border-[#111111] p-2.5 flex items-center justify-center w-10 h-10 flex-shrink-0 bg-[#F5F5F5]">
                                {getDeviceIcon(device.type)}
                              </div>
                              <div>
                                <div className="font-black text-sm text-[#111111] np-mono flex items-center gap-2 flex-wrap">
                                  {device.name}
                                  {device.isCurrentDevice && (
                                    <span className="bg-[#111111] text-[#F9F9F7] px-2 py-0.5 np-mono text-xs uppercase tracking-widest font-black">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#737373] np-mono mt-0.5">
                                  {device.browser} · {device.os}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status badge */}
                              <span className={`np-mono text-xs uppercase tracking-widest px-2 py-0.5 border font-black ${getStatusBadgeClass(device.status)}`}>
                                {device.status.toUpperCase()}
                              </span>

                              {/* Remove button — only for non-current devices */}
                              {!device.isCurrentDevice && (
                                <button
                                  onClick={() => handleRemoveDevice(device.id)}
                                  className="border border-[#CC0000] p-1.5 text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                  title="Remove Device"
                                  aria-label={`Remove ${device.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                                </button>
                              )}
                              <button
                                className="border border-[#111111] p-1.5 text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center np-focus"
                                title="Device Settings"
                                aria-label={`Settings for ${device.name}`}
                              >
                                <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {/* Last active metadata */}
                          <div className="mt-2 np-mono text-xs text-[#737373] uppercase tracking-widest">
                            LAST ACTIVE: {device.lastActive.toLocaleString()}
                          </div>
                        </div>

                        {/* ── Device Settings Expansion ── */}
                        <div className="p-5 bg-[#F9F9F7]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">

                            {/* Device Nickname */}
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                                Device Nickname
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={device.name}
                                  onChange={(e) => handleUpdateDeviceName(device.id, e.target.value)}
                                  className="np-input flex-1"
                                />
                                <Tag className="h-4 w-4 text-[#737373] flex-shrink-0" strokeWidth={1.5} />
                              </div>
                            </div>

                            {/* Verification Status */}
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                                Verification Status
                              </label>
                              {devicePermissions[device.id]?.requiresVerification ? (
                                <button
                                  onClick={() => handleOpenVerificationModal(device.id, device.name)}
                                  className="flex items-center gap-3 p-2.5 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 w-full np-focus group"
                                >
                                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                                  <span className="text-xs font-black uppercase tracking-widest np-mono">
                                    Click to Verify Device
                                  </span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 p-2.5 border border-[#111111] bg-[#F5F5F5] text-[#111111]">
                                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                                  <span className="text-xs font-black uppercase tracking-widest np-mono">
                                    ✓ Verified
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── Device Permissions ── */}
                          <div className="border-t border-[#E5E5E0] pt-5">
                            <h4 className="text-xs font-black uppercase tracking-widest np-mono flex items-center gap-2 mb-3 text-[#111111]">
                              <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                              Device Permissions
                            </h4>
                            {/* Collapsed border grid for permission toggles */}
                            <div className="grid grid-cols-2 md:grid-cols-3 border border-[#111111]">
                              {Object.entries(devicePermissions[device.id] || {})
                                .filter(([key]) => key !== 'requiresVerification')
                                .map(([key, value], idx, arr) => (
                                  <label
                                    key={key}
                                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors np-focus
                                      ${idx < arr.length - 1 ? 'border-r border-b border-[#111111]' : ''}
                                    `}
                                  >
                                    {/* Newsprint square checkbox */}
                                    <div className={`w-4 h-4 border border-[#111111] flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${value ? 'bg-[#111111]' : 'bg-transparent'}`}>
                                      {value && (
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10">
                                          <polyline points="1.5,5 3.5,7.5 8.5,2.5" stroke="#F9F9F7" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                                        </svg>
                                      )}
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={!!value}
                                      onChange={(e) => handleUpdateDevicePermissions(
                                        device.id,
                                        { [key]: e.target.checked }
                                      )}
                                    />
                                    <span className="text-xs np-mono uppercase tracking-widest text-[#111111]">
                                      {key.replace('can', 'Can ')}
                                    </span>
                                  </label>
                                ))}
                            </div>
                          </div>

                          {/* ── Action buttons ── */}
                          <div className="mt-5 flex justify-end gap-3">
                            <button
                              onClick={() => handleSyncDevice(device.id)}
                              className="text-xs px-4 py-2.5 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] flex items-center gap-2 transition-all duration-200 np-mono uppercase tracking-widest font-black min-h-[44px] np-focus"
                            >
                              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                              SYNC NOW
                            </button>
                            <button className="text-xs px-4 py-2.5 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] flex items-center gap-2 transition-all duration-200 np-mono uppercase tracking-widest font-black min-h-[44px] np-focus">
                              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              ADVANCED SETTINGS
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─────────────── Ornamental section divider ─────────────── */}
            {showAddDevice && (
              <div className="flex items-center gap-3 mt-8 mb-0">
                <div className="flex-1 h-px bg-[#111111]" />
                <span className="np-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Register Device</span>
                <div className="flex-1 h-px bg-[#111111]" />
              </div>
            )}

            {/* ── Register Device Panel ───────────────────────────────────── */}
            {showAddDevice && (
              <div className="border border-t-0 border-[#111111] bg-[#F9F9F7] overflow-hidden">
                <SectionHeader
                  icon={<Plus className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />}
                  title="Register Current Device"
                />
                <div className="p-6">
                  {registrationSuccess ? (

                    /* ── Success state ── */
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-[#111111] bg-[#F5F5F5]">
                      <div className="border-2 border-[#111111] p-4 w-16 h-16 flex items-center justify-center mb-4 bg-[#F9F9F7]">
                        <svg className="h-8 w-8 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <polyline points="5,13 9,17 19,7" strokeLinecap="square" strokeLinejoin="miter" />
                        </svg>
                      </div>
                      <h4 className="font-black text-[#111111] mb-2 text-xs uppercase tracking-widest np-mono">
                        Device Registered Successfully
                      </h4>
                      <p className="text-sm text-[#525252] np-body">Your device has been added to your account</p>
                    </div>

                  ) : (
                    <>
                      {/* ── Auto-detected device info box ── */}
                      <div className="border border-[#111111] bg-[#F5F5F5] p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="border border-[#111111] p-2 flex items-center justify-center flex-shrink-0 bg-[#F9F9F7]">
                            <Smartphone className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-xs uppercase tracking-widest np-mono text-[#111111] mb-2">
                              Auto-Detected Device Info
                            </h4>
                            <div className="text-xs text-[#525252] space-y-1 np-mono">
                              {(() => {
                                const info = deviceService.getCurrentDeviceInfo();
                                return (
                                  <>
                                    <p>
                                      <span className="text-[#111111] font-black">TYPE: </span>
                                      {info.deviceType}
                                    </p>
                                    <p>
                                      <span className="text-[#111111] font-black">OS: </span>
                                      {info.operatingSystem}
                                    </p>
                                    <p>
                                      <span className="text-[#111111] font-black">BROWSER: </span>
                                      {info.browser}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Device name input ── */}
                      <div className="mb-6">
                        <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                          Device Name / Nickname <span className="text-[#CC0000]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          placeholder="e.g., My Laptop, Work PC, iPhone 13"
                          className="np-input"
                          disabled={isRegistering}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isRegistering) {
                              handleRegisterDevice();
                            }
                          }}
                        />
                        <p className="text-xs text-[#737373] mt-1 np-mono">
                          Give your device a memorable name to identify it easily
                        </p>
                      </div>

                      {/* ── Inline error ── */}
                      {error && (
                        <div className="mb-4 border border-[#CC0000] p-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-[#CC0000] flex-shrink-0" strokeWidth={1.5} />
                          <span className="text-xs text-[#111111] np-mono">{error}</span>
                        </div>
                      )}

                      {/* ── Action buttons ── */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleRegisterDevice}
                          disabled={isRegistering || !newDeviceName.trim()}
                          className="flex-1 py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] flex items-center justify-center gap-2 transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed np-focus"
                        >
                          {isRegistering ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                              REGISTERING...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" strokeWidth={1.5} />
                              REGISTER THIS DEVICE
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelAddDevice}
                          disabled={isRegistering}
                          className="flex-1 py-3 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] flex items-center justify-center transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed np-focus"
                        >
                          CANCEL
                        </button>
                      </div>

                      {/* ── Security note ── */}
                      <div className="mt-4 pt-4 border-t border-[#E5E5E0] flex items-start gap-2">
                        <Shield className="h-4 w-4 text-[#737373] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <p className="text-xs text-[#737373] np-mono">
                          This will register the current browser/device you're using right now.
                          You can manage device permissions and settings after registration.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Verification Modal ───────────────────────────────────────────── */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full overflow-hidden"
              style={{ boxShadow: '8px 8px 0px 0px #111111' }}
            >
              {/* Modal Header — inverted bar */}
              <div className="bg-[#111111] px-6 py-4 flex items-center justify-between np-texture">
                <h3 className="text-xs font-black uppercase tracking-widest np-mono text-[#F9F9F7] flex items-center gap-2">
                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                  VERIFY DEVICE
                </h3>
                <button
                  onClick={handleCloseVerificationModal}
                  className="p-1 border border-[#F9F9F7]/30 text-[#F9F9F7] hover:bg-[#F9F9F7]/20 transition-all duration-200 np-focus"
                  disabled={isVerifying}
                  aria-label="Close verification modal"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sub-header caption */}
              <div className="bg-[#F5F5F5] px-6 py-2 border-b border-[#111111]">
                <p className="text-xs text-[#737373] np-mono uppercase tracking-widest">
                  Enter the 6-digit code from backend console
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6">

                {/* Instruction box */}
                <div className="border border-[#111111] bg-[#F5F5F5] p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="border border-[#111111] p-1.5 flex items-center justify-center flex-shrink-0 bg-[#F9F9F7]">
                      <svg className="h-4 w-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-[#111111] np-mono uppercase tracking-widest mb-1">
                        Check Backend Console
                      </p>
                      <p className="text-xs text-[#525252] np-mono">
                        The verification code for{' '}
                        <strong className="text-[#111111]">"{verificationDeviceName}"</strong>{' '}
                        was printed in the backend terminal. Look for: 🔑 VERIFICATION CODE
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code input */}
                <div className="mb-6">
                  <label className="block text-xs font-black uppercase tracking-widest text-[#111111] mb-2 np-mono">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      // Only allow numbers and max 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setVerificationError(null);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-3 text-center text-2xl font-black tracking-[0.5em] np-mono text-[#111111] outline-none focus:bg-[#F0F0F0] transition-colors disabled:opacity-50"
                    disabled={isVerifying}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && verificationCode.length === 6 && !isVerifying) {
                        handleVerifyDevice();
                      }
                    }}
                  />
                  <p className="text-xs text-[#737373] mt-1.5 text-center np-mono uppercase tracking-widest">
                    6-digit code from terminal
                  </p>
                </div>

                {/* Verification feedback */}
                {verificationError && (
                  <div className={`mb-4 p-3 border flex items-center gap-2 ${
                    verificationError.includes('✓') || verificationError.includes('successfully')
                      ? 'border-[#111111] bg-[#F5F5F5]'
                      : 'border-[#CC0000] bg-[#F9F9F7]'
                  }`}>
                    {verificationError.includes('✓') || verificationError.includes('successfully') ? (
                      <svg className="h-4 w-4 text-[#111111] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <polyline points="5,13 9,17 19,7" strokeLinecap="square" strokeLinejoin="miter" />
                      </svg>
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[#CC0000] flex-shrink-0" strokeWidth={1.5} />
                    )}
                    <span className={`text-xs np-mono ${
                      verificationError.includes('✓') || verificationError.includes('successfully')
                        ? 'text-[#111111]'
                        : 'text-[#CC0000]'
                    }`}>
                      {verificationError}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleVerifyDevice}
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="w-full py-3 bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-[#F9F9F7] hover:text-[#111111] hover:border-[#111111] flex items-center justify-center gap-2 transition-all duration-200 font-black uppercase text-xs tracking-widest np-mono min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed np-focus"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                        VERIFYING...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" strokeWidth={1.5} />
                        VERIFY DEVICE
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResendCode}
                    disabled={isResendingCode || isVerifying}
                    className="w-full py-2.5 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200 text-xs font-black uppercase tracking-widest np-mono min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed np-focus"
                  >
                    {isResendingCode ? 'SENDING...' : 'RESEND CODE'}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#F5F5F5] px-6 py-3 border-t border-[#111111]">
                <p className="text-xs text-[#737373] text-center np-mono uppercase tracking-widest">
                  Check your backend terminal for the verification code
                </p>
              </div>
            </div>
          </div>
        )}

      </FeatureTemplate>
      <Footer />
      <ScrollButton />
    </>
  );
};

export default MultiDevice;