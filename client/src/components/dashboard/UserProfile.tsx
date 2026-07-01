import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../services/supabaseClient';
import {
  FaShieldAlt, FaCreditCard, FaBell, FaKey, FaUserCog,
  FaHistory, FaCrown, FaFingerprint, FaCamera, FaEnvelope,
  FaLanguage, FaMoon, FaLock, FaTrash, FaDownload, FaArrowLeft,
  FaBriefcase, FaMapMarkerAlt, FaPhoneAlt, FaGlobe,
  FaLinkedin, FaGithub, FaTwitter, FaCalendarAlt,
  FaGraduationCap, FaIdCard, FaBirthdayCake, FaPassport,
  FaUserTie, FaBuilding, FaAddressCard,
  FaUser, FaCheckCircle, FaFileInvoiceDollar, FaReceipt, FaFilePdf,
  FaCcVisa, FaCcMastercard, FaFileSignature, FaFileContract,
  FaFileAlt, FaFileMedical, FaQrcode, FaListAlt, FaEdit,
  FaUserSecret, FaUsers, FaShieldVirus, FaFileExport, FaEllipsisH,
  FaExclamationTriangle, FaChevronRight, FaCog, FaSave, FaSpinner, FaUpload, FaTimes
} from 'react-icons/fa';
import { HiOutlineUserCircle } from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Country to phone code mapping
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'india': '+91', 'united states': '+1', 'usa': '+1', 'united kingdom': '+44',
  'uk': '+44', 'canada': '+1', 'australia': '+61', 'germany': '+49',
  'france': '+33', 'japan': '+81', 'china': '+86', 'brazil': '+55',
  'russia': '+7', 'south korea': '+82', 'spain': '+34', 'italy': '+39',
  'mexico': '+52', 'indonesia': '+62', 'netherlands': '+31', 'saudi arabia': '+966',
  'turkey': '+90', 'switzerland': '+41', 'poland': '+48', 'belgium': '+32',
  'sweden': '+46', 'norway': '+47', 'austria': '+43', 'denmark': '+45',
  'finland': '+358', 'singapore': '+65', 'malaysia': '+60', 'thailand': '+66',
  'philippines': '+63', 'vietnam': '+84', 'pakistan': '+92', 'bangladesh': '+880',
  'egypt': '+20', 'nigeria': '+234', 'south africa': '+27', 'argentina': '+54',
  'colombia': '+57', 'chile': '+56', 'peru': '+51', 'uae': '+971',
  'united arab emirates': '+971', 'israel': '+972', 'greece': '+30',
  'portugal': '+351', 'new zealand': '+64', 'ireland': '+353',
  'czech republic': '+420', 'romania': '+40', 'hungary': '+36',
};

interface IUserProfile {
  name: string;
  email: string;
  role: string;
  preferences: { theme: string; notifications: boolean; language: string; };
  avatar: string;
  memberSince: string;
  lastLogin: string;
  securityScore: number;
  twoFactorEnabled: boolean;
  totalDevices: number;
  activeSubscription: string;
  nextBilling: string;
  personalInfo: { dateOfBirth: string; phoneNumber: string; nationality: string; maritalStatus: string; gender: string; };
  professionalInfo: {
    occupation: string; company: string; department: string;
    employeeId: string; experience: string;
    education: { degree: string; institution: string; year: string; }[];
  };
  address: { street: string; city: string; state: string; country: string; postalCode: string; };
  socialProfiles: { linkedin: string; github: string; twitter: string; website: string; };
  identityDocuments: { type: string; number: string; expiryDate: string; }[];
  bankingInfo: { accountHolder: string; accountType: string; lastFourDigits: string; };
  security: {
    lastPasswordChange: string; loginAttempts: number; securityQuestions: number;
    activeDevices: number;
    loginHistory: Array<{ device: string; browser?: string; location: string; timestamp?: string; time?: string; status: 'success' | 'failed'; }>;
    recoveryEmail?: string; backupCodes: number;
  };
  documents: {
    identity: Array<{ id?: string; type: string; number?: string; expiryDate?: string; status?: 'active' | 'expired'; fileName?: string; fileSize?: number; mimeType?: string; uploadedAt?: string; }>;
    financial: Array<{ id?: string; type: string; institution?: string; lastUpdated?: string; fileName?: string; fileSize?: number; mimeType?: string; uploadedAt?: string; }>;
  };
  billing: {
    paymentMethods: Array<{ id?: string; type: 'credit' | 'debit'; provider: string; lastFour: string; expiryDate: string; isDefault: boolean; cardHolderName?: string; addedAt?: string; }>;
    invoices: Array<{ id: string; invoiceId?: string; date: string; amount: number; status: 'paid' | 'pending'; description?: string; downloadUrl: string; }>;
    subscriptionHistory: Array<{ id?: string; plan: string; startDate: string; endDate: string; amount: number; status: 'active' | 'expired'; }>;
  };
}

// ─── Shared Newsprint Input/Label classes ─────────────────────────────────────
const npInput = (hasError?: boolean) =>
  `w-full px-4 py-2.5 border-2 ${hasError ? 'border-[#CC0000]' : 'border-[#111111]'} bg-[#F9F9F7] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all`;
const npLabel = `block text-xs font-black uppercase tracking-widest text-[#111111] mb-2`;
const npSelect = (hasError?: boolean) =>
  `w-full px-4 py-2.5 border-2 ${hasError ? 'border-[#CC0000]' : 'border-[#111111]'} bg-[#F9F9F7] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all appearance-none`;

// ─── ValidationError ──────────────────────────────────────────────────────────
const ValidationError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-[#CC0000] text-xs mt-1.5 flex items-center gap-1 font-black uppercase tracking-wider"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  );
};

