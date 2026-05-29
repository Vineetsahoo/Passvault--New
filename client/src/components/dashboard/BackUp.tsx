import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCloud, FaCheck, FaExclamationTriangle,
  FaLaptop, FaMobile, FaTablet, FaDesktop,
  FaHistory, FaCog, FaTrash, FaEdit, FaShieldAlt,
  FaCloudDownloadAlt, FaCloudUploadAlt, FaUndo,
  FaCalendarAlt, FaDatabase, FaEllipsisV,
  FaTimes, FaLock, FaPlus, FaServer,
  FaSyncAlt, FaCheckCircle, FaExclamationCircle, FaClock,
  FaSave, FaChevronRight, FaSpinner,
  FaSignOutAlt
} from 'react-icons/fa';
import { HiCloud, HiOutlineDownload, HiOutlineUpload } from "react-icons/hi";
import { IoCloudDone, IoCloudOffline } from "react-icons/io5";

// Import services - you'll need to create these service files
import backupService from '../../services/backupService';
import deviceService from '../../services/deviceService';
import syncService from '../../services/syncService';
import passwordService from '../../services/passwordService';
import documentService from '../../services/documentService';
import qrcodeService from '../../services/qrcodeService';

interface SyncStatus {
  lastSync: string;
  status: 'success' | 'pending' | 'error';
  items: number;
}

interface SyncDevice {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'tablet' | 'desktop';
  lastSync: string;
  status: 'online' | 'offline';

  os?: string;
  browser?: string;
  lastActive?: string;
  ip?: string;
  isCurrent?: boolean;
}

interface SyncHistory {
  id: string;
  date: string;
  status: 'success' | 'error';
  details: string;
  action?: string;
  device?: string;
  changes?: number;
  size?: string;
  timestamp?: string;
}

interface SyncProgress {
  total: number;
  current: number;
  uploading: boolean;
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
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
      {label && <span className="ml-3 text-sm font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>}
    </label>
  );
};

// Validation Error Component
const ValidationError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-600 text-sm mt-1 flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  );
};

interface BackupVersion {
  id: string;
  timestamp: string;
  size: string;
  type: 'auto' | 'manual';
  restorable: boolean;
}

interface RecoveryStatus {
  inProgress: boolean;
  progress: number;
  currentFile: string;
  estimatedTime: string;
}

interface BackupSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number;
  encryption: boolean;
  compression: boolean;
  location: 'cloud' | 'local';
}

const BackUp: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date().toISOString(),
    status: 'pending',
    items: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ total: 0, current: 0, uploading: false });
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>('auto');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [devices, setDevices] = useState<SyncDevice[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);

  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>({
    inProgress: false,
    progress: 0,
    currentFile: '',
    estimatedTime: ''
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    frequency: 'daily',
    retention: 30,
    encryption: true,
    compression: true,
    location: 'cloud'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // New feature states
  const [healthScore, setHealthScore] = useState<any>(null);
  const [showSelectiveBackup, setShowSelectiveBackup] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [selectedBackupDevice, setSelectedBackupDevice] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState({
    passwordIds: [] as string[],
    documentIds: [] as string[],
    qrcodeIds: [] as string[]
  });
  const [selectablePasswords, setSelectablePasswords] = useState<any[]>([]);
  const [selectableDocuments, setSelectableDocuments] = useState<any[]>([]);
  const [selectableQRCodes, setSelectableQRCodes] = useState<any[]>([]);

  // ==================== VALIDATION FUNCTIONS ====================

  const validateRetentionPeriod = (days: number): string | null => {
    if (!days || isNaN(days)) {
      return 'Retention period is required';
    }
    if (days < 1) {
      return 'Retention period must be at least 1 day';
    }
    if (days > 365) {
      return 'Retention period cannot exceed 365 days';
    }
    return null;
  };

  const validateBackupFrequency = (frequency: string): string | null => {
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!frequency) {
      return 'Backup frequency is required';
    }
    if (!validFrequencies.includes(frequency)) {
      return 'Invalid backup frequency';
    }
    return null;
  };

  const validateBackupLocation = (location: string): string | null => {
    const validLocations = ['cloud', 'local'];
    if (!location) {
      return 'Backup location is required';
    }
    if (!validLocations.includes(location)) {
      return 'Invalid backup location';
    }
    return null;
  };

  const validateBackupSettings = (): boolean => {
    const errors: Record<string, string> = {};

    const retentionError = validateRetentionPeriod(backupSettings.retention);
    if (retentionError) errors.retention = retentionError;

    const frequencyError = validateBackupFrequency(backupSettings.frequency);
    if (frequencyError) errors.frequency = frequencyError;

    const locationError = validateBackupLocation(backupSettings.location);
    if (locationError) errors.location = locationError;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log('❌ Backup settings validation failed:', errors);
      return false;
    }

    console.log('✅ Backup settings validation passed');
    return true;
  };

  const validateSelectiveBackup = (): string | null => {
    const totalSelected =
      selectedItems.passwordIds.length +
      selectedItems.documentIds.length +
      selectedItems.qrcodeIds.length;

    if (totalSelected === 0) {
      return 'Please select at least one item to backup';
    }

    if (totalSelected > 1000) {
      return 'Cannot backup more than 1000 items at once';
    }

    return null;
  };

  const clearValidationError = (field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // ==================== END VALIDATION FUNCTIONS ====================

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setDataLoading(true);
        setError(null);

        // Add small delay between requests to avoid rate limiting
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Fetch backup versions
        const backupsResponse = await backupService.getBackupVersions();
        if (backupsResponse.success && backupsResponse.backups) {
          const formattedBackups = backupsResponse.backups.map((backup: any) => ({
            id: backup._id,
            timestamp: new Date(backup.createdAt).toLocaleString(),
            size: formatBytes(backup.backupSize || 0),
            type: backup.backupType,
            restorable: backup.restorable && backup.backupStatus === 'completed'
          }));
          setBackupVersions(formattedBackups);

          // Update sync status from latest backup
          if (formattedBackups.length > 0) {
            const latestBackup = backupsResponse.backups[0];
            setSyncStatus({
              lastSync: new Date(latestBackup.completedAt || latestBackup.createdAt).toLocaleString(),
              status: latestBackup.backupStatus === 'completed' ? 'success' : 'pending',
              items: latestBackup.itemCount || 0
            });
          }
        }

        // Fetch devices
        const devicesResponse = await deviceService.getDevices();
        if (devicesResponse.devices) {
          const formattedDevices = devicesResponse.devices.map((device: any) => ({
            id: device._id,
            name: device.deviceName,
            type: device.deviceType,
            lastSync: new Date(device.lastSyncedAt || device.lastActiveAt).toLocaleString(),
            status: device.status
          }));
          setDevices(formattedDevices);
        }

        // Fetch sync history
        const syncHistoryResponse = await syncService.getRecentSyncs(10);
        if (Array.isArray(syncHistoryResponse)) {
          const formattedHistory = syncHistoryResponse.map((log: any) => ({
            id: log._id,
            date: new Date(log.startedAt).toLocaleString(),
            status: (log.syncStatus === 'completed' ? 'success' : 'error') as 'success' | 'error',
            details: log.syncStatus === 'completed'
              ? `${log.totalItems || 0} items synced successfully`
              : log.error?.message || 'Sync failed'
          }));
          setSyncHistory(formattedHistory);
        }

        // Fetch backup settings
        const settingsResponse = await backupService.getBackupSettings();
        if (settingsResponse.success && settingsResponse.settings) {
          setBackupSettings(settingsResponse.settings);
          setSyncMode(settingsResponse.settings.autoBackupEnabled ? 'auto' : 'manual');
          setEncryptionEnabled(settingsResponse.settings.encryption);
        }

        // Fetch backup stats
        const statsResponse = await backupService.getBackupStats();
        if (statsResponse.success && statsResponse.stats) {
          setSyncStatus(prev => ({
            ...prev,
            items: statsResponse.stats.totalItems || prev.items
          }));
        }

        // Fetch health score
        try {
          const healthResponse = await backupService.getHealthScore();
          if (healthResponse.success) {
            setHealthScore(healthResponse.health);
          }
        } catch (healthError) {
          console.error('Error fetching health score:', healthError);
        }

        // Fetch available devices for backup
        try {
          const devicesResponse = await backupService.getDevices();
          if (devicesResponse.success) {
            setAvailableDevices(devicesResponse.devices);
          }
        } catch (devicesError) {
          console.error('Error fetching devices:', devicesError);
        }

        // Fetch passwords for selective backup (with delay and pagination)
        try {
          await delay(100); // Small delay to avoid rate limiting
          let allPasswords: any[] = [];
          let currentPage = 1;
          let hasMore = true;

          // Fetch all passwords with pagination (backend limit is 100 per page)
          while (hasMore && currentPage <= 10) { // Max 10 pages (1000 items)
            const passwordsResponse = await passwordService.getPasswords({
              limit: 100,
              page: currentPage
            });

            if (passwordsResponse.passwords && passwordsResponse.passwords.length > 0) {
              allPasswords = [...allPasswords, ...passwordsResponse.passwords];

              // Check if there are more pages
              if (passwordsResponse.pagination &&
                currentPage < passwordsResponse.pagination.pages) {
                currentPage++;
                await delay(50); // Small delay between requests
              } else {
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          }

          setSelectablePasswords(allPasswords);
        } catch (passwordsError) {
          console.error('Error fetching passwords:', passwordsError);
        }

        // Fetch documents for selective backup (with delay)
        try {
          await delay(100); // Small delay to avoid rate limiting
          const documentsResponse = await documentService.getDocuments({ limit: 100 });
          if (documentsResponse.documents) {
            setSelectableDocuments(documentsResponse.documents);
          }
        } catch (documentsError) {
          console.error('Error fetching documents:', documentsError);
        }

        // Fetch QR codes for selective backup (with delay)
        try {
          await delay(100); // Small delay to avoid rate limiting
          const qrcodesResponse = await qrcodeService.getQRCodes({ limit: 100 });
          if (qrcodesResponse.qrcodes) {
            setSelectableQRCodes(qrcodesResponse.qrcodes);
          }
        } catch (qrcodesError) {
          console.error('Error fetching QR codes:', qrcodesError);
        }

      } catch (error: any) {
        console.error('Error fetching backup data:', error);
        setError(error.response?.data?.message || 'Failed to load backup data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setSyncProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + 10, prev.total),
          uploading: !prev.uploading
        }));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'laptop': return <FaLaptop />;
      case 'mobile': return <FaMobile />;
      case 'tablet': return <FaTablet />;
      default: return <FaDesktop />;
    }
  };

  const getStatusBadge = (status: 'success' | 'pending' | 'error') => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <FaCheckCircle size={12} /> Success
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <FaClock size={12} /> Pending
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <FaExclamationCircle size={12} /> Error
          </span>
        );
      default:
        return null;
    }
  };

  const handleSync = async () => {
    try {
      setError(null);
      setShowBackupModal(true);
      setIsLoading(true);
      setSyncProgress({ total: 100, current: 0, uploading: true });
      setSyncStatus(prev => ({ ...prev, status: 'pending' }));

      // Create backup via API
      const response = await backupService.createBackup('manual');

      if (response.success) {
        const backupId = response.backup.id;

        // Poll for backup status
        let progress = 0;
        const interval = setInterval(async () => {
          progress += 10;
          setSyncProgress(prev => ({
            ...prev,
            current: progress
          }));

          if (progress >= 100) {
            clearInterval(interval);

            // Fetch the completed backup
            try {
              const statusResponse = await backupService.getBackupStatus(backupId);

              if (statusResponse.success && statusResponse.backup) {
                const backup = statusResponse.backup;
                const newBackup = {
                  id: backup._id,
                  timestamp: new Date(backup.completedAt || backup.createdAt).toLocaleString(),
                  size: formatBytes(backup.backupSize || 0),
                  type: backup.backupType as 'auto' | 'manual',
                  restorable: backup.restorable && backup.backupStatus === 'completed'
                };

                setBackupVersions(prev => [newBackup, ...prev]);

                setSyncStatus({
                  lastSync: new Date().toLocaleString(),
                  status: backup.backupStatus === 'completed' ? 'success' : 'pending',
                  items: backup.itemCount || syncStatus.items
                });
              }
            } catch (error) {
              console.error('Error fetching backup status:', error);
            }

            setIsLoading(false);
            setSyncProgress({ total: 0, current: 0, uploading: false });

            // Auto close modal after 2 seconds on success
            setTimeout(() => {
              setShowBackupModal(false);
            }, 2000);
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('Backup error:', err);
      setError(err.response?.data?.message || 'An error occurred during backup');
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
      setIsLoading(false);
      setSyncProgress({ total: 0, current: 0, uploading: false });
    }
  };

  const handleDeviceAction = (deviceId: string, action: 'edit' | 'remove') => {
    setSelectedDevice(deviceId);
  };

  const handleRestore = async (versionId: string) => {
    try {
      if (!window.confirm('Are you sure you want to restore this backup? This will replace your current data.')) {
        return;
      }

      setRecoveryStatus({
        inProgress: true,
        progress: 0,
        currentFile: 'Initializing recovery...',
        estimatedTime: 'Calculating...'
      });

      // Initiate restore via API
      const response = await backupService.restoreBackup(versionId);

      if (response.success) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setRecoveryStatus(prev => ({
            ...prev,
            progress,
            currentFile: `Recovering file ${progress}/100`,
            estimatedTime: `${Math.ceil((100 - progress) / 10)} seconds remaining`
          }));

          if (progress >= 100) {
            clearInterval(interval);
            setRecoveryStatus(prev => ({
              ...prev,
              progress: 100,
              currentFile: 'Recovery complete',
              estimatedTime: 'Done'
            }));

            setTimeout(() => {
              setRecoveryStatus(prev => ({ ...prev, inProgress: false }));
              // Refresh data after restore
              window.location.reload();
            }, 2000);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      setError(error.response?.data?.message || 'Failed to restore backup');
      setRecoveryStatus(prev => ({ ...prev, inProgress: false }));
    }
  };

  const handleDeleteBackup = async (versionId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this backup?')) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await backupService.deleteBackup(versionId);

      if (response.success) {
        setBackupVersions(prev => prev.filter(backup => backup.id !== versionId));
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Delete backup error:', err);
      setError(err.response?.data?.message || 'Failed to delete backup');
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      console.log('🔍 Validating backup settings...');

      // Validate settings before saving
      if (!validateBackupSettings()) {
        alert('⚠️ Please fix the validation errors before saving settings');
        return;
      }

      setIsLoading(true);
      setError(null);

      const updatedSettings = {
        ...backupSettings,
        frequency: syncMode === 'auto' ? backupSettings.frequency : ('weekly' as 'daily' | 'weekly' | 'monthly'),
        encryption: encryptionEnabled,
        autoBackupEnabled: syncMode === 'auto'
      };

      console.log('📤 Sending settings update to backend:', updatedSettings);

      const response = await backupService.updateBackupSettings(updatedSettings);

      if (response.success) {
        console.log('✅ Settings updated successfully');
        setBackupSettings(response.settings);
        setShowSettings(false);
        setValidationErrors({}); // Clear any validation errors
        alert('✅ Backup settings updated successfully!');
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('❌ Update settings error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      setError(errorMessage);

      // Handle backend validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((error: any) => {
          backendErrors[error.field] = error.message;
        });
        setValidationErrors(backendErrors);
      }

      setIsLoading(false);
    }
  };

  // New feature handlers
  const handleSelectiveBackup = async () => {
    try {
      console.log('🔍 Validating selective backup...');

      // Validate selective backup
      const validationError = validateSelectiveBackup();
      if (validationError) {
        setError(validationError);
        alert(`⚠️ ${validationError}`);
        return;
      }

      console.log('✅ Selective backup validation passed');
      console.log('📊 Selected items:', {
        passwords: selectedItems.passwordIds.length,
        documents: selectedItems.documentIds.length,
        qrcodes: selectedItems.qrcodeIds.length
      });

      setShowSelectiveBackup(false);
      setShowBackupModal(true);
      setIsLoading(true);
      setSyncProgress({ total: 100, current: 0, uploading: true });
      setError(null); // Clear any previous errors

      console.log('📤 Creating selective backup...');
      const response = await backupService.createSelectiveBackup(
        selectedItems,
        selectedBackupDevice || undefined
      );

      if (response.success) {
        console.log('✅ Selective backup created successfully');

        // Poll for completion
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setSyncProgress(prev => ({ ...prev, current: progress }));

          if (progress >= 100) {
            clearInterval(interval);
            setIsLoading(false);

            console.log('🔄 Refreshing backup data...');

            // Refresh backup list
            backupService.getBackupVersions().then(res => {
              if (res.success && res.backups) {
                const formattedBackups = res.backups.map((backup: any) => ({
                  id: backup._id,
                  timestamp: new Date(backup.createdAt).toLocaleString(),
                  size: formatBytes(backup.backupSize || 0),
                  sizeInBytes: backup.backupSize || 0,
                  type: backup.backupType,
                  restorable: backup.restorable && backup.backupStatus === 'completed',
                  itemCount: backup.itemCount || 0,
                  dataTypes: backup.dataTypes || []
                }));
                setBackupVersions(formattedBackups);
              }
            }).catch(err => {
              console.error('Error refreshing backup list:', err);
            });

            // Refresh health score
            backupService.getHealthScore().then(res => {
              if (res.success) {
                setHealthScore(res.health);
              }
            }).catch(err => {
              console.error('Error refreshing health score:', err);
            });

            // Clear selection after successful backup
            setSelectedItems({ passwordIds: [], documentIds: [], qrcodeIds: [] });
            setSelectedBackupDevice('');

            setTimeout(() => setShowBackupModal(false), 2000);
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('❌ Selective backup error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create selective backup';
      setError(errorMessage);

      // Handle backend validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map((e: any) => e.message).join(', ');
        alert(`⚠️ Validation errors: ${errorMessages}`);
      } else {
        alert(`❌ ${errorMessage}`);
      }

      setIsLoading(false);
      setShowBackupModal(false);
      setSyncProgress({ total: 0, current: 0, uploading: false });
    }
  };

  const handleUploadToGoogleDrive = async (backupId: string) => {
    try {
      setIsLoading(true);
      const response = await backupService.uploadToGoogleDrive(backupId);

      if (response.success) {
        // Update backup list to show Google Drive link
        setBackupVersions(prev => prev.map(backup =>
          backup.id === backupId
            ? { ...backup, googleDrive: response.googleDrive }
            : backup
        ));
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Google Drive upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload to Google Drive');
      setIsLoading(false);
    }
  };

  const handleVerifyBackup = async (backupId: string) => {
    try {
      setIsLoading(true);
      const response = await backupService.verifyBackup(backupId);

      if (response.success) {
        // Refresh health score after verification
        const healthResponse = await backupService.getHealthScore();
        if (healthResponse.success) {
          setHealthScore(healthResponse.health);
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Verify backup error:', err);
      setError(err.response?.data?.message || 'Failed to verify backup');
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (type: 'password' | 'document' | 'qrcode', id: string) => {
    setSelectedItems(prev => {
      const key = type === 'password' ? 'passwordIds' :
        type === 'document' ? 'documentIds' : 'qrcodeIds';

      const currentIds = prev[key];
      const newIds = currentIds.includes(id)
        ? currentIds.filter(itemId => itemId !== id)
        : [...currentIds, id];

      return { ...prev, [key]: newIds };
    });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-green-300';
    if (score >= 60) return 'text-yellow-300';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const BackupHeader = () => (
    <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <div className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            DATA PROTECTION &bull; SYNC
          </div>
          <h2 className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
            BACKUP &<br />
            <span className="text-[#CC0000]">SYNC</span>
          </h2>
          <p className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4" style={{ fontFamily: "'Lora', serif" }}>
            Keep your sensitive information securely backed up and synchronized across all your registered devices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-6 py-4 border-2 border-[#111111] font-black uppercase text-xs tracking-widest transition-all ${showSettings ? 'bg-[#111111] text-[#F9F9F7]' : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] hard-shadow-hover'
              }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
          </button>

          <button
            onClick={handleSync}
            disabled={isLoading}
            className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'BACKING UP...' : 'BACKUP NOW'}
          </button>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-5 gap-0 bg-[#111111]">
        <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
          <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[SECURED ITEMS]</div>
          <div className="font-black text-[#111111] flex items-center gap-2 text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}><FaDatabase className="text-[#111111] text-lg" /> {syncStatus.items}</div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
          <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[LAST BACKUP]</div>
          <div className="font-bold text-[#111111] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>{formatDate(syncStatus.lastSync)}</div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
          <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[STATUS]</div>
          <div className="font-bold text-[#111111] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            {syncMode === 'auto' ? 'AUTO ENABLED' : 'MANUAL ONLY'}
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
          <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[HEALTH]</div>
          <div className="font-bold text-[#111111] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            {healthScore ? `${healthScore.rating} (${healthScore.score}/100)` : 'N/A'}
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-[#111111]">
          <button
            onClick={() => setShowSelectiveBackup(true)}
            className="w-full h-full flex items-center justify-center gap-2 bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest p-4 hover:bg-[#CC0000] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <FaPlus /> SELECT ITEMS
          </button>
        </div>
      </div>
    </div>
  );

  const BackupSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 border-b-4 border-[#111111]">
      <div className="border-r border-[#111111] bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
        <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
          <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>STATUS</h3>
          <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
            {syncStatus.status === 'success' ?
              <IoCloudDone className="h-6 w-6" /> :
              syncStatus.status === 'pending' ?
                <FaClock className="h-6 w-6" /> :
                <IoCloudOffline className="text-[#CC0000] h-6 w-6" />
            }
          </div>
        </div>
        <div className="mb-6">
          <p className="text-[0.65rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LATEST ARCHIVE</p>
          <p className="text-xl font-black text-[#111111] border-l-2 border-[#111111] pl-3 py-1" style={{ fontFamily: "'Inter', sans-serif" }}>{formatDate(syncStatus.lastSync)}</p>
        </div>
        <div className="pt-4 border-t border-[#111111] flex justify-between items-center text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="text-[#525252]">{syncStatus.items} ITEMS</span>
          <span className="text-[#CC0000] hover:underline cursor-pointer">DETAILS &rarr;</span>
        </div>
      </div>

      <div className="border-r border-[#111111] bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
        <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
          <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>STORAGE</h3>
          <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
            <FaDatabase className="h-6 w-6" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-4xl font-black text-[#111111] tracking-tighter">{syncStatus.items * 0.5} MB</p>
          <span className="text-[0.65rem] border border-[#111111] text-[#111111] px-2 py-0.5 uppercase tracking-widest font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {syncStatus.items} FILES
          </span>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full border border-[#111111] bg-white">
            <div
              className="h-full bg-[#CC0000]"
              style={{ width: `${Math.min((syncStatus.items * 0.5) / 100, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-[0.6rem] text-[#525252] font-bold tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span>0MB</span>
            <span>100MB</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-[#111111] flex justify-between items-center text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="text-[#525252]">{backupVersions.length} VERSIONS</span>
          <span className={`${syncMode === 'auto' ? 'text-[#111111]' : 'text-[#CC0000]'}`}>
            {syncMode === 'auto' ? 'AUTO' : 'MANUAL'}
          </span>
        </div>
      </div>

      <div className="bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
        <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
          <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>SCHEDULE</h3>
          <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
            <FaCalendarAlt className="h-6 w-6" />
          </div>
        </div>
        <div className="mb-6">
          {syncMode === 'auto' ? (
            <div>
              <p className="text-xl font-black text-[#111111] border-l-2 border-[#111111] pl-3 py-1 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Today, 18:00</p>
              <p className="text-sm text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>Automatic daily backup scheduled</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-black text-[#CC0000] border-l-2 border-[#CC0000] pl-3 py-1 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>UNSCHEDULED</p>
              <p className="text-sm text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>Auto backup is disabled</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-[#111111] flex justify-between items-center">
          <div className="text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ENABLE AUTO
          </div>
          <Switch
            checked={syncMode === 'auto'}
            onChange={(checked) => setSyncMode(checked ? 'auto' : 'manual')}
          />
        </div>
      </div>
    </div>
  );

  const SyncProgress = () => (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#111111] text-[#F9F9F7] mb-6 border-b-4 border-[#CC0000] p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b-2 border-[#404040] pb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 border-2 border-[#F9F9F7]">
                {syncProgress.uploading ?
                  <HiOutlineUpload className="h-8 w-8" /> :
                  <HiOutlineDownload className="h-8 w-8" />
                }
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {syncProgress.uploading ? 'UPLOADING ARCHIVE' : 'PROCESSING ARCHIVE'}
                </h3>
                <p className="text-[#A3A3A3] text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>
                  Please keep the application open
                </p>
              </div>
            </div>

            <div className="border border-[#404040] p-4 text-center min-w-[150px]">
              <p className="text-[0.65rem] text-[#A3A3A3] uppercase tracking-widest mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>EST. TIME</p>
              <p className="font-bold text-xl">{Math.round((100 - syncProgress.current) / 10)}s</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>{syncProgress.current}% COMPLETE</span>
              <span className="text-[#A3A3A3]">{syncProgress.current < 50 ? 'PREPARING DATA...' : 'ENCRYPTING AND UPLOADING...'}</span>
            </div>

            <div className="w-full h-4 border-2 border-[#F9F9F7] bg-[#111111]">
              <motion.div
                className="h-full bg-[#CC0000]"
                style={{ width: `${syncProgress.current}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${syncProgress.current}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <div className={`h-2 flex-1 border ${syncProgress.current >= 25 ? 'bg-[#CC0000] border-[#CC0000]' : 'bg-transparent border-[#404040]'}`}></div>
              <div className={`h-2 flex-1 border ${syncProgress.current >= 50 ? 'bg-[#CC0000] border-[#CC0000]' : 'bg-transparent border-[#404040]'}`}></div>
              <div className={`h-2 flex-1 border ${syncProgress.current >= 75 ? 'bg-[#CC0000] border-[#CC0000]' : 'bg-transparent border-[#404040]'}`}></div>
              <div className={`h-2 flex-1 border ${syncProgress.current >= 100 ? 'bg-[#CC0000] border-[#CC0000]' : 'bg-transparent border-[#404040]'}`}></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ErrorDisplay = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-8 mb-6 border-4 border-[#CC0000] bg-[#F9F9F7] newsprint-texture"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]">
              <FaExclamationCircle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-2xl text-[#CC0000] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>SYSTEM ERROR DETECTED</h3>
              <p className="text-[#111111] mt-2 font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>{error}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => setError(null)}
                  className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  DISMISS
                </button>
                <button
                  onClick={handleSync}
                  className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <FaSyncAlt /> RETRY OPERATION
                </button>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-2 border border-[#111111] hover:bg-[#E5E5E0] text-[#111111]"
            >
              <FaTimes />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const RecoveryPanel = () => (
    <div className="border-b-4 border-[#111111] bg-[#F9F9F7] mb-6">
      <div className="bg-[#111111] text-[#F9F9F7] p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
              <FaUndo className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>ARCHIVE RECOVERY</h3>
              <p className="text-[#A3A3A3] mt-2 max-w-md" style={{ fontFamily: "'Lora', serif" }}>Restore your data to a previously recorded state.</p>
            </div>
          </div>
          <button className="text-[0.65rem] font-bold text-[#F9F9F7] uppercase tracking-widest border border-[#F9F9F7] px-4 py-2 hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            VIEW ALL &rarr;
          </button>
        </div>
      </div>
      <div className="p-8 md:p-12">
        <div className="space-y-4">
          {backupVersions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-[#111111]">
              <div className="mx-auto w-16 h-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
                <FaDatabase className="text-2xl" />
              </div>
              <h3 className="text-2xl font-black text-[#111111] mb-2 uppercase tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>NO ARCHIVES FOUND</h3>
              <p className="text-[#525252] max-w-md mx-auto mb-8" style={{ fontFamily: "'Lora', serif" }}>
                Create your first backup to ensure your data is protected against loss or corruption.
              </p>
              <button
                onClick={handleSync}
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] flex items-center gap-2 mx-auto"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaSyncAlt /> INITIALIZE BACKUP
              </button>
            </div>
          ) : (
            backupVersions.map((version) => (
              <div
                key={version.id}
                className="p-6 border-2 border-[#111111] hover:bg-[#E5E5E0] hard-shadow-hover transition-all bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-6">
                  <div className={`p-4 border-2 border-[#111111] ${version.type === 'auto' ? 'bg-[#111111] text-[#F9F9F7]' : 'bg-[#CC0000] text-[#F9F9F7]'
                    }`}>
                    {version.type === 'auto' ? <FaClock className="h-6 w-6" /> : <FaDatabase className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-xl text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>{formatDate(version.timestamp)}</h4>
                      <span className={`text-[0.65rem] font-bold uppercase tracking-widest px-2 py-1 border border-[#111111] ${version.type === 'auto' ? 'bg-[#111111] text-[#F9F9F7]' : 'bg-transparent text-[#111111]'
                        }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {version.type === 'auto' ? 'AUTO' : 'MANUAL'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span className="flex items-center gap-1">
                        <FaDatabase /> {version.size}
                      </span>
                      <span className="w-1 h-1 bg-[#111111]"></span>
                      <span>ID: {version.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={() => handleVerifyBackup(version.id)}
                    disabled={isLoading}
                    className="flex-1 md:flex-none p-3 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Verify backup integrity"
                  >
                    <FaCheckCircle className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleUploadToGoogleDrive(version.id)}
                    disabled={isLoading}
                    className="flex-1 md:flex-none p-3 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload to Google Drive"
                  >
                    <FaCloudUploadAlt className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleRestore(version.id)}
                    disabled={isLoading || !version.restorable}
                    className="flex-1 md:flex-none p-3 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Restore this backup"
                  >
                    <FaUndo className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(version.id)}
                    disabled={isLoading}
                    className="flex-1 md:flex-none p-3 border-2 border-[#CC0000] bg-[#F9F9F7] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete this backup"
                  >
                    <FaTrash className="mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}

          {backupVersions.length > 0 && (
            <div className="text-center pt-8">
              <button className="text-xs font-black text-[#111111] uppercase tracking-widest border-b-2 border-[#111111] hover:text-[#CC0000] hover:border-[#CC0000] pb-1 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                LOAD OLDER ARCHIVES &darr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const RecoveryProgress = () => (
    <AnimatePresence>
      {recoveryStatus.inProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-[#F9F9F7] border-4 border-[#111111] mb-6 hard-shadow"
        >
          <div className="bg-[#111111] text-[#F9F9F7] p-6 border-b-4 border-[#111111]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7]">
                  <FaCloudDownloadAlt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>RECOVERY IN PROGRESS</h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>Restoring your data to a previous state.</p>
                </div>
              </div>
              <div className="bg-[#F9F9F7] text-[#111111] px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-[#F9F9F7]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {recoveryStatus.progress}% COMPLETE
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="text-[#525252]">PROGRESS</span>
                  <span className="text-[#111111]">{recoveryStatus.estimatedTime}</span>
                </div>
                <div className="w-full h-4 border-2 border-[#111111] bg-white">
                  <motion.div
                    className="h-full bg-[#CC0000]"
                    style={{ width: `${recoveryStatus.progress}%` }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${recoveryStatus.progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white border-2 border-[#111111] p-6">
                <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#525252] mb-3 border-b-2 border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  CURRENT OPERATION
                </div>
                <div className="flex items-center gap-4">
                  <div className="animate-pulse p-4 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                    <FaDatabase />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-[#111111] uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{recoveryStatus.currentFile}</div>
                    <div className="h-2 w-full border border-[#111111] bg-white mt-3">
                      <div className="h-full bg-[#111111] animate-pulse" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-[#CC0000] border-2 border-[#111111] text-[#F9F9F7] px-6 py-3 inline-flex items-center gap-3">
                  <FaExclamationTriangle className="text-xl" />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>DO NOT CLOSE THE APPLICATION DURING RECOVERY</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const DeviceManagement = () => (
    <div className="bg-[#F9F9F7] border-4 border-[#111111] mb-6 hard-shadow">
      <div className="bg-[#111111] p-6 text-[#F9F9F7] flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#111111]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7]">
            <FaLaptop className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>CONNECTED DEVICES</h3>
            <p className="text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>Manage device synchronization and remote access.</p>
          </div>
        </div>
        <button className="px-6 py-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors text-[0.65rem] font-bold uppercase tracking-widest flex items-center gap-2">
          <FaPlus size={12} /> ADD NEW DEVICE
        </button>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map(device => (
            <div
              key={device.id}
              className="bg-white border-4 border-[#111111] p-0 flex flex-col hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#111111] transition-all"
            >
              <div className="p-6 flex items-start justify-between border-b-2 border-[#111111] bg-[#F9F9F7]">
                <div className="flex items-start gap-4">
                  <div className={`p-4 border-2 border-[#111111] ${device.status === 'online' ? 'bg-[#111111] text-[#F9F9F7]' : 'bg-white text-[#111111]'}`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-[#111111] uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {device.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {device.status === 'online' && (
                        <span className="flex items-center gap-1 text-[0.65rem] font-bold text-[#111111] bg-[#E5E5E0] px-2 py-1 uppercase tracking-widest border border-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <span className="w-2 h-2 bg-[#CC0000] border border-[#111111] animate-pulse"></span>
                          ONLINE
                        </span>
                      )}
                      {device.isCurrent && (
                        <span className="text-[0.65rem] font-bold text-[#F9F9F7] bg-[#111111] px-2 py-1 uppercase tracking-widest border border-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          CURRENT DEVICE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest border-b border-dashed border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-[#525252]">OS / BROWSER</span>
                    <span className="text-[#111111] text-right">{device.os} &bull; {device.browser || 'APP'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest border-b border-dashed border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-[#525252]">LAST ACTIVE</span>
                    <span className="text-[#111111] text-right">{device.lastActive === 'Now' ? 'JUST NOW' : device.lastActive}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest border-b border-dashed border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-[#525252]">IP ADDRESS</span>
                    <span className="text-[#111111] text-right">{device.ip}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-[#525252]">LAST SYNC</span>
                    <span className="text-[#111111] text-right flex items-center gap-1 justify-end">
                      <IoCloudDone /> {formatDate(device.lastSync).split(',')[0]}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mt-auto">
                  {device.status === 'online' && (
                    <button
                      onClick={handleSync}
                      className="flex-1 p-3 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] hover:bg-[#333333] transition-colors text-[0.65rem] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaSyncAlt /> SYNC NOW
                    </button>
                  )}
                  {!device.isCurrent && (
                    <button
                      className="flex-1 p-3 border-2 border-[#111111] bg-white text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors text-[0.65rem] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaSignOutAlt /> REMOVE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SyncHistoryPanel = () => (
    <div className="border-b-4 border-[#111111] bg-[#F9F9F7] mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between p-8 border-b-2 border-[#111111]">
        <div className="flex items-center gap-6">
          <div className="p-4 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
            <FaHistory className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>ACTIVITY LOG</h3>
            <p className="text-[#525252] text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>Recent synchronization events across all your devices.</p>
          </div>
        </div>
        <button className="mt-6 md:mt-0 text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest border border-[#111111] px-4 py-2 hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          EXPORT LOG &darr;
        </button>
      </div>

      <div className="p-0">
        <div className="divide-y divide-[#111111]">
          {syncHistory.map((item) => (
            <div key={item.id} className="p-6 md:p-8 hover:bg-[#E5E5E0] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={`w-14 h-14 border-2 border-[#111111] flex items-center justify-center shrink-0 ${item.status === 'success' ? 'bg-[#F9F9F7]' :
                  item.status === 'error' ? 'bg-[#CC0000] text-[#F9F9F7]' :
                    'bg-[#111111] text-[#F9F9F7]'
                  }`}>
                  {item.status === 'success' ? <FaCheckCircle className={item.status === 'success' ? 'text-[#111111] text-xl' : 'text-[#F9F9F7] text-xl'} /> :
                    item.status === 'error' ? <FaExclamationTriangle className="text-xl text-[#F9F9F7]" /> :
                      <FaSpinner className="animate-spin text-xl text-[#F9F9F7]" />}
                </div>

                <div className="flex-1">
                  <h4 className="font-black text-xl text-[#111111] uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {item.action === 'upload' ? 'BACKUP CREATED' : item.action === 'download' ? 'RESTORED FROM BACKUP' : 'SYNC COMPLETED'}
                  </h4>
                  <p className="text-sm font-bold text-[#525252] uppercase tracking-widest mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.device}
                  </p>
                  {item.status === 'error' && (
                    <p className="text-xs text-[#CC0000] font-bold mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Error processing request.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 border-[#111111] pt-4 md:pt-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-[#111111] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {(item.changes ?? 0) > 0
                      ? `+${item.changes} ITEMS`
                      : 'NO CHANGES'}
                  </div>
                  <div className="text-xs text-[#525252] font-bold mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {item.size}
                  </div>
                </div>

                <div className="text-right border-l-2 border-[#111111] pl-6">
                  <div className="text-sm font-black text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {formatDate(item.date).split(',')[0]}
                  </div>
                  <div className="text-xs font-bold text-[#525252] uppercase tracking-widest mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDate(item.date).split(',')[1]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t-2 border-[#111111] text-center bg-[#E5E5E0]">
        <button className="text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest hover:underline" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          VIEW FULL HISTORY
        </button>
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#F9F9F7] border-4 border-[#111111] overflow-hidden mb-6 hard-shadow"
        >
          <div className="bg-[#111111] text-[#F9F9F7] px-8 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                <FaCog className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>SYSTEM SETTINGS</h3>
                <p className="text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>Configure your backup preferences and retention policies.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="p-3 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h4 className="font-black text-xl text-[#111111] flex items-center gap-3 uppercase tracking-widest border-b-2 border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <FaDatabase /> BACKUP OPTIONS
                </h4>

                <div className="p-6 border-2 border-[#111111] bg-white hover:bg-[#E5E5E0] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="font-black text-lg text-[#111111] uppercase tracking-wide">AUTO-BACKUP</label>
                      <p className="text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>Automatically backup your data according to schedule.</p>
                    </div>
                    <Switch
                      checked={syncMode === 'auto'}
                      onChange={(checked) => setSyncMode(checked ? 'auto' : 'manual')}
                    />
                  </div>

                  <AnimatePresence>
                    {syncMode === 'auto' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 mt-4 border-t-2 border-[#111111]">
                          <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            BACKUP FREQUENCY
                          </label>
                          <select
                            value={backupSettings.frequency}
                            onChange={(e) => setBackupSettings(prev => ({
                              ...prev,
                              frequency: e.target.value as any
                            }))}
                            className="w-full p-4 border-2 border-[#111111] bg-[#F9F9F7] font-bold uppercase tracking-widest text-[#111111] focus:ring-0 focus:outline-none appearance-none"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value="daily">DAILY (RECOMMENDED)</option>
                            <option value="weekly">WEEKLY</option>
                            <option value="monthly">MONTHLY</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    STORAGE LOCATION
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setBackupSettings(prev => ({ ...prev, location: 'cloud' }))}
                      className={`flex flex-col items-center gap-4 p-6 border-2 transition-all ${backupSettings.location === 'cloud'
                        ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                        : 'border-[#111111] bg-white text-[#111111] hover:bg-[#E5E5E0]'
                        }`}
                    >
                      <FaCloud className="text-3xl" />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                        CLOUD STORAGE
                      </span>
                    </button>

                    <button
                      onClick={() => setBackupSettings(prev => ({ ...prev, location: 'local' }))}
                      className={`flex flex-col items-center gap-4 p-6 border-2 transition-all ${backupSettings.location === 'local'
                        ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                        : 'border-[#111111] bg-white text-[#111111] hover:bg-[#E5E5E0]'
                        }`}
                    >
                      <FaServer className="text-3xl" />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                        LOCAL STORAGE
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="font-black text-xl text-[#111111] flex items-center gap-3 uppercase tracking-widest border-b-2 border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <FaShieldAlt /> SECURITY & DATA
                </h4>

                <div className="p-6 border-2 border-[#111111] bg-white hover:bg-[#E5E5E0] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="font-black text-lg text-[#111111] uppercase tracking-wide">END-TO-END ENCRYPTION</label>
                      <p className="text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>Securely encrypt all your data before transmission.</p>
                    </div>
                    <Switch
                      checked={encryptionEnabled}
                      onChange={setEncryptionEnabled}
                    />
                  </div>

                  <AnimatePresence>
                    {encryptionEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 mt-4 border-t-2 border-[#111111]">
                          <div className="bg-[#CC0000] text-[#F9F9F7] p-4 flex items-start gap-4">
                            <FaExclamationTriangle className="mt-1 text-xl shrink-0" />
                            <div>
                              <p className="font-black uppercase tracking-widest text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CRITICAL WARNING</p>
                              <p className="text-sm" style={{ fontFamily: "'Lora', serif" }}>Encrypted backups cannot be recovered if you forget your master password.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    BACKUP RETENTION PERIOD <span className="text-[#CC0000]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={backupSettings.retention}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setBackupSettings(prev => ({
                          ...prev,
                          retention: value
                        }));
                        clearValidationError('retention');
                      }}
                      className={`w-full p-4 pl-12 border-2 bg-white font-bold uppercase tracking-widest text-[#111111] focus:ring-0 focus:outline-none appearance-none ${validationErrors.retention ? 'border-[#CC0000]' : 'border-[#111111]'
                        }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <option value={7}>KEEP FOR 7 DAYS</option>
                      <option value={14}>KEEP FOR 14 DAYS</option>
                      <option value={30}>KEEP FOR 30 DAYS</option>
                      <option value={90}>KEEP FOR 90 DAYS</option>
                      <option value={365}>KEEP FOR 1 YEAR</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <FaClock className="text-[#111111] text-lg" />
                    </div>
                  </div>
                  {validationErrors.retention && (
                    <ValidationError message={validationErrors.retention} />
                  )}
                  {!validationErrors.retention && (
                    <p className="mt-2 text-[0.65rem] text-[#525252] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      OLDER BACKUPS WILL BE AUTOMATICALLY DELETED TO SAVE SPACE.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-6 border-2 border-[#111111] bg-white hover:bg-[#E5E5E0] transition-colors">
                  <div>
                    <label className="font-black text-lg text-[#111111] uppercase tracking-wide">DATA COMPRESSION</label>
                    <p className="text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>Reduce backup size to save storage space.</p>
                  </div>
                  <Switch
                    checked={backupSettings.compression}
                    onChange={(checked) => setBackupSettings(prev => ({
                      ...prev,
                      compression: checked
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t-4 border-[#111111] flex justify-end gap-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-8 py-4 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                CANCEL
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={isLoading}
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaSave /> SAVE CONFIGURATION
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const AuthPrompt = () => (
    <div className="bg-[#F9F9F7] border-4 border-[#111111] p-12 max-w-2xl mx-auto my-20 hard-shadow">
      <div className="text-center flex flex-col items-center">
        <div className="w-24 h-24 border-4 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7] flex items-center justify-center mb-8 shrink-0">
          <FaLock className="text-4xl" />
        </div>
        <h3 className="text-4xl font-black mb-4 text-[#111111] uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>AUTHENTICATION REQUIRED</h3>
        <p className="text-[#525252] mb-10 max-w-md mx-auto text-lg leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
          {error || "Access to backup infrastructure is restricted. Please authenticate to verify identity."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <a
            href="/signin"
            className="flex-1 px-8 py-4 bg-[#111111] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#333333] transition-colors text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            SIGN IN
          </a>
          <button
            onClick={() => {
              setError(null);
              setIsAuthenticated(true);
            }}
            className="flex-1 px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <AuthPrompt />;
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9F7]">
        <div className="w-16 h-16 border-4 border-[#111111] border-t-[#CC0000] animate-spin mb-6"></div>
        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          INITIALIZING BACKUP SYSTEM...
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-[#111111] bg-[#F9F9F7] p-6 space-y-8"> {/* Newsprint wrapper */}
      <BackupHeader />
      <BackupSummary />
      <SyncProgress />
      <ErrorDisplay />
      <RecoveryProgress />
      <SettingsPanel />
      <RecoveryPanel />
      <DeviceManagement />
      <SyncHistoryPanel />

      {/* Backup Progress Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isLoading && setShowBackupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full max-h-[90vh] overflow-y-auto hard-shadow"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 flex justify-between items-center bg-[#111111] text-[#F9F9F7]">
                <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <FaCloudUploadAlt />
                  {syncProgress.current >= 100 ? 'ARCHIVE COMPLETE' : 'ARCHIVING DATA'}
                </h3>
                <button
                  onClick={() => !isLoading && setShowBackupModal(false)}
                  className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                  disabled={isLoading}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-8">
                {isLoading ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-flex items-center justify-center w-24 h-24 border-4 border-[#111111] bg-white mb-6"
                      >
                        <FaCloudUploadAlt className="text-4xl text-[#111111]" />
                      </motion.div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="text-[#525252]">PROGRESS</span>
                        <span className="text-[#111111]">{Math.round(syncProgress.current)}%</span>
                      </div>
                      <div className="h-4 border-2 border-[#111111] bg-white">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${syncProgress.current}%` }}
                          className="h-full bg-[#CC0000]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-[#111111] bg-white p-4 text-center">
                        <FaDatabase className="w-8 h-8 text-[#111111] mx-auto mb-3" />
                        <div className="text-3xl font-black text-[#111111]">{Math.floor(syncProgress.current * 1.56)}</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#525252] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>ITEMS SECURED</div>
                      </div>
                      <div className="border-2 border-[#111111] bg-white p-4 text-center">
                        <FaCloudUploadAlt className="w-8 h-8 text-[#111111] mx-auto mb-3" />
                        <div className="text-3xl font-black text-[#111111]">{Math.floor(syncProgress.current * 2.5)} MB</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#525252] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>DATA UPLOADED</div>
                      </div>
                    </div>

                    <div className="border-2 border-[#111111] bg-white p-4">
                      <div className="flex items-center gap-3 mb-4 border-b-2 border-[#111111] pb-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 bg-[#CC0000] border border-[#111111]"
                        ></motion.div>
                        <span className="text-sm font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CURRENT ACTIVITY</span>
                      </div>
                      <div className="space-y-2 text-sm text-[#525252] font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <FaChevronRight className="text-[#CC0000]" size={10} />
                          <span>
                            {syncProgress.current < 30 ? 'COLLECTING DATA...' :
                              syncProgress.current < 60 ? 'ENCRYPTING FILES...' :
                                syncProgress.current < 90 ? 'UPLOADING TO CLOUD...' :
                                  'FINALIZING BACKUP...'}
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    <div className="bg-[#111111] text-[#F9F9F7] p-4 flex items-start gap-4">
                      <FaLock className="mt-1 text-xl shrink-0" />
                      <div className="text-sm" style={{ fontFamily: "'Lora', serif" }}>
                        <p className="font-black uppercase tracking-widest text-[0.65rem] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SECURE BACKUP</p>
                        <p>Your data is being encrypted with AES-256 encryption.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center py-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-24 h-24 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] mb-6"
                      >
                        <FaCheckCircle className="text-4xl" />
                      </motion.div>
                      <h4 className="text-3xl font-black text-[#111111] mb-2 uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>ARCHIVE SUCCESSFUL</h4>
                      <p className="text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>Your data has been securely backed up.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-[#111111] bg-white p-4 text-center">
                        <FaDatabase className="w-8 h-8 text-[#111111] mx-auto mb-3" />
                        <div className="text-3xl font-black text-[#111111]">{syncStatus.items}</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#525252] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>ITEMS SECURED</div>
                      </div>
                      <div className="border-2 border-[#111111] bg-white p-4 text-center">
                        <FaCloudUploadAlt className="w-8 h-8 text-[#111111] mx-auto mb-3" />
                        <div className="text-3xl font-black text-[#111111]">{Math.floor(syncStatus.items * 0.5)} MB</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#525252] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TOTAL SIZE</div>
                      </div>
                    </div>

                    <div className="border-2 border-[#111111] bg-white p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#111111] text-[#F9F9F7]">
                          <FaShieldAlt className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-black text-[#111111] mb-3 uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>ARCHIVE DETAILS</h5>
                          <div className="space-y-2 text-sm text-[#525252] font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <div className="flex items-center gap-3">
                              <FaCheckCircle className="text-[#111111]" />
                              <span>END-TO-END ENCRYPTED</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FaCheckCircle className="text-[#111111]" />
                              <span>SECURELY STORED</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FaCheckCircle className="text-[#111111]" />
                              <span>ID: V{backupVersions.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 border-[#111111] flex justify-end">
                      <button
                        onClick={() => setShowBackupModal(false)}
                        className="px-8 py-4 bg-[#111111] text-[#F9F9F7] font-black uppercase tracking-widest text-xs hover:bg-[#333333] transition-colors"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        CLOSE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selective Backup Modal */}
      <AnimatePresence>
        {showSelectiveBackup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowSelectiveBackup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F9F7] border-4 border-[#111111] max-w-4xl w-full my-8 hard-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#111111] p-6 text-[#F9F9F7]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <FaDatabase /> SELECTIVE ARCHIVE
                    </h3>
                    <p className="text-sm mt-1" style={{ fontFamily: "'Lora', serif" }}>Choose specific items to include in this backup.</p>
                  </div>
                  <button
                    onClick={() => setShowSelectiveBackup(false)}
                    className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[calc(90vh-250px)] overflow-y-auto">
                <div className="mb-8">
                  <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <FaLaptop className="inline mr-2" />
                    TARGET DEVICE (OPTIONAL)
                  </label>
                  <select
                    value={selectedBackupDevice}
                    onChange={(e) => setSelectedBackupDevice(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#111111] bg-white font-bold uppercase tracking-widest text-[#111111] focus:ring-0 focus:outline-none appearance-none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <option value="">ALL REGISTERED DEVICES</option>
                    {availableDevices.map((device: any) => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.type}) - {device.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-8 p-6 bg-[#111111] text-[#F9F9F7] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SELECTION SUMMARY:</div>
                  <div className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {selectedItems.passwordIds.length + selectedItems.documentIds.length + selectedItems.qrcodeIds.length} ITEMS
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="flex items-center gap-2 border border-[#F9F9F7] px-3 py-1"><FaLock /> {selectedItems.passwordIds.length} PASSWORDS</span>
                    <span className="flex items-center gap-2 border border-[#F9F9F7] px-3 py-1"><FaDatabase /> {selectedItems.documentIds.length} DOCS</span>
                    <span className="flex items-center gap-2 border border-[#F9F9F7] px-3 py-1"><FaShieldAlt /> {selectedItems.qrcodeIds.length} QRS</span>
                  </div>
                </div>

                <div className="space-y-8">
                  {selectablePasswords.length > 0 && (
                    <div className="border-2 border-[#111111] bg-white">
                      <div className="bg-[#E5E5E0] p-4 border-b-2 border-[#111111]">
                        <h4 className="font-black text-[#111111] uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <FaLock /> PASSWORDS & CARDS ({selectablePasswords.length})
                        </h4>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto divide-y divide-[#111111]">
                        {selectablePasswords.map((password) => (
                          <div
                            key={password._id}
                            className="flex items-center gap-4 py-3 hover:bg-[#F9F9F7] cursor-pointer transition-colors"
                            onClick={() => toggleItemSelection('password', password._id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.passwordIds.includes(password._id)}
                              onChange={() => toggleItemSelection('password', password._id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5 h-5 border-2 border-[#111111] bg-white checked:bg-[#111111] appearance-none"
                            />
                            <FaLock className="text-[#111111]" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[#111111] block truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {password.title}
                              </span>
                              {password.website && (
                                <span className="text-xs text-[#525252] block truncate" style={{ fontFamily: "'Lora', serif" }}>
                                  {password.website}
                                </span>
                              )}
                            </div>
                            {password.category && (
                              <span className="text-[0.65rem] px-2 py-1 border border-[#111111] font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {password.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectableDocuments.length > 0 && (
                    <div className="border-2 border-[#111111] bg-white">
                      <div className="bg-[#E5E5E0] p-4 border-b-2 border-[#111111]">
                        <h4 className="font-black text-[#111111] uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <FaDatabase /> SECURE DOCUMENTS ({selectableDocuments.length})
                        </h4>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto divide-y divide-[#111111]">
                        {selectableDocuments.map((doc) => (
                          <div
                            key={doc._id}
                            className="flex items-center gap-4 py-3 hover:bg-[#F9F9F7] cursor-pointer transition-colors"
                            onClick={() => toggleItemSelection('document', doc._id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.documentIds.includes(doc._id)}
                              onChange={() => toggleItemSelection('document', doc._id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5 h-5 border-2 border-[#111111] bg-white checked:bg-[#111111] appearance-none flex-shrink-0"
                            />
                            <FaDatabase className="text-[#111111] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[#111111] block truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {doc.fileName}
                              </span>
                              <span className="text-xs text-[#525252] block" style={{ fontFamily: "'Lora', serif" }}>
                                {doc.fileType} &bull; {formatBytes(doc.fileSize)}
                              </span>
                            </div>
                            {doc.category && (
                              <span className="text-[0.65rem] px-2 py-1 border border-[#111111] font-bold uppercase tracking-widest flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {doc.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectableQRCodes.length > 0 && (
                    <div className="border-2 border-[#111111] bg-white">
                      <div className="bg-[#E5E5E0] p-4 border-b-2 border-[#111111]">
                        <h4 className="font-black text-[#111111] uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <FaShieldAlt /> QR CODES ({selectableQRCodes.length})
                        </h4>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto divide-y divide-[#111111]">
                        {selectableQRCodes.map((qr) => (
                          <div
                            key={qr._id}
                            className="flex items-center gap-4 py-3 hover:bg-[#F9F9F7] cursor-pointer transition-colors"
                            onClick={() => toggleItemSelection('qrcode', qr._id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.qrcodeIds.includes(qr._id)}
                              onChange={() => toggleItemSelection('qrcode', qr._id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5 h-5 border-2 border-[#111111] bg-white checked:bg-[#111111] appearance-none flex-shrink-0"
                            />
                            <FaShieldAlt className="text-[#111111] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[#111111] block truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {qr.title}
                              </span>
                              <span className="text-xs text-[#525252] block" style={{ fontFamily: "'Lora', serif" }}>
                                {qr.qrType} &bull; SCANS: {qr.scanCount}
                              </span>
                            </div>
                            <span className={`text-[0.65rem] px-2 py-1 border font-bold uppercase tracking-widest ${qr.isActive ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]' : 'border-[#111111] text-[#111111]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {qr.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectablePasswords.length === 0 && selectableDocuments.length === 0 && selectableQRCodes.length === 0 && (
                    <div className="p-12 border-4 border-dashed border-[#111111] text-center">
                      <FaDatabase className="mx-auto text-5xl text-[#111111] mb-6" />
                      <h4 className="text-2xl font-black uppercase tracking-tighter mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>VAULT IS EMPTY</h4>
                      <p className="text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                        Add passwords, documents, or QR codes to enable selective backup.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t-4 border-[#111111] bg-[#F9F9F7] flex flex-wrap justify-between items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedItems({ passwordIds: [], documentIds: [], qrcodeIds: [] });
                    setSelectedBackupDevice('');
                  }}
                  className="px-6 py-3 border border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  CLEAR SELECTION
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowSelectiveBackup(false)}
                    className="px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSelectiveBackup}
                    disabled={isLoading || (selectedItems.passwordIds.length === 0 && selectedItems.documentIds.length === 0 && selectedItems.qrcodeIds.length === 0)}
                    className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] disabled:opacity-50 flex items-center gap-2 transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <FaCloudUploadAlt />
                    {isLoading ? 'CREATING ARCHIVE...' : 'CREATE BACKUP'}
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

export default BackUp;