// ─── UserProfileHeader ────────────────────────────────────────────────────────
const UserProfileHeader: React.FC<{ profile: IUserProfile; onEditClick: () => void; }> = ({ profile, onEditClick }) => (
  <div className="relative border-4 border-[#111111] bg-[#111111] mb-8">
    <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
      {/* Avatar */}
      <div className="relative group flex-shrink-0">
        <div className="w-28 h-28 border-4 border-[#F9F9F7] bg-[#E5E5E0] overflow-hidden">
          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        <button
          onClick={onEditClick}
          className="absolute bottom-0 right-0 p-2 bg-[#F9F9F7] text-[#111111] border-2 border-[#F9F9F7] hover:bg-[#CC0000] hover:text-[#F9F9F7] hover:border-[#CC0000] transition-all"
          aria-label="Edit avatar"
        >
          <FaCamera className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Identity */}
      <div className="text-center md:text-left text-[#F9F9F7]">
        <div className="text-xs font-black uppercase tracking-widest text-[#E5E5E0] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          USER PROFILE
        </div>
        <h1 className="text-3xl font-black leading-tight text-[#F9F9F7]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {profile.name}
        </h1>
        <p className="text-[#E5E5E0] mt-1" style={{ fontFamily: "'Lora', serif" }}>{profile.email}</p>
        <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
          <span className="px-3 py-1 bg-[#F9F9F7] text-[#111111] text-xs font-black uppercase tracking-widest border border-[#F9F9F7]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {profile.role}
          </span>
          {profile.twoFactorEnabled && (
            <span className="px-3 py-1 bg-[#CC0000] text-[#F9F9F7] text-xs font-black uppercase tracking-widest border border-[#CC0000] flex items-center gap-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <FaShieldAlt size={10} /> 2FA ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ml-auto hidden lg:flex items-stretch divide-x-2 divide-[#E5E5E0] border-l-2 border-[#E5E5E0] pl-8">
        {[
          { value: `${profile.securityScore}%`, label: 'SECURITY SCORE' },
          { value: String(profile.totalDevices), label: 'DEVICES' },
          { value: profile.memberSince, label: 'MEMBER SINCE' },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center justify-center px-8 first:pl-0">
            <span className="text-2xl font-black text-[#F9F9F7]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {stat.value}
            </span>
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#A3A3A3] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Footer bar */}
    <div className="bg-[#F9F9F7] flex items-center justify-between px-6 sm:px-8 py-2.5 border-t-4 border-[#111111]">
      <div className="text-[#525252] text-xs flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <FaHistory size={11} /> LAST LOGIN: {profile.lastLogin}
      </div>
      <button
        onClick={onEditClick}
        className="p-2 text-[#111111] hover:bg-[#E5E5E0] transition-all"
        title="Edit Profile"
        aria-label="Edit profile"
      >
        <FaEdit className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ─── ProfileSection ───────────────────────────────────────────────────────────
const ProfileSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-[#F9F9F7] border-4 border-[#111111] overflow-hidden"
  >
    <div className="p-4 sm:p-5 border-b-4 border-[#111111] flex items-center gap-3 bg-[#E5E5E0]">
      {icon && <span className="text-[#111111]">{icon}</span>}
      <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </motion.div>
);

// ─── InfoCard ─────────────────────────────────────────────────────────────────
const InfoCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-4 bg-[#E5E5E0] hover:bg-[#F9F9F7] border-2 border-[#111111] transition-all group">
    <div className="flex items-start gap-3">
      {icon && <div className="text-[#111111] mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-[#525252] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </p>
        <p className="font-black text-[#111111] truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{value || '—'}</p>
      </div>
    </div>
  </div>
);

// ─── PersonalInfoCard ─────────────────────────────────────────────────────────
const PersonalInfoCard: React.FC<{ info: IUserProfile['personalInfo'] }> = ({ info }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <InfoCard label="Date of Birth" value={info.dateOfBirth} icon={<FaBirthdayCake />} />
    <InfoCard label="Phone Number" value={info.phoneNumber} icon={<FaPhoneAlt />} />
    <InfoCard label="Nationality" value={info.nationality} icon={<FaPassport />} />
    <InfoCard label="Marital Status" value={info.maritalStatus} icon={<FaUsers />} />
    <InfoCard label="Gender" value={info.gender} icon={<FaUserSecret />} />
  </div>
);

// ─── AddressCard ──────────────────────────────────────────────────────────────
const AddressCard: React.FC<{ address: IUserProfile['address'] }> = ({ address }) => (
  <div className="p-5 bg-[#F9F9F7] border-2 border-[#111111]">
    <div className="flex items-start gap-4">
      <div className="p-3 border-2 border-[#111111] bg-[#E5E5E0] text-[#111111] flex-shrink-0">
        <FaMapMarkerAlt className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-black text-[#111111] text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          {address.street}
        </p>
        <p className="text-[#525252] mt-1" style={{ fontFamily: "'Lora', serif" }}>
          {address.city}, {address.state}
        </p>
        <p className="text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
          {address.country} — {address.postalCode}
        </p>
      </div>
    </div>
  </div>
);

// ─── ProfessionalInfoCard ─────────────────────────────────────────────────────
const ProfessionalInfoCard: React.FC<{ info: IUserProfile['professionalInfo'] }> = ({ info }) => (
  <div className="space-y-6">
    {/* Role block */}
    <div className="p-5 bg-[#111111] border-2 border-[#111111]">
      <div className="flex items-center gap-4">
        <div className="p-3 border-2 border-[#F9F9F7] bg-transparent text-[#F9F9F7]">
          <FaBriefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-xl text-[#F9F9F7]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {info.occupation}
          </h3>
          <p className="text-[#E5E5E0] text-sm mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
            {info.company}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'DEPARTMENT', value: info.department },
          { label: 'EMPLOYEE ID', value: info.employeeId },
          { label: 'EXPERIENCE', value: info.experience },
        ].map((item) => (
          <div key={item.label} className="border border-[#E5E5E0] p-3">
            <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#A3A3A3] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {item.label}
            </p>
            <p className="font-black text-[#F9F9F7] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {item.value || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Education */}
    <div>
      <h3 className="text-xs font-black uppercase tracking-widest text-[#525252] mb-3 flex items-center gap-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <FaGraduationCap /> EDUCATION
      </h3>
      <div className="space-y-3">
        {info.education.map((edu, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-stretch border-2 border-[#111111] hover:shadow-[4px_4px_0px_0px_#111111] transition-all"
          >
            <div className="w-1.5 bg-[#111111] flex-shrink-0" />
            <div className="p-4 flex-1">
              <p className="font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {edu.degree}
              </p>
              <p className="text-[#525252] text-sm mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                {edu.institution}
              </p>
              <p className="text-xs font-black uppercase tracking-widest text-[#525252] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                CLASS OF {edu.year}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

// ─── SocialProfilesCard ───────────────────────────────────────────────────────
const SocialProfilesCard: React.FC<{ profiles: IUserProfile['socialProfiles'] }> = ({ profiles }) => {
  const platformConfig: Record<string, { icon: React.ReactNode; label: string }> = {
    linkedin: { icon: <FaLinkedin />, label: 'LINKEDIN' },
    github: { icon: <FaGithub />, label: 'GITHUB' },
    twitter: { icon: <FaTwitter />, label: 'TWITTER / X' },
    website: { icon: <FaGlobe />, label: 'WEBSITE' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(profiles).map(([platform, url]) => (
        <a
          key={platform}
          href={url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all group"
        >
          <div className="p-2.5 border-2 border-[#111111] bg-[#E5E5E0] text-[#111111] group-hover:border-[#F9F9F7] group-hover:bg-[#F9F9F7] group-hover:text-[#111111] transition-all">
            {platformConfig[platform]?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[0.6rem] font-black uppercase tracking-widest block mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {platformConfig[platform]?.label || platform.toUpperCase()}
            </span>
            <span className="text-sm block truncate" style={{ fontFamily: "'Lora', serif" }}>
              {url ? url.replace(/^https?:\/\//, '') : 'Not set'}
            </span>
          </div>
          <FaChevronRight className="flex-shrink-0 opacity-40 group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
};

// ─── SecuritySection ──────────────────────────────────────────────────────────
const SecuritySection: React.FC<{
  security: IUserProfile['security'];
  onUpdateRecoveryEmail: (email: string) => Promise<boolean>;
  onGenerateBackupCodes: () => Promise<boolean>;
}> = ({ security, onUpdateRecoveryEmail, onGenerateBackupCodes }) => {
  const [showRecoveryEmail, setShowRecoveryEmail] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState(security.recoveryEmail || '');

  const handleUpdateEmail = async () => {
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    const success = await onUpdateRecoveryEmail(recoveryEmail);
    if (success) setShowRecoveryEmail(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-[#111111] divide-x-2 divide-[#111111]">
        {[
          { icon: <FaLock />, label: 'LAST PWD CHANGE', value: security.lastPasswordChange },
          { icon: <FaQrcode />, label: 'BACKUP CODES', value: `${security.backupCodes} LEFT` },
          { icon: <FaCheckCircle />, label: 'SECURITY Q&A', value: `${security.securityQuestions} SET` },
          { icon: <FaUserCog />, label: 'ACTIVE DEVICES', value: String(security.activeDevices) },
        ].map((item, i) => (
          <div key={i} className="p-4 flex flex-col items-center text-center bg-[#F9F9F7] hover:bg-[#E5E5E0] transition-colors">
            <div className="text-[#111111] text-lg mb-2">{item.icon}</div>
            <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#525252] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {item.label}
            </p>
            <p className="font-black text-[#111111] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Recovery Email */}
      <div className="border-2 border-[#111111]">
        <div className="p-4 border-b-2 border-[#111111] bg-[#E5E5E0] flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <FaEnvelope className="inline mr-2" />RECOVERY EMAIL
            </p>
            <p className="text-sm mt-1 text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
              {security.recoveryEmail || 'No recovery email set'}
            </p>
          </div>
          <button
            onClick={() => setShowRecoveryEmail(!showRecoveryEmail)}
            className="px-4 py-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <FaEdit className="inline mr-2" /> UPDATE
          </button>
        </div>
        <AnimatePresence>
          {showRecoveryEmail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 flex gap-3">
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="recovery@example.com"
                  className={npInput()}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button onClick={handleUpdateEmail}
                  className="px-4 py-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  SAVE
                </button>
                <button onClick={() => setShowRecoveryEmail(false)}
                  className="px-4 py-2 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#E5E5E0] transition-all"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  CANCEL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backup Codes */}
      <div className="border-2 border-[#111111] p-4 flex items-center justify-between flex-wrap gap-4 bg-[#F9F9F7]">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaQrcode className="inline mr-2" />BACKUP CODES
          </p>
          <p className="text-sm mt-1 text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
            {security.backupCodes} backup codes remaining
          </p>
        </div>
        <button
          onClick={onGenerateBackupCodes}
          className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] text-xs font-black uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          GENERATE NEW
        </button>
      </div>

      {/* Login History */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[#525252] mb-3 flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <FaHistory /> RECENT LOGIN ACTIVITY
        </h3>
        <div className="border-2 border-[#111111] divide-y-2 divide-[#111111]">
          {security.loginHistory && security.loginHistory.length > 0 ? (
            security.loginHistory.map((login, index) => (
              <div key={index} className={`flex items-center justify-between p-4 ${login.status === 'success' ? 'bg-[#F9F9F7]' : 'bg-[#FFF5F5]'} hover:bg-[#E5E5E0] transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 border-2 flex-shrink-0 ${login.status === 'success' ? 'bg-[#111111] border-[#111111]' : 'bg-[#CC0000] border-[#CC0000]'}`} />
                  <div>
                    <p className="font-black text-[#111111] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{login.device}</p>
                    <div className="flex items-center gap-2 text-xs text-[#525252] mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                      <FaMapMarkerAlt size={9} />
                      <span>{login.location}</span>
                      <span>·</span>
                      <span>{login.time || new Date(login.timestamp || '').toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-[0.6rem] px-2.5 py-1 border font-black uppercase tracking-widest flex-shrink-0 ${login.status === 'success' ? 'border-[#111111] text-[#111111]' : 'border-[#CC0000] text-[#CC0000]'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {login.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
              No login history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DocumentsSection ─────────────────────────────────────────────────────────
const DocumentsSection: React.FC<{
  documents: IUserProfile['documents'];
  onDocumentUpload: (category: 'identity' | 'financial', formData: FormData) => Promise<void>;
  onDocumentDelete: (category: 'identity' | 'financial', documentId: string) => Promise<void>;
  onDocumentDownload: (category: 'identity' | 'financial', documentId: string, fileName: string) => void;
}> = ({ documents, onDocumentUpload, onDocumentDelete, onDocumentDownload }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'identity' | 'financial'>('identity');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    documentType: '', number: '', expiryDate: '', status: 'active', institution: '', lastUpdated: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) { alert('Please select a file'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('documentType', uploadFormData.documentType);
      if (uploadCategory === 'identity') {
        formData.append('number', uploadFormData.number);
        formData.append('expiryDate', uploadFormData.expiryDate);
        formData.append('status', uploadFormData.status);
      } else {
        formData.append('institution', uploadFormData.institution);
        formData.append('lastUpdated', uploadFormData.lastUpdated || new Date().toLocaleDateString());
      }
      await onDocumentUpload(uploadCategory, formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadFormData({ documentType: '', number: '', expiryDate: '', status: 'active', institution: '', lastUpdated: '' });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const DocRow: React.FC<{
    doc: any;
    category: 'identity' | 'financial';
    icon: React.ReactNode;
  }> = ({ doc, category, icon }) => (
    <div className="flex items-center gap-4 p-4 border-2 border-[#111111] bg-[#F9F9F7] hover:bg-[#E5E5E0] transition-all group">
      <div className="p-3 border-2 border-[#111111] bg-[#E5E5E0] text-[#111111] flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>{doc.type}</p>
          {doc.status && (
            <span className={`text-[0.6rem] px-2 py-0.5 border font-black uppercase tracking-widest ${doc.status === 'active' ? 'border-[#111111] text-[#111111]' : 'border-[#CC0000] text-[#CC0000]'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {doc.status}
            </span>
          )}
        </div>
        {doc.number && <p className="text-xs text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>No. {doc.number}</p>}
        {doc.expiryDate && <p className="text-xs text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>EXP: {doc.expiryDate}</p>}
        {doc.fileName && <p className="text-xs text-[#525252] truncate" style={{ fontFamily: "'Lora', serif" }}>{doc.fileName} {doc.fileSize ? `· ${formatFileSize(doc.fileSize)}` : ''}</p>}
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onDocumentDownload(category, doc.id, doc.fileName)}
          className="p-2 border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
          title="Download" aria-label="Download">
          <FaDownload className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDocumentDelete(category, doc.id)}
          className="p-2 border-2 border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all"
          title="Delete" aria-label="Delete">
          <FaTrash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Identity Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#111111] flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaIdCard /> IDENTITY DOCUMENTS
          </h3>
          <button
            onClick={() => { setUploadCategory('identity'); setShowUploadModal(true); }}
            className="px-4 py-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all flex items-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <FaUpload className="w-3.5 h-3.5" /> UPLOAD
          </button>
        </div>
        <div className="space-y-2">
          {documents.identity.map((doc: any, index) => (
            <DocRow key={doc.id || index} doc={doc} category="identity" icon={<FaIdCard />} />
          ))}
          {documents.identity.length === 0 && (
            <div className="p-10 border-4 border-dashed border-[#111111] text-center">
              <FaIdCard className="mx-auto text-4xl text-[#111111] mb-3 opacity-30" />
              <p className="text-xs font-black uppercase tracking-widest text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                NO IDENTITY DOCUMENTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#111111] flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaFilePdf /> FINANCIAL DOCUMENTS
          </h3>
          <button
            onClick={() => { setUploadCategory('financial'); setShowUploadModal(true); }}
            className="px-4 py-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all flex items-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <FaUpload className="w-3.5 h-3.5" /> UPLOAD
          </button>
        </div>
        <div className="space-y-2">
          {documents.financial.map((doc: any, index) => (
            <DocRow key={doc.id || index} doc={doc} category="financial" icon={<FaFileAlt />} />
          ))}
          {documents.financial.length === 0 && (
            <div className="p-10 border-4 border-dashed border-[#111111] text-center">
              <FaFileAlt className="mx-auto text-4xl text-[#111111] mb-3 opacity-30" />
              <p className="text-xs font-black uppercase tracking-widest text-[#525252]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                NO FINANCIAL DOCUMENTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b-4 border-[#111111] bg-[#111111] flex items-center justify-between">
                <h3 className="text-lg font-black text-[#F9F9F7] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                  UPLOAD {uploadCategory.toUpperCase()} DOCUMENT
                </h3>
                <button onClick={() => setShowUploadModal(false)}
                  className="p-2 text-[#F9F9F7] hover:text-[#CC0000] transition-colors">
                  <FaTimes />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* File Input */}
                  <div>
                    <label className={npLabel}>SELECT FILE *</label>
                    <input type="file" onChange={handleFileChange} required disabled={uploading}
                      className={`${npInput()} file:mr-4 file:py-1 file:px-4 file:border-0 file:bg-[#111111] file:text-[#F9F9F7] file:text-xs file:font-black file:uppercase file:tracking-widest file:cursor-pointer`} />
                  </div>
                  <div>
                    <label className={npLabel}>DOCUMENT TYPE *</label>
                    <input type="text"
                      value={uploadFormData.documentType}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, documentType: e.target.value })}
                      placeholder={uploadCategory === 'identity' ? 'e.g., Passport, Driver License' : 'e.g., Bank Statement'}
                      required disabled={uploading}
                      className={npInput()}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                  {uploadCategory === 'identity' ? (
                    <>
                      <div>
                        <label className={npLabel}>DOCUMENT NUMBER</label>
                        <input type="text" value={uploadFormData.number}
                          onChange={(e) => setUploadFormData({ ...uploadFormData, number: e.target.value })}
                          placeholder="e.g., A1234567" disabled={uploading}
                          className={npInput()}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                      </div>
                      <div>
                        <label className={npLabel}>EXPIRY DATE</label>
                        <input type="text" value={uploadFormData.expiryDate}
                          onChange={(e) => setUploadFormData({ ...uploadFormData, expiryDate: e.target.value })}
                          placeholder="e.g., 2028" disabled={uploading}
                          className={npInput()}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                      </div>
                      <div>
                        <label className={npLabel}>STATUS</label>
                        <select value={uploadFormData.status}
                          onChange={(e) => setUploadFormData({ ...uploadFormData, status: e.target.value })}
                          disabled={uploading} className={npSelect()}>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className={npLabel}>INSTITUTION</label>
                      <input type="text" value={uploadFormData.institution}
                        onChange={(e) => setUploadFormData({ ...uploadFormData, institution: e.target.value })}
                        placeholder="e.g., HDFC Bank" disabled={uploading}
                        className={npInput()}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowUploadModal(false)} disabled={uploading}
                      className="flex-1 px-4 py-3 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#E5E5E0] transition-all disabled:opacity-50"
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      CANCEL
                    </button>
                    <button type="submit" disabled={uploading}
                      className="flex-1 px-4 py-3 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      {uploading ? <><FaSpinner className="animate-spin" /> UPLOADING…</> : <><FaUpload /> UPLOAD</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── BillingSection ───────────────────────────────────────────────────────────
const BillingSection: React.FC<{
  billing: IUserProfile['billing'];
  onAddPaymentMethod: (data: any) => Promise<boolean>;
  onDeletePaymentMethod: (methodId: string) => void;
  userName: string;
}> = ({ billing, onAddPaymentMethod, onDeletePaymentMethod, userName }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardData, setCardData] = useState({
    type: 'credit', provider: 'visa', lastFour: '', expiryDate: '',
    cardHolderName: userName, isDefault: false
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showAddCard && userName) {
      setCardData(prev => ({ ...prev, cardHolderName: userName }));
    }
  }, [showAddCard, userName]);

  const validateCardHolderName = (name: string): string | null => {
    if (!name || name.trim() === '') return 'Cardholder name is required';
    if (name.length < 3 || name.length > 50) return 'Name must be between 3 and 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  };
  const validateLastFourDigits = (digits: string): string | null => {
    if (!digits || digits.trim() === '') return 'Last 4 digits are required';
    if (!/^\d{4}$/.test(digits)) return 'Must be exactly 4 digits';
    return null;
  };
  const validateExpiryDate = (expiry: string): string | null => {
    if (!expiry || expiry.trim() === '') return 'Expiry date is required';
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(expiry)) return 'Invalid format. Use MM/YY (e.g., 12/25)';
    const [month, year] = expiry.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return 'Card has expired';
    if (year > currentYear + 20) return 'Expiry date is too far in the future';
    return null;
  };
  const handleExpiryChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    setCardData({ ...cardData, expiryDate: cleaned });
    if (cardErrors.expiryDate) setCardErrors(prev => ({ ...prev, expiryDate: '' }));
  };
  const clearError = (field: string) => setCardErrors(prev => ({ ...prev, [field]: '' }));
  const validateCardForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameError = validateCardHolderName(cardData.cardHolderName);
    if (nameError) errors.cardHolderName = nameError;
    const lastFourError = validateLastFourDigits(cardData.lastFour);
    if (lastFourError) errors.lastFour = lastFourError;
    const expiryError = validateExpiryDate(cardData.expiryDate);
    if (expiryError) errors.expiryDate = expiryError;
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleAddCard = async () => {
    if (!validateCardForm()) { alert('⚠️ Please fix the validation errors before adding the card'); return; }
    const success = await onAddPaymentMethod(cardData);
    if (success) {
      setShowAddCard(false);
      setCardData({ type: 'credit', provider: 'visa', lastFour: '', expiryDate: '', cardHolderName: userName, isDefault: false });
      setCardErrors({});
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#111111] flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaCreditCard /> PAYMENT METHODS
          </h3>
          <button onClick={() => setShowAddCard(!showAddCard)}
            className="px-4 py-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-black uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all flex items-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            <FaCreditCard className="w-3.5 h-3.5" /> ADD CARD
          </button>
        </div>

        {/* Add Card Form */}
        <AnimatePresence>
          {showAddCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4 p-5 border-2 border-[#111111] bg-[#E5E5E0]">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#111111] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  NEW PAYMENT METHOD
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={npLabel}>CARD TYPE</label>
                    <select value={cardData.type} onChange={(e) => setCardData({ ...cardData, type: e.target.value })}
                      className={npSelect()}>
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                  </div>
                  <div>
                    <label className={npLabel}>PROVIDER</label>
                    <select value={cardData.provider} onChange={(e) => setCardData({ ...cardData, provider: e.target.value })}
                      className={npSelect()}>
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                    </select>
                  </div>
                  <div>
                    <label className={npLabel}>CARDHOLDER NAME *</label>
                    <input type="text" value={cardData.cardHolderName}
                      onChange={(e) => { setCardData({ ...cardData, cardHolderName: e.target.value }); clearError('cardHolderName'); }}
                      placeholder="John Doe"
                      className={npInput(!!cardErrors.cardHolderName)}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    <ValidationError message={cardErrors.cardHolderName} />
                  </div>
                  <div>
                    <label className={npLabel}>LAST 4 DIGITS *</label>
                    <input type="text" value={cardData.lastFour}
                      onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setCardData({ ...cardData, lastFour: val }); clearError('lastFour'); }}
                      placeholder="1234" maxLength={4}
                      className={npInput(!!cardErrors.lastFour)}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    <ValidationError message={cardErrors.lastFour} />
                  </div>
                  <div>
                    <label className={npLabel}>EXPIRY (MM/YY) *</label>
                    <input type="text" value={cardData.expiryDate}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="12/25" maxLength={5}
                      className={npInput(!!cardErrors.expiryDate)}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    <ValidationError message={cardErrors.expiryDate} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={cardData.isDefault}
                      onChange={(e) => setCardData({ ...cardData, isDefault: e.target.checked })}
                      className="w-5 h-5 border-2 border-[#111111] bg-[#F9F9F7] checked:bg-[#111111] appearance-none flex-shrink-0" />
                    <label className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      SET AS DEFAULT
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={handleAddCard}
                    className="px-6 py-2.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    ADD CARD
                  </button>
                  <button onClick={() => setShowAddCard(false)}
                    className="px-6 py-2.5 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {billing.paymentMethods.map((method, index) => (
            <div key={method.id || index}
              className={`relative p-4 border-2 ${method.isDefault ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]' : 'border-[#111111] bg-[#F9F9F7] text-[#111111]'} group hover:shadow-[4px_4px_0px_0px_#111111] transition-all`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 border-2 ${method.isDefault ? 'border-[#F9F9F7]' : 'border-[#111111] bg-[#E5E5E0]'}`}>
                  {method.provider === 'visa'
                    ? <FaCcVisa className={`w-8 h-8 ${method.isDefault ? 'text-[#F9F9F7]' : 'text-[#111111]'}`} />
                    : <FaCcMastercard className={`w-8 h-8 ${method.isDefault ? 'text-[#F9F9F7]' : 'text-[#111111]'}`} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-black uppercase tracking-wide text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {method.type.charAt(0).toUpperCase() + method.type.slice(1)} Card
                    </p>
                    {method.isDefault && (
                      <span className="text-[0.6rem] px-2 py-0.5 border border-[#F9F9F7] font-black uppercase tracking-widest"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>DEFAULT</span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-sm opacity-80">•••• {method.lastFour}</p>
                  <p className="text-xs opacity-60 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>EXP {method.expiryDate}</p>
                </div>
              </div>
              <button onClick={() => method.id && onDeletePaymentMethod(method.id)}
                className="absolute top-2 right-2 p-2 border-2 border-[#CC0000] text-[#CC0000] opacity-0 group-hover:opacity-100 hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all"
                aria-label="Delete card">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111] mb-3 flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <FaFileInvoiceDollar /> RECENT INVOICES
        </h3>
        <div className="border-2 border-[#111111] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#111111]">
                {['INVOICE ID', 'DATE', 'AMOUNT', 'STATUS', ''].map((h, i) => (
                  <th key={i} className="text-left text-[0.6rem] font-black uppercase tracking-widest text-[#E5E5E0] p-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#111111]">
              {billing.invoices.map((invoice, index) => (
                <tr key={invoice.id || index} className="hover:bg-[#E5E5E0] transition-colors bg-[#F9F9F7]">
                  <td className="p-3 font-black text-[#111111] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {invoice.invoiceId || invoice.id}
                  </td>
                  <td className="p-3 text-[#525252] text-sm" style={{ fontFamily: "'Lora', serif" }}>{invoice.date}</td>
                  <td className="p-3 font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>₹{invoice.amount}</td>
                  <td className="p-3">
                    <span className={`text-[0.6rem] px-2.5 py-1 border font-black uppercase tracking-widest ${invoice.status === 'paid' ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]' : 'border-[#111111] text-[#111111]'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="p-1.5 border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                      aria-label="Download invoice">
                      <FaDownload className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main UserProfile Component ───────────────────────────────────────────────
const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<IUserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<IUserProfile>({
    name: '', email: '', role: 'Free User',
    preferences: { theme: 'auto', notifications: true, language: 'English' },
    avatar: 'https://via.placeholder.com/150',
    memberSince: 'Just now', lastLogin: 'Just now', securityScore: 50,
    twoFactorEnabled: false, totalDevices: 0, activeSubscription: 'Free Plan', nextBilling: 'N/A',
    personalInfo: { dateOfBirth: '15 March 1990', phoneNumber: '+91 98765 43210', nationality: 'Indian', maritalStatus: 'Married', gender: 'Male' },
    professionalInfo: {
      occupation: 'Senior Software Engineer', company: 'Tech Innovations Ltd',
      department: 'Engineering', employeeId: 'EMP123456', experience: '8+ years',
      education: [
        { degree: 'Master of Computer Applications', institution: 'Delhi University', year: '2012' },
        { degree: 'Bachelor of Computer Science', institution: 'Mumbai University', year: '2009' },
      ]
    },
    address: { street: '123 Cyber City, Phase 1', city: 'Gurugram', state: 'Haryana', country: 'India', postalCode: '122002' },
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/rahulsingh', github: 'https://github.com/rahulsingh',
      twitter: 'https://twitter.com/rahulsingh', website: 'https://rahulsingh.dev'
    },
    identityDocuments: [
      { type: 'Passport', number: '********1234', expiryDate: '2028' },
      { type: 'National ID', number: '********5678', expiryDate: '2025' },
    ],
    bankingInfo: { accountHolder: 'Rahul Singh', accountType: 'Savings', lastFourDigits: '4321' },
    security: {
      lastPasswordChange: '1 month ago', loginAttempts: 5, securityQuestions: 3,
      activeDevices: 2,
      loginHistory: [
        { device: 'iPhone 12', location: 'New Delhi, India', time: '2 hours ago', status: 'success' },
        { device: 'MacBook Pro', location: 'Gurugram, India', time: '1 day ago', status: 'success' },
        { device: 'Windows PC', location: 'Mumbai, India', time: '3 days ago', status: 'failed' },
      ],
      recoveryEmail: 'RahulSingh05.recovery@gmail.com', backupCodes: 5
    },
    documents: { identity: [], financial: [] },
    billing: {
      paymentMethods: [
        { type: 'credit', provider: 'visa', lastFour: '1234', expiryDate: '12/24', isDefault: true },
        { type: 'debit', provider: 'mastercard', lastFour: '5678', expiryDate: '11/23', isDefault: false },
      ],
      invoices: [
        { id: 'INV001', date: '01/01/2023', amount: 7999, status: 'paid', downloadUrl: '#' },
        { id: 'INV002', date: '02/01/2023', amount: 7999, status: 'pending', downloadUrl: '#' },
      ],
      subscriptionHistory: [
        { plan: 'Basic Plan', startDate: '01/01/2022', endDate: '12/31/2022', amount: 3999, status: 'expired' },
        { plan: 'Premium Plan', startDate: '01/01/2023', endDate: '12/31/2023', amount: 7999, status: 'active' },
      ]
    }
  });

  // ── Phone formatting ────────────────────────────────────────────────────────
  const getCountryCode = (nationality: string): string => {
    if (!nationality) return '';
    return COUNTRY_PHONE_CODES[nationality.toLowerCase().trim()] || '';
  };
  const formatPhoneNumber = (phone: string, countryCode: string): string => {
    if (!phone || phone.trim() === '') return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    let code = ''; let phoneDigits = '';
    if (cleaned.startsWith('+')) {
      if (countryCode) {
        code = countryCode;
        phoneDigits = cleaned.substring(countryCode.length).replace(/\D/g, '');
      } else {
        const match = cleaned.match(/^(\+\d{1,3})(.*)$/);
        if (match) { code = match[1]; phoneDigits = match[2].replace(/\D/g, ''); }
      }
    } else {
      if (countryCode) { code = countryCode; phoneDigits = cleaned.replace(/\D/g, ''); }
      else return cleaned;
    }
    if (!phoneDigits) return code + ' ';
    const formatted = phoneDigits.match(/.{1,5}/g)?.join(' ') || phoneDigits;
    return `${code} ${formatted}`;
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateName = (name: string): string | null => {
    if (!name || name.trim() === '') return 'Name is required';
    if (name.length < 2 || name.length > 50) return 'Name must be between 2 and 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  };
  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return null;
    if (!/^\+?[\d\s-()]+$/.test(phone)) return 'Phone number format is invalid';
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return 'Phone number must be between 10 and 15 digits';
    return null;
  };
  const validateDateOfBirth = (dob: string): string | null => {
    if (!dob) return null;
    const date = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    if (age < 13) return 'You must be at least 13 years old';
    if (age > 120) return 'Please enter a valid date of birth';
    return null;
  };
  const validateURL = (url: string, fieldName: string): string | null => {
    if (!url) return null;
    try {
      new URL(url);
      if (!url.startsWith('http://') && !url.startsWith('https://')) return `${fieldName} must start with http:// or https://`;
      return null;
    } catch { return `${fieldName} is not a valid URL`; }
  };
  const validatePostalCode = (code: string): string | null => {
    if (!code) return null;
    if (!/^[A-Z0-9\s-]+$/i.test(code)) return 'Postal code format is invalid';
    if (code.length < 3 || code.length > 10) return 'Postal code must be between 3 and 10 characters';
    return null;
  };
  const validateEmployeeId = (id: string): string | null => {
    if (!id) return null;
    if (!/^[A-Za-z0-9-_]+$/.test(id)) return 'Employee ID can only contain letters, numbers, hyphens, and underscores';
    if (id.length > 20) return 'Employee ID cannot exceed 20 characters';
    return null;
  };
  const validateLocationName = (name: string, fieldName: string): string | null => {
    if (!name) return null;
    if (name.length < 2 || name.length > 50) return `${fieldName} must be between 2 and 50 characters`;
    if (!/^[a-zA-Z\s-]+$/.test(name)) return `${fieldName} can only contain letters, spaces, and hyphens`;
    return null;
  };
  const validateLength = (text: string, fieldName: string, min: number, max: number): string | null => {
    if (!text) return null;
    if (text.length < min || text.length > max) return `${fieldName} must be between ${min} and ${max} characters`;
    return null;
  };
  const validateEditForm = (): boolean => {
    if (!editFormData) return false;
    const errors: Record<string, string> = {};
    const nameError = validateName(editFormData.name);
    if (nameError) errors.name = nameError;
    if (editFormData.personalInfo) {
      if (editFormData.personalInfo.phoneNumber?.trim()) {
        const e = validatePhoneNumber(editFormData.personalInfo.phoneNumber);
        if (e) errors['personalInfo.phoneNumber'] = e;
      }
      if (editFormData.personalInfo.dateOfBirth?.trim()) {
        const e = validateDateOfBirth(editFormData.personalInfo.dateOfBirth);
        if (e) errors['personalInfo.dateOfBirth'] = e;
      }
      if (editFormData.personalInfo.nationality?.trim()) {
        const e = validateLength(editFormData.personalInfo.nationality, 'Nationality', 2, 50);
        if (e) errors['personalInfo.nationality'] = e;
      }
    }
    if (editFormData.professionalInfo) {
      if (editFormData.professionalInfo.occupation?.trim()) {
        const e = validateLength(editFormData.professionalInfo.occupation, 'Occupation', 2, 100);
        if (e) errors['professionalInfo.occupation'] = e;
      }
      if (editFormData.professionalInfo.company?.trim()) {
        const e = validateLength(editFormData.professionalInfo.company, 'Company', 2, 100);
        if (e) errors['professionalInfo.company'] = e;
      }
      if (editFormData.professionalInfo.department?.trim()) {
        const e = validateLength(editFormData.professionalInfo.department, 'Department', 0, 50);
        if (e) errors['professionalInfo.department'] = e;
      }
      if (editFormData.professionalInfo.employeeId?.trim()) {
        const e = validateEmployeeId(editFormData.professionalInfo.employeeId);
        if (e) errors['professionalInfo.employeeId'] = e;
      }
      if (editFormData.professionalInfo.experience?.trim()) {
        const e = validateLength(editFormData.professionalInfo.experience, 'Experience', 0, 50);
        if (e) errors['professionalInfo.experience'] = e;
      }
    }
    if (editFormData.address) {
      if (editFormData.address.street?.trim()) {
        const e = validateLength(editFormData.address.street, 'Street address', 5, 200);
        if (e) errors['address.street'] = e;
      }
      if (editFormData.address.city?.trim()) { const e = validateLocationName(editFormData.address.city, 'City'); if (e) errors['address.city'] = e; }
      if (editFormData.address.state?.trim()) { const e = validateLocationName(editFormData.address.state, 'State'); if (e) errors['address.state'] = e; }
      if (editFormData.address.country?.trim()) { const e = validateLocationName(editFormData.address.country, 'Country'); if (e) errors['address.country'] = e; }
      if (editFormData.address.postalCode?.trim()) { const e = validatePostalCode(editFormData.address.postalCode); if (e) errors['address.postalCode'] = e; }
    }
    if (editFormData.socialProfiles) {
      if (editFormData.socialProfiles.linkedin?.trim()) { const e = validateURL(editFormData.socialProfiles.linkedin, 'LinkedIn URL'); if (e) errors['socialProfiles.linkedin'] = e; }
      if (editFormData.socialProfiles.github?.trim()) { const e = validateURL(editFormData.socialProfiles.github, 'GitHub URL'); if (e) errors['socialProfiles.github'] = e; }
      if (editFormData.socialProfiles.twitter?.trim()) { const e = validateURL(editFormData.socialProfiles.twitter, 'Twitter URL'); if (e) errors['socialProfiles.twitter'] = e; }
      if (editFormData.socialProfiles.website?.trim()) { const e = validateURL(editFormData.socialProfiles.website, 'Website URL'); if (e) errors['socialProfiles.website'] = e; }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const clearValidationError = (field: string) => {
    setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/signin'); return; }
        const response = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success && response.data.data.user) {
          const userData = response.data.data.user;
          setUserProfile(prev => ({
            ...prev,
            name: userData.name, email: userData.email,
            role: userData.subscription?.plan === 'premium' ? 'Premium User' : userData.subscription?.plan === 'enterprise' ? 'Enterprise User' : 'Free User',
            avatar: userData.profile?.avatar || 'https://via.placeholder.com/150',
            memberSince: new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            lastLogin: userData.lastLogin ? getTimeAgo(new Date(userData.lastLogin)) : 'Just now',
            securityScore: userData.profile?.securityScore || 50,
            twoFactorEnabled: userData.twoFactorEnabled || false,
            totalDevices: userData.profile?.totalDevices || 0,
            activeSubscription: userData.subscription?.plan === 'premium' ? 'Premium Plan' : userData.subscription?.plan === 'enterprise' ? 'Enterprise Plan' : 'Free Plan',
            nextBilling: userData.subscription?.endDate ? new Date(userData.subscription.endDate).toLocaleDateString() : 'N/A',
            preferences: { theme: userData.profile?.preferences?.theme || 'auto', notifications: userData.profile?.preferences?.notifications?.email !== false, language: userData.profile?.preferences?.language || 'English' },
            personalInfo: userData.profile?.personalInfo || prev.personalInfo,
            professionalInfo: userData.profile?.professionalInfo || prev.professionalInfo,
            address: userData.profile?.address || prev.address,
            socialProfiles: userData.profile?.socialProfiles || prev.socialProfiles,
            security: { ...prev.security, lastPasswordChange: getTimeAgo(new Date(userData.updatedAt)), activeDevices: userData.profile?.totalDevices || 0, backupCodes: 5 }
          }));
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) { localStorage.clear(); navigate('/signin'); }
        else setError('Failed to load profile data');
      } finally { setLoading(false); }
    };
    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await axios.get(`${API_URL}/user/documents`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) setUserProfile(prev => ({ ...prev, documents: response.data.data.documents }));
      } catch (error) { console.error('Error fetching documents:', error); }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await axios.get(`${API_URL}/user/billing`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) setUserProfile(prev => ({ ...prev, billing: response.data.data.billing }));
      } catch (error) { console.error('Error fetching billing:', error); }
    };
    fetchBilling();
  }, []);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await axios.get(`${API_URL}/user/security`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) setUserProfile(prev => ({ ...prev, security: { ...prev.security, ...response.data.data.security } }));
      } catch (error) { console.error('Error fetching security:', error); }
    };
    fetchSecurity();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAddPaymentMethod = async (paymentData: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/user/billing/payment-method`, paymentData, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        const billingResponse = await axios.get(`${API_URL}/user/billing`, { headers: { Authorization: `Bearer ${token}` } });
        if (billingResponse.data.success) setUserProfile(prev => ({ ...prev, billing: billingResponse.data.data.billing }));
        alert('Payment method added successfully!');
        return true;
      }
      return false;
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to add payment method'); return false; }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/user/billing/payment-method/${methodId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setUserProfile(prev => ({ ...prev, billing: { ...prev.billing, paymentMethods: prev.billing.paymentMethods.filter(m => m.id !== methodId) } }));
        alert('Payment method deleted successfully!');
      }
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to delete payment method'); }
  };

  const handleUpdateRecoveryEmail = async (email: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/user/security/recovery-email`, { recoveryEmail: email }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setUserProfile(prev => ({ ...prev, security: { ...prev.security, recoveryEmail: email } }));
        alert('Recovery email updated successfully!');
        return true;
      }
      return false;
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to update recovery email'); return false; }
  };

  const handleGenerateBackupCodes = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/user/security/generate-backup-codes`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setUserProfile(prev => ({ ...prev, security: { ...prev.security, backupCodes: response.data.data.backupCodes } }));
        alert(`${response.data.data.backupCodes} backup codes generated successfully!`);
        return true;
      }
      return false;
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to generate backup codes'); return false; }
  };

  const handleDocumentUpload = async (category: 'identity' | 'financial', formData: FormData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/user/documents/upload`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) { alert('✅ Document uploaded successfully!'); fetchDocuments(); }
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to upload document'); throw error; }
  };

  const handleDocumentDelete = async (category: 'identity' | 'financial', documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/user/documents/${category}/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) { alert('✅ Document deleted successfully!'); fetchDocuments(); }
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to delete document'); }
  };

  const handleDocumentDownload = async (category: 'identity' | 'financial', documentId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/user/documents/${category}/${documentId}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download document'); }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/user/documents`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setUserProfile(prev => ({ ...prev, documents: response.data.data.documents }));
    } catch (error) { console.error('Error fetching documents:', error); }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await axios.get(`${API_URL}/user/export`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'passvault-export.json');
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to export data'); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert('Passwords do not match'); return; }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await axios.put(`${API_URL}/user/password`, { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword, confirmPassword: passwordForm.confirmPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Password changed successfully. Please log in again.');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // End the real Supabase session — onAuthStateChange in
      // supabaseClient.ts clears localStorage automatically.
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to change password'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') { alert('Please type DELETE to confirm'); return; }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await axios.delete(`${API_URL}/user/account`, { data: { password: deletePassword, confirmDelete: deleteConfirmText }, headers: { Authorization: `Bearer ${token}` } });
      alert('Account deleted successfully');
      // The account no longer exists, but end the local session too so
      // stale tokens aren't left behind in this browser.
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to delete account'); setActionLoading(false); }
  };

  const handleEditClick = () => { setEditFormData({ ...userProfile }); setShowEditModal(true); };

  const handleEditChange = (section: string, field: string, value: any) => {
    if (!editFormData) return;
    setEditFormData(prev => {
      if (!prev) return prev;
      let updatedData = prev;
      if (section === 'basic') {
        updatedData = { ...prev, [field]: value };
      } else {
        const sectionData = prev[section as keyof IUserProfile];
        if (typeof sectionData === 'object' && sectionData !== null) {
          updatedData = { ...prev, [section]: { ...(sectionData as any), [field]: value } };
        }
      }
      if (section === 'personalInfo' && field === 'nationality') {
        const countryCode = getCountryCode(value);
        if (countryCode && updatedData.personalInfo.phoneNumber) {
          updatedData = { ...updatedData, personalInfo: { ...updatedData.personalInfo, phoneNumber: formatPhoneNumber(updatedData.personalInfo.phoneNumber, countryCode) } };
        } else if (countryCode && !updatedData.personalInfo.phoneNumber) {
          updatedData = { ...updatedData, personalInfo: { ...updatedData.personalInfo, phoneNumber: countryCode + ' ' } };
        }
      }
      if (section === 'personalInfo' && field === 'phoneNumber') {
        const countryCode = getCountryCode(updatedData.personalInfo.nationality);
        updatedData = { ...updatedData, personalInfo: { ...updatedData.personalInfo, phoneNumber: formatPhoneNumber(value, countryCode) } };
      }
      return updatedData;
    });
    clearValidationError(section === 'basic' ? field : `${section}.${field}`);
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;
    const isValid = validateEditForm();
    if (!isValid) { alert('⚠️ Please fix the validation errors before saving'); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/user/profile`, {
        name: editFormData.name,
        'profile.personalInfo.dateOfBirth': editFormData.personalInfo.dateOfBirth,
        'profile.personalInfo.phoneNumber': editFormData.personalInfo.phoneNumber,
        'profile.personalInfo.nationality': editFormData.personalInfo.nationality,
        'profile.personalInfo.maritalStatus': editFormData.personalInfo.maritalStatus,
        'profile.personalInfo.gender': editFormData.personalInfo.gender,
        'profile.professionalInfo.occupation': editFormData.professionalInfo.occupation,
        'profile.professionalInfo.company': editFormData.professionalInfo.company,
        'profile.professionalInfo.department': editFormData.professionalInfo.department,
        'profile.professionalInfo.employeeId': editFormData.professionalInfo.employeeId,
        'profile.professionalInfo.experience': editFormData.professionalInfo.experience,
        'profile.address.street': editFormData.address.street,
        'profile.address.city': editFormData.address.city,
        'profile.address.state': editFormData.address.state,
        'profile.address.country': editFormData.address.country,
        'profile.address.postalCode': editFormData.address.postalCode,
        'profile.socialProfiles.linkedin': editFormData.socialProfiles.linkedin,
        'profile.socialProfiles.github': editFormData.socialProfiles.github,
        'profile.socialProfiles.twitter': editFormData.socialProfiles.twitter,
        'profile.socialProfiles.website': editFormData.socialProfiles.website,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setUserProfile(editFormData);
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.name = editFormData.name;
        localStorage.setItem('userData', JSON.stringify(userData));
        alert('✅ Profile updated successfully!');
        setShowEditModal(false);
        setValidationErrors({});
      }
    } catch (error: any) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const backendErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => { backendErrors[err.field || err.param] = err.message; });
        setValidationErrors(backendErrors);
        alert('⚠️ Validation errors: Please check the form and try again');
      } else {
        alert(`❌ ${error.response?.data?.message || error.message || 'Failed to update profile'}`);
      }
    } finally { setSaving(false); }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9F9F7]">
        <div className="text-center border-4 border-[#111111] p-12 bg-[#F9F9F7]">
          <FaSpinner className="animate-spin text-[#111111] w-10 h-10 mx-auto mb-5" />
          <p className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            LOADING PROFILE…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9F9F7]">
        <div className="text-center border-4 border-[#CC0000] p-12 bg-[#F9F9F7]">
          <FaExclamationTriangle className="text-[#CC0000] w-10 h-10 mx-auto mb-5" />
          <p className="text-xs font-black uppercase tracking-widest text-[#CC0000]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'PERSONAL', icon: <FaUser /> },
    { id: 'professional', label: 'PROFESSIONAL', icon: <FaBriefcase /> },
    { id: 'security', label: 'SECURITY', icon: <FaShieldAlt /> },
    { id: 'documents', label: 'DOCUMENTS', icon: <FaIdCard /> },
    { id: 'billing', label: 'BILLING', icon: <FaCreditCard /> },
  ];

  // ── Security score label ────────────────────────────────────────────────────
  const securityLabel = userProfile.securityScore >= 80 ? 'STRONG' : userProfile.securityScore >= 50 ? 'MODERATE' : 'WEAK';
  const securityColor = userProfile.securityScore >= 80 ? 'text-[#111111]' : userProfile.securityScore >= 50 ? 'text-[#525252]' : 'text-[#CC0000]';

  return (
    <div
      className="min-h-screen bg-[#F9F9F7]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-0">

        {/* Header */}
        <UserProfileHeader profile={userProfile} onEditClick={handleEditClick} />

        {/* Tab Bar */}
        <div className="border-4 border-[#111111] mb-8 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 border-r-2 border-[#111111] last:border-r-0 transition-all whitespace-nowrap text-xs font-black uppercase tracking-widest ${activeTab === tab.id
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
                  }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-6">
                  <ProfileSection title="Personal Information" icon={<HiOutlineUserCircle className="w-6 h-6" />}>
                    <PersonalInfoCard info={userProfile.personalInfo} />
                  </ProfileSection>
                  <ProfileSection title="Address" icon={<FaMapMarkerAlt />}>
                    <AddressCard address={userProfile.address} />
                  </ProfileSection>
                  <ProfileSection title="Social Profiles" icon={<FaGlobe />}>
                    <SocialProfilesCard profiles={userProfile.socialProfiles} />
                  </ProfileSection>
                </motion.div>
              )}

              {activeTab === 'professional' && (
                <motion.div key="professional" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                  <ProfileSection title="Professional Information" icon={<FaBriefcase />}>
                    <ProfessionalInfoCard info={userProfile.professionalInfo} />
                  </ProfileSection>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                  <ProfileSection title="Security Settings" icon={<FaShieldAlt />}>
                    <SecuritySection security={userProfile.security} onUpdateRecoveryEmail={handleUpdateRecoveryEmail} onGenerateBackupCodes={handleGenerateBackupCodes} />
                  </ProfileSection>
                </motion.div>
              )}

              {activeTab === 'documents' && (
                <motion.div key="documents" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                  <ProfileSection title="My Documents" icon={<FaFileAlt />}>
                    <DocumentsSection documents={userProfile.documents} onDocumentUpload={handleDocumentUpload} onDocumentDelete={handleDocumentDelete} onDocumentDownload={handleDocumentDownload} />
                  </ProfileSection>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div key="billing" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                  <ProfileSection title="Billing & Payments" icon={<FaCreditCard />}>
                    <BillingSection billing={userProfile.billing} onAddPaymentMethod={handleAddPaymentMethod} onDeletePaymentMethod={handleDeletePaymentMethod} userName={userProfile.name} />
                  </ProfileSection>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Subscription Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="border-4 border-[#111111] overflow-hidden">
              <div className="p-4 border-b-4 border-[#111111] bg-[#E5E5E0] flex items-center gap-3">
                <FaCrown className="text-[#111111]" />
                <h2 className="text-xl font-black text-[#111111] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>Subscription</h2>
              </div>
              <div className="p-5 bg-[#111111]">
                <div className="flex items-start justify-between mb-4">
                  <FaCrown className="text-[#F9F9F7] w-8 h-8 opacity-70" />
                  <span className="text-[0.6rem] px-2.5 py-1 border border-[#F9F9F7] font-black uppercase tracking-widest text-[#F9F9F7]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>ACTIVE</span>
                </div>
                <p className="text-2xl font-black text-[#F9F9F7]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {userProfile.activeSubscription}
                </p>
                <div className="mt-4 pt-4 border-t border-[#E5E5E0]/30 space-y-1">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#A3A3A3]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    MEMBER SINCE: <span className="text-[#F9F9F7]">{userProfile.memberSince}</span>
                  </p>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#A3A3A3]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    NEXT BILLING: <span className="text-[#F9F9F7]">{userProfile.nextBilling}</span>
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2 bg-[#F9F9F7] border-t-4 border-[#111111]">
                <button className="w-full py-3 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  MANAGE SUBSCRIPTION
                </button>
                <button className="w-full py-3 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  VIEW BENEFITS
                </button>
              </div>
            </motion.div>

            {/* Security Score */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
              className="border-4 border-[#111111] overflow-hidden">
              <div className="p-4 border-b-4 border-[#111111] bg-[#E5E5E0] flex items-center gap-3">
                <FaShieldAlt className="text-[#111111]" />
                <h2 className="text-xl font-black text-[#111111] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>Security</h2>
              </div>
              <div className="p-5 bg-[#F9F9F7]">
                <div className="flex items-end justify-between mb-3">
                  <p className="text-5xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {userProfile.securityScore}<span className="text-2xl">%</span>
                  </p>
                  <span className={`text-xs font-black uppercase tracking-widest border-2 px-2.5 py-1 ${securityColor} border-current`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {securityLabel}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 border-2 border-[#111111] bg-[#E5E5E0] overflow-hidden">
                  <div className="h-full bg-[#111111] transition-all duration-700" style={{ width: `${userProfile.securityScore}%` }} />
                </div>
                {userProfile.twoFactorEnabled && (
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#525252] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ✓ 2FA ENABLED
                  </p>
                )}
                <button className="mt-4 w-full py-2.5 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  <FaShieldAlt /> IMPROVE SECURITY
                </button>
              </div>
            </motion.div>

            {/* Account Actions */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
              className="border-4 border-[#111111] overflow-hidden">
              <div className="p-4 border-b-4 border-[#111111] bg-[#E5E5E0] flex items-center gap-3">
                <FaCog className="text-[#111111]" />
                <h2 className="text-xl font-black text-[#111111] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>Account</h2>
              </div>
              <div className="bg-[#F9F9F7] divide-y-2 divide-[#111111]">
                {[
                  { icon: <FaFileExport />, label: 'EXPORT DATA', onClick: handleExportData, danger: false },
                  { icon: <FaKey />, label: 'CHANGE PASSWORD', onClick: () => setShowPasswordModal(true), danger: false },
                  { icon: <FaTrash />, label: 'DELETE ACCOUNT', onClick: () => setShowDeleteModal(true), danger: true },
                ].map((action) => (
                  <button key={action.label} onClick={action.onClick}
                    className={`w-full flex items-center justify-between p-4 transition-all ${action.danger ? 'hover:bg-[#CC0000] hover:text-[#F9F9F7] text-[#CC0000]' : 'hover:bg-[#E5E5E0] text-[#111111]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{action.icon}</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {action.label}
                      </span>
                    </div>
                    <FaChevronRight className="text-xs opacity-40" />
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* ── Modals ────────────────────────────────────────────────────────── */}
        <AnimatePresence>

          {/* Edit Profile Modal */}
          {showEditModal && editFormData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#111111]/75 z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Modal Header */}
                <div className="p-5 border-b-4 border-[#111111] bg-[#111111] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <FaEdit className="text-[#F9F9F7] w-5 h-5" />
                    <div>
                      <h2 className="text-xl font-black text-[#F9F9F7] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                        EDIT PROFILE
                      </h2>
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#A3A3A3] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ONLY YOUR NAME IS REQUIRED — EVERYTHING ELSE IS OPTIONAL
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowEditModal(false)}
                    className="p-2 text-[#F9F9F7] hover:text-[#CC0000] transition-colors">
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Info Banner */}
                  <div className="mb-6 p-4 border-2 border-[#111111] bg-[#E5E5E0] flex items-start gap-3">
                    <div className="w-1.5 bg-[#111111] flex-shrink-0 self-stretch" />
                    <p className="text-sm text-[#111111]" style={{ fontFamily: "'Lora', serif" }}>
                      Fill in as much or as little as you'd like. You can update your profile anytime — only your <strong>name</strong> is required.
                    </p>
                  </div>

                  <div className="space-y-8">
                    {/* Basic */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#111111]">
                        <FaUser className="text-[#111111]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          BASIC INFORMATION
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={npLabel}>FULL NAME <span className="text-[#CC0000]">*</span></label>
                          <input type="text" value={editFormData.name}
                            onChange={(e) => handleEditChange('basic', 'name', e.target.value)}
                            className={npInput(!!validationErrors.name)}
                            placeholder="Enter your full name"
                            style={{ fontFamily: "'Inter', sans-serif" }} />
                          <ValidationError message={validationErrors.name} />
                        </div>
                        <div>
                          <label className={npLabel}>EMAIL</label>
                          <input type="email" value={editFormData.email} disabled
                            className="w-full px-4 py-2.5 border-2 border-[#E5E5E0] bg-[#E5E5E0] text-[#525252] cursor-not-allowed"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                          <p className="text-[0.6rem] uppercase tracking-widest text-[#525252] mt-1.5"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}>EMAIL CANNOT BE CHANGED</p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#111111]">
                        <FaUserSecret className="text-[#111111]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          PERSONAL INFORMATION <span className="text-[#525252] normal-case font-normal text-[0.6rem]">(Optional)</span>
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={npLabel}>DATE OF BIRTH</label>
                          <input type="date" value={editFormData.personalInfo.dateOfBirth}
                            onChange={(e) => handleEditChange('personalInfo', 'dateOfBirth', e.target.value)}
                            className={npInput(!!validationErrors['personalInfo.dateOfBirth'])}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                          <ValidationError message={validationErrors['personalInfo.dateOfBirth']} />
                        </div>
                        <div>
                          <label className={npLabel}>PHONE NUMBER <span className="text-[#525252] normal-case font-normal">(auto-formats)</span></label>
                          <input type="tel" value={editFormData.personalInfo.phoneNumber}
                            onChange={(e) => handleEditChange('personalInfo', 'phoneNumber', e.target.value)}
                            className={npInput(!!validationErrors['personalInfo.phoneNumber'])}
                            placeholder="+91 98765 43210"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                          <ValidationError message={validationErrors['personalInfo.phoneNumber']} />
                        </div>
                        <div>
                          <label className={npLabel}>NATIONALITY <span className="text-[#525252] normal-case font-normal">(sets phone code)</span></label>
                          <input type="text" value={editFormData.personalInfo.nationality}
                            onChange={(e) => handleEditChange('personalInfo', 'nationality', e.target.value)}
                            className={npInput(!!validationErrors['personalInfo.nationality'])}
                            placeholder="e.g., India, USA, UK"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                          <ValidationError message={validationErrors['personalInfo.nationality']} />
                        </div>
                        <div>
                          <label className={npLabel}>MARITAL STATUS</label>
                          <select value={editFormData.personalInfo.maritalStatus}
                            onChange={(e) => handleEditChange('personalInfo', 'maritalStatus', e.target.value)}
                            className={npSelect()}>
                            <option value="">Select</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={npLabel}>GENDER</label>
                          <select value={editFormData.personalInfo.gender}
                            onChange={(e) => handleEditChange('personalInfo', 'gender', e.target.value)}
                            className={npSelect()}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Professional */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#111111]">
                        <FaBriefcase className="text-[#111111]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          PROFESSIONAL INFORMATION
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'OCCUPATION', key: 'occupation', placeholder: 'e.g., Software Engineer' },
                          { label: 'COMPANY', key: 'company', placeholder: 'e.g., Acme Corp' },
                          { label: 'DEPARTMENT', key: 'department', placeholder: 'e.g., Engineering' },
                          { label: 'EMPLOYEE ID', key: 'employeeId', placeholder: 'e.g., EMP001' },
                          { label: 'EXPERIENCE', key: 'experience', placeholder: 'e.g., 5+ years' },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key}>
                            <label className={npLabel}>{label}</label>
                            <input type="text"
                              value={(editFormData.professionalInfo as any)[key]}
                              onChange={(e) => handleEditChange('professionalInfo', key, e.target.value)}
                              placeholder={placeholder}
                              className={npInput(!!(validationErrors as any)[`professionalInfo.${key}`])}
                              style={{ fontFamily: "'Inter', sans-serif" }} />
                            <ValidationError message={(validationErrors as any)[`professionalInfo.${key}`]} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#111111]">
                        <FaMapMarkerAlt className="text-[#111111]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ADDRESS
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={npLabel}>STREET ADDRESS</label>
                          <input type="text" value={editFormData.address.street}
                            onChange={(e) => handleEditChange('address', 'street', e.target.value)}
                            className={npInput(!!validationErrors['address.street'])}
                            placeholder="123 Main Street"
                            style={{ fontFamily: "'Inter', sans-serif" }} />
                          <ValidationError message={validationErrors['address.street']} />
                        </div>
                        {[
                          { label: 'CITY', key: 'city', placeholder: 'e.g., Mumbai' },
                          { label: 'STATE', key: 'state', placeholder: 'e.g., Maharashtra' },
                          { label: 'COUNTRY', key: 'country', placeholder: 'e.g., India' },
                          { label: 'POSTAL CODE', key: 'postalCode', placeholder: 'e.g., 400001' },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key}>
                            <label className={npLabel}>{label}</label>
                            <input type="text"
                              value={(editFormData.address as any)[key]}
                              onChange={(e) => handleEditChange('address', key, e.target.value)}
                              placeholder={placeholder}
                              className={npInput(!!(validationErrors as any)[`address.${key}`])}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                            <ValidationError message={(validationErrors as any)[`address.${key}`]} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Profiles */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#111111]">
                        <FaGlobe className="text-[#111111]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          SOCIAL PROFILES
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'LINKEDIN', key: 'linkedin', icon: <FaLinkedin />, placeholder: 'https://linkedin.com/in/username' },
                          { label: 'GITHUB', key: 'github', icon: <FaGithub />, placeholder: 'https://github.com/username' },
                          { label: 'TWITTER / X', key: 'twitter', icon: <FaTwitter />, placeholder: 'https://twitter.com/username' },
                          { label: 'WEBSITE', key: 'website', icon: <FaGlobe />, placeholder: 'https://yourwebsite.com' },
                        ].map(({ label, key, icon, placeholder }) => (
                          <div key={key}>
                            <label className={`${npLabel} flex items-center gap-1.5`}>{icon} {label}</label>
                            <input type="url"
                              value={(editFormData.socialProfiles as any)[key]}
                              onChange={(e) => handleEditChange('socialProfiles', key, e.target.value)}
                              placeholder={placeholder}
                              className={npInput(!!(validationErrors as any)[`socialProfiles.${key}`])}
                              style={{ fontFamily: "'Lora', serif" }} />
                            <ValidationError message={(validationErrors as any)[`socialProfiles.${key}`]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t-4 border-[#111111] bg-[#E5E5E0] flex items-center justify-end gap-3 flex-shrink-0">
                  <button onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    CANCEL
                  </button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="px-8 py-3 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    {saving ? <><FaSpinner className="animate-spin" /> SAVING…</> : <><FaSave /> SAVE CHANGES</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Change Password Modal */}
          {showPasswordModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/75"
              onClick={() => setShowPasswordModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-md overflow-hidden">
                <div className="p-5 border-b-4 border-[#111111] bg-[#111111] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaKey className="text-[#F9F9F7]" />
                    <h3 className="text-lg font-black text-[#F9F9F7] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                      CHANGE PASSWORD
                    </h3>
                  </div>
                  <button onClick={() => setShowPasswordModal(false)} className="p-2 text-[#F9F9F7] hover:text-[#CC0000] transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleChangePassword}>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className={npLabel}>CURRENT PASSWORD</label>
                      <input type="password" required value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className={npInput()}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                    <div>
                      <label className={npLabel}>NEW PASSWORD</label>
                      <input type="password" required minLength={8} value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className={npInput()}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                    <div>
                      <label className={npLabel}>CONFIRM NEW PASSWORD</label>
                      <input type="password" required value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className={npInput()}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowPasswordModal(false)}
                        className="px-5 py-2.5 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#E5E5E0] transition-all"
                        style={{ fontFamily: "'Inter', sans-serif" }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={actionLoading}
                        className="px-5 py-2.5 bg-[#111111] text-[#F9F9F7] border-2 border-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#F9F9F7] hover:text-[#111111] transition-all disabled:opacity-50"
                        style={{ fontFamily: "'Inter', sans-serif" }}>
                        {actionLoading ? 'SAVING…' : 'UPDATE PASSWORD'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/75"
              onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#F9F9F7] border-4 border-[#CC0000] w-full max-w-md overflow-hidden">
                <div className="p-5 border-b-4 border-[#CC0000] bg-[#CC0000] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaTrash className="text-[#F9F9F7]" />
                    <h3 className="text-lg font-black text-[#F9F9F7] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                      DELETE ACCOUNT
                    </h3>
                  </div>
                  <button onClick={() => setShowDeleteModal(false)} className="p-2 text-[#F9F9F7] hover:opacity-70 transition-opacity">
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleDeleteAccount}>
                  <div className="p-6 space-y-4">
                    {/* Warning block */}
                    <div className="p-4 border-2 border-[#CC0000] bg-[#FFF5F5]">
                      <p className="text-xs font-black uppercase tracking-widest text-[#CC0000]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ⚠ IRREVERSIBLE ACTION
                      </p>
                      <p className="text-sm mt-2 text-[#111111]" style={{ fontFamily: "'Lora', serif" }}>
                        This will permanently erase all your passwords, documents, and data. This action <strong>cannot be undone</strong>.
                      </p>
                    </div>
                    <div>
                      <label className={npLabel}>ACCOUNT PASSWORD</label>
                      <input type="password" required value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className={npInput()}
                        placeholder="Enter password to confirm"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                    <div>
                      <label className={npLabel}>TYPE "DELETE" TO CONFIRM</label>
                      <input type="text" required value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className={npInput(deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE')}
                        placeholder="DELETE"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowDeleteModal(false)}
                        className="px-5 py-2.5 border-2 border-[#111111] text-[#111111] font-black text-xs uppercase tracking-widest hover:bg-[#E5E5E0] transition-all"
                        style={{ fontFamily: "'Inter', sans-serif" }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={actionLoading || deleteConfirmText !== 'DELETE'}
                        className="px-5 py-2.5 bg-[#CC0000] text-[#F9F9F7] border-2 border-[#CC0000] font-black text-xs uppercase tracking-widest hover:bg-[#990000] transition-all disabled:opacity-50"
                        style={{ fontFamily: "'Inter', sans-serif" }}>
                        {actionLoading ? 'DELETING…' : 'PERMANENTLY DELETE'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserProfile;